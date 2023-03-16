import { exec } from "child_process";
import moment from "moment";
import { convertScrapingMealPeriod } from "./FoodScoopAppTypes/converters";
import { MealPeriod, Subcategory } from "./FoodScoopAppTypes/models";

import { DiningHall, Meal } from "./models";

// Temporary solution, need to actually scrape from website later
const mealPeriodStartEndTime: { [name: string]: MealPeriod } = {
    breakfast: {
        name: "B",
        startTime: "7:00",
        endTime: "10:00",
        subcategories: [],
    },
    lunch: {
        name: "L",
        startTime: "11:00",
        endTime: "15:00",
        subcategories: [],
    },
    dinner: {
        name: "D",
        startTime: "17:00",
        endTime: "21:00",
        subcategories: [],
    },
    extended: {
        name: "E",
        startTime: "22:00",
        endTime: "23:59",
        subcategories: [],
    },
};

const runPython = () => {
    return new Promise<string>((res, rej) => {
        exec(
            "python scraping/main.py",
            { encoding: "utf-8" },
            (err, stdout, stderr) => {
                if (err) {
                    rej({ err, stderr });
                } else {
                    res(stdout);
                }
            }
        );
    });
};

// Run scraper from Python script
export const runScraper = async () => {
    console.log("Running scraper...");
    try {
        // Attempt to read from Python script's stdout
        console.log("Python script running...");
        const stdout = await runPython();

        // JSON parse it
        const data = JSON.parse(stdout);

        // References to Mongoose DiningHalls objs to mark as finished
        // meaning that no more meals should be added (prevent
        // duplicates since it's parsed every hour)
        const diningHalls = [];

        // For each meal
        for (const meal of data["meals"]) {
            try {
                console.log("Parsing meal " + meal.mealID);
                // If there is no meal ID in the database, create one
                if (!(await Meal.findOne({ id: meal.mealID }))) {
                    console.log("   Creating meal " + meal.mealID);
                    await Meal.create({
                        id: meal.mealID,
                        name: meal.name,
                        diningHall: meal.diningHall,
                        dietaryRestrictions: meal.restrictions,
                        price: meal.price,
                        ingredients: meal.ingredients,
                        nutritionalInfo: {
                            calories: meal.calories,
                            sodium: meal.sodium,
                            protein: meal.protein,
                        },
                        description: meal.description,
                        subcategory: meal.subcategory,
                    });
                } else {
                    console.log(
                        "Already added meal " + meal.mealID + " to database"
                    );
                }

                // Parse meal to make sure of empty fields
                if (!meal.date) {
                    meal.date = moment(new Date()).format("YYYY-MM-DD");
                }
                if (!meal.subcategory) {
                    meal.subcategory = meal.diningHall;
                }
                if (Array.isArray(meal.mealPeriod)) {
                    if (meal.mealPeriod.length > 1) {
                        for (let i = 1; i < meal.mealPeriod.length; i++) {
                            const newmeal = structuredClone(meal);
                            newmeal.mealPeriod = meal.mealPeriod[i];
                            data.push(newmeal);
                        }
                    }
                    meal.mealPeriod = meal.mealPeriod[0];
                }

                // Find a Dining Hall object in the database that is of the same
                // name and date
                let diningHall;
                const idx = diningHalls.findIndex(
                    (d) => d.name === meal.diningHall && d.date === meal.date
                );
                if (idx != -1) {
                    diningHall = diningHalls[idx];
                }

                // If there is no dining hall, create one
                if (!diningHall) {
                    const tempdh = await DiningHall.findOne({
                        name: meal.diningHall,
                        date: meal.date,
                    });
                    if (tempdh) {
                        console.log(
                            "   Already parsed dining hall " +
                                meal.diningHall +
                                " for date " +
                                meal.date
                        );
                        continue;
                    }

                    console.log(
                        "   Creating dining hall " +
                            meal.diningHall +
                            " for date " +
                            meal.date
                    );

                    console.log(
                        "       Creating meal period " + meal.mealPeriod
                    );
                    // Get the meal period temporary template, copied
                    const mp = structuredClone(
                        mealPeriodStartEndTime[meal.mealPeriod]
                    );

                    console.log(
                        "           Creating subcategory " + meal.subcategory
                    );
                    console.log("               Adding meal " + meal.mealID);
                    // Add the meal's subcategory, and only meal as this one
                    mp.subcategories.push({
                        name: meal.subcategory,
                        meals: [meal.mealID],
                    });

                    // Create the dining hall with the meal period, only
                    // subcategory, and meal
                    const dh = {
                        name: meal.diningHall,
                        date: meal.date,
                        mealPeriods: [mp],
                        finished: false,
                    };

                    // Add reference to this dining hall to mark as completed on finish
                    diningHalls.push(dh);

                    // Found a dining hall in the database
                } else {
                    console.log(
                        "   Found dining hall " +
                            meal.diningHall +
                            " for date " +
                            meal.date
                    );
                    // Already completed for today, don't need to add duplicates
                    if (diningHall.finished) {
                        console.log(
                            "   Already completed dining hall " +
                                meal.diningHall +
                                " for date " +
                                meal.date
                        );
                        continue;
                    }

                    // Attempt to find the meal period for this meal
                    let mp = diningHall.mealPeriods.findIndex(
                        (m: MealPeriod) =>
                            m.name ===
                            convertScrapingMealPeriod[meal.mealPeriod]
                    );

                    // If the meal period was found
                    if (mp != -1) {
                        console.log(
                            "       Found meal period " + meal.mealPeriod
                        );
                        // Find the subcategory for this meal
                        let subcat = diningHall.mealPeriods[
                            mp
                        ].subcategories.findIndex(
                            (s: Subcategory) => s.name === meal.subcategory
                        );

                        // If the subcategory was found, add this meal ID to it
                        if (subcat != -1) {
                            console.log(
                                "           Found subcategory " +
                                    meal.subcategory
                            );
                            console.log(
                                "               Adding meal " + meal.mealID
                            );
                            diningHall.mealPeriods[mp].subcategories[
                                subcat
                            ].meals.push(meal.mealID);

                            // Was not found, create a new subcategory with this meal
                        } else {
                            console.log(
                                "           Creating subcategory " +
                                    meal.subcategory
                            );
                            console.log(
                                "               Adding meal " + meal.mealID
                            );
                            diningHall.mealPeriods[mp].subcategories.push({
                                name: meal.subcategory,
                                meals: [meal.mealID],
                            });
                        }

                        // Meal period was not found
                    } else {
                        // Generate meal period from template, copied
                        console.log(
                            "       Creating meal period " + meal.mealPeriod
                        );
                        const mpl = structuredClone(
                            mealPeriodStartEndTime[meal.mealPeriod]
                        );

                        console.log(
                            "           Creating subcategory " +
                                meal.subcategory
                        );
                        console.log(
                            "               Adding meal " + meal.mealID
                        );
                        // Add subcategory
                        mpl.subcategories.push({
                            name: meal.subcategory,
                            meals: [meal.mealID],
                        });

                        // Add it to the dining hall
                        diningHall.mealPeriods.push(mpl);
                    }

                    console.log(
                        "   Saving dining hall " +
                            meal.diningHall +
                            " for date " +
                            meal.date
                    );
                }
            } catch (err) {
                console.error(err);
            }
        }

        // For every dining hall, mark as finished and commit to database
        for (const dh of diningHalls) {
            dh.finished = true;
            await DiningHall.create(dh);
            console.log(
                "Marked dining hall " +
                    dh.name +
                    " for date " +
                    dh.date +
                    " as finished"
            );
        }

        // Some sort of error pertaining to Python script,
        // JSON parsing, or database retrieval, saving
    } catch (err) {
        console.error(err);
    }
};
