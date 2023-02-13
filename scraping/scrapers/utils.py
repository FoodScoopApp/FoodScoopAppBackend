PARSER = "html.parser"
RESIDENTIAL_RESTAURANTS = ["Bruin Plate", "De Neve", "Epicuria"]
FOOD_RESTRICTIONS = """V VG APNT ATNT AWHT AGTN ASOY ASES AMLK AEGG ACSF AFSH
                       HAL LC HC""".split()

def build_menu_item(menu_item, dining_hall, meal_period, date):
    name = menu_item.find("a",class_="recipelink").text

    restrictions = {i:False for i in FOOD_RESTRICTIONS}
    for i in menu_item.select('[class*="webcode-"]'):#class_="webcode-16px"):
        restrictions[i["alt"]] = True

    price = menu_item.find(class_="menu-item-price")
    if price != None: price = float(price.text[1:])

    description = menu_item.find(class_="menu-item-description")
    if description != None: description = description.text.strip()

    return {"name": name, "diningHall": dining_hall, "meal_period": meal_period,
            "date": date, "restrictions": restrictions, "price": price,
            "description": description}

