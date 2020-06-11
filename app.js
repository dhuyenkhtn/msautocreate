require('dotenv').config();

const path = require('path');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const routers = require('./routers');

const app = express();

app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/', routers);

const server = http.createServer(app);
server.listen(process.env.PORT);
console.log('Running in: %s', process.env.PORT);
