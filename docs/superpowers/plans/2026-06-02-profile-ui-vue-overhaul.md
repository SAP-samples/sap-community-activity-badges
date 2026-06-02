# Profile UI — Vue 3 + UI5 Web Components Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the SAPUI5 `/flp/#profile-ui` Signature Builder with a Vue 3 + TypeScript SPA at `/profile`, styled with UI5 Web Components, preserving all functionality and 11 locales while improving the picker → live-preview UX.

**Architecture:** Self-contained Vite + Vue 3 + TS app under `srv/app/profile-vue/`, built to `dist/` and served by the existing Express server at `/profile`. Pinia store + `computed` signature URLs replace the imperative `buildSignature()` chain. Old `/flp/#profile-ui` URL gets a tiny client-side redirect.

**Tech Stack:** Vue 3.5, TypeScript, Vite 7, `@ui5/webcomponents` + `@ui5/webcomponents-fiori` + `@ui5/webcomponents-vue`, Pinia, Vue Router, vue-i18n, Vitest + `@vue/test-utils` + `@pinia/testing`, Playwright, `concurrently` + `wait-on`.

**Spec:** [`docs/superpowers/specs/2026-06-02-profile-ui-vue-overhaul-design.md`](../specs/2026-06-02-profile-ui-vue-overhaul-design.md)

---

## File Structure

### Files created

```
srv/app/profile-vue/                   ← NEW Vite project root
├── .gitignore                          ← node_modules, dist
├── index.html                          ← Vite entry HTML
├── package.json                        ← own deps; "type": "module"
├── tsconfig.json
├── tsconfig.node.json                  ← for vite.config.ts
├── vite.config.ts                      ← dev proxy + build config
├── vitest.config.ts                    ← test config (jsdom env)
├── playwright.config.ts                ← e2e config
├── public/
│   ├── favicon.ico
│   └── badge-placeholder.svg           ← fallback image for broken badge icons
├── scripts/
│   └── convert-i18n.mjs                ← .properties → JSON for vue-i18n
├── src/
│   ├── main.ts                          ← bootstrap: createApp + plugins + theme
│   ├── App.vue                          ← shell: <RouterView/>
│   ├── router/
│   │   └── index.ts                     ← createRouter, /profile/:scnId? route
│   ├── store/
│   │   └── profile.ts                   ← Pinia useProfileStore
│   ├── components/
│   │   ├── ProfileApp.vue               ← root layout (sticky right rail)
│   │   ├── AppHeader.vue                ← title + locale + theme switcher
│   │   ├── ScnIdInput.vue
│   │   ├── ProfileDetails.vue
│   │   ├── SelectedBadgesEditor.vue
│   │   ├── BadgeBrowser.vue
│   │   ├── BadgeTable.vue
│   │   ├── BadgeGrid.vue
│   │   ├── SignatureRail.vue
│   │   ├── MobileSignatureBar.vue
│   │   └── ErrorBanner.vue
│   ├── composables/
│   │   ├── useKhoros.ts
│   │   ├── useViewportMode.ts
│   │   └── useClipboard.ts
│   ├── utils/
│   │   ├── signatureUrls.ts             ← pure URL builders
│   │   └── parseSignature.ts            ← extract badge IDs from signature HTML
│   ├── types/
│   │   └── khoros.ts                    ← KhorosProfile, BadgeItem, etc.
│   ├── i18n/
│   │   ├── index.ts                     ← createI18n + locale loader
│   │   └── locales/                     ← 11 generated JSON files
│   │       ├── en.json
│   │       ├── de.json
│   │       ├── es.json
│   │       ├── fr.json
│   │       ├── hi.json
│   │       ├── i-klingon.json
│   │       ├── it.json
│   │       ├── iw.json
│   │       ├── ja.json
│   │       ├── la.json
│   │       └── pl.json
│   └── styles/
│       └── main.css                     ← layout-only (sticky rail, mobile bar)
└── tests/
    ├── setup.ts                         ← Vitest setup (registers UI5 WCs)
    ├── unit/
    │   ├── signatureUrls.spec.ts
    │   ├── parseSignature.spec.ts
    │   ├── useKhoros.spec.ts
    │   ├── store-profile.spec.ts
    │   ├── convert-i18n.spec.ts
    │   ├── components/                  ← one .spec.ts per component
    │   │   └── *.spec.ts
    │   └── fixtures/
    │       └── khoros-user.json         ← captured response shape
    └── e2e/
        └── happy-path.spec.ts
docs/superpowers/plans/2026-06-02-profile-ui-vue-overhaul.md   ← this file
```

### Files modified

- `srv/routes/intro.js` — remove the existing `/profile/` redirect; add `/profile` static mount + SPA fallback (regex catch-all).
- `srv/app/flp/index.html` — add a top-of-`<head>` script that catches `#profile-ui` and replaces the location with `/profile`.
- `srv/package.json` — add `concurrently`, `wait-on` devDependencies; replace `dev` script with the orchestrator; add `dev:express`, `dev:server-only`, `dev:vue`, `build:vue`, `test:vue`.
- `package.json` (repo root) — chain Vue install + build before `mbt build`.
- `.gitignore` — add `srv/app/profile-vue/dist/` and `srv/app/profile-vue/node_modules/`.

### Files unchanged (intentionally)

- All `/khoros/*`, `/showcaseBadges*`, `/showcaseSingleBadge*`, `/showcaseBadgesGroups*` route handlers.
- `srv/util/*`.
- `srv/app/flp/profile/` (old SAPUI5 sources — kept this PR; deleted in a follow-up after redirect verified).
- `srv/app/flp/selfie/`, `srv/app/flp/tags/`.
- `mta.yaml` (no changes; `ignore: ["/node_modules"]` already excludes the right thing).

---

## Conventions for every task

