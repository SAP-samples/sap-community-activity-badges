
module.exports = (app) => {

    /**
     * @swagger
     * /khoros/user/{scnId}:
     *   get:
     *     summary: Retrieve a single Khoros user.
     *     description: Retrieve a single Khoros user.
     *     parameters:
     *       - in: path
     *         name: scnId
     *         required: true
     *         description: Numeric ID of the user to retrieve.
     *         default: 139
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: A single user.
     */
    app.get('/khoros/user/:scnId', async (req, res) => {
        try {
            let profile = await getSCNProfile(req.params.scnId, app)
            return res.type("application/json").status(200).send(profile)
        } catch (error) {
            app.logger.error(error)
            const errHandler = require("../util/error")
            return await errHandler.handleErrorDevtoberfestText(error, req, res)
        }
    })

    /**
     * @swagger
     * /khoros/event/{eventId}:
     *   get:
     *     summary: Retrieve a single Khoros event.
     *     description: Retrieve a single Khoros event.
     *     parameters:
     *       - in: path
     *         name: eventId
     *         required: true
     *         description: Numeric ID of the event to retrieve.
     *         default: 224275
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: A single event
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 event:
     *                   type: string
     *                   description: Event description
     *                 startTime:
     *                   type: string
     *                   format: date-time
     *                 endTime:
     *                   type: string
     *                   format: date-time
     *                 timezone:
     *                   type: string
     *                   format: timezone
     *                 rsvp:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       login:
     *                         type: string
     *                       email:
     *                         type: string
     *                         format: email
     *                       view_href:
     *                         type: string
     *                         format: uri
     */    
    app.get('/khoros/event/:eventId', async (req, res) => {
        try {
            let profile = await getEvent(req.params.eventId, app)
            return res.type("application/json").status(200).send(profile)
        } catch (error) {
            app.logger.error(error)
            const errHandler = require("../util/error")
            return await errHandler.handleErrorDevtoberfestText(error, req, res)
        }
    })

    /**
     * @swagger
     * /khoros/events/{boardId}:
     *   get:
     *     summary: Retrieve all events for a single board.
     *     description: Retrieve all events for a single board.
     *     parameters:
     *       - in: path
     *         name: boardId
     *         required: true
     *         description: Event Board Name.
     *         default: codejam-events
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: A list of events for the specified board
     */    
    app.get('/khoros/events/:boardId', async (req, res) => {
        try {
            let profile = await getEvents(req.params.boardId, app)
            return res.type("application/json").status(200).send(profile)
        } catch (error) {
            app.logger.error(error)
            const errHandler = require("../util/error")
            return await errHandler.handleErrorDevtoberfestText(error, req, res)
        }
    })

    /**
     * @swagger
     * /khoros/eventRegsRaw/{boardId}:
     *   get:
     *     summary: Retrieve all events for a single board - limited output
     *     description: Retrieve all events for a single board - limited output
     *     parameters:
     *       - in: path
     *         name: boardId
     *         required: true
     *         description: Event Board Name.
     *         default: codejam-events
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: A list of events with limited details
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id:
     *                     type: integer
     *                   name:
     *                     type: string
     *                     description: Event description
     *                   href:
     *                     type: string
     *                     format: uri
     *                   startTime:
     *                     type: string
     *                     format: date-time
     *                   endTime:
     *                     type: string
     *                     format: date-time
     *                   timezone:
     *                     type: string
     *                     format: timezone
     *                   rsvpCount:
     *                     type: integer
     *                   location:
     *                     type: string
     */ 
    app.get('/khoros/eventRegsRaw/:boardId', async (req, res) => {
        try {
            let profile = await getEventsRegs(req.params.boardId, app)
            return res.type("application/json").status(200).send(profile)
        } catch (error) {
            app.logger.error(error)
            const errHandler = require("../util/error")
            return await errHandler.handleErrorDevtoberfestText(error, req, res)
        }
    })

    /**
     * @swagger
     * /khoros/messagePosters/{boardId}/{conversationId}:
     *   get:
     *     summary: Retrieve all users who have posted to a particular thread
     *     description: Retrieve all users who have posted to a particular thread
     *     parameters:
     *       - in: path
     *         name: boardId
     *         required: true
     *         description: Board Name.
     *         default: application-developmentforum-board
     *         schema:
     *           type: string
     *       - in: path
     *         name: conversationId
     *         required: true
     *         description: Conversation ID within a board
     *         default: 270028
     *         schema:
     *           type: integer 
     *     responses:
     *       200:
     *         description: A list of people who have posted in a single thread
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id:
     *                     type: integer
     *                   login:
     *                     type: string
     *                     description: User Login Name
     *                   view_href:
     *                     type: string
     *                     format: uri
     */ 
    app.get('/khoros/messagePosters/:boardId/:conversationId', async (req, res) => {
        try {
            let posters = await getMessagePosters(req.params.boardId, req.params.conversationId, app)
            return res.type("application/json").status(200).send(posters)
        } catch (error) {
            app.logger.error(error)
            const errHandler = require("../util/error")
            return await errHandler.handleErrorDevtoberfestText(error, req, res)
        }
    })

    /**
     * @swagger
     * /khoros/eventRegs/{boardId}:
     *   get:
     *     summary: Retrieve upcoming Event details for a board and format the output in HTML
     *     description: Retrieve upcoming Event details for a board and format the output in HTML
     *     parameters:
     *       - in: path
     *         name: boardId
     *         required: true
     *         description: Board Name.
     *         default: codejam-events
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Critical details for all upcoming events
     */ 
    app.get('/khoros/eventRegs/:boardId', async (req, res) => {
        try {
            let profile = await getEventsRegs(req.params.boardId, app)
            let output = '<!DOCTYPE html><html><body>'
            output +=
                `
            <script type="module">
              import Parser  from 'https://cdn.jsdelivr.net/gh/juanjoDiaz/json2csv@6.1.3/dist/cdn/plainjs/Parser.js'
              import flatten  from 'https://cdn.jsdelivr.net/gh/juanjoDiaz/json2csv@6.1.3/dist/cdn/transforms/flatten.js'
              window.Parser = Parser
              window.flatten = flatten
            </script>
            <script>
            const formatDate = (element, startTime, timeZone) =>{
                let date1 = new Date((typeof date === "string" ? new Date(startTime) : startTime) 
                    ).toLocaleString(Intl.DateTimeFormat().resolvedOptions().locale, { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, dateStyle: 'full', timeStyle: 'full' })
                let date2 = new Date((typeof date === "string" ? new Date(startTime) : startTime) 
                    ).toLocaleString(Intl.DateTimeFormat().resolvedOptions().locale, { timeZone: timeZone, dateStyle: 'full', timeStyle: 'full' })
                document.getElementById(element).innerHTML = 'Start Time: ' + date1 + ' / ' + date2
            }
            </script>
            `
            for (let item of profile) {
                let date2 = new Date((typeof date === "string" ? new Date(item.startTime) : item.startTime)
                ).toLocaleString(Intl.DateTimeFormat().resolvedOptions().locale, { timeZone: item.timezone, dateStyle: 'full', timeStyle: 'full' })

                output += `\n<a href="${item.href}"><h3>${item.name}</h2></a>`
                output += `<div style="border-width:3px; border-style:solid; border-color:grey; padding: 1em;">`
                output += `
                    <a
                        target="_blank"
                        rel="noreferrer"
                        href="${encodeURI("https://groups.community.sap.com/api/2.0/search?q=SELECT id, user.login, user.email, user.first_name, user.last_name, rsvp_response, user.sso_id FROM rsvps WHERE rsvp_response = 'yes' and message.id = '" + item.id + "'")}">
                        <button>
                            Open event registrations in new tab
                        </button></a>
                    &nbsp &nbsp 

                        <button onclick="composeEmail(this)">
                            Post-process registrations
                        </button>
                        <div style="display: flex; gap: 1em; align-items: flex-end; margin-top: 1em;">
                            <textarea style="display: none; width: 300px; height: 200px; margin-bottom: 1em;" placeholder="Paste the event registrations here."></textarea>
                            <button style="display: none; margin-bottom: 1em;" onclick="openEmailDraft(this, '${item.name}', '${date2}', '${item.location}', '${item.href}')">Open email draft</button>
                            <button style="display: none; margin-bottom: 1em;" onclick="openExcel(this, '${item.name}')">Download Excel</button>
                        </div>`
                if (item.rsvpCount >= 25) {
                    output += `<li>RSVP Count: ${item.rsvpCount} 🛑</li>`
                } else if (item.rsvpCount >= 20) {
                    output += `<li>RSVP Count: ${item.rsvpCount} 🟡</li>`
                } else {
                    output += `<li>RSVP Count: ${item.rsvpCount} </li>`
                }
                output += `<li id="${item.id}"></li>`
                output +=
                    `<script>
                    formatDate('${item.id}', '${item.startTime}', '${item.timezone}', )
                </script>`
                output += `<li>Location: ${item.location}</li>`
                output += `</div>`
            }
            output += `
                <script>
                    const composeEmail = (element) => {
                        const textArea = element.parentNode.getElementsByTagName("TEXTAREA")[0]
                        textArea.style.display = "block"
                        textArea.addEventListener("change", (e) => {
                            const buttonNextToText = e.target.parentNode.getElementsByTagName("BUTTON")[0]
                            buttonNextToText.style.display = "block"
                            const buttonNextToText2 = e.target.parentNode.getElementsByTagName("BUTTON")[1]
                            buttonNextToText2.style.display = "block"
                        })
                    }
                    const openEmailDraft = (element, name, start, location, url) => {
                        try {
                            const textArea = element.parentNode.getElementsByTagName("TEXTAREA")[0]
                            const json = JSON.parse(textArea.value)
                            let attendeeEmails = []
                            json.data.items.forEach(item => {
                                attendeeEmails.push(item.user.email)
                            })
                            const attendeeEmailsAsString = attendeeEmails.join("; ")
 
                            const emailBody = 'This is a reminder that you are registered for the ' +
                                              name + '\\n' +
                                              '* Start Time: ' + start + '\\n' +
                                              '* Location: ' + location + '\\n' + '\\n' +
                                              'This is a hands-on learning event! Be sure to bring your own laptop and review the prerequisites ' + '\\n' +
                                              'If you have any questions about the event, you can post in the Event page or feel free to reply directly to this email.' 
                            window.open('mailto:?bcc='+attendeeEmailsAsString+'&subject='+encodeURIComponent(name)+'&body='+encodeURIComponent(emailBody), '_blank')
                        } catch(error) {
                            console.error(error)
                            alert("Oops! Something went wrong while composing your email. Did you paste the whole API response into the text area? Check the console for details and blame the developer.")
                        }
                    }

                    const openExcel = (element, name) => {
                        try {
                            const textArea = element.parentNode.getElementsByTagName("TEXTAREA")[0]
                            const json = JSON.parse(textArea.value)
                            const opts = {
                                transforms: [
                                    flatten({ separator: '_' })
                                ]
                              }
                            const parser = new Parser(opts)
                            const csv = parser.parse(json.data.items)
                            window.open("data:text/csv;charset=utf-8," + escape(csv))
                        } catch(error) {
                            console.error(error)
                            alert("Oops! Something went wrong while reformatting for Excel. Did you paste the whole API response into the text area? Check the console for details and blame the developer.")
                        }
                    }
                </script>`

            output += `</body></html>`
            return res.type("text/html").status(200).send(output)
        } catch (error) {
            app.logger.error(error)
            const errHandler = require("../util/error")
            return await errHandler.handleErrorDevtoberfestText(error, req, res)
        }
    })

    /**
     * @swagger
     * /khoros/boards:
     *   get:
     *     summary: Retrieve all Boards
     *     description: Retrieve all Boards
     *     responses:
     *       200:
     *         description: List of Boards
     */     
    app.get('/khoros/boards/', async (req, res) => {
        try {
            let profile = await getBoards(app)
            return res.type("application/json").status(200).send(profile)
        } catch (error) {
            app.logger.error(error)
            const errHandler = require("../util/error")
            return await errHandler.handleErrorDevtoberfestText(error, req, res)
        }
    })

    /**
     * @swagger
     * /khoros/board/{boardId}:
     *   get:
     *     summary: Retrieve Board Details
     *     description: Retrieve Board Details
     *     parameters:
     *       - in: path
     *         name: boardId
     *         required: true
     *         description: Board Name.
     *         default: application-developmentforum-board
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Details for a single board
     */     
    app.get('/khoros/board/:boardId', async (req, res) => {
        try {
            let profile = await getBoard(req.params.boardId, app)
            return res.type("application/json").status(200).send(profile)
        } catch (error) {
            app.logger.error(error)
            const errHandler = require("../util/error")
            return await errHandler.handleErrorDevtoberfestText(error, req, res)
        }
    })    

    /**
     * @swagger
     * /khoros/topics/{boardId}:
     *   get:
     *     summary: Get all conversations on a board
     *     description: Get all conversations on a board
     *     parameters:
     *       - in: path
     *         name: boardId
     *         required: true
     *         description: Board Name.
     *         default: application-developmentforum-board
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: List of all conversations
     */     
    app.get('/khoros/topics/:boardId', async (req, res) => {
        try {
            let profile = await getTopics(req.params.boardId, app)
            return res.type("application/json").status(200).send(profile)
        } catch (error) {
            app.logger.error(error)
            const errHandler = require("../util/error")
            return await errHandler.handleErrorDevtoberfestText(error, req, res)
        }
    })      
}

