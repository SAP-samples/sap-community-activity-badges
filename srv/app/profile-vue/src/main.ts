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
import '@ui5/webcomponents/dist/CheckBox.js'
import '@ui5/webcomponents/dist/Dialog.js'
import '@ui5/webcomponents/dist/Input.js'
import '@ui5/webcomponents/dist/Label.js'
import '@ui5/webcomponents/dist/Link.js'
import '@ui5/webcomponents/dist/MessageStrip.js'
import '@ui5/webcomponents/dist/Option.js'
import '@ui5/webcomponents/dist/Select.js'
import '@ui5/webcomponents/dist/Tab.js'
import '@ui5/webcomponents/dist/TabContainer.js'
import '@ui5/webcomponents/dist/Table.js'
import '@ui5/webcomponents/dist/TableCell.js'
import '@ui5/webcomponents/dist/TableHeaderCell.js'
import '@ui5/webcomponents/dist/TableHeaderRow.js'
import '@ui5/webcomponents/dist/TableRow.js'
import '@ui5/webcomponents/dist/Toast.js'
import '@ui5/webcomponents-icons/dist/table-view.js'
import '@ui5/webcomponents-icons/dist/grid.js'
import '@ui5/webcomponents-icons/dist/copy.js'
import '@ui5/webcomponents-icons/dist/decline.js'
import '@ui5/webcomponents-icons/dist/light-mode.js'
import '@ui5/webcomponents-icons/dist/dark-mode.js'
import '@ui5/webcomponents-icons/dist/desktop-mobile.js'

// Register the theme bundles and i18n assets so setTheme('sap_horizon_dark')
// actually has dark assets to apply (without this, UI5 warns
// "non-registered theme" and silently falls back to light).
import '@ui5/webcomponents/dist/Assets.js'
import '@ui5/webcomponents-fiori/dist/Assets.js'

import { applyTheme, resolveTheme, watchOsTheme } from './theme'

applyTheme(resolveTheme())
watchOsTheme()
// Mirror the active locale onto <html lang> + localStorage. setLocale() validates
// the input and ignores unsupported codes, so passing the raw string is safe.
setLocale(i18n.global.locale.value)

const app = createApp(App)
app.use(createPinia())
app.use(i18n)
app.use(router)
app.mount('#app')
