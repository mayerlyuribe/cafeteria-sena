import { createRouter, createWebHashHistory } from "vue-router"
import { Notify } from "quasar"
import { useAuthStore } from "../stores/stores.js"

import LoginView from "../views/LoginView.vue"
import MainLayout from "../views/MainLayout.vue"
import MapaLocalView from "../views/MapaLocalView.vue"
import OrdenMesaView from "../views/OrdenMesaView.vue"
import CobroView from "../views/CobroView.vue"
import MenuView from "../views/MenuView.vue"
import CierreDiaView from "../views/CierreDiaView.vue"
import ErrorNotFoundView from "../views/ErrorNotFoundView.vue"

const routes = [
    { path: "/login", name: "login", component: LoginView },
    {
        path: "/",
        component: MainLayout,
        children: [
            { path: "", name: "mapa", component: MapaLocalView },
            { path: "mesa/:id", name: "orden-mesa", component: OrdenMesaView, props: true },
            { path: "mesa/:id/cobro", name: "cobro", component: CobroView, props: true },
            { path: "menu", name: "menu", component: MenuView, meta: { requiresAdmin: true } },
            { path: "cierre", name: "cierre", component: CierreDiaView, meta: { requiresAdmin: true } }
        ]
    },
    { path: "/:catchAll(.*)*", name: "not-found", component: ErrorNotFoundView }
]

export const router = createRouter({
    routes,
    history: createWebHashHistory()
})

router.beforeEach((to) => {
    const authStore = useAuthStore()

    if (to.name !== "login" && !authStore.estaAutenticado) {
        return { name: "login" }
    }

    if (to.name === "login" && authStore.estaAutenticado) {
        return { name: "mapa" }
    }

    if (to.meta?.requiresAdmin && !authStore.esAdmin) {
        Notify.create({ type: "negative", message: "Esa seccion es solo para administradores." })
        return { name: "mapa" }
    }

    return true
})
