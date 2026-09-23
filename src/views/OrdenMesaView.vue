<template>
  <q-page class="q-pa-md" style="padding-bottom: 90px">
    <div class="orden-container">
      <div v-if="!mesa" class="text-center text-grey q-mt-xl">Mesa no encontrada.</div>

      <template v-else>
        <div class="row items-center q-mb-md">
          <q-btn flat round dense icon="arrow_back" @click="$router.push('/')" />
          <div class="text-h5 page-title q-ml-sm">Mesa {{ mesa.numero }}</div>
          <q-badge :color="orden ? 'negative' : 'positive'" class="q-ml-md">
            {{ orden ? '🔴 Ocupada' : '🟢 Libre' }}
          </q-badge>
          <q-space />
          <div v-if="orden" class="text-caption text-grey-7">
            Abierta: {{ formatearHora(orden?.hora_apertura) }}
          </div>
        </div>

        <q-card v-if="!orden" flat bordered class="q-pa-lg text-center">
          <div class="text-subtitle1 q-mb-md">Esta mesa esta libre.</div>
          <q-btn color="primary" icon="event_seat" label="Ocupar mesa" @click="ocuparMesa" />
        </q-card>

        <q-card v-if="orden" flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-subtitle1 text-weight-bold q-mb-sm">Consumo actual</div>

            <q-list separator v-if="items.length">
              <q-item v-for="item in items" :key="item.id">
                <q-item-section>
                  <q-item-label>{{ item.nombre_producto }}</q-item-label>
                  <q-item-label caption>
                    {{ formatoMoneda(item.precio_unitario) }} c/u
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row items-center q-gutter-xs">
                    <q-btn dense round flat icon="remove" size="sm"
                      @click="ordenesStore.cambiarCantidad(item.id, item.cantidad - 1)" />
                    <div class="text-body1" style="min-width: 24px; text-align: center">
                      {{ item.cantidad }}
                    </div>
                    <q-btn dense round flat icon="add" size="sm"
                      @click="ordenesStore.cambiarCantidad(item.id, item.cantidad + 1)" />
                    <div class="text-weight-bold q-ml-sm" style="min-width: 80px; text-align: right">
                      {{ formatoMoneda(item.precio_unitario * item.cantidad) }}
                    </div>
                    <q-btn dense round flat icon="delete" size="sm" color="negative"
                      @click="ordenesStore.quitarItem(item.id)" />
                  </div>
                </q-item-section>
              </q-item>
            </q-list>

            <div v-else class="text-grey text-center q-pa-md">
              Aun no se ha agregado ningun producto.
            </div>
          </q-card-section>
        </q-card>

        <q-btn v-if="orden" color="primary" icon="add" label="Agregar producto" class="full-width"
          @click="dialogoAgregar = true" />
        <q-btn v-if="orden" outline color="negative" icon="cancel" label="Cancelar mesa" class="full-width q-mt-sm"
          @click="dialogoCancelar = true" />
      </template>
    </div>

    <q-page-sticky v-if="orden" position="bottom" expand>
      <q-toolbar class="bg-white subtotal-bar q-pa-md orden-container" style="border-top: 1px solid #eee">
        <div class="text-h6">Subtotal: {{ formatoMoneda(subtotal) }}</div>
        <q-space />
        <q-btn color="warning" text-color="dark" icon="receipt_long" label="Pedir la cuenta" :disable="!items.length"
          @click="pedirCuenta" />
      </q-toolbar>
    </q-page-sticky>

    <q-dialog v-model="dialogoCancelar">
      <q-card style="width: 380px; max-width: 90vw">
        <q-card-section class="text-h6">Cancelar mesa {{ mesa?.numero }}</q-card-section>
        <q-card-section>
          <span v-if="items.length">
            Se eliminara la orden con {{ items.length }} producto(s) ({{ formatoMoneda(subtotal) }}) y la mesa
            quedara libre. Esto no se puede deshacer.
          </span>
          <span v-else>La mesa quedara libre.</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Volver" v-close-popup />
          <q-btn flat color="negative" label="Si, cancelar" @click="cancelarMesa" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="dialogoAgregar" persistent>
      <q-card style="width: 420px; max-width: 90vw">
        <q-card-section class="text-h6">Agregar producto</q-card-section>
        <q-card-section>
          <div v-for="(prods, categoria) in productosStore.porCategoria" :key="categoria" class="q-mb-md">
            <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">
              {{ categoria.toUpperCase() }}
            </div>
            <q-list separator>
              <q-item v-for="p in prods.filter((x) => x.disponible)" :key="p.id" clickable v-ripple @click="agregar(p)">
                <q-item-section>
                  <q-item-label>{{ p.nombre }}</q-item-label>
                </q-item-section>
                <q-item-section side>{{ formatoMoneda(p.precio_actual) }}</q-item-section>
              </q-item>
            </q-list>
            <div v-if="!prods.some((x) => x.disponible)" class="text-caption text-grey-5 q-pa-sm">
              Sin productos disponibles en esta categoria.
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cerrar" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useMesasStore, useOrdenesStore, useProductosStore, useDiaStore, useAuthStore } from '../stores/stores.js'
import { formatoMoneda, formatearHora} from '../stores/utils.js'
const props = defineProps({ id: { type: [String, Number], required: true } })

const router = useRouter()
const $q = useQuasar()

const mesasStore = useMesasStore()
const ordenesStore = useOrdenesStore()
const productosStore = useProductosStore()
const diaStore = useDiaStore()
const authStore = useAuthStore()

const dialogoAgregar = ref(false)
const dialogoCancelar = ref(false)

const mesa = computed(() => mesasStore.obtenerPorId(props.id))
const orden = computed(() => ordenesStore.ordenAbiertaDeMesa(props.id))
const items = computed(() => (orden.value ? ordenesStore.itemsDeOrden(orden.value.id) : []))
const subtotal = computed(() => (orden.value ? ordenesStore.subtotalDeOrden(orden.value.id) : 0))

function ocuparMesa() {
  if (diaStore.diaCerrado) {
    $q.notify({ type: 'negative', message: 'El dia esta cerrado. No se pueden abrir nuevas ordenes.' })
    return
  }
  ordenesStore.abrirOrden(mesa.value.id, authStore.currentUser?.nombre)
  $q.notify({ type: 'positive', message: `Mesa ${mesa.value.numero} ocupada`, timeout: 900 })
}

function cancelarMesa() {
  if (!orden.value) return
  const numero = mesa.value.numero
  ordenesStore.cancelarOrden(orden.value.id)
  $q.notify({ type: 'info', message: `Mesa ${numero} cancelada y liberada` })
  router.push('/')
}

function agregar(producto) {
  if (!orden.value) return
  ordenesStore.agregarItem(orden.value.id, producto, 1)
  $q.notify({ type: 'positive', message: `${producto.nombre} agregado`, timeout: 900 })
}

function pedirCuenta() {
  if (!orden.value) return
  ordenesStore.pedirCuenta(orden.value.id)
  router.push({ name: 'cobro', params: { id: mesa.value.id } })
}


</script>

<style scoped>
.orden-container {
  max-width: 560px;
  margin: 0 auto;
}
</style>
