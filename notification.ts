import moment from "moment";
import config from "./config";
import { convertDiningHall, dateFormat, getCurrentMealPeriodForDiningHall, timeFormat } from "./FoodScoopAppTypes/converters";
import { DiningHall as TypeDiningHall, DiningHallName, User as TypeUser } from "./FoodScoopAppTypes/models";
import { DiningHall as SchemeDiningHall, User as SchemeUser } from "./models";
import { Expo } from 'expo-server-sdk';


const thresholds: { [Property in DiningHallName]: number } = {
	BP: 50,
	DN: 50,
	RE: 50,
	RW: 50,
	BC: 50,
	EC: 50,
	EA: 50,
	SH: 50,
	DR: 50,
}

export async function sendNotifications() {
	const users = await SchemeUser.find({});
	const dhs = await SchemeDiningHall.find({ date: moment().format(dateFormat) })
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

async function generateNotification(user: TypeUser, dhs: { [Property in DiningHallName]: TypeDiningHall | null }): Promise<NotificationObject[]> {
	let results: NotificationObject[] = []
	// TODO: notification for opening
	if (!user.favDiningHalls) return results
	for (const dhName of user.favDiningHalls) {
		const dh = dhs[dhName]
		if (!dh) continue
		if (user.notificationsSent) {
			const lastSentForDh = user.notificationsSent[dh.name]
			const time = moment(lastSentForDh, timeFormat)
			const mealPeriod = getCurrentMealPeriodForDiningHall(dh)
			if (mealPeriod) {
				const startTime = moment(mealPeriod.startTime, timeFormat)
				if (time.diff(startTime) > 0) {
					continue
				}
			}
		}
		const mealPeriod = getCurrentMealPeriodForDiningHall(dh)
		const dhFullname = convertDiningHall[dh.name]
		if (mealPeriod) {
			const startTime = moment(mealPeriod.startTime, timeFormat)
			if (Math.abs(moment().diff(startTime, 's')) < 60)
				results.push({ title: `${dhFullname} is now open!`, body: `` })
		}
		if (!dh.activityLevel) continue
		if (dh.activityLevel <= thresholds[dh.name]) {
			results.push({ title: `${dhFullname} activity is low now!`, body: `` })
			await updateUserRecord(user, dhName)
		}
	}
	return results
}

async function updateUserRecord(user: TypeUser, dhName: DiningHallName) {
	const schemaUser = await SchemeUser.findOne({ email: user.email })
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
