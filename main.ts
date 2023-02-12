import "./models";
import config from "./config";
import { defineRoutes } from "./routes";

import express from "express";
import mongoose from "mongoose";

const app = express();
main().catch(err => console.log(err));

defineRoutes(app);

async function main() {
  await mongoose.connect(config.MONGOURI);

  app.listen(config.PORT, () => {
    console.log(`FoodScoop listening on port ${config.PORT}`);
  });
}
