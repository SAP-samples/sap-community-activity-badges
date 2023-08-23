module.exports = (app) => {

    const svg = require("../util/svgRender")
    const texts = require("../util/texts")

    app.get('/showcaseBadgesGroups', async (req, res) => {
        return res.redirect("/")
    })

    /**
     * @swagger
     * /showcaseBadgesGroups/{scnId}:
     *   get:
     *     summary: Retrieve Showcase Badges for a single SAP Community User
     *     description: Retrieve Showcase Badges for a single SAP Community User
     *     parameters:
     *       - in: path
     *         name: scnId
     *         required: true
     *         description: String ID of the user to retrieve - old SAP Community ID
     *         default: thomas.jung
     *         schema:
     *           type: string
     *       - in: query
     *         name: png
     *         type: boolean
     *         description: Output PNG graphic instead of SVG
     *         default: false
     *     responses:
     *       200:
     *         description: A single user.
     */
    app.get('/showcaseBadgesGroups/:scnId', async (req, res) => {
        try {
            let isPng = false
            if (req.query.png || req.query.gif) { isPng = true }

            const request = require('then-request')
            const urlBadges = `https://people-api.services.sap.com/rs/showcaseBadge/${req.params.scnId}`
            const urlProfile = `https://content.services.sap.com/cse/search/user?name=${req.params.scnId}&sort=published:desc&size=1&page=0`

            let [itemsRes, profileRes] = await Promise.all([
                request('GET', encodeURI(urlBadges)),
                request('GET', encodeURI(urlProfile))
            ])
            const scnItems = JSON.parse(itemsRes.getBody())
            const scnProfile = JSON.parse(profileRes.getBody())

            let userName = req.params.scnId
            if (scnProfile._embedded && scnProfile._embedded.contents[0] && scnProfile._embedded.contents[0].author) {
                userName = scnProfile._embedded.contents[0].author.displayName
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
            const sharp = require('sharp')
            if (req.query.png) {
                const png = await sharp(Buffer.from(body)).png().toBuffer()
                res.type("image/png").status(200).send(png)
            } else if (req.query.gif) {
                const gif = await sharp(Buffer.from(body), { animated: true }).gif({ loop: 1 }).toBuffer()
                console.log(`Output GIF`)
                res.type("image/gif").status(200).send(gif)
            }
            else {
                res.type("image/svg+xml").status(200).send(body)
            }
        } catch (error) {
            app.logger.error(error)
            const errHandler = require("../util/error")
            return await errHandler.handleError(error, req, res)
        }

    })
}