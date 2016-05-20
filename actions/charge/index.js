"use strict";
//lib
const async = require('async')
const util = require('util')
//tools
const tools = require('../../tools')
//actions
const userAction = require('../user')
const configAction = require('../config')
//constants
const limits = require('../../constants/limit')
const getError = require('../../constants/error').getError
//model
const chargeModel = require('../../models/charge')
const Charge = chargeModel.Charge
//config
const userQueryParams = 'chargeId chargeNum chargeDate source sourceInfo'
const allQueryParams = 'userId chargeId chargeNum chargeDate source sourceInfo'

//初始化
exports.init = (callback) => {
	async.waterfall([
		(callback) => callback(null, true),
	], (err, result) => {
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
exports.addBalance = (userId, chargeInfo, callback) =>{
	let chargeNum = parseInt(chargeInfo.chargeNum) || 0
	let source = parseInt(chargeInfo.source) || 0
	let sourceInfo = chargeInfo.sourceInfo || ''

	if (chargeNum <= 0) {
		callback(getError('CHARGE_NUM_ERROR', chargeNum))
		return
	}

	async.waterfall([
	    (callback) => { //生成充值id
	    	console.log('generate id')
			configAction.genChargeId(1, (err, ids) =>{
				if (err) {
					callback(err)
					return
				}
				callback(null, ids[0])
			})
	    },
	    (chargeId, callback) => { //写入数据库
	    	console.log('write data base')
	    	let chargeInfo = {
	    		chargeId : chargeId,
	    		userId : userId,
	    		chargeNum : chargeNum,
	    		source : source,
	    		sourceInfo : sourceInfo
	    	}

			let model = chargeModel.create(chargeInfo)
		    model.save(err => callback(err))
	    },
	    (callback) => { //用户余额增加
	    	console.log('add balance')
	    	userAction.addBalance(userId, chargeNum, callback)
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
		ret = Charge.find({userId : userId})
	}
	else{
		ret = Charge
	}

	ret.count((err, totalCount) =>{
		if (err) {
			callback(err)
			return
		}

		let maxQueryNum = limits.CHARGE_QUERY_MAX_NUM
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
	let maxQueryNum = limits.CHARGE_QUERY_MAX_NUM


	Charge.find(findParams)
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





