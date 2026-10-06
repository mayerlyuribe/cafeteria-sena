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
        :disable="!cajaStore.abierta"
        @click="abrirDialogoCierre"
      >
        <q-tooltip v-if="!cajaStore.abierta">Abre la caja primero</q-tooltip>
      </q-btn>
      <q-btn
        v-else
        color="primary"
        icon="lock_open"
        label="Iniciar nuevo dia"
        @click="iniciarNuevoDia"
      />
    </div>

    <!-- ---------------------- Apertura de caja ---------------------- -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold q-mb-sm">Apertura de caja</div>
        <div v-if="!cajaStore.abierta" class="row items-center q-gutter-sm">
          <q-input
            v-model="fondoInput"
            type="number"
            outlined
            dense
            label="Fondo inicial"
            prefix="$"
            style="max-width: 220px"
            @keyup.enter="abrirCaja"
          />
          <q-btn color="primary" icon="point_of_sale" label="Abrir caja" @click="abrirCaja" />
        </div>
        <div v-else class="row items-center q-gutter-md">
          <div>
            <div class="text-caption text-grey-7">Fondo inicial</div>
            <div class="text-subtitle1 text-weight-bold">{{ formatoMoneda(cajaStore.fondoInicial) }}</div>
          </div>
          <div>
            <div class="text-caption text-grey-7">Abierta por</div>
            <div class="text-subtitle1">{{ cajaStore.apertura?.usuario || 'Sin registrar' }}</div>
          </div>
          <div>
            <div class="text-caption text-grey-7">Efectivo esperado en caja</div>
            <div class="text-subtitle1 text-weight-bold text-primary">{{ formatoMoneda(cajaStore.esperadoEfectivo) }}</div>
          </div>
        </div>
      </q-card-section>
    </q-card>

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

    <!-- ---------------------- Ventas por metodo de pago ---------------------- -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold q-mb-sm">Ventas por metodo de pago</div>
        <div v-if="metodos.length" class="row q-col-gutter-md">
          <div v-for="m in metodos" :key="m.metodo" class="col-6 col-md-3">
            <q-card flat bordered class="bg-grey-1">
              <q-card-section class="text-center">
                <div class="text-caption text-grey-7">{{ m.metodo }}</div>
                <div class="text-subtitle1 text-weight-bold">{{ formatoMoneda(m.total) }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
        <div v-else class="text-grey text-center q-pa-sm">Aun no hay ventas registradas.</div>
      </q-card-section>
    </q-card>

    <div v-if="resumen.ordenesAbiertas > 0" class="q-mb-lg">
      <q-banner class="bg-orange-1 text-orange-9 rounded-borders">
        <template #avatar>
          <q-icon name="pending" color="orange" />
        </template>
        <div class="text-weight-bold">{{ resumen.ordenesAbiertas }} orden(es) pendiente(s) de cobro</div>
        <div class="text-caption">
          Total en juego: {{ formatoMoneda(resumen.totalAbiertas) }}
        </div>
      </q-banner>
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
        <q-item-section side v-if="orden.metodo_pago || orden.division">
          <div class="text-caption text-grey-7" v-if="orden.metodo_pago">{{ orden.metodo_pago }}</div>
          <div class="text-caption text-grey-7" v-if="orden.division">{{ orden.division }}</div>
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
      <q-card style="min-width: 520px; max-width: 640px">
        <q-card-section class="text-h6">Cerrar el dia</q-card-section>

        <q-stepper v-model="paso" flat animated header-nav>
          <q-step name="resumen" title="Resumen" icon="summarize" :done="paso !== 'resumen'">
            <div class="q-gutter-y-sm">
              <div class="row items-center">
                <div class="text-grey-7">Total recaudado</div>
                <q-space />
                <div class="text-weight-bold">{{ formatoMoneda(resumen.totalRecaudado) }}</div>
              </div>
              <div class="row items-center">
                <div class="text-grey-7">Ordenes cerradas</div>
                <q-space />
                <div class="text-weight-bold">{{ resumen.cantidadOrdenes }}</div>
              </div>
              <div class="row items-center">
                <div class="text-grey-7">Mesas atendidas</div>
                <q-space />
                <div class="text-weight-bold">{{ resumen.mesasAtendidas }}</div>
              </div>
            </div>

            <q-banner v-if="resumen.ordenesAbiertas > 0" class="bg-orange-1 text-orange-9 rounded-borders q-mt-md">
              <template #avatar><q-icon name="warning" color="orange" /></template>
              Hay {{ resumen.ordenesAbiertas }} orden(es) sin cobrar. Al cerrar el dia se archivaran como canceladas y las mesas se liberaran.
            </q-banner>

            <q-input
              v-if="resumen.ordenesAbiertas > 0"
              v-model="motivoCierre"
              class="q-mt-md"
              outlined
              dense
              label="Motivo del cierre con ordenes abiertas"
              hint="Deja constancia de por que se cierra con cuentas pendientes."
            />

            <q-stepper-navigation class="q-mt-md">
              <q-btn color="primary" label="Continuar" @click="paso = 'arqueo'" />
              <q-btn flat label="Cancelar" v-close-popup />
            </q-stepper-navigation>
          </q-step>

          <q-step name="arqueo" title="Arqueo" icon="point_of_sale" :done="paso === 'confirmar'">
            <div class="q-gutter-y-sm">
              <div class="row items-center">
                <div class="text-grey-7">Fondo inicial</div>
                <q-space />
                <div>{{ formatoMoneda(cajaStore.fondoInicial) }}</div>
              </div>
              <div class="row items-center">
                <div class="text-grey-7">Cobrado en efectivo</div>
                <q-space />
                <div>{{ formatoMoneda(cajaStore.efectivoCobrado) }}</div>
              </div>
              <q-separator />
              <div class="row items-center">
                <div class="text-weight-bold">Esperado en caja</div>
                <q-space />
                <div class="text-weight-bold text-primary">{{ formatoMoneda(esperado) }}</div>
              </div>

              <q-input
                v-model="contadoEfectivo"
                type="number"
                outlined
                dense
                label="Efectivo contado"
                prefix="$"
                hint="Ingresa el efectivo fisico que hay en caja en este momento."
              />

              <div class="row items-center">
                <div class="text-weight-bold">Diferencia</div>
                <q-space />
                <div
                  class="text-weight-bold"
                  :class="diferencia === null ? 'text-grey-7' : (diferencia < 0 ? 'text-negative' : (diferencia > 0 ? 'text-warning' : 'text-positive'))"
                >
                  {{ diferencia === null ? '—' : formatoMoneda(diferencia) }}
                </div>
              </div>
            </div>

            <q-stepper-navigation class="q-mt-md">
              <q-btn flat color="primary" label="Volver" @click="paso = 'resumen'" />
              <q-btn color="primary" label="Continuar" @click="paso = 'confirmar'" />
            </q-stepper-navigation>
          </q-step>

          <q-step name="confirmar" title="Confirmar" icon="check_circle">
            <div class="q-gutter-y-sm">
              <div class="text-caption text-grey-7">
                Cierra {{ usuarioActual }}. El historial no se borra y el dia quedara bloqueado para nuevas ordenes.
              </div>
              <q-input
                v-model="observaciones"
                outlined
                type="textarea"
                label="Observaciones (opcional)"
              />
            </div>

            <q-stepper-navigation class="q-mt-md">
              <q-btn flat color="primary" label="Volver" @click="paso = 'arqueo'" />
              <q-btn color="negative" label="Cerrar dia" @click="cerrarDia" />
            </q-stepper-navigation>
          </q-step>
        </q-stepper>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useOrdenesStore, useDiaStore, useMesasStore, useCajaStore, useAuthStore } from '../stores/stores.js'
