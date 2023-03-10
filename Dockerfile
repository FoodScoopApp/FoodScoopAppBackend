# This is modified from the template on https://pm2.io/docs/runtime/integration/docker/
FROM keymetrics/pm2:18-alpine

WORKDIR src

COPY . /src

# Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn

RUN npm i
RUN npx ttsc

# Install Python and dependencies
ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN python3 -m ensurepip
RUN pip3 install --no-cache --upgrade pip setuptools
RUN pip3 install -Ur scraping/requirements.txt

# Expose the listening port of your app
EXPOSE 8080

CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]
