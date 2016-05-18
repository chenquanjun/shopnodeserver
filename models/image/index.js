const mongoose = require("mongoose")
const Schema = mongoose.Schema

const imageSchema = new Schema({
    imageId: Number, //图片id
    image : String, //图片文件
    date : { type: Date },  //图片创建日期
})

const Model = exports.Image = mongoose.model('image', imageSchema)

//创建
exports.create = (params) => {
	const newParams = Object.assign({}, {date : new Date()}, params)
	return new Model(newParams); 
}