"use strict";
//lib
const async = require('async')
const util = require('util')
const schedule = require('node-schedule')

//tools
const tools = require('../../tools')
//actions
const productAction = require('../product')
const configAction = require('../config')
//constans
const limits = require('../../constants/limit')
const statuses = require('../../constants/status')
const productStatus = statuses.product
const periodStatus = statuses.period
//model
const periodModel = require('../../models/period')
const Period = periodModel.Period

//config
const allParams = 'gid pid needNum buyNum status luckyId luckyUserId remainIds startDate limitDate finalDate'
const periodStatusParams = 'pid gid status limitDate'
const periodBuyParams = 'gid status needNum buyNum remainIds limitDate'

const listQueryStateParams = {
	[periodStatus.Buy] : 'pid gid buyNum needNum', //可购买 
	[periodStatus.Figure] : 'pid gid buyNum needNum finalDate', //即将揭晓
	[periodStatus.Finish] : 'pid gid buyNum needNum', //已结束
	[periodStatus.Failed] : 'pid gid buyNum needNum',
}

const periodStateParams = 'gid pid status needNum buyNum luckyId luckyUserId finalDate'

const periodInitBuyParams = 'pid limitDate finalDate needNum buyNum'
const periodInitFigureParams = 'pid'

//
let statusTimerDic = {
/* struct
	[pid] : {
		status : xx,
		job : xx,
		gid : xx
 	}
 */
}

//初始化
exports.init = (callback) => {
	async.parallel([
		callback => {
			Period.find({status : periodStatus.Buy}, periodInitBuyParams , (err, list) => {		
				let dateNow = new Date()	
				let buyList = []
				let failedList = []
				let figureList = []

				list.map(info => {
					let pid = info.pid
					if (dateNow >= info.limitDate) {
						//购买状态的超时
						if (info.needNum == info.buyNum) {
							//figure状态
							figureList.push(pid)
						}else{
							//failed状态
							failedList.push(pid)
						}
					}else{
						//buy状态
						buyList.push(pid)
					}
				})

				callback(null, {
					buyList : buyList,
					failedList : failedList,
					figureList : figureList
				})
			})
		},
		callback => {
			Period.find({status : periodStatus.Figure}, periodInitFigureParams , (err, list) => {			
				let figureList = []

				list.map(info => {
					let pid = info.pid
					figureList.push(pid)
				})

				callback(null, {
					figureList : figureList
				})
			})
		},
	], (err, result) => { //返回结果
		let finalResult = result[0]
		finalResult.figureList = [...finalResult.figureList, ...result[1].figureList] //处理合并
		console.log('period', finalResult.buyList.length, finalResult.figureList.length, finalResult.failedList.length)
		setTimeout(figureInitList.bind(null, finalResult))
		callback(err, null)
	})
}

//初始化处理数据库的期数
let figureInitList = result =>{
	async.series([
		callback => { //buy
			async.map(result.buyList, (pid, callback) =>{
				Period
					.findOne({pid : pid})
					.select(periodStatusParams)
					.exec((err, periodInfo) =>{
						if (err) {
							callback(err)
							return
						}
						let result = onPeriodStatusTimerStart(periodInfo)
						callback(null, result)
					})
				

			}, (err,results) => { 
				callback(err, results); 
			})
		},
		callback => { //figure
			//todo
			callback(null)
		},
		callback => { //failed
			//todo
			callback(null)
		},
	], (err, result) => { //返回结果
		
	})
} 

//商品上架的状态切换
exports.onProductStatusChange = (gid, status, isForce) => {
	if (status == productStatus.Normal) {
		onPeriodStart(gid, (err, result) => {
			if (err) {
				console.warn('period start error', err)
			}
		})
	} else if (isForce && status == productStatus.Invalid) {
		onPeriodStop(gid, (err, result) => {
			if (err) {
				console.warn('period stop error', err)
			}
		})
	}
}

