
/** @typedef {import("express")} express - instance of express module */

/**
 * Handle Errors, render them as images and output that image
 * @param {express.error} error - caught error object 
 * @param {express.req} req 
 * @param {express.res} res 
 */
async function handleError(error, req, res) {
    try {
        console.log(error)
        const svg = require("../util/svgRender")
        const texts = require("../util/texts")
        let text = texts.getBundle(req)
        let isPng = false
        if (req.query.png) { isPng = true }
        let itemHeight = 45
        let itemDelay = 450

        let errorString = ''
        if (error.error) {
            errorString = error.error
        } else {
            errorString = error.toString()
        }

        const xmlescape = require('xml-escape')
        const text_wrapper_lib = require('text-wrapper')
        const wrapper = text_wrapper_lib.wrapper
        const wrappedOutput = wrapper(errorString, { wrapOn: 70 })
        let wrappedArray = wrappedOutput.split("\n")
        let items = []
        for (let item of wrappedArray) {
            items.push(await svg.svgErrorDetails(itemHeight, itemDelay, xmlescape(item), isPng))
            itemHeight += 15
            itemDelay += 200
        }

        let body =
            svg.svgHeader(500, 150) +
            svg.svgStyles(
                svg.svgStyleHeader(),
                svg.svgStyleBold(),
                svg.svgStyleError(),
                svg.svgStyleStagger(),
                svg.svgStyleAnimate()
            ) +
            svg.svgBackground() +
            await svg.svgErrorHeader(text.getText('errorTitle')) +
            svg.svgMainContent(items) +
            svg.svgEnd()
        if (req.query.png) {
            const sharp = require('sharp')
            const png = await sharp(Buffer.from(body)).png().toBuffer()
            res.type("image/png").status(200).send(png)
        } else {
            res.type("image/svg+xml").status(200).send(body)
        }
    } catch (error) {
        app.logger.error(error)
        res.status(500).send(error.toString())
    }
}
module.exports.handleError = handleError

/** @typedef {import("express")} express - instance of express module */

/**
 * Handle Errors, render them as images and output that image
 * @param {express.error} error - caught error object 
 * @param {express.req} req 
 * @param {express.res} res 
 */
async function handleErrorDevtoberfest(error, req, res) {
    try {
        console.log(error)
        const svg = require("../util/svgRender")
        const texts = require("../util/texts")
        const devtoberfest = require("../routes/devtoberfest")

        let text = texts.getBundle(req)
        let isPng = false
        if (req.query.png) { isPng = true }
        let itemHeight = 220
        let itemDelay = 450

        let errorString = ''
        if (error.error) {
            errorString = error.error
        } else {
            errorString = error.toString()
        }

        const xmlescape = require('xml-escape')
        const text_wrapper_lib = require('text-wrapper')
        const wrapper = text_wrapper_lib.wrapper
        const wrappedOutput = wrapper(errorString, { wrapOn: 70 })
        let wrappedArray = wrappedOutput.split("\n")
        let items = []
        for (let item of wrappedArray) {
            items.push(await svg.svgDevtoberfestCRTText(itemHeight, 120, itemDelay,
                xmlescape(item), isPng))
            itemHeight += 20
            itemDelay += 200
        }

        let body =
            svg.svgHeader(1347, 1612) +

            svg.svgDevtoberfestBackground() +
            svg.svgDevtoberfestItem(0, 0, 0, await svg.loadImageB64('../images/devtoberfest/BackgroundOKG.png'), 1007, 1347, isPng) +
            //Devtoberfest Gameboard title
            svg.svgDevtoberfestItem(80, 50, 750, await svg.loadImageB64('../images/devtoberfest/Group_13.png'), 103, 668, isPng) +

            svg.svgMainContent(items) +

            //Devtoberfest Logo            
            `<a xlink:href="https://developers.sap.com/devtoberfest.html" target="_blank">` +
            `<title>Devtoberfest</title>` +
            svg.svgDevtoberfestItem(1250, 925, 0, await svg.loadImageB64('../images/devtoberfest/Frame.png'), 192, 212, isPng) +
            `</a>` +
            //SAP Logo
            `<a xlink:href="https://sap.com/" target="_blank">` +
            `<title>SAP Logo</title>` +
            svg.svgDevtoberfestItem(1350, 1180, 0, await svg.loadImageB64('../images/devtoberfest/sap.svg'), 64, 128, isPng, null, null, null, 'sap.svg') +
            `</a>` +
            //Bottom CRT Frame
            svg.svgDevtoberfestItem(1507, 0, 0, await svg.loadImageB64('../images/devtoberfest/okBottom.png'), 105, 1347, isPng) +
            //Blinking LED
            `<g transform="translate(1180, 1581)"class="led-green" ><rect class="led-green"  ></rect></g>` +
            svg.svgEnd()
        if (req.query.png) {
            const sharp = require('sharp')
            const png = await sharp(Buffer.from(body)).png().toBuffer()
            res.type("image/png").status(200).send(png)
        } else {
            res.type("text/html").status(200).send(devtoberfest.renderHTMLBody(body))
        }
    } catch (error) {
        console.error(error)
        res.status(500).send(error.toString())
    }
}
module.exports.handleErrorDevtoberfest = handleErrorDevtoberfest