import models from "./FoodScoopAppTypes/models";
import { Schema, model } from "mongoose";

// Create schema for users
const userSchema = new Schema<models.User>({
    email: { type: String, required: true },
    name: { type: String, required: true },
    pfp: String,
    hash: { type: String, required: true },
    tokens: [String],
    notificationTokens: [
        {
            device: String,
            token: String,
        },
    ],
    favMeals: [String],
    favDiningHalls: [String],
    dietaryRestrictions: [String],
    mealPlan: String,
    caloricIntakePerDay: Number,
    notificationsSent: Object,
});
export const User = model("User", userSchema);

// With email and id being unique indexes
userSchema.index({ email: 1 }, { unique: true });

// Create schema for meals
const mealSchema = new Schema<models.Meal>({
    name: { type: String, required: true },
    diningHall: { type: String, required: true },
    dietaryRestrictions: { type: [String], required: true },
    price: Number,
    description: String,
    ingredients: String,
    nutritionalInfo: { type: Object, required: true },
    subcategory: String,
    id: { type: String, required: true },
});
export const Meal = model("Meal", mealSchema);
// With its id being a unique index
mealSchema.index({ id: 1 }, { unique: true });

// Create schema for dining halls
const diningHallSchema = new Schema<models.DiningHall>({
    name: { type: String, required: true },
    date: { type: String, required: true },
    mealPeriods: { type: [Object], required: true },
    finished: { type: Boolean, required: true },
    activityLevel: Number
});
export const DiningHall = model("DiningHall", diningHallSchema);
diningHallSchema.index({ name: 1, date: 1 }, { unique: true });

// Create schema for comprehensive meal plans
const comprehensiveMealPlanSchema = new Schema<models.ComprehensiveMealPlan>({
    user: { type: String, required: true },
    startDate: { type: String, required: true },
    meals: { type: Object, required: true },
});
export const ComprehensiveMealPlan = model(
    "ComprehensiveMealPlan",
    comprehensiveMealPlanSchema
);
