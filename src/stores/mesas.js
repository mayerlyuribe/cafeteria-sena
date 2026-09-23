import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { siguienteId } from './utils.js'

export const ESTADOS_MESA = {
    LIBRE: 'libre',
    OCUPADA: 'ocupada',
    POR_COBRAR: 'por_cobrar',
    UNIDA: 'unida'
}

export const RESERVADA = 'reservada'


export const CAPACIDAD_MAXIMA_MESA = 4
export const CAPACIDAD_MAXIMA_UNION = 12

export const HORA_APERTURA = '07:00'
export const HORA_CIERRE = '19:00'

const aMinutos = (hora) => {
    const [h, m] = hora.split(':').map(Number)
    return h * 60 + m
}

// Margen minimo de limpieza/preparacion entre el final de una reserva y el
// inicio de la siguiente en la misma mesa.
export const MINUTOS_PREPARACION = 15
// Tiempo maximo de uso que se reserva por mesa en cada turno.
export const MINUTOS_USO_MESA = 60

const ahora = ref(Date.now())

const mesaBase = (id, numero, capacidad) => ({
    id,
    numero,
    capacidad,
    capacidad_base: capacidad,
    estado: ESTADOS_MESA.LIBRE,
    union_id: null,
    es_host_union: false,
    mesas_unidas: [],
    reservas: []
})

