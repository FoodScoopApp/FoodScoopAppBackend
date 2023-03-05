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

data = [] 
data.extend(scrape_residential(datetime.today().strftime('%Y-%m-%d')))
data.extend(scrape_study())
data.extend(scrape_rendezvous())
data.extend(scrape_bcafe())
data.extend(scrape_drey())
data.extend(scrape_epic_ackerman())

#file = open("sample.json", "w")
json.dump(data, sys.stdout, indent=4)
#file.close()
print("\nDone", file=sys.stderr)
