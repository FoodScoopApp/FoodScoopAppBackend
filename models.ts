import models from "./FoodScoopAppTypes/models";
import mongoose, { Schema, model } from "mongoose";

mongoose.set('strictQuery', false);

const userSchema = new Schema({} as models.User);
export const User = model("User", userSchema);
userSchema.index({email: 1, id: 1}, {unique: true})