//购买商品
exports.onBuy = (buyInfo, callback) =>{
	let userId = buyInfo.userId
	let buyNum = buyInfo.buyNum
	let pid = buyInfo.pid
	async.waterfall([
		(callback) => { //获取期数信息
			Period.findOne({pid : pid}, periodBuyParams , callback)
		},
	    (result, callback) => { //判断是否足够购买
	    	if (!result) {
	    		callback('period info not exist')
	    		return
	    	}

	    	let status = result.status
	    	if (status != periodStatus.Buy) {
	    		callback('period cannot buy')
	    		return
	    	}

	    	let remainIds = result.remainIds
	    	let remainNum = result.needNum - result.buyNum
	    	if (remainIds != remainNum) {
	    		callback('period id num not match')
	    		return
	    	}

	    	if (buyNum > remainNum) {
	    		callback('period not enough')
	    		return
	    	}

	    	let curDate = new Date()
	    	if (curDate > result.limitDate) {
	    		callback('period already timeout')
	    		return
	    	}

	    	//从后面删除若干个元素
	    	let buyIds = remainIds.splice(-buyNum, buyNum)

	    	//添加购买记录

	    	//扣除资金

	    	//判断是否结束

	    	//todo

	    },
	], (err, result) => { //返回结果
		callback(err, result)
	})
}

exports.getPeriodInfo = (pid, callback) =>{
	async.waterfall([
		(callback) => { //获取期数信息
			Period.findOne({pid : pid}, periodStateParams , callback)
		},
	    (result, callback) => { //判断是否足够购买
	    	if (!result) {
	    		callback('period info not exist')
	    		return
	    	}

	    	let status = result.status

	    	switch (status){
				case periodStatus.Buy : 
					callback(null, {
						gid : result.gid,
						pid : result.pid,
						state : 0,
						buyNum : result.buyNum,
						needNum : result.needNum,
					})
					break
				case periodStatus.Figure : 
					callback(null, {
						gid : result.gid,
						pid : result.pid,
						state : 1,
						finalDate : result.finalDate
					})
					break
				case periodStatus.Finish : 
					callback(null, {
						gid : result.gid,
						pid : result.pid,
						state : 2,
						luckyUserId : result.luckyUserId,
						luckyId : result.luckyId
					})
					break
				case periodStatus.Failed : 
					callback('period failed')
					break
				case periodStatus.UserStop : 
					callback('period stopped')
					break
				default :
					callback('period status not defined')
	    	}

	    },
	], (err, result) => { //返回结果
		callback(err, result)
	})
}

//获取期数列表
exports.getPeriodList = (currentPage, queryState, callback) =>{
	if (currentPage < 0) {
		callback('query page error')
		return
	}

	let queryParams = listQueryStateParams[queryState]

	if (!queryParams) {
		callback('query state param error')
		return
	}

	let maxQueryNum = limits.PERIOD_QUERY_MAX_NUM
	Period
		.find()
		.select(queryParams)
		.limit(maxQueryNum)
		.skip(currentPage * maxQueryNum)
		.exec((err, list) => {
			if (err) {
				callback(err)
				return
			}
			let results = []
			list.map(info => results.push({
				gid : info.gid,
				pid : info.pid,
				buyNum : info.buyNum,
				needNum : info.needNum,
				finalDate : info.finalDate,
				period : info.pid,
			}))
			callback(err, results)
		})
}


//期数状态变化
let onPeriodStatusChange = (gid, nextStatus, callback) =>{

} 

