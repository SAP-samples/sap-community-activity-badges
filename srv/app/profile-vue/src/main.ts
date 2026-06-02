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
import '@ui5/webcomponents/dist/TableHeaderCell.js'
import '@ui5/webcomponents/dist/TableHeaderRow.js'
import '@ui5/webcomponents/dist/TableRow.js'
import '@ui5/webcomponents/dist/TableCell.js'
import '@ui5/webcomponents/dist/TextArea.js'
import '@ui5/webcomponents/dist/Title.js'
import '@ui5/webcomponents/dist/Toast.js'
import '@ui5/webcomponents-fiori/dist/ShellBar.js'
import '@ui5/webcomponents-icons/dist/sys-find.js'
import '@ui5/webcomponents-icons/dist/table-view.js'
import '@ui5/webcomponents-icons/dist/copy.js'
import '@ui5/webcomponents-icons/dist/decline.js'
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
