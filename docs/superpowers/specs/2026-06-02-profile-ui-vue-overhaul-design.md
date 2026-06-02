# Profile UI — Vue 3 + UI5 Web Components overhaul

**Status:** Draft for review
**Date:** 2026-06-02
**Scope:** Replace the SAPUI5 `/flp/#profile-ui` Signature Builder with a modern Vue 3 + TypeScript SPA styled with UI5 Web Components (the actively-maintained, framework-agnostic Fiori component library). Same functionality; rethought layout.

## Goals

- Replace the SAPUI5 1.147 application that currently renders at `/flp/#profile-ui` with a modern Vue 3 SPA at `/profile`.
- Keep every field, action, and externally-visible behavior of today's app.
- Improve the badge-picking UX so the live signature preview is always visible while picking.
- Preserve all 12 existing locales (including the Klingon and Latin easter eggs).
- Touch zero server logic. The new app is a pure presentation-layer rewrite over the existing `/khoros/user/:scnId` and `/showcase*` endpoints.
- One-command local dev: `cd srv && npm run dev` brings up everything.

## Non-goals

- No changes to `/khoros/*`, `/showcaseBadgesGroups/*`, `/showcaseSingleBadge/*`, `/showcaseBadges/*`, or any other server route.
- No changes to the FLP `selfie` or `tags` tiles. Both remain on SAPUI5 inside `srv/app/flp/`.
- No SSR, no service worker, no offline support, no auth, no analytics.
- No visual regression tests.
- No new server-side endpoints.

## Decisions (reference)

| # | Decision | Choice |
|---|---|---|
| 1 | UI library | **UI5 Web Components + Vue 3** via `@ui5/webcomponents-vue` |
| 2 | Hosting | New `/profile` SPA; `/flp/#profile-ui` client-side redirects to `/profile` |
| 3 | Language | TypeScript |
| 4 | Source location | `srv/app/profile-vue/` (built to `srv/app/profile-vue/dist/`) |
| 5 | Layout | Single scrollable page with **sticky right rail** (signature preview + embed code) |
| 6 | Selected badges editor | **Vertical list with drag handles** (5 fixed slots) |
| 7 | Badge browser | **View toggle**: `<ui5-table>` (default) ⇄ card grid |
| 8 | Embed code | **Tabs**: HTML / Markdown / URL |
| 9 | Mobile signature | **Sticky-bottom collapsible bar** that expands to a fullscreen `<ui5-dialog>` |
| 10 | i18n | Port all 12 locales verbatim (en/de/es/fr/hi/i-klingon/it/iw/ja/la/pl plus default) |
| 11 | Local dev | Single `npm run dev` in `srv/` runs Express + Vite together |

## Architecture

### Stack

- **Vue 3.5+** with Single File Components, `<script setup lang="ts">`, Composition API.
- **`@ui5/webcomponents-vue`** + `@ui5/webcomponents` + `@ui5/webcomponents-fiori` (Fiori theme `sap_horizon` / `sap_horizon_dark`).
- **Vite 7+** dev server (HMR) and build.
- **Pinia** — single store for cross-component state.
- **vue-i18n** — fed from JSON generated at build time from existing `i18n_*.properties`.
- **Vue Router** in HTML5 history mode, single route `/profile/:scnId?`.
- **Vitest** + **`@vue/test-utils`** + **`@pinia/testing`** for unit tests.
- **Playwright** for one happy-path end-to-end test.
- **`concurrently`** + **`wait-on`** to power one-command local dev.
- No CSS framework beyond UI5 Web Components' theme. Custom CSS only for layout (sticky rail, mobile bottom bar) using theme custom properties so dark mode works.

### Express integration

In `srv/express-server.js` (or wherever static routes are registered):

```js
const profileDist = path.join(__dirname, 'app/profile-vue/dist')
app.use('/profile', express.static(profileDist))
app.get(/^\/profile(\/.*)?$/, (_req, res) =>
  res.sendFile(path.join(profileDist, 'index.html'))
)
```