/**
 * Request the SAP Community Profile for a User
 * @param {number} scnId - SAP Community ID unique numeric
 * @param {object} app - Express App object
 * @returns {object}
 */
async function getSCNProfile(scnId, app) {
    switch (scnId) {
        //Dummy Redirect SCN ID when none is supplied
        case 'scnId.Here':
            let e = new Error('No SCN ID')
            e.name = 'No SCN ID'
            e.scnId = scnId
            throw e
        default:
            const request = require('then-request')
            const userURL = `https://groups.community.sap.com/api/2.0/users/${scnId}`
            app.logger.info(userURL)
            let userDetails = await request('GET', encodeURI(userURL))
            const userOutput = JSON.parse(userDetails.getBody())
            return userOutput
    }
}

/**
 * Get all SAP Community Boards
 * @param {object} app - Express App object
 * @returns {object}
 */
async function getBoards(app) {
    const request = require('then-request')
    const boardURL = `https://groups.community.sap.com/api/2.0/search?q=SELECT * FROM boards`
    app.logger.info(boardURL)
    let boardDetails = await request('GET', encodeURI(boardURL))
    const boardOutput = JSON.parse(boardDetails.getBody())
    return boardOutput
}

/**
 * Get Single Board Details
 * @param {string} boardId - SAP Community Unique Name for a Board
 * @param {object} app - Express App object
 * @returns {object}
 */
