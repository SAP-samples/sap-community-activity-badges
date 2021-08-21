const svg = require("../util/svgRender")
const texts = require("../util/texts")
const text_wrapper_lib = require('text-wrapper')
const wrapper = text_wrapper_lib.wrapper

module.exports = (app) => {
    app.get('/devtoberfest', async (req, res) => {
        return res.redirect("/")
    })

    app.get('/devtoberfestContest/:scnId', async (req, res) => {
        try {


            let profile = await getSCNProfile(req)

            let body = await renderSVG(false, profile, req)
            return res.type("text/html").status(200).send(renderHTMLBody(body))
        } catch (error) {
            app.logger.error(error)
            const errHandler = require("../util/error")
            return await errHandler.handleErrorDevtoberfest(error, req, res)
        }
    })
}


async function renderSVG(isPng, profile, req) {
    let [gameboardHeader,
        column1,
        backgroundCRTFrame,
        gameboardTitle,
        pointsBanner,
        menu,
        greenAlienRunner,
        animatedCloud1,
        mainProgressArea,
        cloud1,
        cloud2,
        cloud3,
        cloud4,
        sapLogo,
        yellowLobster,
        redAlien,
        avatarItems,
        devtoberfestLogo,
        bottomCRTFrame
    ] = await Promise.all([
        buildGameboardHeader(isPng, profile, req),
        buildHowToPlay(isPng, profile, req),
        //Background CRT Frame
        svg.svgDevtoberfestItem(0, 0, 0, await svg.loadImageB64('../images/devtoberfest/BackgroundOKG.png'), 1007, 1347, isPng),
        //Devtoberfest Gameboard title
        svg.svgDevtoberfestItem(80, 50, 750, await svg.loadImageB64('../images/devtoberfest/Group_13.png'), 103, 668, isPng),
        buildPointsBanner(isPng, profile, req),
        buildMenu(isPng, profile, req),
        //Green Alien Runner
        svg.svgDevtoberfestItem(750, 240, 1250, await svg.loadImageB64('../images/devtoberfest/clouds/Runner.png'), 74, 51, isPng,
            `<animate id="o7" begin="0;o8.end" attributeName="x" from="650" to="0" dur="4s" />` +
            `<animate id="o8" begin="o7.end"  attributeName="x" from="0" to="650" dur="1s" />`
        ),
        //Animated Cloud #1
        svg.svgDevtoberfestItem(550, 200, 1250, await svg.loadImageB64('../images/devtoberfest/clouds/Frame.png'), 90, 165, isPng,
            `<animate id="o5" begin="0;o6.end" attributeName="x" from="650" to="0" dur="5s" />` +
            `<animate id="o6" begin="o5.end" attributeName="x" from="0" to="650" dur="5s" />`
        ),
        //Main Progress Area
        svg.svgDevtoberfestItem(220, 150, 1000, await svg.loadImageB64('../images/devtoberfest/clouds/Group_12a.png'), 692, 983, isPng),
        buildCloud1(isPng, profile, req),
        buildCloud2(isPng, profile, req),
        buildCloud3(isPng, profile, req),
        buildCloud4(isPng, profile, req),
        //SAP Logo
        `<a xlink:href="https://sap.com/" target="_blank">` +
        `<title>SAP Logo</title>` +
        svg.svgDevtoberfestItem(800, 1130, 1000, await svg.loadImageB64('../images/devtoberfest/sap.png'), 64, 128, isPng) +
        `</a>`,
        //Yellow Lobster
        svg.svgDevtoberfestItem(220, 1000, 1250, await svg.loadImageB64('../images/devtoberfest/clouds/Group8.png'), 103, 91, isPng,
            `<animate id="o1" begin="0;o2.end" attributeName="x" from="150" to="0" dur="5s" />` +
            `<animate id="o2" begin="o1.end" attributeName="x" from="0" to="150" dur="5s" />`
        ),
        //Red Alien
        svg.svgDevtoberfestItem(600, 95, 1250, await svg.loadImageB64('../images/devtoberfest/clouds/Group10.png'), 103, 91, isPng,
            `<animate id="o3" begin="0;o4.end" attributeName="y" from="150" to="0" dur="3s" />` +
            `<animate id="o4" begin="o3.end" attributeName="y" from="0" to="150" dur="3s" />`
        ),
        buildAvatar(isPng, profile, req),
        //Devtoberfest Logo            
        `<a xlink:href="https://developers.sap.com/devtoberfest.html" target="_blank">` +
        `<title>Devtoberfest</title>` +
        svg.svgDevtoberfestItem(1250, 1000, 0, await svg.loadImageB64('../images/devtoberfest/Frame.png'), 192, 212, isPng) +
        `</a>`,
        //Bottom CRT Frame
        svg.svgDevtoberfestItem(1507, 0, 0, await svg.loadImageB64('../images/devtoberfest/okBottom.png'), 105, 1347, isPng),

    ])

    let body =
        svg.svgHeader(1347, 1612) +
        svg.svgDevtoberfestBackground() +
        svg.svgMainContent(
            backgroundCRTFrame,
            gameboardTitle,
            svg.svgBulkContent(pointsBanner),
            svg.svgBulkContent(menu),
            greenAlienRunner,
            animatedCloud1,
            mainProgressArea,
            svg.svgBulkContent(cloud1),
            svg.svgBulkContent(cloud2),
            svg.svgBulkContent(cloud3),
            svg.svgBulkContent(cloud4),
            sapLogo,
            yellowLobster,
            redAlien,
            devtoberfestLogo,
            bottomCRTFrame,
            svg.svgBulkContent(avatarItems),
            svg.svgBulkContent(gameboardHeader),
            svg.svgBulkContent(column1)
        ) +
        svg.svgEnd()

    return body
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

    let userNameScore = stringScore(userName)
    let profile = { userName: userName, scnId: req.params.scnId, badges: scnItems, userNameScore: userNameScore, points: 200500, level: 1 }
    return profile
}

