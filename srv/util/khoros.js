const userAPIURL = 'https://community.sap.com/khhcw49343/api/2.0/users/'
module.exports.userAPIURL

async function callUserAPI(scnId) {
    const request = require('then-request')
    const urlBadges = `${userAPIURL}${scnId}`

    let itemsRes = await request('GET', encodeURI(urlBadges))
    const scnItems = JSON.parse(itemsRes.getBody())
    return scnItems
}
module.exports.callUserAPI = callUserAPI

function handleUserName(scnId, scnItems) {
    let userName = scnId
    if (scnItems.data) {
        userName = scnItems.data.login
        if (scnItems.data.first_name && (scnItems.data.first_name !== '')) {
            userName = `${scnItems.data.first_name} ${scnItems.data.last_name}`
        }
    }

    return userName
}

module.exports.handleUserName = handleUserName