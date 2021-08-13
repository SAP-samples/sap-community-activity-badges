module.exports = (app) => {

    const texts = require("../util/texts")

    app.get('/devtoberfest', async (req, res) => {
        return res.redirect("/")
    })

    app.get('/devtoberfestContest/:scnId', async (req, res) => {
        try {
            let profile = await getSCNProfile(req)

            let body = await renderSVG(false, profile)
            return res.type("text/html").status(200).send(renderHTMLBody(body))
        } catch (error) {
            app.logger.error(error)
            const errHandler = require("../util/error")
            return await errHandler.handleError(error, req, res)
        }
    })

    app.get('/devtoberfest/:scnId', async (req, res) => {
        try {
            let isPng = false
            if (req.query.png) { isPng = true }
            let profile = await getSCNProfile(req)

            let body = await renderSVG(isPng, profile)
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

async function getSCNProfile(req) {
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

    let profile = { userName: userName, scnId: req.params.scnId, badges: scnItems, points: 5000, level: 2 }
    return profile
}

function renderHTMLBody(svg) {
    return `
    <html xmlns="http://www.w3.org/1999/xhtml"><head> 
<title>Devtoberfest 2021</title>
<style type="text/css" media="screen">
body { background:#eee; margin:0 }
svg {
display:block; border:1px solid #ccc; position:absolute;
top:0%; left:0%; width:99%; height:99%; background:#fff;
}
.face { stroke:#000; stroke-width:20px; stroke-linecap:round }
</style>
<style type="text/css">
    @namespace svg url(http://www.w3.org/2000/svg);
html,body,svg { height:100% }
/* As SVG does not provide a default visual style for links,
it's considered best practice to add some */

@namespace svg url(http://www.w3.org/2000/svg);
/* Necessary to select only SVG <a> elements, and not also HTML’s.
See warning below */

svg|a:link, svg|a:visited {
cursor: pointer;
}

svg|a text,
text svg|a {
fill: blue; /* Even for text, SVG uses fill over color */
text-decoration: underline;
}

svg|a:hover, svg|a:active {
outline: dotted 1px blue;
}
</style>
</head><body>
${svg}
</body></html>
    `
}

async function renderSVG(isPng, profile) {
    const svg = require("../util/svgRender")
    let items = []

    //Gameboard Header
    let itemHeight = 220
    let itemDelay = 450
    items.push(svg.svgDevtoberfestCRTText(itemHeight, 120, itemDelay,
        `${profile.userName} track your`, isPng))
    itemHeight += 20
    itemDelay += 50
    items.push(svg.svgDevtoberfestCRTText(itemHeight, 120, itemDelay,
        `contest progress here based upon`, isPng))
    itemHeight += 20
    itemDelay += 50
    items.push(svg.svgDevtoberfestCRTLink(itemHeight, 120, itemDelay,
        `your public SCN Profile`,
        `https://people.sap.com/${profile.scnId}#reputation`, isPng))

    //First Column Text - How to Play
    itemHeight = 1095
    itemDelay = 450
    items.push(svg.svgDevtoberfestTextHeader(1050, 60, itemDelay,
        `HOW TO PLAY`, isPng))

    items.push(svg.svgDevtoberfestTextItem(itemHeight, 60, itemDelay,
        `It’s simple.  Register for`, isPng))
    itemHeight += 18
    itemDelay += 50
    items.push(svg.svgDevtoberfestTextLink(itemHeight, 60, itemDelay,
        `Devtoberfest HERE`,
        `https://developers.sap.com/devtoberfest.html`, isPng))
    itemHeight += 18
    itemDelay += 50
    items.push(svg.svgDevtoberfestTextItem(itemHeight, 60, itemDelay,
        `Complete activities like`, isPng))
    itemHeight += 18
    itemDelay += 50
    items.push(svg.svgDevtoberfestTextItem(itemHeight, 60, itemDelay,
        `tutorials or event surveys.`, isPng))
    itemHeight += 36
    itemDelay += 50
    items.push(svg.svgDevtoberfestTextItem(itemHeight, 60, itemDelay,
        `Contribute to a project or `, isPng))
    itemHeight += 18
    itemDelay += 50
    items.push(svg.svgDevtoberfestTextItem(itemHeight, 60, itemDelay,
        `make your own open source project.`, isPng))
    itemHeight += 36
    itemDelay += 50
    items.push(svg.svgDevtoberfestTextItem(itemHeight, 60, itemDelay,
        `Please reference the published`, isPng))
    itemHeight += 18
    itemDelay += 50
    items.push(svg.svgDevtoberfestTextItem(itemHeight, 60, itemDelay,
        `list of activities to see`, isPng))
    itemHeight += 18
    itemDelay += 50
    items.push(svg.svgDevtoberfestTextLink(itemHeight, 60, itemDelay,
        `where you can earn points HERE`,
        `https://github.com/SAP-samples/devtoberfest-2021/blob/main/contest/readme.md`, isPng))
    itemHeight += 18
    itemDelay += 50

    let body =
        svg.svgHeader(1347, 1612) +
        await svg.svgDevtoberfestFont() +
        svg.svgStyles(
            svg.svgStyleDevHeader(),
            svg.svgStyleDevNormal(),
            svg.svgStyleDevLink(),
            svg.svgStyleBold(),
            svg.svgStyleStat(),
            svg.svgStyleStagger(),
            svg.svgStyleIcon(),
            svg.svgStyleAnimate()
        ) +

        svg.svgDevtoberfestBackground() +
        svg.svgMainContent(

            //Background CRT Frame
            svg.svgDevtoberfestItem(0, 0, 0, await svg.loadImageB64('../images/devtoberfest/BackgroundOKG.png'), 1007, 1347, isPng),

            //Devtoberfest Gameboard title
            svg.svgDevtoberfestItem(80, 50, 750, await svg.loadImageB64('../images/devtoberfest/Group_13.png'), 103, 668, isPng),

            //Points Banner
            svg.svgDevtoberfestItem(100, 800, 750, await svg.loadImageB64('../images/devtoberfest/image1.png'), 44, 389, isPng),

            //Points Banner Text
            svg.svgDevtoberfestTextHeader(127, 820, 1000,
                `Points: ${profile.points}, Level: ${profile.level}`, isPng),

            //Menu Awards
            `<a xlink:href="https://github.com/SAP-samples/devtoberfest-2021/tree/main/contest#prize-levels--what-you-can-win"
            target="_blank">`,
            `<title>AWARDS</title>`,
            svg.svgDevtoberfestItem(175, 900, 750, await svg.loadImageB64('../images/devtoberfest/menu/Frame.png'), 32, 29, isPng),
            `</a>`,

            //Menu Points
            `<a xlink:href="https://github.com/SAP-samples/devtoberfest-2021/tree/main/contest#points--awarded-and-accumulated-against-your-sap-community-id"
            target="_blank">`,
            `<title>POINTS</title>`,
            svg.svgDevtoberfestItem(175, 960, 900, await svg.loadImageB64('../images/devtoberfest/menu/Frame-1.png'), 32, 29, isPng),
            `</a>`,

            //Menu Rules
            `<a xlink:href="https://github.com/SAP-samples/devtoberfest-2021/tree/main/contest#game-specific-rules"
            target="_blank">`,
            `<title>RULES</title>`,
            svg.svgDevtoberfestItem(175, 1020, 1025, await svg.loadImageB64('../images/devtoberfest/menu/Frame-2.png'), 32, 29, isPng),
            `</a>`,

            //Green Alien Runner
            svg.svgDevtoberfestItem(750, 240, 1250, await svg.loadImageB64('../images/devtoberfest/clouds/Runner.png'), 74, 51, isPng,
                `<animate id="o7" begin="0;o8.end"
        attributeName="x" from="650" to="0" dur="4s" />
        <animate id="o8" begin="o7.end" 
        attributeName="x" from="0" to="650" dur="1s" />
       `
            ),

            //Animated Cloud #1
            svg.svgDevtoberfestItem(550, 200, 1250, await svg.loadImageB64('../images/devtoberfest/clouds/Frame.png'), 90, 165, isPng,
                `<animate id="o5" begin="0;o6.end"
        attributeName="x" from="650" to="0" dur="5s" />
        <animate id="o6" begin="o5.end" 
        attributeName="x" from="0" to="650" dur="5s" />`
            ),

            //Main Progress Area
            svg.svgDevtoberfestItem(220, 150, 1000, await svg.loadImageB64('../images/devtoberfest/clouds/Group_12b.png'), 692, 983, isPng),

            //SAP Logo
            `<a xlink:href="https://sap.com/"
        target="_blank">`,
            svg.svgDevtoberfestItem(800, 1130, 1000, await svg.loadImageB64('../images/devtoberfest/sap.png'), 64, 128, isPng),
            `</a>`,

            //Yellow Lobster
            svg.svgDevtoberfestItem(220, 1000, 1250, await svg.loadImageB64('../images/devtoberfest/clouds/Group8.png'), 103, 91, isPng,
                `<animate id="o1" begin="0;o2.end"
        attributeName="x" from="150" to="0" dur="5s" />
        <animate id="o2" begin="o1.end" 
        attributeName="x" from="0" to="150" dur="5s" />`
            ),

            //Red Alien
            svg.svgDevtoberfestItem(600, 95, 1250, await svg.loadImageB64('../images/devtoberfest/clouds/Group10.png'), 103, 91, isPng,
                `<animate id="o3" begin="0;o4.end"
        attributeName="y" from="150" to="0" dur="3s" />
        <animate id="o4" begin="o3.end" 
        attributeName="y" from="0" to="150" dur="3s" />`
            ),

            //Devtoberfest Logo
            svg.svgDevtoberfestItem(1250, 1000, 0, await svg.loadImageB64('../images/devtoberfest/Frame.png'), 192, 212, isPng),

            //Bottom CRT Frame
            svg.svgDevtoberfestItem(1507, 0, 0, await svg.loadImageB64('../images/devtoberfest/okBottom.png'), 105, 1347, isPng),

            //All Text Items
            svg.svgMainContent(items),

        ) +
        svg.svgEnd()

    return body
}

