const mongoose = require("mongoose")
const Schema = mongoose.Schema

const recordSchema = new Schema({
    recordId: Number, //记录id
    userId: Number, //用户id
    pid : Number, //购买期数id 
    buyDate : { type: Date }, //购买日期
    buyNum : Number, //购买数量
    buyIds : [Number], //购买id
})

const Model = exports.Record = mongoose.model('record', recordSchema)

exports.create = (params) => {
    const newParams = Object.assign({buyDate : new Date()}, params)
    return new Model(newParams); 
}