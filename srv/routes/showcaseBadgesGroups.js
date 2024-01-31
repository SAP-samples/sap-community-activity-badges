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
     *         default: 139
     *         schema:
     *           type: string
     *       - in: path
     *         name: badge1
     *         required: false
     *         description: Unique ID for Badge #1 to display
     *         schema:
     *           type: integer     
     *       - in: path
     *         name: badge2
     *         required: false
     *         description: Unique ID for Badge #2 to display
     *         schema:
     *           type: integer     
     *       - in: path
     *         name: badge3
     *         required: false
     *         description: Unique ID for Badge #3 to display
     *         schema:
     *           type: integer     
     *       - in: path
     *         name: badge4
     *         required: false
     *         description: Unique ID for Badge #4 to display
     *         schema:
     *           type: integer     
     *       - in: path
     *         name: badge5
     *         required: false
     *         description: Unique ID for Badge #5 to display
     *         schema:
     *           type: integer
     *       - in: query
     *         name: png
     *         type: boolean
     *         description: Output PNG graphic instead of SVG
     *         default: false
     *     responses:
     *       200:
     *         description: A single user.
     */
    app.get('/showcaseBadgesGroups/:scnId/:badge1?/:badge2?/:badge3?/:badge4?/:badge5?', async (req, res) => {
        try {
            let isPng = false
            if (req.query.png || req.query.gif) { isPng = true }

            const request = require('then-request')
            const urlBadges = `https://community.sap.com/khhcw49343/api/2.0/users/${req.params.scnId}`

            let itemsRes = await request('GET', encodeURI(urlBadges))
            const scnItems = JSON.parse(itemsRes.getBody())

            let userName = req.params.scnId
            if (scnItems.data) {
                userName = scnItems.data.login
            }
            let text = texts.getBundle(req)
            let itemHeight = 15
            let itemDelay = 250

            let items = []
            let width = 50

            //User Selected Badges via URL parameter
            if (req.params.badge1) {
                for (let scnItem of scnItems.data.user_badges.items) {
                    if (scnItem.badge.id === req.params.badge1 ||
                        scnItem.badge.id === req.params.badge2 ||
                        scnItem.badge.id === req.params.badge3 ||
                        scnItem.badge.id === req.params.badge4 ||
                        scnItem.badge.id === req.params.badge5) {
                        items.push(await svg.svgBadgeItemGroups(itemHeight, width, itemDelay += 200, scnItem.badge.icon_url, svg.escapeHTML(scnItem.badge.title), isPng))
                        if (width == 50) {
                            width = 100
                        } else {
                            width += 50
                        }
                    }
                }
            //No User Selection, just display the first 5 badges on the profile
            } else {
                for (let index = 0; index < scnItems.data.user_badges.items.length; index++) {
                    if (index > 4) {
                        break
                    }
                    const scnItem = scnItems.data.user_badges.items[index]
                    items.push(await svg.svgBadgeItemGroups(itemHeight, width, itemDelay += 200, scnItem.badge.icon_url, svg.escapeHTML(scnItem.badge.title), isPng))
                    if (width == 50) {
                        width = 100
                    } else {
                        width += 50
                    }
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