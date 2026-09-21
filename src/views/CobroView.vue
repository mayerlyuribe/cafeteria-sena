<template>
  <q-page class="q-pa-md flex flex-center" v-if="!mesa">
    <div class="text-grey">Mesa no encontrada.</div>
  </q-page>

  <q-page class="q-pa-md cobro-shell" v-else>
    <div class="cobro-container">
      <div class="row items-center q-mb-md">
        <q-btn flat round dense icon="arrow_back"
          @click="$router.push({ name: 'orden-mesa', params: { id: mesa.id } })" />
        <div class="text-h5 page-title q-ml-sm">Cobro — Mesa {{ mesa.numero }}</div>
        <q-badge color="warning" text-color="dark" class="q-ml-md">🟡 Por cobrar</q-badge>
      </div>

      <q-card flat bordered class="q-mb-md">
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

      <!-- ---------------------- Metodo de pago (simulacion) ---------------------- -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-subtitle1 text-weight-bold q-mb-sm">Metodo de pago</div>
          <div class="text-caption text-grey-7 q-mb-sm">
            Selecciona como paga el cliente. Este es un cobro simulado, no se procesa ningun pago real.
          </div>
          <div class="row q-col-gutter-sm metodo-pago-grid">
            <div v-for="metodo in METODOS_PAGO" :key="metodo.valor" class="col-6 col-sm-3">
              <q-card flat bordered class="metodo-pago-card"
                :class="{ 'metodo-pago-card--activo': metodoPago === metodo.valor }"
                @click="metodoPago = metodo.valor">
                <q-card-section class="text-center q-pa-sm">
                  <q-icon :name="metodo.icono" size="26px"
                    :color="metodoPago === metodo.valor ? 'primary' : 'grey-7'" />
                  <div class="text-caption q-mt-xs">{{ metodo.etiqueta }}</div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- ---------------------- Dividir cuenta ---------------------- -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section class="row items-center">
          <div class="text-subtitle1 text-weight-bold">Dividir cuenta</div>
          <q-space />
          <q-toggle v-model="dividir" />
        </q-card-section>

        <template v-if="dividir">
          <q-separator />

          <div class="dividir-centro">
            <q-card-section class="flex flex-center">
              <q-btn-toggle
                v-model="modo"
                no-caps
                unelevated
                toggle-color="primary"
                :disable="hayPagos"
                :options="[
                  { label: 'Por producto', value: 'productos' },
                  { label: 'Partes iguales', value: 'iguales' }
                ]"
              />
            </q-card-section>

            <q-separator />

            <q-card-section class="flex flex-center column items-center">
              <div class="text-caption text-grey-7 q-mb-xs">Numero de personas</div>
              <div class="row items-center q-gutter-md">
                <q-btn
                  dense round outline icon="remove" size="md"
                  :disable="numPersonas <= 2 || hayPagos"
                  @click="numPersonas--"
                />
                <div class="text-h6" style="min-width: 32px; text-align: center">{{ numPersonas }}</div>
                <q-btn
                  dense round outline icon="add" size="md"
                  :disable="numPersonas >= CAPACIDAD_MAXIMA_UNION || hayPagos"
                  @click="numPersonas++"
                />
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section class="q-py-md">
              <div v-if="modo === 'iguales'" class="column items-center q-gutter-sm personas-lista">
                <q-card v-for="(persona, i) in personas" :key="i" flat bordered
                  class="persona-card" :class="{ 'persona-card--pagada': persona.pagado }">
                  <q-card-section class="row items-center no-wrap">
                    <q-checkbox v-model="persona.pagado" color="positive" />
                    <div class="col text-center">
                      <div class="text-body1">Persona {{ i + 1 }}</div>
                    </div>
                    <div class="text-weight-bold text-right" style="min-width: 90px">
                      {{ formatoMoneda(montos[i]) }}
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div v-else class="column items-center q-gutter-sm personas-lista">
                <q-expansion-item
                  v-for="(persona, i) in personas"
                  :key="i"
                  group="personas"
                  expand-separator
                  class="persona-expansion"
                  :class="{ 'persona-card--pagada': persona.pagado }"
                >
                  <template #header>
                    <q-item-section side>
                      <q-checkbox
                        v-model="persona.pagado"
                        color="positive"
                        :disable="montos[i] === 0"
                        @click.stop
                      />
                    </q-item-section>
                    <q-item-section class="text-center">Persona {{ i + 1 }}</q-item-section>
                    <q-item-section side class="text-weight-bold">
                      {{ formatoMoneda(montos[i]) }}
                    </q-item-section>
                  </template>

                  <q-list dense separator>
                    <q-item v-for="item in items" :key="item.id">
                      <q-item-section>
                        <q-item-label>{{ item.nombre_producto }}</q-item-label>
                        <q-item-label caption>
                          {{ formatoMoneda(item.precio_unitario) }} c/u · quedan {{ restantes(item) }}
                        </q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <div class="row items-center q-gutter-xs">
                          <q-btn
                            dense round flat icon="remove" size="sm"
                            :disable="persona.pagado || !persona.cantidades[item.id]"
                            @click="ajustar(persona, item, -1)"
                          />
                          <div style="min-width: 24px; text-align: center">
                            {{ persona.cantidades[item.id] || 0 }}
                          </div>
                          <q-btn
                            dense round flat icon="add" size="sm"
                            :disable="persona.pagado || restantes(item) <= 0"
                            @click="ajustar(persona, item, 1)"
                          />
                        </div>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-expansion-item>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section class="text-center">
              <div v-if="modo === 'productos' && unidadesSinAsignar > 0" class="text-negative q-mb-sm">
                Faltan {{ unidadesSinAsignar }} productos por asignar a alguien.
              </div>
              <div class="row justify-center q-gutter-xl">
                <div>
                  <div class="text-caption text-grey-7">Pagado</div>
                  <div class="text-subtitle1 text-weight-bold text-positive">{{ formatoMoneda(totalPagado) }}</div>
                </div>
                <div>
                  <div class="text-caption text-grey-7">Falta</div>
                  <div class="text-subtitle1 text-weight-bold text-negative">{{ formatoMoneda(total - totalPagado) }}</div>
                </div>
              </div>
            </q-card-section>
          </div>
        </template>
      </q-card>

      <q-btn color="positive" icon="payments" label="Cobrar y liberar mesa" size="lg"
        class="full-width" :disable="!puedeCobrar" @click="confirmarCobro" />
    </div>
  </q-page>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useMesasStore, useOrdenesStore, CAPACIDAD_MAXIMA_UNION } from '../stores/stores.js'
