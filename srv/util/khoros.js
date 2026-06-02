const fs = require('fs')
const path = require('path')

const cacheFile = path.join(__dirname, 'util', 'tags.json')
module.exports.cacheFile = cacheFile

// Direct user lookups against this endpoint started returning HTTP 404 (code 303,
// "The user was not found") around mid-2026 after SAP Community revoked
// allow_restapi_call_read for the anonymous user. Kept exported for backward
// compatibility — callUserAPI now goes through the messages.author.* expansion
// at searchAPIURL (see below).
const userAPIURL = 'https://community.sap.com/khhcw49343/api/2.0/users/'
module.exports.userAPIURL = userAPIURL

const searchAPIURL = 'https://community.sap.com/khhcw49343/api/2.0/search'
module.exports.searchAPIURL = searchAPIURL

// Fields projected from messages.author.* — together they reconstruct the
// shape the routes expect under scnItems.data.* (login, name, metrics, rank,
// avatar, signature, view_href, and user_badges.items[].badge.{id,title,
// icon_url,description} + earned_date). avatar/signature/view_href are
// consumed by the FLP Badge Signature Builder (srv/app/flp/profile/) which
// hits /khoros/user/:scnId via getSCNProfile (routes/khorosUser.js).
const AUTHOR_FIELDS = [
    'author.id',
    'author.login',
    'author.first_name',
    'author.last_name',
    'author.rank.name',
    'author.metrics.posts',
    'author.avatar.profile',
    'author.signature',
    'author.view_href',
    'author.user_badges.badge.id',
    'author.user_badges.badge.title',
    'author.user_badges.badge.icon_url',
    'author.user_badges.badge.description',
    'author.user_badges.earned_date'
].join(',')

async function searchAuthor(whereClause) {
    const request = require('then-request')
    const query = `SELECT ${AUTHOR_FIELDS} FROM messages WHERE ${whereClause} LIMIT 1`
    const url = `${searchAPIURL}?q=${encodeURIComponent(query)}`
    const res = await request('GET', url)
    const body = JSON.parse(res.getBody())
    if (body.status !== 'success') {
        throw new Error(`Khoros search failed: ${body.message || JSON.stringify(body)}`)
    }
    return body?.data?.items?.[0]?.author || null
}

// Resolves a user via two strategies, in order:
//   1. If scnId looks numeric → SELECT ... WHERE author.id = '<scnId>'
//   2. Else / on miss          → SELECT ... WHERE author.login = '<normalized>'
// where normalization replaces dots with underscores (the community migrated
// dotted logins like "thomas.jung" to "thomas_jung").
// Returned shape mirrors the legacy /users/:id response — { data: <author> } —
// so callers (showcaseBadges, activityCounts, devtoberfest) remain unchanged.
async function callUserAPI(scnId) {
    try {
        const id = String(scnId)
        const isNumeric = /^\d+$/.test(id)
        let author = null

        if (isNumeric) {
            author = await searchAuthor(`author.id = '${id}'`)
        }
        if (!author) {
            const login = id.replace(/\./g, '_')
            author = await searchAuthor(`author.login = '${login}'`)
        }
        if (!author && !isNumeric && id !== id.replace(/\./g, '_')) {
            // last-ditch: try the original (dotted) form unchanged
            author = await searchAuthor(`author.login = '${id}'`)
        }
        if (!author) {
            throw new Error(`No messages found for user '${scnId}' — user may have zero posts or the ID/login is unknown`)
        }
        return { data: author }
    } catch (error) {
        throw new Error(`Error fetching SCN data for ID ${scnId}: ${error.message}`, { cause: error })
    }
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
  
  async function getDevtoberfestMembers(){
    const request = require('then-request')
    const urlMembers = `https://raw.githubusercontent.com/SAP-samples/sap-community-activity-badges/main/srv/util/members.json`

    let itemsRes = await request('GET', encodeURI(urlMembers))
    const members = JSON.parse(itemsRes.getBody())
    return members
  }
  module.exports.getDevtoberfestMembers = getDevtoberfestMembers