"use strict";
const record = require('./record');

module.exports = app => {
    app.use('/record', record);
};