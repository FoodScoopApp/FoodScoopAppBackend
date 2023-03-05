import sys
import requests
from bs4 import BeautifulSoup
from .utils import *

def scrape_drey():
    print("Scraping 'The Drey'...", file=sys.stderr)
    meal_list = []
    drey_url = "http://menu.dining.ucla.edu/Menus/Drey"
    drey_page = requests.get(drey_url).text
    drey = BeautifulSoup(drey_page, PARSER)

    for i in drey.find_all(class_="menu-item"):
        meal_list.append(build_menu_item(i,"The Drey",["lunch","dinner"],""))

    return meal_list