### Legacy URL redirect

A small inline script added to `srv/app/flp/index.html` *before* the FLP bootstrap:

```js
if (window.location.hash === '#profile-ui') {
  window.location.replace('/profile')
}
```

The fragment never reaches the server — the redirect must happen client-side.

### Build orchestration

Top-level `package.json` `build` script chains the Vue build before `mbt build`:

```json
"scripts": {
  "build": "npm --prefix srv/app/profile-vue ci && npm --prefix srv/app/profile-vue run build && mbt build"
}
```

The MTAR `mta.yaml` already packages `srv/`; the new `dist/` is included automatically. No `mta.yaml` changes.

### Local dev (one command)

`srv/package.json`:

```jsonc
{
  "scripts": {
    "dev": "concurrently -k -n express,vue -c blue,magenta \"npm:dev:express\" \"npm:dev:vue\"",
    "dev:express": "nodemon index.js",
    "dev:vue": "wait-on -t 30000 http://localhost:4000 && npm --prefix app/profile-vue run dev"
  }
}
```

`srv/app/profile-vue/vite.config.ts` proxies all server-side routes:

```ts
server: {
  port: 5173,
  proxy: {
    '/khoros':                { target: 'http://localhost:4000', changeOrigin: true },
    '/showcaseBadgesGroups':  { target: 'http://localhost:4000', changeOrigin: true },
    '/showcaseSingleBadge':   { target: 'http://localhost:4000', changeOrigin: true },
    '/showcaseBadges':        { target: 'http://localhost:4000', changeOrigin: true }
  }
}
```

Result: `cd srv && npm install && npm run dev` brings up Express on 4000 and Vite on 5173 in one terminal. Open `http://localhost:5173/profile/<scn-id>`. Ctrl+C kills both cleanly.

## Components & state

### Pinia store: `useProfileStore`

```ts
// state
scnId: string                          // current SCN ID (mirrored to route)
profile: KhorosProfile | null          // raw data from /khoros/user/:scnId
selectedBadgeIds: string[]             // ordered, max 5
viewMode: 'table' | 'grid'             // badge browser view toggle
loading: boolean
error: { code: 'notFound' | 'network' | 'unexpected'; message: string } | null

// computed
selectedBadges: SelectedBadge[]        // joined view: id, title, iconUrl
allBadges: BadgeWithSelection[]        // user_badges.items + `selected: bool`
signatureUrl: string                   // /showcaseBadgesGroups/:scnId/:b1/.../:bN
signatureLightUrl: string              // /showcaseSingleBadge/:scnId/:firstId
signatureBigUrl: string                // /showcaseBadges/:scnId[/:b1...]
embedHtml: string                      // <a><img/></a>
embedMarkdown: string                  // [![](url)](profile)
profileUrl: string                     // KhorosProfile.view_href

// actions
loadProfile(scnId: string): Promise<void>
toggleBadge(badgeId: string): void     // enforces max-5 with toast
reorderSelectedBadges(from: number, to: number): void
clearSelected(): void
```

Signature URLs are **computed**; no `buildSignature()` function exists. The browser handles re-rendering the `<img>` when its `:src` changes.

### Vue components (`src/components/`)

- **`ProfileApp.vue`** — root layout; sticky right rail; slots all children.
- **`AppHeader.vue`** — title, locale switcher (12 locales), theme toggle.
- **`ScnIdInput.vue`** — `<ui5-input>` for SCN ID + load action + avatar/name/rank chip once loaded.
- **`ProfileDetails.vue`** — read-only `<ui5-form>`: login, profile URL, first/last name, rank.
- **`SelectedBadgesEditor.vue`** — vertical list, 5 fixed slots: drag handle ⠿ · icon · title · ✕. HTML5 DnD with keyboard fallback (`Alt+ArrowUp` / `Alt+ArrowDown`). Empty slots rendered as dashed-outline placeholders.
- **`BadgeBrowser.vue`** — wraps `<ui5-segmented-button>` (table/grid icons) and dynamically swaps between:
  - **`BadgeTable.vue`** — `<ui5-table>` columns: Select / ID / Title / Image / Date Earned / # Awarded. Sortable. Filter input above.
  - **`BadgeGrid.vue`** — responsive CSS grid of `<ui5-card>`; click toggles selection.
