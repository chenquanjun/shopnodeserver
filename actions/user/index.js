"use strict";
//lib
const async = require('async')
const util = require('util')
const schedule = require('node-schedule')
//tools
const tools = require('../../tools')
//actions
const imageAction = require('../image')
const configAction = require('../config')
//constants
const limits = require('../../constants/limit')
const getError = require('../../constants/error').getError
//model
const userModel = require('../../models/user')
const User = userModel.User
//config
const userSigninParams = 'password salt userId'
const balanceParams = 'balance'
const allInfoParams = 'userId userName nickName imageId balance'


//初始化
exports.init = (callback) => {
	async.waterfall([
		(callback) => callback(null, true),
	], (err, result) => { //返回结果
		callback(err, result)
	})
}

exports.addBalance = (userId, balance, callback) => {
	if (balance <= 0) {
		callback(getError('USER_ADD_BALANCE_ERROR', {userId : userId, balance : balance}))
		return
	}

	User.update({userId: userId}, {$inc: {balance: balance}}, (err, result) =>{
		callback(err, result)
	})
}

exports.getBalance = (userId, callback) => {
	getBalance(userId, callback)
}

exports.onBuyPeriod = (userId, cost, callback) =>{
	if (cost <= 0) {
		callback(getError('USER_BUY_COST_ERROR', {userId : userId, cost : cost}))
		return
	}

	async.waterfall([
		callback => getBalance(userId, callback),
		(balance, callback) => {
			if (cost > balance) {
				callback(getError('USER_BALANCE_NOT_ENOUGH', {userId : userId, balance : balance, cost : cost}))
				return
			}
			callback(null)
		},
		callback => {
			User.update({userId: userId}, {$inc: {balance: -cost}}, (err, result) =>{
				callback(err, result)
			})			
		}
	], callback)
}

exports.onPeriodRefund = (refundDic, callback) =>{
	let refundIdList = []

	for (let userId in refundDic){
		refundIdList.push(userId)
	}

	async.map(refundIdList, (userId, callback) =>{
		let addNum = refundDic[userId]
		User.update({userId: userId}, {$inc: {balance: addNum}}, callback)
	}, callback)
}

exports.checkAuthInfo = (user, callback) => {
	async.waterfall([
		(callback) => { 
			if (!user) {
				callback(getError('USER_NOT_LOGIN'))
				return
			}

			let userId = user.userId

			if (!util.isNumber(userId)) {
				callback(getError('USER_INFO_ERROR'))
				return
			}

			let timeStamp = user.timeStamp

			if (!util.isNumber(timeStamp)) {
				callback(getError('USER_INFO_ERROR'))
				return
			}

			let curTimeStamp = tools.getTimeStamp()

			if (curTimeStamp > timeStamp + limits.SESSION_EXPIRE_TIME) {
				callback(getError('USER_LOGIN_TOKEN_OUTDATE'))
				return
			}

			callback(null, userId)
		},
	    checkUserId,
	], (err, result) => { //返回结果
		callback(err, result)
	})
}

exports.getAuthInfo = (userId) => {
	return {
		userId : userId,
		timeStamp : tools.getTimeStamp()
	}
}

exports.onSignin = (userName, password, callback) =>{
	async.waterfall([
		(callback) => { 
 			User
 				.findOne({userName : userName})
 				.select(userSigninParams)
				.exec((err, result) => {
					if (err) {
						callback(err)
						return
					}

					if (!result) {
						callback(getError('USER_NAME_OR_PASSWORD_ERROR'))
						return
					}
					callback(null, result)
				})
		},
	    (result, callback) => { 
	    	let salt = result.salt
	    	let correctPassword = result.password

	    	let submitPassword = tools.hashPassword(salt + password)

	    	if (correctPassword == submitPassword) {
	    		callback(null, result.userId)
	    	}else{
	    		callback(getError('USER_NAME_OR_PASSWORD_ERROR'))
	    	}
	    },
	], (err, result) => { //返回结果
		callback(err, result)
	})
}

