<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md q-gutter-sm">
      <div class="text-h5 page-title">Mapa del local</div>
      <q-space />
      <q-btn
        :label="modoUnion ? 'Cancelar union' : 'Unir mesas'"
        :color="modoUnion ? 'negative' : 'info'"
        :icon="modoUnion ? 'close' : 'call_merge'"
        dense
        @click="toggleModoUnion"
      />
    </div>

    <q-banner v-if="modoUnion" class="bg-blue-1 q-mb-md" rounded>
      Selecciona 2 o mas mesas libres para unir (maximo {{ CAPACIDAD_MAXIMA_UNION }} personas en total).
      Llevas seleccionadas <strong>{{ capacidadSeleccionada }}</strong> personas.
      <template #action>
        <q-btn
          flat
          color="primary"
          label="Confirmar union"
          :disable="mesasSeleccionadas.length < 2"
          @click="confirmarUnion"
        />
      </template>
    </q-banner>

    <q-banner v-if="diaStore.diaCerrado" class="bg-negative text-white q-mb-md" rounded>
      <template #avatar><q-icon name="lock" /></template>
      El dia esta cerrado. No se pueden abrir nuevas ordenes hasta iniciar un nuevo dia
      desde <strong>Cierre del dia</strong>.
    </q-banner>

    <div class="row q-col-gutter-md">
      <div
        v-for="mesa in mesasStore.mesasVisibles"
        :key="mesa.id"
        class="col-6 col-sm-4 col-md-3"
      >
        <q-card
          flat
          bordered
          class="mesa-card"
          :class="[
            `estado-${mesa.estado}`,
            { 'mesa-card--disabled': mesa.estado === 'libre' && diaStore.diaCerrado },
            { 'mesa-card--agendada': mesa.agendada },
            { 'mesa-card--seleccionada': mesaEstaSeleccionada(mesa.id) }
          ]"
          @click="alClickearMesa(mesa)"
        >
          <q-card-section class="text-center">
            <q-checkbox
              v-if="modoUnion && mesa.estado === 'libre'"
              class="mesa-checkbox"
              :model-value="mesaEstaSeleccionada(mesa.id)"
              @update:model-value="toggleSeleccion(mesa)"
              @click.stop
            />
            <svg viewBox="0 0 100 100" width="72" height="72" role="img" :aria-label="`Mesa ${mesa.numero}, ${mesa.estado}`">
              <rect
                v-for="(pos, i) in sillasDeMesa(mesa.capacidad)"
                :key="i"
                :x="pos.x - 6"
                :y="pos.y - 6"
                width="12"
                height="12"
                rx="3"
                :fill="colorDeMesa(mesa.estado)"
                opacity="0.85"
              />
              <rect x="28" y="28" width="44" height="44" rx="10" :fill="colorDeMesa(mesa.estado)" stroke="white" stroke-width="2.5" />
              <text
                x="50"
                y="56"
                text-anchor="middle"
                font-size="20"
                font-weight="700"
                fill="white"
                font-family="Roboto, sans-serif"
              >
                {{ mesa.numero }}
              </text>
              <g v-if="mesa.agendada" transform="translate(72, 2)">
                <circle cx="13" cy="13" r="14" fill="#ffffff" stroke="#4A7A9D" stroke-width="1.5" />
                <rect x="6" y="9" width="14" height="11" rx="1.5" fill="none" stroke="#4A7A9D" stroke-width="1.6" />
                <rect x="6" y="9" width="14" height="4" fill="#4A7A9D" />
                <line x1="9.5" y1="6" x2="9.5" y2="11" stroke="#4A7A9D" stroke-width="1.6" stroke-linecap="round" />
                <line x1="16.5" y1="6" x2="16.5" y2="11" stroke="#4A7A9D" stroke-width="1.6" stroke-linecap="round" />
              </g>
            </svg>
            <div class="text-h6 q-mt-xs">Mesa {{ mesa.numero }}</div>
            <div class="text-caption text-grey-8">
              <q-icon name="people" size="16px" /> {{ mesa.capacidad }} personas
            </div>
            <q-badge :color="colorEstado(mesa.estado)" class="q-mt-xs">
              {{ textoEstado(mesa.estado) }}
            </q-badge>

            <div v-if="mesa.agendada" class="text-caption text-info q-mt-xs">
              <q-icon name="event" size="14px" />
              Agendada{{ mesa.agenda_info?.hora ? ` · ${mesa.agenda_info.hora}` : '' }}
              <span v-if="mesa.agenda_info?.cliente"> · {{ mesa.agenda_info.cliente }}</span>
            </div>

            <div v-if="mesa.es_host_union" class="text-caption text-info q-mt-xs">
              <q-icon name="call_merge" size="14px" />
              Union de {{ 1 + mesa.mesas_unidas.length }} mesas
            </div>

            <div class="q-mt-sm" @click.stop>
              <q-btn
                v-if="mesa.estado === 'libre' && !mesa.agendada && !modoUnion"
                dense
                flat
                size="sm"
                icon="event"
                label="Agendar"
                color="info"
                @click="abrirDialogoAgenda(mesa)"
              />
              <q-btn
                v-else-if="mesa.estado === 'libre' && mesa.agendada && !modoUnion"
                dense
                flat
                size="sm"
                icon="event_busy"
                label="Cancelar agenda"
                color="negative"
                @click="mesasStore.cancelarAgenda(mesa.id)"
              />

              <template v-if="mesa.estado === 'libre' && !modoUnion">
                <q-btn dense flat round size="sm" icon="edit" color="grey-8" @click="abrirDialogoEditar(mesa)">
                  <q-tooltip>Editar mesa</q-tooltip>
                </q-btn>
                <q-btn dense flat round size="sm" icon="delete" color="negative" @click="confirmarEliminar(mesa)">
                  <q-tooltip>Eliminar mesa</q-tooltip>
                </q-btn>
              </template>

              <q-btn
                v-if="mesa.es_host_union"
                dense
                flat
                size="sm"
                icon="call_split"
                label="Separar mesas"
                color="warning"
                @click="mesasStore.separarUnion(mesa.id)"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-6 col-sm-4 col-md-3">
        <q-card
          flat
          bordered
          class="mesa-card flex flex-center"
          style="min-height: 140px; border-style: dashed"
          @click="dialogoNuevaMesa = true"
        >
          <q-icon name="add" size="32px" color="grey-6" />
        </q-card>
      </div>
    </div>

    <q-dialog v-model="dialogoAgenda">
      <q-card style="width: 340px">
        <q-card-section class="text-h6">
          Agendar Mesa {{ mesaAAgendar?.numero }}
        </q-card-section>
        <q-card-section class="q-gutter-sm">
          <q-input v-model="agenda.cliente" label="Cliente (opcional)" dense />
          <q-input v-model="agenda.hora" label="Hora (opcional)" dense placeholder="Ej. 7:30 PM" />
          <q-input v-model="agenda.notas" label="Notas (opcional)" dense type="textarea" autogrow />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat color="info" label="Guardar agenda" @click="guardarAgenda" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogoNuevaMesa">
      <q-card style="width: 320px">
        <q-card-section class="text-h6">Nueva mesa</q-card-section>
        <q-card-section class="q-gutter-sm">
          <q-input v-model.number="nuevaMesa.numero" type="number" label="Numero de mesa" dense />
          <q-input
            v-model.number="nuevaMesa.capacidad"
            type="number"
            label="Capacidad"
            :max="CAPACIDAD_MAXIMA_MESA"
            min="1"
            dense
            :hint="`Maximo ${CAPACIDAD_MAXIMA_MESA} personas por mesa`"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat color="primary" label="Crear" @click="crearMesa" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogoEditar">
      <q-card style="width: 320px">
        <q-card-section class="text-h6">Editar mesa {{ mesaAEditar?.numero }}</q-card-section>
        <q-card-section class="q-gutter-sm">
          <q-input v-model.number="mesaEditada.numero" type="number" label="Numero de mesa" dense />
          <q-input
            v-model.number="mesaEditada.capacidad"
            type="number"
            label="Capacidad"
            :max="CAPACIDAD_MAXIMA_MESA"
            min="1"
            dense
            :hint="`Maximo ${CAPACIDAD_MAXIMA_MESA} personas por mesa`"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat color="primary" label="Guardar" @click="guardarEdicion" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import {
  useMesasStore,
  useDiaStore,
  CAPACIDAD_MAXIMA_MESA,
  CAPACIDAD_MAXIMA_UNION
} from '../stores/stores.js'

