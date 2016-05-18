"use strict";
const charge = require('./charge');

module.exports = app => {
    app.use('/charge', charge);
};