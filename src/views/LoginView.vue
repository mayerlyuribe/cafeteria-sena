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
              :disable="cargando"
              @keyup.enter="ingresar"
            />
            <q-input
              v-model="clave"
              label="Contrasena"
              dense
              outlined
              :type="verClave ? 'text' : 'password'"
              :disable="cargando"
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
              :label="cargando ? 'Verificando...' : 'Ingresar'"
              class="full-width"
              icon="login"
              :loading="cargando"
              :disable="cargando"
              @click="ingresar"
            >
              <template #loading>
                <q-spinner-dots class="q-mr-sm" />
                Verificando...
              </template>
            </q-btn>
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
const cargando = ref(false)

function ingresar() {
  error.value = ''
  if (!usuario.value || !clave.value) {
    error.value = 'Ingresa usuario y contrasena.'
    return
  }
  if (cargando.value) return

  cargando.value = true
  // Simulacion de carga al iniciar sesion (por ejemplo, validacion contra un servidor).
  setTimeout(() => {
    const resultado = authStore.login(usuario.value, clave.value)
    cargando.value = false
    if (!resultado.ok) {
      error.value = resultado.mensaje
      return
    }
    router.push({ name: 'mapa' })
  }, 1200)
}
</script>
