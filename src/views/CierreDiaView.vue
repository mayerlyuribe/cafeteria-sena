<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h5 page-title">Cierre del dia (admin)</div>
      <q-space />
      <q-btn
        v-if="!diaStore.diaCerrado"
        color="negative"
        icon="lock"
        label="Cerrar el dia"
        :disable="!resumen.cantidadOrdenes"
        @click="confirmarCierre = true"
      />
      <q-btn
        v-else
        color="primary"
        icon="lock_open"
        label="Iniciar nuevo dia"
        @click="diaStore.iniciarNuevoDia(authStore.currentUser?.nombre)"
      />
    </div>

    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-auto">
        <q-chip icon="login" color="grey-3" text-color="dark">
          Abrio el dia: <strong class="q-ml-xs">{{ diaStore.abierto_por || 'Sin registrar' }}</strong>
        </q-chip>
      </div>
      <div class="col-auto">
        <q-chip icon="logout" color="grey-3" text-color="dark">
          Cerro el dia: <strong class="q-ml-xs">{{ diaStore.cerrado_por || '—' }}</strong>
        </q-chip>
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-6 col-md-3">
        <q-card flat bordered>
          <q-card-section class="text-center">
            <div class="text-caption text-grey-7">Total recaudado</div>
            <div class="text-h5 text-weight-bold text-primary">
              {{ formatoMoneda(resumen.totalRecaudado) }}
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered>
          <q-card-section class="text-center">
            <div class="text-caption text-grey-7">Mesas atendidas</div>
            <div class="text-h5 text-weight-bold">{{ resumen.mesasAtendidas }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered>
          <q-card-section class="text-center">
            <div class="text-caption text-grey-7">Ticket promedio</div>
            <div class="text-h5 text-weight-bold">{{ formatoMoneda(resumen.ticketPromedio) }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered>
          <q-card-section class="text-center">
            <div class="text-caption text-grey-7">Producto mas vendido</div>
            <div class="text-subtitle1 text-weight-bold">
              {{ resumen.productoMasVendido || '—' }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="text-subtitle1 text-weight-bold q-mb-sm">Ordenes cerradas hoy</div>
    <q-list bordered separator class="q-mb-lg">
      <q-item v-for="orden in ordenesStore.ordenesCerradas" :key="orden.id">
        <q-item-section>
          <q-item-label>Mesa {{ mesasStore.obtenerPorId(orden.mesa_id)?.numero ?? '—' }}</q-item-label>
          <q-item-label caption>
            {{ formatearHora(orden.hora_apertura) }} → {{ formatearHora(orden.hora_cierre) }}
          </q-item-label>
        </q-item-section>
        <q-item-section side class="text-weight-bold">
          {{ formatoMoneda(orden.total_final) }}
        </q-item-section>
      </q-item>
      <q-item v-if="!ordenesStore.ordenesCerradas.length">
        <q-item-section class="text-grey text-center">Aun no hay ordenes cerradas.</q-item-section>
      </q-item>
    </q-list>

    <div class="text-subtitle1 text-weight-bold q-mb-sm">Registro de turnos (quien trabajo hoy)</div>
    <q-list bordered separator class="q-mb-lg">
      <q-item v-for="t in authStore.registroTurnos" :key="t.id">
        <q-item-section avatar>
          <q-icon :name="t.accion === 'apertura' ? 'login' : 'logout'" :color="t.accion === 'apertura' ? 'positive' : 'grey-7'" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ t.usuario }} <q-badge color="grey-5" class="q-ml-xs">{{ t.rol }}</q-badge></q-item-label>
          <q-item-label caption>
            {{ t.accion === 'apertura' ? 'Inicio turno' : 'Cerro turno' }} · {{ formatearHora(t.hora) }}
          </q-item-label>
        </q-item-section>
      </q-item>
      <q-item v-if="!authStore.registroTurnos.length">
        <q-item-section class="text-grey text-center">Aun no hay turnos registrados.</q-item-section>
      </q-item>
    </q-list>

    <div v-if="diaStore.cierres.length">
      <div class="text-subtitle1 text-weight-bold q-mb-sm">Historial de cierres anteriores</div>
      <q-list bordered separator>
        <q-item v-for="c in diaStore.cierres" :key="c.id">
          <q-item-section>
            <q-item-label>{{ c.fecha }}</q-item-label>
            <q-item-label caption>
              {{ c.cantidadOrdenes }} ordenes · {{ c.mesasAtendidas }} mesas · mas vendido: {{ c.productoMasVendido || '—' }}
            </q-item-label>
            <q-item-label caption>
              Abrio: {{ c.abierto_por || '—' }} · Cerro: {{ c.cerrado_por || '—' }}
            </q-item-label>
          </q-item-section>
          <q-item-section side class="text-weight-bold">
            {{ formatoMoneda(c.totalRecaudado) }}
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <q-dialog v-model="confirmarCierre">
      <q-card>
        <q-card-section class="text-h6">¿Cerrar el dia?</q-card-section>
        <q-card-section>
          No se podran abrir nuevas ordenes hasta iniciar un nuevo dia. El historial no se borra.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat color="negative" label="Cerrar dia" @click="cerrarDia" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useOrdenesStore, useMesasStore, useDiaStore, useAuthStore } from '../stores/stores.js'

const $q = useQuasar()
const ordenesStore = useOrdenesStore()
const mesasStore = useMesasStore()
const diaStore = useDiaStore()
const authStore = useAuthStore()

const confirmarCierre = ref(false)
const resumen = computed(() => diaStore.resumenDelDia)

function cerrarDia() {
  diaStore.cerrarDia(authStore.currentUser?.nombre)
  $q.notify({ type: 'info', message: 'Dia cerrado. Resumen guardado en el historial.' })
}

function formatoMoneda(valor) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor || 0)
}

function formatearHora(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}
</script>
