import requests
from bs4 import BeautifulSoup
from .utils import *

def scrape_epic_ackerman():
    print("Scraping 'Epic at Ackerman'...")
    meal_list = []
    epic_url = "http://menu.dining.ucla.edu/Menus/EpicAtAckerman"
    epic_page = requests.get(epic_url).text
    epic = BeautifulSoup(epic_page, PARSER)

    for i in epic.find_all(class_="menu-item"):
        meal_list.append(build_menu_item(i,"Epic at Ackerman",["lunch","dinner"],""))

    return meal_list
