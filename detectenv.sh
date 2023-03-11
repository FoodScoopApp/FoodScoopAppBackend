if [ "$SORA" = "scraper" ] # SORA stands for scraper or app
then
    pm2-runtime start ecosystem.config.js --only scraper
else
    pm2-runtime start ecosystem.config.js --only app
fi