
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
        const svg = require("../util/svgRender")
        const texts = require("../util/texts")
        const devtoberfest = require("../routes/devtoberfest")

        let text = texts.getBundle(req)
        let isPng = false
        if (req.query.png) { isPng = true }
        let itemHeight = 220
        let itemDelay = 450

        let errorString = await getDevtoberfestText(error, req)

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

        if (error.name && error.name === 'No SCN ID' || error.statusCode && error.statusCode === 404){
            items.push(svg.svgDevtoberfestCRTLink(itemHeight, 120, itemDelay,
                text.getText('devtoberfest.profileTutorial'),
                `https://developers.sap.com/tutorials/community-profile.html`, isPng))
                itemHeight += 20
                itemDelay += 200
        }
        if (error.name && error.name === 'Not Registered' || error.statusCode && error.statusCode === 404){
            items.push(svg.svgDevtoberfestCRTLink(itemHeight, 120, itemDelay,
                text.getText('devtoberfest.regLink'),
                `https://groups.community.sap.com/t5/devtoberfest/gh-p/Devtoberfest`, isPng))
                itemHeight += 20
                itemDelay += 200
        }
/*         if (error.name && error.name === 'Not Registered' || error.statusCode && error.statusCode === 404){
            items.push(svg.svgDevtoberfestCRTLink(itemHeight, 120, itemDelay,
                text.getText('devtoberfest.regTutorial'),
                `https://blogs.sap.com/2021/09/23/devtoberfest-2021-one-week-to-go/#reg`, isPng))
                itemHeight += 20
                itemDelay += 200
        } */
        if (error.statusCode && error.statusCode === 404){
            items.push(svg.svgDevtoberfestCRTLink(itemHeight, 120, itemDelay,
                text.getText('devtoberfest.privacy'),
                `https://www.sap.com/about/legal/privacy.html`, isPng))
        }

        let body =
            svg.svgHeader(1347, 1612) +

            svg.svgDevtoberfestBackground() +
            svg.svgDevtoberfestItem(0, 0, 0, await svg.loadImageB64('../images/devtoberfest/BackgroundOKG.png'), 1007, 1347, isPng) +
            //Devtoberfest Gameboard title
            svg.svgDevtoberfestItem(80, 50, 0, await svg.loadImageB64('../images/devtoberfest/Group_13.png'), 103, 668, isPng) +

            svg.svgMainContent(items) +

            //Devtoberfest Logo            
            `<a xlink:href="https://groups.community.sap.com/t5/devtoberfest/gh-p/Devtoberfest" target="_blank">` +
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

/**
 * Format Devtoberfest texts
 * @param {express.error} error - caught error object 
 * @param {express.req} req 
 */
async function getDevtoberfestText(error, req){
    const texts = require("../util/texts")
    let text = texts.getBundle(req)
    let errorString = ''
    if (error.name && error.name === 'No SCN ID'){
        errorString = text.getText('devtoberfest.missingID')
    }
    else if (error.name && error.name === 'Not Registered'){
        errorString = text.getText('devtoberfest.missingReg')
    }
    else if (error.statusCode && error.statusCode === 404){
        errorString = errorString = text.getText('devtoberfest.idNotFound')
    }
    else if (error.error) {
        errorString = error.error
    } else {
        errorString = error.toString()
    }

    return errorString
}

/**
 * Handle Errors, render them as images and output that image
 * @param {express.error} error - caught error object 
 * @param {express.req} req 
 * @param {express.res} res 
 */
 async function handleErrorDevtoberfestText(error, req, res) {
    try {
        const texts = require("../util/texts")
        let text = texts.getBundle(req)
        let errorObj = {}
        let errorString = await getDevtoberfestText(error, req)
        errorObj.errorString = errorString

        if (error.name && error.name === 'No SCN ID' || error.statusCode && error.statusCode === 404){
            errorObj.profile = text.getText('devtoberfest.profileTutorial')
            errorObj.profileURL = `https://developers.sap.com/tutorials/community-profile.html`
        }
         if (error.name && error.name === 'Not Registered' || error.statusCode && error.statusCode === 404){
            errorObj.reg = text.getText('devtoberfest.regLink')
            errorObj.regURL = `https://www.eventbrite.com/e/168612930815`
        }
        if (error.name && error.name === 'Not Registered' || error.statusCode && error.statusCode === 404){
            errorObj.regTutorial = text.getText('devtoberfest.regTutorial')
            errorObj.regTutorialURL = `https://blogs.sap.com/2021/09/23/devtoberfest-2021-one-week-to-go/#reg`
        }
        if (error.statusCode && error.statusCode === 404){
            errorObj.privacy =  text.getText('devtoberfest.privacy')
            errorObj.privacyURL = `https://www.sap.com/about/legal/privacy.html`
        } 
        console.error(errorObj)
        res.type("application/json").status(200).send(JSON.stringify(errorObj))

    } catch (error) {
        console.error(error)
        res.status(500).send(error.toString())
    }
}
module.exports.handleErrorDevtoberfestText = handleErrorDevtoberfestText