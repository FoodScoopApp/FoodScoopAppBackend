import sys
import requests
from bs4 import BeautifulSoup
from .utils import *

def scrape_residential(date):
    print("Scraping residential restaurants...", file=sys.stderr)
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
                subcategory = i.parent.previous_sibling.strip()
                meal_list.append(build_menu_item(i,restaurant,meal_period,date,subcategory))

    return meal_list

