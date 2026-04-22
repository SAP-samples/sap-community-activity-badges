# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All development commands are run from the `srv/` directory (the Node.js service):

```bash
cd srv
npm install          # Install dependencies
npm run dev          # Start with nodemon (auto-reload)
npm start            # Start production server (port 4000 by default, overridden by PORT env var)
npm run types        # Regenerate TypeScript declarations in srv/types/
```

To build the MTAR for SAP BTP Cloud Foundry deployment, run from the root:

```bash
npm run build        # Runs mbt build (requires Cloud MTA Build Tool)
```

There are no automated tests (`npm test` is a stub).

## Architecture

This is a single Node.js Express 5 service (`srv/`) packaged as an MTAR for SAP BTP Cloud Foundry deployment. The service generates SVG/PNG image cards showing SAP Community user activity and badges, plus a Devtoberfest contest gameboard.

Requires Node.js `^22.0.0 || ^24.0.0`.

### Startup Flow

`srv/index.js` → `srv/express-server.js` (ExpressServer class):
1. Loads `srv/server/express.js` (middleware: logging, CORS, security, Swagger, health check, overload protection)
2. Auto-loads all `srv/routes/**/*.js` files as Express route handlers

### Key Directories

- **`srv/routes/`** — Express route handlers, each exports `(app) => { ... }`. Main routes:
  - `showcaseBadges.js` — `/showcaseBadges/:scnId` — badge card SVG/PNG
  - `activityCounts.js` — `/activity/:scnId` — activity stats card
  - `devtoberfest.js` — `/devtoberfestContest/:scnId`, `/devtoberfest/profile/:scnId`
  - `khorosUser.js` — `/khoros/*` — Khoros community API endpoints
  - `selfie.js` — selfie with Dev Advocates feature
  - `intro.js` — landing page and documentation

- **`srv/util/`** — Shared utilities:
  - `svgRender.js` — SVG building blocks (headers, styles, shapes, image embedding)
  - `khoros.js` — SAP Community Khoros API calls (`https://community.sap.com/khhcw49343/api/2.0/users/:scnId`), file-based caching of API responses (1 day TTL via runtime-generated `tags.json`)
  - `error.js` — Error handler that renders errors as SVG/PNG images
  - `texts.js` — i18n via `@sap/textbundle`, reads `Accept-Language` header
  - `badges.json`, `badges2024.json` — Badge definitions (id, name, image URL)
  - `members.json`, `members2024.json` — Devtoberfest participant data
  - `points.json` — Point values for Devtoberfest activities

- **`srv/app/`** — SAPUI5 frontend:
  - `flp/` — Fiori Launchpad (`/flp/`) hosting SAPUI5 apps for the badge signature tool and selfie feature
  - `appconfig/fioriSandboxConfig.json` — FLP tile configuration

- **`srv/_i18n/`** — i18n message bundles (`messages.properties` + language variants)
- **`srv/html/`** — Static HTML fragments (e.g. `devtoberfest_header.html`)
- **`srv/images/`** — Static images used by routes (activity icons, demo screenshots, favicon)
- **`srv/views/`** — EJS templates (selfie rendering)
- **`srv/server/`** — Express middleware configuration (security headers, Swagger, health check, overload protection)

### SVG → PNG Conversion

Routes accept `?png=true` to return PNG instead of SVG. PNG conversion uses `sharp` to rasterize the SVG string.

### CLI Utility Scripts

Standalone ESM scripts at the `srv/` root for offline data management (not part of the Express server). All are interactive (use `inquirer`) and read Excel files:

- `badgeCheck.mjs` — Verify badges for community members
- `contest.mjs` — Process Devtoberfest contest data
- `scavengerHunt.mjs` — Process scavenger hunt entries
- `trees.mjs` — Process tree-planting initiative data

Run with `node srv/<script>.mjs` from the repo root.

### External API Dependency

All badge/user data is fetched live from the SAP Community Khoros API. Responses are cached to `srv/util/tags.json` (TTL: 1 day). The `members.json` for Devtoberfest is also fetched from the GitHub raw URL of this repo itself.

### Versioning

The version in `srv/package.json` and `mta.yaml` are kept in sync and incremented for deployments.

## Extended Documentation

Full technical reference is in [srv/doc/developer-guide.md](srv/doc/developer-guide.md). It covers:

- Every route with parameters, data flow, and response shape
- Khoros API consumption details (both API hosts, SQL-like query syntax, field mappings)
- SVG rendering engine function reference
- Error handler variants
- Static data file schemas
