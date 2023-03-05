# This is modified from the template on https://pm2.io/docs/runtime/integration/docker/
FROM keymetrics/pm2:latest-alpine

WORKDIR src

COPY . /src

# Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn

RUN npm i
RUN npx ttsc

# Expose the listening port of your app
EXPOSE 8080

CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]
