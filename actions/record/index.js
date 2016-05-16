"use strict";
const async = require('async')
const util = require('util')

const tools = require('../../tools')

const recordModel = require('../../models/record')
const Record = recordModel.Record



//初始化
exports.init = (callback) => {
	async.waterfall([
		(callback) => callback(null, true),
	], (err, result) => { //返回结果
		callback(err, result)
	})
}