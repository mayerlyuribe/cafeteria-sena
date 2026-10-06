import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useOrdenesStore, ESTADOS_ORDEN } from './ordenes.js'
import { useMesasStore } from './mesas.js'
import { useCajaStore } from './caja.js'
import { siguienteId, hoyLocal } from './utils.js'

export const useDiaStore = defineStore('dia', () => {
    const diaCerrado = ref(false)
    const fechaInicioDia = ref(hoyLocal())
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

    function cerrarDia(payload = {}) {
        const ordenesStore = useOrdenesStore()
        const mesasStore = useMesasStore()
        const cajaStore = useCajaStore()

        if (diaCerrado.value) {
            return { ok: false, mensaje: 'El dia ya esta cerrado.' }
        }
        if (!cajaStore.abierta) {
            return { ok: false, mensaje: 'Registra el fondo inicial (apertura de caja) antes de cerrar el dia.' }
        }

        // Se capturan los datos del dia antes de archivar/limpiar las listas
        // activas, porque los getters de caja dependen de las ordenes cerradas.
        const resumen = resumenDelDia.value
        const totalesPorMetodo = { ...cajaStore.totalesPorMetodo }
        const fondoInicial = cajaStore.fondoInicial
        const esperadoEfectivo = cajaStore.esperadoEfectivo

        const ordenesDelDia = ordenesStore.archivarOrdenesDelDia()

        // Las ordenes abiertas (sin cobrar) se archivan como canceladas para no
        // perder lo consumido, y las mesas se liberan para el dia siguiente.
        const ordenesCanceladas = ordenesStore.archivarCanceladasAlCierre({
            cancelada_por: payload.cerradoPor || null,
            motivo: payload.motivoCierre || 'Cierre de dia'
        })

        // Las reservas resueltas durante el dia se guardan en el historial.
        const reservasDelDia = [...mesasStore.historialReservas]

        const contadoEfectivo = Number(payload.contadoEfectivo)
        const hayConteo = Number.isFinite(contadoEfectivo) && payload.contadoEfectivo !== '' && payload.contadoEfectivo != null
        const diferencia = hayConteo ? contadoEfectivo - esperadoEfectivo : null

        // Si ya existe un cierre para esta fecha, este es una sesion posterior
        // (por ejemplo, el local cerro y volvio a abrir el mismo dia).
        const sesion = cierres.value.filter((c) => c.fecha === fechaInicioDia.value).length + 1

        cierres.value.unshift({
            id: siguienteId(cierres.value),
            fecha: fechaInicioDia.value,
            ...resumen,
            sesion,
            fondoInicial,
            totalesPorMetodo,
            esperadoEfectivo,
            contadoEfectivo: hayConteo ? contadoEfectivo : null,
            diferencia,
            observaciones: payload.observaciones || '',
            cerradoPor: payload.cerradoPor || null,
            horaCierreISO: new Date().toISOString(),
            ordenes: ordenesDelDia,
            ordenesCanceladas,
            reservas: reservasDelDia
        })
        mesasStore.limpiarHistorialReservas()
        diaCerrado.value = true

        return { ok: true, diferencia }
    }

    function iniciarNuevoDia() {
        if (!diaCerrado.value) {
            return { ok: false, mensaje: 'El dia aun no se ha cerrado.' }
        }
        diaCerrado.value = false
        fechaInicioDia.value = hoyLocal()
        useCajaStore().limpiarCaja()
        return { ok: true }
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
