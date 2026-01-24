import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './styles/css-reset.css'
import './styles/properties.css'
import './styles/fonts.css'
import './styles/global.css'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
