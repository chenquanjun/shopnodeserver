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
const listSelectParams = 'gid pid needNum buyNum status luckyId luckyUserId remainIds startDate limitDate finalDate'
const listPeriodStatusParams = 'pid status limitDate'
const periodBuyParams = 'gid status needNum buyNum remainIds limitDate'

const listQueryStateParams = {
	[periodStatus.Buy] : 'pid gid buyNum needNum', //可购买 
	[periodStatus.Figure] : 'pid gid buyNum needNum finalDate', //即将揭晓
	[periodStatus.Finish] : 'pid gid buyNum needNum', //已结束
	[periodStatus.Failed] : 'pid gid buyNum needNum',
}

//
let statusTimerDic = {
/* struct
	[pid] : {
		status : xx,
		job : xx,
 	}
 */
}

//初始化
exports.init = (callback) => {
	async.waterfall([
		(callback) => callback(null, true),
	], (err, result) => { //返回结果
		callback(err, result)
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


	    },
	], (err, result) => { //返回结果
		callback(err, result)
	})
}





exports.getPeriodList = (currentPage, queryState, callback) =>{
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


let onPeriodStart = (gid, callback) =>{
	async.waterfall([
		(callback) => { //判断是否有旧的
			console.log("period start check")
			Period
				.find({gid : gid})
				.select(listPeriodStatusParams)
				.exec(callback)
		},
		(results, callback) => { 
			console.log("period start check result", results)
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
			console.log("period info")
			//获取商品期数相关信息
			productAction.getProductPeriodInfo(gid, callback)
		},
	    (productInfo, callback) => { 
	    	console.log("product status check", productInfo)
	    	//判断商品是否存在，是否能上架
	    	let status = productInfo.status
	    	if (status === productStatus.Normal) {
	    		//生成pid
				configAction.genPId(1, (err, pids) =>{
					console.warn('gen pid', pids)
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
	    	console.log("period write data base")
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

	statusTimerDic.map((pid, periodInfo)=>{
		let tmpGid = periodInfo.gid
		if (tmpGid == gid && status == periodStatus.Buy) {
			let tmpJob = periodInfo.job
			if (tmpJob) {
				tmpJob.cancel()
			}
			results.push(pid)
		}
	})

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







