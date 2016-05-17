"use strict";
const async = require('async')
const util = require('util')

const apis = require('../../constants/api')
const paths = require('../../constants/path')

const productAction = require('../../actions/product')
const periodAction = require('../../actions/period')

//初始化
exports.init = (callback) => {
	async.waterfall([
		(callback) => callback(null, true),
	], (err, result) => {
		callback(err, result)
	})
}

//用户验证
exports.isNeedAuth = (api, callback) => {
	let apiInfo = apis[api]
	if (util.isNullOrUndefined(apiInfo)) {
		callback('api not exist')
		return
	}

	callback(null, apiInfo.isNeedAuth)
}

exports.get = (userId, query, callback) =>{
	let api = query.action 
	
	switch (api){
		case 'get_goods' : 
			let currentPage = parseInt(query.current_page) - 1 //page - 1
			let queryState = query.query_state
			apiGetGoods(currentPage, queryState, callback)
			break
		case 'get_goods_info' :
			let pid = query.pid
			apiGetGoodsInfo(userId, pid, callback)
			break
		default :
			callback('api not exist!!')
	}
}

exports.post = (body, callback) =>{
	callback('not over write')
}

//api 获取商品期数列表
let apiGetGoods = (currentPage, queryState, callback) => {
	async.waterfall([
		(callback) => { //根据参数获取期数列表
			periodAction.getPeriodList(
				currentPage, 
				queryState,
				callback
			)
		},
		(periodList, callback) => { //获取商品列表
			if (periodList.length == 0) {
				callback('no period info')
				return
			}

			let gidSet = new Set()
			periodList.map(
				periodInfo => gidSet.add(periodInfo.gid)	
			)

			let gids = [...gidSet]
			productAction.getProductListByGidList(gids, (err, productList) => callback(err, periodList, productList))
		},
		(periodList, productList, callback) => { //合并期数和商品列表
			let productDic = {}

			productList.map(productInfo => productDic[productInfo.gid] = productInfo)

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
		(list, callback) => { //转换成旧的api
		    list.map(listInfo => {
		    	listInfo.buy_count = listInfo.buyNum
		    	listInfo.total_count = listInfo.needNum
		    	listInfo.title = listInfo.name
		    	listInfo.limited_buy = 0

		    	delete listInfo.buyNum
		    	delete listInfo.needNum
		    	delete listInfo.name
		    })

		    let result = {
		    	goods_list : list,
		    	image_path : paths.UPLOAD_IMAGE
		    }

		    callback(null, result)
		}
	], (err, result) => { //返回结果
		callback(err, result)
	})
}

/*
action  : get_goods_info
params  : 
    pid ｜int
resp    : 
    state           | int       0: 可购买 1: 开奖中 2: 该用户中奖 3: 未中奖
    stats_params    | change    不同状态附带的参数
        0:
        1:  count_down  | int       倒数倒计时 
        2:  lucky_num   | string    幸运号码        
        3:  lucky_num   | string    幸运号码
            name        | string    中奖用户昵称
    buy_count       | int       当前购买数
    pid             | int           商品唯一id
    gid             | int           商品的id（不唯一， 可重复使用）
    title           | string        商品描述
    img_url         | string        商品图片
    price           | int           价格
    buy_count       | int           当前购买数量
    total_count     | int           商品总量
    period          | int           该商品的期数
    limited_buy     | int           限制购买数量
*/

let apiGetGoodsInfo = (userId, pid, callback) => {
	async.waterfall([
		(callback) => { //根据参数获取期数列表
			periodAction.getPeriodInfo(pid, callback)
		},
		(periodInfo, callback) => { //获取商品列表
			let gid = periodInfo.gid
			productAction.getProductByGid(gid, (err, productInfo) => callback(err, periodInfo, productInfo))
		},
		(periodInfo, productInfo, callback) => { //合并期数和商品列表
			let result = Object.assign(periodInfo, productInfo)
			callback(null, result)
		},
		(result, callback) => { //转换成旧的api
			let state = result.state
			if (state == 2) {
				if (userId != result.luckyId) {
					result.state == 3 
				}
			}

	    	result.buy_count = result.buyNum
	    	result.total_count = result.needNum
	    	result.title = result.name
	    	result.limited_buy = 0

	    	delete result.buyNum
	    	delete result.needNum
	    	delete result.name

	    	result.image_path = paths.UPLOAD_IMAGE

		    callback(null, result)
		}
	], (err, result) => { //返回结果
		callback(err, result)
	})
}
