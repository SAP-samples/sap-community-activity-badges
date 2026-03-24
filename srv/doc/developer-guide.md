# Developer Technical Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Server Bootstrap](#server-bootstrap)
3. [Middleware Stack](#middleware-stack)
4. [Route Reference](#route-reference)
   - [Image Card Routes](#image-card-routes)
   - [Devtoberfest Routes](#devtoberfest-routes)
   - [Khoros Data Routes](#khoros-data-routes)
   - [Infrastructure Routes](#infrastructure-routes)
5. [Khoros API Consumption](#khoros-api-consumption)
6. [SVG Rendering Engine](#svg-rendering-engine)
7. [Error Handling](#error-handling)
8. [Static Data Files](#static-data-files)
9. [Internationalization](#internationalization)

---

## Architecture Overview

The service is a single Express 5 Node.js application. All HTTP responses are either:
- **SVG images** (default) — assembled by concatenating SVG string fragments
- **PNG images** (optional `?png=true`) — the SVG buffer is passed to `sharp` for rasterization
- **GIF images** (optional `?gif=true`) — the SVG buffer is passed to `sharp` for animated GIF output
- **HTML pages** — the landing page (`/`) and the Devtoberfest gameboard
- **JSON** — internal Khoros API proxy endpoints

```
Request
  └─ Express router
       ├─ routes/activityCounts.js     → SVG/PNG card
       ├─ routes/showcaseBadges.js     → SVG/PNG/GIF card
       ├─ routes/devtoberfest.js       → HTML page (SVG embedded) or JSON
       ├─ routes/khorosUser.js         → JSON (Khoros proxy) / HTML admin tools
       ├─ routes/selfie.js             → PNG (sharp composite) via POST
       └─ routes/intro.js             → static files, landing page
```

All image-generating routes share the same composition pattern:

```js
svg.svgHeader(width, height)
+ svg.svgStyles(...)
+ svg.svgBackground()
+ svg.svgContentHeader(title)
+ svg.svgMainContent(...items)
+ svg.svgEnd()
```

---

## Server Bootstrap

**Entry point:** `srv/index.js` → instantiates `ExpressServer` from `srv/express-server.js`.

`ExpressServer.start()` does two things in order:

1. **Loads `srv/server/express.js`** — attaches all middleware (logging, CORS, security headers, health check, overload protection, Swagger UI).
2. **Auto-discovers routes** — globs `srv/routes/**/*.js` and calls each module as `module(app)`. Routes self-register during this call. Order of registration is filesystem order.

Default port: `4000`. Override with the `PORT` environment variable (Cloud Foundry sets this automatically).

---

## Middleware Stack

Configured in `srv/server/express.js`, applied in this order:

| Middleware | Source | Purpose |
|---|---|---|
| `@sap/logging` | `srv/server/express.js` | SAP-standard structured request logging. `app.logger` is the application logger instance available in all route files. |
| `etag: false` | `srv/server/express.js` | Disables Express ETags globally. |
| `@cloudnative/health-connect` | `srv/server/healthCheck.js` | Exposes `/health` endpoint for Cloud Foundry health checks. |
| `overload-protection` | `srv/server/overloadProtection.js` | Returns HTTP 503 when event loop lag exceeds threshold. |
| `cors` | `srv/server/express.js` | CORS open to all origins (`*`). No authentication. |
| `expressSecurity.js` | `srv/server/expressSecurity.js` | Stub — authentication is intentionally disabled (service is public). |
| `swagger-ui-express` | `srv/server/swagger.js` | Mounts Swagger UI at `/docs/`. JSDoc `@swagger` annotations in `routes/*.js` are the source of the spec. |
| `favicon` | `srv/express-server.js` | Serves `srv/images/favicon.ico`. |

---

## Route Reference

### Image Card Routes

#### `GET /activity/:scnId`

Renders a card showing a user's post count and community rank.

**File:** `srv/routes/activityCounts.js`

**Parameters:**
| Name | Type | Required | Description |
|---|---|---|---|
| `scnId` | path | yes | SAP Community user ID (numeric string or login name) |
| `png` | query | no | Any truthy value → return PNG instead of SVG |
| `gif` | query | no | Same effect as `png` for this route |

**Flow:**
1. Calls `khoros.callUserAPI(scnId)` to fetch the user profile from the Khoros API.
2. Extracts `scnItems.data.metrics.posts` and `scnItems.data.rank.name`.
3. Assembles a 500×150 SVG card with two activity rows (Posts, Rank).
4. Returns `image/svg+xml` or `image/png` via `sharp`.

**Error output:** On any failure, `util/error.handleError` renders the error message as an SVG card with the same dimensions.

---

#### `GET /showcaseBadges/:scnId[/:badge1[/:badge2[/:badge3[/:badge4[/:badge5]]]]]`

Renders a card showing up to 5 community badges for a user.

**File:** `srv/routes/showcaseBadges.js`

**Parameters:**
| Name | Type | Required | Description |
|---|---|---|---|
| `scnId` | path | yes | SAP Community user ID |
| `badge1`–`badge5` | path (wildcard segments) | no | Specific badge IDs to display; if omitted, the first 5 earned badges are shown |
| `png` | query | no | Return PNG |
| `gif` | query | no | Return animated GIF |

**Badge selection logic** (`badgeSelection` function):
- If `badge1` is present in `req.params`, the route iterates `scnItems.data.user_badges.items` and matches by `badge.id` to build an ordered array of up to 5 specific badges.
- If no badge IDs are supplied, the first 5 items from `user_badges.items` are taken in the order the API returns them.

**Text wrapping:** Badge titles longer than 20 characters are word-wrapped to 2 lines using the `text-wrapper` library. Titles longer than 37 characters on the second line are truncated with `...`.

**Layout:** Badges are rendered in a 2-column grid. Columns alternate: left (x=0), right (x=200), advancing `itemHeight` by 40 after each row completes.

**Output size:** 500×175 SVG.

---

#### `GET /showcaseBadgesGroups/:scnId[/:badge1...]`

Compact badge strip variant designed for use as a community signature.

**File:** `srv/routes/showcaseBadges.js`

Same badge selection logic as `/showcaseBadges`. Renders up to 5 badge icons in a horizontal strip using `svgBadgeItemGroups`. Output size: 500×48. No text wrapping — badge titles are passed as tooltips only.

---

#### `GET /showcaseSingleBadge/:scnId[/:badge1...]`

Light-theme single-badge variant. Uses `svgBackgroundLight()` instead of the dark background. Renders a single badge using `svgBadgeItem`. Output size: 500×48.

---

### Devtoberfest Routes

#### `GET /devtoberfestContest/:scnId`

Renders the Devtoberfest contest gameboard as an HTML page with an embedded SVG.

**File:** `srv/routes/devtoberfest.js`

**Parameters:**
| Name | Type | Description |
|---|---|---|
| `scnId` | path | SAP Community user ID, or `scnId.Here` as a placeholder |

**Special test users:** The route recognizes `test0` through `test4` as synthetic profiles with hardcoded point values (0 / 3010 / 14500 / 22400 / 30500) to test each level rendering without requiring a real community account.

**Profile resolution flow (`getSCNProfile`):**
1. Checks `khoros.getDevtoberfestMembers()` — fetches `members.json` from this repo's `main` branch on GitHub. Looks up by numeric `id` first, then by `login`.
2. If not found in `members.json`, throws `'Not Registered'`.
3. For registered users: fetches user profile (`callUserAPI`), loads `badges.json` and `points.json` in parallel.
4. Iterates `user_badges.items`, matches each badge by `displayName` against `badges.json`, adds `points` and filters by `endDate` (2025-11-24).
5. Determines `level` (1–4) by comparing total `points` against thresholds in `points.json`.

**Avatar selection (`buildAvatar`):**
- `stringScore(userName)` hashes the display name to an integer 0–37 using ASCII charcode sum modulo 38.
- This integer selects one of 38 avatar images (`avatars/Group-{n}.png`).
- Two hardcoded overrides exist: user ID `148` always gets avatar 27; user ID `13959` gets `cowboy.png`.
- Avatar position and CSS animation class are determined by the user's `level` (0–4).

**SVG composition:** The gameboard is built from ~22 parallel `Promise.all` image loads, assembling background CRT frame, animated sprites, progress clouds, menu icons, avatar, and text blocks. The final SVG (1347×1612) is wrapped in an HTML page using `mustache` rendering of `srv/html/devtoberfest_header.html` (which includes the audio element and page chrome).

**Error rendering:** On error, a simplified gameboard SVG is rendered with the error text in the CRT display area, plus contextual links (profile tutorial, registration link, privacy policy) depending on the error type.

---

#### `GET /devtoberfest/profile/:scnId`

Returns the Devtoberfest profile as raw JSON (same data as the gameboard uses internally).

**Response shape:**
```json
{
  "userName": "string",
  "scnId": "string",
  "userNameScore": 0,
  "points": 0,
  "level": 0,
  "badges": { /* full Khoros user API response */ }
}
```

---

### Khoros Data Routes

All routes in `srv/routes/khorosUser.js`. These are internal/admin tools. No authentication is required but they proxy sensitive community data (email addresses, RSVP lists).

Both Khoros API base URLs are used:
- User profiles: `https://community.sap.com/khhcw49343/api/2.0/` (old SCN)
- Community search: `https://groups.community.sap.com/api/2.0/search` (new community)

#### `GET /khoros/user/:scnId`
Returns raw Khoros user profile JSON from the new community API (`groups.community.sap.com/api/2.0/users/:scnId`).

#### `GET /khoros/event/:eventId`
Returns structured event details including location, start/end times, timezone, and RSVP list (login, email, view_href). Fetches event data and RSVPs in parallel.

#### `GET /khoros/events/:boardId`
Returns all upcoming events (start_time >= now) for a board, ordered by start time. Raw API output.

#### `GET /khoros/eventRegs/:boardId`
**Admin UI.** HTML page showing upcoming events for a board with:
- RSVP counts (color-coded: yellow ≥20, red ≥25)
- Link to open raw RSVP data in a new tab
- "Post-process registrations" tool: paste the RSVP JSON, then either compose a reminder email draft (opens `mailto:` with BCC list) or download attendees as Excel/CSV.

#### `GET /khoros/eventRegsRaw/:boardId`
JSON version of `eventRegs` — returns an array of `{ id, name, href, startTime, endTime, timezone, rsvpCount, location }`.

#### `GET /khoros/members/:grouphub`
Returns an HTML page containing a link to the Khoros Search API query for members of a group hub (`SELECT id, sso_id, login, email... WHERE node.id = 'grouphub:{name}'`). Limit 6000.

#### `GET /khoros/devtoberfestMembers`
Returns the cached `members.json` fetched from GitHub (same data used by the gameboard).

#### `GET /khoros/messagePosters/:boardId/:conversationId`
Returns a deduplicated list of unique authors who have posted in a thread. Paginates using 100-record pages until exhausted.

#### `GET /khoros/boards`
Returns all community boards (`SELECT * FROM boards`).

#### `GET /khoros/board/:boardId`
Returns details for a single board.

#### `GET /khoros/topics/:boardId`
Returns all top-level messages (depth=0) on a board.

#### `GET /khoros/thread/:threadId`
Returns all messages in a discussion thread (`WHERE ancestors.id = '{id}'`).

#### `GET /khoros/tags`
Returns all active community tags (`products` table, `status = 'active'`, limit 10000), sorted alphabetically and grouped by first letter. Tags starting with "SAP " are sorted by the remainder (e.g. "SAP Cloud" sorts under "C").

---

### Infrastructure Routes

Defined in `srv/routes/intro.js`:

| Path | Type | Description |
|---|---|---|
| `GET /` | HTML | Landing page — `srv/doc/README.md` converted to HTML via `showdown` |
| `GET /flp/*` | Static | SAPUI5 Fiori Launchpad (`srv/app/flp/`) |
| `GET /images/*` | Static | Image assets (`srv/images/`) |
| `GET /i18n/*` | Static | i18n `.properties` files (consumed by the SAPUI5 apps client-side) |
| `GET /favicon.ico` | Static | Favicon |
| `GET /appconfig/fioriSandboxConfig.json` | JSON | FLP tile configuration |
| `GET /images/devtoberfest/css/font.css` | CSS | Dynamically generates `@font-face` CSS with the Joystix font embedded as base64 |
| `GET /selfie/` | Redirect | → `/flp/#selfie-ui` |
| `GET /profile/` | Redirect | → `/flp/#profile-ui` |
| `POST /upload_selfie` | PNG | Defined in `routes/selfie.js`. Accepts a multipart upload (max 20MB, JPEG/PNG/GIF), composites the user's photo with a Dev Advocate backdrop image using `sharp`, returns base64-encoded PNG. |
| `GET /docs/` | HTML | Swagger UI |
| `GET /health` | JSON | Cloud Foundry health check endpoint |

---

## Khoros API Consumption

### Two Distinct API Surfaces

The codebase uses two different Khoros API hosts for different purposes:

| Host | API Version | Used For |
|---|---|---|
| `community.sap.com/khhcw49343/api/2.0/` | v2 REST | User profile with badge list (`/users/:id`) |
| `groups.community.sap.com/api/2.0/` | v2 REST + Search | Events, RSVPs, boards, threads, member queries |

### User Profile API (`util/khoros.js`)

**Endpoint:** `GET https://community.sap.com/khhcw49343/api/2.0/users/{scnId}`

The `scnId` can be either the numeric community ID or the string login name. The response is a Khoros standard user object. Key fields used:

```
data.login                      → fallback display name
data.first_name / data.last_name → preferred display name
data.metrics.posts              → total post count
data.rank.name                  → community rank label
data.user_badges.items[]        → array of earned badges
  .badge.id                     → unique badge identifier (string)
  .badge.title                  → badge display name
  .badge.icon_url               → URL of the badge icon image
  .earned_date                  → ISO 8601 date string
```

**Username resolution (`handleUserName`):** Priority order:
1. `first_name + last_name` (if `first_name` is non-empty)
2. `login`
3. Falls back to the raw `scnId` string if `data` is absent

**HTTP library:** Uses `then-request` (synchronous-style async) via `request('GET', url)`. Responses are parsed with `JSON.parse(itemsRes.getBody())`.

**No caching for user profiles.** Every call to `callUserAPI` makes a live HTTP request. The `checkFileAge` function and `tags.json` cache path are defined in `util/khoros.js` but are used only by the tags endpoint.

### Community Search API (`routes/khorosUser.js`)

**Base URL:** `https://groups.community.sap.com/api/2.0/search?q=`

Queries are constructed as SQL-like strings and appended as the `q` parameter (URL-encoded). The API uses a SQL-like dialect:

```sql
SELECT <fields> FROM <table> [WHERE <conditions>] [ORDER BY <field>] [LIMIT <n>] [CURSOR '<token>']
```

Key tables used:

| Table | Description |
|---|---|
| `users` | Community user accounts |
| `messages` | All content (posts, replies, events) |
| `boards` | Forum/event boards |
| `rsvps` | Event registrations |
| `products` | Community tags/product areas |

**Pagination:** The `retrieve()` helper function implements cursor-based pagination using `next_cursor` from the response. It loops with `LIMIT 1000 CURSOR '{token}'` until no cursor is returned. Most individual route handlers do **not** use this helper and issue fixed-limit queries instead.

### Devtoberfest Members (`getDevtoberfestMembers`)

The members list is not queried from Khoros at runtime. Instead, it is fetched from the raw GitHub URL of this repository:

```
https://raw.githubusercontent.com/SAP-samples/sap-community-activity-badges/main/srv/util/members.json
```

This means **`members.json` in the repo is the authoritative registration list**. To add or remove participants, edit `srv/util/members.json` and push to `main`. The format is a standard Khoros user list response:

```json
{
  "data": {
    "items": [
      { "type": "user", "id": "2260367", "login": "ryan_shim" }
    ]
  }
}
```

Lookup is attempted first by numeric `id`, then by `login`. If a match is found by `login`, `req.params.scnId` is updated to the numeric `id` before the subsequent `callUserAPI` call.

### Error Conditions

| Condition | Error name | Handling |
|---|---|---|
| `scnId` = `'scnId.Here'` | `'No SCN ID'` | Renders prompt to find community ID |
| User not in `members.json` | `'Not Registered'` | Renders prompt with registration link |
| Khoros API returns 404 | `statusCode: 404` | Renders privacy/profile/registration links |
| Network/parse error | generic | Full error message rendered in SVG/JSON |

---

## SVG Rendering Engine

`srv/util/svgRender.js` is a collection of pure functions that return SVG string fragments. All image rendering routes compose their output by concatenating these fragments.

### Core Structure Functions

| Function | Returns | Description |
|---|---|---|
| `svgHeader(width, height)` | `string` | Opening `<svg>` tag with viewBox |
| `svgEnd()` | `string` | Closing `</svg>` |
| `svgStyles(...styles)` | `string` | `<style>` block wrapping one or more style fragments |
| `svgMainContent(...content)` | `string` | `<g>` wrapper for content, accepts arrays and strings |
| `svgBulkContent(...content)` | `string` | Flattens arrays of content into a string |

### Background Functions

| Function | Description |
|---|---|
| `svgBackground()` | Dark blue/grey gradient background (standard cards) |
| `svgBackgroundLight()` | Light background variant (showcaseSingleBadge) |
| `svgDevtoberfestBackground()` | Devtoberfest-specific CSS styles including LED animation and avatar movement classes |

### Content Functions

| Function | Returns | Description |
|---|---|---|
| `svgContentHeader(text)` | `Promise<string>` | Card header bar with SAP logo and title text |
| `svgContentHeaderGroups(text, light)` | `Promise<string>` | Compact header for Groups/Single badge variants |
| `svgErrorHeader(text)` | `Promise<string>` | Error card header |
| `svgActivityItem(height, delay, image, title, value, png)` | `string` | One row in the activity card (icon + label + value) |
| `svgBadgeItem(height, width, delay, image, title, png)` | `Promise<string>` | Badge icon + title for standard showcase grid |
| `svgBadgeItemGroups(height, width, delay, image, title, png)` | `Promise<string>` | Badge icon for compact horizontal strip |
| `svgBadgeItemSecond(height, width, delay, title, png)` | `Promise<string>` | Second line of a wrapped badge title |

### Devtoberfest-specific Functions

| Function | Description |
|---|---|
| `svgDevtoberfestItem(x, y, delay, image, scaleX, scaleY, png, animation, onclick, style, imageName)` | Places an image at absolute coordinates with optional SVG animation, onclick, and CSS class |
| `svgDevtoberfestTextHeader(height, width, delay, title, png, cssClass)` | Text label with `header` CSS class |
| `svgDevtoberfestCRTText(height, width, delay, title, png)` | Text in the CRT "monitor" display area |
| `svgDevtoberfestTextItem / svgDevtoberfestTextLink / svgDevtoberfestCRTLink` | Body text and hyperlink variants |

### Image Loading

`loadImageB64(image)` — resolves a path relative to `srv/util/` and returns the file contents as a base64 string. Used to embed images as `data:` URIs directly into the SVG so the output is self-contained. This is critical because SVG files served as `image/svg+xml` in `<img>` tags cannot load external resources.

When `png=true`, `sharp` rasterizes the SVG. Since `sharp` uses libvips (not a browser), `<image href="data:...">` embedded images work but external URLs would not.

### Style Functions

The style system uses separate functions for each CSS class block:

- `svgStyleHeader()` — `.header` class
- `svgStyleBold()` — `.bold` class
- `svgStyleStat()` — `.stat` class
- `svgStyleStagger()` — `.stagger` class (base for animation)
- `svgStyleIcon()` — `.icon` class
- `svgStyleAnimate()` — keyframe animation definitions (`fadeInAnimation`)
- `svgStyleError()` — `.error` class for error cards

`escapeHTML(str)` — escapes `<`, `>`, `&`, `"`, `'` for safe embedding in SVG text nodes.

---

## Error Handling

`srv/util/error.js` exports three handlers:

| Function | Used By | Output |
|---|---|---|
| `handleError(error, req, res)` | Activity, showcase badge routes | SVG/PNG error card (500×150) |
| `handleErrorDevtoberfest(error, req, res)` | Devtoberfest gameboard route | Full gameboard HTML with error text in CRT display area |
| `handleErrorDevtoberfestText(error, req, res)` | Khoros data routes, devtoberfest/profile | JSON `{ errorString, profile?, profileURL?, reg?, regURL?, privacy?, privacyURL? }` with HTTP 400 |

All three check `error.name` and `error.statusCode` for known error conditions (`'No SCN ID'`, `'Not Registered'`, `404`) and include contextual help links in the output.

---

## Static Data Files

Located in `srv/util/` and loaded with `require()`:

### `badges.json`

Array of Devtoberfest badge definitions:

```json
[
  {
    "displayName": "Devtoberfest 2025 Participant",
    "points": 200,
    "URL": "https://...",
    "Date": "2025-09-29",
    "Week": "Week 1",
    "Description": "..."
  }
]
```

`displayName` must match `badge.title` from the Khoros API exactly. `URL` links to the associated tutorial. `Date` is the week the activity was available; `Week` is the display label.

### `members.json`

Devtoberfest registrant list. Format matches the Khoros API user list response. Fetched at runtime from GitHub `main` branch — the file in the repo is served directly to callers via `GET /khoros/devtoberfestMembers`.

### `members2024.json` / `badges2024.json`

Historical data from Devtoberfest 2024. Not actively used in current routes but preserved for reference.

### `points.json`

Level thresholds:

```json
[
  { "level": 1, "points": 3000 },
  { "level": 2, "points": 14000 },
  { "level": 3, "points": 22000 },
  { "level": 4, "points": 30000 }
]
```

The gameboard iterates this array and assigns the highest level where `profile.points >= threshold`.

---

## Internationalization

`srv/util/texts.js` wraps `@sap/textbundle` for server-side i18n.

- `getLocale(req)` — parses the `Accept-Language` HTTP header using `accept-language-parser`, returns the highest-priority locale string (e.g. `"de"`, `"fr-FR"`).
- `getBundle(req)` — returns a `TextBundle` instance pointing at `srv/_i18n/messages.properties`, resolved against the request locale.
- `bundle.getText(key, [args])` — returns the localized string with positional placeholder substitution.

Available locales: `de`, `es`, `fr`, `hi`, `iw` (Hebrew), `ja`, `pl`. Fallback is English (`messages.properties`).

The SAPUI5 FLP apps consume the same `.properties` files client-side via the static `/i18n/` route.
