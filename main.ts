import config from './config'

import express from 'express';

const app = express()

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(config.PORT, () => {
    console.log(`Example app listening on port ${config.PORT}`)
})