function stringScore(string) {
    let score = 0

    for (j = 0; j < string.length; j++) {
        score += string.charAt(j).charCodeAt(0) 
        console.log(score)
    }

    //Calculate Modulo of Score and maximum Avatar number of 19 
    //Given two positive numbers a and n, a modulo n (abbreviated as a mod n) is the remainder of the Euclidean division of a by n, where a is the dividend and n is the divisor
    score = ((score % 19 ) + 19 ) % 19
    if(score > 0){ score = score - 1}
    return score
}

function renderHTMLBody(svg) {

    const mustache = require('mustache')
    const path = require('path')
    let htmlFile = path.join(process.cwd(), '/html/devtoberfest_header.html')
    const fs = require('fs')

    const data = fs.readFileSync(htmlFile,
        { encoding: 'utf8' })

    return mustache.render(data, { svg: svg })
}
module.exports.renderHTMLBody = renderHTMLBody

async function buildGameboardHeader(isPng, profile, req) {

    let text = texts.getBundle(req)
    let items = []

    let itemHeight = 220
    let itemDelay = 450

    let gameboardHeader = text.getText('devtoberfest.gameboardHeader', [profile.userName])
    let wrappedOutput = wrapper(gameboardHeader, { wrapOn: 35 })
    let wrappedArray = wrappedOutput.split("\n")
    for (let item of wrappedArray) {
        items.push(await svg.svgDevtoberfestCRTText(itemHeight, 120, itemDelay,
            item, isPng))
        itemHeight += 20
        itemDelay += 50
    }
    items.push(svg.svgDevtoberfestCRTLink(itemHeight, 120, itemDelay,
        text.getText('devtoberfest.scn'),
        `https://people.sap.com/${profile.scnId}#reputation`, isPng))

    return items
}

