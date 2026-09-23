import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { siguienteId } from './utils.js'

export const CATEGORIA_MENU = ['Bebidas', 'Comidas', 'Postres']

function normalizarCategoria(categoria) {
    const limpio = (categoria || '').trim()
    const encontrada = CATEGORIA_MENU.find(
        (c) => c.toLowerCase() == limpio.toLowerCase()
    )
    return encontrada || limpio
}

export const useProductosStore = defineStore('productos', () => {
    const productos = ref([
        { id: 1, nombre: 'Cafe americano', categoria: 'Bebidas', precio_actual: 3500, disponible: true },
        { id: 2, nombre: 'Limonada de coco', categoria: 'Bebidas', precio_actual: 6000, disponible: true },
        { id: 3, nombre: 'Arepa con queso', categoria: 'Comidas', precio_actual: 5000, disponible: true },
        { id: 4, nombre: 'Bandeja paisa', categoria: 'Comidas', precio_actual: 22000, disponible: true },
        { id: 5, nombre: 'Tres leches', categoria: 'Postres', precio_actual: 8000, disponible: false },
        { id: 6, nombre: 'arro com chicle', categoria: 'Comidas', precio_actual: 15000, disponible: false }
    ])

    const disponibles = computed(() => productos.value.filter((p) => p.disponible))

    const porCategoria = computed(() => {
        const grupos = {}

        CATEGORIA_MENU.forEach((c) => { grupos[c] = [] })

        for (const p of productos.value) {
            const cat = normalizarCategoria(p.categoria)
            if (!grupos[cat]) grupos[cat] = []
            grupos[cat].push(p)
        }
        return grupos
    })

    const obtenerPorId = computed(() => (id) => productos.value.find((p) => p.id === id))

    function agregarProducto({ nombre, categoria, precio_actual }) {
        productos.value.push({
            id: siguienteId(productos.value),
            nombre,
            categoria: normalizarCategoria(categoria),
            precio_actual: Number(precio_actual),
            disponible: true
        })
    }

    function editarProducto(id, cambios) {
        const p = productos.value.find((x) => x.id === id)
        if (!p) return
        if (cambios.nombre !== undefined) p.nombre = cambios.nombre
        if (cambios.categoria !== undefined) p.categoria = normalizarCategoria(cambios.categoria)
        if (cambios.precio_actual !== undefined) p.precio_actual = Number(cambios.precio_actual)
    }

    function toggleDisponibilidad(id) {
        const p = productos.value.find((x) => x.id === id)
        if (p) p.disponible = !p.disponible
    }

    function eliminarProducto(id) {
        productos.value = productos.value.filter((p) => p.id !== id)
    }

    return {
        productos, disponibles, porCategoria, obtenerPorId,
        agregarProducto, editarProducto, toggleDisponibilidad, eliminarProducto
    }
}, {
    persist: true
})