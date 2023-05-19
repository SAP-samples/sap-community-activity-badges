
module.exports = (app) => {


    app.get('/khoros/user/:scnId', async (req, res) => {
        try {
            let profile = await getSCNProfile(req.params.scnId)
            return res.type("application/json").status(200).send(profile)
        } catch (error) {
            app.logger.error(error)
            const errHandler = require("../util/error")
            return await errHandler.handleErrorDevtoberfestText(error, req, res)
        }
    })

    app.get('/khoros/event/:eventId', async (req, res) => {
        try {
            let profile = await getEvent(req.params.eventId)
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
            let profile = await getEvents(req.params.boardId)
            return res.type("application/json").status(200).send(profile)
        } catch (error) {
            app.logger.error(error)
            const errHandler = require("../util/error")
            return await errHandler.handleErrorDevtoberfestText(error, req, res)
        }
    })

    //CodeJam Events Board: codejam-events
    app.get('/khoros/eventRegsRaw/:boardId', async (req, res) => {
        try {
            let profile = await getEventsRegs(req.params.boardId)
            return res.type("application/json").status(200).send(profile)
        } catch (error) {
            app.logger.error(error)
            const errHandler = require("../util/error")
            return await errHandler.handleErrorDevtoberfestText(error, req, res)
        }
    })

    //CodeJam Events Board: codejam-events
    app.get('/khoros/eventRegs/:boardId', async (req, res) => {
        try {
            let profile = await getEventsRegs(req.params.boardId)
            let output = '<!DOCTYPE html><html><body>'
            for (let item of profile) {
                output += `<a href="${item.href}"><h3>${item.name}</h2></a>`
                if(item.rsvpCount >= 25){
                    output += `<li>RSVP Count: ${item.rsvpCount} 🛑</li>`
                }else if(item.rsvpCount >= 20){
                    output += `<li>RSVP Count: ${item.rsvpCount} 🟡</li>`
                }else{
                    output += `<li>RSVP Count: ${item.rsvpCount} </li>`
                }
                output += `<li id="${item.id}"></li>`
                output += 
                `<script>` +
                `date1 = new Date( ` +
                `    (typeof date === "string" ? new Date('${item.startTime}') : '${item.startTime}') ` +
                `  ).toLocaleString(Intl.DateTimeFormat().resolvedOptions().locale, { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, dateStyle: 'full', timeStyle: 'full' }); ` +
                `date2 = new Date( ` +
                `    (typeof date === "string" ? new Date('${item.startTime}') : '${item.startTime}') ` +
                `  ).toLocaleString(Intl.DateTimeFormat().resolvedOptions().locale, { timeZone: '${item.timezone}', dateStyle: 'full', timeStyle: 'full' }); ` +
                `document.getElementById("${item.id}").innerHTML = 'Start Time: ' + date1 + ' / ' + date2` +
                `</script>`
                output += `<li>Location: ${item.location}</li>`
            }

            output += `</body></html>`
            return res.type("text/html").status(200).send(output)
        } catch (error) {
            app.logger.error(error)
            const errHandler = require("../util/error")
            return await errHandler.handleErrorDevtoberfestText(error, req, res)
        }
    })

    app.get('/khoros/boards/', async (req, res) => {
        try {
            let profile = await getBoards()
            return res.type("application/json").status(200).send(profile)
        } catch (error) {
            app.logger.error(error)
            const errHandler = require("../util/error")
            return await errHandler.handleErrorDevtoberfestText(error, req, res)
        }
    })
}

async function getSCNProfile(scnId) {
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
            let userDetails = await request('GET', userURL)
            const userOutput = JSON.parse(userDetails.getBody())
            return userOutput
    }
}

async function getBoards() {
    const request = require('then-request')
    const boardURL = `https://groups.community.sap.com/api/2.0/search?q=SELECT * FROM boards`
    let boardDetails = await request('GET', boardURL)
    const boardOutput = JSON.parse(boardDetails.getBody())
    return boardOutput
}

async function getEventsRegs(boardId) {
    const request = require('then-request')
    const start = new Date()

    const eventURL =
        `https://groups.community.sap.com/api/2.0/search?q=` +
        `SELECT id, subject, view_href, occasion_data.location, occasion_data.start_time, occasion_data.end_time, occasion_data.timezone ` +
        `FROM messages WHERE board.id='${boardId}' and occasion_data.start_time >= '${start.toISOString()}' order by occasion_data.start_time asc`
    let eventDetails = await request('GET', eventURL)
    const eventOutput = JSON.parse(eventDetails.getBody())
    let finalOutput = await Promise.all(eventOutput.data.items.map(async (item) => {
        let newItem = {}
        const rsvpURL = `https://groups.community.sap.com/api/2.0/search?q=SELECT count(*) FROM rsvps WHERE message.id = '${item.id}' and rsvp_response = 'yes'`
        const rsvpDetails = await request('GET', rsvpURL)
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

async function getEvents(boardId) {
    const request = require('then-request')
    const start = new Date()

    const eventURL = `https://groups.community.sap.com/api/2.0/search?q=SELECT * FROM messages WHERE board.id='${boardId}' and occasion_data.start_time >= '${start.toISOString()}' order by occasion_data.start_time asc`
    let eventDetails = await request('GET', eventURL)
    const eventOutput = JSON.parse(eventDetails.getBody())

    /*     await Promise.all(eventOutput.data.items.map(async (item) => {
    
        })) */
    return eventOutput

}
async function getEvent(eventId) {

    let eventDetails = {}
    const request = require('then-request')
    const eventURL = `https://groups.community.sap.com/api/2.0/search?q=SELECT occasion_data FROM messages WHERE id='${eventId}'`
    const rsvpURL = `https://groups.community.sap.com/api/2.0/search?q=SELECT id, user.login, user.email, user.first_name, user.last_name, rsvp_response, user.view_href, user.sso_id FROM rsvps WHERE message.id = '${eventId}'`

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