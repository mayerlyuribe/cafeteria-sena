<template>
  <q-page class="q-pa-md">
    <div class="page-container">
      <div class="row items-center q-mb-md q-gutter-sm">
        <q-btn flat round dense icon="arrow_back" @click="$router.push({ name: 'cierre' })" />
        <div class="text-h5 page-title">Historial</div>
      </div>

      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col-12 col-sm-4">
          <q-input v-model="fechaFiltro" type="date" label="Filtrar por fecha" dense outlined clearable stack-label />
        </div>
        <div class="col-12 col-sm-8">
          <q-input v-model="textoFiltro" dense outlined clearable label="Mesa, mesero, cliente o producto (opcional)">
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </div>
      </div>

      <div v-if="!cierresFiltrados.length" class="text-grey text-center q-pa-lg">
        No hay dias guardados que coincidan con el filtro.
      </div>

      <div class="row q-col-gutter-md">
        <div v-for="c in cierresFiltrados" :key="c.id" class="col-12 col-sm-6 col-md-4">
          <q-card flat bordered>
            <q-card-section>
              <div class="text-subtitle1 text-weight-bold">{{ c.fecha }}</div>
              <div class="text-caption text-grey-7">
                {{ c.cantidadOrdenes }} ordenes · {{ c.mesasAtendidas }} mesas
              </div>
              <div class="text-caption text-grey-7">
                Mas vendido: {{ c.productoMasVendido || '—' }}
              </div>
              <div class="text-h6 text-weight-bold text-primary q-mt-xs">
                {{ formatoMoneda(c.totalRecaudado) }}
              </div>

              <div class="row q-gutter-sm q-mt-sm">
                <div class="text-caption text-info cursor-pointer" @click="togglePedidos(c.id)">
                  <q-icon :name="pedidosExpandido === c.id ? 'expand_less' : 'expand_more'" size="14px" />
                  {{ pedidosExpandido === c.id ? 'Ocultar pedidos' : `Pedidos (${(c.ordenes || []).length})` }}
                </div>
                <div class="text-caption text-info cursor-pointer" @click="toggleReservas(c.id)">
                  <q-icon :name="reservasExpandido === c.id ? 'expand_less' : 'expand_more'" size="14px" />
                  {{ reservasExpandido === c.id ? 'Ocultar reservas' : `Reservas (${reservasDelDia(c).length})` }}
                </div>
              </div>
            </q-card-section>

            <q-slide-transition>
              <q-card-section v-if="pedidosExpandido === c.id" class="q-pt-none">
                <q-separator class="q-mb-sm" />
                <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">Pedidos del dia</div>
                <q-list v-if="pedidosFiltradosDe(c).length" bordered separator>
                  <q-item v-for="orden in pedidosFiltradosDe(c)" :key="orden.id">
                    <q-item-section>
                      <q-item-label>
                        Mesa {{ orden.mesa_numero ?? '—' }} · Atendio: {{ orden.atendido_por }}
                      </q-item-label>
                      <q-item-label caption>
                        {{ formatearHora(orden.hora_apertura) }} → {{ formatearHora(orden.hora_cierre) }}
                      </q-item-label>
                      <q-item-label caption>
                        {{ orden.items.map(it => `${it.cantidad}x ${it.nombre_producto}`).join(', ') }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side class="text-weight-bold">
                      {{ formatoMoneda(orden.total_final) }}
                    </q-item-section>
                  </q-item>
                </q-list>
                <div v-else class="text-grey text-center q-pa-sm">
                  No hay pedidos que coincidan con "{{ textoFiltro }}" en este dia.
                </div>
              </q-card-section>
            </q-slide-transition>

            <q-slide-transition>
              <q-card-section v-if="reservasExpandido === c.id" class="q-pt-none">
                <q-separator class="q-mb-sm" />
                <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">Reservas del dia</div>
                <q-list v-if="reservasDelDia(c).length" bordered separator>
                  <q-item v-for="r in reservasDelDia(c)" :key="r.id">
                    <q-item-section avatar>
                      <q-icon :name="iconoResultado(r.resultado)" :color="colorResultado(r.resultado)" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>
                        {{ r.hora }} · Mesa {{ r.mesa_numero ?? '—' }}
                        <span v-if="r.cliente"> · {{ r.cliente }}</span>
                      </q-item-label>
                      <q-item-label caption>
                        Registro: {{ r.registrada_por || 'Sin registrar' }} · Resuelta: {{ formatearHora(r.hora_resuelta) }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-badge :color="colorResultado(r.resultado)">{{ textoResultado(r.resultado) }}</q-badge>
                    </q-item-section>
                  </q-item>
                </q-list>
                <div v-else class="text-grey text-center q-pa-sm">
                  No hay reservas que coincidan con "{{ textoFiltro }}" en este dia.
                </div>
              </q-card-section>
            </q-slide-transition>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useDiaStore, useMesasStore } from '../stores/stores.js'
import { formatoMoneda, formatearHora } from '../stores/utils.js'

const diaStore = useDiaStore()
const mesasStore = useMesasStore()

const fechaFiltro = ref('')
const textoFiltro = ref('')
const pedidosExpandido = ref(null)
const reservasExpandido = ref(null)

const cierresFiltrados = computed(() =>
  diaStore.cierres.filter((c) => !fechaFiltro.value || c.fecha === fechaFiltro.value)
)

function pedidosFiltradosDe(cierre) {
  const q = textoFiltro.value.trim().toLowerCase()
  const ordenes = cierre.ordenes || []
  if (!q) return ordenes
  return ordenes.filter((orden) => {
    const coincideMesa = String(orden.mesa_numero).includes(q)
    const coincideAtendio = orden.atendido_por.toLowerCase().includes(q)
    const coincideProducto = orden.items.some((it) => it.nombre_producto.toLowerCase().includes(q))
    return coincideMesa || coincideAtendio || coincideProducto
  })
}

function reservasDelDia(cierre) {
  const q = textoFiltro.value.trim().toLowerCase()
  const delDia = mesasStore.historialReservas.filter((r) => r.fecha === cierre.fecha)
  if (!q) return delDia
  return delDia.filter((r) =>
    String(r.mesa_numero).includes(q) ||
    (r.cliente || '').toLowerCase().includes(q) ||
    (r.registrada_por || '').toLowerCase().includes(q)
  )
}

function togglePedidos(id) {
  pedidosExpandido.value = pedidosExpandido.value === id ? null : id
}

function toggleReservas(id) {
  reservasExpandido.value = reservasExpandido.value === id ? null : id
}

function iconoResultado(resultado) {
  if (resultado === 'llego') return 'check_circle'
  if (resultado === 'no_llego') return 'cancel'
  return 'event_busy'
}

function colorResultado(resultado) {
  if (resultado === 'llego') return 'positive'
  if (resultado === 'no_llego') return 'negative'
  return 'grey-7'
}

function textoResultado(resultado) {
  if (resultado === 'llego') return 'Llego'
  if (resultado === 'no_llego') return 'No llego'
  return 'Cancelada'
}
</script>

<style scoped>
.page-container {
  max-width: 1180px;
  margin: 0 auto;
}
</style>