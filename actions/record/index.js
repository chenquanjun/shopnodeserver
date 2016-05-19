"use strict";
const async = require('async')
const util = require('util')

const tools = require('../../tools')

const recordModel = require('../../models/record')
const Record = recordModel.Record
const configAction = require('../config')

//初始化
exports.init = (callback) => {
	async.waterfall([
		(callback) => callback(null, true),
	], (err, result) => { //返回结果
		callback(err, result)
	})
}

//添加充值记录
exports.addRecord = (recordInfo, callback) =>{
	async.waterfall([
	    (callback) => { //生成纪录id
	    	console.log('generate id')
			configAction.genRecordId(1, (err, ids) =>{
				if (err) {
					callback(err)
					return
				}
				callback(null, ids[0])
			})
	    },
	    (recordId, callback) => { //写入数据库
	    	console.log('write data base')
	    	let info = Object.assign({recordId : recordId}, recordInfo)

			let model = recordModel.create(info)
		    model.save(err => callback(err))
	    },
	], (err, result) => { //返回结果
		callback(err, result)
	})
}