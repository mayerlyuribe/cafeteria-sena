import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useOrdenesStore, ESTADOS_ORDEN } from './ordenes.js'
import { useMesasStore } from './mesas.js'
import { siguienteId } from './utils.js'

export const useDiaStore = defineStore('dia', () => {
    const diaCerrado = ref(false)
    const fechaInicioDia = ref(new Date().toISOString().slice(0, 10))
    const cierres = ref([])

    const ordenesAbiertas = computed(() =>
        useOrdenesStore().ordenes.filter((o) => o.estado === ESTADOS_ORDEN.ABIERTA)
    )

    const resumenDelDia = computed(() => {
        const ordenesStore = useOrdenesStore()
        const cerradas = ordenesStore.ordenesCerradas
        const abiertas = ordenesAbiertas.value

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

        return {
            totalRecaudado,
            mesasAtendidas,
            ticketPromedio,
            productoMasVendido,
            cantidadOrdenes: cerradas.length,
            ordenesAbiertas: abiertas.length,
            totalAbiertas: abiertas.reduce((sum, o) => sum + ordenesStore.subtotalDeOrden(o.id), 0)
        }
    })

    function cerrarDia() {
        const ordenesStore = useOrdenesStore()
        const mesasStore = useMesasStore()
        const resumen = resumenDelDia.value
        const ordenesDelDia = ordenesStore.archivarOrdenesDelDia()

        // Las reservas resueltas durante el dia se guardan en el historial
        // de mesas. Se capturan aca y luego se limpia para el dia siguiente.
        const reservasDelDia = [...mesasStore.historialReservas]

        // Se cancelan las ordenes que quedaron abiertas (sin cobrar) para que
        // las mesas no queden atascadas al iniciar un nuevo dia.
        ordenesStore.cancelarOrdenesAbiertas()

        cierres.value.unshift({
            id: siguienteId(cierres.value),
            fecha: fechaInicioDia.value,
            ...resumen,
            ordenes: ordenesDelDia,
            reservas: reservasDelDia
        })
        mesasStore.limpiarHistorialReservas()
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
    persist: {
        storage: localStorage
    }
})
