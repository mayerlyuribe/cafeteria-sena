import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { siguienteId } from './utils.js'

export const ESTADOS_MESA = {
    LIBRE: 'libre',
    OCUPADA: 'ocupada',
    POR_COBRAR: 'por_cobrar',
    UNIDA: 'unida'
}

export const CAPACIDAD_MAXIMA_MESA = 6
export const CAPACIDAD_MAXIMA_UNION = 12

export const useMesasStore = defineStore('mesas', () => {
    const mesas = ref([
        { id: 1, numero: 1, capacidad: 2, capacidad_base: 2, estado: ESTADOS_MESA.LIBRE, agendada: false, agenda_info: null, union_id: null, es_host_union: false, mesas_unidas: [] },
        { id: 2, numero: 2, capacidad: 4, capacidad_base: 4, estado: ESTADOS_MESA.LIBRE, agendada: false, agenda_info: null, union_id: null, es_host_union: false, mesas_unidas: [] },
        { id: 3, numero: 3, capacidad: 4, capacidad_base: 4, estado: ESTADOS_MESA.LIBRE, agendada: false, agenda_info: null, union_id: null, es_host_union: false, mesas_unidas: [] },
        { id: 4, numero: 4, capacidad: 6, capacidad_base: 6, estado: ESTADOS_MESA.LIBRE, agendada: false, agenda_info: null, union_id: null, es_host_union: false, mesas_unidas: [] },
        { id: 5, numero: 5, capacidad: 2, capacidad_base: 2, estado: ESTADOS_MESA.LIBRE, agendada: false, agenda_info: null, union_id: null, es_host_union: false, mesas_unidas: [] },
        { id: 6, numero: 6, capacidad: 4, capacidad_base: 4, estado: ESTADOS_MESA.LIBRE, agendada: false, agenda_info: null, union_id: null, es_host_union: false, mesas_unidas: [] }
    ])

    const obtenerPorId = computed(() => (id) => mesas.value.find((m) => m.id === Number(id)))
    const mesasOcupadasOPorCobrar = computed(() =>
        mesas.value.filter((m) => m.estado !== ESTADOS_MESA.LIBRE && m.estado !== ESTADOS_MESA.UNIDA)
    )

    const mesasVisibles = computed(() =>
        mesas.value.filter((m) => !(m.estado === ESTADOS_MESA.UNIDA && m.union_id))
    )

    function marcarOcupada(mesaId) {
        const mesa = obtenerPorId.value(mesaId)
        if (mesa) {
            mesa.estado = ESTADOS_MESA.OCUPADA
            mesa.agendada = false
            mesa.agenda_info = null
        }
    }

    function marcarPorCobrar(mesaId) {
        const mesa = obtenerPorId.value(mesaId)
        if (mesa) mesa.estado = ESTADOS_MESA.POR_COBRAR
    }

    function liberarMesa(mesaId) {
        const mesa = obtenerPorId.value(mesaId)
        if (mesa) mesa.estado = ESTADOS_MESA.LIBRE
    }

    function agregarMesa({ numero, capacidad }) {
        const cap = Number(capacidad)

        if (!numero) return { ok: false, mensaje: 'Debes indicar el numero de mesa.' }
        if (!cap || cap < 1) return { ok: false, mensaje: 'La capacidad debe ser al menos 1 persona.' }
        if (cap > CAPACIDAD_MAXIMA_MESA) {
            return { ok: false, mensaje: `Una mesa no puede tener mas de ${CAPACIDAD_MAXIMA_MESA} personas. Si necesitas mas cupo, crea varias mesas y luego unelas.` }
        }
        if (mesas.value.some((m) => m.numero === Number(numero))) {
            return { ok: false, mensaje: `Ya existe una mesa con el numero ${numero}.` }
        }

        mesas.value.push({
            id: siguienteId(mesas.value),
            numero: Number(numero),
            capacidad: cap,
            capacidad_base: cap,
            estado: ESTADOS_MESA.LIBRE,
            agendada: false,
            agenda_info: null,
            union_id: null,
            es_host_union: false,
            mesas_unidas: []
        })
        return { ok: true }
    }

    function editarMesa(mesaId, { numero, capacidad }) {
        const mesa = obtenerPorId.value(mesaId)
        if (!mesa) return { ok: false, mensaje: 'La mesa no existe.' }

        if (mesa.union_id) {
            return { ok: false, mensaje: 'Esta mesa esta unida a otra. Separala antes de editarla.' }
        }
        if (mesa.estado !== ESTADOS_MESA.LIBRE) {
            return { ok: false, mensaje: 'Solo puedes editar una mesa cuando esta libre.' }
        }

        const nuevoNumero = numero !== undefined ? Number(numero) : mesa.numero
        const nuevaCapacidad = capacidad !== undefined ? Number(capacidad) : mesa.capacidad

        if (!nuevoNumero) return { ok: false, mensaje: 'Debes indicar el numero de mesa.' }
        if (!nuevaCapacidad || nuevaCapacidad < 1) {
            return { ok: false, mensaje: 'La capacidad debe ser al menos 1 persona.' }
        }
        if (nuevaCapacidad > CAPACIDAD_MAXIMA_MESA) {
            return { ok: false, mensaje: `Una mesa no puede tener mas de ${CAPACIDAD_MAXIMA_MESA} personas.` }
        }
        if (mesas.value.some((m) => m.id !== mesa.id && m.numero === nuevoNumero)) {
            return { ok: false, mensaje: `Ya existe una mesa con el numero ${nuevoNumero}.` }
        }

        mesa.numero = nuevoNumero
        mesa.capacidad = nuevaCapacidad
        mesa.capacidad_base = nuevaCapacidad
        return { ok: true }
    }

    function eliminarMesa(mesaId) {
        const mesa = obtenerPorId.value(mesaId)
        if (!mesa) return { ok: false, mensaje: 'La mesa no existe.' }

        if (mesa.estado === ESTADOS_MESA.OCUPADA || mesa.estado === ESTADOS_MESA.POR_COBRAR) {
            return { ok: false, mensaje: 'No puedes eliminar una mesa con una orden abierta o pendiente por cobrar.' }
        }
        if (mesa.union_id) {
            return { ok: false, mensaje: 'Esta mesa esta unida a otra. Separala antes de eliminarla.' }
        }

        mesas.value = mesas.value.filter((m) => m.id !== mesa.id)
        return { ok: true }
    }

    function unirMesas(mesaIds) {
        const ids = [...new Set(mesaIds.map(Number))]
        if (ids.length < 2) {
            return { ok: false, mensaje: 'Selecciona al menos 2 mesas para unir.' }
        }

        const seleccionadas = ids.map((id) => obtenerPorId.value(id)).filter(Boolean)
        if (seleccionadas.length !== ids.length) {
            return { ok: false, mensaje: 'Alguna de las mesas seleccionadas ya no existe.' }
        }
        if (seleccionadas.some((m) => m.estado !== ESTADOS_MESA.LIBRE || m.union_id)) {
            return { ok: false, mensaje: 'Solo se pueden unir mesas que esten libres y que no esten ya unidas.' }
        }

        const capacidadTotal = seleccionadas.reduce((sum, m) => sum + m.capacidad_base, 0)
        if (capacidadTotal > CAPACIDAD_MAXIMA_UNION) {
            return { ok: false, mensaje: `La union no puede superar ${CAPACIDAD_MAXIMA_UNION} personas (seleccionaste ${capacidadTotal}).` }
        }

        const ordenadas = [...seleccionadas].sort((a, b) => a.numero - b.numero)
        const host = ordenadas[0]
        const hijas = ordenadas.slice(1)
        const unionId = siguienteId(mesas.value, 'union_id')

        host.union_id = unionId
        host.es_host_union = true
        host.capacidad = capacidadTotal
        host.mesas_unidas = hijas.map((m) => m.id)

        for (const hija of hijas) {
            hija.union_id = unionId
            hija.es_host_union = false
            hija.estado = ESTADOS_MESA.UNIDA
            hija.mesas_unidas = []
        }

        return { ok: true, mesaHostId: host.id }
    }

    function separarUnion(mesaId) {
        const mesa = obtenerPorId.value(mesaId)
        if (!mesa || !mesa.union_id) return { ok: false, mensaje: 'Esta mesa no esta unida a otra.' }

        const unionId = mesa.union_id
        const host = mesas.value.find((m) => m.union_id === unionId && m.es_host_union)
        if (host && host.estado !== ESTADOS_MESA.LIBRE) {
            return { ok: false, mensaje: 'No puedes separar mesas mientras la union tiene una orden abierta o pendiente por cobrar.' }
        }

        const grupo = mesas.value.filter((m) => m.union_id === unionId)
        for (const m of grupo) {
            m.union_id = null
            m.es_host_union = false
            m.mesas_unidas = []
            m.capacidad = m.capacidad_base
            m.estado = ESTADOS_MESA.LIBRE
        }

        return { ok: true }
    }

    function agendarMesa(mesaId, info) {
        const mesa = obtenerPorId.value(mesaId)
        if (!mesa || mesa.estado !== ESTADOS_MESA.LIBRE) return
        mesa.agendada = true
        mesa.agenda_info = info || null
    }

    function cancelarAgenda(mesaId) {
        const mesa = obtenerPorId.value(mesaId)
        if (!mesa) return
        mesa.agendada = false
        mesa.agenda_info = null
    }

    return {
        mesas, obtenerPorId, mesasOcupadasOPorCobrar, mesasVisibles,
        marcarOcupada, marcarPorCobrar, liberarMesa,
        agregarMesa, editarMesa, eliminarMesa, unirMesas, separarUnion,
        agendarMesa, cancelarAgenda
    }
}, {
    persist: true
})