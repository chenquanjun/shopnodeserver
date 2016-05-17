"use strict";
const express = require('express')
const router = express.Router()

const async = require('async')

const userAction = require('../../actions/user')
const apiAction = require('../../actions/api')

// http://localhost:8000/api/jsonData?action=get_goods&current_page=1&query_state=1

router.get('/', (req, res, next) => {
	async.waterfall([
		(callback) => { //是否需要验证
			apiAction.isNeedAuth(req.query.action, callback)
		},
		(isNeedCheckAuth, callback) => { //用户验证
			if (isNeedCheckAuth) {
				userAction.checkAuthInfo(req.session.user, callback)
			}else{
				callback(null, null)
			}
		},
		(userId, callback) => { 
			apiAction.get(userId, req.query, callback)
		},		
	], (err, result) => { //返回结果
		if (err) {
			res.jsonp({ result: 1, err : err })
		}else{
			res.jsonp(Object.assign({ result: 0, state:0 }, result))
		}
	})
})

router.post('/', (req, res, next) => {

})

module.exports = router;
