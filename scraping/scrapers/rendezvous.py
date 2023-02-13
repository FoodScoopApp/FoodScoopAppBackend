import requests
import re
from datetime import date, timedelta
from bs4 import BeautifulSoup
from .utils import *

def scrape_rendezvous():
    print("Scraping 'Rendezvous'...")
    meal_list = []
    rende_url = "http://menu.dining.ucla.edu/Menus/Rendezvous"
    rende_page = requests.get(rende_url).text
    rende = BeautifulSoup(rende_page, PARSER)

    div = rende.find("h2", string="Build-Your-Own")
    div = div.parent.parent
    for i in div.find_all(class_="menu-item"):
        meal_list.append(build_menu_item(i,"Rendezvous West",["lunch","dinner"],""))

    monday = date.today()
    if monday.weekday()<5:
        monday -= timedelta(monday.weekday())
    else:
        monday += timedelta(7-monday.weekday())
    tuesday = monday+timedelta(1)
    wednesday = monday+timedelta(2)
    thursday = monday+timedelta(3)
    friday = monday+timedelta(4)
    days = zip(["Monday","Tuesday","Wednesday","Thursday","Friday"],
               [monday,tuesday,wednesday,thursday,friday])

    west = rende.find(string=re.compile("SLIDE: WEST")).parent
    east = rende.find(string=re.compile("SLIDE: EAST")).parent

    for (day, dateObject) in days:
        div = west.find("h4", string=day+':').parent
        for i in div.find_all(class_="menu-item"):
            meal_list.append(build_menu_item(i,"Rendezvous West",["lunch","dinner"],
                                             dateObject.strftime('%Y-%m-%d')))

    saturday = monday+timedelta(5)
    sunday = monday+timedelta(6)
    for i in west.find("h4", string="Saturday & Sunday:").parent.find_all(class_="menu-item"):
        meal_list.append(build_menu_item(i,"Rendezvous West",["lunch","dinner"],
                                         saturday.strftime('%Y-%m-%d')))
        meal_list.append(build_menu_item(i,"Rendezvous West",["lunch","dinner"],
                                         sunday.strftime('%Y-%m-%d')))

    return meal_list

