"use strict";
const api = require("./api")
const product = require("./product")
const user = require("./user")

module.exports = app => {
	console.log('routes init')
    api(app)
    product(app)
    user(app)
}
