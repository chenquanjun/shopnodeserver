//数据配置
const mongoose = require("mongoose")
const Schema = mongoose.Schema 

const configSchema = new Schema({
    gid: Number, //商品id
    imageId : Number, //图片id
    recordId : Number, //记录id
    pid : Number, //期数id
    userId : Number, //用户id
    chargeId : Number, //chargeId
}); 

const Model = exports.Config = mongoose.model('config', configSchema)

const initialParams = {
    gid : 1, 
    imageId : 1,
    recordId : 1,
    pid : 1,
    userId : 1,
    chargeId : 1,
}

//创建
exports.create = (params) => {
	const newParams = Object.assign({}, initialParams, params)
	return new Model(newParams)
}

exports.getInitParams = () => {
    return initialParams
}