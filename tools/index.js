"use strict";
const fs = require("fs")
const async = require('async')
const utils = require('utility')

const limits = require('../constants/limit')
const saltLength = limits.SALT_LENGTH * 2

let m_rootPath = null
let m_resourcePath = null

exports.init = (rootPath, resourcePath) => {
	m_rootPath = rootPath
	m_resourcePath = resourcePath
}

//图片保存
exports.saveBase64ImageToFile = (savePath, base64Arr, callback) => {
	async.map(base64Arr, (base64Data, callback) => { 
		let dataBuffer = new Buffer(base64Data, 'base64');
		let md5 = utils.md5(dataBuffer)
		let fileName = md5 + '.jpg'
		let fullFileName = m_resourcePath + savePath + fileName
		fs.exists(fullFileName, (isExist) => {
			if (isExist) {
				callback(null, fileName); 
			}else{
				fs.writeFile(fullFileName, dataBuffer, (err) => {
					callback(err, fileName); 
				})
			}
		})   

	}, (err,results) => { 
		callback(err, results); 
	});
}

exports.hasValueInObject = (dic, value) => {
	for (let key in dic){
		let tmpValue = dic[key];
		if (value === tmpValue){
			return key;
		}
	}
	return null;
}

exports.getRandomNumArr = (startIdx, num) => {  
	let randomArr =[];  
	for (let i = 0; i < num; i++) {  
		randomArr [i] = startIdx + i;  
	}  

	if (num == 1) {
		return randomArr;
	}

	for (let i = 0; i < num; i++) {  
		let iRand = parseInt(num * Math.random());  
		let temp = randomArr[i];  
		randomArr[i] = randomArr[iRand];  
		randomArr[iRand] = temp;  
	}  
	return randomArr;  
}   

exports.getSalt = () => {
	return utils.randomString();
}

exports.getTimestamp = () =>{
	return utils.timestamp();
}

exports.hashPassword = (password) => {
	return utils.sha256(new Buffer(password))
}