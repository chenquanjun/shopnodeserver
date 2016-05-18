"use strict";
const express = require('express')
const router = express.Router()

const async = require('async')
const util = require('util')

const tools = require('../../tools')
const paths = require('../../constants/path')
const views = require('../../constants/view')

const periodAction = require('../../actions/period')


router.get('/list', (req, res, next) => {
	let page = parseInt(req.query.page) || 1
	let queryState = 0

	async.waterfall([
		(callback) => { 
			periodAction.getPeriodCount(callback)
		},
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

			periodAction.getPeriodList(
				queryPage, 
				queryState,
				(err, periodList) => {
					result.periodList = periodList
					callback(err, result)
				}
			)
		},		
	], (err, result) => { //返回结果
		if (err) {
			next()
			return
		}

		let params = Object.assign(result, { title : '商品期数列表'})
	    res.render(views.PERIOD_LIST, params)
	})
})


module.exports = router;