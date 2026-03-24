---
description: "Use when working on the SAPUI5 Fiori Launchpad frontend apps (selfie, profile, tags). Covers component structure, MVC patterns, and i18n for UI5 apps."
applyTo: "srv/app/flp/**"
---
# SAPUI5 Fiori Launchpad Frontend

## Architecture
The FLP is a sandbox shell (v1.136.4-legacy-free) hosting three apps:
- **selfie-ui** — Selfie with Dev Advocates (image upload + morphing)
- **profile-ui** — Badge Signature Tool (custom badge selection)
- **tags-ui** — SAP Managed Tags list (A-Z reference)

## Component structure
Each app follows the standard UI5 component layout:
```
appName/
├── Component.js       # UIComponent extending sap.ui.core.UIComponent
├── manifest.json      # App descriptor (routes, models, i18n config)
├── controller/
│   ├── App.controller.js
│   └── BaseController.js
├── model/             # JSONModel / formatter helpers
├── view/              # XML views
└── i18n/              # Per-app translation properties files
```

## Conventions
- Views are XML-based (`*.view.xml`).
- Controllers extend `BaseController.js` which provides shared helpers.
- Each app has its OWN i18n folder — update all locale files there when adding strings.
- The FLP shell config is in `srv/app/appconfig/fioriSandboxConfig.json`.
- Theme auto-detection uses `window.matchMedia("(prefers-color-scheme: dark)")`.

## Do NOT
- Import Node.js modules in frontend code.
- Modify `boot.js` or `init.js` unless changing FLP shell behavior.
- Use ES Module syntax — UI5 apps use `sap.ui.define()` AMD-style modules.
