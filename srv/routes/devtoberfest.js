const svg = require("../util/svgRender")
const texts = require("../util/texts")
const khoros = require("../util/khoros")
const text_wrapper_lib = require('text-wrapper')
const wrapper = text_wrapper_lib.wrapper

module.exports = (app) => {
    app.get('/devtoberfest', async (req, res) => {
        return res.redirect("/")
    })

    app.get('/devtoberfestContest', async (req, res) => {
        return res.redirect("/devtoberfestContest/scnId.Here")
    })

    /**
     * @swagger
     * /devtoberfest/profile/{scnId}:
     *   get:
     *     summary: Retrieve a single Khoros event.
     *     description: Retrieve a single Khoros event.
     *     parameters:
     *       - in: path
     *         name: scnId
     *         required: true
     *         description: User ID as string from old SAP Community System
     *         default: thomas.jung
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: All badges assigned to the specified user
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 userName:
     *                   type: string
     *                 scnId:
     *                   type: string
     *                 userNameScore:
     *                   type: integer
     *                 points:
     *                   type: integer
     *                 level:
     *                   type: integer
     *                 badges:
     *                   type: object
     *                   properties:
     *                     content:
     *                       type: array
     *                       items:
     *                         type: object
     *                         properties:
     *                           name:
     *                             type: string
     *                           displayName:
     *                             type: string
     *                           description:
     *                             type: string
     *                           imageUrl:
     *                             type: string
     *                             format: uri
     *                           type:
     *                             type: string
     *                           userName:
     *                             type: string
     *                           timestamp:
     *                             type: string
     *                             format: date-time
     *                           modified:
     *                             type: string
     *                             format: date-time
     *                           count:
     *                             type: integer
     *                           itemURL:
     *                             type: string
     *                             format: uri
     *                           Date:
     *                             type: string
     *                             format: date
     *                           Week:
     *                             type: string
     */
    app.get('/devtoberfest/profile/:scnId', async (req, res) => {
        try {
            let profile = await getSCNProfile(req)
            return res.type("application/json").status(200).send(profile)
        } catch (error) {
            app.logger.error(error)
            const errHandler = require("../util/error")
            return await errHandler.handleErrorDevtoberfestText(error, req, res)
        }
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
        column2,
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
        bottomCRTFrame,
        blinky,
        stars
    ] = await Promise.all([
        buildGameboardHeader(isPng, profile, req),
        buildHowToPlay(isPng, profile, req),
        buildLawyersHappy(isPng, profile, req),
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
        svg.svgDevtoberfestItem(1350, 1180, 0, await svg.loadImageB64('../images/devtoberfest/sap.svg'), 64, 128, isPng, null, null, null, 'sap.svg') +
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
        `<a xlink:href="https://groups.community.sap.com/t5/devtoberfest/gh-p/Devtoberfest" target="_blank">` +
        `<title>Devtoberfest</title>` +
        svg.svgDevtoberfestItem(1250, 925, 0, await svg.loadImageB64('../images/devtoberfest/devtoberfest_square_small.gif'), 192, 212, isPng) +
        `</a>`,
        //Bottom CRT Frame
        svg.svgDevtoberfestItem(1507, 0, 0, await svg.loadImageB64('../images/devtoberfest/okBottom.png'), 105, 1347, isPng),
        //Blinking LED
        `<g transform="translate(1180, 1581)"class="led-green" ><rect class="led-green"  ></rect></g>`,
        //Cloud #4 Stars
        svg.svgDevtoberfestItem(228, 720, 750,
            await svg.loadImageB64('../images/devtoberfest/levels/Group11.png'), 124, 208, isPng)
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
            svg.svgBulkContent(column1),
            svg.svgBulkContent(column2),
            blinky,
            stars
        ) +
        svg.svgEnd()

    return body
}

async function getSCNProfile(req) {
    let profile = {}
    switch (req.params.scnId) {
        //Dummy Redirect SCN ID when none is supplied
        case 'scnId.Here':
            let e = new Error('No SCN ID')
            e.name = 'No SCN ID'
            e.scnId = req.params.scnId
            throw e
        //special test users
        case 'test0':
            profile = {
                userName: req.params.scnId, scnId: req.params.scnId, userNameScore: stringScore(req.params.scnId),
                points: 0, level: 0
            }
            return profile
        case 'test1':
            profile = {
                userName: req.params.scnId, scnId: req.params.scnId, userNameScore: stringScore(req.params.scnId),
                points: 3010, level: 1
            }
            return profile
        case 'test2':
            profile = {
                userName: req.params.scnId, scnId: req.params.scnId, userNameScore: stringScore(req.params.scnId),
                points: 14500, level: 2
            }
            return profile
        case 'test3':
            profile = {
                userName: req.params.scnId, scnId: req.params.scnId, userNameScore: stringScore(req.params.scnId),
                points: 22400, level: 3
            }
            return profile
        case 'test4':
            profile = {
                userName: req.params.scnId, scnId: req.params.scnId, userNameScore: stringScore(req.params.scnId),
                //userName: `Josh Bentely`, scnId: 148, userNameScore: stringScore(`Josh Bentely`),
                points: 30500, level: 4
            }
            return profile
        default:
 


            //Check if they are registered for Devtoberfest - "Devtoberfest 2025 Participant"
            //console.log(scnItems.data.user_badges.items.badge)
            //let registered = scnItems.data.user_badges.items.find(x => x.badge.title == 'Devtoberfest 2025 Participant')

            //Check if they are registered for Devtoberfest by checking the members json dump
            let members = await khoros.getDevtoberfestMembers()
            let registered = members.data.items.find(x => x.id == req.params.scnId)
            if(!registered){
                registered = members.data.items.find(x => x.login == req.params.scnId)
                if(registered){
                    req.params.scnId = registered.id
                }
            }        
            let [scnItems, pointsLevels, badges] = await Promise.all([
                khoros.callUserAPI(req.params.scnId),
                require('../util/points.json'),
                require('../util/badges.json')
            ])
            if (!registered) {
                let e = new Error('Not Registered')
                e.name = 'Not Registered'
                e.scnId = req.params.scnId
                throw e
            }
            let userName = khoros.handleUserName(req.params.scnId, scnItems)

            let userNameScore = stringScore(userName)
            let points = 0
            let endDate = new Date(2025, 10, 24)
            for (let item of scnItems.data.user_badges.items) {
                let badgeValue = badges.find(x => x.displayName == item.badge.title)
                if (badgeValue) {
                    if (Date.parse(item.earned_date) < endDate) {
                        item.points = badgeValue.points
                        points = points + badgeValue.points
                    }
                    item.itemURL = badgeValue.URL
                    item.Date = new Date(badgeValue.Date)
                    item.Week = badgeValue.Week
                }
            }

            let level = 0
            for (const index in pointsLevels) {
                if (points >= pointsLevels[index].points) {
                    level = pointsLevels[index].level
                }
            }


            profile = { userName: userName, scnId: req.params.scnId, badges: scnItems, userNameScore: userNameScore, points: points, level: level }
            return profile
    }
}

function stringScore(string) {
    let score = 0

    for (j = 0; j < string.length; j++) {
        score += string.charAt(j).charCodeAt(0)
    }

    //Calculate Modulo of Score and maximum Avatar number of 29 
    //Given two positive numbers a and n, a modulo n (abbreviated as a mod n) is the remainder of the Euclidean division of a by n, where a is the dividend and n is the divisor
    score = ((score % 29) + 29) % 29
    if (score > 0) { score = score - 1 }
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

    //let gameboardHeader = text.getText('devtoberfest.gameboardHeader', [profile.userName])
    let gameboardHeader = text.getText('devtoberfest.gameboardHeaderEnd', [profile.userName])
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
        `https://community.sap.com/t5/user/viewprofilepage/user-id/${profile.scnId}`, isPng))

    return items
}

