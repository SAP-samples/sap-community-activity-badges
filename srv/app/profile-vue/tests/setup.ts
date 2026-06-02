import { config } from '@vue/test-utils'

// Treat ui5-* tags as known custom elements so Vue doesn't warn during tests.
config.global.config.compilerOptions = {
  isCustomElement: (tag: string) => tag.startsWith('ui5-')
}
