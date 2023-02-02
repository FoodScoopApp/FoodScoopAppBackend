# This is modified from the template on https://pm2.io/docs/runtime/integration/docker/
FROM keymetrics/pm2:latest-alpine

WORKDIR src

COPY *.ts ./
COPY *.json ./
COPY ecosystem.config.js ./

# Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm i
RUN npm run build

# Expose the listening port of your app
EXPOSE 8080

# Show current folder structure in logs
RUN ls -al -R

CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]
