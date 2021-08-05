var TextBundle = require("@sap/textbundle").TextBundle
var langparser = require("accept-language-parser")

/**
 * Get Locale from HTTP Request Header
 * @param {*} req - HTTP Request object from Express
 * @returns {string}
 */
function getLocale(req) {
	var lang = req.headers["accept-language"]
	if (!lang) {
		return
	}
	var arr = langparser.parse(lang)
	if (!arr || arr.length < 1) {
		return
	}
	var locale = arr[0].code
	if (arr[0].region) {
		locale += "-" + arr[0].region
	}
	return locale
}
module.exports.getLocale = getLocale

/**
 * Get Text Bundle from sap/textbundle
 * @param {*} req - HTTP Request object from Express
 * @returns 
 */
function getBundle(req){
    const path = require("path")
    return new TextBundle(path.resolve(__dirname, "../_i18n/messages"), getLocale(req))
}
module.exports.getBundle = getBundle