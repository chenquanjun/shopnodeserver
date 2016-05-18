"use strict";
const express = require('express')
const router = express.Router()

const async = require('async')
const util = require('util')

const tools = require('../../tools')
const paths = require('../../constants/path')
const views = require('../../constants/view')

const chargeAction = require('../../actions/charge')


router.get('/main', (req, res, next) => {
	let params = { title : '充值'}
    res.render(views.CHARGE_MAIN, params)
})

router.post('/add', (req, res, next) => {
	async.waterfall([
		(isNeedCheckAuth, callback) => { //用户验证
			userAction.checkAuthInfo(req.session.user, callback)
		},
		(userId, callback) => { 
			chargeAction.add(userId, req.query, callback)
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
	let params = { title : '充值记录'}
    res.render(views.CHARGE_LIST, params)
})


module.exports = router;