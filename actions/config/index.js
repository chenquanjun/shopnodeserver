"use strict";
//lib
const async = require('async')
const util = require('util')
//model
const configModel = require('../../models/config')
const Config = configModel.Config

//数据库初始化
exports.init = (callback) => {
	async.waterfall([
		(callback) => { //检查是否有初始化参数
			Config.findOne(callback)
		},
	    (result, callback) => { 
	    	if (util.isNullOrUndefined(result)) { //数据库清空后初始化配置
	    		console.warn('init database config')
				let model = configModel.create()
			    model.save()
			    callback(null, true)
	    	}else{
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

	    		if (isDirty) { //增加新的配置字段
	    			Config.update({_id : result._id}, {$set : updateDic}, (err, result) => {
	    				console.warn('database update', updateDic)
	    				callback(err, result)
	    			})
	    		}else{ //正常启动
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

//通用生成新id方法
let genId = (name, genNum, callback) =>{
	async.waterfall([
		(callback) => {
			Config.findOne({}, name , (err, doc) => { 
				callback(err, doc)
		    })
		},
	    (doc, callback) => { 
	    	let result = []
			let oldId = doc[name]
	    	for (let i = 0; i < genNum; i++){
	    		result.push(oldId + i)
	    	}
	    	let newId = oldId + genNum

	    	Config.update({_id: doc._id}, {[name] : newId}, function (err) {
	    		callback(err, result)
	    	})   
	    },
	], (err, result) => { //返回结果
		callback(err, result)
	})
}

//生成商品gid
exports.genGId = (genNum, callback) =>{
	genId('gid', genNum, callback)
}

//生成图片id
exports.genImageId = (genNum, callback) =>{
	genId('imageId', genNum, callback)
}

//生成期数id
exports.genPId = (genNum, callback) =>{
	genId('pid', genNum, callback)
}

//生成记录id
exports.genRecordId = (genNum, callback) =>{
	genId('recordId', genNum, callback)
}

//生成用户id
exports.genUserId = (genNum, callback) =>{
	genId('userId', genNum, callback)
}

//生成充值id
exports.genChargeId = (genNum, callback) =>{
	genId('chargeId', genNum, callback)
}

