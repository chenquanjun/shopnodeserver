//db
const mongoose = require('mongoose')
exports.init = () => {
	console.warn("data base init")
	mongoose.connect('mongodb://localhost/test')
}