const mongoose = require("mongoose")
const Schema = mongoose.Schema

const periodSchema = new Schema({
    gid: Number, //产品id
    pid: Number, //期数
    needNum : Number, //需要购买数
    buyNum : Number, //当前购买数
    status : Number,  //状态
    luckyId : Number, //幸运号码
    luckyUserId : Number, //中奖用户
    remainIds : [Number], //剩余id
    startDate : { type: Date }, //期数开始时间
    limitDate : { type: Date }, //截至购买时间
    finalDate : { type: Date }, //最后购买时间
    recordList : [Number], //记录id
    totalFigureNum : Number, //计算结果

})

const Model = exports.Period = mongoose.model('period', periodSchema)

//创建
exports.create = (params) => {
    const newParams = Object.assign({}, params)
    return new Model(newParams); 
}