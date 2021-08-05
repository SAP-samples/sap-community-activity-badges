/**
 * Get Locale from HTTP Request Header
 * @param {*} req - HTTP Request object from Express
 * @returns {string}
 */
export function getLocale(req: any): string;
/**
 * Get Text Bundle from sap/textbundle
 * @param {*} req - HTTP Request object from Express
 * @returns
 */
export function getBundle(req: any): TextBundle;
import TextBundle_1 = require("@sap/textbundle");
import TextBundle = TextBundle_1.TextBundle;