const props = defineProps({ id: { type: [String, Number], required: true } })

const router = useRouter()
const $q = useQuasar()
const mesasStore = useMesasStore()
const ordenesStore = useOrdenesStore()

const mesa = computed(() => mesasStore.obtenerPorId(props.id))
const orden = computed(() => ordenesStore.ordenAbiertaDeMesa(props.id))
const items = computed(() => (orden.value ? ordenesStore.itemsDeOrden(orden.value.id) : []))
const total = computed(() => (orden.value ? ordenesStore.subtotalDeOrden(orden.value.id) : 0))

/* ---------------------- Metodo de pago (simulacion) ---------------------- */
const METODOS_PAGO = [
  { valor: 'efectivo', etiqueta: 'Efectivo', icono: 'payments' },
  { valor: 'tarjeta', etiqueta: 'Tarjeta', icono: 'credit_card' },
  { valor: 'transferencia', etiqueta: 'Transferencia', icono: 'account_balance' },
  { valor: 'nequi_daviplata', etiqueta: 'Nequi / Daviplata', icono: 'smartphone' }
]
const metodoPago = ref('efectivo')

const dividir = ref(false)
const modo = ref('productos')
const numPersonas = ref(2)
const personas = ref([])

function reiniciarPersonas() {
  personas.value = Array.from({ length: numPersonas.value }, () => ({
    pagado: false,
    cantidades: {}
  }))
}

watch([dividir, modo, numPersonas], reiniciarPersonas)

function restantes(item) {
  const asignadas = personas.value.reduce((sum, p) => sum + (p.cantidades[item.id] || 0), 0)
  return item.cantidad - asignadas
}

function totalDeProductos(persona) {
  return items.value.reduce(
    (sum, it) => sum + (persona.cantidades[it.id] || 0) * it.precio_unitario,
    0
  )
}

function ajustar(persona, item, delta) {
  const nueva = (persona.cantidades[item.id] || 0) + delta
  if (nueva < 0) return
  if (delta > 0 && restantes(item) <= 0) return
  persona.cantidades[item.id] = nueva
}

const partes = computed(() => {
  const n = numPersonas.value
  const base = Math.floor(total.value / n)
  const resto = total.value - base * n
  return Array.from({ length: n }, (_, i) => base + (i < resto ? 1 : 0))
})

const montos = computed(() =>
  modo.value === 'iguales' ? partes.value : personas.value.map(totalDeProductos)
)

const hayPagos = computed(() => personas.value.some((p) => p.pagado))

const totalPagado = computed(() =>
  personas.value.reduce((sum, p, i) => sum + (p.pagado ? montos.value[i] || 0 : 0), 0)
)

const unidadesSinAsignar = computed(() =>
  items.value.reduce((sum, it) => sum + restantes(it), 0)
)

const puedeCobrar = computed(() => {
  if (!metodoPago.value) return false
  if (!dividir.value) return true
  if (personas.value.length !== numPersonas.value) return false
  if (modo.value === 'productos' && unidadesSinAsignar.value > 0) return false
  return personas.value.every((p, i) => p.pagado || montos.value[i] === 0)
})

function confirmarCobro() {
  if (!orden.value || !puedeCobrar.value) return
  const metodo = METODOS_PAGO.find((m) => m.valor === metodoPago.value)
  $q.dialog({
    title: 'Confirmar cobro',
    message: `¿Confirmas el cobro de ${formatoMoneda(total.value)} en ${metodo?.etiqueta || metodoPago.value} y liberar la Mesa ${mesa.value.numero}?`,
    cancel: { label: 'Volver', flat: true },
    ok: { label: 'Si, cobrar', color: 'positive', flat: true },
    persistent: true
  }).onOk(cobrar)
}

function cobrar() {
  if (!orden.value || !puedeCobrar.value) return
  ordenesStore.cobrarYLiberar(orden.value.id)
  $q.notify({ type: 'positive', message: `Mesa ${mesa.value.numero} cobrada y liberada` })
  router.push('/')
}

function formatoMoneda(valor) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor || 0)
}
</script>

<style scoped>
.cobro-container {
  max-width: 560px;
  margin: 0 auto;
}

.metodo-pago-card {
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.1s ease;
}

.metodo-pago-card:hover {
  transform: translateY(-1px);
}

.metodo-pago-card--activo {
  border-color: var(--q-primary);
  border-width: 2px;
  background: rgba(25, 118, 210, 0.06);
}

.dividir-centro {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.personas-lista {
  width: 100%;
}

.persona-card,
.persona-expansion {
  width: 100%;
  max-width: 420px;
}

.persona-card--pagada {
  background: rgba(46, 125, 91, 0.08);
  border-color: #2e7d5b;
}
</style>
