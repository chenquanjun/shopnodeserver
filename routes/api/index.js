"use strict";
const api = require('./api');

module.exports = app => {
    app.use('/api/jsonData', api);
};