import { formatoMoneda, formatearHora } from '../stores/utils.js'

const $q = useQuasar()
const ordenesStore = useOrdenesStore()
const diaStore = useDiaStore()
const mesasStore = useMesasStore()
const cajaStore = useCajaStore()
const authStore = useAuthStore()

const confirmarCierre = ref(false)
const paso = ref('resumen')
const fondoInput = ref('')
const contadoEfectivo = ref('')
const observaciones = ref('')
const motivoCierre = ref('')

const resumen = computed(() => diaStore.resumenDelDia)
const esperado = computed(() => cajaStore.esperadoEfectivo)

const usuarioActual = computed(
  () => authStore.currentUser?.nombre || authStore.currentUser?.usuario || 'Sin registrar'
)

const metodos = computed(() =>
  Object.entries(cajaStore.totalesPorMetodo)
    .map(([metodo, total]) => ({ metodo, total }))
    .sort((a, b) => b.total - a.total)
)

const contadoNum = computed(() => {
  const v = Number(contadoEfectivo.value)
  return Number.isFinite(v) && contadoEfectivo.value !== '' && contadoEfectivo.value != null ? v : null
})

const diferencia = computed(() =>
  contadoNum.value === null ? null : contadoNum.value - esperado.value
)

function abrirCaja() {
  const res = cajaStore.abrirCaja({
    monto: fondoInput.value,
    usuario: usuarioActual.value
  })
  if (!res.ok) {
    $q.notify({ type: 'negative', message: res.mensaje })
    return
  }
  fondoInput.value = ''
  $q.notify({ type: 'positive', message: 'Caja abierta con fondo inicial.' })
}

function abrirDialogoCierre() {
  paso.value = 'resumen'
  contadoEfectivo.value = ''
  observaciones.value = ''
  motivoCierre.value = ''
  confirmarCierre.value = true
}

function cerrarDia() {
  if (diaStore.diaCerrado) return
  const res = diaStore.cerrarDia({
    contadoEfectivo: contadoEfectivo.value,
    cerradoPor: usuarioActual.value,
    observaciones: observaciones.value,
    motivoCierre: motivoCierre.value
  })
  if (!res.ok) {
    $q.notify({ type: 'negative', message: res.mensaje })
    return
  }
  confirmarCierre.value = false
  $q.notify({ type: 'positive', message: 'Dia cerrado. Resumen guardado en el historial.' })
}

function iniciarNuevoDia() {
  const res = diaStore.iniciarNuevoDia()
  if (!res.ok) {
    $q.notify({ type: 'negative', message: res.mensaje })
    return
  }
  $q.notify({ type: 'info', message: 'Nuevo dia iniciado. Abre la caja para comenzar.' })
}
</script>
