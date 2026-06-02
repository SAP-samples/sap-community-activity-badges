// Smoke test for srv/util/khoros.js callUserAPI against the live Khoros API.
// Exercises both the production-failing case (numeric SCN ID 139 = thomas_jung)
// and a login-form lookup. Confirms the shape consumed by routes is intact:
//   - data.login / data.first_name / data.last_name
//   - data.metrics.posts / data.rank.name
//   - data.avatar.profile / data.signature / data.view_href  (FLP Badge Signature Builder)
//   - data.user_badges.items[].badge.id|title|icon_url
//   - data.user_badges.items[].earned_date
//
// Usage:  node srv/smokeTestKhoros.mjs
// Exits non-zero on any assertion failure.

import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const khoros = require('./util/khoros.js')

let failures = 0
function assert(cond, msg) {
    if (cond) {
        console.log(`  ok   ${msg}`)
    } else {
        console.error(`  FAIL ${msg}`)
        failures++
    }
}

async function runCase(label, scnId) {
    console.log(`\n[${label}]  callUserAPI(${JSON.stringify(scnId)})`)
    let result
    try {
        result = await khoros.callUserAPI(scnId)
    } catch (e) {
        console.error(`  THREW: ${e.message}`)
        failures++
        return
    }

    assert(result && typeof result === 'object', 'returns an object')
    assert(result?.data && typeof result.data === 'object', 'has .data')
    assert(typeof result?.data?.login === 'string' && result.data.login.length > 0, '.data.login is non-empty string')
    assert(typeof result?.data?.first_name === 'string', '.data.first_name is string')
    assert(typeof result?.data?.last_name === 'string', '.data.last_name is string')
    assert(typeof result?.data?.metrics?.posts === 'number', '.data.metrics.posts is number')
    assert(typeof result?.data?.rank?.name === 'string', '.data.rank.name is string')
    // Fields used by the FLP Badge Signature Builder (App.view.xml + App.controller.js).
    // These don't have to be non-empty (a fresh user may have no signature/avatar),
    // but the keys must exist so SAPUI5 binding paths resolve without errors.
    assert('avatar' in (result?.data ?? {}), '.data.avatar key present (FLP avatar binding)')
    assert(typeof result?.data?.avatar?.profile === 'string' || result?.data?.avatar?.profile === null,
        '.data.avatar.profile is string or null')
    assert(typeof result?.data?.signature === 'string', '.data.signature is string (HTML, may be empty)')
    assert(typeof result?.data?.view_href === 'string' && result.data.view_href.length > 0,
        '.data.view_href is non-empty URL')
    assert(Array.isArray(result?.data?.user_badges?.items), '.data.user_badges.items is array')
    assert((result?.data?.user_badges?.items?.length ?? 0) > 0, 'has at least one badge')

    const firstBadge = result?.data?.user_badges?.items?.[0]
    assert(typeof firstBadge?.badge?.id === 'string' || typeof firstBadge?.badge?.id === 'number', 'badge.id present')
    assert(typeof firstBadge?.badge?.title === 'string' && firstBadge.badge.title.length > 0, 'badge.title non-empty')
    assert(typeof firstBadge?.badge?.icon_url === 'string' && firstBadge.badge.icon_url.startsWith('http'), 'badge.icon_url is URL')
    assert(typeof firstBadge?.earned_date === 'string' && firstBadge.earned_date.length > 0, 'badge.earned_date is string')

    // handleUserName end-to-end check (used by every route for the title text)
    const userName = khoros.handleUserName(scnId, result)
    assert(typeof userName === 'string' && userName.length > 0 && userName !== String(scnId),
        `handleUserName resolves to a real name (got: ${JSON.stringify(userName)})`)
}

await runCase('numeric scnId',   '139')
await runCase('login scnId (underscored)', 'thomas_jung')
await runCase('login scnId (legacy dotted form)', 'thomas.jung')

