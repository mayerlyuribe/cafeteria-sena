<template>
  <q-page class="q-pa-md">
    <div class="page-container">
      <div class="row items-center q-mb-md q-gutter-sm">
        <q-btn flat round dense icon="arrow_back" @click="$router.push({ name: 'cierre' })" />
        <div class="text-h5 page-title">Historial de cierres</div>
      </div>

      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col-12 col-sm-4">
          <q-input v-model="fechaFiltro" type="date" label="Filtrar por fecha" dense outlined clearable stack-label />
        </div>
        <div class="col-12 col-sm-8">
          <q-input v-model="textoFiltro" dense outlined clearable label="Mesa, mesero o producto (opcional)">
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </div>
      </div>

      <div v-if="!cierresFiltrados.length" class="text-grey text-center q-pa-lg">
        No hay cierres guardados que coincidan con el filtro.
      </div>

      <div class="row q-col-gutter-md">
        <div v-for="c in cierresFiltrados" :key="c.id" class="col-12 col-sm-6 col-md-4">
          <q-card flat bordered class="cursor-pointer" @click="toggleCierre(c.id)">
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
              <div class="text-caption text-info q-mt-sm">
                <q-icon :name="cierreExpandido === c.id ? 'expand_less' : 'expand_more'" size="14px" />
                {{ cierreExpandido === c.id ? 'Ocultar pedidos' : 'Ver pedidos del dia' }}
              </div>
            </q-card-section>

            <q-slide-transition>
              <q-card-section v-if="cierreExpandido === c.id" class="q-pt-none" @click.stop>
                <q-separator class="q-mb-sm" />
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
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useDiaStore } from '../stores/stores.js'

const diaStore = useDiaStore()

const fechaFiltro = ref('')
const textoFiltro = ref('')
const cierreExpandido = ref(null)

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

function toggleCierre(id) {
  cierreExpandido.value = cierreExpandido.value === id ? null : id
}

function formatoMoneda(valor) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor || 0)
}

function formatearHora(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.page-container {
  max-width: 1180px;
  margin: 0 auto;
}
</style>