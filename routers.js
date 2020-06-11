const express = require('express');
const routers = express.Router();
const {getIndex} = require('./controllers/IndexPage');
const {createAccountMS} = require("./controllers/MSAccount");

routers.get('/', (req, res) => {
    return getIndex(req, res);
});

routers.post('/mscreate', async (req, res) => {
    return await createAccountMS(req, res);
});

module.exports = routers;
