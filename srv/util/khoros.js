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
    if (!body?.data?.items?.length) {
        // Empty-result canary for the per-user lookup. callUserAPI itself
        // converts this into a thrown error one frame up (so the SVG/PNG
        // routes render the standard "user not found" image), but we log
        // first so a real anonymous-permission revocation shows up in the
        // logs rather than as a generic user-not-found error to end users.
        console.warn(
            `[khoros] searchAuthor returned 0 items for WHERE ${whereClause}.`
        )
    }
    return body?.data?.items?.[0]?.author || null
}

// Low-level Khoros search helper — runs a raw `SELECT <fields> FROM messages
// WHERE <whereClause>` against community.sap.com/khhcw49343 and returns the
// raw `data.items` array. Centralizes the silent-empty warning so every
// caller benefits.
//
// The `messages` collection is the **only** anonymously-readable surface
// since mid-2026; anything that needs user, badge, or rank data must
// project it via `author.*` field expansion through this helper.
async function searchMessages(whereClause, fields, opts = {}) {
    const request = require('then-request')
    const limit = Number.isFinite(opts.limit) ? opts.limit : 100
    const offset = Number.isFinite(opts.offset) && opts.offset > 0 ? opts.offset : 0
    const tail = offset > 0 ? ` LIMIT ${limit} OFFSET ${offset}` : ` LIMIT ${limit}`
    const query = `SELECT ${fields} FROM messages WHERE ${whereClause}${tail}`
    const url = `${searchAPIURL}?q=${encodeURIComponent(query)}`
    const res = await request('GET', url)
    const body = JSON.parse(res.getBody())
    if (body.status !== 'success') {
        throw new Error(`Khoros search failed: ${body.message || JSON.stringify(body)}`)
    }
    const items = body?.data?.items || []
    if (!items.length && offset === 0) {
        // See searchAuthor's note. Empty-on-success is the silent symptom of
        // a Khoros permission revocation; surfacing it as a warning means a
        // future revocation gets noticed in logs instead of looking like a
        // legitimate "no results" to callers. Only warn on the first page —
        // an empty later page is a normal pagination terminator.
        console.warn(
            `[khoros] searchMessages returned 0 items for WHERE ${whereClause}.`
        )
    }
    return items
}
module.exports.searchMessages = searchMessages

// Returns the deduped list of authors who have posted in a given grouphub,
// in the same envelope shape as the legacy /api/2.0/search?q=... FROM users
// query that anonymous callers can no longer use (revoked mid-2026; the query
// itself still returns HTTP 200 with status:"success" and items:[]).
//
// Pagination: Khoros 504s when asked to expand `author.*` over many thousand
// rows in a single response. We page through `messages` in chunks of
// `pageSize` (default 500 — verified safe; 1000 works but trends toward the
// timeout, 6000 reliably 504s). We stop when:
//   - Khoros returns fewer rows than pageSize (no more messages), OR
//   - We've fetched `maxMessages` rows (hard ceiling, default 5000), OR
//   - Two consecutive pages add no new authors (saturation — the rest of
//     the grouphub is the same posters re-posting).
//
// Caveats vs. the deprecated FROM users query:
//   - Only authors who have AUTHORED a message in the grouphub appear here.
//     Lurkers (read-only members) are not surfaced — no anonymous workaround
//     exists for them at the public tier.
//   - PII fields like `email` and `sso_id` are redacted to "" by Khoros for
//     anonymous callers. They are not projected.
//   - `first_name`/`last_name` are populated only when the underlying user
//     record exposes them; missing values are returned as undefined.
async function searchGrouphubMembers(grouphub, opts = {}) {
    const pageSize = Number.isFinite(opts.pageSize) ? opts.pageSize : 500
    const maxMessages = Number.isFinite(opts.maxMessages) ? opts.maxMessages : 5000
    const fields = 'author.id, author.login, author.first_name, author.last_name, author.view_href'
    const where = `node.id = 'grouphub:${grouphub}'`

    const byId = new Map()
    let offset = 0
    let saturationStreak = 0
    let pages = 0
    let truncated = false

    while (offset < maxMessages) {
        const limit = Math.min(pageSize, maxMessages - offset)
        const page = await searchMessages(where, fields, { limit, offset })
        pages += 1
        const sizeBefore = byId.size
        for (const it of page) {
            const a = it?.author
            if (a?.id && !byId.has(a.id)) {
                byId.set(a.id, {
                    type: 'user',
                    id: a.id,
                    login: a.login,
                    first_name: a.first_name,
                    last_name: a.last_name,
                    view_href: a.view_href
                })
            }
        }
        const newAuthors = byId.size - sizeBefore

        // No more messages — Khoros has exhausted the grouphub.
        if (page.length < limit) {
            break
        }
        // Saturation guard: if two consecutive full pages added no fresh
        // authors, keep going one more page (community shape often has bursts
        // of single-author replies); after THREE in a row, declare done.
        if (newAuthors === 0) {
            saturationStreak += 1
            if (saturationStreak >= 3) break
        } else {
            saturationStreak = 0
        }
        offset += limit
    }
    if (offset >= maxMessages) {
        truncated = true
    }

    const users = Array.from(byId.values())
    return {
        status: 'success',
        message: '',
        http_code: 200,
        data: {
            type: 'users',
            list_item_type: 'user',
            size: users.length,
            items: users,
            // Pagination breadcrumb so admins / smoke tests can see how the
            // result was assembled. Not part of the legacy envelope, but
            // additive — callers that ignore it are unaffected.
            _pagination: { pages, messagesScanned: offset, truncated, pageSize, maxMessages }
        }
    }
}
module.exports.searchGrouphubMembers = searchGrouphubMembers

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