- **`SignatureRail.vue`** — sticky right rail: live preview `<img>` (dark + light), `<ui5-tabcontainer>` (HTML / Markdown / URL), copy buttons, link to "big" preview.
- **`MobileSignatureBar.vue`** — sticky-bottom bar; on viewports < 768px replaces `SignatureRail`; expands into fullscreen `<ui5-dialog>`.
- **`ErrorBanner.vue`** — `<ui5-message-strip>` driven by store errors.

### Composables (`src/composables/`)

- **`useKhoros.ts`** — `loadUserProfile(scnId)` wraps `fetch('/khoros/user/:scnId')`; throws typed `KhorosError`. Only network call in the app.
- **`useViewportMode.ts`** — `'mobile' | 'desktop'` from `matchMedia('(max-width: 768px)')`. Drives `SignatureRail` ⇄ `MobileSignatureBar`.
- **`useClipboard.ts`** — wraps `navigator.clipboard.writeText` with a select-text fallback for insecure contexts.

### Pure utilities (`src/utils/`)

- **`signatureUrls.ts`** — `buildSignatureUrl`, `buildSignatureLightUrl`, `buildSignatureBigUrl`, `buildEmbedHtml`, `buildEmbedMarkdown`. All use `window.location.origin` (fixes the current bug where embed code is hardcoded to the production host even from local dev).
- **`parseSignature.ts`** — extracts up to 5 badge IDs from the embedded `<img>` `src` in `data.signature`. Replicates the original `pathname[badgeIndex + 3]` logic with explicit handling of malformed inputs.

### Types (`src/types/khoros.ts`)

Full TypeScript model of the `/khoros/user/:scnId` response including `KhorosProfile`, `BadgeItem`, `UserBadge`, `Rank`, `Avatar`. Single source of truth across loader, store, and components.

## Data flow

```
                                                ┌──────────────────────────────────┐
                                                │       Pinia: useProfileStore     │
                                                ├──────────────────────────────────┤
       URL /profile/:scnId? ────────────────►   │  scnId            (from route)   │
                                                │  profile          (from API)     │
                                                │  selectedBadgeIds (max 5, order) │
                                                │  viewMode         (table/grid)   │
                                                │                                  │
       loadProfile(scnId)                       │  computed:                       │
       ───────────────────►   useKhoros         │   • allBadges                    │
                              ─────────────►    │   • selectedBadges               │
                              GET /khoros/user/ │   • signatureUrl                 │
                              ◄───── JSON ──────│   • signatureLightUrl            │
                              parse signature   │   • signatureBigUrl              │
                              extract badge IDs │   • embedHtml / embedMarkdown    │
                              seed selected ───►│                                  │
                                                └──────────────────────────────────┘
                                                         ▲                 │
                                                         │ actions         │ reactive reads
                                                         │                 ▼
   ┌──────────────────────────┐    toggleBadge    ┌──────────────────────────────┐
   │ BadgeTable / BadgeGrid   │ ────────────────► │   SelectedBadgesEditor       │
   │   (checkbox / card tap)  │                   │   (drag handle reorder)      │
   └──────────────────────────┘                   └──────────────────────────────┘
                                                         │
                                                         │ reorderSelectedBadges
                                                         ▼
                                                ┌──────────────────────────────────┐
                                                │   SignatureRail (sticky)         │
                                                │   <img :src="signatureUrl"/>     │
                                                │   <img :src="signatureLightUrl"/>│
                                                │   tabs: HTML | MD | URL          │
                                                │   copy buttons                   │
                                                └──────────────────────────────────┘
```

### Flows

