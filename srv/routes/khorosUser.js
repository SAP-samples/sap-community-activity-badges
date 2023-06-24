
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
                        href="${encodeURI("https://groups.community.sap.com/api/2.0/search?q=SELECT id, user.login, user.email, user.first_name, user.last_name, rsvp_response, user.sso_id FROM rsvps WHERE rsvp_response = 'yes' and message.id = '" + item.id +"'")}">
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
                if(item.rsvpCount >= 25){
                    output += `<li>RSVP Count: ${item.rsvpCount} 🛑</li>`
                }else if(item.rsvpCount >= 20){
                    output += `<li>RSVP Count: ${item.rsvpCount} 🟡</li>`
                }else{
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