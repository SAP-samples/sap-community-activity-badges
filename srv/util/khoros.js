const fs = require('fs')
const path = require('path')

const cacheFile = path.join(__dirname, 'util', 'tags.json')
module.exports.cacheFile = cacheFile

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

// Function to check if file exists and if it's older than 1 day
function checkFileAge(filePath) {
    // Check if the file exists
    if (fs.existsSync(filePath)) {
      // Get the stats of the file
      const stats = fs.statSync(filePath)
  
      // Calculate the age of the file in milliseconds
      const fileAgeInMs = Date.now() - stats.mtimeMs
  
      // Convert 1 day to milliseconds
      const oneDayInMs = 24 * 60 * 60 * 1000
  
      // Check if the file is older than 1 day
      if (fileAgeInMs > oneDayInMs) {
        return false
      } else {
        return true
      }
    } else {
      return false
    }
  }

  module.exports.checkFileAge = checkFileAge
  