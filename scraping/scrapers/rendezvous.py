import sys
import requests
import re
from bs4 import BeautifulSoup
from .utils import *

def scrape_rendezvous():
    print("Scraping 'Rendezvous'...", file=sys.stderr)
    meal_list = []
    rende_url = "http://menu.dining.ucla.edu/Menus/Rendezvous"
    rende_page = requests.get(rende_url).text
    rende = BeautifulSoup(rende_page, PARSER)

    div = rende.find("h2", string="Build-Your-Own")
    div = div.parent.parent
    for i in div.find_all(class_="menu-item"):
        meal_list.append(build_menu_item(i,"RW",["lunch","dinner"],""))

    west = rende.find(string=re.compile("SLIDE: WEST")).parent
    east = rende.find(string=re.compile("SLIDE: EAST")).parent

    # West
    for (day, dateObject) in weekdays.items():
        div = west.find("h4", string=day+':').parent
        for i in div.find_all(class_="menu-item"):
            meal_list.append(build_menu_item(i,"RW",["lunch","dinner"],
                                             dateObject.strftime('%Y-%m-%d')))
    for i in west.find("h4", string="Saturday & Sunday:").parent.find_all(class_="menu-item"):
        meal_list.append(build_menu_item(i,"RW",["lunch","dinner"],
                                         saturday.strftime('%Y-%m-%d')))
        meal_list.append(build_menu_item(i,"RW",["lunch","dinner"],
                                         sunday.strftime('%Y-%m-%d')))

    # East
    for (day, dateObject) in weekdays.items():
        div = east.find("h4", string=day+':').parent
        for i in div.find_all(class_="menu-item"):
            meal_list.append(build_menu_item(i,"RE",["dinner"],
                                             dateObject.strftime('%Y-%m-%d')))
    for i in east.find("h4", string="Saturday & Sunday (All Day):").parent.find_all(class_="menu-item"):
        for (day, dateObject) in weekends.items():
            meal_list.append(build_menu_item(i,"RE",["lunch","dinner"],
                                             dateObject.strftime('%Y-%m-%d')))
    for i in east.find("h2", string="Weekday Lunch Specials").parent.find_all(class_="menu-item"):
        for (day, dateObject) in weekdays.items():
            meal_list.append(build_menu_item(i,"RE",["lunch"],
                                             dateObject.strftime("%Y-%m-%d")))
    return meal_list

