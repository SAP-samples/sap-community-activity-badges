/**
 * Ambient module declaration for scripts/*.mjs files (build-time only;
 * imported from tests for unit testing pure helpers).
 */
declare module '@/../scripts/convert-i18n.mjs' {
  export function propertiesToObject(text: string): Record<string, unknown>
}
