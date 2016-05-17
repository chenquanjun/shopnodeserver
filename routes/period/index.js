"use strict";
const period = require('./period');

module.exports = app => {
    app.use('/period', period);
};