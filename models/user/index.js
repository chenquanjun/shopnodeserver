const mongoose = require("mongoose")
const Schema = mongoose.Schema

const userSchema = new Schema({
    userId: Number, //用户id
    userName: String, //用户名
    nickName : String, //用户昵称
    password : String, //密码
    salt : String, //盐
    imageId : Number, //头像
    balance : Number, //余额
})

const Model = exports.User = mongoose.model('user', userSchema)

exports.create = (params) => {
    const newParams = Object.assign({balance : 0}, params)
    return new Model(newParams); 
}