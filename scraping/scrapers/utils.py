import requests
from bs4 import BeautifulSoup
from datetime import date, timedelta

PARSER = "html.parser"
RESIDENTIAL_RESTAURANTS = ["Bruin Plate", "De Neve", "Epicuria"]
FOOD_RESTRICTIONS = """V VG APNT ATNT AWHT AGTN ASOY ASES AMLK AEGG ACSF AFSH
                       HAL LC HC""".split()

monday = date.today()
if monday.weekday()<5:
    monday -= timedelta(monday.weekday())
else:
    monday += timedelta(7-monday.weekday())
tuesday = monday+timedelta(1)
wednesday = monday+timedelta(2)
thursday = monday+timedelta(3)
friday = monday+timedelta(4)
saturday = monday+timedelta(5)
sunday = monday+timedelta(6)
weekdays = dict(zip(["Monday","Tuesday","Wednesday","Thursday","Friday"],
                    [monday,tuesday,wednesday,thursday,friday]))
weekends = dict(zip(["Saturday","Sunday"],[saturday,sunday]))

def build_menu_item(menu_item, dining_hall = "", meal_period = [], date = "", subcategory = None):
    name = menu_item.find("a",class_="recipelink").text

    restrictions = {i:False for i in FOOD_RESTRICTIONS}
    for i in menu_item.select('[class*="webcode-"]'):#class_="webcode-16px"):
        restrictions[i["alt"]] = True

    price = menu_item.find(class_="menu-item-price")
    if price != None: price = float(price.text[1:])

    description = menu_item.find(class_="menu-item-description")
    if description != None: description = description.text.strip()

    recipe_url = menu_item.find("a", class_="recipelink")['href']

    recipe_page = requests.get(str(recipe_url)).text
    [meal_id, serving_size] = str(recipe_url).split('/')[-2:]
    soup = BeautifulSoup(recipe_page, PARSER)

    ingredients = soup.find("strong", string="INGREDIENTS:")
    calories = None
    sodium = None
    protein = None
    if ingredients != None and soup.find(class_="nf-blur") == None:
        #ingredients = str(ingredients.next_sibling)[1:].split(', ')
        ingredients = str(ingredients.next_sibling)[1:]
        calories = float(soup.find("span", class_="nfcaltxt").next_sibling)
        sodium = soup.find("span", class_="nfmajornutrient", string="Sodium")
        sodium = float(str(sodium.next_sibling)[:-3])
        protein = soup.find("span", class_="nfmajornutrient", string="Protein")
        protein = float(str(protein.next_sibling)[:-2])
    else: ingredients = None

    return {
                "name": name,
                "mealID": meal_id,
                "servingSize": serving_size,
                "diningHall": dining_hall,
                "subcategory": subcategory,
                "mealPeriod": meal_period,
                "date": date,
                "restrictions": restrictions,
                "price": price,
                "description": description,
                "ingredients": ingredients,
                "calories": calories,
                "sodium": sodium,
                "protein": protein
            }

