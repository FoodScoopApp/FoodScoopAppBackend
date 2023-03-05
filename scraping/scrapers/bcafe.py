import sys
import requests
from bs4 import BeautifulSoup
from .utils import *

def scrape_bcafe():
    print("Scraping 'Bruin Café'...", file=sys.stderr)
    meal_list = []
    bcafe_url = "http://menu.dining.ucla.edu/Menus/BruinCafe"
    bcafe_page = requests.get(bcafe_url).text
    bcafe = BeautifulSoup(bcafe_page, PARSER)

    for (day, dateObject) in weekdays.items():
        div = bcafe.find("h4", string=day+':').parent;
        for i in div.find_all(class_="menu-item"):
            meal_list.append(build_menu_item(i,"Bruin Café",["lunch"],
                                             dateObject.strftime('%Y-%m-%d')))

    # TODO: fix entree soups special case
    menu_blocks = bcafe.find_all("div", class_="menu-block")[2:]
    for menu_block in menu_blocks:
        for i in menu_block.find_all(class_="menu-item"):
            meal_list.append(build_menu_item(i,"Bruin Café",["lunch","dinner"],""))
        menu_block = menu_block.next_sibling

    return meal_list
