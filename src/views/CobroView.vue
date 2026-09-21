<template>
  <q-page class="q-pa-md flex flex-center" v-if="!mesa">
    <div class="text-grey">Mesa no encontrada.</div>
  </q-page>

  <q-page class="q-pa-md" v-else>
    <div class="row items-center q-mb-md">
      <q-btn flat round dense icon="arrow_back"
        @click="$router.push({ name: 'orden-mesa', params: { id: mesa.id } })" />
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

    <q-card flat bordered class="q-mb-md" style="max-width: 560px">
  <q-card-section class="row items-center">
    <div class="text-subtitle1 text-weight-bold">Dividir cuenta</div>
    <q-space />
    <q-toggle v-model="dividir" />
  </q-card-section>

  <template v-if="dividir">
    <q-separator />

    <q-card-section>
      <q-btn-toggle
        v-model="modo"
        no-caps
        unelevated
        spread
        toggle-color="primary"
        :disable="hayPagos"
        :options="[
          { label: 'Por producto', value: 'productos' },
          { label: 'Partes iguales', value: 'iguales' }
        ]"
      />
    </q-card-section>

    <q-separator />

    <q-card-section class="row items-center">
      <div>Personas</div>
      <q-space />
      <div class="row items-center q-gutter-xs">
        <q-btn
          dense round flat icon="remove" size="sm"
          :disable="numPersonas <= 2 || hayPagos"
          @click="numPersonas--"
        />
        <div class="text-body1" style="min-width: 24px; text-align: center">{{ numPersonas }}</div>
        <q-btn
          dense round flat icon="add" size="sm"
          :disable="numPersonas >= CAPACIDAD_MAXIMA_UNION || hayPagos"
          @click="numPersonas++"
        />
      </div>
    </q-card-section>

    <q-separator />

    <q-list v-if="modo === 'iguales'" separator>
      <q-item v-for="(persona, i) in personas" :key="i">
        <q-item-section>
          <q-checkbox v-model="persona.pagado" color="positive" :label="`Persona ${i + 1}`" />
        </q-item-section>
        <q-item-section side class="text-weight-bold">
          {{ formatoMoneda(montos[i]) }}
        </q-item-section>
      </q-item>
    </q-list>

    <q-list v-else separator>
      <q-expansion-item
        v-for="(persona, i) in personas"
        :key="i"
        group="personas"
        expand-separator
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
          <q-item-section>Persona {{ i + 1 }}</q-item-section>
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
    </q-list>

    <q-separator />

    <q-card-section class="text-caption">
      <div v-if="modo === 'productos' && unidadesSinAsignar > 0" class="text-negative q-mb-xs">
        Faltan {{ unidadesSinAsignar }} productos por asignar a alguien.
      </div>
      <div class="row items-center">
        <div>Pagado: {{ formatoMoneda(totalPagado) }}</div>
        <q-space />
        <div>Falta: {{ formatoMoneda(total - totalPagado) }}</div>
      </div>
    </q-card-section>
  </template>
</q-card>

    <q-btn color="positive" icon="payments" label="Cobrar y liberar mesa" size="lg" style="max-width: 560px"
      class="full-width" :disable="!puedeCobrar" @click="cobrar" />
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
  if (!dividir.value) return true
  if (personas.value.length !== numPersonas.value) return false
  if (modo.value === 'productos' && unidadesSinAsignar.value > 0) return false
  return personas.value.every((p, i) => p.pagado || montos.value[i] === 0)
})

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
