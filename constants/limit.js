const params = {
	PRODUCT_QUERY_MAX_NUM : 10, //每次查询最大产品数目
	PRODUCT_PERIOD_LIMIT_TIME : 24 * 60 * 60 * 1000, //每期商品的时间限制

	PERIOD_QUERY_MAX_NUM : 10,

	SALT_LENGTH : 32,
	SESSION_EXPIRE_TIME : 2 * 60 * 60 * 10000,
}

module.exports = params