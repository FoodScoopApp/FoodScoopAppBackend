import sys
import requests
from bs4 import BeautifulSoup
from .utils import *
import json

DINING_HALLS = {
    "Bruin Plate" : "BP",
    "De Neve" : "DN",
    "Rendezvous East" : "RE",
    "Rendezvous West" : "RW",
    "Bruin Café" : "BC",
    "Epicuria" : "EC",
    "Epic at Ackerman" : "EA",
    "The Study at Hedrick" : "SH",
    "The Drey" : "DR"
}

def scrape_hours():
    print("Getting hours of operation...", file=sys.stderr)
    hours_url = "http://menu.dining.ucla.edu/Hours"
    hours_page = requests.get(hours_url).text
    hours = BeautifulSoup(hours_page, PARSER)

    hoursData = {}
    for i in hours.find_all("td", class_="hours-head"):
        dining_hall = i.find("span").string
        if dining_hall not in DINING_HALLS: continue
        dining_hall = DINING_HALLS[dining_hall]
        hoursData[dining_hall] = {}
        cur = i
        for td,period in zip(i.parent.find_all("td")[1:], ["breakfast", "lunch", "dinner", "extended"]):
            if td['class'][0] == 'hours-closed':
                hoursData[dining_hall][period] = "closed"
            elif td['class'][0] == 'hours-open':
                hoursData[dining_hall][period] = td.find("span", class_="hours-range").string
    return hoursData
