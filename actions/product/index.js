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

const allInfoParams = 'gid imageIds name price status'
const periodListParams = 'gid imageIds name price'
const periodInfoParams = 'status price'

//初始化
exports.init = (callback) => {
	async.waterfall([
		(callback) => callback(null, true),
	], (err, result) => {
		callback(err, result)
	})
}

exports.getProductPeriodInfo = (gid, callback) =>{
	Product
		.findOne({gid : gid})
		.select(periodInfoParams)
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
			let maxQueryNum = limits.PRODUCT_QUERY_MAX_NUM
 			Product
 				.find()
 				.select(allInfoParams)
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
	], (err, result) => {
		callback(err, result)
	})
}


//通过gid列表获取商品列表
exports.getProductListByGidList = (gids, callback) => {
	async.waterfall([
		(callback) => { 
			Product
				.find({'gid': {'$in' : gids}})
				.select(periodListParams)
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

//通过gid获取商品信息
exports.getProductByGid = (gid, callback) =>{
	async.waterfall([
		(callback) => { //
 			Product
 				.findOne({gid : gid})
 				.select(allInfoParams)
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

//编辑商品
exports.editProduct = (productInfo, callback) =>{

	async.waterfall([
		(callback) => { //获取图片id
			let images = productInfo.images
			if (images) {
				imageAction.getImageIds(images, callback)
			}else{
				callback(null, null)
			}
 			
		},
	    (imageIds, callback) => { //更新商品信息
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

//设置商品状态
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

//添加商品
exports.addProduct = (productInfo, callback) => {
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
	}, (err, result) => {
		let gid = result.writeDataBase
		callback(err, gid)
	})

}

//将商品的imageid转换成image图片
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
