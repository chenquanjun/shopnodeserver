"use strict";
const async = require('async')
const util = require('util')

const configModel = require('../../models/config')
const Config = configModel.Config

//数据库初始化
exports.init = (callback) => {
	async.waterfall([
		(callback) => { //检查是否有初始化参数
			Config.findOne(callback)
		},
	    (result, callback) => { //初始化
	    	if (util.isNullOrUndefined(result)) {
	    		console.warn('init database config')
				let model = configModel.create()
			    model.save()
			    callback(null, true)
	    	}else{
	    		//比较字段
	    		console.warn('database already init')
	    		let initParams = configModel.getInitParams()
	    		let isDirty = false
	    		let updateDic = {}

	    		for (let key in initParams){
	    			let value = initParams[key]
	    			if (util.isNullOrUndefined(result[key])) {
	    				isDirty = true
	    				updateDic[key] = value
	    			}
	    		}

	    		if (isDirty) {
	    			Config.update({_id : result._id}, {$set : updateDic}, (err, result) => {
	    				console.warn('database update', updateDic)
	    				callback(err, result)
	    			})
	    		}else{
	    			console.warn('datebase normal')
	    			callback(null, true)
	    		}
	    	}

	    	
	    },
	], (err, result) => { //返回结果
		if (err) {
			console.warn('database init failed :', err)
		}
		callback(err, result)
	})
}

let genId = (name, genNum, callback) =>{
	async.waterfall([
		(callback) => { //检查是否有初始化参数
			Config.findOne({}, name , (err, doc) => { 
				callback(err, doc)
		    })
		},
	    (doc, callback) => { //初始化
	    	let result = []
			let oldId = doc[name]
	    	for (let i = 0; i < genNum; i++){
	    		result.push(oldId + i)
	    	}
	    	let newId = oldId + genNum
	    	// console.warn('gen:', name, genNum, oldId, newId)

	    	Config.update({_id: doc._id}, {[name] : newId}, function (err) {
	    		callback(err, result)
	    	})   
	    },
	], (err, result) => { //返回结果
		callback(err, result)
	})
}

exports.genGId = (genNum, callback) =>{
	genId('gid', genNum, callback)
}

exports.genImageId = (genNum, callback) =>{
	genId('imageId', genNum, callback)
}

exports.genPId = (genNum, callback) =>{
	genId('pid', genNum, callback)
}

exports.genRecordId = (genNum, callback) =>{
	genId('recordId', genNum, callback)
}

exports.genUserId = (genNum, callback) =>{
	genId('userId', genNum, callback)
}

exports.genChargeId = (genNum, callback) =>{
	genId('chargeId', genNum, callback)
}

