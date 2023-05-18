
module.exports = (app) => {


    app.get('/khoros/user/:scnId', async (req, res) => {
        try {
            let profile = await getSCNProfile(req)
            return res.type("application/json").status(200).send(profile)
        } catch (error) {
            app.logger.error(error)
            const errHandler = require("../util/error")
            return await errHandler.handleErrorDevtoberfestText(error, req, res)
        }
    })

    app.get('/khoros/event/:eventId', async (req, res) => {
        try {
            let profile = await getEvent(req)
            return res.type("application/json").status(200).send(profile)
        } catch (error) {
            app.logger.error(error)
            const errHandler = require("../util/error")
            return await errHandler.handleErrorDevtoberfestText(error, req, res)
        }
    })

    //CodeJam Events Board: codejam-events
    app.get('/khoros/events/:boardId', async (req, res) => {
        try {
            let profile = await getEvents(req)
            return res.type("application/json").status(200).send(profile)
        } catch (error) {
            app.logger.error(error)
            const errHandler = require("../util/error")
            return await errHandler.handleErrorDevtoberfestText(error, req, res)
        }
    })

    app.get('/khoros/boards/', async (req, res) => {
        try {
            let profile = await getBoards(req)
            return res.type("application/json").status(200).send(profile)
        } catch (error) {
            app.logger.error(error)
            const errHandler = require("../util/error")
            return await errHandler.handleErrorDevtoberfestText(error, req, res)
        }
    })
}

async function getSCNProfile(req) {
    switch (req.params.scnId) {
        //Dummy Redirect SCN ID when none is supplied
        case 'scnId.Here':
            let e = new Error('No SCN ID')
            e.name = 'No SCN ID'
            e.scnId = req.params.scnId
            throw e
        default:
            const request = require('then-request')
            const userURL = `https://groups.community.sap.com/api/2.0/users/${req.params.scnId}`
            let userDetails = await request('GET', userURL)
            const userOutput = JSON.parse(userDetails.getBody())
            return userOutput
    }
}
async function getBoards(req) {
    const request = require('then-request')
    const boardURL = `https://groups.community.sap.com/api/2.0/search?q=SELECT * FROM boards`
    let boardDetails = await request('GET', boardURL)
    const boardOutput = JSON.parse(boardDetails.getBody())
    return boardOutput
}

async function getEvents(req) {
    const request = require('then-request')
    const start = new Date()

    const eventURL = `https://groups.community.sap.com/api/2.0/search?q=SELECT * FROM messages WHERE board.id='${req.params.boardId}' and occasion_data.start_time >= '${start.toISOString()}' order by occasion_data.start_time asc`
    let eventDetails = await request('GET', eventURL)
    const eventOutput = JSON.parse(eventDetails.getBody())

/*     await Promise.all(eventOutput.data.items.map(async (item) => {

    })) */
    return eventOutput

}
async function getEvent(req) {

    let eventDetails = {}
    const request = require('then-request')
    const eventURL = `https://groups.community.sap.com/api/2.0/search?q=SELECT occasion_data FROM messages WHERE id='${req.params.eventId}'`
    const rsvpURL = `https://groups.community.sap.com/api/2.0/search?q=SELECT id, user.login, user.email, user.first_name, user.last_name, rsvp_response, user.view_href, user.sso_id FROM rsvps WHERE message.id = '${req.params.eventId}'`

    let [event, rsvp] = await Promise.all([
        request('GET', eventURL),
        request('GET', rsvpURL)
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