"use strict";
const express = require('express')
const router = express.Router()

const async = require('async')
const util = require('util')

const tools = require('../../tools')
const paths = require('../../constants/path')
const views = require('../../constants/view')

const recordAction = require('../../actions/record')
const userAction = require('../../actions/user')


router.get('/list', (req, res, next) => {
	let page = parseInt(req.query.page) || 1

	async.waterfall([
		(callback) => { //用户验证
			userAction.checkAuthInfo(req.session.user, callback)
		},
		(userId, callback) => { 
			async.waterfall([
				callback => recordAction.getCountByUserId(userId, callback),
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

					recordAction.getListByUserId(
						userId, 
						queryPage,
						(err, recordList) => {
							result.recordList = recordList
							callback(err, result)
						}
					)
				},

			], callback)
		},
	], (err, result) => { //返回结果
		let params = Object.assign({ title : '购买纪录'}, result)

	    res.render(views.RECORD_LIST, params)
	})
})


module.exports = router;