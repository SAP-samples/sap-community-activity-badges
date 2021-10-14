module.exports = (app) => {

    const svg = require("../util/svgRender")
    const texts = require("../util/texts")
    function nocache(req, res, next) {
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate')
        res.header('Expires', '-1')
        res.header('Pragma', 'no-cache')
        next()
    }
    app.get('/activity', async (req, res) =>{
        return res.redirect("/")
    })

    app.get('/activity/:scnId', nocache, async (req, res) => {
        try {
            let isPng = false
            if (req.query.png) { isPng = true }

            const request = require('then-request')
            const urlActivity = `https://content.services.sap.com/cse/search/user-counts?name=${req.params.scnId}`
            const urlProfile = `https://searchproxy.api.community.sap.com/api/v1/search?limit=20&orderBy=UPDATE_TIME&order=DESC&contentTypes%5B0%5D=people&authorId=${req.params.scnId}`

            let [itemsRes, profileRes] = await Promise.all([
                request('GET', urlActivity),
                request('GET', urlProfile)
            ])
            const scnItems = JSON.parse(itemsRes.getBody())
            const scnProfile = JSON.parse(profileRes.getBody())

            let userName = req.params.scnId
            if (scnProfile.contentItems[0]) {
                userName = scnProfile.contentItems[0].title
            }
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
                    svg.svgActivityItem(itemHeight, itemDelay, await svg.loadImageB64('../images/blog.png'), text.getText('posts'), numFormat.format(scnItems.blogposts), isPng),
                    svg.svgActivityItem(itemHeight += 20, itemDelay += 200, await svg.loadImageB64('../images/comment.png'), text.getText('comments'), numFormat.format(scnItems.comments), isPng),
                    svg.svgActivityItem(itemHeight += 20, itemDelay += 200, await svg.loadImageB64('../images/answer.png'), text.getText('answers'), numFormat.format(scnItems.answers), isPng),
                    svg.svgActivityItem(itemHeight += 20, itemDelay += 200, await svg.loadImageB64('../images/question.png'), text.getText('questions'), numFormat.format(scnItems.questions), isPng),
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