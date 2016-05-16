"use strict";
const async = require('async')

const configModel = require('../../models/config')
const Config = configModel.Config

//数据库初始化
exports.init = (callback) => {
	async.waterfall([
		(callback) => { //检查是否有初始化参数
			Config.find((err, docs) => { 
				callback(err, docs.length == 0)
		    });
		},
	    (isNeedInit, callback) => { //初始化
	    	if (isNeedInit) {
	    		console.warn('init database config')
				let model = configModel.create()
			    model.save(); 
	    	}else{
	    		console.warn('database already init')
	    	}

		    callback(null, true)
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