async function getBoard(boardId, app) {
    const request = require('then-request')
    const boardURL = `https://groups.community.sap.com/api/2.0/search?q=SELECT * FROM boards where id = '${boardId}'`
    app.logger.info(boardURL)
    let boardDetails = await request('GET', encodeURI(boardURL))
    const boardOutput = JSON.parse(boardDetails.getBody())
    return boardOutput.data.items[0]
}

/**
 * Get List of Topics/Threads for a Board
 * @param {string} boardId - SAP Community Unique Name for a Board
 * @param {object} app - Express App object
 * @returns {object}
 */
async function getTopics(boardId, app) {
    const request = require('then-request')
    const boardURL = `https://groups.community.sap.com/api/2.0/search?q=SELECT * FROM messages WHERE board.id = '${boardId}' AND depth = 0`
    app.logger.info(boardURL)
    let boardDetails = await request('GET', encodeURI(boardURL))
    const boardOutput = JSON.parse(boardDetails.getBody())
    return boardOutput.data.items
}

/**
 * Return the Events for a Board with Registration Summary
 * @param {string} boardId - SAP Community Unique Name for a Board
 * @param {object} app - Express App object
 * @returns {object}
 */
async function getEventsRegs(boardId, app) {
    const request = require('then-request')
    const start = new Date()

    const eventURL =
        `https://groups.community.sap.com/api/2.0/search?q=` +
        `SELECT id, subject, view_href, occasion_data.location, occasion_data.start_time, occasion_data.end_time, occasion_data.timezone ` +
        `FROM messages WHERE board.id='${boardId}' and occasion_data.start_time >= '${start.toISOString()}' order by occasion_data.start_time asc`

    app.logger.info(eventURL)
    let eventDetails = await request('GET', encodeURI(eventURL))
    const eventOutput = JSON.parse(eventDetails.getBody())
    let finalOutput = await Promise.all(eventOutput.data.items.map(async (item) => {
        let newItem = {}
        const rsvpURL = `https://groups.community.sap.com/api/2.0/search?q=SELECT count(*) ` +
                        `FROM rsvps WHERE message.id = '${item.id}' and rsvp_response = 'yes'`
        const rsvpDetails = await request('GET', encodeURI(rsvpURL))
        const rsvpOutput = JSON.parse(rsvpDetails.getBody())
        newItem.id = item.id
        newItem.name = item.subject
        newItem.href = item.view_href
        newItem.startTime = item.occasion_data.start_time
        newItem.endTime = item.occasion_data.end_time
        newItem.timezone = item.occasion_data.timezone
        newItem.rsvpCount = rsvpOutput.data.count
        newItem.location = item.occasion_data.location

        return newItem
    }))
    return finalOutput
}

