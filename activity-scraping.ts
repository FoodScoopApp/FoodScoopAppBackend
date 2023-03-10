import axios from "axios";
import { DiningHallName } from "./FoodScoopAppTypes/models";
import * as cheerio from 'cheerio';
import { DiningHall } from "./models";
import moment from "moment";
import { dateFormat } from "./FoodScoopAppTypes/converters";

export async function getActivityLevels() {
	const levels: { [Property in DiningHallName]: number | null } = {
		BP: await scrapeBP(),
		DN: await scrapeDN(),
		RE: await scrapeR(),
		RW: await scrapeR(),
		BC: await scrapeBC(),
		EC: await scrapeEC(),
		EA: await scrapeEA(),
		SH: await scrapeSH(),
		DR: await scrapeDR(),
	}
	for (const [key, value] of Object.entries(levels)) {
		console.log(`${key}: ${value}`);
		let dh = await DiningHall.findOne({
			name: key,
			date: moment().format(dateFormat),
		});
		if (dh) {
			dh.set({ activityLevel: value })
			dh.save()
		}
	}
}

async function scrape(urlSuffix: string): Promise<number | null> {
	const response = await axios.get(`https://menu.dining.ucla.edu/Menus/${urlSuffix}`)
	const $ = cheerio.load(response.data)
	const text = $('.activity-level-wrapper span').attr('class')
	if (text) {
		const regex = /activity-level-([\d]{3})/
		const percentage = regex.exec(text)?.[1]
		if (percentage) {
			return Number(percentage)
		}
	}
	return null
}

async function scrapeBP(): Promise<number | null> {
	return await scrape('BruinPlate')
}

async function scrapeDN(): Promise<number | null> {
	return await scrape('DeNeve')
}

async function scrapeEC(): Promise<number | null> {
	return await scrape('Epicuria')
}

async function scrapeR(): Promise<number | null> {
	return await scrape('Rendezvous')
}

async function scrapeSH(): Promise<number | null> {
	return await scrape('HedrickStudy')
}

async function scrapeBC(): Promise<number | null> {
	return await scrape('BruinCafe')
}

async function scrapeEA(): Promise<number | null> {
	return await scrape('EpicAtAckerman')
}

async function scrapeDR(): Promise<number | null> {
	return await scrape('Drey')
}
