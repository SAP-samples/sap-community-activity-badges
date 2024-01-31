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

    /**
     * @swagger
     * /showcaseBadges/{scnId}:
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
    app.get('/showcaseBadges/:scnId/:badge1?/:badge2?/:badge3?/:badge4?/:badge5?', nocache, async (req, res) => {
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
            let itemHeight = 43
            let itemDelay = 250

            let itemsTemp = []
            let items = []
            let width = 0
            //User Selected Badges via URL parameter
            if (req.params.badge1) {
                for (let scnItem of scnItems.data.user_badges.items) {
                    if (scnItem.badge.id === req.params.badge1 ||
                        scnItem.badge.id === req.params.badge2 ||
                        scnItem.badge.id === req.params.badge3 ||
                        scnItem.badge.id === req.params.badge4 ||
                        scnItem.badge.id === req.params.badge5) {
                        itemsTemp.push(scnItem)
                    }
                }
                //No User Selection, just display the first 5 badges on the profile
            } else {
                for (let index = 0; index < scnItems.data.user_badges.items.length; index++) {
                    if (index > 4) {
                        break
                    }
                    const scnItem = scnItems.data.user_badges.items[index]
                    itemsTemp.push(scnItem)
                }
            }

            for (let scnItem of itemsTemp) {
                if (scnItem.badge.title.length > 20) {
                    const text_wrapper_lib = require('text-wrapper')
                    const wrapper = text_wrapper_lib.wrapper
                    const wrappedOutput = wrapper(svg.escapeHTML(scnItem.badge.title), { wrapOn: 20 })
                    let wrappedArray = wrappedOutput.split("\n")
                    let secondHeight = itemHeight
                    for (let numItems = 0; numItems < wrappedArray.length; numItems++) {
                        if (numItems === 0) {
                            items.push(await svg.svgBadgeItem(secondHeight, width, itemDelay += 200, scnItem.badge.icon_url, wrappedArray[numItems], isPng))
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
                    items.push(await svg.svgBadgeItem(itemHeight, width, itemDelay += 200, scnItem.badge.icon_url, svg.escapeHTML(scnItem.badge.title), isPng))
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

            const sharp = require('sharp')
            if (req.query.png) {
                const png = await sharp(Buffer.from(body), { svg: true, animated: true, pages: -1 }).png({ animated: true }).toBuffer()
                console.log(`Output PNG`)
                res.type("image/png").status(200).send(png)
            } else if (req.query.gif) {
                const gif = await sharp(Buffer.from(body), { svg: true, animated: true, pages: -1 }).gif({ loop: 1, animated: true }).toBuffer()
                console.log(`Output GIF`)
                res.type("image/gif").status(200).send(gif)
            }
            else {
                console.log(`Output SVG`)
                res.type("image/svg+xml").status(200).send(body)
            }
        } catch (error) {
            app.logger.error(error)
            const errHandler = require("../util/error")
            return await errHandler.handleError(error, req, res)
        }

    })
}