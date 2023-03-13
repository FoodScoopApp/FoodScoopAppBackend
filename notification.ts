import moment from "moment";
import config from "./config";
import { convertDiningHall, dateFormat, getCurrentMealPeriodForDiningHall, timeFormat } from "./FoodScoopAppTypes/converters";
import { DiningHall as TypeDiningHall, DiningHallName, MealPeriod, User as TypeUser } from "./FoodScoopAppTypes/models";
import { DiningHall as SchemaDiningHall, User as SchemaUser } from "./models";
import { Expo } from 'expo-server-sdk';


const thresholds: { [Property in DiningHallName]: number } = {
	BP: 50,
	DN: 50,
	RE: 50,
	RW: 50,
	BC: 50,
	EC: 60,
	EA: 60,
	SH: 50,
	DR: 50,
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
	const result: { [Property in DiningHallName]: number | null } = {
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
		if (dh.activityLevel) {
			result[dh.name] = dh.activityLevel
		}
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
		const startTime = moment(mealPeriod.startTime, timeFormat)
		if (time.diff(startTime) > 0) {
			return true
		}
	}
	return false
}

async function generateMealNotifications(
	mealPeriod: MealPeriod,
	favMeals: string[],
	dhFullname: string): Promise<NotificationObject[]> {
	let results: NotificationObject[] = []
	const meals = mealPeriod.subcategories.flatMap((subcategory) => {
		return subcategory.meals
	})
	// INFO: consider merging into one notification
	// factors to consider: too many meals
	// that cannot be shown in the title / body
	for (const meal of meals) {
		if (favMeals.includes(meal)) {
			results.push({
				title: `${dhFullname} is now serving ${meal} !`,
				body: ``
			})
		}
	}
	return results
}

async function generateActivityNotification(dh: TypeDiningHall, user: TypeUser): Promise<NotificationObject[]> {
	let results: NotificationObject[] = []
	if (!dh.activityLevel) return []
	if (checkAlreadySent(dh, user)) return []
	if (dh.activityLevel <= thresholds[dh.name]) {
		const dhFullname = convertDiningHall[dh.name]
		results.push({ title: `${dhFullname} activity is low now!`, body: `` })
		await updateUserRecord(user, dh.name)
	}
	return results
}

async function generateOpeningNotifications(mealPeriod: MealPeriod, user: TypeUser, dhFullname: string): Promise<NotificationObject[]> {
	let results: NotificationObject[] = []
	const startTime = moment(mealPeriod.startTime, timeFormat)
	// INFO: consider finding a better way to determine if already sent
	// one possible way to avoid missing / duplicated notifications
	// is to call this larger intervals
	if (Math.abs(moment().diff(startTime, 's')) < 60) {
		// Opening notification
		results.push({ title: `${dhFullname} is now open!`, body: `` })

		// Notification for favorite meal
		const favMeals = user.favMeals
		if (favMeals) {
			results = await generateMealNotifications(mealPeriod, favMeals, dhFullname)
		}
	}
	return results
}

async function generateNotification(user: TypeUser,
	dhs: { [Property in DiningHallName]: TypeDiningHall | null }): Promise<NotificationObject[]> {
	if (!user.favDiningHalls) return []
	const diningHallToNotificationsMap = async (dhName: DiningHallName) => {
		const dh = dhs[dhName]
		const empty: NotificationObject[] = []
		if (!dh) return empty
		const mealPeriod = getCurrentMealPeriodForDiningHall(dh)
		const dhFullname = convertDiningHall[dh.name]
		if (mealPeriod) {
			const opening = await generateOpeningNotifications(
				mealPeriod, user, dhFullname)
			const activity = await generateActivityNotification(dh, user)
			return opening.concat(activity)
		}
		return empty
	}
	const unflattened = await Promise.all(user.favDiningHalls
		.map(diningHallToNotificationsMap))
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
	record[dhName] = moment().to(timeFormat)
	schemaUser.notificationsSent = record
	await schemaUser.save()
}

type ExpoNotification = { to: string, sound: 'default', body: string, data: Object }

async function send(content: NotificationObject[], user: TypeUser) {
	const expo = new Expo({ accessToken: config.EXPO_ACCESS_TOKEN })
	let objects: ExpoNotification[] = []
	for (const token of user.tokens!) {
		if (!Expo.isExpoPushToken(token)) continue
		objects = objects.concat(content.map((item) => {
			return {
				to: token,
				sound: 'default',
				body: item.title,
				data: {},
			}
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
