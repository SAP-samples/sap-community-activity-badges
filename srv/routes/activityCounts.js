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
    app.get('/activity', async (req, res) =>{
        return res.redirect("/")
    })

    /**
     * @swagger
     * /activity/{scnId}:
     *   get:
     *     summary: Retrieve a activity details for a single SAP Community User
     *     description: Retrieve a activity details for a single SAP Community User
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
    app.get('/activity/:scnId', nocache, async (req, res) => {
        try {
            let isPng = false
            if (req.query.png || req.query.gif) { isPng = true }

            const request = require('then-request')

            const scnItems = await khoros.callUserAPI(req.params.scnId)
            const userName = khoros.handleUserName(req.params.scnId, scnItems)

            let text = texts.getBundle(req)
            let numFormat = new Intl.NumberFormat(texts.getLocale(req))
            let itemHeight = 45
            let itemDelay = 450
    
            let body =
                svg.svgHeader(500, 150) +
                svg.svgStyles(
                    svg.svgStyleHeader(),
                    svg.svgStyleBold(),
                    svg.svgStyleStat(),
                    svg.svgStyleStagger(),
                    svg.svgStyleIcon(),
                    svg.svgStyleAnimate()
                ) +
                svg.svgBackground() +
                await svg.svgContentHeader(text.getText('statsTitle', [userName, `'`])) +
                svg.svgMainContent(
                    svg.svgActivityItem(itemHeight, itemDelay, await svg.loadImageB64('../images/blog.png'), 'Posts', numFormat.format(scnItems.data.metrics.posts), isPng),
                    svg.svgActivityItem(itemHeight += 20, itemDelay += 200, await svg.loadImageB64('../images/comment.png'), 'Rank', scnItems.data.rank.name, isPng),
                   // svg.svgActivityItem(itemHeight += 20, itemDelay += 200, await svg.loadImageB64('../images/answer.png'), text.getText('answers'), numFormat.format(scnItems.answers), isPng),
                   // svg.svgActivityItem(itemHeight += 20, itemDelay += 200, await svg.loadImageB64('../images/question.png'), text.getText('questions'), numFormat.format(scnItems.questions), isPng),
                ) +
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