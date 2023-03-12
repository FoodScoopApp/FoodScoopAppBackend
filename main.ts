import config from "./config";
import cors from "cors";
import express, { Express } from "express";
import mongoose from "mongoose";
import { getActivityLevels } from "./activity-scraping";
import { runScraper } from "./scraper";

export declare let app: Express;
app = express();
app.use(cors());
app.use(express.json());
main().catch((err) => console.log(err));

async function main() {
	mongoose.set("strictQuery", true);
	await mongoose.connect(config.MONGOURI!);
	await import("./models");
	await import("./routes");

	setInterval(async () => {
		await getActivityLevels()
	}, 1000 * 60)

	setInterval(async () => {
		await runScraper()
	}, 1000 * 60 * 60)

	app.listen(config.PORT, () => {
		console.log(`FoodScoop listening on port ${config.PORT}`);
	});
}
