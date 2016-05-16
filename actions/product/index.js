"use strict";
const async = require('async')
const util = require('util')

const imageAction = require('../image')
const configAction = require('../config')
const periodAction = require('../period')

const tools = require('../../tools')

const limits = require('../../constants/limit')
const productStatus = require('../../constants/status').product

const productModel = require('../../models/product')
const Product = productModel.Product

const listAllSelectParams = 'gid imageIds name price status'
const listPeriodParams = 'status price'

//初始化
exports.init = (callback) => {
	async.waterfall([
		(callback) => callback(null, true),
	], (err, result) => { //返回结果
		callback(err, result)
	})
}

exports.getProductPeriodInfo = (gid, callback) =>{
	Product
		.findOne({gid : gid})
		.select(listPeriodParams)
		.exec(callback)
}

exports.getProductCount = (callback) =>{
	Product.count((err, totalProductNum) =>{
		if (err) {
			callback(err)
			return
		}

		let maxQueryNum = limits.PRODUCT_QUERY_MAX_NUM
		let totalPageNum = Math.floor(totalProductNum / maxQueryNum) + 1
		callback(null, totalProductNum, totalPageNum)
	})
}

exports.getProductList = (page, callback) => {
	async.waterfall([
		(callback) => { //
			console.warn('get product list', page)
			let maxQueryNum = limits.PRODUCT_QUERY_MAX_NUM
 			Product
 				.find()
 				.select(listAllSelectParams)
 				.limit(maxQueryNum)
 				.skip(page * maxQueryNum)
				.exec((err, list) => {
					if (err) {
						callback(err)
						return
					}
					let results = []
					list.map(info => results.push({
						gid : info.gid,
						imageIds : info.imageIds,
						name : info.name,
						price : info.price,
						status : info.status,
					}))
					callback(err, results)
				})
		},
	    convertProductImageIds,
	], (err, result) => { //返回结果
		callback(err, result)
	})
}



exports.getProductListByGidList = (gids, callback) => {
	async.waterfall([
		(callback) => { //
			Product
				.find({'gid': {'$in' : gids}})
				.select(listAllSelectParams)
				.exec((err, list) => {
					if (err) {
						callback(err)
						return
					}
					let results = []
					list.map(info => results.push({
						gid : info.gid,
						imageIds : info.imageIds,
						name : info.name,
						price : info.price,
						status : info.status,
					}))
					callback(err, results)
				})
		},
	    convertProductImageIds,
	], (err, result) => { //返回结果
		callback(err, result)
	})
}

    //     pid             | int           商品唯一id
    //     gid             | int           商品的id（不唯一， 可重复使用）
    //     title           | string        商品描述
    //     img_url         | string        商品图片
    //     price           | int           价格
    //     buy_count       | int           当前购买数量
    //     total_count     | int           商品总量
    //     period          | int           该商品的期数
    //     limited_buy     | int           限制购买数量



exports.getProductByGid = (gid, callback) =>{
	async.waterfall([
		(callback) => { //
 			Product
 				.findOne({gid : gid})
 				.select(listAllSelectParams)
				.exec(callback)
		},
	    (productInfo, callback) => { //
			if (!productInfo) {
				callback("product not exist")
				return
			}

			imageAction.getImagesByIds(productInfo.imageIds, (err, imageDic) =>{
				callback(err, productInfo, imageDic)
			})
	    },
	    (productInfo, imageDic, callback) => { //
			let imageIds = productInfo.imageIds

			if (imageIds) {
				let images = []
				imageIds.map(imageId => images.push(imageDic[imageId]))
				delete productInfo.imageIds
				productInfo.images = images
			}

	    	callback(null, productInfo)
	    },
	], (err, result) => { //返回结果
		callback(err, result)
	})
}

exports.editProduct = (productInfo, callback) =>{

	async.waterfall([
		(callback) => { //检查是否有初始化参数
			let images = productInfo.images
			if (images) {
				imageAction.getImageIds(images, callback)
			}else{
				callback(null, null)
			}
 			
		},
	    (imageIds, callback) => { //初始化
	    	let set = {
				name : productInfo.name, 
				price : productInfo.price, 
			}
			if (imageIds) {
				set.imageIds = imageIds
			}

			Product.update(
				{gid : productInfo.gid},
				{$set : set},
				(err, result) =>{
					if (err) {
						callback(err)
					}else{
						callback(null, productInfo.gid)
					}
				}
			)
	    },

	], (err, result) => { //返回结果
		callback(err, result)
	})
}

exports.setProductStatus = (gid, status, isForce, callback) =>{
	let isStatusExist = tools.hasValueInObject(productStatus, status)
	if (!isStatusExist) {
		callback('product status error')
		return
	}

	let set = {
		status : status
	}

	Product.update(
		{gid : gid},
		{$set : set},
		(err, result) =>{
			if (err) {
				callback(err)
			}else{

				//通知period状态变化
				periodAction.onProductStatusChange(gid, status, isForce)
				callback(null, gid, status)
			}
		}
	)
}

exports.addProduct = (productInfo, callback) => {
	//1.1、获取gid
	//1.2、获取图片id
	//2、写入数据库
	if (!util.isObject(productInfo)) {
		callback('product info not object')
		return
	}

	async.auto({
	    getGid : (callback) => { //获取gid
	    	configAction.genGId(1, callback)
	    },
	    getImageIds : (callback) => { //获取图片id
	    	imageAction.getImageIds(productInfo.images, callback)
	    },
	    writeDataBase : ['getGid', 'getImageIds', (results, callback) => { //写入数据库
	    	let gids = results.getGid
	    	let gid = gids[0]
	    	let imageIds = results.getImageIds

	    	let product = {
			    gid: gid,
			    name: productInfo.name,
			    imageIds : imageIds,
			    price : productInfo.price,
	    	}

			let model = productModel.create(product)
		    model.save(err => {
		    	callback(err, gid)
		    })
	    }],
	}, (err, result) => { //返回结果
		let gid = result.writeDataBase
		callback(err, gid)
	})

}



let convertProductImageIds = (productList, callback) => {
	let imageSet = new Set()

	productList.map(
		productInfo => 
			productInfo.imageIds.map(
				imageId => imageSet.add(imageId)
			)
	)

	let images = [...imageSet]
	imageAction.getImagesByIds(images, (err, imageDic) =>{
    	productList.map(
    		productInfo => {
    			let imageIds = productInfo.imageIds
    			let images = []
    			imageIds.map(imageId => images.push(imageDic[imageId]))
    			delete productInfo.imageIds
    			productInfo.images = images
    		}
    	)

    	callback(null, productList)
	})	
}
