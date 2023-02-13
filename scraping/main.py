import requests
import re
import json
from datetime import datetime
from bs4 import BeautifulSoup

from scrapers.residential import scrape_residential
from scrapers.study import scrape_study
from scrapers.rendezvous import scrape_rendezvous

data = [] 
data.extend(scrape_residential(datetime.today().strftime('%Y-%m-%d')))
data.extend(scrape_study())
data.extend(scrape_rendezvous())
file = open("sample.json", "w")
json.dump(data, file, indent=4)
file.close()
print("Done")
