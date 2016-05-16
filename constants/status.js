const params = {
	product : {
		Normal : 0,
		Invalid : 1,
	},
	period :  {
		Buy : 1, //可购买 
		Figure : 2, //即将揭晓
		Finish : 3, //已结束
		Failed : 4,
		UserStop : 5,
	}
}

module.exports = params