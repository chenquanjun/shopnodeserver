"use strict";
const api = require("./api")
const product = require("./product")
const period = require("./period")
const user = require("./user")

module.exports = app => {
	console.log('routes init')
    api(app)
    product(app)
    period(app)
    user(app)
}
