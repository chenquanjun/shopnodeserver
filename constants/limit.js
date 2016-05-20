const params = {
	//product
	PRODUCT_QUERY_MAX_NUM : 10, //每次查询最大产品数目
	PRODUCT_PERIOD_LIMIT_TIME : 24 * 60 * 60 * 1000, //每期商品的时间限制

	//period
	PERIOD_QUERY_MAX_NUM : 10, //每次查询最大期数数目
	PERIOD_FIGURE_TIME : 10 * 1000, //最后一个购买结束后结算期数等待时间

	//charge
	CHARGE_QUERY_MAX_NUM : 10, //每次查询最大充值数目
 
	//record
	RECORD_QUERY_MAX_NUM : 10, //每次查询最大纪录数目
	RECORD_FIGURE_QUERY_MAX_NUM : 100,  //100条记录

 	//user
	SALT_LENGTH : 32, //加密盐的长度
	SESSION_EXPIRE_TIME : 2 * 60 * 60 * 10000, //session超时时间
	USER_QUERY_MAX_NUM : 10, //每次查询最大用户数目
}

module.exports = params