<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          class="lt-md"
          @click="drawerAbierto = !drawerAbierto"
        />
        <q-icon name="local_cafe" size="28px" class="q-mr-sm" />
        <q-toolbar-title class="page-title">
          Cafeteria SENA
        </q-toolbar-title>

        <q-chip
          v-if="diaStore.diaCerrado"
          color="negative"
          text-color="white"
          icon="lock"
          class="q-mr-sm"
        >
          Dia cerrado
        </q-chip>

        <q-tabs class="gt-sm" indicator-color="white" active-color="white" no-caps>
          <q-route-tab to="/" label="Mapa del local" icon="table_restaurant" />
          <q-route-tab v-if="authStore.esAdmin" to="/menu" label="Menu" icon="restaurant_menu" />
          <q-route-tab v-if="authStore.esAdmin" to="/cierre" label="Cierre del dia" icon="summarize" />
        </q-tabs>

        <q-separator vertical dark class="q-mx-sm gt-xs" />

        <q-btn flat no-caps class="gt-xs">
          <q-avatar size="26px" color="secondary" text-color="white" class="q-mr-sm">
            {{ inicial }}
          </q-avatar>
          {{ authStore.currentUser?.nombre }}
          <q-badge color="secondary" class="q-ml-sm">{{ rolTexto }}</q-badge>
          <q-menu>
            <q-list style="min-width: 160px">
              <q-item clickable v-close-popup @click="cerrarSesion">
                <q-item-section avatar><q-icon name="logout" /></q-item-section>
                <q-item-section>Cerrar sesion</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <q-btn flat round dense icon="logout" class="lt-sm" @click="cerrarSesion" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawerAbierto" side="left" bordered class="lt-md">
      <q-list>
        <q-item-label header>{{ authStore.currentUser?.nombre }} · {{ rolTexto }}</q-item-label>
        <q-item clickable v-ripple to="/" exact @click="drawerAbierto = false">
          <q-item-section avatar><q-icon name="table_restaurant" /></q-item-section>
          <q-item-section>Mapa del local</q-item-section>
        </q-item>
        <q-item v-if="authStore.esAdmin" clickable v-ripple to="/menu" @click="drawerAbierto = false">
          <q-item-section avatar><q-icon name="restaurant_menu" /></q-item-section>
          <q-item-section>Menu</q-item-section>
        </q-item>
        <q-item v-if="authStore.esAdmin" clickable v-ripple to="/cierre" @click="drawerAbierto = false">
          <q-item-section avatar><q-icon name="summarize" /></q-item-section>
          <q-item-section>Cierre del dia</q-item-section>
        </q-item>
        <q-separator />
        <q-item clickable v-ripple @click="cerrarSesion">
          <q-item-section avatar><q-icon name="logout" /></q-item-section>
          <q-item-section>Cerrar sesion</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDiaStore, useAuthStore } from '../stores/stores.js'

const router = useRouter()
const drawerAbierto = ref(false)
const diaStore = useDiaStore()
const authStore = useAuthStore()

const inicial = computed(() => authStore.currentUser?.nombre?.charAt(0)?.toUpperCase() || '?')
const rolTexto = computed(() => (authStore.esAdmin ? 'Admin' : 'Empleado'))

function cerrarSesion() {
  authStore.logout()
  router.push({ name: 'login' })
}
</script>
