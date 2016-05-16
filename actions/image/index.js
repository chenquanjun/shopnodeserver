"use strict";
const async = require('async')
const util = require('util')

const configAction = require('../config')

const imageModel = require('../../models/image')
const Image = imageModel.Image

const listSelectParams = 'imageId image'

//初始化
exports.init = (callback) => {
	async.waterfall([
		(callback) => callback(null, true),
	], (err, result) => { //返回结果
		callback(err, result)
	})
}

exports.getImagesByIds = (imageIds, callback) => {
	Image
		.find({'imageId': {'$in' : imageIds}})
		.select(listSelectParams)
		.exec((err, list) => {
			if (err) {
				callback(err)
				return
			}
			let imageDic = {}

			list.map(imageInfo => imageDic[imageInfo.imageId] = imageInfo.image)

			callback(err, imageDic)
		})
}

exports.getImageIds = (images, callback) =>{

	if (!util.isArray(images)) {
		callback('images not exist')
		return
	}

	//图片除重
	let stripImages = [...new Set(images)]

	async.waterfall([
		(callback) => { //获取图片信息
			getImageInfoArr(stripImages, callback)
		},
	    figureImageInfoArr,
	], (err, result) => { //返回结果
		callback(err, result)
	})
}

//获取图片信息
let getImageInfoArr = (images, callback) => {
	async.map(images, (image, callback) => { 
		Image.findOne({image : image}, 'imageId' ,function(err, doc) { 
			callback(err, {imageId : doc ? doc.imageId : null, image : image})
	    })
	}, (err,results) => { 
		if (err) {
			callback(err)
			return
		}

		let oldImageIds = []
		let newImages = []

		results.map(result =>{
			let imageId = result.imageId
			if (imageId) {
				oldImageIds.push(imageId)
			}else{
				newImages.push(result.image)
			}
		})

		callback(err, {oldImageIds : oldImageIds, newImages : newImages}); 
	})
}

let figureImageInfoArr = (data, callback) =>{
	let newImages = data.newImages
	let oldImageIds = data.oldImageIds

	if (newImages.length == 0) { //没有新的图片
		callback(null, oldImageIds)
		return
	}

	async.waterfall([
		(callback) => { //获取图片id
			configAction.genImageId(newImages.length, callback)
		},
		(newIds, callback) => { //写入数据库
			let imageNum = newIds.length
			if (imageNum !== newImages.length) {
				callback('image num not equal to new ids' + imageNum + ' ' + newImages.length)
				return
			}

			let imageInfoArr = []

			for (let i = 0; i < imageNum; i ++){
				imageInfoArr.push({
					imageId : newIds[i],
					image : newImages[i],
				})
			}

		 	async.map(imageInfoArr, (imageInfo, callback) => { 
				let model = imageModel.create(imageInfo)
			    model.save(err => {
			    	callback(err, imageInfo.imageId)
			    }); 

			}, (err,results) => { 
				callback(err, results); 
			})
		},
	], (err, results) => { //返回结果
		if (err) {
			callback(err)
			return
		}
		callback(err, [...results, ...oldImageIds])
	})
}
