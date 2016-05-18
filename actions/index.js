"use strict";
const async = require('async')

const configAction = require('./config')
const imageAction = require('./image')
const periodAction = require('./period')
const productAction = require('./product')
const recordAction = require('./record')
const userAction = require('./user')
const chargeAction = require('./charge')

exports.init = () => {
	async.waterfall([
		(callback) => configAction.init(callback),
		(value, callback) => imageAction.init(callback),
		(value, callback) => productAction.init(callback),
		(value, callback) => periodAction.init(callback),
		(value, callback) => recordAction.init(callback),
		(value, callback) => userAction.init(callback),
		(value, callback) => chargeAction.init(callback),
	], (err, result) => { //返回结果
		if (err) {
			console.warn('action init failed :', err)
		}
	})
}