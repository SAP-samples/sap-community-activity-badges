module.exports = (app) => {

    const svg = require("../util/svgRender")
    const texts = require("../util/texts")

    app.get('/devtoberfest', async (req, res) => {
        return res.redirect("/")
    })

    app.get('/devtoberfestContest/:scnId', async (req, res) => {
        return res.type("text/html").status(200).send(
            `<img src="../devtoberfest/${req.params.scnId}" height="100%">`
        )
    })

    app.get('/devtoberfest/:scnId', async (req, res) => {
        try {
            let isPng = false
            if (req.query.png) { isPng = true }

            const request = require('then-request')
            const urlBadges = `https://people-api.services.sap.com/rs/badge/${req.params.scnId}?sort=timestamp,desc&size=1000`
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


            let body =
                svg.svgHeader(1347, 1612) +
                await svg.svgDevtoberfestFont() +
                svg.svgStyles(
                    svg.svgStyleDevHeader(),
                    svg.svgStyleBold(),
                    svg.svgStyleStat(),
                    svg.svgStyleStagger(),
                    svg.svgStyleIcon(),
                    svg.svgStyleAnimate()
                ) +
               
                svg.svgDevtoberfestBackground() +
                svg.svgMainContent(
                    svg.svgDevtoberfestItem(0, 0, 0, await svg.loadImageB64('../images/devtoberfest/BackgroundOKG.png'), 1007, 1347, isPng),
                    svg.svgDevtoberfestItem(60, 50, 750, await svg.loadImageB64('../images/devtoberfest/Group_13.png'), 103, 668, isPng),
                    svg.svgDevtoberfestItem(220, 150, 1000, await svg.loadImageB64('../images/devtoberfest/clouds/Group_12b.png'), 692, 983, isPng),

                    svg.svgDevtoberfestItem(220, 1000, 1250, await svg.loadImageB64('../images/devtoberfest/clouds/Group8.png'), 103, 91, isPng,
                    `<animate id="o1" begin="0;o2.end"
                    attributeName="x" from="150" to="0" dur="5s" />
                    <animate id="o2" begin="o1.end" 
                    attributeName="x" from="0" to="150" dur="5s" />`
                    ),

                    svg.svgDevtoberfestItem(600, 95, 1250, await svg.loadImageB64('../images/devtoberfest/clouds/Group10.png'), 103, 91, isPng,
                    `<animate id="o3" begin="0;o4.end"
                    attributeName="y" from="150" to="0" dur="3s" />
                    <animate id="o4" begin="o3.end" 
                    attributeName="y" from="0" to="150" dur="3s" />`
                    ),

                    svg.svgDevtoberfestItem(1250, 1000, 0, await svg.loadImageB64('../images/devtoberfest/Frame.png'), 192, 212, isPng),

                    svg.svgDevtoberfestItem(1507, 0, 0, await svg.loadImageB64('../images/devtoberfest/okBottom.png'), 105, 1347, isPng),

                    svg.svgDevtoberfestTextItem(0, 0, "Test", isPng)
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