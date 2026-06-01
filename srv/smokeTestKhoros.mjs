// Smoke test for srv/util/khoros.js callUserAPI against the live Khoros API.
// Exercises both the production-failing case (numeric SCN ID 139 = thomas_jung)
// and a login-form lookup. Confirms the shape consumed by routes is intact:
//   - data.login / data.first_name / data.last_name
//   - data.metrics.posts / data.rank.name
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

console.log(`\n${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`}`)
process.exit(failures === 0 ? 0 : 1)