async function buildHowToPlay(isPng, profile, req) {

    let text = texts.getBundle(req)
    let items = []

    let itemHeight = 1095
    let itemDelay = 450

    items.push(svg.svgDevtoberfestTextHeader(1050, 60, itemDelay,
        text.getText('devtoberfest.column1'), isPng))

    items.push(svg.svgDevtoberfestTextItem(itemHeight, 60, itemDelay,
        text.getText('devtoberfest.column1.1'), isPng))
    itemHeight += 18
    itemDelay += 50

    items.push(svg.svgDevtoberfestTextLink(itemHeight, 60, itemDelay,
        `${text.getText('devtoberfest')} ${text.getText('devtoberfest.here')}`,
        `https://developers.sap.com/devtoberfest.html`, isPng))
    itemHeight += 36
    itemDelay += 50

    wrappedOutput = wrapper(text.getText('devtoberfest.column1.2'), { wrapOn: 35 })
    wrappedArray = wrappedOutput.split("\n")
    for (let item of wrappedArray) {
        items.push(await svg.svgDevtoberfestTextItem(itemHeight, 60, itemDelay,
            item, isPng))
        itemHeight += 18
        itemDelay += 50
    }

    items.push(svg.svgDevtoberfestTextLink(itemHeight, 60, itemDelay,
        text.getText('devtoberfest.here'),
        `https://github.com/SAP-samples/devtoberfest-2021/blob/main/contest/readme.md`, isPng))
    itemHeight += 18
    itemDelay += 50

    return items
}

async function buildPointsBanner(isPng, profile, req) {
    let text = texts.getBundle(req)
    let numFormat = new Intl.NumberFormat(texts.getLocale(req))
    let items = []

    //Points Banner
    items.push(
        svg.svgDevtoberfestItem(100, 800, 750,
            await svg.loadImageB64('../images/devtoberfest/image1.png'), 44, 389, isPng),
    )

    //Points Banner Text
    items.push(svg.svgDevtoberfestTextHeader(122, 995, 1000,
        text.getText('devtoberfest.pointsBanner', [numFormat.format(profile.points), profile.level]),
        isPng, `class="header" dominant-baseline="middle" text-anchor="middle"`))

    return items

}

async function buildMenu(isPng, profile, req) {
    let text = texts.getBundle(req)
    let items = []

    //Menu Awards
    items.push(
        `<a xlink:href="https://github.com/SAP-samples/devtoberfest-2021/tree/main/contest#prize-levels--what-you-can-win" target="_blank">` +
        `<title>${text.getText('devtoberfest.awards')}</title>` +
        svg.svgDevtoberfestItem(175, 900, 750, await svg.loadImageB64('../images/devtoberfest/menu/Frame.png'), 32, 29, isPng) +
        `</a>`)

    //Menu Points
    items.push(
        `<a xlink:href="https://github.com/SAP-samples/devtoberfest-2021/tree/main/contest#points--awarded-and-accumulated-against-your-sap-community-id" target="_blank">` +
        `<title>${text.getText('devtoberfest.points')}</title>` +
        svg.svgDevtoberfestItem(175, 960, 900, await svg.loadImageB64('../images/devtoberfest/menu/Frame-1.png'), 32, 29, isPng) +
        `</a>`)

    //Menu Rules
    items.push(
        `<a xlink:href="https://github.com/SAP-samples/devtoberfest-2021/tree/main/contest#game-specific-rules" target="_blank">` +
        `<title>${text.getText('devtoberfest.rules')}</title>` +
        svg.svgDevtoberfestItem(175, 1020, 1025, await svg.loadImageB64('../images/devtoberfest/menu/Frame-2.png'), 32, 29, isPng) +
        `</a>`)

    //Menu Sound
    items.push(
        `<a><title>${text.getText('devtoberfest.sound')}</title>` +
        svg.svgDevtoberfestItem(175, 1080, 1025, await svg.loadImageB64('../images/devtoberfest/menu/sound.png'), 32, 29, isPng, null, `onclick="if(document.getElementById('audioID').paused){ document.getElementById('audioID').play() } else { document.getElementById('audioID').pause()}" `) +
        `</a>`)

    return items
}

