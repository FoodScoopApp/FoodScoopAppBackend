import sys
import requests
import re
from bs4 import BeautifulSoup
from .utils import *


def scrape_cafe1919():
    print("Scraping 'Café 1919'...", file=sys.stderr)
    meal_list = []
    cafe1919_url = "http://menu.dining.ucla.edu/Menus/Cafe1919"
    cafe1919_page = requests.get(cafe1919_url).text
    cafe1919 = BeautifulSoup(cafe1919_page, PARSER)

    main_menu = cafe1919.find(class_="menu-block-fullwidth")

    for (day, dateObject) in weekdaysmf.items():
        for i in main_menu.findChildren(class_="menu-item", recursive=False):
            meal_list.append(build_menu_item(i, "CN", ["dinner"], dateObject.strftime('%Y-%m-%d')))
        div = main_menu.find("h4", string=day+':').parent
        for i in div.find_all(class_="menu-item"):
            meal_list.append(build_menu_item(i, "CN", ["dinner"],
                                             dateObject.strftime('%Y-%m-%d')))

    # div = rende.find("h2", string="Build-Your-Own")
    # div = div.parent.parent
    # for i in div.find_all(class_="menu-item"):
    #     meal_list.append(build_menu_item(i,"RW",["lunch","dinner"],""))

    # west = rende.find(string=re.compile("SLIDE: WEST")).parent
    # east = rende.find(string=re.compile("SLIDE: EAST")).parent

    # # West
    # for (day, dateObject) in weekdays.items():
    #     div = west.find("h4", string=day+':').parent
    #     for i in div.find_all(class_="menu-item"):
    #         meal_list.append(build_menu_item(i,"RW",["lunch","dinner"],
    #                                          dateObject.strftime('%Y-%m-%d')))
    # for i in west.find("h4", string="Saturday & Sunday:").parent.find_all(class_="menu-item"):
    #     meal_list.append(build_menu_item(i,"RW",["lunch","dinner"],
    #                                      saturday.strftime('%Y-%m-%d')))
    #     meal_list.append(build_menu_item(i,"RW",["lunch","dinner"],
    #                                      sunday.strftime('%Y-%m-%d')))

    # # East
    # for (day, dateObject) in weekdays.items():
    #     div = east.find("h4", string=day+':').parent
    #     for i in div.find_all(class_="menu-item"):
    #         meal_list.append(build_menu_item(i,"RE",["dinner"],
    #                                          dateObject.strftime('%Y-%m-%d')))
    # for i in east.find("h4", string="Saturday (All Day):").parent.find_all(class_="menu-item"):
    #     meal_list.append(build_menu_item(i,"RE",["lunch","dinner"],
    #                                         saturday.strftime('%Y-%m-%d')))
    # for i in east.find("h4", string="Sunday (All Day):").parent.find_all(class_="menu-item"):
    #     meal_list.append(build_menu_item(i,"RE",["lunch","dinner"],
    #                                         sunday.strftime('%Y-%m-%d')))
    # for i in east.find("h2", string="Weekday Lunch Specials").parent.find_all(class_="menu-item"):
    #     for (day, dateObject) in weekdays.items():
    #         meal_list.append(build_menu_item(i,"RE",["lunch"],
    #                                          dateObject.strftime("%Y-%m-%d")))
    return meal_list