/**
 * Request the SAP Community Events Listing for a given Board
 * @param {string} boardId - SAP Community Unique Name for a Board
 * @param {integer} conversationId - Unique thread ID within a Board
 * @param {object} app - Express App object
 * @returns {object}
 */
async function getMessagePosters(boardId, conversationId, app) {
    const request = require('then-request')
    let newMessages = []
    let allMessages = []
    let i = 0
    while (newMessages.length > 1 || i === 0) {
        const searchURL = `https://groups.community.sap.com/api/2.0/search?q=SELECT author FROM messages WHERE ` +
                          `board.id = '${boardId}' and topic.id = '${conversationId}' LIMIT ${(i + 1) * 100} OFFSET ${i * 100}`
        app.logger.info(searchURL)
        let searchDetails = await request('GET', encodeURI(searchURL))
        const searchOutput = JSON.parse(searchDetails.getBody())
        newMessages = searchOutput.data.items
        if (newMessages.length > 1) {
            allMessages = allMessages.concat(newMessages)
        }
        i++
    }
    const allAuthors = allMessages.map(e => { return { "login": e.author.login, "id": e.author.id, "view_href": e.author.view_href } })
    const uniqueAuthors = [...new Set(allAuthors.map(o => JSON.stringify(o)))].map(s => JSON.parse(s))
    return uniqueAuthors
}