- Follow @superpowers:test-driven-development. Every behavior gets a failing test first.
- Frequent commits. Each task ends with a commit. Use [Conventional Commits](https://www.conventionalcommits.org/) prefixes: `feat:`, `test:`, `chore:`, `refactor:`, `docs:`, `fix:`.
- Every command is shown verbatim, with the **exact** working directory and expected output snippet.
- Don't run `npm install` in the root unless the task says so. The Vue app has its own `package.json`.
- All work happens on a feature branch. Step 0 below creates it.


---

## Task 0: Create feature branch

**Files:**
- None — git only.

- [ ] **Step 1: Verify clean working tree**

Run from repo root:
```bash
git status
```
Expected: `working tree clean` on `main`. If not clean, stash or commit existing work first.

- [ ] **Step 2: Create branch**

```bash
git checkout -b feat/profile-ui-vue-overhaul
```
Expected: `Switched to a new branch 'feat/profile-ui-vue-overhaul'`.

---

## Task 1: Scaffold the Vite + Vue 3 + TS project

**Files:**
- Create: `srv/app/profile-vue/package.json`
- Create: `srv/app/profile-vue/tsconfig.json`
- Create: `srv/app/profile-vue/tsconfig.node.json`
- Create: `srv/app/profile-vue/vite.config.ts`
- Create: `srv/app/profile-vue/index.html`
- Create: `srv/app/profile-vue/src/main.ts`
- Create: `srv/app/profile-vue/src/App.vue`
- Create: `srv/app/profile-vue/.gitignore`
- Modify: `.gitignore` (repo root)

- [ ] **Step 1: Create the project directory and `package.json`**

Write `srv/app/profile-vue/package.json`:

```json
{
  "name": "profile-vue",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "i18n:convert": "node scripts/convert-i18n.mjs"
  },
  "dependencies": {
    "@ui5/webcomponents": "^2.13.0",
    "@ui5/webcomponents-fiori": "^2.13.0",
    "@ui5/webcomponents-icons": "^2.13.0",
    "pinia": "^2.3.0",
    "vue": "^3.5.13",
    "vue-i18n": "^10.0.5",
    "vue-router": "^4.5.0"
  },
  "devDependencies": {
    "@pinia/testing": "^0.1.7",
    "@playwright/test": "^1.49.0",
    "@types/node": "^22.10.0",
    "@vitejs/plugin-vue": "^5.2.1",
    "@vue/test-utils": "^2.4.6",
    "jsdom": "^25.0.1",
    "typescript": "^5.7.2",
    "vite": "^7.0.0",
    "vitest": "^2.1.8",
    "vue-tsc": "^2.2.0"
  }
}
```

> Pin versions slightly above current latest as a reasonable floor. If `npm install` reports an unresolved range, bump only that one to the highest dist-tag.
>
> **Note on `@ui5/webcomponents-vue`:** the spec mentions this Vue wrapper package, but in practice this plan uses UI5 Web Components directly as native custom elements (registered via side-effect imports in `main.ts`) with `compilerOptions.isCustomElement` telling Vue to leave them alone. That gives us all the components we need without a beta wrapper layer. We can revisit adopting `@ui5/webcomponents-vue` later if event-typing ergonomics warrant it.

- [ ] **Step 2: Create `tsconfig.json` and `tsconfig.node.json`**

Write `srv/app/profile-vue/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "preserve",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "types": ["vite/client", "vitest/globals"],
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src/**/*", "tests/**/*", "scripts/**/*"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Write `srv/app/profile-vue/tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts", "vitest.config.ts", "playwright.config.ts"]
}
```

- [ ] **Step 3: Create `vite.config.ts` with the dev proxy**

Write `srv/app/profile-vue/vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // ui5-* are custom elements, not Vue components
          isCustomElement: (tag) => tag.startsWith('ui5-')
        }
      }
    })
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  base: '/profile/',
  server: {
    port: 5173,
    proxy: {
      '/khoros':                { target: 'http://localhost:4000', changeOrigin: true },
      '/showcaseBadgesGroups':  { target: 'http://localhost:4000', changeOrigin: true },
      '/showcaseSingleBadge':   { target: 'http://localhost:4000', changeOrigin: true },
      '/showcaseBadges':        { target: 'http://localhost:4000', changeOrigin: true }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
```

> `base: '/profile/'` makes Vite emit asset URLs like `/profile/assets/foo-abc.js`, which is what Express needs since the SPA is served at `/profile`. Without this, asset URLs default to `/` and 404 in production.

- [ ] **Step 4: Create the entry HTML and root files**

Write `srv/app/profile-vue/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/x-icon" href="/profile/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SAP Community Profile and Badge Signature Tool</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

Write `srv/app/profile-vue/src/main.ts`:

```ts
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

Write `srv/app/profile-vue/src/App.vue`:

```vue
<script setup lang="ts">
</script>

<template>
  <div>profile-vue scaffold OK</div>
</template>
```

- [ ] **Step 5: Create `.gitignore` files**

Write `srv/app/profile-vue/.gitignore`:

```
node_modules
dist
.vite
*.tsbuildinfo
test-results
playwright-report
```

Append to repo-root `.gitignore` (do NOT replace existing content):

```
srv/app/profile-vue/dist/
srv/app/profile-vue/node_modules/
```

- [ ] **Step 6: Install and verify the scaffold builds**

```bash
cd srv/app/profile-vue
npm install
npm run build
```
Expected: `npm install` adds dependencies (no errors). `npm run build` exits 0 and writes `dist/index.html` and `dist/assets/`.

- [ ] **Step 7: Commit**

```bash
cd ../../..
git add srv/app/profile-vue/.gitignore srv/app/profile-vue/package.json \
        srv/app/profile-vue/package-lock.json srv/app/profile-vue/tsconfig.json \
        srv/app/profile-vue/tsconfig.node.json srv/app/profile-vue/vite.config.ts \
        srv/app/profile-vue/index.html srv/app/profile-vue/src/main.ts \
        srv/app/profile-vue/src/App.vue .gitignore
git commit -m "feat(profile-vue): scaffold Vite + Vue 3 + TS project"
```


---

## Task 2: Vitest setup + first passing test

**Files:**
- Create: `srv/app/profile-vue/vitest.config.ts`
- Create: `srv/app/profile-vue/tests/setup.ts`
- Create: `srv/app/profile-vue/tests/unit/sanity.spec.ts`

- [ ] **Step 1: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: { isCustomElement: (tag) => tag.startsWith('ui5-') }
      }
    })
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.spec.ts']
  }
})
```

- [ ] **Step 2: Write `tests/setup.ts`** (placeholder; UI5 WC registration goes here later)

```ts
// Test setup. UI5 Web Components are registered lazily by tests that need them.
```

- [ ] **Step 3: Write a failing sanity test**

`tests/unit/sanity.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('sanity', () => {
  it('runs the test runner', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 4: Run it**

```bash
cd srv/app/profile-vue
npm test
```
Expected: `1 passed`. (The test itself is trivial — its purpose is to prove Vitest + jsdom + the alias config work end-to-end.)

- [ ] **Step 5: Commit**

```bash
cd ../../..
git add srv/app/profile-vue/vitest.config.ts \
        srv/app/profile-vue/tests/setup.ts \
        srv/app/profile-vue/tests/unit/sanity.spec.ts
git commit -m "test(profile-vue): set up Vitest with jsdom"
```

---

## Task 3: Khoros types and fixtures

**Files:**
- Create: `srv/app/profile-vue/src/types/khoros.ts`
- Create: `srv/app/profile-vue/tests/unit/fixtures/khoros-user.json`

> The fixture is a captured-from-reality minimal Khoros user response shape. The original SAPUI5 controller reads `data.signature`, `data.user_badges.items[].badge.{id,title,icon_url,awarded}`, `data.user_badges.items[].earned_date`, `data.{first_name,last_name,login,view_href,signature,avatar.profile,rank.name}`. The fixture must contain all of these.

- [ ] **Step 1: Capture a fixture**

`tests/unit/fixtures/khoros-user.json` (this is a representative shape, not real PII):

```json
{
  "data": {
    "id": "12345",
    "login": "demo_user",
    "first_name": "Demo",
    "last_name": "User",
    "view_href": "https://community.sap.com/t5/user/viewprofilepage/user-id/12345",
    "signature": "<a href=\"https://community.sap.com/t5/user/viewprofilepage/user-id/12345\" target=\"_blank\"><img src=\"https://devrel-tools-prod-scn-badges-srv.cfapps.eu10.hana.ondemand.com/showcaseBadgesGroups/demo_user/cap-champion/devtoberfest-2025/first-blog\"/></a>",
    "avatar": { "profile": "https://example.com/avatar.png" },
    "rank": { "name": "Active Contributor" },
    "user_badges": {
      "items": [
        {
          "earned_date": "2024-09-01T12:00:00Z",
          "badge": {
            "id": "cap-champion",
            "title": "CAP Champion",
            "icon_url": "https://example.com/badges/cap-champion.png",
            "awarded": 42
          }
        },
        {
          "earned_date": "2025-10-01T12:00:00Z",
          "badge": {
            "id": "devtoberfest-2025",
            "title": "Devtoberfest 2025",
            "icon_url": "https://example.com/badges/devtoberfest-2025.png",
            "awarded": 1500
          }
        },
        {
          "earned_date": "2018-04-01T12:00:00Z",
          "badge": {
            "id": "first-blog",
            "title": "First Blog Post",
            "icon_url": "https://example.com/badges/first-blog.png",
            "awarded": 9001
          }
        },
        {
          "earned_date": "2023-01-15T12:00:00Z",
          "badge": {
            "id": "five-year",
            "title": "Five Year Member",
            "icon_url": "https://example.com/badges/five-year.png",
            "awarded": 250
          }
        }
      ]
    }
  }
}
```

- [ ] **Step 2: Write the types**

`src/types/khoros.ts`:

```ts
/**
 * Type definitions for the /khoros/user/:scnId response shape.
 * Reflects what the Khoros search-by-author response looks like after
 * srv/util/khoros.js re-shapes it into a {data: <user>} envelope.
 *
 * Optional fields are marked optional because the upstream API has been
 * known to drop fields silently; consumers must defend against missing
 * sub-objects.
 */

export interface KhorosResponse {
  data: KhorosProfile
}

export interface KhorosProfile {
  id?: string
  login?: string
  first_name?: string
  last_name?: string
  view_href?: string
  /** HTML snippet — the user's signature; may contain <img> with a /showcaseBadgesGroups URL. */
  signature?: string
  avatar?: { profile?: string }
  rank?: { name?: string }
  user_badges?: { items?: UserBadgeItem[] }
}

export interface UserBadgeItem {
  earned_date?: string
  badge: BadgeDescriptor
}

export interface BadgeDescriptor {
  id: string
  title?: string
  icon_url?: string
  awarded?: number
}

/** A "selected" slot in the editor — may be empty. */
export interface SelectedBadge {
  id: string | ''
  title: string
  iconUrl: string
}

/** A badge augmented with its current selection state, used by the picker views. */
export interface BadgeWithSelection extends UserBadgeItem {
  selected: boolean
}

/** Typed error returned by useKhoros. */
export class KhorosError extends Error {
  readonly code: 'notFound' | 'network' | 'unexpected'
  readonly status?: number
  constructor(code: KhorosError['code'], message: string, status?: number) {
    super(message)
    this.name = 'KhorosError'
    this.code = code
    this.status = status
  }
}
```

- [ ] **Step 3: Type-check**

```bash
cd srv/app/profile-vue
npx vue-tsc --noEmit
```
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
cd ../../..
git add srv/app/profile-vue/src/types/khoros.ts \
        srv/app/profile-vue/tests/unit/fixtures/khoros-user.json
git commit -m "feat(profile-vue): add Khoros types and test fixture"
```


---

## Task 4: `signatureUrls.ts` — pure URL builders (TDD)

**Files:**
- Test: `srv/app/profile-vue/tests/unit/signatureUrls.spec.ts`
- Create: `srv/app/profile-vue/src/utils/signatureUrls.ts`

> Behaviors covered (from spec):
> - `buildSignatureUrl(scnId, ids)` → `/showcaseBadgesGroups/:scnId[/:b1...]`. Empty/missing IDs are skipped — only non-empty IDs appear in the URL.
> - `buildSignatureLightUrl(scnId, ids)` → `/showcaseSingleBadge/:scnId/:firstId` (light variant uses only the FIRST selected badge).
> - `buildSignatureBigUrl(scnId, ids)` → same as full but path segment `showcaseBadges` instead of `showcaseBadgesGroups`.
> - `buildEmbedHtml(profileUrl, sigUrl, origin)` → `<a href="${profileUrl}" target="_blank"><img src="${origin}${sigUrl}"/></a>`.
> - `buildEmbedMarkdown(profileUrl, sigUrl, origin, alt)` → `[![${alt}](${origin}${sigUrl})](${profileUrl})`.
> - Origin is **passed in**, not hardcoded — fixes the bug where the original always pointed to the production host.

- [ ] **Step 1: Write the failing test**

`tests/unit/signatureUrls.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  buildSignatureUrl,
  buildSignatureLightUrl,
  buildSignatureBigUrl,
  buildEmbedHtml,
  buildEmbedMarkdown
} from '@/utils/signatureUrls'

describe('buildSignatureUrl', () => {
  it('returns base path when no badges are selected', () => {
    expect(buildSignatureUrl('alice', [])).toBe('/showcaseBadgesGroups/alice')
  })

  it('appends each non-empty badge id in order', () => {
    expect(buildSignatureUrl('alice', ['cap', 'devto', 'first']))
      .toBe('/showcaseBadgesGroups/alice/cap/devto/first')
  })

  it('skips empty slots', () => {
    expect(buildSignatureUrl('alice', ['cap', '', 'first', '', '']))
      .toBe('/showcaseBadgesGroups/alice/cap/first')
  })

  it('preserves order — reordering produces a different URL', () => {
    expect(buildSignatureUrl('alice', ['a', 'b'])).not
      .toBe(buildSignatureUrl('alice', ['b', 'a']))
  })
})

describe('buildSignatureLightUrl', () => {
  it('uses only the first non-empty badge', () => {
    expect(buildSignatureLightUrl('alice', ['cap', 'devto']))
      .toBe('/showcaseSingleBadge/alice/cap')
  })

  it('skips empty leading slots to find the first real badge', () => {
    expect(buildSignatureLightUrl('alice', ['', 'cap', 'devto']))
      .toBe('/showcaseSingleBadge/alice/cap')
  })

  it('returns base path with no badge segment when all slots are empty', () => {
    expect(buildSignatureLightUrl('alice', ['', '', '']))
      .toBe('/showcaseSingleBadge/alice')
  })
})

describe('buildSignatureBigUrl', () => {
  it('uses the showcaseBadges path segment', () => {
    expect(buildSignatureBigUrl('alice', ['cap']))
      .toBe('/showcaseBadges/alice/cap')
  })
})

describe('buildEmbedHtml', () => {
  it('wraps the signature URL in an <a><img/></a> with the passed origin', () => {
    const html = buildEmbedHtml(
      'https://community.sap.com/u/alice',
      '/showcaseBadgesGroups/alice/cap',
      'https://example.test'
    )
    expect(html).toBe(
      '<a href="https://community.sap.com/u/alice" target="_blank">' +
      '<img src="https://example.test/showcaseBadgesGroups/alice/cap"/></a>'
    )
  })
})

describe('buildEmbedMarkdown', () => {
  it('formats as ![alt](url)(profile)', () => {
    const md = buildEmbedMarkdown(
      'https://community.sap.com/u/alice',
      '/showcaseBadgesGroups/alice/cap',
      'https://example.test',
      'Alice signature'
    )
    expect(md).toBe(
      '[![Alice signature](https://example.test/showcaseBadgesGroups/alice/cap)]' +
      '(https://community.sap.com/u/alice)'
    )
  })
})
```

- [ ] **Step 2: Run — should fail**

```bash
cd srv/app/profile-vue
npm test -- signatureUrls
```
Expected: **FAIL** — `Cannot find module '@/utils/signatureUrls'`.

- [ ] **Step 3: Implement**

`src/utils/signatureUrls.ts`:

```ts
/**
 * Pure helpers that build signature image URLs and embed snippets.
 * The origin (server URL) is always passed in, so dev/prod work the same way.
 */

/** /showcaseBadgesGroups/:scnId[/:id1...] — empty slots are skipped, order matters. */
export function buildSignatureUrl(scnId: string, badgeIds: readonly string[]): string {
  const tail = badgeIds.filter((id) => id !== '').join('/')
  return tail ? `/showcaseBadgesGroups/${scnId}/${tail}` : `/showcaseBadgesGroups/${scnId}`
}

/** /showcaseSingleBadge/:scnId[/:firstNonEmptyId] — uses only the first non-empty slot. */
export function buildSignatureLightUrl(scnId: string, badgeIds: readonly string[]): string {
  const first = badgeIds.find((id) => id !== '')
  return first ? `/showcaseSingleBadge/${scnId}/${first}` : `/showcaseSingleBadge/${scnId}`
}

/** /showcaseBadges/:scnId[/:id1...] — same shape as full but a different server route. */
export function buildSignatureBigUrl(scnId: string, badgeIds: readonly string[]): string {
  const tail = badgeIds.filter((id) => id !== '').join('/')
  return tail ? `/showcaseBadges/${scnId}/${tail}` : `/showcaseBadges/${scnId}`
}

/** <a href="..." target="_blank"><img src="origin+sigPath"/></a> — for HTML signatures. */
export function buildEmbedHtml(profileUrl: string, sigPath: string, origin: string): string {
  return `<a href="${profileUrl}" target="_blank"><img src="${origin}${sigPath}"/></a>`
}

/** [![alt](origin+sigPath)](profileUrl) — for Markdown contexts (GitHub, blogs). */
export function buildEmbedMarkdown(
  profileUrl: string,
  sigPath: string,
  origin: string,
  alt: string
): string {
  return `[![${alt}](${origin}${sigPath})](${profileUrl})`
}
```

- [ ] **Step 4: Run — should pass**

```bash
npm test -- signatureUrls
```
Expected: all 9 tests **pass**.

- [ ] **Step 5: Commit**

```bash
cd ../../..
git add srv/app/profile-vue/src/utils/signatureUrls.ts \
        srv/app/profile-vue/tests/unit/signatureUrls.spec.ts
git commit -m "feat(profile-vue): pure signatureUrls builders with tests"
```

---

## Task 5: `parseSignature.ts` — extract badge IDs from signature HTML (TDD)

**Files:**
- Test: `srv/app/profile-vue/tests/unit/parseSignature.spec.ts`
- Create: `srv/app/profile-vue/src/utils/parseSignature.ts`

> The original SAPUI5 controller in `srv/app/flp/profile/controller/App.controller.js:42-63` parses `data.signature` HTML, finds `<img>`, splits its `src` URL pathname by `/`, and reads `pathname[badgeIndex + 3]` for indexes 0–4 (so `pathname[3..7]`). The Vue version should replicate this exactly, with explicit handling of malformed inputs.
>
> Pathname examples:
> - `/showcaseBadgesGroups/alice/cap/devto/first` → split: `['', 'showcaseBadgesGroups', 'alice', 'cap', 'devto', 'first']` → indices 3..7 are `cap`, `devto`, `first`, undefined, undefined.

- [ ] **Step 1: Write the failing test**

`tests/unit/parseSignature.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { parseSignatureBadgeIds } from '@/utils/parseSignature'

describe('parseSignatureBadgeIds', () => {
  const wrapImg = (src: string) =>
    `<a href="x"><img src="${src}"/></a>`

  it('returns five empty strings when input is undefined', () => {
    expect(parseSignatureBadgeIds(undefined)).toEqual(['', '', '', '', ''])
  })

  it('returns five empty strings when input is empty', () => {
    expect(parseSignatureBadgeIds('')).toEqual(['', '', '', '', ''])
  })

  it('returns five empty strings when there is no <img>', () => {
    expect(parseSignatureBadgeIds('<a href="x">no image</a>')).toEqual(['', '', '', '', ''])
  })

  it('returns five empty strings when <img> has no src', () => {
    expect(parseSignatureBadgeIds('<img/>')).toEqual(['', '', '', '', ''])
  })

  it('extracts up to 5 badge ids from a /showcaseBadgesGroups URL', () => {
    expect(parseSignatureBadgeIds(wrapImg(
      'https://example.test/showcaseBadgesGroups/alice/cap/devto/first/five-year/ten-year'
    ))).toEqual(['cap', 'devto', 'first', 'five-year', 'ten-year'])
  })

  it('pads empty trailing slots when fewer than 5 badges are present', () => {
    expect(parseSignatureBadgeIds(wrapImg(
      'https://example.test/showcaseBadgesGroups/alice/cap'
    ))).toEqual(['cap', '', '', '', ''])
  })

  it('ignores extra path segments past the 5th badge', () => {
    expect(parseSignatureBadgeIds(wrapImg(
      'https://example.test/showcaseBadgesGroups/alice/a/b/c/d/e/f/g'
    ))).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('returns empty slots when the URL is invalid', () => {
    expect(parseSignatureBadgeIds(wrapImg('not a url'))).toEqual(['', '', '', '', ''])
  })
})
```

- [ ] **Step 2: Run — should fail**

```bash
cd srv/app/profile-vue
npm test -- parseSignature
```
Expected: **FAIL** — `Cannot find module '@/utils/parseSignature'`.

- [ ] **Step 3: Implement**

`src/utils/parseSignature.ts`:

```ts
/**
 * Extracts up to 5 badge IDs from the embedded <img> in a Khoros signature HTML.
 *
 * Mirrors the original SAPUI5 controller logic:
 *   pathname = url.pathname.split('/')
 *   for badgeIndex in 0..4: pathname[badgeIndex + 3]
 *
 * Returns a fixed-length-5 array, padding empty slots with ''.
 * Tolerates: undefined input, missing <img>, missing src, invalid URL.
 */
export function parseSignatureBadgeIds(signatureHtml: string | undefined): string[] {
  const empty = ['', '', '', '', '']
  if (!signatureHtml) return empty

  let src: string | null = null
  try {
    const doc = new DOMParser().parseFromString(signatureHtml, 'text/html')
    const img = doc.querySelector('img')
    src = img ? img.getAttribute('src') : null
  } catch {
    return empty
  }
  if (!src) return empty

  let pathname: string
  try {
    pathname = new URL(src).pathname
  } catch {
    return empty
  }

  const segments = pathname.split('/')
  return [0, 1, 2, 3, 4].map((badgeIndex) => segments[badgeIndex + 3] ?? '')
}
```

- [ ] **Step 4: Run — should pass**

```bash
npm test -- parseSignature
```
Expected: all 8 tests **pass**.

- [ ] **Step 5: Commit**

```bash
cd ../../..
git add srv/app/profile-vue/src/utils/parseSignature.ts \
        srv/app/profile-vue/tests/unit/parseSignature.spec.ts
git commit -m "feat(profile-vue): parse badge ids from signature HTML"
```

---

## Task 6: `useKhoros.ts` — typed network composable (TDD)

**Files:**
- Test: `srv/app/profile-vue/tests/unit/useKhoros.spec.ts`
- Create: `srv/app/profile-vue/src/composables/useKhoros.ts`

> Behaviors covered (from spec):
> - On 200 with valid JSON: returns the parsed object.
> - On 404: throws `KhorosError` with code `'notFound'`.
> - On 500/other non-2xx: throws `KhorosError` with code `'unexpected'` and the actual status.
> - On `fetch` rejection (network failure): throws `KhorosError` with code `'network'`.
> - On 200 with invalid JSON: throws `KhorosError` with code `'unexpected'`.

- [ ] **Step 1: Write the failing test**

`tests/unit/useKhoros.spec.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { loadUserProfile } from '@/composables/useKhoros'
import { KhorosError } from '@/types/khoros'

describe('loadUserProfile', () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('returns parsed JSON on 200', async () => {
    const payload = { data: { id: '1', login: 'alice' } }
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => payload })

    const result = await loadUserProfile('alice')

    expect(fetchMock).toHaveBeenCalledWith('/khoros/user/alice', expect.any(Object))
    expect(result).toEqual(payload)
  })

  it('throws notFound on 404', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404, text: async () => 'not found' })
    await expect(loadUserProfile('ghost')).rejects.toMatchObject({
      name: 'KhorosError', code: 'notFound', status: 404
    })
  })

  it('throws unexpected on 500', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'boom' })
    await expect(loadUserProfile('alice')).rejects.toMatchObject({
      code: 'unexpected', status: 500
    })
  })

  it('throws network on fetch rejection', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(loadUserProfile('alice')).rejects.toMatchObject({ code: 'network' })
  })

  it('throws unexpected when response is not valid JSON', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => { throw new SyntaxError('bad json') }
    })
    await expect(loadUserProfile('alice')).rejects.toMatchObject({ code: 'unexpected' })
  })

  it('uri-encodes the scnId', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: {} }) })
    await loadUserProfile('alice bob')
    expect(fetchMock).toHaveBeenCalledWith('/khoros/user/alice%20bob', expect.any(Object))
  })

  it('returned error is an instance of KhorosError', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404, text: async () => '' })
    try {
      await loadUserProfile('ghost')
    } catch (e) {
      expect(e).toBeInstanceOf(KhorosError)
    }
  })
})
```

- [ ] **Step 2: Run — should fail**

```bash
cd srv/app/profile-vue
npm test -- useKhoros
```
Expected: **FAIL** — `Cannot find module '@/composables/useKhoros'`.

- [ ] **Step 3: Implement**

`src/composables/useKhoros.ts`:

```ts
import { KhorosError, type KhorosResponse } from '@/types/khoros'

/**
 * Loads a Khoros user profile via the existing Express endpoint.
 * The only network call this app makes (signature <img> tags trigger
 * their own browser-native loads).
 */
export async function loadUserProfile(scnId: string): Promise<KhorosResponse> {
  const url = `/khoros/user/${encodeURIComponent(scnId)}`

  let response: Response
  try {
    response = await fetch(url, { method: 'GET' })
  } catch (err) {
    throw new KhorosError('network', err instanceof Error ? err.message : 'network error')
  }

  if (!response.ok) {
    const code = response.status === 404 ? 'notFound' : 'unexpected'
    const body = await response.text().catch(() => '')
    throw new KhorosError(code, body || `HTTP ${response.status}`, response.status)
  }

  try {
    return (await response.json()) as KhorosResponse
  } catch (err) {
    throw new KhorosError(
      'unexpected',
      err instanceof Error ? err.message : 'invalid JSON',
      response.status
    )
  }
}
```

- [ ] **Step 4: Run — should pass**

```bash
npm test -- useKhoros
```
Expected: all 7 tests **pass**.

- [ ] **Step 5: Commit**

```bash
cd ../../..
git add srv/app/profile-vue/src/composables/useKhoros.ts \
        srv/app/profile-vue/tests/unit/useKhoros.spec.ts
git commit -m "feat(profile-vue): typed Khoros loader composable"
```

---

## Task 7: Pinia store `useProfileStore` (TDD)

**Files:**
- Test: `srv/app/profile-vue/tests/unit/store-profile.spec.ts`
- Create: `srv/app/profile-vue/src/store/profile.ts`

> Behaviors:
> - `loadProfile(scnId)` happy path: sets `profile`, seeds `selectedBadgeIds` from signature, marks each badge's `selected` flag, clears `loading` and `error`.
> - `loadProfile` notFound: clears profile, sets error with code `notFound`.
> - `loadProfile` malformed payload (missing `user_badges`): graceful — no throw, `selectedBadgeIds = ['','','','','']`, `allBadges = []`, error set to `unexpected`.
> - `toggleBadge` selecting beyond 5 emits a limit error (returns false / sets transient flag).
> - `toggleBadge` deselect removes the id and shifts remaining slots up (preserving order, padding tail with '').
> - `reorderSelectedBadges(from, to)` swaps positions.
> - `signatureUrl`, `signatureLightUrl`, `signatureBigUrl`, `embedHtml`, `embedMarkdown`, `selectedBadges`, `allBadges` are all reactive computeds.

- [ ] **Step 1: Write the failing test**

`tests/unit/store-profile.spec.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import fixture from './fixtures/khoros-user.json'

vi.mock('@/composables/useKhoros', () => ({
  loadUserProfile: vi.fn()
}))

import { loadUserProfile } from '@/composables/useKhoros'
import { useProfileStore } from '@/store/profile'
import { KhorosError } from '@/types/khoros'

const mocked = loadUserProfile as unknown as ReturnType<typeof vi.fn>

describe('useProfileStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mocked.mockReset()
    // jsdom default origin is http://localhost:3000
    Object.defineProperty(window, 'location', {
      value: new URL('http://localhost:3000/profile/demo_user'),
      writable: true
    })
  })

  it('loadProfile sets profile and seeds selectedBadgeIds from signature', async () => {
    mocked.mockResolvedValueOnce(fixture)
    const store = useProfileStore()

    await store.loadProfile('demo_user')

    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.profile).toEqual(fixture.data)
    // signature in fixture references cap-champion / devtoberfest-2025 / first-blog
    expect(store.selectedBadgeIds.slice(0, 3))
      .toEqual(['cap-champion', 'devtoberfest-2025', 'first-blog'])
    expect(store.selectedBadgeIds).toHaveLength(5)
  })

  it('allBadges marks selected = true for badges referenced in the signature', async () => {
    mocked.mockResolvedValueOnce(fixture)
    const store = useProfileStore()
    await store.loadProfile('demo_user')

    const byId = Object.fromEntries(store.allBadges.map((b) => [b.badge.id, b.selected]))
    expect(byId['cap-champion']).toBe(true)
    expect(byId['devtoberfest-2025']).toBe(true)
    expect(byId['first-blog']).toBe(true)
    expect(byId['five-year']).toBe(false)
  })

  it('signatureUrl is computed from selected ids in order', async () => {
    mocked.mockResolvedValueOnce(fixture)
    const store = useProfileStore()
    await store.loadProfile('demo_user')

    expect(store.signatureUrl)
      .toBe('/showcaseBadgesGroups/demo_user/cap-champion/devtoberfest-2025/first-blog')
    expect(store.signatureLightUrl)
      .toBe('/showcaseSingleBadge/demo_user/cap-champion')
    expect(store.signatureBigUrl)
      .toBe('/showcaseBadges/demo_user/cap-champion/devtoberfest-2025/first-blog')
  })

  it('embedHtml uses window.location.origin', async () => {
    mocked.mockResolvedValueOnce(fixture)
    const store = useProfileStore()
    await store.loadProfile('demo_user')

    expect(store.embedHtml).toContain('http://localhost:3000/showcaseBadgesGroups/demo_user/')
    expect(store.embedHtml).toContain(fixture.data.view_href!)
  })

  it('toggleBadge adds a fourth badge into the next free slot', async () => {
    mocked.mockResolvedValueOnce(fixture)
    const store = useProfileStore()
    await store.loadProfile('demo_user')

    store.toggleBadge('five-year')
    expect(store.selectedBadgeIds.slice(0, 4))
      .toEqual(['cap-champion', 'devtoberfest-2025', 'first-blog', 'five-year'])
    expect(store.selectedBadgeIds[4]).toBe('')
  })

  it('toggleBadge enforces the 5-badge cap and emits a limit error', async () => {
    mocked.mockResolvedValueOnce(fixture)
    const store = useProfileStore()
    await store.loadProfile('demo_user')

    // Already 3 selected. Add 2 more to reach 5, then try a 6th.
    store.toggleBadge('five-year')
    // augment fixture with synthetic badges to reach 5
    store.selectedBadgeIds[4] = 'fake-fifth'

    const before = [...store.selectedBadgeIds]
    store.toggleBadge('first-blog-2') // any unselected id
    expect(store.selectedBadgeIds).toEqual(before)
    expect(store.limitErrorTick).toBeGreaterThan(0)
  })

  it('toggleBadge deselect removes id and pads the tail with empty string', async () => {
    mocked.mockResolvedValueOnce(fixture)
    const store = useProfileStore()
    await store.loadProfile('demo_user')

    store.toggleBadge('devtoberfest-2025') // currently slot 1
    expect(store.selectedBadgeIds).toEqual(['cap-champion', 'first-blog', '', '', ''])
  })

  it('reorderSelectedBadges swaps positions', async () => {
    mocked.mockResolvedValueOnce(fixture)
    const store = useProfileStore()
    await store.loadProfile('demo_user')

    store.reorderSelectedBadges(0, 2)
    expect(store.selectedBadgeIds.slice(0, 3))
      .toEqual(['devtoberfest-2025', 'first-blog', 'cap-champion'])
  })

  it('loadProfile sets error.code = notFound on KhorosError 404', async () => {
    mocked.mockRejectedValueOnce(new KhorosError('notFound', 'no such user', 404))
    const store = useProfileStore()

    await store.loadProfile('ghost')

    expect(store.profile).toBeNull()
    expect(store.error?.code).toBe('notFound')
    expect(store.loading).toBe(false)
  })

  it('loadProfile gracefully handles a payload missing user_badges', async () => {
    mocked.mockResolvedValueOnce({ data: { id: '1', login: 'x', signature: '' } })
    const store = useProfileStore()

    await store.loadProfile('x')

    expect(store.allBadges).toEqual([])
    expect(store.selectedBadgeIds).toEqual(['', '', '', '', ''])
    expect(store.error?.code).toBe('unexpected')
  })

  it('clearSelected resets selection to all empty', async () => {
    mocked.mockResolvedValueOnce(fixture)
    const store = useProfileStore()
    await store.loadProfile('demo_user')

    store.clearSelected()
    expect(store.selectedBadgeIds).toEqual(['', '', '', '', ''])
  })
})
```

- [ ] **Step 2: Run — should fail**

```bash
cd srv/app/profile-vue
npm test -- store-profile
```
Expected: **FAIL** — `Cannot find module '@/store/profile'`.

- [ ] **Step 3: Implement**

`src/store/profile.ts`:

```ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { loadUserProfile } from '@/composables/useKhoros'
import { parseSignatureBadgeIds } from '@/utils/parseSignature'
import {
  buildSignatureUrl,
  buildSignatureLightUrl,
  buildSignatureBigUrl,
  buildEmbedHtml,
  buildEmbedMarkdown
} from '@/utils/signatureUrls'
import {
  KhorosError,
  type BadgeWithSelection,
  type KhorosProfile,
  type SelectedBadge
} from '@/types/khoros'

const EMPTY_SLOTS = (): string[] => ['', '', '', '', '']
const SIGNATURE_ALT_FALLBACK = 'SAP Community signature'

export const useProfileStore = defineStore('profile', () => {
  // ── state ──────────────────────────────────────────────────────────────
  const scnId = ref<string>('')
  const profile = ref<KhorosProfile | null>(null)
  const selectedBadgeIds = ref<string[]>(EMPTY_SLOTS())
  const viewMode = ref<'table' | 'grid'>('table')
  const loading = ref(false)
  const error = ref<{ code: 'notFound' | 'network' | 'unexpected'; message: string } | null>(null)
  /** Increments each time toggleBadge rejects a 6th selection, so views can react. */
  const limitErrorTick = ref(0)
  /** Optional alt text override (filled by component layer with i18n string). */
  const signatureAlt = ref(SIGNATURE_ALT_FALLBACK)

  // ── computed ───────────────────────────────────────────────────────────
  const profileUrl = computed(() => profile.value?.view_href ?? '')

  const allBadges = computed<BadgeWithSelection[]>(() => {
    const items = profile.value?.user_badges?.items ?? []
    const sel = new Set(selectedBadgeIds.value.filter((id) => id !== ''))
    return items.map((it) => ({ ...it, selected: sel.has(it.badge.id) }))
  })

  const selectedBadges = computed<SelectedBadge[]>(() => {
    const lookup = new Map<string, BadgeWithSelection>()
    for (const b of allBadges.value) lookup.set(b.badge.id, b)
    return selectedBadgeIds.value.map((id) => {
      if (id === '') return { id: '', title: '', iconUrl: '' }
      const b = lookup.get(id)
      return {
        id,
        title: b?.badge.title ?? id,
        iconUrl: b?.badge.icon_url ?? ''
      }
    })
  })

  const signatureUrl = computed(() => buildSignatureUrl(scnId.value, selectedBadgeIds.value))
  const signatureLightUrl = computed(() => buildSignatureLightUrl(scnId.value, selectedBadgeIds.value))
  const signatureBigUrl = computed(() => buildSignatureBigUrl(scnId.value, selectedBadgeIds.value))

  const embedHtml = computed(() =>
    buildEmbedHtml(profileUrl.value, signatureUrl.value, window.location.origin)
  )
  const embedMarkdown = computed(() =>
    buildEmbedMarkdown(profileUrl.value, signatureUrl.value, window.location.origin, signatureAlt.value)
  )

  // ── actions ────────────────────────────────────────────────────────────
  async function loadProfile(newScnId: string): Promise<void> {
    scnId.value = newScnId
    loading.value = true
    error.value = null
    try {
      const response = await loadUserProfile(newScnId)
      profile.value = response.data ?? null

      if (!response.data?.user_badges) {
        selectedBadgeIds.value = EMPTY_SLOTS()
        error.value = { code: 'unexpected', message: 'Response missing user_badges' }
        return
      }

      // Seed selected ids from the signature HTML, validate against actual badges.
      const fromSig = parseSignatureBadgeIds(response.data.signature)
      const validIds = new Set((response.data.user_badges.items ?? []).map((i) => i.badge.id))
      selectedBadgeIds.value = fromSig.map((id) => (id !== '' && validIds.has(id) ? id : ''))
      // Compact non-empty to the front (preserves user-visible order).
      const compact = selectedBadgeIds.value.filter((id) => id !== '')
      selectedBadgeIds.value = [...compact, ...EMPTY_SLOTS()].slice(0, 5)
    } catch (err) {
      profile.value = null
      selectedBadgeIds.value = EMPTY_SLOTS()
      if (err instanceof KhorosError) {
        error.value = { code: err.code, message: err.message }
      } else {
        error.value = { code: 'unexpected', message: err instanceof Error ? err.message : 'unknown' }
      }
    } finally {
      loading.value = false
    }
  }

  function toggleBadge(badgeId: string): void {
    const ids = [...selectedBadgeIds.value]
    const existing = ids.indexOf(badgeId)
    if (existing !== -1) {
      // deselect: remove and pad tail
      ids.splice(existing, 1)
      ids.push('')
      selectedBadgeIds.value = ids
      return
    }
    // select: insert at first empty slot
    const empty = ids.indexOf('')
    if (empty === -1) {
      limitErrorTick.value++
      return
    }
    ids[empty] = badgeId
    selectedBadgeIds.value = ids
  }

  function reorderSelectedBadges(from: number, to: number): void {
    if (from === to) return
    const ids = [...selectedBadgeIds.value]
    const [moved] = ids.splice(from, 1)
    ids.splice(to, 0, moved)
    selectedBadgeIds.value = ids
  }

  function clearSelected(): void {
    selectedBadgeIds.value = EMPTY_SLOTS()
  }

  function setViewMode(mode: 'table' | 'grid'): void {
    viewMode.value = mode
  }

  function setSignatureAlt(text: string): void {
    signatureAlt.value = text || SIGNATURE_ALT_FALLBACK
  }

  return {
    // state
    scnId, profile, selectedBadgeIds, viewMode, loading, error, limitErrorTick, signatureAlt,
    // computed
    profileUrl, allBadges, selectedBadges,
    signatureUrl, signatureLightUrl, signatureBigUrl,
    embedHtml, embedMarkdown,
    // actions
    loadProfile, toggleBadge, reorderSelectedBadges, clearSelected, setViewMode, setSignatureAlt
  }
})
```

- [ ] **Step 4: Run — should pass**

```bash
npm test -- store-profile
```
Expected: all 11 tests **pass**.

- [ ] **Step 5: Commit**

```bash
cd ../../..
git add srv/app/profile-vue/src/store/profile.ts \
        srv/app/profile-vue/tests/unit/store-profile.spec.ts
git commit -m "feat(profile-vue): Pinia store with reactive signature URLs"
```

---

## Task 8: i18n converter script + 11 locale JSON files (TDD)

**Files:**
- Test: `srv/app/profile-vue/tests/unit/convert-i18n.spec.ts`
- Create: `srv/app/profile-vue/scripts/convert-i18n.mjs`
- Create: `srv/app/profile-vue/src/i18n/locales/{en,de,es,fr,hi,i-klingon,it,iw,ja,la,pl}.json` (generated)

> The converter reads each `srv/app/flp/profile/i18n/i18n[_locale].properties` and produces a JSON file in `src/i18n/locales/`. Each `.properties` line `key=value` becomes a JSON entry. Dotted keys (e.g. `profile.scnId`) become nested objects in the JSON. Unicode escapes (`\uXXXX`) are decoded. Comments (`#`) and blank lines are skipped. Continuation lines (line ending in `\`) are joined.
> The default `i18n.properties` → `en.json`. Each `i18n_<locale>.properties` → `<locale>.json`.

- [ ] **Step 1: Write the failing test**

`tests/unit/convert-i18n.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { propertiesToObject } from '@/../scripts/convert-i18n.mjs'

describe('propertiesToObject', () => {
  it('parses simple key=value pairs into a flat object', () => {
    expect(propertiesToObject('a=1\nb=2')).toEqual({ a: '1', b: '2' })
  })

  it('nests dotted keys', () => {
    expect(propertiesToObject('profile.scnId=SAP Community ID'))
      .toEqual({ profile: { scnId: 'SAP Community ID' } })
  })

  it('skips comment lines starting with # or !', () => {
    expect(propertiesToObject('# comment\n!another\nkey=value'))
      .toEqual({ key: 'value' })
  })

  it('skips blank lines', () => {
    expect(propertiesToObject('\n\nkey=value\n\n')).toEqual({ key: 'value' })
  })

  it('decodes \\uXXXX escapes', () => {
    expect(propertiesToObject('greeting=\\u00fcber')).toEqual({ greeting: 'über' })
  })

  it('joins continuation lines (line ending in backslash)', () => {
    expect(propertiesToObject('long=part1 \\\npart2')).toEqual({ long: 'part1 part2' })
  })

  it('preserves later values when a key appears twice', () => {
    expect(propertiesToObject('k=first\nk=second')).toEqual({ k: 'second' })
  })

  it('treats = inside the value as part of the value', () => {
    expect(propertiesToObject('eq=a=b=c')).toEqual({ eq: 'a=b=c' })
  })
})
```

- [ ] **Step 2: Run — should fail**

```bash
cd srv/app/profile-vue
npm test -- convert-i18n
```
Expected: **FAIL** — module not found.

- [ ] **Step 3: Implement the converter**

`scripts/convert-i18n.mjs`:

```js
#!/usr/bin/env node
/**
 * Reads srv/app/flp/profile/i18n/*.properties (the existing SAPUI5 i18n bundle)
 * and emits matching JSON files in src/i18n/locales/ for vue-i18n.
 *
 * Mapping:
 *   i18n.properties             → src/i18n/locales/en.json
 *   i18n_<locale>.properties    → src/i18n/locales/<locale>.json
 *
 * Idempotent — re-runnable on any source change.
 *
 * Also exports propertiesToObject() for unit testing.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC_DIR = resolve(__dirname, '../../flp/profile/i18n')
const OUT_DIR = resolve(__dirname, '../src/i18n/locales')

/** Decodes \uXXXX escapes in a properties value string. */
function decodeEscapes(s) {
  return s.replace(/\\u([0-9a-fA-F]{4})/g, (_m, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  )
}

/**
 * Parses a Java-style .properties file body into a nested JS object.
 * Exported for unit tests.
 */
export function propertiesToObject(text) {
  const result = {}
  const rawLines = text.split(/\r?\n/)

  // Join continuation lines (ending in unescaped backslash)
  const joined = []
  let buf = ''
  for (const line of rawLines) {
    const trimRight = line.replace(/\s+$/, '')
    if (trimRight.endsWith('\\') && !trimRight.endsWith('\\\\')) {
      buf += trimRight.slice(0, -1)
    } else {
      buf += trimRight
      joined.push(buf)
      buf = ''
    }
  }
  if (buf) joined.push(buf)

  for (const rawLine of joined) {
    const line = rawLine.trim()
    if (!line) continue
    if (line.startsWith('#') || line.startsWith('!')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    const value = decodeEscapes(line.slice(eq + 1).trim())

    // Nest dotted keys
    const parts = key.split('.')
    let cursor = result
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (typeof cursor[part] !== 'object' || cursor[part] === null) cursor[part] = {}
      cursor = cursor[part]
    }
    cursor[parts[parts.length - 1]] = value
  }
  return result
}

function localeFromFilename(filename) {
  const m = filename.match(/^i18n(?:_(.+))?\.properties$/)
  if (!m) return null
  return m[1] ?? 'en'
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  const files = readdirSync(SRC_DIR).filter((f) => f.endsWith('.properties'))

  for (const file of files) {
    const locale = localeFromFilename(file)
    if (!locale) continue
    const text = readFileSync(join(SRC_DIR, file), 'utf8')
    const obj = propertiesToObject(text)
    writeFileSync(
      join(OUT_DIR, `${locale}.json`),
      JSON.stringify(obj, null, 2) + '\n',
      'utf8'
    )
    process.stdout.write(`✓ ${file} → ${locale}.json\n`)
  }
}

// Only run main when invoked directly, not when imported by tests.
const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))
if (invokedDirectly) main()
```

- [ ] **Step 4: Run — should pass**

```bash
npm test -- convert-i18n
```
Expected: all 8 tests **pass**.

- [ ] **Step 5: Add the new i18n keys to the SOURCE `.properties` files**

> Important: we add new keys to the source `.properties` files in `srv/app/flp/profile/i18n/`, NOT to the generated JSON. This makes the converter idempotent — anyone running `npm run i18n:convert` later will preserve all keys.

Append this block to the END of `srv/app/flp/profile/i18n/i18n.properties` (the English default):

```properties

# --- Vue overhaul keys (2026-06) ---
error.notFound=User ''{scnId}'' not found.
error.network=Could not reach the SAP Community service. Check your connection and try again.
error.unexpected=Something unexpected happened while loading the profile.
error.retry=Retry
view.table=Table
view.grid=Grid
embed.html=HTML
embed.markdown=Markdown
embed.url=URL only
embed.copy=Copy
embed.copied=Copied
embed.copyFallback=Selected — press Ctrl+C to copy
signature.alt={scnId} SAP Community signature
mobile.preview=Preview
mobile.expand=Show signature
mobile.collapse=Hide signature
theme.toggle=Toggle theme
```

Append the same block (English values) to each of the other 10 locale files: `i18n_de.properties`, `i18n_es.properties`, `i18n_fr.properties`, `i18n_hi.properties`, `i18n_i-klingon.properties`, `i18n_it.properties`, `i18n_iw.properties`, `i18n_ja.properties`, `i18n_la.properties`, `i18n_pl.properties`. `vue-i18n` falls back to English for any missing key, so this is safe — translation polish becomes a follow-up issue.

> **Recommended fast path:** for the initial PR, copy the English block verbatim into the other 10 files. Open a follow-up issue for translation polish. Document this choice in the PR description. (Klingon and Latin can get period-appropriate flavor later — e.g. Klingon `error.network` → `qaStaH nuq jay'?` — but English is fine for now.)

- [ ] **Step 6: Run the converter — generates 11 JSON files containing both old and new keys**

```bash
npm run i18n:convert
ls src/i18n/locales/
```

Expected output: 11 JSON files: `de.json en.json es.json fr.json hi.json i-klingon.json it.json iw.json ja.json la.json pl.json`.

Spot-check `en.json` contains the new keys:

```bash
node -e "const j = require('./src/i18n/locales/en.json'); console.log(j.error, j.embed, j.view)"
```

Expected: prints the `error`, `embed`, `view` blocks with English values. Re-running `npm run i18n:convert` produces byte-identical output (idempotent).

- [ ] **Step 7: Commit**

```bash
cd ../../..
git add srv/app/profile-vue/scripts/convert-i18n.mjs \
        srv/app/profile-vue/tests/unit/convert-i18n.spec.ts \
        srv/app/profile-vue/src/i18n/locales/ \
        srv/app/flp/profile/i18n/
git commit -m "feat(profile-vue): port 11 locales from SAPUI5 + i18n converter

Adds new Vue-overhaul keys (error.*, view.*, embed.*, signature.*,
mobile.*, theme.*) to the source .properties files so the converter
is idempotent."
```

---

## Task 9: vue-i18n + Vue Router + Pinia bootstrap

**Files:**
- Create: `srv/app/profile-vue/src/i18n/index.ts`
- Create: `srv/app/profile-vue/src/router/index.ts`
- Modify: `srv/app/profile-vue/src/main.ts`

> Bootstrapping is wiring, but each piece has one decision to lock down:
> - Default locale: `navigator.language` if it matches a supported locale, else `'en'`.
> - Locale persistence: `localStorage.profileLocale`.
> - Theme: read `prefers-color-scheme`, allow `localStorage.profileTheme` override, apply via `setTheme()`.

- [ ] **Step 1: Write `src/i18n/index.ts`**

```ts
import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import de from './locales/de.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import hi from './locales/hi.json'
import iKlingon from './locales/i-klingon.json'
import it from './locales/it.json'
import iw from './locales/iw.json'
import ja from './locales/ja.json'
import la from './locales/la.json'
import pl from './locales/pl.json'

export const SUPPORTED_LOCALES = [
  'en', 'de', 'es', 'fr', 'hi', 'i-klingon', 'it', 'iw', 'ja', 'la', 'pl'
] as const
export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

const STORAGE_KEY = 'profileLocale'

function detectInitialLocale(): SupportedLocale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && SUPPORTED_LOCALES.includes(saved as SupportedLocale)) {
      return saved as SupportedLocale
    }
  } catch { /* localStorage unavailable; fall through */ }
  const browser = (typeof navigator !== 'undefined' ? navigator.language : 'en').toLowerCase()
  // Match exact codes first (e.g. 'i-klingon'), then primary subtag.
  if (SUPPORTED_LOCALES.includes(browser as SupportedLocale)) {
    return browser as SupportedLocale
  }
  const primary = browser.split('-')[0]
  if (SUPPORTED_LOCALES.includes(primary as SupportedLocale)) {
    return primary as SupportedLocale
  }
  return 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: detectInitialLocale(),
  fallbackLocale: 'en',
  missingWarn: false,
  fallbackWarn: false,
  messages: {
    en, de, es, fr, hi, 'i-klingon': iKlingon, it, iw, ja, la, pl
  }
})

export function setLocale(locale: SupportedLocale): void {
  ;(i18n.global.locale as unknown as { value: SupportedLocale }).value = locale
  document.documentElement.setAttribute('lang', locale)
  try { localStorage.setItem(STORAGE_KEY, locale) } catch { /* ignore */ }
}
```

- [ ] **Step 2: Write `src/router/index.ts`**

```ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/profile/:scnId?',
    name: 'profile',
    component: () => import('@/components/ProfileApp.vue'),
    props: true
  },
  // Catch-all → redirect to bare /profile
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'profile' }
  }
]

export const router = createRouter({
  history: createWebHistory('/profile/'),
  routes
})
```

- [ ] **Step 3: Update `src/main.ts`**

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { i18n, setLocale } from './i18n'
import { router } from './router'
import './styles/main.css'

// UI5 Web Components — register the ones we use upfront. Tree-shakable: each
// import side-effect-registers the custom element.
import '@ui5/webcomponents/dist/Avatar.js'
import '@ui5/webcomponents/dist/BusyIndicator.js'
import '@ui5/webcomponents/dist/Button.js'
import '@ui5/webcomponents/dist/Card.js'
import '@ui5/webcomponents/dist/CardHeader.js'
import '@ui5/webcomponents/dist/CheckBox.js'
import '@ui5/webcomponents/dist/Dialog.js'
import '@ui5/webcomponents/dist/Icon.js'
import '@ui5/webcomponents/dist/Input.js'
import '@ui5/webcomponents/dist/Label.js'
import '@ui5/webcomponents/dist/Link.js'
import '@ui5/webcomponents/dist/MessageStrip.js'
import '@ui5/webcomponents/dist/Panel.js'
import '@ui5/webcomponents/dist/SegmentedButton.js'
import '@ui5/webcomponents/dist/SegmentedButtonItem.js'
import '@ui5/webcomponents/dist/Tab.js'
import '@ui5/webcomponents/dist/TabContainer.js'
import '@ui5/webcomponents/dist/Table.js'
import '@ui5/webcomponents/dist/TableColumn.js'
import '@ui5/webcomponents/dist/TableRow.js'
import '@ui5/webcomponents/dist/TableCell.js'
import '@ui5/webcomponents/dist/TextArea.js'
import '@ui5/webcomponents/dist/Title.js'
import '@ui5/webcomponents/dist/Toast.js'
import '@ui5/webcomponents-fiori/dist/ShellBar.js'
import '@ui5/webcomponents-icons/dist/sys-find.js'
import '@ui5/webcomponents-icons/dist/grid-view.js'
import '@ui5/webcomponents-icons/dist/table-view.js'
import '@ui5/webcomponents-icons/dist/copy.js'
import '@ui5/webcomponents-icons/dist/decline.js'
import '@ui5/webcomponents-icons/dist/drag-and-drop.js'
import '@ui5/webcomponents-icons/dist/navigation-up-arrow.js'
import '@ui5/webcomponents-icons/dist/navigation-down-arrow.js'

import { setTheme } from '@ui5/webcomponents-base/dist/config/Theme.js'

function detectTheme(): 'sap_horizon' | 'sap_horizon_dark' {
  try {
    const saved = localStorage.getItem('profileTheme')
    if (saved === 'sap_horizon' || saved === 'sap_horizon_dark') return saved
  } catch { /* ignore */ }
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'sap_horizon_dark' : 'sap_horizon'
  } catch { return 'sap_horizon' }
}

setTheme(detectTheme())
setLocale(i18n.global.locale.value as never)

const app = createApp(App)
app.use(createPinia())
app.use(i18n)
app.use(router)
app.mount('#app')
```

> Note: `@ui5/webcomponents-icons` is included in the Task 1 `package.json`. If you ever add icons that aren't already side-effect-imported here, add another `import '@ui5/webcomponents-icons/dist/<icon-name>.js'` line.

- [ ] **Step 4: Update `src/App.vue` to render the router view**

```vue
<script setup lang="ts">
</script>

<template>
  <RouterView />
</template>
```

- [ ] **Step 5: Add a placeholder `ProfileApp.vue` to keep the build green**

`src/components/ProfileApp.vue`:

```vue
<script setup lang="ts">
defineProps<{ scnId?: string }>()
</script>

<template>
  <main class="profile-app">
    <h1>Profile UI (placeholder)</h1>
    <p v-if="$props.scnId">SCN ID: {{ $props.scnId }}</p>
  </main>
</template>

<style scoped>
.profile-app { padding: 1rem; }
</style>
```

- [ ] **Step 6: Add a minimal `styles/main.css`**

```css
:root { color-scheme: light dark; }
html, body, #app { margin: 0; padding: 0; height: 100%; }
body {
  font-family: var(--sapFontFamily, system-ui, sans-serif);
  background: var(--sapBackgroundColor, #fff);
  color: var(--sapTextColor, #000);
}
```

- [ ] **Step 7: Verify build and basic boot**

```bash
cd srv/app/profile-vue
npm install
npm run build
```
Expected: 0 errors. `dist/index.html` + `dist/assets/` produced.

```bash
npm run dev -- --port 5173
```
Open `http://localhost:5173/profile/test`. Expected: page renders "Profile UI (placeholder) · SCN ID: test". Stop with Ctrl+C.

- [ ] **Step 8: Commit**

```bash
cd ../../..
git add srv/app/profile-vue/src/i18n/index.ts \
        srv/app/profile-vue/src/router/index.ts \
        srv/app/profile-vue/src/main.ts \
        srv/app/profile-vue/src/App.vue \
        srv/app/profile-vue/src/components/ProfileApp.vue \
        srv/app/profile-vue/src/styles/main.css \
        srv/app/profile-vue/package.json \
        srv/app/profile-vue/package-lock.json
git commit -m "feat(profile-vue): bootstrap router, vue-i18n, Pinia, theme"
```

---

## Task 10: `useViewportMode.ts` and `useClipboard.ts` composables (TDD)

**Files:**
- Test: `srv/app/profile-vue/tests/unit/useViewportMode.spec.ts`
- Test: `srv/app/profile-vue/tests/unit/useClipboard.spec.ts`
- Create: `srv/app/profile-vue/src/composables/useViewportMode.ts`
- Create: `srv/app/profile-vue/src/composables/useClipboard.ts`

- [ ] **Step 1: Write the failing tests**

`tests/unit/useViewportMode.spec.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useViewportMode } from '@/composables/useViewportMode'

function mockMatchMedia(matches: boolean) {
  let listener: ((e: MediaQueryListEvent) => void) | null = null
  const mql = {
    matches,
    media: '(max-width: 768px)',
    addEventListener: vi.fn((_evt: string, fn: typeof listener) => { listener = fn }),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn()
  }
  vi.stubGlobal('matchMedia', vi.fn(() => mql))
  return {
    fire: (newMatches: boolean) => listener?.({ matches: newMatches } as MediaQueryListEvent)
  }
}

describe('useViewportMode', () => {
  beforeEach(() => vi.unstubAllGlobals())

  it('returns "mobile" when (max-width: 768px) matches', () => {
    mockMatchMedia(true)
    const { mode } = useViewportMode()
    expect(mode.value).toBe('mobile')
  })

  it('returns "desktop" when it does not match', () => {
    mockMatchMedia(false)
    const { mode } = useViewportMode()
    expect(mode.value).toBe('desktop')
  })

  it('reacts to media query change events', () => {
    const ctl = mockMatchMedia(false)
    const { mode } = useViewportMode()
    expect(mode.value).toBe('desktop')
    ctl.fire(true)
    expect(mode.value).toBe('mobile')
  })
})
```

`tests/unit/useClipboard.spec.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { copyToClipboard } from '@/composables/useClipboard'

describe('copyToClipboard', () => {
  beforeEach(() => vi.unstubAllGlobals())

  it('uses navigator.clipboard when available', async () => {
    const writeText = vi.fn().mockResolvedValueOnce(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const result = await copyToClipboard('hello')
    expect(writeText).toHaveBeenCalledWith('hello')
    expect(result).toBe('copied')
  })

  it('falls back to "fallback" when clipboard is unavailable', async () => {
    vi.stubGlobal('navigator', {})
    const result = await copyToClipboard('hello')
    expect(result).toBe('fallback')
  })

  it('falls back to "fallback" when clipboard.writeText rejects', async () => {
    const writeText = vi.fn().mockRejectedValueOnce(new Error('blocked'))
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const result = await copyToClipboard('hello')
    expect(result).toBe('fallback')
  })
})
```

- [ ] **Step 2: Run — both fail**

```bash
cd srv/app/profile-vue
npm test -- useViewportMode useClipboard
```
Expected: both modules not found.

- [ ] **Step 3: Implement `useViewportMode.ts`**

```ts
import { ref, onMounted, onBeforeUnmount } from 'vue'

export type ViewportMode = 'mobile' | 'desktop'

const MOBILE_QUERY = '(max-width: 768px)'

export function useViewportMode() {
  const mode = ref<ViewportMode>(
    typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
      ? 'mobile'
      : 'desktop'
  )

  let mql: MediaQueryList | null = null
  const onChange = (e: MediaQueryListEvent) => {
    mode.value = e.matches ? 'mobile' : 'desktop'
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    mql = window.matchMedia(MOBILE_QUERY)
    mql.addEventListener('change', onChange)
  })

  onBeforeUnmount(() => {
    mql?.removeEventListener('change', onChange)
    mql = null
  })

  // Trigger immediate evaluation outside lifecycle hooks for SSR/test contexts
  if (typeof window !== 'undefined' && !mql) {
    const initial = window.matchMedia(MOBILE_QUERY)
    initial.addEventListener('change', onChange)
    mql = initial
  }

  return { mode }
}
```

- [ ] **Step 4: Implement `useClipboard.ts`**

```ts
export type CopyResult = 'copied' | 'fallback'

/**
 * Copies text to the system clipboard.
 * Returns 'copied' if the modern API succeeded, 'fallback' if the caller
 * should display a "select-and-copy-manually" hint instead.
 */
export async function copyToClipboard(text: string): Promise<CopyResult> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    return 'fallback'
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'fallback'
  }
}
```

- [ ] **Step 5: Run — should pass**

```bash
npm test -- useViewportMode useClipboard
```
Expected: 6 tests **pass**.

- [ ] **Step 6: Commit**

```bash
cd ../../..
git add srv/app/profile-vue/src/composables/useViewportMode.ts \
        srv/app/profile-vue/src/composables/useClipboard.ts \
        srv/app/profile-vue/tests/unit/useViewportMode.spec.ts \
        srv/app/profile-vue/tests/unit/useClipboard.spec.ts
git commit -m "feat(profile-vue): viewport-mode and clipboard composables"
```

---

## Task 11: `ScnIdInput.vue` and `ProfileDetails.vue`

**Files:**
- Create: `srv/app/profile-vue/src/components/ScnIdInput.vue`
- Create: `srv/app/profile-vue/src/components/ProfileDetails.vue`
- Test: `srv/app/profile-vue/tests/unit/components/ScnIdInput.spec.ts`
- Test: `srv/app/profile-vue/tests/unit/components/ProfileDetails.spec.ts`

> Component tests use `@vue/test-utils` shallow-mount style: don't try to render full UI5 Web Components in jsdom (their shadow DOM is fragile). Instead, assert on the component's own emitted events and prop forwarding. Mark UI5 elements as known custom elements via the global config in `tests/setup.ts`.

- [ ] **Step 1: Update `tests/setup.ts` to suppress unknown-element warnings**

```ts
import { config } from '@vue/test-utils'

// Treat ui5-* tags as known custom elements so Vue doesn't warn during tests.
config.global.config.compilerOptions = {
  isCustomElement: (tag: string) => tag.startsWith('ui5-')
}
```

- [ ] **Step 2: Write the failing test for `ScnIdInput`**

`tests/unit/components/ScnIdInput.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import ScnIdInput from '@/components/ScnIdInput.vue'
import { useProfileStore } from '@/store/profile'

const i18nStub = { install: () => {}, global: { t: (k: string) => k } }

function makeWrapper(initial?: string) {
  return mount(ScnIdInput, {
    props: { modelValue: initial ?? '' },
    global: {
      plugins: [createTestingPinia({ stubActions: false }), i18nStub as never],
      mocks: { $t: (k: string) => k }
    }
  })
}

describe('ScnIdInput', () => {
  it('emits "load" with the current value when load button is clicked', async () => {
    const wrapper = makeWrapper('alice')
    await wrapper.find('[data-testid=load-btn]').trigger('click')
    expect(wrapper.emitted('load')?.[0]).toEqual(['alice'])
  })

  it('does not emit "load" when value is empty', async () => {
    const wrapper = makeWrapper('')
    await wrapper.find('[data-testid=load-btn]').trigger('click')
    expect(wrapper.emitted('load')).toBeUndefined()
  })

  it('shows an avatar slot when profile is loaded', async () => {
    const wrapper = makeWrapper('alice')
    const store = useProfileStore()
    store.profile = {
      avatar: { profile: 'http://x/y.png' },
      first_name: 'Alice', last_name: 'Doe',
      rank: { name: 'Active Contributor' }
    } as never
    await wrapper.vm.$nextTick()
    expect(wrapper.html()).toContain('Alice')
    expect(wrapper.html()).toContain('Active Contributor')
  })
})
```

- [ ] **Step 3: Implement `ScnIdInput.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/store/profile'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'load', scnId: string): void
}>()

const store = useProfileStore()
const { profile } = storeToRefs(store)

const fullName = computed(() => {
  const fn = profile.value?.first_name ?? ''
  const ln = profile.value?.last_name ?? ''
  return [fn, ln].filter(Boolean).join(' ')
})

function onChange(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

function onLoad() {
  const v = props.modelValue.trim()
  if (!v) return
  emit('load', v)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Enter') onLoad()
}
</script>

<template>
  <section class="scn-id-input">
    <ui5-label for="scnIdField" required="">{{ $t('profile.scnId') }}</ui5-label>
    <ui5-input
      id="scnIdField"
      :value="modelValue"
      @input="onChange"
      @keydown="onKey"
      data-testid="scn-id-field"
    />
    <ui5-button
      design="Emphasized"
      data-testid="load-btn"
      @click="onLoad"
    >{{ $t('profile.Toolbar1') }}</ui5-button>
    <div v-if="profile" class="user-chip">
      <ui5-avatar
        v-if="profile.avatar?.profile"
        :image="profile.avatar.profile"
        size="S"
        shape="Circle"
      />
      <div class="user-chip__text">
        <strong>{{ fullName || profile.login }}</strong>
        <span v-if="profile.rank?.name">{{ profile.rank.name }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.scn-id-input {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.user-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}
.user-chip__text {
  display: flex;
  flex-direction: column;
  font-size: 0.875rem;
}
.user-chip__text span {
  color: var(--sapNeutralTextColor);
}
</style>
```

- [ ] **Step 4: Run ScnIdInput test**

```bash
cd srv/app/profile-vue
npm test -- ScnIdInput
```
Expected: 3 tests pass.

- [ ] **Step 5: Write the failing test for `ProfileDetails`**

`tests/unit/components/ProfileDetails.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import ProfileDetails from '@/components/ProfileDetails.vue'
import { useProfileStore } from '@/store/profile'

function makeWrapper() {
  return mount(ProfileDetails, {
    global: {
      plugins: [createTestingPinia({ stubActions: false })],
      mocks: { $t: (k: string) => k }
    }
  })
}

describe('ProfileDetails', () => {
  it('renders nothing when no profile is loaded', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toBe('')
  })

  it('renders login, name, rank, and profile URL when loaded', async () => {
    const wrapper = makeWrapper()
    const store = useProfileStore()
    store.profile = {
      login: 'alice', first_name: 'Alice', last_name: 'Doe',
      view_href: 'https://community.sap.com/u/alice',
      rank: { name: 'Active Contributor' }
    } as never
    await wrapper.vm.$nextTick()
    const html = wrapper.html()
    expect(html).toContain('alice')
    expect(html).toContain('Alice')
    expect(html).toContain('Doe')
    expect(html).toContain('Active Contributor')
    expect(html).toContain('https://community.sap.com/u/alice')
  })
})
```

- [ ] **Step 6: Implement `ProfileDetails.vue`**

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/store/profile'

const { profile } = storeToRefs(useProfileStore())
</script>

<template>
  <section v-if="profile" class="profile-details">
    <dl>
      <dt>{{ $t('profile.login') }}</dt><dd>{{ profile.login }}</dd>
      <dt>{{ $t('profile.fname') }}</dt><dd>{{ profile.first_name }}</dd>
      <dt>{{ $t('profile.lname') }}</dt><dd>{{ profile.last_name }}</dd>
      <dt>{{ $t('profile.rank') }}</dt><dd>{{ profile.rank?.name }}</dd>
      <dt>{{ $t('profile.url') }}</dt>
      <dd>
        <ui5-link
          v-if="profile.view_href"
          :href="profile.view_href"
          target="_blank"
        >{{ profile.view_href }}</ui5-link>
      </dd>
    </dl>
  </section>
</template>

<style scoped>
.profile-details {
  margin-top: 1rem;
}
.profile-details dl {
  display: grid;
  grid-template-columns: max-content 1fr;
  column-gap: 1rem;
  row-gap: 0.5rem;
  margin: 0;
}
.profile-details dt {
  font-weight: 600;
  color: var(--sapNeutralTextColor);
}
.profile-details dd {
  margin: 0;
}
</style>
```

- [ ] **Step 7: Run all component tests**

```bash
npm test -- components
```
Expected: 5 tests pass total.

- [ ] **Step 8: Commit**

```bash
cd ../../..
git add srv/app/profile-vue/src/components/ScnIdInput.vue \
        srv/app/profile-vue/src/components/ProfileDetails.vue \
        srv/app/profile-vue/tests/unit/components/ScnIdInput.spec.ts \
        srv/app/profile-vue/tests/unit/components/ProfileDetails.spec.ts \
        srv/app/profile-vue/tests/setup.ts
git commit -m "feat(profile-vue): ScnIdInput + ProfileDetails components"
```

---

## Task 12: `SelectedBadgesEditor.vue` — vertical 5-slot DnD list

**Files:**
- Create: `srv/app/profile-vue/src/components/SelectedBadgesEditor.vue`
- Test: `srv/app/profile-vue/tests/unit/components/SelectedBadgesEditor.spec.ts`

> Behavior:
> - Always renders 5 rows (filled + dashed-outline placeholders for empty).
> - Drag handle reorders. Reorder fires `store.reorderSelectedBadges(from, to)`.
> - Remove (✕) button deselects via `store.toggleBadge(id)`.
> - Keyboard: focus a row, press `Alt+ArrowUp` / `Alt+ArrowDown` to reorder.

- [ ] **Step 1: Write the failing test**

`tests/unit/components/SelectedBadgesEditor.spec.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import SelectedBadgesEditor from '@/components/SelectedBadgesEditor.vue'
import { useProfileStore } from '@/store/profile'

function makeWrapper() {
  return mount(SelectedBadgesEditor, {
    global: {
      plugins: [createTestingPinia({ stubActions: false })],
      mocks: { $t: (k: string) => k }
    }
  })
}

describe('SelectedBadgesEditor', () => {
  it('always renders 5 slot rows', () => {
    const wrapper = makeWrapper()
    expect(wrapper.findAll('[data-testid=slot-row]')).toHaveLength(5)
  })

  it('renders empty placeholders when no badges are selected', () => {
    const wrapper = makeWrapper()
    expect(wrapper.findAll('[data-testid=slot-empty]')).toHaveLength(5)
  })

  it('renders icon + title for filled slots', async () => {
    const wrapper = makeWrapper()
    const store = useProfileStore()
    store.profile = {
      user_badges: { items: [
        { earned_date: '', badge: { id: 'cap', title: 'CAP Champion', icon_url: 'http://x/cap.png' } }
      ] }
    } as never
    store.selectedBadgeIds[0] = 'cap'
    await wrapper.vm.$nextTick()
    const html = wrapper.html()
    expect(html).toContain('CAP Champion')
    expect(html).toContain('http://x/cap.png')
  })

  it('clicking remove calls store.toggleBadge with the id', async () => {
    const wrapper = makeWrapper()
    const store = useProfileStore()
    store.profile = {
      user_badges: { items: [
        { earned_date: '', badge: { id: 'cap', title: 'CAP', icon_url: '' } }
      ] }
    } as never
    store.selectedBadgeIds[0] = 'cap'
    const spy = vi.spyOn(store, 'toggleBadge')
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-testid=remove-btn-0]').trigger('click')
    expect(spy).toHaveBeenCalledWith('cap')
  })

  it('Alt+ArrowDown on a row calls reorder(from, from+1)', async () => {
    const wrapper = makeWrapper()
    const store = useProfileStore()
    store.profile = {
      user_badges: { items: [
        { earned_date: '', badge: { id: 'a', title: 'A', icon_url: '' } },
        { earned_date: '', badge: { id: 'b', title: 'B', icon_url: '' } }
      ] }
    } as never
    store.selectedBadgeIds[0] = 'a'
    store.selectedBadgeIds[1] = 'b'
    const spy = vi.spyOn(store, 'reorderSelectedBadges')
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-testid=slot-row-0]')
      .trigger('keydown', { key: 'ArrowDown', altKey: true })
    expect(spy).toHaveBeenCalledWith(0, 1)
  })
})
```

- [ ] **Step 2: Implement**

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/store/profile'

const store = useProfileStore()
const { selectedBadges } = storeToRefs(store)

let dragIndex = -1

function onDragStart(idx: number, e: DragEvent) {
  dragIndex = idx
  e.dataTransfer?.setData('text/plain', String(idx))
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
}

function onDrop(idx: number, e: DragEvent) {
  e.preventDefault()
  if (dragIndex === -1 || dragIndex === idx) return
  store.reorderSelectedBadges(dragIndex, idx)
  dragIndex = -1
}

function onKey(idx: number, e: KeyboardEvent) {
  if (!e.altKey) return
  if (e.key === 'ArrowUp' && idx > 0) {
    e.preventDefault()
    store.reorderSelectedBadges(idx, idx - 1)
  } else if (e.key === 'ArrowDown' && idx < 4) {
    e.preventDefault()
    store.reorderSelectedBadges(idx, idx + 1)
  }
}

function onRemove(id: string | '') {
  if (id === '') return
  store.toggleBadge(id)
}
</script>

<template>
  <section class="selected-badges">
    <h3>{{ $t('profile.selBadges') }}</h3>
    <ul role="list" class="selected-badges__list">
      <li
        v-for="(slot, idx) in selectedBadges"
        :key="idx"
        role="listitem"
        :data-testid="`slot-row-${idx}`"
        :class="['slot', { 'slot--empty': slot.id === '' }]"
        :tabindex="0"
        :draggable="slot.id !== ''"
        @dragstart="(e) => onDragStart(idx, e)"
        @dragover="onDragOver"
        @drop="(e) => onDrop(idx, e)"
        @keydown="(e) => onKey(idx, e)"
        data-testid="slot-row"
      >
        <span class="slot__handle" aria-hidden="true">⠿</span>
        <span class="slot__index">{{ idx + 1 }}.</span>
        <template v-if="slot.id !== ''">
          <img v-if="slot.iconUrl" :src="slot.iconUrl" :alt="slot.title" class="slot__icon" />
          <span class="slot__title">{{ slot.title }}</span>
          <ui5-button
            icon="decline"
            design="Transparent"
            :tooltip="$t('embed.copy')"
            :data-testid="`remove-btn-${idx}`"
            :aria-label="`Remove ${slot.title}`"
            @click="onRemove(slot.id)"
          />
        </template>
        <template v-else>
          <span data-testid="slot-empty" class="slot__empty">—</span>
        </template>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.selected-badges__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.slot {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid var(--sapList_BorderColor, #e5e5e5);
  border-radius: 0.25rem;
  background: var(--sapList_Background, #fff);
}
.slot--empty {
  border-style: dashed;
  background: transparent;
  color: var(--sapNeutralTextColor);
}
.slot__handle {
  cursor: grab;
  color: var(--sapNeutralTextColor);
}
.slot__index {
  width: 1.25rem;
  font-variant-numeric: tabular-nums;
}
.slot__icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
}
.slot__title { flex: 1; }
.slot:focus-visible {
  outline: 2px solid var(--sapContent_FocusColor);
}
</style>
```

- [ ] **Step 3: Run tests and commit**

```bash
cd srv/app/profile-vue
npm test -- SelectedBadgesEditor
```
Expected: 5 tests pass.

```bash
cd ../../..
git add srv/app/profile-vue/src/components/SelectedBadgesEditor.vue \
        srv/app/profile-vue/tests/unit/components/SelectedBadgesEditor.spec.ts
git commit -m "feat(profile-vue): SelectedBadgesEditor with drag + keyboard reorder"
```

---

## Task 13: `BadgeTable.vue`, `BadgeGrid.vue`, `BadgeBrowser.vue`

**Files:**
- Create: `srv/app/profile-vue/src/components/BadgeTable.vue`
- Create: `srv/app/profile-vue/src/components/BadgeGrid.vue`
- Create: `srv/app/profile-vue/src/components/BadgeBrowser.vue`
- Test: `srv/app/profile-vue/tests/unit/components/BadgeBrowser.spec.ts`

- [ ] **Step 1: Write the failing test for `BadgeBrowser`**

`tests/unit/components/BadgeBrowser.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import BadgeBrowser from '@/components/BadgeBrowser.vue'
import { useProfileStore } from '@/store/profile'

function makeWrapper() {
  return mount(BadgeBrowser, {
    global: {
      plugins: [createTestingPinia({ stubActions: false })],
      mocks: { $t: (k: string) => k }
    }
  })
}

describe('BadgeBrowser', () => {
  it('shows view toggle buttons', () => {
    const wrapper = makeWrapper()
    expect(wrapper.find('[data-testid=view-toggle-table]').exists()).toBe(true)
    expect(wrapper.find('[data-testid=view-toggle-grid]').exists()).toBe(true)
  })

  it('renders BadgeTable when viewMode is "table"', async () => {
    const wrapper = makeWrapper()
    const store = useProfileStore()
    store.viewMode = 'table'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid=badge-table]').exists()).toBe(true)
    expect(wrapper.find('[data-testid=badge-grid]').exists()).toBe(false)
  })

  it('renders BadgeGrid when viewMode is "grid"', async () => {
    const wrapper = makeWrapper()
    const store = useProfileStore()
    store.viewMode = 'grid'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid=badge-grid]').exists()).toBe(true)
    expect(wrapper.find('[data-testid=badge-table]').exists()).toBe(false)
  })
})
```

- [ ] **Step 2: Implement `BadgeTable.vue`**

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/store/profile'

const store = useProfileStore()
const { allBadges } = storeToRefs(store)

const filter = ref('')
const sortBy = ref<'title' | 'earned' | 'awarded'>('earned')
const sortDir = ref<'asc' | 'desc'>('desc')

const filtered = computed(() => {
  const q = filter.value.trim().toLowerCase()
  let list = q
    ? allBadges.value.filter((b) =>
        (b.badge.title ?? '').toLowerCase().includes(q) ||
        b.badge.id.toLowerCase().includes(q))
    : allBadges.value.slice()
  list.sort((a, b) => {
    let cmp = 0
    if (sortBy.value === 'title') {
      cmp = (a.badge.title ?? '').localeCompare(b.badge.title ?? '')
    } else if (sortBy.value === 'awarded') {
      cmp = (a.badge.awarded ?? 0) - (b.badge.awarded ?? 0)
    } else {
      cmp = (Date.parse(a.earned_date ?? '') || 0) - (Date.parse(b.earned_date ?? '') || 0)
    }
    return sortDir.value === 'asc' ? cmp : -cmp
  })
  return list
})

function toggleSort(col: typeof sortBy.value) {
  if (sortBy.value === col) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortBy.value = col; sortDir.value = 'desc' }
}