async function buildHowToPlay(isPng, profile, req) {

    let text = texts.getBundle(req)
    let items = []

    let itemHeight = 1095
    let itemDelay = 450

    items.push(svg.svgDevtoberfestTextHeader(1050, 60, itemDelay,
        text.getText('devtoberfest.column1'), isPng))

    wrappedOutput = wrapper(text.getText('devtoberfest.column1.1'), { wrapOn: 35 })
    wrappedArray = wrappedOutput.split("\n")
    for (let item of wrappedArray) {
        items.push(await svg.svgDevtoberfestTextItem(itemHeight, 60, itemDelay,
            item, isPng))
        itemHeight += 18
        itemDelay += 50
    }

    items.push(svg.svgDevtoberfestTextLink(itemHeight, 60, itemDelay,
        `${text.getText('devtoberfest')}`,
        `https://groups.community.sap.com/t5/devtoberfest/gh-p/Devtoberfest`, isPng))
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
        text.getText('devtoberfest.column1.here'),
        `https://community.sap.com/t5/devtoberfest-blog-posts/devtoberfest-2025-contest-official-rules/ba-p/13781577`, isPng))
    itemHeight += 18
    itemDelay += 50

    return items
}

async function buildLawyersHappy(isPng, profile, req) {

    let text = texts.getBundle(req)
    let items = []

    let itemHeight = 1095
    let itemDelay = 450
    let columnStart = 500

    items.push(svg.svgDevtoberfestTextHeader(1050, columnStart, itemDelay,
        text.getText('devtoberfest.column2'), isPng))

    wrappedOutput = wrapper(text.getText('devtoberfest.column2.1'), { wrapOn: 35 })
    wrappedArray = wrappedOutput.split("\n")
    for (let item of wrappedArray) {
        items.push(await svg.svgDevtoberfestTextItem(itemHeight, columnStart, itemDelay,
            item, isPng))
        itemHeight += 18
        itemDelay += 50
    }

    items.push(svg.svgDevtoberfestTextLink(itemHeight, columnStart, itemDelay,
        text.getText('devtoberfest.column2.here'),
        `https://community.sap.com/t5/devtoberfest-blog-posts/devtoberfest-2025-contest-official-rules/ba-p/13781577`, isPng))
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
        `<a xlink:href="https://community.sap.com/t5/devtoberfest-blog-posts/devtoberfest-2025-contest-official-rules/ba-p/13781577" target="_blank">` +
        `<title>${text.getText('devtoberfest.awards')}</title>` +
        svg.svgDevtoberfestItem(175, 900, 750, await svg.loadImageB64('../images/devtoberfest/menu/Frame.png'), 32, 29, isPng) +
        `</a>`)

    //Menu Points
    items.push(
        `<a xlink:href="https://community.sap.com/t5/devtoberfest-blog-posts/devtoberfest-2025-contest-official-rules/ba-p/13781577" target="_blank">` +
        `<title>${text.getText('devtoberfest.points')}</title>` +
        svg.svgDevtoberfestItem(175, 960, 900, await svg.loadImageB64('../images/devtoberfest/menu/Frame-1.png'), 32, 29, isPng) +
        `</a>`)

    //Menu Rules
    items.push(
        `<a xlink:href="https://community.sap.com/t5/devtoberfest-blog-posts/devtoberfest-2025-contest-official-rules/ba-p/13781577" target="_blank">` +
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
    let serverStyle = 'stagger'
    if (profile.level === 4) {
        serverStyle = 'server-4'
    }
    items.push(svg.svgDevtoberfestItem(280, 765, 750,
        await svg.loadImageB64('../images/devtoberfest/levels/Frame.png'), 165, 117, isPng, null, null, serverStyle))
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
    if (!avatarNumber || avatarNumber < 0 || avatarNumber > 28) {
        avatarNumber = 0
    }
    if (profile.scnId && profile.scnId === 'josh.bentley') {
        avatarNumber = 27
    }
    let avatar = `../images/devtoberfest/avatars/Group-${avatarNumber.toString()}.png`
    if (profile.scnId && profile.scnId === 'lars.hvam') {
        avatar = `../images/devtoberfest/avatars/cowboy.png`
    }


    avatarX = 0
    avatarY = 0
    avatarStyle = 'stagger avatar'
    hearts = []
    delay = 2000
    switch (profile.level) {
        case 0:
            avatarX = 285
            avatarY = 420
            avatarStyle += ' avatar-1'
            break
        case 1:
            avatarX = 435
            avatarY = 280
            avatarStyle += ' avatar-1'
            hearts.push({ x: 592, y: 383 })
            break
        case 2:
            avatarX = 715
            avatarY = 445
            avatarStyle += ' avatar-2'
            hearts.push({ x: 875, y: 434 }, { x: 875, y: 462 },)
            break
        case 3:
            avatarX = 575
            avatarY = 930
            avatarStyle += ' avatar-3'
            hearts.push({ x: 735, y: 902 }, { x: 735, y: 930 }, { x: 735, y: 958 })
            break
        case 4:
            avatarX = 325
            avatarY = 760
            avatarStyle += ' avatar-4'
            break
        default:
    }

    //Avatar 
    items.push(svg.svgDevtoberfestItem(avatarX, avatarY, delay,
        await svg.loadImageB64(avatar), 124, 124, isPng, null, null, avatarStyle
    ))

    for (let heart of hearts) {
        items.push(svg.svgDevtoberfestTextHeader(heart.x, heart.y, delay,
            `♥`,
            isPng, `class="heart"`))
    }


    return items
}