1. **Initial load.** Route `/profile/:scnId?` resolves on mount.
   - If `scnId` present: store calls `loadProfile(scnId)`. On 200, parse `data.signature`, extract IDs (`pathname[badgeIndex + 3]`), seed `selectedBadgeIds`, mark matching `user_badges.items[].selected = true`.
   - On error: `error` set, `ErrorBanner` shows Negative `<ui5-message-strip>` with localized message + Retry. Right rail shows empty placeholder.
2. **User changes SCN ID.** `ScnIdInput` emits `load(newId)`; store updates `scnId`, `router.replace({ params: { scnId: newId } })`, then `loadProfile(newId)`. URL is the source of truth — refresh works, link is shareable.
3. **User selects/deselects a badge.**
   - Selecting: append to `selectedBadgeIds` if length < 5. If at 5, dispatch `<ui5-toast>` with existing `profile.limitErr` key and revert.
   - Deselecting: remove from `selectedBadgeIds`.
   - All signature URLs recompute reactively; `<img>` `src` updates this paint frame.
4. **User reorders selected badges.** Drag-handle reorder → `store.reorderSelectedBadges(from, to)` → reactive recompute → preview updates.

### Network call inventory

Exactly **one** application network call: `GET /khoros/user/:scnId`. The signature `<img>` tags trigger native browser image loads to `/showcaseBadgesGroups/...` etc.; not application code. No POSTs, no auth.

## Error handling & edge cases

| Failure | Source | Behavior |
|---|---|---|
| **SCN ID not found** | non-2xx from `/khoros/user/:scnId` | Banner with `error.notFound`. Right rail empty. Input remains editable. Retry available. |
| **Network error** | `fetch` rejects | Banner with `error.network`. Retry re-runs `loadProfile`. |
| **Malformed payload** | response missing `data.user_badges` | Graceful degrade: `selectedBadgeIds = []`, `allBadges = []`. Critical strip with `error.unexpected`. |
| **Signature parse failure** | `data.signature` HTML invalid | No error to user — empty selected slots, user picks fresh. |
| **Badge limit exceeded** | 6th badge attempt | `<ui5-toast>` with existing `profile.limitErr` key. Checkbox stays unchecked. |
| **Clipboard API unavailable** | older browsers / insecure context | Fallback selects text in embed field; toast: "Selected — press Ctrl+C". |
| **No SCN ID in URL** | initial `/profile` with no param | Idle state; input focused; no error. |
| **Image load failure** | stale icon URL | `<img>` `onerror` swaps to `/images/badge-placeholder.svg` (new asset). |

### Loading states

- **Initial profile fetch** — `<ui5-busy-indicator>` overlay on badges + signature rail; profile section shows skeleton rows.
- **SCN ID change** — same overlay; previous data stays until new arrives (no flash).
- **Signature image** — browser-native; no per-toggle spinner.

### Preserved behaviors

1. Always render 5 selected-badge slots (filled + dashed-outline placeholders) — current app pre-fills `selBadges` with 5 placeholders; preserved.
2. Selected order matters in URL path — `/showcaseBadgesGroups/:scnId/:b1/:b2/...` in order. Tests cover.
3. Light variant uses only the **first** selected badge — current behavior. Preserved.
4. Drag-and-drop AND keyboard reorder — both supported.

## Accessibility

- All interactive controls are real `<ui5-*>` web components: keyboard nav, focus rings, ARIA roles for free.
- `ScnIdInput` uses `<ui5-label for>`; input has `required`.
- `SelectedBadgesEditor`: `role="list"` + `role="listitem"`. Drag handle keyboard-operable via `Alt+ArrowUp` / `Alt+ArrowDown`. Live region announces "Moved badge X to position N". Remove button has `aria-label="Remove {badgeTitle}"`.
- `BadgeTable` — `<ui5-table>` ships ARIA grid roles; sort changes announced.
- `BadgeGrid` — each card is a `<button>` with `aria-pressed`.
- `SignatureRail` — `<img>` has interpolated `alt`; tab labels localized; copy buttons announce "Copied" via `<ui5-toast aria-live="polite">`.
- Color contrast inherited from `sap_horizon` / `sap_horizon_dark` (WCAG AA).
- Reduced motion: only animation is the mobile bottom-bar expand; gated on `prefers-reduced-motion`.
- `<html lang>` set from active vue-i18n locale; all 12 locales are valid BCP47 (`i-klingon` and `la` included).

