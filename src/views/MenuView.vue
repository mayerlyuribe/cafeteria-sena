<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h5 page-title">Menu (admin)</div>
      <q-space />
      <q-btn color="primary" icon="add" label="Nuevo producto" @click="abrirDialogoNuevo" />
    </div>

    <div v-for="(prods, categoria) in productosStore.porCategoria" :key="categoria" class="q-mb-lg">
      <div class="text-subtitle1 text-weight-bold q-mb-sm">{{ categoria }}</div>
      <q-list bordered separator>
        <q-item v-for="p in prods" :key="p.id">
          <q-item-section>
            <q-item-label>{{ p.nombre }}</q-item-label>
            <q-item-label caption>{{ formatoMoneda(p.precio_actual) }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <div class="row items-center q-gutter-sm">
              <q-toggle
              color="positive"
                :model-value="p.disponible"
                @update:model-value="productosStore.toggleDisponibilidad(p.id)"
                
              />
              <q-btn dense flat round icon="edit" @click="abrirDialogoEditar(p)" />
              <q-btn dense flat round icon="delete" color="negative" @click="eliminar(p)" />
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <q-banner v-if="!productosStore.productos.length" class="bg-grey-2 text-center">
      No hay productos registrados todavia.
    </q-banner>

    <q-dialog v-model="dialogoAbierto" persistent>
      <q-card style="width: 380px; max-width: 90vw">
        <q-card-section class="text-h6">
          {{ editando ? 'Editar producto' : 'Nuevo producto' }}
        </q-card-section>
        <q-card-section class="q-gutter-sm">
          <q-input v-model="form.nombre" label="Nombre" dense autofocus />
          <q-select
            v-model="form.categoria"
            label="Categoria"
            dense
            use-input
            new-value-mode="add-unique"
            :options="categoriasDisponibles"
            @new-value="crearCategoria"
          />
          <q-input v-model.number="form.precio_actual" type="number" label="Precio" dense prefix="$" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat color="primary" label="Guardar" @click="guardar" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useProductosStore, CATEGORIA_MENU } from '../stores/stores.js'
import { formatoMoneda } from '../stores/utils.js'

const $q = useQuasar()
const productosStore = useProductosStore()

const dialogoAbierto = ref(false)
const editando = ref(null)
const form = ref({ nombre: '', categoria: '', precio_actual: null })

const categoriasDisponibles = ref(CATEGORIA_MENU)


function crearCategoria(val, done) {
  done(val, 'add-unique')
}

function abrirDialogoNuevo() {
  editando.value = null
  form.value = { nombre: '', categoria: '', precio_actual: null }
  dialogoAbierto.value = true
}

function abrirDialogoEditar(producto) {
  editando.value = producto.id
  form.value = { ...producto }
  dialogoAbierto.value = true
}

function guardar() {
  if (!form.value.nombre || !form.value.categoria || !form.value.precio_actual) {
    $q.notify({ type: 'negative', message: 'Debes completar nombre, categoria y precio.' })
    return
  }
  if (form.value.precio_actual <= 0) {
    $q.notify({ type: 'negative', message: 'El precio debe ser mayor a cero.' })
    return
  }
  const estabaEditando = !!editando.value
  if (estabaEditando) {
    productosStore.editarProducto(editando.value, form.value)
  } else {
    productosStore.agregarProducto(form.value)
  }
  dialogoAbierto.value = false
  $q.notify({ type: 'positive', message: estabaEditando ? 'Producto actualizado' : 'Producto agregado' })
}

function eliminar(producto) {
  $q.dialog({
    title: 'Eliminar producto',
    message: `¿Seguro que quieres eliminar "${producto.nombre}"?`,
    cancel: { label: 'Volver', flat: true },
    ok: { label: 'Si, eliminar', color: 'negative', flat: true },
    persistent: true
  }).onOk(() => {
    productosStore.eliminarProducto(producto.id)
  })
}


</script>
