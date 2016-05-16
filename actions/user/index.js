"use strict";
const async = require('async')
const util = require('util')
const schedule = require('node-schedule')

const tools = require('../../tools')

const limits = require('../../constants/limit')

const userModel = require('../../models/user')
const User = userModel.User

const userSigninParams = 'password salt userId'

const imageAction = require('../image')
const configAction = require('../config')


//初始化
exports.init = (callback) => {
	async.waterfall([
		(callback) => callback(null, true),
	], (err, result) => { //返回结果
		callback(err, result)
	})
}

exports.checkAuthInfo = (user, callback) => {
	async.waterfall([
		(callback) => { 
			if (!user) {
				callback('user not login')
				return
			}

			let userId = user.userId

			if (!util.isNumber(userId)) {
				callback('user info error')
				return
			}

			let timeStamp = user.timeStamp

			if (!util.isNumber(timeStamp)) {
				callback('time error')
				return
			}

			let curTimeStamp = tools.getTimeStamp()

			if (curTimeStamp > timeStamp + limits.SESSION_EXPIRE_TIME) {
				callback('time expire')
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

let checkUserId = (userId, callback) => {
	User
		.findOne({userId : userId})
		.exec((err, result) => {
			if (err) {
				callback(err)
				return
			}
			if (!result) {
				callback('user id not eixst')
				return
			}
			callback(null, true)
		})
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
						callback('user or password not right')
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
	    		callback('user or password not right')
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
						callback('user name already exist')
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
