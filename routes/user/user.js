"use strict";
const express = require('express')
const router = express.Router()

const async = require('async')
const util = require('util')

const tools = require('../../tools')
const paths = require('../../constants/path')
const views = require('../../constants/view')

const userAction = require('../../actions/user')

router.get('/logout', function(req, res) {
    req.session.user = null;
    res.redirect('signin');
});

// get add
router.get('/signup', (req, res, next) => {
	const textParams = [
		{name : 'userName', inputType :'text', placeHolder : '用户名', title : '用户名'}, 
		{name : 'nickName', inputType :'text', placeHolder : '昵称', title : '昵称'}, 
		{name : 'password', inputType :'password', placeHolder : '密码', title : '密码'}, 
		{name : 'repeatPassword', inputType :'password', placeHolder : '重复输入密码', title : '重复密码'}, 
	]

	const fileParams = [
		{name : 'image', title : '头像'}
	]

    res.render(views.USER_SIGNUP, {
    	title : '用户注册',
    	textParams : textParams,
    	fileParams : fileParams
    })
})

router.post('/signup', (req, res, next) => {
	let userName = req.body.userName
	let password = req.body.password
	let nickName = req.body.nickName
	let image = req.body.image

	async.waterfall([
		(callback) => { //检查参数
			//todo 参数合法性检查
			console.log('params check')

			if (!util.isString(userName) || userName.length == 0) {
				callback("userName error")
				return
			}

			if (!util.isString(password) || password.length == 0) {
				callback("password error")
				return
			}

			if (!util.isString(nickName) || nickName.length == 0) {
				callback("nickName error")
				return
			}

			callback(null)
		},
	    (callback) => { 
	    	let userInfo = {userName : userName, password : password, nickName : nickName, image : image}
	    	userAction.addUser(userInfo, callback)
	    },

	], (err, result) => { //返回结果
		if (err) {
			console.log(err, result)
			res.jsonp({ result: 1, err : err })
		}else{
			console.log(err, 'register success:' + result)
			res.jsonp({ result: 0, userId : result})
		}
	})
	
})

router.get('/signin', (req, res, next) => {
	const textParams = [
		{name : 'userName', inputType :'text', placeHolder : '用户名', title : '用户名'}, 
		{name : 'password', inputType :'password', placeHolder : '密码', title : '密码'}, 
	]

    res.render(views.USER_SIGNIN, {
    	title : '用户登录',
    	textParams : textParams,
    })
})

router.post('/signin', (req, res, next) => {
	let userName = req.body.userName
	let password = req.body.password

	async.waterfall([
		(callback) => { //检查参数
			//todo 参数合法性检查
			console.log('params check')

			if (!util.isString(userName) || userName.length == 0) {
				callback("userName error")
				return
			}

			if (!util.isString(password) || password.length == 0) {
				callback("password error")
				return
			}


			callback(null)
		},
	    (callback) => { 
			userAction.onSignin(userName, password, callback)
	    },

	], (err, userId) => { //返回结果
		if (err) {
			console.log(err, userId)
			res.jsonp({ result: 1, err : err})
		}else{
			console.log(err, 'register success:' + userId)

 			let user = userAction.getAuthInfo(userId)
        	req.session.user = user;

			res.jsonp({ result: 0, userId : userId})
		}
	})
	
})


router.get('/list', (req, res, next) => {
	let page = parseInt(req.query.page) || 1

	async.waterfall([
		(callback) => { //管理员验证
			callback(null)
		},
		(callback) => { 
			async.waterfall([
				callback => userAction.getCount(callback),
				(totalNum, totalPageNum, callback) => { 

					let result = {
						totalPageNum : totalPageNum, 
						totalNum : totalNum,
						page : page,
					}

					let queryPage = page - 1

					if (queryPage < 0 || queryPage > totalPageNum) {
						callback(null, result)
						return
					}

					userAction.getList(
						queryPage,
						(err, userList) => {
							result.userList = userList
							callback(err, result)
						}
					)
				},

			], callback)
		},
	], (err, result) => { //返回结果
		let params = Object.assign({ title : '用户列表'}, result)

	    res.render(views.USER_LIST, params)
	})
})

module.exports = router;
