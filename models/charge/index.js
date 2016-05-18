const mongoose = require("mongoose")
const Schema = mongoose.Schema

const chargeSchema = new Schema({
    chargeId: Number, //充值id
    userId: Number, //充值用户id
    chargeNum : Number, //充值数值
    chargeDate : { type: Date }, //充值日期
    source : Number, //充值来源
    sourceInfo : String, //充值来源附带的相关信息（交易单号等等）
})

const Model = exports.Charge = mongoose.model('charge', chargeSchema)

exports.create = (params) => {
    const newParams = Object.assign({chargeDate : new Date()}, params)
    return new Model(newParams); 
}