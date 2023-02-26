import requests
from bs4 import BeautifulSoup
from .utils import *

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

