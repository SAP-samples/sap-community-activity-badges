module.exports = (app) => {

    const svg = require("../util/svgRender")
    const texts = require("../util/texts")

    app.get('/showcaseBadgesGroups', async (req, res) =>{
        return res.redirect("/")
    })

    app.get('/showcaseBadgesGroups/:scnId', async (req, res) => {
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
            let itemHeight = 15
            let itemDelay = 250

            let items = []
            let width = 50
            for (let scnItem of scnItems) {
                    items.push(await svg.svgBadgeItemGroups(itemHeight, width, itemDelay += 200, scnItem.imageUrl, svg.escapeHTML(scnItem.displayName), isPng))
                    if (width == 50) {
                        width = 100
                    } else {
                        width += 50
                        //itemHeight += 40
                    }                
            }

            let body =
                svg.svgHeader(500, 48) +//175) +
                svg.svgStyles(
                    svg.svgStyleHeader(),
                    svg.svgStyleBold(),
                    svg.svgStyleStat(),
                    svg.svgStyleStagger(),
                    svg.svgStyleIcon(),
                    svg.svgStyleAnimate()
                ) +
                svg.svgBackground() +
                await svg.svgContentHeaderGroups(text.getText('badgesShowcaseTitle', [userName, `'`])) +
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