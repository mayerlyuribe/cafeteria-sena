import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useMesasStore } from './mesas.js'
import { siguienteId } from './utils.js'

export const ESTADOS_ORDEN = {
    ABIERTA: 'abierta',
    CERRADA: 'cerrada'
}



export const useOrdenesStore = defineStore('ordenes', () => {
    const ordenes = ref([])
    const items = ref([])

    const obtenerOrdenPorId = computed(() => (id) => ordenes.value.find((o) => o.id === Number(id)))

    const ordenAbiertaDeMesa = computed(() => (mesaId) =>
        ordenes.value.find((o) => o.mesa_id === Number(mesaId) && o.estado === ESTADOS_ORDEN.ABIERTA)
    )

    const itemsDeOrden = computed(() => (ordenId) =>
        items.value.filter((it) => it.orden_id === Number(ordenId))
    )

    const subtotalDeOrden = computed(() => (ordenId) =>
        items.value
            .filter((it) => it.orden_id === Number(ordenId))
            .reduce((sum, it) => sum + it.precio_unitario * it.cantidad, 0)
    )

    const ordenesCerradas = computed(() =>
        ordenes.value
            .filter((o) => o.estado === ESTADOS_ORDEN.CERRADA)
            .sort((a, b) => new Date(b.hora_cierre) - new Date(a.hora_cierre))
    )

    function abrirOrden(mesaId, atendidoPor = null) {
        const mesasStore = useMesasStore()
        const existente = ordenAbiertaDeMesa.value(mesaId)
        if (existente) return existente

        const orden = {
            id: siguienteId(ordenes.value),
            mesa_id: Number(mesaId),
            atendido_por: atendidoPor,
            hora_apertura: new Date().toISOString(),
            hora_cierre: null,
            estado: ESTADOS_ORDEN.ABIERTA,
            total_final: 0
        }
        ordenes.value.push(orden)
        mesasStore.marcarOcupada(mesaId)
        return orden
    }

    function agregarItem(ordenId, producto, cantidad = 1) {
        const orden = obtenerOrdenPorId.value(ordenId)
        if (!orden || orden.estado !== ESTADOS_ORDEN.ABIERTA) return

        const existente = items.value.find(
            (it) => it.orden_id === Number(ordenId) && it.producto_id === producto.id
        )
        if (existente) {
            existente.cantidad += cantidad
            return
        }

        items.value.push({
            id: siguienteId(items.value),
            orden_id: Number(ordenId),
            producto_id: producto.id,
            nombre_producto: producto.nombre,
            precio_unitario: producto.precio_actual,
            cantidad
        })
    }

    function cambiarCantidad(itemId, cantidad) {
        const item = items.value.find((it) => it.id === itemId)
        if (!item) return
        if (cantidad <= 0) {
            items.value = items.value.filter((it) => it.id !== itemId)
        } else {
            item.cantidad = cantidad
        }
    }

    function quitarItem(itemId) {
        items.value = items.value.filter((it) => it.id !== itemId)
    }

    function pedirCuenta(ordenId) {
        const mesasStore = useMesasStore()
        const orden = obtenerOrdenPorId.value(ordenId)
        if (!orden) return
        mesasStore.marcarPorCobrar(orden.mesa_id)
    }

    function cobrarYLiberar(ordenId, info = {}) {
        const mesasStore = useMesasStore()
        const orden = obtenerOrdenPorId.value(ordenId)
        if (!orden) return

        orden.total_final = subtotalDeOrden.value(ordenId)
        orden.estado = ESTADOS_ORDEN.CERRADA
        orden.hora_cierre = new Date().toISOString()
        // Datos del cobro (metodo de pago y como se dividio la cuenta) para
        // que queden guardados en el historial del dia.
        orden.metodo_pago = info.metodoPago || null
        orden.division = info.division || null

        mesasStore.liberarMesa(orden.mesa_id)
    }

    function cancelarOrden(ordenId) {
    const mesasStore = useMesasStore()
    const orden = obtenerOrdenPorId.value(ordenId)
    if (!orden || orden.estado !== ESTADOS_ORDEN.ABIERTA) return

    items.value = items.value.filter((it) => it.orden_id !== orden.id)
    ordenes.value = ordenes.value.filter((o) => o.id !== orden.id)
    mesasStore.liberarMesa(orden.mesa_id)
}

    // Archiva las ordenes que quedaron abiertas (sin cobrar) al cerrar el dia.
    // Antes se borraban sin dejar rastro; ahora se guarda una "foto" de cada
    // una con estado 'cancelada', quien la cancelo y el motivo, para que queden
    // en el historial del dia y no se pierda lo consumido sin cobrar.
    function archivarCanceladasAlCierre({ cancelada_por = null, motivo = 'Cierre de dia' } = {}) {
        const mesasStore = useMesasStore()
        const abiertas = ordenes.value.filter((o) => o.estado === ESTADOS_ORDEN.ABIERTA)
        const snapshot = abiertas.map((o) => ({
            id: o.id,
            mesa_numero: mesasStore.obtenerPorId(o.mesa_id)?.numero ?? null,
            atendido_por: o.atendido_por || 'Sin registrar',
            hora_apertura: o.hora_apertura,
            hora_cierre: new Date().toISOString(),
            total_final: subtotalDeOrden.value(o.id),
            estado: 'cancelada',
            cancelada_por: cancelada_por || null,
            motivo,
            items: itemsDeOrden.value(o.id).map((it) => ({
                nombre_producto: it.nombre_producto,
                precio_unitario: it.precio_unitario,
                cantidad: it.cantidad
            }))
        }))

        const idsAbiertas = new Set(abiertas.map((o) => o.id))
        items.value = items.value.filter((it) => !idsAbiertas.has(it.orden_id))
        ordenes.value = ordenes.value.filter((o) => !idsAbiertas.has(o.id))
        for (const o of abiertas) {
            mesasStore.liberarMesa(o.mesa_id)
        }
        return snapshot
    }
    // Arma una "foto" de cada orden cerrada (mesa, quien atendio, que pidieron)
    // para guardarla en el historial del dia antes de vaciar la lista activa.
    function snapshotOrdenesCerradas() {
        const mesasStore = useMesasStore()
        return ordenes.value
            .filter((o) => o.estado === ESTADOS_ORDEN.CERRADA)
            .map((o) => ({
                id: o.id,
                mesa_numero: mesasStore.obtenerPorId(o.mesa_id)?.numero ?? null,
                atendido_por: o.atendido_por || 'Sin registrar',
                hora_apertura: o.hora_apertura,
                hora_cierre: o.hora_cierre,
                total_final: o.total_final,
                metodo_pago: o.metodo_pago || null,
                division: o.division || null,
                estado: o.estado,
                items: itemsDeOrden.value(o.id).map((it) => ({
                    nombre_producto: it.nombre_producto,
                    precio_unitario: it.precio_unitario,
                    cantidad: it.cantidad
                }))
            }))
    }

    // Guarda el snapshot de las ordenes cerradas y limpia la lista activa
    // (y sus items) para que el dia siguiente arranque en ceros.
    function archivarOrdenesDelDia() {
        const snapshot = snapshotOrdenesCerradas()
        const idsCerradas = new Set(
            ordenes.value.filter((o) => o.estado === ESTADOS_ORDEN.CERRADA).map((o) => o.id)
        )
        items.value = items.value.filter((it) => !idsCerradas.has(it.orden_id))
        ordenes.value = ordenes.value.filter((o) => !idsCerradas.has(o.id))
        return snapshot
    }

    return {
        ordenes, items,
        obtenerOrdenPorId, ordenAbiertaDeMesa, itemsDeOrden, subtotalDeOrden, ordenesCerradas,
        abrirOrden, agregarItem, cambiarCantidad, quitarItem, pedirCuenta, cobrarYLiberar, cancelarOrden,
        archivarCanceladasAlCierre, archivarOrdenesDelDia
    }
}, {
    persist: {
        storage: localStorage
    }
})