async function buildCloud1(isPng, profile, req) {
    let text = texts.getBundle(req)
    let items = []

    //Cloud #1 Banner
    items.push(svg.svgDevtoberfestItem(594, 340, 750,
        await svg.loadImageB64('../images/devtoberfest/image3.png'), 39, 169, isPng))
    //Cloud #1 Hearts
    items.push(svg.svgDevtoberfestItem(570, 370, 750,
        await svg.loadImageB64('../images/devtoberfest/levels/Group5.png'), 22, 111, isPng))
    //Cloud #1 Banner Text
    items.push(svg.svgDevtoberfestTextHeader(614, 425, 800,
        text.getText('devtoberfest.level1'),
        isPng, `class="header" dominant-baseline="middle" text-anchor="middle"`))

    return items
}

async function buildCloud2(isPng, profile, req) {
    let text = texts.getBundle(req)
    let items = []

    //Cloud #2 Banner
    items.push(svg.svgDevtoberfestItem(875, 390, 750,
        await svg.loadImageB64('../images/devtoberfest/image3.png'), 39, 169, isPng))
    //Cloud #2 Hearts
    items.push(svg.svgDevtoberfestItem(851, 420, 750,
        await svg.loadImageB64('../images/devtoberfest/levels/Group4.png'), 22, 111, isPng))
    //Cloud #2 Banner Text
    items.push(svg.svgDevtoberfestTextHeader(895, 475, 800,
        text.getText('devtoberfest.level2'),
        isPng, `class="header" dominant-baseline="middle" text-anchor="middle"`))

    return items
}

async function buildCloud3(isPng, profile, req) {
    let text = texts.getBundle(req)
    let items = []

    //Cloud #3 Banner
    items.push(svg.svgDevtoberfestItem(735, 855, 750,
        await svg.loadImageB64('../images/devtoberfest/image3.png'), 39, 169, isPng))
    //Cloud #3 Hearts
    items.push(svg.svgDevtoberfestItem(711, 885, 750,
        await svg.loadImageB64('../images/devtoberfest/levels/Group6.png'), 22, 111, isPng))
    //Cloud #3 Banner Text
    items.push(svg.svgDevtoberfestTextHeader(755, 940, 800,
        text.getText('devtoberfest.level3'),
        isPng, `class="header" dominant-baseline="middle" text-anchor="middle"`))

    return items
}

async function buildCloud4(isPng, profile, req) {
    let text = texts.getBundle(req)
    let items = []

    //Cloud #4 Banner
    items.push(svg.svgDevtoberfestItem(450, 735, 750,
        await svg.loadImageB64('../images/devtoberfest/image6.png'), 72, 311, isPng))
    //Cloud #4 Server
    items.push(svg.svgDevtoberfestItem(280, 765, 750,
        await svg.loadImageB64('../images/devtoberfest/levels/Frame.png'), 165, 117, isPng))
    //Cloud #4 Stars
    items.push(svg.svgDevtoberfestItem(228, 720, 750,
        await svg.loadImageB64('../images/devtoberfest/levels/Group11.png'), 124, 208, isPng))
    //Cloud #4 Banner Text
    items.push(svg.svgDevtoberfestTextHeader(486, 890, 800,
        text.getText('devtoberfest.level4'),
        isPng, `class="headerWin" dominant-baseline="middle" text-anchor="middle"`))

    return items
}

async function buildAvatar(isPng, profile, req) {
    let text = texts.getBundle(req)
    let items = []
    let avatarNumber = profile.userNameScore
    if(!avatarNumber || avatarNumber < 0 || avatarNumber > 18){
        avatarNumber = 0
    }
    let avatar = `../images/devtoberfest/avatars/Group-${avatarNumber.toString()}.png`

    items.push(svg.svgDevtoberfestTextHeader(592, 369, 2000,
        `♥`,
        isPng, `class="heart"`))

    //Avatar 
    items.push(svg.svgDevtoberfestItem(435, 280, 2000,
        await svg.loadImageB64(avatar), 124, 124, isPng, null, null, 'stagger avatar'
    ))

    return items
}