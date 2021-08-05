
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
        if(error.error){
            errorString = error.error
        }else{
            errorString = error.toString()
        }

        const xmlescape = require('xml-escape')
        const text_wrapper_lib = require('text-wrapper')   
        const wrapper = text_wrapper_lib.wrapper
        const wrappedOutput = wrapper(errorString, {wrapOn: 70})
        let wrappedArray = wrappedOutput.split("\n")
        let items = []
        for(let item of wrappedArray){
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
            svg.svgMainContent(items)+
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