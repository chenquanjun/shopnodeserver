const mongoose = require("mongoose")
const Schema = mongoose.Schema

const productSchema = new Schema({
    gid: Number,
    name: String,
    imageIds : [Number],
    price : Number,
    date : { type: Date }, 
    status : Number,
})

const Model = exports.Product = mongoose.model('product', productSchema)

exports.create = (params) => {
	const newParams = Object.assign({}, {date : new Date()}, params)
	return new Model(newParams); 
}