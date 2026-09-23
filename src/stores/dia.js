import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useOrdenesStore } from './ordenes.js'
import { siguienteId } from './utils.js'

export const useDiaStore = defineStore('dia', () => {
    const diaCerrado = ref(false)
    const fechaInicioDia = ref(new Date().toISOString().slice(0, 10))
    const cierres = ref([])

    const resumenDelDia = computed(() => {
        const ordenesStore = useOrdenesStore()
        const cerradas = ordenesStore.ordenesCerradas

        const totalRecaudado = cerradas.reduce((sum, o) => sum + o.total_final, 0)
        const mesasAtendidas = new Set(cerradas.map((o) => o.mesa_id)).size
        const ticketPromedio = cerradas.length ? totalRecaudado / cerradas.length : 0

        const conteoProductos = {}
        for (const orden of cerradas) {
            const items = ordenesStore.itemsDeOrden(orden.id)
            for (const it of items) {
                conteoProductos[it.nombre_producto] = (conteoProductos[it.nombre_producto] || 0) + it.cantidad
            }
        }
        let productoMasVendido = null
        let maxCantidad = 0
        for (const [nombre, cantidad] of Object.entries(conteoProductos)) {
            if (cantidad > maxCantidad) {
                maxCantidad = cantidad
                productoMasVendido = nombre
            }
        }

        return { totalRecaudado, mesasAtendidas, ticketPromedio, productoMasVendido, cantidadOrdenes: cerradas.length }
    })

    function cerrarDia() {
        const ordenesStore = useOrdenesStore()
        const resumen = resumenDelDia.value
        const ordenesDelDia = ordenesStore.archivarOrdenesDelDia()

        cierres.value.unshift({
            id: siguienteId(cierres.value),
            fecha: fechaInicioDia.value,
            ...resumen,
            ordenes: ordenesDelDia
        })
        diaCerrado.value = true
    }

    function iniciarNuevoDia() {
        diaCerrado.value = false
        fechaInicioDia.value = new Date().toISOString().slice(0, 10)
    }

    return {
        diaCerrado, fechaInicioDia, cierres,
        resumenDelDia, cerrarDia, iniciarNuevoDia
    }
}, {
    persist: true
})