// --- searchGrouphubMembers smoke test ----------------------------------
// Devtoberfest is the canonical grouphub used everywhere else in the repo
// (members.json, gameboard, /khoros/devtoberfestMembers). It always has
// recent posts, so the messages.author.* workaround is guaranteed to find
// some posters. Asserting on the SHAPE rather than a specific count, since
// the live community traffic varies.
//
// Uses small page/cap params (pageSize:100, maxMessages:300) so the smoke
// test stays fast and within Khoros' single-page comfort zone — production
// callers use the defaults (500 / 5000).
console.log(`\n[searchGrouphubMembers]  searchGrouphubMembers('Devtoberfest', {pageSize:100, maxMessages:300})`)
try {
    const r = await khoros.searchGrouphubMembers('Devtoberfest', { pageSize: 100, maxMessages: 300 })
    assert(r?.status === 'success', 'envelope.status === "success"')
    assert(r?.data?.list_item_type === 'user', 'envelope.data.list_item_type === "user"')
    assert(Array.isArray(r?.data?.items), 'envelope.data.items is array')
    assert((r?.data?.items?.length ?? 0) > 0, 'returns at least one posting member')
    assert(r?.data?.size === r?.data?.items?.length, 'envelope.data.size matches items.length')

    const first = r?.data?.items?.[0]
    assert(typeof first?.id === 'string' && first.id.length > 0, 'first member.id is non-empty string')
    assert(typeof first?.login === 'string' && first.login.length > 0, 'first member.login is non-empty string')
    assert(first?.type === 'user', 'first member.type === "user"')

    // Dedupe assertion — if the same author appears in 50 messages, they
    // should appear ONCE in the deduped envelope.
    const ids = r.data.items.map(u => u.id)
    const uniqueIds = new Set(ids)
    assert(ids.length === uniqueIds.size, 'envelope items are deduped by id')

    // Pagination breadcrumb — proves the loop ran more than once and the
    // result really came from stitched pages, not a single big request.
    const pg = r?.data?._pagination
    assert(pg && typeof pg === 'object', '_pagination breadcrumb present')
    assert(pg?.pageSize === 100, '_pagination.pageSize echoes the option')
    assert(pg?.maxMessages === 300, '_pagination.maxMessages echoes the option')
    assert(typeof pg?.pages === 'number' && pg.pages >= 1, '_pagination.pages is a positive integer')
    assert(typeof pg?.messagesScanned === 'number' && pg.messagesScanned >= pg.pages * 0,
        '_pagination.messagesScanned is non-negative')
    assert(typeof pg?.truncated === 'boolean', '_pagination.truncated is boolean')
} catch (e) {
    console.error(`  THREW: ${e.message}`)
    failures++
}

// --- groups.community.sap.com helpers (refactor coverage) ---------------
// These exercise the data-fetching helpers that used to be inlined in
// routes/khorosUser.js. They run against the live SAP Community API, so
// we keep assertions on shape/non-emptiness rather than exact values.
const stubApp = { logger: { info() {}, error() {} } }

console.log(`\n[getBoards]  khoros.getBoards()`)
try {
    const r = await khoros.getBoards(stubApp)
    assert(r?.status === 'success', 'envelope.status === "success"')
    assert(Array.isArray(r?.data?.items) && r.data.items.length > 0, 'returns at least one board')
    assert(typeof r?.data?.items?.[0]?.id === 'string', 'first board has string id')
} catch (e) {
    console.error(`  THREW: ${e.message}`)
    failures++
}

console.log(`\n[getBoard]  khoros.getBoard('application-developmentforum-board')`)
try {
    const b = await khoros.getBoard('application-developmentforum-board', stubApp)
    assert(b && typeof b === 'object', 'returns a board object')
    assert(b?.id === 'application-developmentforum-board', 'board.id matches request')
} catch (e) {
    console.error(`  THREW: ${e.message}`)
    failures++
}

console.log(`\n[getCommunityTags]  khoros.getCommunityTags()`)
try {
    const groupsByLetter = await khoros.getCommunityTags(stubApp)
    assert(groupsByLetter && typeof groupsByLetter === 'object', 'returns a grouped object')
    const letterKeys = Object.keys(groupsByLetter)
    assert(letterKeys.length > 0, 'has at least one letter group')
    const sampleGroup = groupsByLetter[letterKeys[0]]
    assert(Array.isArray(sampleGroup) && sampleGroup.length > 0, 'first group has items')
    const sample = sampleGroup[0]
    assert(typeof sample?.title === 'string', 'tag.title is string')
    assert(typeof sample?.link === 'string' && sample.link.startsWith('https://community.sap.com/'),
        'tag.link is community URL')
    assert(typeof sample?.sortTitle === 'string', 'tag.sortTitle is string (computed)')
} catch (e) {
    console.error(`  THREW: ${e.message}`)
    failures++
}

console.log(`\n${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`}`)
process.exit(failures === 0 ? 0 : 1)
