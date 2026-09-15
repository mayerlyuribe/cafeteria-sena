<template>
  <q-page class="q-pa-md flex flex-center" v-if="!mesa">
    <div class="text-grey">Mesa no encontrada.</div>
  </q-page>

  <q-page class="q-pa-md" v-else>
    <div class="row items-center q-mb-md">
      <q-btn flat round dense icon="arrow_back" @click="$router.push({ name: 'orden-mesa', params: { id: mesa.id } })" />
      <div class="text-h5 page-title q-ml-sm">Cobro — Mesa {{ mesa.numero }}</div>
      <q-badge color="warning" text-color="dark" class="q-ml-md">🟡 Por cobrar</q-badge>
    </div>

    <q-card flat bordered class="q-mb-md" style="max-width: 560px">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold q-mb-sm">Detalle del consumo</div>
        <q-list separator>
          <q-item v-for="item in items" :key="item.id">
            <q-item-section>
              <q-item-label>{{ item.nombre_producto }} x{{ item.cantidad }}</q-item-label>
              <q-item-label caption>{{ formatoMoneda(item.precio_unitario) }} c/u</q-item-label>
            </q-item-section>
            <q-item-section side class="text-weight-bold">
              {{ formatoMoneda(item.precio_unitario * item.cantidad) }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-separator />

      <q-card-section class="row items-center">
        <div class="text-h6">Total a pagar</div>
        <q-space />
        <div class="text-h5 text-weight-bold text-primary">{{ formatoMoneda(total) }}</div>
      </q-card-section>
    </q-card>

    <q-btn
      color="positive"
      icon="payments"
      label="Cobrar y liberar mesa"
      size="lg"
      style="max-width: 560px"
      class="full-width"
      @click="cobrar"
    />
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useMesasStore, useOrdenesStore } from '../stores/stores.js'

const props = defineProps({ id: { type: [String, Number], required: true } })

const router = useRouter()
const $q = useQuasar()
const mesasStore = useMesasStore()
const ordenesStore = useOrdenesStore()

const mesa = computed(() => mesasStore.obtenerPorId(props.id))
const orden = computed(() => ordenesStore.ordenAbiertaDeMesa(props.id))
const items = computed(() => (orden.value ? ordenesStore.itemsDeOrden(orden.value.id) : []))
const total = computed(() => (orden.value ? ordenesStore.subtotalDeOrden(orden.value.id) : 0))

function cobrar() {
  if (!orden.value) return
  ordenesStore.cobrarYLiberar(orden.value.id)
  $q.notify({ type: 'positive', message: `Mesa ${mesa.value.numero} cobrada y liberada` })
  router.push('/')
}

function formatoMoneda(valor) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor || 0)
}
</script>
