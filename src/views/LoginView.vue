<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="flex flex-center bg-grey-2">
        <q-card style="width: 380px; max-width: 92vw" class="q-pa-sm">
          <q-card-section class="text-center">
            <q-icon name="local_cafe" size="42px" color="primary" />
            <div class="text-h6 page-title q-mt-sm">Cafeteria SENA — Iniciar sesion</div>
            <div class="text-caption text-grey-7">Ingresa con tu usuario de admin o empleado</div>
          </q-card-section>

          <q-card-section class="q-gutter-md">
            <q-input
              v-model="usuario"
              label="Usuario"
              dense
              outlined
              autofocus
              @keyup.enter="ingresar"
            />
            <q-input
              v-model="clave"
              label="Contrasena"
              dense
              outlined
              :type="verClave ? 'text' : 'password'"
              @keyup.enter="ingresar"
            >
              <template #append>
                <q-icon
                  :name="verClave ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="verClave = !verClave"
                />
              </template>
            </q-input>

            <div v-if="error" class="text-negative text-caption">{{ error }}</div>

            <q-btn
              color="primary"
              label="Ingresar"
              class="full-width"
              icon="login"
              @click="ingresar"
            />
          </q-card-section>

          <q-separator />

          <q-card-section class="text-caption text-grey-7">
            <div class="text-weight-bold q-mb-xs">Usuarios de prueba</div>
            <div>Admin → usuario: <code>admin</code> · clave: <code>admin123</code></div>
            <div>Empleado → usuario: <code>maria</code> · clave: <code>1234</code></div>
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/stores.js'

const router = useRouter()
const authStore = useAuthStore()

const usuario = ref('')
const clave = ref('')
const verClave = ref(false)
const error = ref('')

function ingresar() {
  error.value = ''
  if (!usuario.value || !clave.value) {
    error.value = 'Ingresa usuario y contrasena.'
    return
  }
  const resultado = authStore.login(usuario.value, clave.value)
  if (!resultado.ok) {
    error.value = resultado.mensaje
    return
  }
  router.push({ name: 'mapa' })
}
</script>