//期数开始
let onPeriodStart = (gid, callback) =>{
	async.waterfall([
		(callback) => { //判断是否有旧的
			Period
				.find({gid : gid})
				.select(periodStatusParams)
				.exec(callback)
		},
		(results, callback) => { 
			if (results) {
				let curDate = new Date()
				let isDirty = false
				for (let i in results){
					let result = results[i]
					let status = result.status
					if (status == periodStatus.Buy) {
						isDirty = true
						let limitDate = result.limitDate
						if (limitDate > curDate) {
							callback('period should finish, limit date error:' + gid)
						}else{
							callback('already have a period :' + gid)
						}
						
						break;
					}
				}
				if (!isDirty) {
					callback(null)
				}
			}else{
				callback(null)
			}
		},
		(callback) => { 
			//获取商品期数相关信息
			productAction.getProductPeriodInfo(gid, callback)
		},
	    (productInfo, callback) => { 
	    	//判断商品是否存在，是否能上架
	    	let status = productInfo.status
	    	if (status === productStatus.Normal) {
	    		//生成pid
				configAction.genPId(1, (err, pids) =>{
					if (err) {
						callback(err)
						return
					}
					callback(null, pids[0], productInfo)
				})	
	    	}else{
	    		callback('product status error')
	    	}

	    },
	    (pid, productInfo, callback) => { //写入信息
	    	let limitMs =  limits.PRODUCT_PERIOD_LIMIT_TIME
	    	let startDate = new Date()
	    	let startTime = startDate.getTime()
	    	let limitTime = startTime + limitMs
	    	let limitDate = new Date(limitTime)
	    	let needNum = productInfo.price
	    	let remainIds = tools.getRandomNumArr(1, needNum) //从1开始的随机数组

	    	let periodInfo = {
	    		gid : gid,
	    		pid : pid,
	    		startDate : startDate,
	    		limitDate : limitDate,
	    		status : periodStatus.Buy,
	    		remainIds : remainIds,
	    		buyNum : 0,
	    		needNum : needNum,

	    	}
			let model = periodModel.create(periodInfo)
		    model.save(err => {
		    	callback(err, periodInfo)
		    })
	    },
	    (periodInfo, callback) => { //启动定时器
	    	let result = onPeriodStatusTimerStart(periodInfo)
	    	callback(null, result)
	    },	
	], (err, result) => { //返回结果
		callback(err, result)
	})
}


let onPeriodStatusTimerEnd_ = (pid) =>{
	let periodInfo = statusTimerDic[pid]
	if (!periodInfo) {
		return
	}

	let status = periodInfo.status
	let gid = periodInfo.gid
	delete statusTimerDic[pid]

	switch(status){
		case periodStatus.Buy : //可购买 -> 失败（购买人数不足超时）
			onBuyFailed(pid, gid)
			break
		case periodStatus.Figure : //即将揭晓
			onFigureToFinishStatus(pid)
			break
		default :
			console.warn('period status error with timer:', pid)
	}
}

let onPeriodStatusTimerStart = (periodInfo) =>{
	let pid = periodInfo.pid
	let gid = periodInfo.gid
	let date = periodInfo.limitDate
	let status = periodInfo.status
	let job = schedule
			.scheduleJob(date, onPeriodStatusTimerEnd_.bind(null, pid))
			
	statusTimerDic[pid] = {job : job, status : status, gid : gid}

	return true
}


let onBuyFailed = (pid, gid) =>{
	//更新数据库状态
	//资金返还

}

let onFigureToFinishStatus = (pid) =>{

}

let onPeroidStatusTimerCancel = (gid) =>{
	console.warn('before', statusTimerDic)
	let results = []

	for (let pid in statusTimerDic){
		let periodInfo = statusTimerDic[pid]
		let status = periodInfo.status
		let tmpGid = periodInfo.gid
		if (tmpGid == gid && status == periodStatus.Buy) {
			let tmpJob = periodInfo.job
			if (tmpJob) {
				tmpJob.cancel()
			}
			results.push(pid)
		}
	}

	results.map(pid => delete statusTimerDic[pid])
	console.warn('end', statusTimerDic)
}

let onPeriodStop = (gid, callback) =>{
	//停止所有计时器
	onPeroidStatusTimerCancel(gid)

	//更新期数状态
	let set = {status : periodStatus.UserStop}
	Period.update(
		{gid :gid, status : periodStatus.Buy},
		{$set : set},
		(err, results) =>{
			console.warn(results)
			callback(err, results)
		}
	)
}







