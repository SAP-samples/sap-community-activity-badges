module.exports = (app) => {

    const svg = require("../util/svgRender")
    const texts = require("../util/texts")
    function nocache(req, res, next) {
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate')
        res.header('Expires', '-1')
        res.header('Pragma', 'no-cache')
        next()
    }

    app.get('/showcaseBadges', async (req, res) => {
        return res.redirect("/")
    })

    app.get('/showcaseBadges/:scnId', nocache, async (req, res) => {
        try {
            let isPng = false
            if (req.query.png) { isPng = true }

            const request = require('then-request')
            const urlBadges = `https://people-api.services.sap.com/rs/showcaseBadge/${req.params.scnId}`
            const urlProfile = `https://searchproxy.api.community.sap.com/api/v1/search?limit=20&orderBy=UPDATE_TIME&order=DESC&contentTypes%5B0%5D=people&authorId=${req.params.scnId}`

            let [itemsRes, profileRes] = await Promise.all([
                request('GET', urlBadges),
                request('GET', urlProfile)
            ])
            const scnItems = JSON.parse(itemsRes.getBody())
            const scnProfile = JSON.parse(profileRes.getBody())

            let userName = req.params.scnId
            if (scnProfile.contentItems[0]) {
                userName = scnProfile.contentItems[0].title
            }
            let text = texts.getBundle(req)
            let itemHeight = 43
            let itemDelay = 250

            let items = []
            let width = 0
            for (let scnItem of scnItems) {
                if (scnItem.displayName.length > 20) {
                    const text_wrapper_lib = require('text-wrapper')
                    const wrapper = text_wrapper_lib.wrapper
                    const wrappedOutput = wrapper(svg.escapeHTML(scnItem.displayName), { wrapOn: 20 })
                    let wrappedArray = wrappedOutput.split("\n")
                    let secondHeight = itemHeight
                    for (let numItems = 0; numItems < wrappedArray.length; numItems++) {
                        if (numItems === 0) {
                            items.push(await svg.svgBadgeItem(secondHeight, width, itemDelay += 200, encodeURI(scnItem.imageUrl), wrappedArray[numItems], isPng))
                            secondHeight += 20
                        } else if (numItems === 1) {
                            if (wrappedArray.length > 2) {
                                if (wrappedArray[numItems].length > 17) {
                                    wrappedArray[numItems] = wrappedArray[numItems].substring(0, 17) + '...'
                                } else {
                                    wrappedArray[numItems] += '...'
                                }
                            }
                            items.push(await svg.svgBadgeItemSecond(secondHeight, width, itemDelay, wrappedArray[numItems], isPng))
                        }
                    }
                    if (width == 0) {
                        width = 200
                    } else {
                        width = 0
                        itemHeight += 40
                    }
                } else {
                    items.push(await svg.svgBadgeItem(itemHeight, width, itemDelay += 200, encodeURI(scnItem.imageUrl), svg.escapeHTML(scnItem.displayName), isPng))
                    if (width == 0) {
                        width = 200
                    } else {
                        width = 0
                        itemHeight += 40
                    }
                }
            }

            let body =
                svg.svgHeader(500, 175) +
                svg.svgStyles(
                    svg.svgStyleHeader(),
                    svg.svgStyleBold(),
                    svg.svgStyleStat(),
                    svg.svgStyleStagger(),
                    svg.svgStyleIcon(),
                    svg.svgStyleAnimate()
                ) +
                svg.svgBackground() +
                await svg.svgContentHeader(text.getText('badgesShowcaseTitle', [userName, `'`])) +
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
            const errHandler = require("../util/error")
            return await errHandler.handleError(error, req, res)
        }

    })
}