function fmtDate(d?: string) {
  if (!d) return ''
  const t = Date.parse(d)
  return isNaN(t) ? d : new Date(t).toLocaleDateString()
}

function handleImgError(e: Event) {
  ;(e.target as HTMLImageElement).src = '/profile/badge-placeholder.svg'
}
</script>

<template>
  <div class="badge-table" data-testid="badge-table">
    <ui5-input
      :value="filter"
      :placeholder="$t('profile.badgeTitle')"
      @input="(e: Event) => (filter = (e.target as HTMLInputElement).value)"
      data-testid="badge-table-filter"
    />
    <table class="grid">
      <thead>
        <tr>
          <th>{{ $t('profile.select') }}</th>
          <th>{{ $t('profile.badgeId') }}</th>
          <th class="sortable" @click="toggleSort('title')">{{ $t('profile.badgeTitle') }}</th>
          <th>{{ $t('profile.badgeImage') }}</th>
          <th class="sortable" @click="toggleSort('earned')">{{ $t('profile.dateEarned') }}</th>
          <th class="sortable" @click="toggleSort('awarded')">{{ $t('profile.awarded') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in filtered" :key="row.badge.id">
          <td>
            <ui5-checkbox
              :checked="row.selected || undefined"
              @change="store.toggleBadge(row.badge.id)"
              :data-testid="`badge-cb-${row.badge.id}`"
            />
          </td>
          <td>{{ row.badge.id }}</td>
          <td>{{ row.badge.title }}</td>
          <td>
            <img
              v-if="row.badge.icon_url"
              :src="row.badge.icon_url"
              :alt="row.badge.title"
              width="48" height="48"
              @error="handleImgError"
            />
          </td>
          <td>{{ fmtDate(row.earned_date) }}</td>
          <td>{{ row.badge.awarded }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.badge-table { display: flex; flex-direction: column; gap: 0.5rem; }
.grid {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.grid th, .grid td {
  text-align: left;
  padding: 0.5rem;
  border-bottom: 1px solid var(--sapList_BorderColor, #e5e5e5);
  vertical-align: middle;
}
.grid th { font-weight: 600; color: var(--sapNeutralTextColor); }
.sortable { cursor: pointer; user-select: none; }
.sortable:hover { color: var(--sapLinkColor); }
</style>
```

- [ ] **Step 3: Implement `BadgeGrid.vue`**

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/store/profile'

const store = useProfileStore()
const { allBadges } = storeToRefs(store)

function handleImgError(e: Event) {
  ;(e.target as HTMLImageElement).src = '/profile/badge-placeholder.svg'
}
</script>

<template>
  <div class="badge-grid" data-testid="badge-grid">
    <button
      v-for="row in allBadges"
      :key="row.badge.id"
      type="button"
      class="badge-card"
      :class="{ 'badge-card--selected': row.selected }"
      :aria-pressed="row.selected"
      @click="store.toggleBadge(row.badge.id)"
    >
      <img
        v-if="row.badge.icon_url"
        :src="row.badge.icon_url"
        :alt="row.badge.title"
        @error="handleImgError"
      />
      <span class="badge-card__title">{{ row.badge.title }}</span>
    </button>
  </div>
</template>

<style scoped>
.badge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.5rem;
}
.badge-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid var(--sapList_BorderColor, #e5e5e5);
  border-radius: 0.5rem;
  background: var(--sapList_Background, #fff);
  cursor: pointer;
  font-family: inherit;
  font-size: 0.8125rem;
  text-align: center;
}
.badge-card--selected {
  border-color: var(--sapButton_Selected_BorderColor, #0a6ed1);
  background: var(--sapList_SelectionBackgroundColor, #ebf5fe);
}
.badge-card img { width: 64px; height: 64px; object-fit: contain; }
.badge-card__title { color: var(--sapTextColor); }
</style>
```

- [ ] **Step 4: Implement `BadgeBrowser.vue`**

```vue
<script setup lang="ts">
import { useProfileStore } from '@/store/profile'
import BadgeTable from './BadgeTable.vue'
import BadgeGrid from './BadgeGrid.vue'

const store = useProfileStore()
</script>

<template>
  <section class="badge-browser">
    <header class="badge-browser__head">
      <h3>{{ $t('profile.badges') }}</h3>
      <div class="badge-browser__toggle" role="group" :aria-label="$t('view.table')">
        <ui5-button
          :design="store.viewMode === 'table' ? 'Emphasized' : 'Default'"
          icon="table-view"
          @click="store.setViewMode('table')"
          data-testid="view-toggle-table"
        >{{ $t('view.table') }}</ui5-button>
        <ui5-button
          :design="store.viewMode === 'grid' ? 'Emphasized' : 'Default'"
          icon="grid-view"
          @click="store.setViewMode('grid')"
          data-testid="view-toggle-grid"
        >{{ $t('view.grid') }}</ui5-button>
      </div>
    </header>
    <BadgeTable v-if="store.viewMode === 'table'" />
    <BadgeGrid v-else />
  </section>
</template>

<style scoped>
.badge-browser__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}
.badge-browser__toggle {
  display: flex;
  gap: 0.25rem;
}
</style>
```

- [ ] **Step 5: Run tests and commit**

```bash
cd srv/app/profile-vue
npm test -- BadgeBrowser
```
Expected: 3 tests pass.

```bash
cd ../../..
git add srv/app/profile-vue/src/components/BadgeTable.vue \
        srv/app/profile-vue/src/components/BadgeGrid.vue \
        srv/app/profile-vue/src/components/BadgeBrowser.vue \
        srv/app/profile-vue/tests/unit/components/BadgeBrowser.spec.ts
git commit -m "feat(profile-vue): BadgeTable, BadgeGrid, BadgeBrowser with view toggle"
```

---

## Task 14: `SignatureRail.vue` — sticky right rail with HTML/MD/URL tabs

**Files:**
- Create: `srv/app/profile-vue/src/components/SignatureRail.vue`
- Test: `srv/app/profile-vue/tests/unit/components/SignatureRail.spec.ts`

> Behavior:
> - Shows two `<img>` previews (full + light) bound to `store.signatureUrl` and `store.signatureLightUrl`.
> - `<ui5-tabcontainer>` with three tabs: HTML, Markdown, URL only. Each tab's body shows the relevant string and a "Copy" button.
> - "Copy" calls `useClipboard.copyToClipboard` and shows a `<ui5-toast>` with the appropriate i18n message.
> - "Big preview" link navigates to `store.signatureBigUrl` (target="_blank").

- [ ] **Step 1: Write the failing test**

`tests/unit/components/SignatureRail.spec.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import SignatureRail from '@/components/SignatureRail.vue'
import { useProfileStore } from '@/store/profile'

vi.mock('@/composables/useClipboard', () => ({
  copyToClipboard: vi.fn().mockResolvedValue('copied')
}))
import { copyToClipboard } from '@/composables/useClipboard'

function makeWrapper() {
  return mount(SignatureRail, {
    global: {
      plugins: [createTestingPinia({ stubActions: false })],
      mocks: { $t: (k: string) => k }
    }
  })
}

describe('SignatureRail', () => {
  it('binds preview <img> src to store.signatureUrl', async () => {
    const wrapper = makeWrapper()
    const store = useProfileStore()
    store.scnId = 'alice'
    store.selectedBadgeIds[0] = 'cap'
    await wrapper.vm.$nextTick()
    const img = wrapper.find('[data-testid=preview-full]').attributes('src')
    expect(img).toBe('/showcaseBadgesGroups/alice/cap')
  })

  it('renders the HTML embed snippet in the active tab body', async () => {
    const wrapper = makeWrapper()
    const store = useProfileStore()
    store.profile = { view_href: 'http://x' } as never
    store.scnId = 'alice'
    store.selectedBadgeIds[0] = 'cap'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid=embed-html-text]').element.textContent)
      .toContain('<a href="http://x" target="_blank">')
  })

  it('clicking copy invokes copyToClipboard with the active tab\'s text', async () => {
    const wrapper = makeWrapper()
    const store = useProfileStore()
    store.profile = { view_href: 'http://x' } as never
    store.scnId = 'alice'
    store.selectedBadgeIds[0] = 'cap'
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-testid=copy-html]').trigger('click')
    expect(copyToClipboard).toHaveBeenCalledWith(store.embedHtml)
  })
})
```

- [ ] **Step 2: Implement**

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/store/profile'
import { copyToClipboard } from '@/composables/useClipboard'

const store = useProfileStore()
const {
  signatureUrl, signatureLightUrl, signatureBigUrl,
  embedHtml, embedMarkdown, profile, scnId
} = storeToRefs(store)

const activeTab = ref<'html' | 'markdown' | 'url'>('html')
const toastMsg = ref('')
const toastShown = ref(false)

const fullEmbedUrl = computed(() => `${window.location.origin}${signatureUrl.value}`)

const activeText = computed(() => {
  if (activeTab.value === 'markdown') return embedMarkdown.value
  if (activeTab.value === 'url') return fullEmbedUrl.value
  return embedHtml.value
})

async function onCopy() {
  const result = await copyToClipboard(activeText.value)
  toastMsg.value = result === 'copied' ? 'embed.copied' : 'embed.copyFallback'
  toastShown.value = true
  setTimeout(() => (toastShown.value = false), 2500)
}

function handleImgError(e: Event) {
  ;(e.target as HTMLImageElement).src = '/profile/badge-placeholder.svg'
}
</script>

<template>
  <aside class="sig-rail" :aria-label="$t('profile.Toolbar2')">
    <h3>{{ $t('profile.Toolbar2') }}</h3>

    <div class="sig-rail__preview">
      <span class="label">{{ $t('profile.signaturePreview') }}</span>
      <img
        v-if="scnId"
        :src="signatureUrl"
        :alt="$t('signature.alt', { scnId })"
        @error="handleImgError"
        data-testid="preview-full"
      />
    </div>

    <div class="sig-rail__preview">
      <span class="label">{{ $t('profile.signature2Preview') }}</span>
      <img
        v-if="scnId"
        :src="signatureLightUrl"
        :alt="$t('signature.alt', { scnId })"
        @error="handleImgError"
        data-testid="preview-light"
      />
    </div>

    <div class="sig-rail__tabs" role="tablist">
      <button
        :class="['tab', { active: activeTab === 'html' }]"
        @click="activeTab = 'html'"
        :aria-selected="activeTab === 'html'"
      >{{ $t('embed.html') }}</button>
      <button
        :class="['tab', { active: activeTab === 'markdown' }]"
        @click="activeTab = 'markdown'"
        :aria-selected="activeTab === 'markdown'"
      >{{ $t('embed.markdown') }}</button>
      <button
        :class="['tab', { active: activeTab === 'url' }]"
        @click="activeTab = 'url'"
        :aria-selected="activeTab === 'url'"
      >{{ $t('embed.url') }}</button>
    </div>

    <pre v-if="activeTab === 'html'" data-testid="embed-html-text">{{ embedHtml }}</pre>
    <pre v-else-if="activeTab === 'markdown'" data-testid="embed-md-text">{{ embedMarkdown }}</pre>
    <pre v-else data-testid="embed-url-text">{{ fullEmbedUrl }}</pre>

    <div class="sig-rail__actions">
      <ui5-button
        design="Emphasized"
        icon="copy"
        @click="onCopy"
        :data-testid="`copy-${activeTab}`"
      >{{ $t('embed.copy') }}</ui5-button>
      <ui5-link
        v-if="scnId"
        :href="signatureBigUrl"
        target="_blank"
      >big preview ↗</ui5-link>
    </div>

    <ui5-toast
      v-if="toastShown"
      placement="BottomCenter"
      duration="2500"
      open
    >{{ $t(toastMsg) }}</ui5-toast>
  </aside>
</template>

<style scoped>
.sig-rail {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--sapList_Background, #fff);
  border: 1px solid var(--sapList_BorderColor, #e5e5e5);
  border-radius: 0.5rem;
}
.sig-rail__preview img {
  display: block;
  max-width: 100%;
  margin-top: 0.25rem;
}
.label {
  font-size: 0.75rem;
  color: var(--sapNeutralTextColor);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.sig-rail__tabs {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.5rem;
}
.tab {
  flex: 1;
  padding: 0.375rem 0.5rem;
  border: 1px solid var(--sapList_BorderColor, #e5e5e5);
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.8125rem;
  border-radius: 0.25rem;
}
.tab.active {
  background: var(--sapButton_Selected_Background, #ebf5fe);
  border-color: var(--sapButton_Selected_BorderColor, #0a6ed1);
  color: var(--sapButton_Selected_TextColor, #0854a0);
}
pre {
  margin: 0;
  padding: 0.5rem;
  background: var(--sapField_Background, #f5f6f7);
  border: 1px solid var(--sapField_BorderColor, #d5d7d9);
  border-radius: 0.25rem;
  font-family: var(--sapFontMonoFamily, ui-monospace, monospace);
  font-size: 0.75rem;
  white-space: pre-wrap;
  word-break: break-all;
}
.sig-rail__actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
</style>
```

- [ ] **Step 3: Run tests and commit**

```bash
cd srv/app/profile-vue
npm test -- SignatureRail
```
Expected: 3 tests pass.

```bash
cd ../../..
git add srv/app/profile-vue/src/components/SignatureRail.vue \
        srv/app/profile-vue/tests/unit/components/SignatureRail.spec.ts
git commit -m "feat(profile-vue): SignatureRail with HTML/Markdown/URL tabs"
```

---

## Task 15: `MobileSignatureBar.vue` and `ErrorBanner.vue`

**Files:**
- Create: `srv/app/profile-vue/src/components/MobileSignatureBar.vue`
- Create: `srv/app/profile-vue/src/components/ErrorBanner.vue`
- Test: `srv/app/profile-vue/tests/unit/components/ErrorBanner.spec.ts`

- [ ] **Step 1: Write the failing test**

`tests/unit/components/ErrorBanner.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import ErrorBanner from '@/components/ErrorBanner.vue'
import { useProfileStore } from '@/store/profile'

function makeWrapper() {
  return mount(ErrorBanner, {
    global: {
      plugins: [createTestingPinia({ stubActions: false })],
      mocks: { $t: (k: string) => k }
    }
  })
}

describe('ErrorBanner', () => {
  it('renders nothing when error is null', () => {
    const wrapper = makeWrapper()
    expect(wrapper.find('[data-testid=error-banner]').exists()).toBe(false)
  })

  it('renders banner with notFound message when error.code is notFound', async () => {
    const wrapper = makeWrapper()
    const store = useProfileStore()
    store.error = { code: 'notFound', message: 'X' }
    store.scnId = 'ghost'
    await wrapper.vm.$nextTick()
    const banner = wrapper.find('[data-testid=error-banner]')
    expect(banner.exists()).toBe(true)
    expect(banner.text()).toContain('error.notFound')
  })

  it('emits "retry" when retry button is clicked', async () => {
    const wrapper = makeWrapper()
    const store = useProfileStore()
    store.error = { code: 'network', message: 'X' }
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-testid=error-retry]').trigger('click')
    expect(wrapper.emitted('retry')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Implement `ErrorBanner.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/store/profile'

const emit = defineEmits<{ (e: 'retry'): void }>()

const { error, scnId } = storeToRefs(useProfileStore())

const i18nKey = computed(() => {
  if (!error.value) return ''
  return `error.${error.value.code}`
})
</script>

<template>
  <ui5-message-strip
    v-if="error"
    design="Negative"
    data-testid="error-banner"
    :hide-close-button="true"
  >
    {{ $t(i18nKey, { scnId }) }}
    <ui5-button
      slot="action"
      design="Transparent"
      @click="emit('retry')"
      data-testid="error-retry"
    >{{ $t('error.retry') }}</ui5-button>
  </ui5-message-strip>
</template>
```

- [ ] **Step 3: Implement `MobileSignatureBar.vue`**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/store/profile'
import SignatureRail from './SignatureRail.vue'

const open = ref(false)
const { signatureUrl, scnId } = storeToRefs(useProfileStore())

function handleImgError(e: Event) {
  ;(e.target as HTMLImageElement).src = '/profile/badge-placeholder.svg'
}
</script>

<template>
  <div class="mobile-bar">
    <button
      class="mobile-bar__button"
      :aria-expanded="open"
      :aria-label="$t(open ? 'mobile.collapse' : 'mobile.expand')"
      @click="open = !open"
      data-testid="mobile-bar-toggle"
    >
      <img
        v-if="scnId"
        :src="signatureUrl"
        :alt="$t('signature.alt', { scnId })"
        @error="handleImgError"
        class="mobile-bar__thumb"
      />
      <span>{{ $t('mobile.preview') }}</span>
    </button>
    <ui5-dialog
      :open="open || undefined"
      :header-text="$t('profile.Toolbar2')"
      stretch
      @close="open = false"
    >
      <SignatureRail />
      <ui5-button
        slot="footer"
        design="Emphasized"
        @click="open = false"
      >{{ $t('mobile.collapse') }}</ui5-button>
    </ui5-dialog>
  </div>
</template>

<style scoped>
.mobile-bar {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--sapList_Background, #fff);
  border-top: 1px solid var(--sapList_BorderColor, #e5e5e5);
  padding: 0.5rem;
}
.mobile-bar__button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.875rem;
}
.mobile-bar__thumb {
  height: 32px;
  width: auto;
}
@media (prefers-reduced-motion: reduce) {
  .mobile-bar { transition: none; }
}
</style>
```

- [ ] **Step 4: Run tests and commit**

```bash
cd srv/app/profile-vue
npm test -- ErrorBanner
```
Expected: 3 tests pass.

```bash
cd ../../..
git add srv/app/profile-vue/src/components/ErrorBanner.vue \
        srv/app/profile-vue/src/components/MobileSignatureBar.vue \
        srv/app/profile-vue/tests/unit/components/ErrorBanner.spec.ts
git commit -m "feat(profile-vue): ErrorBanner and MobileSignatureBar"
```

---

## Task 16: `AppHeader.vue` — title, locale switcher, theme toggle

**Files:**
- Create: `srv/app/profile-vue/src/components/AppHeader.vue`
- Test: `srv/app/profile-vue/tests/unit/components/AppHeader.spec.ts`

- [ ] **Step 1: Write the failing test**

`tests/unit/components/AppHeader.spec.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AppHeader from '@/components/AppHeader.vue'

vi.mock('@/i18n', () => ({
  setLocale: vi.fn(),
  SUPPORTED_LOCALES: ['en', 'de', 'es', 'fr', 'hi', 'i-klingon', 'it', 'iw', 'ja', 'la', 'pl']
}))
import { setLocale, SUPPORTED_LOCALES } from '@/i18n'

describe('AppHeader', () => {
  it('renders all 11 supported locales', () => {
    const wrapper = mount(AppHeader, {
      global: {
        mocks: { $t: (k: string) => k, $i18n: { locale: 'en' } }
      }
    })
    const opts = wrapper.findAll('[data-testid=locale-option]')
    expect(opts).toHaveLength(SUPPORTED_LOCALES.length)
  })

  it('changing locale calls setLocale', async () => {
    const wrapper = mount(AppHeader, {
      global: {
        mocks: { $t: (k: string) => k, $i18n: { locale: 'en' } }
      }
    })
    const select = wrapper.find('[data-testid=locale-select]')
    await select.setValue('de')
    await select.trigger('change')
    expect(setLocale).toHaveBeenCalledWith('de')
  })
})
```

- [ ] **Step 2: Implement**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale, SUPPORTED_LOCALES, type SupportedLocale } from '@/i18n'
import { setTheme } from '@ui5/webcomponents-base/dist/config/Theme.js'

const { locale } = useI18n()

const theme = ref<'sap_horizon' | 'sap_horizon_dark'>(
  (typeof localStorage !== 'undefined' && localStorage.getItem('profileTheme') as never) ||
  (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'sap_horizon_dark' : 'sap_horizon')
)

function onLocaleChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value as SupportedLocale
  setLocale(v)
}

function toggleTheme() {
  theme.value = theme.value === 'sap_horizon' ? 'sap_horizon_dark' : 'sap_horizon'
  setTheme(theme.value)
  try { localStorage.setItem('profileTheme', theme.value) } catch { /* ignore */ }
}
</script>

<template>
  <header class="app-header">
    <h1>{{ $t('appTitle') }}</h1>
    <div class="app-header__controls">
      <select
        data-testid="locale-select"
        :value="locale"
        @change="onLocaleChange"
        :aria-label="'Locale'"
      >
        <option
          v-for="loc in SUPPORTED_LOCALES"
          :key="loc"
          :value="loc"
          data-testid="locale-option"
        >{{ loc }}</option>
      </select>
      <ui5-button
        design="Transparent"
        @click="toggleTheme"
        :aria-label="$t('theme.toggle')"
      >🌓</ui5-button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--sapList_BorderColor, #e5e5e5);
  background: var(--sapShellColor, #354a5f);
  color: var(--sapShell_TextColor, #fff);
}
.app-header h1 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}
.app-header__controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.app-header__controls select {
  background: transparent;
  color: inherit;
  border: 1px solid currentColor;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
}
</style>
```

- [ ] **Step 3: Run tests and commit**

```bash
cd srv/app/profile-vue
npm test -- AppHeader
```
Expected: 2 tests pass.

```bash
cd ../../..
git add srv/app/profile-vue/src/components/AppHeader.vue \
        srv/app/profile-vue/tests/unit/components/AppHeader.spec.ts
git commit -m "feat(profile-vue): AppHeader with locale + theme switchers"
```

---

## Task 17: Wire `ProfileApp.vue` — sticky right rail layout

**Files:**
- Modify: `srv/app/profile-vue/src/components/ProfileApp.vue`

> Now we replace the placeholder with the real composition: AppHeader, ScnIdInput, ProfileDetails, SelectedBadgesEditor, BadgeBrowser, SignatureRail/MobileSignatureBar, ErrorBanner. Layout is single-page with sticky right rail; mobile swaps to MobileSignatureBar.

- [ ] **Step 1: Replace `ProfileApp.vue`**

```vue
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProfileStore } from '@/store/profile'
import { useViewportMode } from '@/composables/useViewportMode'
import { useI18n } from 'vue-i18n'

import AppHeader from './AppHeader.vue'
import ScnIdInput from './ScnIdInput.vue'
import ProfileDetails from './ProfileDetails.vue'
import SelectedBadgesEditor from './SelectedBadgesEditor.vue'
import BadgeBrowser from './BadgeBrowser.vue'
import SignatureRail from './SignatureRail.vue'
import MobileSignatureBar from './MobileSignatureBar.vue'
import ErrorBanner from './ErrorBanner.vue'

const props = defineProps<{ scnId?: string }>()
const router = useRouter()
const route = useRoute()
const store = useProfileStore()
const { mode } = useViewportMode()
const { t, locale } = useI18n()

const inputValue = ref(props.scnId ?? '')

// Update signature alt as locale changes
watch(locale, () => store.setSignatureAlt(t('signature.alt', { scnId: store.scnId })))

async function load(scnId: string) {
  inputValue.value = scnId
  if (route.params.scnId !== scnId) {
    await router.replace({ name: 'profile', params: { scnId } })
  }
  await store.loadProfile(scnId)
  store.setSignatureAlt(t('signature.alt', { scnId }))
}

// Show a transient toast tied to limitErrorTick
const limitToast = ref(false)
watch(() => store.limitErrorTick, () => {
  limitToast.value = true
  setTimeout(() => (limitToast.value = false), 2500)
})

onMounted(() => {
  if (props.scnId) load(props.scnId)
})
</script>

<template>
  <div class="profile-app">
    <AppHeader />

    <main class="profile-app__main">
      <section class="profile-app__top">
        <ScnIdInput v-model="inputValue" @load="load" />
      </section>

      <ErrorBanner @retry="load(inputValue)" />

      <ui5-busy-indicator :active="store.loading || undefined" delay="0" size="L" />

      <div class="profile-app__body">
        <section class="profile-app__content">
          <ProfileDetails />
          <SelectedBadgesEditor />
          <BadgeBrowser />
        </section>

        <aside v-if="mode === 'desktop'" class="profile-app__rail">
          <SignatureRail />
        </aside>
      </div>
    </main>

    <MobileSignatureBar v-if="mode === 'mobile'" />

    <ui5-toast
      v-if="limitToast"
      placement="BottomCenter"
      duration="2500"
      open
    >{{ $t('profile.limitErr') }}</ui5-toast>
  </div>
</template>

<style scoped>
.profile-app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.profile-app__main {
  flex: 1;
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}
.profile-app__top {
  margin-bottom: 1rem;
}
.profile-app__body {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: 1.5rem;
  align-items: flex-start;
}
@media (max-width: 768px) {
  .profile-app__body {
    grid-template-columns: 1fr;
  }
}
.profile-app__rail {
  position: sticky;
  top: 1rem;
  align-self: start;
}
</style>
```

- [ ] **Step 2: Verify build is green**

```bash
cd srv/app/profile-vue
npm run build
```
Expected: 0 errors. `dist/` produced.

- [ ] **Step 3: Manual smoke test**

```bash
npm run dev
```
Open `http://localhost:5173/profile/test`.
Expected: page renders. Without Express running, network calls 404 — that's fine for now; we wire Express in the next task.

Stop the dev server with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
cd ../../..
git add srv/app/profile-vue/src/components/ProfileApp.vue
git commit -m "feat(profile-vue): assemble layout with sticky right rail"
```

---

## Task 18: Express static mount + SPA fallback + remove old `/profile/` redirect

**Files:**
- Modify: `srv/routes/intro.js`

> Today's `srv/routes/intro.js` has:
> ```js
> app.use('/flp', express.static(path.join(__dirname, '../app/flp')))
> ...
> app.get('/profile/', async (req, res) => res.redirect("/flp/#profile-ui"))
> ```
> The old `/profile/` redirect must be **removed** (otherwise it intercepts the new SPA routes). Replace it with `app.use('/profile', express.static(profileDist))` and an SPA-fallback `app.get('/profile/*', ...)` regex. Important: Express 5 uses `(.*)` not `*` for catch-all paths.

- [ ] **Step 1: Modify `srv/routes/intro.js`**

Find the lines:

```js
    app.get('/profile/', async (req, res) => {
        return res.redirect("/flp/#profile-ui")
    })
```

Replace with:

```js
    // New Vue SPA — served from the built dist directory
    const profileDist = path.join(__dirname, '../app/profile-vue/dist')
    app.use('/profile', express.static(profileDist))
    app.get(/^\/profile(\/.*)?$/, async (req, res) => {
        try {
            const indexHtml = path.join(profileDist, 'index.html')
            res.sendFile(indexHtml)
        } catch (error) {
            app.logger.error(error)
            res.status(500).send(error.toString())
        }
    })
```

The `path` module is already required at the top of the file. Keep the `/selfie/` redirect as-is.

- [ ] **Step 2: Build the Vue app so dist exists**

```bash
cd srv/app/profile-vue
npm run build
```
Expected: 0 errors.

- [ ] **Step 3: Start Express and verify**

```bash
cd ../..   # back to srv/
npm run dev:server-only
```

(In another terminal)

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/profile/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/profile/some-user
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/profile/assets/index.js  # placeholder; replace with actual built filename
```
Expected: first two return `200` (the SPA HTML). Third is whatever the actual asset filename is in `dist/assets/`. Open `http://localhost:4000/profile/test` in a browser — the page should render. Stop Express with Ctrl+C.

- [ ] **Step 4: Verify FLP `selfie` and `tags` tiles still work**

Open `http://localhost:4000/flp/#selfie-ui` and `http://localhost:4000/flp/#tags-ui`. Both should still render their SAPUI5 apps.

- [ ] **Step 5: Commit**

```bash
cd ../..   # repo root
git add srv/routes/intro.js
git commit -m "feat(server): mount Vue profile SPA at /profile, remove old redirect"
```

---

## Task 19: `/flp/#profile-ui` → `/profile` client-side redirect

**Files:**
- Modify: `srv/app/flp/index.html`

- [ ] **Step 1: Add the redirect snippet**

In `srv/app/flp/index.html`, INSIDE `<head>`, BEFORE the existing `<script>` block (currently around lines 10-57), add:

```html
		<script>
			// Legacy URL redirect — the SAPUI5 #profile-ui app has moved to /profile.
			if (window.location.hash === '#profile-ui') {
				window.location.replace('/profile');
			}
		</script>
```

Indent with tabs to match the existing file style.

- [ ] **Step 2: Verify in browser**

Restart Express (`cd srv && npm run dev:server-only`). Open `http://localhost:4000/flp/#profile-ui`. The browser URL should immediately replace itself with `http://localhost:4000/profile` and the Vue app should render.

Confirm `/flp/#selfie-ui` still loads the SAPUI5 selfie app (no redirect).

- [ ] **Step 3: Commit**

```bash
git add srv/app/flp/index.html
git commit -m "feat(flp): redirect #profile-ui to /profile"
```

---

## Task 20: One-command local dev — `npm run dev` runs both servers

**Files:**
- Modify: `srv/package.json`

- [ ] **Step 1: Add deps and scripts**

In `srv/package.json`:

- Add to `devDependencies`:

```json
"concurrently": "^9.1.0",
"wait-on": "^8.0.1",
```

- Replace the `scripts` block to:

```json
"scripts": {
  "test": "echo \"Error: no test specified\" && exit 1",
  "dev": "concurrently -k -n express,vue -c blue,magenta \"npm:dev:express\" \"npm:dev:vue\"",
  "dev:express": "nodemon index",
  "dev:server-only": "nodemon index",
  "dev:vue": "wait-on -t 30000 http://localhost:4000 && npm --prefix app/profile-vue run dev",
  "start": "node index",
  "types": "tsc --declaration --allowJs --emitDeclarationOnly --outDir types --skipLibCheck",
  "build:vue": "npm --prefix app/profile-vue ci && npm --prefix app/profile-vue run build",
  "test:vue": "npm --prefix app/profile-vue test"
}
```

- [ ] **Step 2: Install new deps**

```bash
cd srv
npm install
```

- [ ] **Step 3: Verify the orchestrator works**

```bash
npm run dev
```
Expected: two prefixed log streams (`[express]` blue, `[vue]` magenta). Express on 4000, Vite on 5173.

Open `http://localhost:5173/profile/test` and verify HMR works (edit `srv/app/profile-vue/src/components/ProfileApp.vue` text, save, watch the browser update).

Press Ctrl+C — both processes shut down cleanly.

- [ ] **Step 4: Commit**

```bash
cd ..
git add srv/package.json srv/package-lock.json
git commit -m "feat(dev): single npm run dev orchestrates Express + Vite"
```

---

## Task 21: End-to-end happy path with Playwright

**Files:**
- Create: `srv/app/profile-vue/playwright.config.ts`
- Create: `srv/app/profile-vue/tests/e2e/happy-path.spec.ts`
- Modify: `srv/app/profile-vue/package.json` (add test:e2e script if missing)

> Approach: spin up Express + the built Vue SPA via `playwright.config.ts`'s `webServer`. Use a real Khoros user that responds with badges. Test asserts: page loads, profile populates, badges grid shows rows, toggling a checkbox updates the right-rail signature `<img>` URL.

- [ ] **Step 1: Install Playwright browsers (one-time)**

```bash
cd srv/app/profile-vue
npx playwright install chromium
```

> On Linux CI you can also pass `--with-deps` to install required system libraries (`npx playwright install --with-deps chromium`); on macOS/Windows leave it off.

- [ ] **Step 2: Create `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4000',
    headless: true,
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'npm --prefix ../.. run --silent build:vue && npm --prefix ../.. start',
    url: 'http://localhost:4000/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } }
  ]
})
```

> Note: the `webServer.command` builds the Vue dist then starts Express. The `--prefix ../..` is `srv/`, where `build:vue` and `start` are defined (added in Tasks 20 and pre-existing respectively). If the e2e test runs in a context where the dist is already built, the build step is fast (Vite caches).

- [ ] **Step 3: Write the happy-path test**

Use a real, public SCN ID with a stable badge collection. Pick someone like `thomas-jung` whose profile is public and whose response shape we trust. (If the live API is unreliable, mark the test `.skip` and add a note for CI to mock-server-it later — out of scope here.)

`tests/e2e/happy-path.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('loads a profile and updates signature when a badge is toggled', async ({ page }) => {
  await page.goto('/profile/thomas-jung')

  // Profile populates (avatar + name)
  await expect(page.locator('.user-chip')).toBeVisible({ timeout: 15_000 })

  // At least one badge row appears in the table
  const rows = page.locator('[data-testid=badge-table] tbody tr')
  await expect(rows.first()).toBeVisible()

  // Capture the initial signature URL
  const sigImg = page.locator('[data-testid=preview-full]')
  const initialSrc = await sigImg.getAttribute('src')
  expect(initialSrc).toContain('/showcaseBadgesGroups/thomas-jung')

  // Toggle the first checkbox of an unselected row, then verify URL changed
  const firstUnselectedCb = page.locator('ui5-checkbox:not([checked])').first()
  await firstUnselectedCb.click({ force: true })

  await expect.poll(async () => sigImg.getAttribute('src')).not.toBe(initialSrc)
})
```

- [ ] **Step 4: Run the e2e test**

```bash
cd srv/app/profile-vue
npm run test:e2e
```
Expected: 1 passed (after Express + Vue build start).

- [ ] **Step 5: Commit**

```bash
cd ../../..
git add srv/app/profile-vue/playwright.config.ts \
        srv/app/profile-vue/tests/e2e/happy-path.spec.ts
git commit -m "test(profile-vue): Playwright happy-path e2e"
```

---

## Task 22: Top-level build orchestration — `mbt build` includes the SPA

**Files:**
- Modify: `package.json` (repo root)

- [ ] **Step 1: Update root `scripts.build`**

In repo root `package.json`:

```json
{
  "scripts": {
    "build": "npm --prefix srv/app/profile-vue ci && npm --prefix srv/app/profile-vue run build && mbt build",
    "lint": "cd srv && npx eslint ."
  }
}
```

- [ ] **Step 2: Run the orchestrated build**

```bash
npm run build
```
Expected:
- `npm --prefix … ci`: installs Vue app deps from lockfile.
- `npm --prefix … run build`: runs `vue-tsc -b && vite build`, produces `srv/app/profile-vue/dist/`.
- `mbt build`: produces `mta_archives/scn-badges_<version>.mtar`.

- [ ] **Step 3: Inspect the MTAR contents** (optional but worth doing once)

```bash
cd mta_archives
unzip -l scn-badges_*.mtar | grep -E "profile-vue/(dist|src|node_modules)" | head -20
```
Expected:
- `srv/app/profile-vue/dist/index.html` and `dist/assets/...` ARE included.
- `srv/app/profile-vue/node_modules/...` is NOT included (excluded by mta.yaml's `ignore: ["/node_modules"]`).
- `srv/app/profile-vue/src/...` IS included — that's fine; it's small and `npm start` doesn't read it. If you want to slim the artifact, add `srv/app/profile-vue/src` and `srv/app/profile-vue/tests` to mta.yaml's ignore list. Out of scope for this PR.

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "build: orchestrate Vue SPA build before mbt build"
```

---

## Task 23: Definition-of-done verification + final commit

**Files:**
- None — verification only.

- [ ] **Step 1: Run all unit tests**

```bash
cd srv/app/profile-vue
npm test
```
Expected: all suites green.

- [ ] **Step 2: Run e2e**

```bash
npm run test:e2e
```
Expected: pass.

- [ ] **Step 3: Verify each DoD item from the spec**

Verify by hand and check off:

- [ ] `cd srv && npm run dev` brings up both servers; `http://localhost:5173/profile/<scn-id>` renders with HMR.
- [ ] `npm run build` from the repo root succeeds and produces a working MTAR with the SPA bundled.
- [ ] `/profile/<existing-scn-id>` loads the built dist; profile populates; selecting/deselecting badges updates the right-rail signature in real time; the "Copy HTML" button writes a working `<a><img/></a>` snippet to the clipboard.
- [ ] `/flp/#profile-ui` redirects to `/profile`.
- [ ] All 11 locales render without missing-key warnings (open browser dev console while switching locales — no `vue-i18n` warnings).
- [ ] Mobile bottom-bar tested on a phone-width viewport (open Chrome DevTools, toggle device emulation to a 375×667 viewport).
- [ ] Existing FLP `selfie` and `tags` tiles still work unchanged.

- [ ] **Step 4: Push branch and open PR**

```bash
cd ../../..
git push -u origin feat/profile-ui-vue-overhaul
gh pr create --base main --title "Profile UI: Vue 3 + UI5 Web Components overhaul" \
  --body "Replaces /flp/#profile-ui SAPUI5 app with Vue 3 SPA at /profile. See docs/superpowers/specs/2026-06-02-profile-ui-vue-overhaul-design.md and docs/superpowers/plans/2026-06-02-profile-ui-vue-overhaul.md."
```

---

## Task 24 (FOLLOW-UP, separate PR after verification): Delete legacy SAPUI5 sources

> **Do NOT include in this PR.** Open as a follow-up commit after the redirect has been verified in deployed environments (production + staging) for a few days.

**Files:**
- Delete: `srv/app/flp/profile/` (entire directory)
- Modify: `srv/app/flp/index.html` (remove `profile` from `data-sap-ui-resourceroots` if listed there)

- [ ] **Step 1: Confirm no other code references the old path**

```bash
cd <repo-root>
grep -r "flp/profile\|profile-ui\|sap.profile" srv/ --include="*.js" --include="*.json" --include="*.html" --include="*.cds" | grep -v "srv/app/flp/profile/" | grep -v "srv/app/profile-vue/"
```
Expected: no hits (other than the redirect snippet itself, which we keep).

- [ ] **Step 2: Delete and commit**

```bash
git rm -r srv/app/flp/profile
git commit -m "chore: remove legacy SAPUI5 profile-ui (replaced by /profile Vue SPA)"
```
