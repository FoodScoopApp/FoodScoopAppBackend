import sys
import requests
import re
import json
from datetime import datetime
from bs4 import BeautifulSoup

from scrapers.residential import scrape_residential
from scrapers.study import scrape_study
from scrapers.rendezvous import scrape_rendezvous
from scrapers.bcafe import scrape_bcafe
from scrapers.drey import scrape_drey
from scrapers.epic_ackerman import scrape_epic_ackerman
from scrapers.hours import scrape_hours
from scrapers.cafe1919 import scrape_cafe1919

meals = []
meals.extend(scrape_residential(datetime.today().strftime('%Y-%m-%d')))
meals.extend(scrape_study())
meals.extend(scrape_rendezvous())
meals.extend(scrape_bcafe())
meals.extend(scrape_drey())
meals.extend(scrape_epic_ackerman())
meals.extend(scrape_cafe1919())
data = {
        "hours": scrape_hours(),
        "meals": meals
       }

#file = open("sample.json", "w")
json.dump(data, sys.stdout)
#file.close()
print("\nDone", file=sys.stderr)
