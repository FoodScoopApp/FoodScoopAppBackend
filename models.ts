import models from "./FoodScoopAppTypes/models";
import { Schema, model } from "mongoose";

const userSchema = new Schema({} as models.User);
export const User = model("User", userSchema);
userSchema.path("my.email").index({unique: true})
