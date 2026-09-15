import { createApp } from 'vue'
import { Quasar } from 'quasar'
import App from './App.vue'
import './style.css'
import { router } from './routes/routes.js'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'

const myApp = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

myApp.use(Quasar, {
    plugins: {}, 
})


myApp.use(pinia)
myApp.use(router)
myApp.mount('#app')