const router = useRouter()
const $q = useQuasar()

const mesasStore = useMesasStore()
const diaStore = useDiaStore()

const dialogoNuevaMesa = ref(false)
const nuevaMesa = ref({ numero: null, capacidad: 2 })

const dialogoAgenda = ref(false)
const mesaAAgendar = ref(null)
const agenda = ref({ cliente: '', hora: '', notas: '' })

/* ---------------------- Editar mesa -------------------- */
const dialogoEditar = ref(false)
const mesaAEditar = ref(null)
const mesaEditada = ref({ numero: null, capacidad: null })

function abrirDialogoEditar(mesa) {
  mesaAEditar.value = mesa
  mesaEditada.value = { numero: mesa.numero, capacidad: mesa.capacidad }
  dialogoEditar.value = true
}

function guardarEdicion() {
  const resultado = mesasStore.editarMesa(mesaAEditar.value.id, mesaEditada.value)
  if (!resultado.ok) {
    $q.notify({ type: 'negative', message: resultado.mensaje })
    return
  }
  dialogoEditar.value = false
  $q.notify({ type: 'positive', message: 'Mesa actualizada' })
}

/* ---------------------- Eliminar mesa ---------------------- */
function confirmarEliminar(mesa) {
  $q.dialog({
    title: 'Eliminar mesa',
    message: `¿Seguro que quieres eliminar la Mesa ${mesa.numero}?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    const resultado = mesasStore.eliminarMesa(mesa.id)
    if (!resultado.ok) {
      $q.notify({ type: 'negative', message: resultado.mensaje })
      return
    }
    $q.notify({ type: 'positive', message: 'Mesa eliminada' })
  })
}

/* ---------------------- Unir mesas ---------------------- */
const modoUnion = ref(false)
const mesasSeleccionadas = ref([])

const capacidadSeleccionada = computed(() =>
  mesasSeleccionadas.value.reduce((sum, m) => sum + m.capacidad_base, 0)
)

function toggleModoUnion() {
  modoUnion.value = !modoUnion.value
  mesasSeleccionadas.value = []
}

function mesaEstaSeleccionada(mesaId) {
  return mesasSeleccionadas.value.some((m) => m.id === mesaId)
}

function toggleSeleccion(mesa) {
  if (mesaEstaSeleccionada(mesa.id)) {
    mesasSeleccionadas.value = mesasSeleccionadas.value.filter((m) => m.id !== mesa.id)
    return
  }
  if (capacidadSeleccionada.value + mesa.capacidad_base > CAPACIDAD_MAXIMA_UNION) {
    $q.notify({ type: 'negative', message: `No puedes superar ${CAPACIDAD_MAXIMA_UNION} personas al unir mesas.` })
    return
  }
  mesasSeleccionadas.value.push(mesa)
}

function confirmarUnion() {
  const ids = mesasSeleccionadas.value.map((m) => m.id)
  const resultado = mesasStore.unirMesas(ids)
  if (!resultado.ok) {
    $q.notify({ type: 'negative', message: resultado.mensaje })
    return
  }
  $q.notify({ type: 'positive', message: 'Mesas unidas correctamente' })
  modoUnion.value = false
  mesasSeleccionadas.value = []
}

function alClickearMesa(mesa) {
  if (modoUnion.value) {
    if (mesa.estado !== 'libre') {
      $q.notify({ type: 'warning', message: 'Solo puedes unir mesas libres.' })
      return
    }
    toggleSeleccion(mesa)
    return
  }
  if (mesa.estado === 'unida') {
    const host = mesasStore.mesas.find((m) => m.union_id === mesa.union_id && m.es_host_union)
    $q.notify({ type: 'info', message: host ? `Esta mesa esta unida a la Mesa ${host.numero}.` : 'Esta mesa esta unida a otra.' })
    return
  }
  irAMesa(mesa)
}

function abrirDialogoAgenda(mesa) {
  mesaAAgendar.value = mesa
  agenda.value = { cliente: '', hora: '', notas: '' }
  dialogoAgenda.value = true
}

function guardarAgenda() {
  if (!mesaAAgendar.value) return
  mesasStore.agendarMesa(mesaAAgendar.value.id, { ...agenda.value })
  $q.notify({ type: 'info', message: `Mesa ${mesaAAgendar.value.numero} agendada` })
}

const COLORES_MESA = {
  libre: '#2E7D5B',
  ocupada: '#C0392B',
  por_cobrar: '#E0A537',
  unida: '#9E9E9E'
}

function colorDeMesa(estado) {
  return COLORES_MESA[estado] || '#9E9E9E'
}

function sillasDeMesa(capacidad) {
  const n = Math.min(Math.max(capacidad, 1), 8)
  const radio = 40
  const centro = 50
  const puntos = []
  for (let i = 0; i < n; i++) {
    const angulo = (2 * Math.PI * i) / n - Math.PI / 2
    puntos.push({
      x: centro + radio * Math.cos(angulo),
      y: centro + radio * Math.sin(angulo)
    })
  }
  return puntos
}

function colorEstado(estado) {
  if (estado === 'libre') return 'positive'
  if (estado === 'ocupada') return 'negative'
  if (estado === 'unida') return 'grey-7'
  return 'warning'
}

function textoEstado(estado) {
  if (estado === 'libre') return 'Libre'
  if (estado === 'ocupada') return 'Ocupada'
  if (estado === 'unida') return 'Unida'
  return 'Por cobrar'
}

function irAMesa(mesa) {
  if (mesa.estado === 'libre') {
    if (diaStore.diaCerrado) {
      $q.notify({ type: 'negative', message: 'El dia esta cerrado. No se pueden abrir nuevas ordenes.' })
      return
    }
    router.push({ name: 'orden-mesa', params: { id: mesa.id } })
    return
  }

  if (mesa.estado === 'ocupada') {
    router.push({ name: 'orden-mesa', params: { id: mesa.id } })
    return
  }

  router.push({ name: 'cobro', params: { id: mesa.id } })
}

function crearMesa() {
  const resultado = mesasStore.agregarMesa(nuevaMesa.value)
  if (!resultado.ok) {
    $q.notify({ type: 'negative', message: resultado.mensaje })
    return
  }
  nuevaMesa.value = { numero: null, capacidad: 2 }
  dialogoNuevaMesa.value = false
  $q.notify({ type: 'positive', message: 'Mesa creada' })
}
</script>
