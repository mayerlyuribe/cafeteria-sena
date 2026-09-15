import { createRouter, createWebHashHistory } from "vue-router"

import RutaEjemplo from "../views/rutaejemplo.vue"



const routes = [
    {path: "/rutaejemplo", component: RutaEjemplo}
]
export const router = createRouter({
    routes,
    history: createWebHashHistory()
})