# Copilot Instructions — SAP Community Activity Badges

## Project Overview

A Node.js/Express service that generates SVG/PNG badge cards showcasing SAP Community member achievements and activity stats. Also hosts the Devtoberfest interactive gameboard and a SAPUI5 Fiori Launchpad with selfie, profile, and tags apps.

- **Production URL:** `https://devrel-tools-prod-scn-badges-srv.cfapps.eu10.hana.ondemand.com/`
- **License:** Apache-2.0 (REUSE-compliant — see [REUSE.toml](../REUSE.toml))
- **Docs:** [README.md](../README.md), [srv/doc/README.md](../srv/doc/README.md)

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥22.0.0 |
| Framework | Express 5.x |
| Image rendering | SVG composition + Sharp (PNG) |
| Templates | EJS (Fiori Launchpad shell) |
| Frontend | SAPUI5/Fiori Launchpad v1.136.4 |
| i18n | `@sap/textbundle` + `.properties` files |
| Logging | `@sap/logging` + `debug` |
| Deployment | SAP BTP Cloud Foundry (MTA) |

## Commands

```bash
# From srv/
npm run dev          # Start with nodemon (port 4000)
npm run start        # Production start
npm run types        # Regenerate TypeScript declarations from JSDoc

# From root
npm run build        # MTA build (mbt build → MTAR artifact)
```

There are **no automated tests** (`npm test` is a stub). Validate changes manually by hitting endpoints.

## Project Structure

```
srv/                        # All server-side code lives here
├── index.js                # Entry point (CommonJS)
├── express-server.js       # Express app setup, dynamic route loading
├── server/                 # Middleware stack (health, security, CORS, swagger, overload protection)
├── routes/                 # Each file exports (app) => { app.get(...) }
├── util/                   # Shared helpers (khoros API client, SVG builders, i18n, error renderer)
├── _i18n/                  # Message bundles (*.properties, 8 locales)
├── app/flp/                # SAPUI5 Fiori Launchpad SPA (selfie, profile, tags apps)
├── images/                 # Static assets (Devtoberfest themes, CSS, fonts, avatars)
├── html/                   # HTML fragments
├── views/                  # EJS templates
├── types/                  # Auto-generated .d.ts files (do not edit by hand)
├── *.mjs                   # ES Module CLI utilities (badgeCheck, contest, scavengerHunt, trees)
└── package.json            # Runtime dependencies
```

## Architecture & Patterns

### Route convention
Every file in `srv/routes/*.js` exports a single function that receives the Express `app`:

```js
module.exports = (app) => {
  app.get('/myEndpoint/:id', async (req, res) => { /* ... */ })
}
```

Routes are loaded dynamically via glob in [srv/express-server.js](../srv/express-server.js). To add a route, create a new `.js` file in `srv/routes/` — it will be auto-registered.

### Module system
- **`.js`** → CommonJS (routes, utilities, server config, frontend). This is the default.
- **`.mjs`** → ES Modules (CLI/batch utilities: badgeCheck, contest, scavengerHunt, trees). These use `createRequire` for CommonJS interop when needed.

Do NOT mix — keep routes and server code as CommonJS.

### SVG/image rendering
SVG cards are built by composing functions from `srv/util/svgRender.js`:
- `svgHeader()`, `svgStyles()`, `svgBadgeItem()`, `svgActivityItem()`, etc.
- Images are base64-embedded via `loadImageB64()`.
- Optional `?png=true` query param converts SVG → PNG via Sharp.

### Error handling
Errors are rendered as branded SVG cards — not JSON. See `srv/util/error.js`. The Devtoberfest variant uses a CRT-themed SVG.

### Internationalization
- Properties files live in `srv/_i18n/messages*.properties`.
- `srv/util/texts.js` resolves locale from `Accept-Language` header and loads the bundle.
- Supported locales: en (default), de, es, fr, hi, iw, ja, pl.

### External API — Khoros (SAP Community)
All SAP Community data comes from the Khoros REST API (`https://community.sap.com/api/2.0/...`). The client is in `srv/util/khoros.js`. Key helpers:
- `callUserAPI(scnId)` — fetch user profile, badges, rank
- `handleUserName()` — extract display name
- `getDevtoberfestMembers()` — fetch member list from GitHub raw content

### Security
- **No authentication** — public API (auth is commented out in `srv/server/expressSecurity.js`)
- CORS enabled; `nocache` headers on badge endpoints
- Input sanitization: SCN IDs are stripped of `@`, `https://`, `http://` prefixes
- File uploads: MIME-type filtered (JPEG/PNG/GIF only), max 20 MB
- XML-escape error messages before embedding in SVG

### Type definitions
The `srv/types/` folder contains auto-generated `.d.ts` files. Regenerate with `npm run types`. Do not edit these by hand.

## Key API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/showcaseBadges/:scnId` | 5 top badges card (SVG/PNG) |
| GET | `/activity/:scnId` | Activity stats card (SVG/PNG) |
| GET | `/devtoberfestContest/:scnId` | Animated gameboard (HTML) |
| GET | `/khoros/user/:scnId` | Raw Khoros user JSON |
| POST | `/upload_selfie` | Selfie image upload (multipart) |
| GET | `/flp/` | Fiori Launchpad SPA |
| GET | `/docs/` | Swagger API docs |

## Coding Guidelines

- Keep badge rendering logic composable — small SVG builder functions in `svgRender.js`.
- Always XML-escape user-supplied text before embedding in SVG to prevent injection.
- Use `@sap/logging` for structured logs, `debug('scn-badges-svg-render')` for verbose render tracing.
- Static data files (badges.json, members.json, points.json) are versioned by year — create new year-specific variants rather than overwriting.
- When adding i18n strings, update ALL 8 locale `.properties` files in `srv/_i18n/`.