/**
 * Request the SAP Community Events Listing for a given Board
 * @param {string} boardId - SAP Community Unique Name for a Board
 * @param {object} app - Express App object
 * @returns {object}
 */
async function getEvents(boardId, app) {
    const request = require('then-request')
    const start = new Date()

    const eventURL = `https://groups.community.sap.com/api/2.0/search?q=SELECT * FROM messages WHERE board.id='${boardId}' ` +
                     `and occasion_data.start_time >= '${start.toISOString()}' order by occasion_data.start_time asc`
    app.logger.info(eventURL)
    let eventDetails = await request('GET', encodeURI(eventURL))
    const eventOutput = JSON.parse(eventDetails.getBody())
    return eventOutput

}

/**
 * Request the SAP Community Event Details
 * @param {number} eventId - SAP Community Event ID unique numeric
 * @param {object} app - Express App object
 * @returns {object}
 */
async function getEvent(eventId, app) {

    let eventDetails = {}
    const request = require('then-request')
    const eventURL = `https://groups.community.sap.com/api/2.0/search?q=SELECT occasion_data FROM messages WHERE id='${eventId}'`
    const rsvpURL = `https://groups.community.sap.com/api/2.0/search?q=SELECT id, user.login, user.email, user.first_name, user.last_name, ` +
                    `rsvp_response, user.view_href, user.sso_id FROM rsvps WHERE message.id = '${eventId}'`
    app.logger.info(eventURL)
    app.logger.info(rsvpURL)
    let [event, rsvp] = await Promise.all([
        request('GET', encodeURI(eventURL)),
        request('GET', encodeURI(rsvpURL))
    ])

    const eventOutput = JSON.parse(event.getBody())
    const rsvpOutput = JSON.parse(rsvp.getBody())
    let outputItems = []
    for (let item of rsvpOutput.data.items) {
        let output = {}
        output.id = item.user.id
        output.login = item.user.login
        output.email = item.user.email
        output.view_href = item.user.view_href
        outputItems.push(output)
    }
    eventDetails = {
        event: eventOutput.data.items[0].occasion_data.location,
        startTime: eventOutput.data.items[0].occasion_data.start_time,
        endTime: eventOutput.data.items[0].occasion_data.end_time,
        timezone: eventOutput.data.items[0].occasion_data.timezone,
        rsvp: outputItems
    }
    return eventDetails

}