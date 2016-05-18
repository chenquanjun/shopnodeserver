"use strict";
//lib
const async = require('async')
const util = require('util')
const schedule = require('node-schedule')

//tools
const tools = require('../../tools')
//actions
const userAction = require('../user')
const configAction = require('../config')
//constans
const limits = require('../../constants/limit')

//model
const chargeModel = require('../../models/charge')
const Charge = chargeModel.Charge

//config


//初始化
exports.init = (callback) => {
	async.waterfall([
		(callback) => callback(null, true),
	], (err, result) => {
		callback(err, result)
	})
}