### Theme

Light/dark follows `prefers-color-scheme` by default (mirrors current FLP `themeCalc()`), with manual override stored in `localStorage` and applied via `setTheme()` from `@ui5/webcomponents-base`.

## Internationalization

All 12 existing locales are ported verbatim. A small build-time script `scripts/convert-i18n.mjs` reads each `srv/app/flp/profile/i18n/i18n_*.properties` (and the default `i18n.properties`) and emits matching `src/i18n/locales/*.json` for vue-i18n. The conversion is idempotent — re-runnable on any source change.

### New keys (added to all 12 locales)

- `error.notFound`, `error.network`, `error.unexpected`, `error.retry`
- `view.table`, `view.grid`
- `embed.html`, `embed.markdown`, `embed.url`, `embed.copy`, `embed.copied`
- `signature.alt`
- `mobile.preview`, `mobile.expand`, `mobile.collapse`
- `theme.toggle`

English values are real strings. Non-English values get conservative translations (Klingon and Latin variants get period-appropriate phrasings). Translation work confirmed during implementation.

## Repository layout

```
srv/
├── app/
│   ├── flp/                                  ← unchanged except index.html redirect snippet
│   │   ├── index.html                        ← +<script> for #profile-ui → /profile redirect
│   │   └── profile/                          ← old SAPUI5 sources kept during transition;
│   │                                            removed in a follow-up commit after redirect verified
│   └── profile-vue/                          ← NEW
│       ├── index.html                        ← Vite entry
│       ├── package.json                      ← own dependency tree, scoped to this app
│       ├── tsconfig.json
│       ├── vite.config.ts                    ← dev proxy to localhost:4000
│       ├── public/                           ← favicon, badge-placeholder.svg
│       ├── scripts/
│       │   └── convert-i18n.mjs              ← .properties → JSON for vue-i18n at build time
│       ├── src/
│       │   ├── main.ts
│       │   ├── App.vue
│       │   ├── router/index.ts
│       │   ├── store/profile.ts              ← Pinia store
│       │   ├── components/
│       │   │   ├── ProfileApp.vue
│       │   │   ├── AppHeader.vue
│       │   │   ├── ScnIdInput.vue
│       │   │   ├── ProfileDetails.vue
│       │   │   ├── SelectedBadgesEditor.vue
│       │   │   ├── BadgeBrowser.vue
│       │   │   ├── BadgeTable.vue
│       │   │   ├── BadgeGrid.vue
│       │   │   ├── SignatureRail.vue
│       │   │   ├── MobileSignatureBar.vue
│       │   │   └── ErrorBanner.vue
│       │   ├── composables/
│       │   │   ├── useKhoros.ts
│       │   │   ├── useViewportMode.ts
│       │   │   └── useClipboard.ts
│       │   ├── utils/
│       │   │   ├── signatureUrls.ts
│       │   │   └── parseSignature.ts
│       │   ├── types/
│       │   │   └── khoros.ts
│       │   ├── i18n/
│       │   │   ├── index.ts
│       │   │   └── locales/                  ← 12 generated JSON files
│       │   └── styles/
│       │       └── main.css                  ← layout-only; theme via UI5 WC
│       └── tests/
│           ├── unit/                         ← Vitest unit tests
│           └── e2e/                          ← Playwright happy-path
├── package.json                              ← +dev:express, dev:vue, dev orchestration
└── express-server.js                         ← +static mount for /profile + SPA fallback
```

## Testing strategy

