module.exports = (app) => {

    const svg = require("../util/svgRender")
    const texts = require("../util/texts")
    const khoros = require("../util/khoros")
    
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

            const scnItems = await khoros.callUserAPI(req.params.scnId)
            const userName = khoros.handleUserName(req.params.scnId, scnItems)

            let text = texts.getBundle(req)
            let itemHeight = 43
            let itemDelay = 250

            let itemsTemp = badgeSelection(req.params, scnItems)
            let items = []
            let width = 0

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

            const scnItems = await khoros.callUserAPI(req.params.scnId)
            const userName = khoros.handleUserName(req.params.scnId, scnItems)

            let text = texts.getBundle(req)
            let itemHeight = 15
            let itemDelay = 250

            let itemsTemp = badgeSelection(req.params, scnItems)
            let items = []
            let width = 50

            for (let scnItem of itemsTemp) {
                items.push(await svg.svgBadgeItemGroups(itemHeight, width, itemDelay += 200, scnItem.badge.icon_url, svg.escapeHTML(scnItem.badge.title), isPng))
                if (width == 50) {
                    width = 100
                } else {
                    width += 50
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

    /**
     * @swagger
     * /showcaseSingleBadge/{scnId}:
     *   get:
     *     summary: Retrieve A Single Showcase Badge for a single SAP Community User
     *     description: Retrieve A Single Showcase Badges for a single SAP Community User
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
     *       - in: query
     *         name: png
     *         type: boolean
     *         description: Output PNG graphic instead of SVG
     *         default: false
     *     responses:
     *       200:
     *         description: A single user.
     */
    app.get('/showcaseSingleBadge/:scnId/:badge1?', async (req, res) => {
        try {
            let isPng = false
            if (req.query.png || req.query.gif) { isPng = true }

            const scnItems = await khoros.callUserAPI(req.params.scnId)
            const userName = khoros.handleUserName(req.params.scnId, scnItems)

            let text = texts.getBundle(req)
            let itemHeight = 15
            let itemDelay = 250

            let itemsTemp = badgeSelection(req.params, scnItems)
            let items = []
            let width = 50

            for (let scnItem of itemsTemp) {
                items.push(await svg.svgBadgeItem(itemHeight, width, itemDelay += 200, scnItem.badge.icon_url, svg.escapeHTML(scnItem.badge.title), isPng))
                if (width == 50) {
                    width = 100
                } else {
                    width += 50
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
                svg.svgBackgroundLight() +
                await svg.svgContentHeaderGroups(userName, true) +
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

    function badgeSelection(params, scnItems) {
        let itemsTemp = []
        let itemsTemp2 = []
        //User Selected Badges via URL parameter
        if (params.badge1) {
            for (let scnItem of scnItems.data.user_badges.items) {
                if (scnItem.badge.id === params.badge1) {
                    itemsTemp2[0] = scnItem
                    // itemsTemp.splice(0, 0, scnItem)
                }
                if (scnItem.badge.id === params.badge2) {
                    itemsTemp2[1] = scnItem
                    //itemsTemp.splice(1, 0, scnItem)
                }
                if (scnItem.badge.id === params.badge3) {
                    itemsTemp2[2] = scnItem
                    // itemsTemp.splice(2, 0, scnItem)
                }
                if (scnItem.badge.id === params.badge4) {
                    itemsTemp2[3] = scnItem
                    //itemsTemp.splice(3, 0, scnItem)
                }
                if (scnItem.badge.id === params.badge5) {
                    itemsTemp2[4] = scnItem
                    // itemsTemp.splice(4, 0, scnItem)
                }
            }

            itemsTemp = itemsTemp2
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
        return itemsTemp
    }
}

