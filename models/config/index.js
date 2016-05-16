//数据配置
const mongoose = require("mongoose")
const Schema = mongoose.Schema 

const configSchema = new Schema({
    gid: Number,
    imageId : Number,
    recordId : Number,
    pid : Number,
    userId : Number,
}); 

const Model = exports.Config = mongoose.model('config', configSchema);

const initialParams = {
    gid : 1, 
    imageId : 1,
    recordId : 1,
    pid : 1,
    userId : 1,
}

//创建
exports.create = (params) => {
	const newParams = Object.assign({}, initialParams, params)
	return new Model(newParams); 
}