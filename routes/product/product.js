"use strict";
const express = require('express')
const router = express.Router()

const async = require('async')
const util = require('util')

const tools = require('../../tools')
const paths = require('../../constants/path')
const views = require('../../constants/view')

const productAction = require('../../actions/product')

let convertArray = arr => {
	if (util.isString(arr)) {
		return [arr]
	}else if (util.isArray(arr)){
		return arr
	}
	return null
}

// get add
router.get('/add', (req, res, next) => {
	const textParams = [
		{name : 'name', inputType :'text', placeHolder : '商品名字'}, 
		{name : 'price', inputType :'tel', placeHolder : '商品价格'}, 
	]

	const fileParams = [
		{name : 'images'}
	]

    res.render(views.PRODUCT_ADD, {
    	title : '添加商品',
    	textParams : textParams,
    	fileParams : fileParams
    })
})

// post add
router.post('/add', (req, res, next) => {
	let name = req.body.name
	let price = parseInt(req.body.price)

	async.waterfall([
		(callback) => { //检查参数
			console.log('params check')

			if (!util.isString(name) || name.length == 0) {
				callback("name error")
				return
			}

			if (!price) {
				callback("price error")
				return
			}

			let images = convertArray(req.body['images[]'])
			let imageNum = images ? images.length : 0

			if (imageNum == 0) {
				callback("image empty")
				return
			}

			callback(null, images)
		},
	    (images, callback) => { //图片转码
	    	console.log('data convert base64')
	    	let base64Arr = []
	    	images.map(image => base64Arr.push(image.replace(/^data:image\/\w+;base64,/, "")))
	    	callback(null, base64Arr)
	    },
	    (base64Arr, callback) => { //保存图片文件
	    	console.log('save image')
	    	tools.saveBase64ImageToFile(paths.UPLOAD_IMAGE, base64Arr, callback)
	    }, 
	    (imageNames, callback) => { //添加商品，写入数据库
	    	console.log('write date base')
	    	let prodcutInfo = {
	    		name : name,
	    		price : price,
	    		images : imageNames 
	    	}
	    	
	    	productAction.addProduct(prodcutInfo, callback)
	    },
	], (err, result) => { //返回结果
		
		if (err) {
			console.log(err, result)
			res.jsonp({ result: 1, err : err })
		}else{
			console.log(err, 'add new product success gid:' + result)
			res.jsonp({ result: 0, gid : result})
		}
	})
	
})

router.get('/list', (req, res, next) => {
	let page = parseInt(req.query.page) || 1

	async.waterfall([
		(callback) => { 
			productAction.getProductCount(callback)
		},
		(totalProductNum, totalPageNum, callback) => { 

			let result = {
				totalPageNum : totalPageNum, 
				totalProductNum : totalProductNum,
				page : page,
				imagePath : paths.UPLOAD_IMAGE,
			}

			let queryPage = page - 1

			if (queryPage < 0 || queryPage > totalPageNum) {
				callback(null, result)
				return
			}

			productAction.getProductList(
				queryPage, 
				(err, productList) => {
					result.productList = productList
					callback(err, result)
				}
			)
		},		
	], (err, result) => { //返回结果
		if (err) {
			next()
			return
		}

		let params = Object.assign(result, { title : '商品列表'})
	    res.render(views.PRODUCT_LIST, params)
	})
})

//修改
router.get('/edit', (req, res, next) => {
	let gid = parseInt(req.query.gid)

	async.waterfall([
		(callback) => { //检查参数
			if (util.isNullOrUndefined(gid)) {
				callback("gid error")
				return
			}

			productAction.getProductByGid(gid, callback)
		},
	], (err, result) => { //返回结果
		if (err) {
			next()
			return
		}

		const textParams = [
			{name : 'gid', inputType :'tel', placeHolder : result.gid , disabled : true}, 
			{name : 'name', inputType :'text', placeHolder : '商品名字', value : result.name}, 
			{name : 'price', inputType :'tel', placeHolder : '商品价格', value : result.price}, 
		]

		const fileParams = [
			{name : 'images'}
		]

	    res.render(views.PRODUCT_EDIT, {
	    	title : '修改商品',
	    	textParams : textParams,
	    	fileParams : fileParams,
	    	imagePath : paths.UPLOAD_IMAGE,
	    	images : result.images.toString()
	    })
	})
})

router.post('/edit', (req, res, next) => {
	let gid = parseInt(req.body.gid)
	let name = req.body.name
	let price = parseInt(req.body.price)

	async.waterfall([
		(callback) => { //检查参数
			console.log('params check')

			if (util.isNullOrUndefined(gid)) {
				callback("gid error")
				return
			}


			if (!util.isString(name) || name.length == 0) {
				callback("name error")
				return
			}

			if (util.isNullOrUndefined(price)) {
				callback("price error")
				return
			}

			let images = convertArray(req.body['images[]'])

			if (images){
		    	let base64Arr = []
		    	images.map(image => base64Arr.push(image.replace(/^data:image\/\w+;base64,/, "")))

		    	tools.saveBase64ImageToFile(paths.UPLOAD_IMAGE, base64Arr, callback)
			}else{
				callback(null, [])
			}
		}, 
	    (imageNames, callback) => { //添加商品，写入数据库
	    	console.log('write date base')
	    	//除重

	    	let oldImages = convertArray(req.body['oldImages[]']) || []
	    	let images = [...imageNames, ...oldImages]

	    	if (images.length == 0) {
	    		callback("no product pic!")
	    		return
	    	}

	    	let prodcutInfo = {
	    		name : name,
	    		price : price,
	    		images : images,
	    		gid : gid,
	    	}
	    	
	    	productAction.editProduct(prodcutInfo, callback)
	    },
	], (err, result) => { //返回结果
		
		if (err) {
			console.log(err, result)
			res.jsonp({ result: 1, err : err })
		}else{
			console.log(err, 'edit product success gid:' + result)
			res.jsonp({ result: 0, gid : result})
		}
	})
	
})


router.post('/status', (req, res, next) => {
	let gid = parseInt(req.body.gid)
	let status = parseInt(req.body.status)
	let isForce = (parseInt(req.body.isForce) === 1)

	async.waterfall([
		(callback) => { //检查参数
			if (util.isNullOrUndefined(gid)) {
				callback("gid error")
				return
			}

			if (util.isNullOrUndefined(status)) {
				callback("status error")
				return
			}

			productAction.setProductStatus(gid, status, isForce, callback)
		},
	], (err, gid, status) => { //返回结果
		if (err) {
			res.jsonp({ result: 1, err : err })
		}else{
			res.jsonp({ result: 0, gid : gid, status : status})
		}
	})
})

module.exports = router;