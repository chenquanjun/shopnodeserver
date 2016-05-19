"use strict";
//lib
const async = require('async')
const util = require('util')
const schedule = require('node-schedule')

//tools
const tools = require('../../tools')
//actions
const productAction = require('../product')
const recordAction = require('../record')
const userAction = require('../user')
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
	[0] : 'gid pid needNum buyNum status luckyId luckyUserId startDate limitDate finalDate',
	[periodStatus.Buy] : 'pid gid buyNum needNum', //可购买 
	[periodStatus.Figure] : 'pid gid buyNum needNum finalDate', //即将揭晓
	[periodStatus.Finish] : 'pid gid buyNum needNum', //已结束
	[periodStatus.Failed] : 'pid gid buyNum needNum',
}

const figureParams = 'status finalDate needNum'

const listQueryStateParamsDic = {
	/*
		初始化的时候将listQueryStateParams的value转成数组
	*/
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

	for (var key in listQueryStateParams){
		var value = listQueryStateParams[key]
		var dic = value.split(' ')
		listQueryStateParamsDic[key] = dic
	}

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
		setTimeout(figureInitList.bind(null, finalResult))
		callback(err, null)
	})
}

exports.getPeriodCount = (callback) =>{
	Period.count((err, totalPeriodCount) =>{
		if (err) {
			callback(err)
			return
		}

		let maxQueryNum = limits.PERIOD_QUERY_MAX_NUM
		let totalPageNum = Math.floor(totalPeriodCount / maxQueryNum) + 1
		callback(null, totalPeriodCount, totalPageNum)
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
				

			}, callback)
		},
		callback => { //figure
			if (result.figureList.length == 0) {
				callback(null, null)
				return
			}

			async.forEachLimit(result.figureList, 1, (pid, callback) => { 
 				onFigureToFinishStatus(pid)
			}, callback)
		},
		callback => { //failed
			//todo
			callback(null, null)
		},
	], (err, result) => { //返回结果
		if (err) {
			console.warn('Warning: Period init figure error', err)
			return
		}

		let buyResult = result[0]
		let figureResult = result[1]
		let failedResult = result[2]

		if (util.isArray(buyResult) && buyResult.length > 0) {
			console.log('Period: on buy num', buyResult.length)
		}

		if (util.isArray(figureResult) && figureResult.length > 0) {
			console.log('Period: on figure num', figureResult.length)
		}

		if (util.isArray(failedResult) && failedResult.length > 0) {
			console.log('Period: on failed num', failedResult.length)
		}
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
	} else{
	//强制停止期数se if (isForce && status == productStatus.Invalid) {
		onPeriodForceStop(gid, (err, result) => {
			if (err) {
				console.warn('period stop error', err)
			}
		})
	}
}

