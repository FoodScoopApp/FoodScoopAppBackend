import moment from "moment";
import config from "./config";
import { convertDiningHall, dateFormat, getCurrentMealPeriodForDiningHall, mpFormat, timeFormat } from "./FoodScoopAppTypes/converters";
import { DiningHall as TypeDiningHall, DiningHallName, MealPeriod, User as TypeUser } from "./FoodScoopAppTypes/models";
import { DiningHall as SchemaDiningHall, Meal, User as SchemaUser } from "./models";
import { Expo } from 'expo-server-sdk';


const thresholds: { [Property in DiningHallName]: number } = {
	BP: 40,
	DN: 40,
	RE: 40,
	RW: 40,
	BC: 40,
	EC: 40,
	EA: 40,
	SH: 40,
	DR: 40,
}

export async function sendNotifications() {
	const users = await SchemaUser.find({});
	const dhs = await SchemaDiningHall.find({ date: moment().format(dateFormat) })
	const dhTypeMap: { [Property in DiningHallName]: TypeDiningHall | null } = {
		BP: null,
		DN: null,
		RE: null,
		RW: null,
		BC: null,
		EC: null,
		EA: null,
		SH: null,
		DR: null,
	}
	for (const dh of dhs) {
		dhTypeMap[dh.name] = dh
	}
	for (const user of users) {
		const tokens = user.notificationTokens
		if (tokens) {
			const notifications = await generateNotification(user, dhTypeMap)
			await send(notifications, user)
		}
	}
}

type NotificationObject = { body: string, title: string }

// INFO: This checking function is for activityLevel
// notifications only, consider better naming
function checkAlreadySent(dh: TypeDiningHall, user: TypeUser): boolean {
	if (!user.notificationsSent) return false
	const lastSentForDh = user.notificationsSent[dh.name]
	const time = moment(lastSentForDh, timeFormat)
	const mealPeriod = getCurrentMealPeriodForDiningHall(dh)
	if (mealPeriod) {
		const startTime = moment(mealPeriod.startTime, mpFormat)
		if (time.diff(startTime) > 0) {
			return true
		}
	}
	return false
}

function concatMealNames(names: string[]): string | null {
	switch (names.length) {
		case 0: return null
		case 1: return names[0]
		case 2: return `${names[0]} and ${names[1]}`
		default: return `${names[0]}, ${names[1]}, and more`
	}
}

async function generateMealNotifications(
	mealPeriod: MealPeriod,
	favMeals: string[],
	dhFullname: string): Promise<NotificationObject[]> {
	const mealIDs = mealPeriod.subcategories.flatMap((subcategory) => {
		return subcategory.meals
	})
	const mealNames: string[] = []
	for (const mealID of mealIDs) {
		if (favMeals.includes(mealID)) {
			const meal = await Meal.findOne({ id: mealID })
			if (!meal) continue
			mealNames.push(meal.name)
		}
	}
	const concatedNames = concatMealNames(mealNames)
	if (!concatedNames) return []
	return [{
		title: `${dhFullname} is now open, serving ${concatedNames}!`,
		body: ``
	}]
}

async function generateActivityNotification(
	dh: TypeDiningHall,
	user: TypeUser): Promise<NotificationObject[]> {
	let results: NotificationObject[] = []
	const favDiningHalls = user.favDiningHalls
	if (!dh.activityLevel) return []
	if (!favDiningHalls) return []
	if (checkAlreadySent(dh, user)) return []
	const mp = getCurrentMealPeriodForDiningHall(dh)
	if (!mp) return []
	const afterThirtyMin = moment(mp.startTime, mpFormat).add(30, "m")
	if (dh.activityLevel <= thresholds[dh.name]
		&& moment().diff(afterThirtyMin) > 0
		&& favDiningHalls.includes(dh.name)) {
		const dhFullname = convertDiningHall[dh.name]
		results.push({ title: `${dhFullname} activity is only ${dh.activityLevel}% now!`, body: `` })
		await updateUserRecord(user, dh.name)
	}
	return results
}

async function generateOpeningNotifications(
	mealPeriod: MealPeriod,
	user: TypeUser,
	dh: TypeDiningHall): Promise<NotificationObject[]> {
	const startTime = moment(mealPeriod.startTime, mpFormat)
	const dhFullname = convertDiningHall[dh.name]
	// INFO: consider finding a better way to determine if already sent
	// one possible way to avoid missing / duplicated notifications
	// is to call this larger intervals
	const diff = moment().diff(startTime, 's')
	if (diff > 0 && diff < 60) {
		// Notification for favorite meal
		const favMeals = user.favMeals
		if (favMeals) {
			const notifications = await generateMealNotifications(mealPeriod, favMeals, dhFullname)
			if (notifications.length !== 0) return notifications
		}

		// Favorite dininghall opening notification
		const favDiningHalls = user.favDiningHalls
		if (favDiningHalls) {
			if (favDiningHalls.includes(dh.name))
				return [{ title: `${dhFullname} is now open!`, body: `` }]
		}
	}
	return []
}

async function generateNotification(user: TypeUser,
	dhs: { [Property in DiningHallName]: TypeDiningHall | null }): Promise<NotificationObject[]> {
	const diningHallToNotificationsMap = async (dhName: DiningHallName) => {
		const dh = dhs[dhName]
		if (!dh) return []
		const mealPeriod = getCurrentMealPeriodForDiningHall(dh)
		if (mealPeriod) {
			const opening = await generateOpeningNotifications(
				mealPeriod, user, dh)
			const activity = await generateActivityNotification(dh, user)
			return opening.concat(activity)
		}
		return []
	}
	const dhNames = Object.keys(convertDiningHall) as DiningHallName[]
	const unflattened = await Promise.all(dhNames.map(diningHallToNotificationsMap))
	return unflattened.flat()
}

async function updateUserRecord(user: TypeUser, dhName: DiningHallName) {
	const schemaUser = await SchemaUser.findOne({ email: user.email })
	if (!schemaUser) return
	let record = user.notificationsSent
	record = record ? record : {
		BP: null,
		DN: null,
		RE: null,
		RW: null,
		BC: null,
		EC: null,
		EA: null,
		SH: null,
		DR: null,
	}
	const time = moment().format(timeFormat)
	record[dhName] = time
	schemaUser.notificationsSent = record
	await schemaUser.save()
}

type ExpoNotification = { to: string, sound: 'default', body: string, data: Object }

async function send(content: NotificationObject[], user: TypeUser) {
	const expo = new Expo({ accessToken: config.EXPO_ACCESS_TOKEN })
	let objects: ExpoNotification[] = []
	for (const tokenContainer of user.notificationTokens!) {
		if (!Expo.isExpoPushToken(tokenContainer.token)) continue
		objects.push(...content.map((item) => {
			return {
				to: tokenContainer.token,
				sound: 'default',
				body: item.title,
				data: {},
			} as ExpoNotification
		}))
	}
	const chunks = expo.chunkPushNotifications(objects)
	const tickets = []
	for (const chunk of chunks) {
		try {
			let ticketChunk = await expo.sendPushNotificationsAsync(chunk)
			tickets.push(...ticketChunk)
		} catch (error) {
			console.error(error)
		}
	}
	return
}
