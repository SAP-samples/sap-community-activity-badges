---
description: "Use when creating or editing Express route files in srv/routes/. Covers route conventions, module format, input sanitization, and SVG response patterns."
applyTo: "srv/routes/**/*.js"
---
# Express Route Guidelines

## Route file pattern
Every route file must export a single function receiving the Express `app`:

```js
module.exports = (app) => {
  app.get('/myEndpoint/:scnId', async (req, res) => {
    // ...
  })
}
```

Files are auto-registered by glob in `srv/express-server.js` — no manual wiring needed.

## Module system
Routes MUST be CommonJS (`.js`). Do NOT use ES Module syntax (`import`/`export`).

## Input sanitization
Always sanitize SCN IDs before use:
```js
let scnId = req.params.scnId
scnId = scnId.replace(/@/g, '').replace(/https?:\/\//g, '')
```

## SVG responses
- Set `Content-Type: image/svg+xml` for SVG responses.
- XML-escape ALL user-supplied text before embedding in SVG to prevent injection.
- Support `?png=true` query param to convert SVG → PNG via Sharp.
- Set `nocache` headers on badge endpoints.

## Error handling
Use the branded SVG error renderer from `srv/util/error.js` — do NOT return JSON error responses from badge endpoints.

## Swagger docs
Add JSDoc-style Swagger annotations above each route handler for `/docs/` auto-generation.
