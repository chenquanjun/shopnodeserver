"use strict";
const params = {
	UNDEFINED : {
		errNum : 0,
		errStr : 'error unknown',
	},


	//product
	PRODUCT_NOT_EXIST : {
		errNum : 101,
		errStr : 'product not exist',
	},
	PRODUCT_STATUS_ERROR : {
		errNum : 102,
		errStr : 'product status error',
	},
	PRODUCT_ADD_ERROR : {
		errNum : 103,
		errStr : 'product info error, cannot added',
	},

	//charge
	CHARGE_NUM_ERROR : {
		errNum : 201,
		errStr : 'charge num out of range'
	},

	//image
	IMAGE_PARAMS_NOT_ARRAY : {
		errNum : 301,
		errStr : 'images params not array',
	},

	//period
	PERIOD_BUY_NUM_ERROR : {
		errNum : 401,
		errStr : 'period buy num out of range',
	},
	PERIOD_PID_ERROR : {
		errNum : 402,
		errStr : 'period pid error',
	},
	PERIOD_INFO_NOT_EXIST : {
		errNum : 403,
		errStr : 'period info not exist',
	},
	PERIOD_STATUS_NOT_BUY : {
		errNum : 404,
		errStr : 'period status not buy',
	},
	PERIOD_REMAIN_ID_NUM_ERROR : {
		error : 405,
		errStr : 'period remain id number not match',
	},
	PERIOD_REMAIN_ID_NOT_ENOUGH : {
		error : 406,
		errStr : 'period remain id not enough',
	},
	PERIOD_ALREADY_TIMEOUT : {
		error : 407,
		errStr : 'period already timeout',
	},
	PERIOD_STATUS_FAILED : {
		errNum : 408,
		errStr : 'period status failed',
	},
	PERIOD_STATUS_STOP : {
		errNum : 409,
		errStr : 'period status stop',
	},
	PERIOD_STATUS_NOT_DEFINED : {
		errNum : 410,
		errStr : 'period status not defined'
	},
	PERIOD_LIST_PAGE_ERROR : {
		errNum : 411,
		errStr : 'period list page out of range',
	},
	PERIOD_LIST_QUERY_STATE_ERROR : {
		errNum : 412,
		errStr : 'period list query state error',
	},

	//user
	USER_ADD_BALANCE_ERROR : {
		errNum : 501,
		errStr : 'user add balance out of range',
	},
	USER_BUY_COST_ERROR : {
		errNum : 502,
		errStr : 'user buy cost out of range',
	},
	USER_NOT_LOGIN : {
		errNum : 503,
		errStr : 'user not login',
	},
	USER_INFO_ERROR : {
		errNum : 504,
		errStr : 'user info error',
	},
	USER_LOGIN_TOKEN_OUTDATE : {
		errNum : 505,
		errStr : 'user login token outdate',
	},
	USER_NAME_OR_PASSWORD_ERROR : {
		errNum : 506,
		errStr : 'user name or password error',
	},
	USER_NAME_ALREADY_EXIST : {
		errNum : 507,
		errStr : 'user name already exist',
	},
	USER_ID_NOT_EXIST : {
		errNum : 508,
		errStr : 'user id not exist',
	},
}

exports.getError = (errType, errValue) => {
	let errorInfo = params[errType]
	if (errorInfo) {
		return Object.assign(errorInfo, {errValue : errValue})
	}

	return Object.assign(params['UNDEFINED'], {errValue : errValue, errType : errType})
}