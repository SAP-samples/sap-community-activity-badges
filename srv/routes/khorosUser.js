
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

    app.get('/khoros/events/:eventId', async (req, res) => {
        try {
            let profile = await getEvent(req)
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

async function getEvent(req) {

            let eventDetails = {}
            const request = require('then-request')
            const eventURL = `https://groups.community.sap.com/api/2.0/search?q=SELECT occasion_data FROM messages WHERE id='${req.params.eventId}'`
            const rsvpURL = `https://groups.community.sap.com/api/2.0/search?q=SELECT * FROM rsvps WHERE message.id = '${req.params.eventId}'`

            let [event, rsvp] = await Promise.all([
                request('GET', eventURL),
                request('GET', rsvpURL)
            ])

            const eventOutput = JSON.parse(event.getBody())
            const rsvpOutput = JSON.parse(rsvp.getBody())
            let outputItems = []
             for (let item of rsvpOutput.data.items) {
                let output = {}
                const userURL = `https://groups.community.sap.com/api/2.0/users/${item.user.id}`
                let userDetails = await request('GET', userURL)
                const userOutput = JSON.parse(userDetails.getBody())
                output.id = item.user.id
                output.login = userOutput.data.login
                output.email = userOutput.data.email
                output.view_href = userOutput.data.view_href
                outputItems.push(output)
            } 
            eventDetails = {
                event: eventOutput.data.items[0].occasion_data.location,
                startTime: eventOutput.data.items[0].occasion_data.start_time,
                endTime: eventOutput.data.items[0].occasion_data.end_time,
                timezone: eventOutput.data.items[0].occasion_data.timezone,
                rsvp: outputItems}
            return eventDetails 

}