const mongoose = require("mongoose")
const Schema = mongoose.Schema

const recordSchema = new Schema({
    recordId: Number,
    userId: Number,
    pid : Number,
    buyDate : { type: Date },
    buyCount : Number,
    buyIds : [Number],
})

const Model = exports.Record = mongoose.model('record', recordSchema)

exports.create = (params) => {
    const newParams = Object.assign({}, params)
    return new Model(newParams); 
}