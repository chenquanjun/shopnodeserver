"use strict";
const express = require('express')
const router = express.Router()

const async = require('async')
const util = require('util')

const tools = require('../../tools')
const paths = require('../../constants/path')
const views = require('../../constants/view')

const chargeAction = require('../../actions/charge')
const userAction = require('../../actions/user')


router.get('/main', (req, res, next) => {
	let params = { title : '充值'}
    res.render(views.CHARGE_MAIN, params)
})

router.post('/add', (req, res, next) => {
	async.waterfall([
		(callback) => { //用户验证
			userAction.checkAuthInfo(req.session.user, callback)
		},
		(userId, callback) => { 
			chargeAction.addBalance(userId, req.body, callback)
		},		
	], (err, result) => { //返回结果
		if (err) {
			res.jsonp({ result: 1, err : err })
		}else{
			res.jsonp(Object.assign({ result: 0, state:0 }, result))
		}
	})
})

router.get('/list', (req, res, next) => {
	let page = parseInt(req.query.page) || 1

	async.waterfall([
		(callback) => { //用户验证
			userAction.checkAuthInfo(req.session.user, callback)
		},
		(userId, callback) => { 
			async.waterfall([
				callback => chargeAction.getCountByUserId(userId, callback),
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

					chargeAction.getListByUserId(
						userId, 
						queryPage,
						(err, chargeList) => {
							result.chargeList = chargeList
							callback(err, result)
						}
					)
				},

			], callback)
		},
	], (err, result) => { //返回结果
		let params = Object.assign({ title : '充值记录'}, result)

	    res.render(views.CHARGE_LIST, params)
	})
})


module.exports = router;