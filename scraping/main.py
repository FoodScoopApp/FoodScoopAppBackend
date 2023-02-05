import requests
import re
import json
from datetime import datetime
from bs4 import BeautifulSoup

PARSER = "html.parser"
RESIDENTIAL_RESTAURANTS = ["Bruin Plate", "De Neve", "Epicuria"]
FOOD_RESTRICTIONS = """V VG APNT ATNT AWHT AGTN ASOY ASES AMLK AEGG ACSF AFSH
                       HAL LC HC""".split()

def build_menu_item(menu_item, dining_hall, meal_period, date):
    name = menu_item.find("a",class_="recipelink").text

    restrictions = {i:False for i in FOOD_RESTRICTIONS}
    for i in menu_item.select('[class*="webcode-"]'):#class_="webcode-16px"):
        restrictions[i["alt"]] = True

    price = menu_item.find(class_="menu-item-price")
    if price != None: price = float(price.text[1:])

    description = menu_item.find(class_="menu-item-description")
    if description != None: description = description.text.strip()

    return {"name": name, "diningHall": dining_hall, "meal_period": meal_period,
            "date": date, "restrictions": restrictions, "price": price,
            "description": description}

def scrape_residential(date):
    print("Scraping residential restaurants...")
    meal_list = []
    breakfast_url = "http://menu.dining.ucla.edu/Menus/"+date+"/Breakfast"
    lunch_url = "https://menu.dining.ucla.edu/Menus/"+date+"/Lunch"
    dinner_url = "https://menu.dining.ucla.edu/Menus/"+date+"/Dinner"
    breakfast_page = requests.get(breakfast_url).text
    lunch_page = requests.get(lunch_url).text
    dinner_page = requests.get(dinner_url).text
    breakfast = BeautifulSoup(breakfast_page, PARSER)
    lunch = BeautifulSoup(lunch_page, PARSER)
    dinner = BeautifulSoup(dinner_page, PARSER)

    for meal_period in ["breakfast", "lunch", "dinner"]:
        for restaurant in RESIDENTIAL_RESTAURANTS:
            div = eval(meal_period).find(string=restaurant)
            if div is None: continue
            div = div.parent.parent
            for i in div.find_all(class_="menu-item"):
                meal_list.append(build_menu_item(i,restaurant,meal_period,date))

    return meal_list

def scrape_study():
    print("Scraping 'The Study'...")
    meal_list = []
    study_url = "http://menu.dining.ucla.edu/Menus/HedrickStudy"
    study_page = requests.get(study_url).text
    study = BeautifulSoup(study_page, PARSER)

    categories = ["Café Bakery", "Breakfast", "Lunch & Dinner", "Beverages", "Market"]
    meal_periods = zip(categories,[["breakfast","lunch","dinner"],["breakfast"],
                                   ["lunch","dinner"],["breakfast","lunch","dinner"],
                                   ["breakfast","lunch","dinner"]])
    for (category,meal_period) in meal_periods:
        div = study.find("h1", string=category)
        div = div.parent.parent
        for i in div.find_all(class_="menu-item"):
            meal_list.append(build_menu_item(i,"The Study",meal_period,""))

    return meal_list

data = [] 
data.extend(scrape_residential(datetime.today().strftime('%Y-%m-%d')))
data.extend(scrape_study())
file = open("sample.json", "w")
json.dump(data, file, indent=4)
file.close()
print("Done")
