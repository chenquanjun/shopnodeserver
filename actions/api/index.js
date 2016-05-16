"use strict";
const async = require('async')
const util = require('util')

const apis = require('../../constants/api')

const productAction = require('../../actions/product')
const periodAction = require('../../actions/period')

//初始化
exports.init = (callback) => {
	async.waterfall([
		(callback) => callback(null, true),
	], (err, result) => { //返回结果
		callback(err, result)
	})
}

exports.isNeedAuth = (api, callback) => {
	let apiInfo = apis[api]
	if (util.isNullOrUndefined(apiInfo)) {
		callback('api not exist')
		return
	}

	callback(null, apiInfo.isNeedAuth)
}

let apiGetGoods = (currentPage, queryState, callback) => {
    // goods_list  | array     商品列表
    //     pid             | int           商品唯一id
    //     gid             | int           商品的id（不唯一， 可重复使用）
    //     title           | string        商品描述
    //     img_url         | string        商品图片
    //     price           | int           价格
    //     buy_count       | int           当前购买数量
    //     total_count     | int           商品总量
    //     period          | int           该商品的期数
    //     limited_buy     | int           限制购买数量


	async.waterfall([
		(callback) => { //判断是否有旧的
			periodAction.getPeriodList(
				currentPage, 
				queryState,
				callback
			)
		},
		(periodList, callback) => { 
			if (periodList.length == 0) {
				callback('no period info')
				return
			}

			let gidSet = new Set()
			periodList.map(
				periodInfo => gidSet.add(periodInfo.gid)	
			)

			let gids = [...gidSet]

			productAction.getProductListByGidList(gids, (err, productDic) => callback(err, periodList, productDic))
		},
		(periodList, productDic, callback) => { //判断是否有旧的
			let resultArr = []
			periodList.map(
				periodInfo => {
					let gid = periodInfo.gid
					let productInfo = productDic[gid]

					let result = Object.assign(periodInfo, productInfo)
					resultArr.push(result)
				}	
			)

			callback(null, resultArr)
		},
	], (err, result) => { //返回结果
		callback(err, result)
	})



}

exports.get = (query, callback) =>{
	let api = query.action 
	
	switch (api){
		case 'get_goods' : 
			let currentPage = query.current_page
			let queryState = query.query_state
			apiGetGoods(currentPage, queryState, callback)
			break
		default :
			callback('api not exist!!')
	}
}

exports.post = (body, callback) =>{
	callback('not over write')
}
