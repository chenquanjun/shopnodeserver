const mongoose = require("mongoose")
const Schema = mongoose.Schema

const productSchema = new Schema({
    gid: Number, //商品id
    name: String, //名字
    imageIds : [Number], //图片id
    price : Number, //价格
    date : { type: Date }, //创建日期 
    status : Number, //状态
})

const Model = exports.Product = mongoose.model('product', productSchema)

exports.create = (params) => {
	const newParams = Object.assign({}, {date : new Date()}, params)
	return new Model(newParams); 
}