| Layer | Tool | What's covered |
|---|---|---|
| **Pure utils** | Vitest | `signatureUrls.ts` (URL composition for 0–5 badges, ordered). `parseSignature.ts` (real `data.signature` HTML samples + malformed inputs). 100% branch coverage achievable. |
| **Pinia store** | Vitest + `@pinia/testing` | `loadProfile` happy / 404 / network error / malformed payload; `toggleBadge` enforces max-5 + emits limit error; `reorderSelectedBadges` swaps; computeds derive expected URLs. `useKhoros` mocked with fixtures. |
| **Components** | Vitest + `@vue/test-utils` | Smoke-mount each component with stub props; assert key rendering and event emission. UI5 Web Components registered as custom elements via setup file. |
| **i18n converter** | Vitest | Given fixture `.properties`, `convert-i18n.mjs` emits expected JSON (preserves Unicode escapes, handles continuation lines). |
| **End-to-end** | Playwright | One happy-path spec: load profile → assert 3 badges seeded → toggle one off, one on → assert signature URL updated → verify `<img>` actually loads (200 status). Run against local Express + built Vue dist. |

### Out of testing scope

- Tests for existing Express endpoints (untouched).
- Visual regression (overkill).
- Cross-browser (rely on UI5 WC's matrix).

## Rollout (commit sequence)

1. Scaffold `srv/app/profile-vue/` (Vite + Vue 3 + TS + UI5 WC + Pinia + Vue Router + vue-i18n + Vitest). Empty page renders.
2. Add types, `useKhoros` composable, `signatureUrls` + `parseSignature` utilities with unit tests.
3. Build Pinia store with unit tests.
4. Build leaf components: `ScnIdInput`, `ProfileDetails`, `SelectedBadgesEditor`, `BadgeTable`, `BadgeGrid`, `BadgeBrowser`, `SignatureRail`.
5. Wire layout in `ProfileApp.vue` (sticky right rail, responsive grid).
6. Add `MobileSignatureBar` + viewport composable.
7. i18n converter + 12 locales.
8. Express static mount + SPA fallback. `/profile/<scnId>` works end-to-end against the built dist.
9. Add `#profile-ui` redirect snippet to `srv/app/flp/index.html`.
10. `srv/package.json`: `concurrently` + `wait-on` + `dev`/`dev:express`/`dev:vue` scripts.
11. Top-level `package.json` build orchestration; verify `mbt build` produces a working MTAR with the SPA included.
12. Playwright happy-path test.
13. **Follow-up commit (separate review):** delete `srv/app/flp/profile/` once redirect is verified in deployed environments.

## Definition of done

- `cd srv && npm run dev` brings up Express + Vite in one terminal; `http://localhost:5173/profile/<scn-id>` renders a working app with HMR.
- `/profile/<existing-scn-id>` loads in a built `mbt` MTAR; profile populates; selecting/deselecting badges updates the right-rail signature in real time; the "Copy HTML" button writes a working `<a><img/></a>` snippet to the clipboard.
- `/flp/#profile-ui` redirects to `/profile` (verified in browser).
- `npm test` passes (Vitest unit + Playwright happy path).
- All 12 locales render without missing-key warnings.
- Mobile bottom-bar tested on a phone-width viewport.
- Existing FLP `selfie` and `tags` tiles still work unchanged.

## Risks & open questions

- **`@ui5/webcomponents-vue` is in beta.** It tracks the underlying UI5 Web Components closely, but minor type-API churn is possible. Mitigation: pin to a tested version; component surface is small enough to migrate around.
- **Drag-and-drop on touch devices.** HTML5 DnD is awkward on touch. If testing on phones surfaces issues, swap `SelectedBadgesEditor` to use the existing `vuedraggable` library (which uses `Sortable.js` under the hood and handles touch correctly). Decision deferred to implementation.
- **Translation work for new i18n keys.** English values are real; non-English values need a translator pass. For the initial PR, fall back to English for unfilled keys via `vue-i18n`'s `fallbackLocale`.
- **MTAR build time.** Adding a Vue build step lengthens `npm run build`. Acceptable; production deploys are infrequent.