// =============================================================================
// groups.community.sap.com — events, boards, threads, RSVPs, products
// -----------------------------------------------------------------------------
// The community.sap.com/khhcw49343 host (above) carries user-shaped data and
// has been hit by the mid-2026 anonymous-read revocation. THIS host serves
// boards, threads, events, and RSVPs and remains anonymously readable. Routes
// in routes/khorosUser.js previously inlined `request('GET', URL)` calls
// against it; centralizing them here means a future API-shape change only
// needs to be patched in one place.
// =============================================================================

const groupsSearchAPIURL = 'https://groups.community.sap.com/api/2.0/search'
module.exports.groupsSearchAPIURL = groupsSearchAPIURL

// Low-level helper: run an arbitrary `q=<liql>` against the groups search
// endpoint and return the parsed `data.items` array (or the full body if the
// caller needs metadata like `data.count`). Designed as a thin shim — the
// LiQL queries themselves are short and route-specific, so leaking the WHERE
// clause to callers keeps each helper readable.
//
// `opts.full=true` returns the parsed top-level body instead of `data.items`.
async function searchGroups(liqlQuery, app, opts = {}) {
    const request = require('then-request')
    const url = `${groupsSearchAPIURL}?q=${liqlQuery}`
    if (app?.logger?.info) app.logger.info(url)
    const res = await request('GET', encodeURI(url))
    const body = JSON.parse(res.getBody())
    if (body.status !== 'success') {
        throw new Error(`Khoros groups-search failed: ${body.message || JSON.stringify(body)}`)
    }
    return opts.full ? body : (body?.data?.items || [])
}
module.exports.searchGroups = searchGroups

async function getBoards(app) {
    const items = await searchGroups(`SELECT * FROM boards`, app, { full: true })
    return items
}
module.exports.getBoards = getBoards

async function getBoard(boardId, app) {
    const items = await searchGroups(`SELECT * FROM boards where id = '${boardId}'`, app)
    return items[0]
}
module.exports.getBoard = getBoard

async function getTopics(boardId, app) {
    return await searchGroups(
        `SELECT * FROM messages WHERE board.id = '${boardId}' AND depth = 0`,
        app
    )
}
module.exports.getTopics = getTopics

async function getMessagesForDiscussion(threadId, app) {
    return await searchGroups(
        `SELECT type, id, view_href, author.type, author.id, author.login` +
        ` FROM messages where ancestors.id = '${threadId}'`,
        app
    )
}
module.exports.getMessagesForDiscussion = getMessagesForDiscussion

// Returns the raw upcoming-events search response (full envelope).
async function getEvents(boardId, app) {
    const start = new Date()
    return await searchGroups(
        `SELECT * FROM messages WHERE board.id='${boardId}' ` +
        `and occasion_data.start_time >= '${start.toISOString()}' order by occasion_data.start_time asc`,
        app,
        { full: true }
    )
}
module.exports.getEvents = getEvents

