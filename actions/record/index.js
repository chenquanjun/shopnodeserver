"use strict";
const async = require('async')
const util = require('util')

//tools
const tools = require('../../tools')

//constans
const limits = require('../../constants/limit')

const recordModel = require('../../models/record')
const Record = recordModel.Record
const configAction = require('../config')

//config
const userQueryParams = 'recordId pid buyNum buyDate buyIds'
const allQueryParams = 'userId recordId pid buyNum buyDate buyIds'


//初始化
exports.init = (callback) => {
	async.waterfall([
		(callback) => callback(null, true),
	], (err, result) => { //返回结果
		callback(err, result)
	})
}


exports.getAllList = (page, callback) => {
	//only admin can list this  
	getList(null, page, callback)
}

exports.getListByUserId = (userId, page, callback) => {
	getList(userId, page, callback)
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


exports.getCountByUserId = (userId, callback) => {
	getCount(userId, callback)
}

exports.getCount = (callback) => {
	getCount(null, callback)
}

let getCount = (userId, callback) =>{
	let ret

	if (userId) {
		ret = Record.find({userId : userId})
	}
	else{
		ret = Record
	}

	ret.count((err, totalCount) =>{
		if (err) {
			callback(err)
			return
		}

		let maxQueryNum = limits.RECORD_QUERY_MAX_NUM
		let totalPageNum = Math.floor(totalCount / maxQueryNum) + 1
		callback(null, totalCount, totalPageNum)
	})
}

let getList = (userId, page, callback) => {
	let queryParams
	let findParams 
	
	if (util.isNullOrUndefined(userId)) { //list all
		queryParams = allQueryParams

		findParams = null
	}else{
		queryParams = userQueryParams

		findParams = { userId : userId} 
	}

	let paramsDic = queryParams.split(' ')
	let maxQueryNum = limits.RECORD_QUERY_MAX_NUM


	Record.find(findParams)
		.select(queryParams)
		.limit(maxQueryNum)
		.skip(page * maxQueryNum)
		.exec((err, list) => {
			if (err) {
				callback(err)
				return
			}
			let results = []
			list.map(info => {
				let result = {}
				paramsDic.map(key => result[key] = info[key])
				results.push(result)
			})
			callback(err, results)
		})
}

