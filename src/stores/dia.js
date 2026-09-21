import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useOrdenesStore } from './ordenes.js'
import { siguienteId } from './utils.js'

export const useDiaStore = defineStore('dia', () => {
    const diaCerrado = ref(false)
    const fechaInicioDia = ref(new Date().toISOString().slice(0, 10))
    const abierto_por = ref(null)
    const cerrado_por = ref(null)
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

    function cerrarDia(nombreUsuario) {
        const resumen = resumenDelDia.value
        cerrado_por.value = nombreUsuario || null
        cierres.value.unshift({
            id: siguienteId(cierres.value),
            fecha: fechaInicioDia.value,
            abierto_por: abierto_por.value,
            cerrado_por: cerrado_por.value,
            ...resumen
        })
        diaCerrado.value = true
    }

    function iniciarNuevoDia(nombreUsuario) {
        diaCerrado.value = false
        fechaInicioDia.value = new Date().toISOString().slice(0, 10)
        abierto_por.value = nombreUsuario || null
        cerrado_por.value = null
    }

    return {
        diaCerrado, fechaInicioDia, abierto_por, cerrado_por, cierres,
        resumenDelDia, cerrarDia, iniciarNuevoDia
    }
}, {
    persist: true
})