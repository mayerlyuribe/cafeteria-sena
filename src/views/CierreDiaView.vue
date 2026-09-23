<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md q-gutter-sm">
      <div class="text-h5 page-title">Cierre del dia</div>
      <q-space />
      <q-btn flat color="primary" icon="history" label="Historial" @click="$router.push({ name: 'historial' })" />
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
        @click="diaStore.iniciarNuevoDia()"
      />
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
            <span v-if="orden.atendido_por"> · Atendio: {{ orden.atendido_por }}</span>
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
import { useOrdenesStore, useMesasStore, useDiaStore } from '../stores/stores.js'
import { formatoMoneda, formatearHora} from '../stores/utils.js'

const $q = useQuasar()
const ordenesStore = useOrdenesStore()
const mesasStore = useMesasStore()
const diaStore = useDiaStore()

const confirmarCierre = ref(false)
const resumen = computed(() => diaStore.resumenDelDia)

function cerrarDia() {
  diaStore.cerrarDia()
  $q.notify({ type: 'info', message: 'Dia cerrado. Resumen guardado en el historial.' })
}

</script>
