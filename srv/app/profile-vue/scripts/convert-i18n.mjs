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
import { readFileSync, writeFileSync, mkdirSync, readdirSync, realpathSync } from 'node:fs'
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
function isDirectlyInvoked() {
  if (!process.argv[1]) return false
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
  } catch {
    return resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))
  }
}

if (isDirectlyInvoked()) main()
