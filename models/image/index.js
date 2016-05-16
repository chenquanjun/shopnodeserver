const mongoose = require("mongoose")
const Schema = mongoose.Schema

const imageSchema = new Schema({
    imageId: Number,
    image : String,
    date : { type: Date }, 
})

const Model = exports.Image = mongoose.model('image', imageSchema)

//创建
exports.create = (params) => {
	const newParams = Object.assign({}, {date : new Date()}, params)
	return new Model(newParams); 
}