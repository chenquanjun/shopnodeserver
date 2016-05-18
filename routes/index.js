"use strict";
const api = require("./api")
const product = require("./product")
const period = require("./period")
const user = require("./user")
const charge = require("./charge")

module.exports = app => {
	console.log('routes init')
    api(app)
    product(app)
    period(app)
    user(app)
    charge(app)
}
