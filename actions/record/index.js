"use strict";
const async = require('async')
const util = require('util')

//tools
const tools = require('../../tools')

//constans
const limits = require('../../constants/limit')
const recordStatus = require('../../constants/status').record
const recordModel = require('../../models/record')
const Record = recordModel.Record
const configAction = require('../config')

//config
const userQueryParams = 'recordId pid buyNum buyDate buyIds status'
const allQueryParams = 'userId recordId pid buyNum buyDate buyIds status'

const lastQueryParams = 'userId recordId buyDate'
const luckyIdParams = 'userId buyIds'

const pidQueryParams = 'userId buyNum'

//初始化
exports.init = (callback) => {
	async.waterfall([
		(callback) => callback(null, true),
	], (err, result) => { //返回结果
		callback(err, result)
	})
}

//通过幸运id找到购买id
exports.getLuckyUserByLuckyId = (pid, luckyId, callback) => {
	Record
		.find({pid : pid})
		.select(luckyIdParams)
		.exec((err, list) =>{
			if (err) {
				callback(err)
				return
			}
			let luckyUserId = null

			for (let i in list){
				let info = list[i]
				let buyIds = info.buyIds

				for (let j in buyIds){
					let buyId = buyIds[j]
					luckyUserId = info.userId
					console.warn('find lucky user', pid, luckyId, luckyUserId)
					break //break buyIds map loop
				}

				if (luckyUserId) { 
					break //break list map loop
				}
			}

			callback(null, luckyUserId)
		})
}

//期数失败，标记记录
exports.onPeriodFailed = (pid ,callback) =>{
	async.waterfall([
		(callback) => {
			Record.update(
				{pid : pid}, 
				{$set : {status : recordStatus.Failed}}, 
				{multi: true}, //多个记录
				callback
			)
		},
		(result, callback) => {
			Record
				.find({pid : pid})
				.select(pidQueryParams)
				.exec(callback)
		},
	], callback)
}

//获取最近的购买记录
exports.getLastRecordList = (date, callback) => {
	let maxQueryNum = limits.RECORD_FIGURE_QUERY_MAX_NUM
	let paramsDic = lastQueryParams.split(' ')
	Record
		.find({buyDate: {"$lte": date}})//不大于当前日期的
		.select(lastQueryParams)
		.limit(maxQueryNum)
		.sort({buyDate:-1})
		.exec((err, list) =>{
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
			callback(null, results)
		})
}

//获取所有记录
exports.getAllList = (page, callback) => {
	//only admin can list this  
	getList(null, page, callback)
}

//获取用户记录
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

//获取用户记录数量
exports.getCountByUserId = (userId, callback) => {
	getCount(userId, callback)
}

//获取所有记录数量
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