// Per-board upcoming events with RSVP-count fan-out. One search to find the
// events; then one count(*) query per event in parallel via Promise.all.
async function getEventsRegs(boardId, app) {
    const start = new Date()
    const events = await searchGroups(
        `SELECT id, subject, view_href, occasion_data.location, occasion_data.start_time, occasion_data.end_time, occasion_data.timezone ` +
        `FROM messages WHERE board.id='${boardId}' and occasion_data.start_time >= '${start.toISOString()}' order by occasion_data.start_time asc`,
        app
    )
    return await Promise.all(events.map(async (item) => {
        const rsvpBody = await searchGroups(
            `SELECT count(*) FROM rsvps WHERE message.id = '${item.id}' and rsvp_response = 'yes'`,
            app,
            { full: true }
        )
        return {
            id: item.id,
            name: item.subject,
            href: item.view_href,
            startTime: item.occasion_data.start_time,
            endTime: item.occasion_data.end_time,
            timezone: item.occasion_data.timezone,
            rsvpCount: rsvpBody.data.count,
            location: item.occasion_data.location
        }
    }))
}
module.exports.getEventsRegs = getEventsRegs

// Single event details + RSVP list.
async function getEvent(eventId, app) {
    const [eventItems, rsvpItems] = await Promise.all([
        searchGroups(`SELECT occasion_data FROM messages WHERE id='${eventId}'`, app),
        searchGroups(
            `SELECT id, user.login, user.email, user.first_name, user.last_name, ` +
            `rsvp_response, user.view_href, user.sso_id FROM rsvps WHERE message.id = '${eventId}'`,
            app
        )
    ])
    const outputItems = rsvpItems.map(item => ({
        id: item.user.id,
        login: item.user.login,
        email: item.user.email,
        view_href: item.user.view_href
    }))
    return {
        event: eventItems[0].occasion_data.location,
        startTime: eventItems[0].occasion_data.start_time,
        endTime: eventItems[0].occasion_data.end_time,
        timezone: eventItems[0].occasion_data.timezone,
        rsvp: outputItems
    }
}
module.exports.getEvent = getEvent

// Paginate a thread's messages 100 at a time, deduping authors.
//
// QUIRK PRESERVED: the original implementation only included a page in the
// dedupe set if it returned MORE than 1 message (`newMessages.length > 1`).
// On a thread with exactly 1 message, that lone author is silently dropped.
// This is preserved verbatim so the route's response stays byte-identical
// across the refactor; if you intend to change it, do so in a separate
// behaviour-change commit with its own tests.
async function getMessagePosters(boardId, conversationId, app) {
    let newMessages = []
    const allMessages = []
    let i = 0
    while (newMessages.length > 1 || i === 0) {
        newMessages = await searchGroups(
            `SELECT author FROM messages WHERE board.id = '${boardId}' and topic.id = '${conversationId}' ` +
            `LIMIT ${(i + 1) * 100} OFFSET ${i * 100}`,
            app
        )
        if (newMessages.length > 1) {
            allMessages.push(...newMessages)
        }
        i++
    }
    const allAuthors = allMessages.map(e => ({
        login: e.author.login,
        id: e.author.id,
        view_href: e.author.view_href
    }))
    return [...new Set(allAuthors.map(o => JSON.stringify(o)))].map(s => JSON.parse(s))
}
module.exports.getMessagePosters = getMessagePosters

// Active SAP Community products/tags, sorted alphabetically and grouped by
// first letter ("SAP " prefix is stripped for sort purposes).
async function getCommunityTags(app) {
    const allTags = await searchGroups(
        `SELECT id, title, tag_scope FROM products WHERE status = 'active' LIMIT 10000 `,
        app
    )

    function isLetter(char) { return /^[a-zA-Z]$/.test(char) }

    for (const item of allTags) {
        item.sortTitle = item.title.startsWith('SAP ') ? item.title.slice(4) : item.title
        item.group = item.sortTitle.slice(0, 1).toUpperCase()
        if (!isLetter(item.group)) item.group = ``
        item.link = encodeURI(`https://community.sap.com/t5/c-khhcw49343/${item.title}/pd-p/${item.id}`)
    }
    allTags.sort((a, b) => a.sortTitle.localeCompare(b.sortTitle))

    return allTags.reduce((groups, item) => {
        const group = item.group || ' '
        if (!groups[group]) groups[group] = []
        groups[group].push(item)
        return groups
    }, {})
}
module.exports.getCommunityTags = getCommunityTags