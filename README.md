# FoodScoop Backend
A Node.js backend for FoodScoop: A new dining experience

## Build Application

### Dependencies:
- Node.js version ^19.x.x
- npm version ^9.x.x
- MongoDB version ^6.x.x
- Python ^3.10 (including pip)
- Other dependencies highlighted in `package.json` and `scraping/requirements.txt`

### Build Script:

Note: make sure to clone this repository with `--recurse-submodules`.

```sh
$ cp configtemplate.ts config.ts
$ npm i
$ npx ttsc

# Python Scraping tool
$ cd scraping
$ python -m venv venv
$ source venv/bin/activate
$ pip install -r requirements.txt
```

In addition, duplicate the file (done in command 1) `configtemplate.ts` to `config.ts` and add any variables as needed. (MongoDB URI?)

## Run Application
```sh
$ npm run run

# Python Scraping tool (to run individually)
$ cd scraping
$ source venv/bin/activate
$ python main.py
```