export const useMesasStore = defineStore('mesas', () => {
    const mesas = ref([
        mesaBase(1, 1, 2),
        mesaBase(2, 2, 4),
        mesaBase(3, 3, 4),
        mesaBase(4, 4, 6),
        mesaBase(5, 5, 2),
        mesaBase(6, 6, 4)
    ])

    const obtenerPorId = computed(() => (id) => mesas.value.find((m) => m.id === Number(id)))
    const mesasOcupadasOPorCobrar = computed(() =>
        mesas.value.filter((m) => m.estado !== ESTADOS_MESA.LIBRE && m.estado !== ESTADOS_MESA.UNIDA)
    )

    const mesasVisibles = computed(() =>
        mesas.value.filter((m) => !(m.estado === ESTADOS_MESA.UNIDA && m.union_id))
    )

    /* ------------------------ Sistema de reservacion ------------------------ */

    // Todas las reservas de una mesa ordenadas por fecha y hora.
    const reservasOrdenadas = computed(() => (mesa) =>
        [...(mesa.reservas || [])].sort((a, b) => {
            if (a.fecha !== b.fecha) return a.fecha < b.fecha ? -1 : 1
            return aMinutos(a.hora) - aMinutos(b.hora)
        })
    )

    // Reservas de una mesa que todavia no han terminado su turno de uso.
    const reservasVigentes = computed(() => (mesa) =>
        reservasOrdenadas.value(mesa).filter((r) => {
            const fin = new Date(`${r.fecha}T${r.hora}`).getTime() + MINUTOS_USO_MESA * 60000
            return fin >= ahora.value
        })
    )

    // La proxima reserva vigente (la mas cercana en el tiempo) de una mesa.
    const proximaReserva = computed(() => (mesa) => reservasVigentes.value(mesa)[0] || null)

    const minutosParaReserva = computed(() => (mesa) => {
        const reserva = proximaReserva.value(mesa)
        if (!reserva) return null
        const momento = new Date(`${reserva.fecha}T${reserva.hora}`).getTime()
        if (Number.isNaN(momento)) return null
        return (momento - ahora.value) / 60000
    })

    const enPreparacion = computed(() => (mesa) => {
        const minutos = minutosParaReserva.value(mesa)
        return mesa.estado === ESTADOS_MESA.LIBRE && minutos !== null && minutos <= MINUTOS_PREPARACION
    })

    const porLiberar = computed(() => (mesa) => {
        const minutos = minutosParaReserva.value(mesa)
        const ocupada = mesa.estado === ESTADOS_MESA.OCUPADA || mesa.estado === ESTADOS_MESA.POR_COBRAR
        return ocupada && minutos !== null && minutos <= MINUTOS_PREPARACION
    })

        const estadoVisual = computed(() => (mesa) => {
        if (mesa.estado === ESTADOS_MESA.LIBRE && enPreparacion.value(mesa)) {
            return RESERVADA
        }
        return mesa.estado
    })

    function revisarAgendas() {
        ahora.value = Date.now()
        const avisos = []
        for (const mesa of mesas.value) {
            const reserva = proximaReserva.value(mesa)
            if (reserva && porLiberar.value(mesa) && !reserva.avisada) {
                reserva.avisada = true
                avisos.push({
                    id: mesa.id,
                    numero: mesa.numero,
                    hora: reserva.hora,
                    minutos: Math.max(0, Math.ceil(minutosParaReserva.value(mesa)))
                })
            }
        }
        return avisos
    }

    // Verifica si una nueva reserva (fecha/hora) choca con alguna reserva ya
    // existente de la mesa, respetando el margen de limpieza/preparacion
    // antes y despues de cada turno de uso.
    function reservaEnConflicto(mesa, fecha, hora, ignorarReservaId = null) {
        const nuevoInicio = aMinutos(hora)
        const nuevoFin = nuevoInicio + MINUTOS_USO_MESA

        for (const r of mesa.reservas || []) {
            if (ignorarReservaId && r.id === ignorarReservaId) continue
            if (r.fecha !== fecha) continue

            const inicioExistente = aMinutos(r.hora)
            const finExistente = inicioExistente + MINUTOS_USO_MESA

            const separadaAntes = nuevoFin + MINUTOS_PREPARACION <= inicioExistente
            const separadaDespues = finExistente + MINUTOS_PREPARACION <= nuevoInicio

            if (!separadaAntes && !separadaDespues) return r
        }
        return null
    }

    function siguienteReservaId() {
        const todas = mesas.value.flatMap((m) => m.reservas || [])
        return siguienteId(todas)
    }

    function agendarMesa(mesaId, info) {
        const mesa = obtenerPorId.value(mesaId)
        if (!mesa) {
            return { ok: false, mensaje: 'La mesa no existe.' }
        }
        if (mesa.estado === ESTADOS_MESA.UNIDA) {
            return { ok: false, mensaje: 'No puedes agendar una mesa que esta unida a otra.' }
        }

        if (!info?.fecha) {
            return { ok: false, mensaje: 'Debes indicar la fecha de la reserva.' }
        }
        if (!info?.hora) {
            return { ok: false, mensaje: 'Debes indicar la hora de la reserva.' }
        }

        const momento = new Date(`${info.fecha}T${info.hora}`)
        if (Number.isNaN(momento.getTime())) {
            return { ok: false, mensaje: 'La fecha o la hora no son validas.' }
        }

        const minutosInicio = aMinutos(info.hora)
        const minutosFin = minutosInicio + MINUTOS_USO_MESA
        if (minutosInicio < aMinutos(HORA_APERTURA) || minutosInicio >= aMinutos(HORA_CIERRE)) {
            return { ok: false, mensaje: `La hora debe estar dentro del horario de atencion (${HORA_APERTURA} a ${HORA_CIERRE}).` }
        }
        if (minutosFin > aMinutos(HORA_CIERRE)) {
            return { ok: false, mensaje: `Cada reserva ocupa la mesa por ${MINUTOS_USO_MESA} minutos, y no alcanza a terminar antes del cierre (${HORA_CIERRE}).` }
        }

        if (momento < new Date()) {
            return { ok: false, mensaje: 'La fecha y la hora no pueden estar en el pasado.' }
        }

        const conflicto = reservaEnConflicto(mesa, info.fecha, info.hora)
        if (conflicto) {
            return {
                ok: false,
                mensaje: `Esa hora choca con otra reserva de esta mesa a las ${conflicto.hora} (cada reserva usa la mesa ${MINUTOS_USO_MESA} min + ${MINUTOS_PREPARACION} min de limpieza).`
            }
        }

        mesa.reservas = mesa.reservas || []
        mesa.reservas.push({
            id: siguienteReservaId(),
            cliente: info.cliente || '',
            fecha: info.fecha,
            hora: info.hora,
            notas: info.notas || '',
            avisada: false
        })

        return { ok: true }
    }

    function cancelarReserva(mesaId, reservaId) {
        const mesa = obtenerPorId.value(mesaId)
        if (!mesa) return { ok: false, mensaje: 'La mesa no existe.' }

        const existe = (mesa.reservas || []).some((r) => r.id === reservaId)
        if (!existe) return { ok: false, mensaje: 'Esa reserva ya no existe.' }

        mesa.reservas = mesa.reservas.filter((r) => r.id !== reservaId)
        return { ok: true }
    }

    /* -------------------------------------------------------------------- */

    function marcarOcupada(mesaId) {
        const mesa = obtenerPorId.value(mesaId)
        if (mesa) {
            const reserva = proximaReserva.value(mesa)
            if (reserva) {
                const minutos = minutosParaReserva.value(mesa)
                if (minutos === null || minutos <= MINUTOS_PREPARACION) {
                    mesa.reservas = mesa.reservas.filter((r) => r.id !== reserva.id)
                }
            }
            mesa.estado = ESTADOS_MESA.OCUPADA
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

        mesas.value.push(mesaBase(siguienteId(mesas.value), Number(numero), cap))
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

    return {
        mesas, obtenerPorId, mesasOcupadasOPorCobrar, mesasVisibles,
        marcarOcupada, marcarPorCobrar, liberarMesa,
        agregarMesa, editarMesa, eliminarMesa, unirMesas, separarUnion,
        agendarMesa, cancelarReserva,
        reservasOrdenadas, reservasVigentes, proximaReserva,
        minutosParaReserva, enPreparacion, porLiberar, revisarAgendas,
        estadoVisual
    }
}, {
    persist: true
})