//购买商品
exports.onBuy = (userId, buyInfo, callback) => {
	let buyNum = parseInt(buyInfo.buyNum) || 0

	if (buyNum <= 0) {
		callback('buy num error')
		return
	}

	let pid = parseInt(buyInfo.pid) || 0

	if (pid <= 0) {
		callback('pid error')
		return
	}

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
	    	if (remainIds.length != remainNum) {
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
    		let recordInfo = {
    			userId : userId,
    			pid : pid,
    			buyNum : buyNum,
    			buyIds : buyIds,
    		}

  
    		let periodInfo = {
    			buyNum : result.buyNum + buyNum,
    		}

    		if (remainIds.length == 0) { //所有购买结束
		    	let limitMs =  limits.PERIOD_FIGURE_TIME
		    	let curDate = new Date()
		    	let curTime = curDate.getTime()
		    	let limitTime = curTime + limitMs
		    	let limitDate = new Date(limitTime)

	    		let periodTimerInfo = {
	    			pid : pid,
	    			gid : result.gid,
	    			limitDate : limitDate,
	    			status : periodStatus.Figure,
	    		}

    			periodInfo.finalDate = curDate //添加最后购买日期
    			periodInfo.remainIds = null //id清空
    			periodInfo.status = periodStatus.Figure //进入计算状态

    			onPeriodStatusTimerStart(periodTimerInfo) //进入下一个时间状态
    		}else{
    			periodInfo.remainIds = remainIds //保存新的id
    		}

    		async.parallel([
	    		callback => { //写入购买纪录
	    			recordAction.addRecord(recordInfo, callback)
	    		},
	    		callback => { //扣除资金
	    			userAction.onBuyPeriod(userId, buyNum, callback)
	    		},
	    		callback =>{ //更新期数信息
	    			Period.update({pid : pid}, {$set : periodInfo} , callback)
	    		}
    		], (err, result) =>{
    			callback(err, {lottery_ids : buyIds})
    		})
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
	let queryParamsDic = listQueryStateParamsDic[queryState]

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


			list.map(info => {
				let result = {}
				queryParamsDic.map(key => result[key] = info[key])
				results.push(result)
			})
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
	delete statusTimerDic[pid]

	switch(status){
		case periodStatus.Buy : //可购买 -> 失败（购买人数不足超时）
			onBuyStatusToFailedStatus(pid)
			break
		case periodStatus.Figure : //即将揭晓
			onFigureToFinishStatus(pid)
			break
		default :
			console.warn('period status error with timer:', pid, status)
	}
}

let onPeriodStatusTimerStart = (periodInfo) =>{
	let pid = periodInfo.pid
	let gid = periodInfo.gid
	let date = periodInfo.limitDate
	let status = periodInfo.status

	let oldJobInfo = statusTimerDic[pid]
	if (!util.isNullOrUndefined(oldJobInfo)) {
		console.log('Period status change with stop old job', pid)
		let oldJob = oldJobInfo.job 
		oldJob.cancel()
	}

	let job = schedule
			.scheduleJob(date, onPeriodStatusTimerEnd_.bind(null, pid))
			
	statusTimerDic[pid] = {job : job, status : status, gid : gid}

	return true
}

//购买失败
let onBuyStatusToFailedStatus = (pid, gid) =>{
	//更新数据库状态
	//资金返还

}

//统计
let onFigureToFinishStatus = (pid) =>{
// 1、取该商品最后购买时间前网站所有商品的最后100条购买时间记录；
// 2、按时、分、秒、毫秒排列取值之和，除以该商品总参与人次后取余数；
// 3、余数加上10000001 即为“幸运云购码”；
// 4、余数是指整数除法中被除数未被除尽部分， 如7÷3 = 2 ......1，1就是余数
	
	async.waterfall([
		(callback) => { //获取最后购买时间
 			Period
 				.findOne({pid : pid})
 				.select(figureParams)
				.exec(callback)
		},
	    (result, callback) => { 
	 		let status = result.status 
	 		if (status != periodStatus.Figure) {
	 			console.warn('Warning: period status not figure when figure luckyId', status)
	 		}

	 		let finalDate = result.finalDate //最后购买时间
	 		let needNum = result.needNum //购买总需人次

	 		async.waterfall([
	 			(callback) => { //查询所有商品最后100条购买时间记录
	 				recordAction.getLastRecordList(finalDate, callback)
	 			},
	 			(results, callback) =>{ //计算结果
			    	let totalFigureNum = 0
			    	let resultNum = results.length
			    	let recordList = []

			    	results.map(result => {
			    		let buyDate = result.buyDate
			    		recordList.push(result.recordId)
			    		let hour = buyDate.getHours()
			    		let minute = buyDate.getMinutes()
			    		let second = buyDate.getSeconds()
			    		let ms = buyDate.getMilliseconds()
			    		totalFigureNum += hour * 100000000 + minute * 100000 + second * 1000 + ms
			    	})

			    	let luckyId = totalFigureNum % needNum + 1

			    	console.warn('figure result', totalFigureNum, luckyId)

			    	//获取中奖id的用户id
			    	recordAction.getUserByLuckyId(
			    		pid, 
			    		luckyId, 
			    		(err, luckyUserId) => callback(err, {
			    			luckyUserId : luckyUserId,
			    			luckyId : luckyId,
			    			recordList : recordList,
			    			totalFigureNum : totalFigureNum, 
			    			status : periodStatus.Finish,
			    		}))
	 			},
	 		], callback)
	    },
	    (results, callback) => {
	    	//统计完成
	    	//更新记录
	    	console.warn('update period record', results)
	    	Period.update({pid : pid}, {$set : results, $unset : {limitDate : 1, remainIds : 1, buyNum : 1}}, callback)
	    }
	], (err, result) => { //返回结果
		console.warn('figure finish result', err, result)
	})

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

//强制停止期数
let onPeriodForceStop = (gid, callback) =>{
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