exports.addUser = (userInfo, callback) =>{
	async.waterfall([
		(callback) => { 
 			User
 				.findOne({userName : userInfo.userName})
				.exec((err, result) => {
					if (err) {
						callback(err)
						return
					}
					if (result) {
						callback(getError('USER_NAME_ALREADY_EXIST', userName))
						return
					}
					callback(null)
				})
		},
	    (callback) => { 
	    	//生成userid，生成imageid，加密密码

			async.parallel({
				genUserId: callback => { 
					configAction.genUserId(1, (err, userIds) =>{
						if (err) {
							callback(err)
							return
						}
						callback(null, userIds[0])
					})
				},
				getImageId: callback => {
					let image = userInfo.image
					if (image) {
						imageAction.getImageIds([image], (err, imageIds) => {
							if (err) {
								callback(err)
								return
							}
							callback(null, imageIds[0])
						})
					}else{
						callback(null, null)
					}
					
				},
				hashPassword : callback => {
					let password = userInfo.password
					let salt = tools.getSalt()
					let newPassword = tools.hashPassword(salt + password)
					callback(null, {password : newPassword, salt : salt})
				},
			}, (err, results) => {
				if (err) {
					callback(err)
					return
				}

				let hashInfo = results.hashPassword
				let imageId = results.getImageId
				let userId = results.genUserId
				let result = {
					userId : userId,
					password : hashInfo.password,
					salt : hashInfo.salt,
					nickName : userInfo.nickName,
					userName : userInfo.userName,
				}

				if (imageId) {
					result.imageId = imageId
				}
				callback(null, result)
			});

	    },
	    (result, callback) => { 
	    	//保存
			let model = userModel.create(result)
		    model.save(err => {
		    	callback(err, result.userId)
		    })
	    },
	], (err, result) => { //返回结果
		callback(err, result)
	})
}

exports.getCount = (callback) =>{
	User.count((err, totalProductNum) =>{
		if (err) {
			callback(err)
			return
		}

		let maxQueryNum = limits.USER_QUERY_MAX_NUM
		let totalPageNum = Math.floor(totalProductNum / maxQueryNum) + 1
		callback(null, totalProductNum, totalPageNum)
	})
}

exports.getList = (page, callback) => {
	async.waterfall([
		(callback) => { //
			let maxQueryNum = limits.USER_QUERY_MAX_NUM

			let paramsDic = allInfoParams.split(' ')
 			User
 				.find()
 				.select(allInfoParams)
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
		},
	    convertUserImageId,
	], (err, result) => {
		callback(err, result)
	})
}

//将用户的imageid转换成image图片
let convertUserImageId = (userList, callback) => {
	let imageSet = new Set()

	let isDirty = false
	userList.forEach(
		userInfo => {
			if (userInfo.imageId) {
				isDirty = true
				imageSet.add(userInfo.imageId)
			}
		}
	)

	if (isDirty) {
		let images = [...imageSet]
		imageAction.getImagesByIds(images, (err, imageDic) =>{
	    	userList.forEach(
	    		userInfo => {
	    			let imageId = userInfo.imageId

	    			if (imageId) {
	    				userInfo.image = imageDic[imageId]
	    			}	    			
	    			delete userInfo.imageId
	    		}
	    	)
	    	callback(null, userList)
		})	
	}else{
		userList.forEach(userInfo => delete userInfo.imageId)
		callback(null, userList)
	}
}

let getBalance = (userId, callback) => {
	User
		.findOne({userId : userId})
		.select(balanceParams)
		.exec((err, result) =>{
			if (err) {
				callback(err)
				return
			}

			callback(null, result.balance)
		})
}


let checkUserId = (userId, callback) => {
	User
		.findOne({userId : userId})
		.exec((err, result) => {
			if (err) {
				callback(err)
				return
			}
			if (!result) {
				callback(getError('USER_ID_NOT_EXIST'))
				return
			}
			callback(null, userId)
		})
}

