---
description: "Scaffold a new Express route file with proper boilerplate, Swagger annotation, and conventions."
agent: "agent"
argument-hint: "Describe the endpoint (e.g., 'GET /stats/:scnId that returns user stats as JSON')"
---
Create a new Express route file in `srv/routes/` following project conventions.

## Requirements
- Export a single function: `module.exports = (app) => { ... }`
- Use CommonJS only (no ES Module syntax)
- Include Swagger JSDoc annotation for the endpoint
- Sanitize any `:scnId` parameter (strip `@`, `https://`, `http://` prefixes)
- For SVG badge endpoints: use composable builders from `srv/util/svgRender.js`, support `?png=true`, set `nocache` headers, render errors via `srv/util/error.js`
- For JSON endpoints: set appropriate `Content-Type` and use standard Express error handling
- Use `@sap/logging` for structured logging

## Reference files
- [Route example](../../srv/routes/showcaseBadges.js) — SVG badge endpoint pattern
- [Route example](../../srv/routes/khorosUser.js) — JSON API endpoint pattern
- [SVG utilities](../../srv/util/svgRender.js)
- [Error renderer](../../srv/util/error.js)
- [Khoros API client](../../srv/util/khoros.js)

The file will be auto-registered by the glob loader in `srv/express-server.js` — no manual wiring needed.
