const mongoose = require("mongoose")
const Schema = mongoose.Schema

const userSchema = new Schema({
    userId: Number,
    userName: String,
    nickName : String,
    password : String,
    salt : String,
    imageId : Number,
    balance : Number
})

const Model = exports.User = mongoose.model('user', userSchema)

exports.create = (params) => {
    const newParams = Object.assign({balance : 0}, params)
    return new Model(newParams); 
}