import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/* ------------------------------------------------------------------ */
/*  MESAS: mapa del local, estados libre / ocupada / por_cobrar        */
/* ------------------------------------------------------------------ */
export const ESTADOS_MESA = {
    LIBRE: 'libre',
    OCUPADA: 'ocupada',
    POR_COBRAR: 'por_cobrar',
    UNIDA: 'unida' // mesa "hija" fusionada dentro de otra mesa (no se usa sola)
}

// Reglas de negocio: tope de personas por mesa individual y tope al unir mesas
export const CAPACIDAD_MAXIMA_MESA = 6
export const CAPACIDAD_MAXIMA_UNION = 12

let nextMesaId = 1
const uidMesa = () => nextMesaId++
let nextUnionId = 1
const uidUnion = () => nextUnionId++

export const useMesasStore = defineStore('mesas', () => {
    const mesas = ref([
        { id: uidMesa(), numero: 1, capacidad: 2, capacidad_base: 2, estado: ESTADOS_MESA.LIBRE, agendada: false, agenda_info: null, union_id: null, es_host_union: false, mesas_unidas: [] },
        { id: uidMesa(), numero: 2, capacidad: 4, capacidad_base: 4, estado: ESTADOS_MESA.LIBRE, agendada: false, agenda_info: null, union_id: null, es_host_union: false, mesas_unidas: [] },
        { id: uidMesa(), numero: 3, capacidad: 4, capacidad_base: 4, estado: ESTADOS_MESA.LIBRE, agendada: false, agenda_info: null, union_id: null, es_host_union: false, mesas_unidas: [] },
        { id: uidMesa(), numero: 4, capacidad: 6, capacidad_base: 6, estado: ESTADOS_MESA.LIBRE, agendada: false, agenda_info: null, union_id: null, es_host_union: false, mesas_unidas: [] },
        { id: uidMesa(), numero: 5, capacidad: 2, capacidad_base: 2, estado: ESTADOS_MESA.LIBRE, agendada: false, agenda_info: null, union_id: null, es_host_union: false, mesas_unidas: [] },
        { id: uidMesa(), numero: 6, capacidad: 4, capacidad_base: 4, estado: ESTADOS_MESA.LIBRE, agendada: false, agenda_info: null, union_id: null, es_host_union: false, mesas_unidas: [] }
    ])

    const obtenerPorId = computed(() => (id) => mesas.value.find((m) => m.id === Number(id)))
    const mesasOcupadasOPorCobrar = computed(() =>
        mesas.value.filter((m) => m.estado !== ESTADOS_MESA.LIBRE && m.estado !== ESTADOS_MESA.UNIDA)
    )

    // Mesas que se deben pintar en el mapa: se ocultan las "hijas" de una union,
    // porque quedan representadas dentro de la mesa anfitriona (host).
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
            id: uidMesa(),
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

    /**
     * Une 2 o mas mesas libres en una sola: la primera mesa (o la de menor numero)
     * actua como "anfitriona" y absorbe la capacidad de las demas, respetando el
     * tope maximo (CAPACIDAD_MAXIMA_UNION). Las demas quedan marcadas como UNIDA
     * y se ocultan del mapa (ver mesasVisibles).
     */
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
        const unionId = uidUnion()

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

    /** Deshace una union a partir de cualquiera de las mesas involucradas. */
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

/* ------------------------------------------------------------------ */
/*  PRODUCTOS: menu administrable                                      */
/* ------------------------------------------------------------------ */
let nextProductoId = 1
const uidProducto = () => nextProductoId++

export const useProductosStore = defineStore('productos', () => {
    const productos = ref([
        { id: uidProducto(), nombre: 'Cafe americano', categoria: 'Bebidas', precio_actual: 3500, disponible: true },
        { id: uidProducto(), nombre: 'Limonada de coco', categoria: 'Bebidas', precio_actual: 6000, disponible: true },
        { id: uidProducto(), nombre: 'Arepa con queso', categoria: 'Comidas', precio_actual: 5000, disponible: true },
        { id: uidProducto(), nombre: 'Bandeja paisa', categoria: 'Comidas', precio_actual: 22000, disponible: true },
        { id: uidProducto(), nombre: 'Tres leches', categoria: 'Postres', precio_actual: 8000, disponible: false }
    ])

    const disponibles = computed(() => productos.value.filter((p) => p.disponible))

    const porCategoria = computed(() => {
        const grupos = {}
        for (const p of productos.value) {
            if (!grupos[p.categoria]) grupos[p.categoria] = []
            grupos[p.categoria].push(p)
        }
        return grupos
    })

    const obtenerPorId = computed(() => (id) => productos.value.find((p) => p.id === id))

    function agregarProducto({ nombre, categoria, precio_actual }) {
        productos.value.push({
            id: uidProducto(),
            nombre,
            categoria,
            precio_actual: Number(precio_actual),
            disponible: true
        })
    }

    function editarProducto(id, cambios) {
        const p = productos.value.find((x) => x.id === id)
        if (!p) return
        if (cambios.nombre !== undefined) p.nombre = cambios.nombre
        if (cambios.categoria !== undefined) p.categoria = cambios.categoria
        if (cambios.precio_actual !== undefined) p.precio_actual = Number(cambios.precio_actual)
        // Cambiar el precio aqui NO afecta ordenes ya creadas: el item guarda su propio snapshot.
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

/* ------------------------------------------------------------------ */
/*  ORDENES: pedidos abiertos/cerrados por mesa                        */
/* ------------------------------------------------------------------ */
export const ESTADOS_ORDEN = {
    ABIERTA: 'abierta',
    CERRADA: 'cerrada'
}

let nextOrdenId = 1
let nextItemId = 1
const uidOrden = () => nextOrdenId++
const uidItem = () => nextItemId++

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

    function abrirOrden(mesaId) {
        const mesasStore = useMesasStore()
        const existente = ordenAbiertaDeMesa.value(mesaId)
        if (existente) return existente

        const orden = {
            id: uidOrden(),
            mesa_id: Number(mesaId),
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
            id: uidItem(),
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

    function cobrarYLiberar(ordenId) {
        const mesasStore = useMesasStore()
        const orden = obtenerOrdenPorId.value(ordenId)
        if (!orden) return

        orden.total_final = subtotalDeOrden.value(ordenId)
        orden.estado = ESTADOS_ORDEN.CERRADA
        orden.hora_cierre = new Date().toISOString()

        mesasStore.liberarMesa(orden.mesa_id)
    }

    return {
        ordenes, items,
        obtenerOrdenPorId, ordenAbiertaDeMesa, itemsDeOrden, subtotalDeOrden, ordenesCerradas,
        abrirOrden, agregarItem, cambiarCantidad, quitarItem, pedirCuenta, cobrarYLiberar
    }
}, {
    persist: true
})

/* ------------------------------------------------------------------ */
/*  DIA: apertura / cierre del dia operativo, resumen y ventas          */
/* ------------------------------------------------------------------ */
let nextCierreId = 1
const uidCierre = () => nextCierreId++

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
            id: uidCierre(),
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

/* ------------------------------------------------------------------ */
/*  AUTH: login/logout de meseros y admin, registro de turnos          */
/* ------------------------------------------------------------------ */
const USUARIOS = [
    { id: 1, nombre: 'Administrador', usuario: 'admin', clave: 'admin123', rol: 'admin' },
    { id: 2, nombre: 'Maria Gomez', usuario: 'maria', clave: '1234', rol: 'empleado' },
    { id: 3, nombre: 'Juan Perez', usuario: 'juan', clave: '1234', rol: 'empleado' }
]

let nextTurnoId = 1
const uidTurno = () => nextTurnoId++

export const useAuthStore = defineStore('auth', () => {
    const currentUser = ref(null) // { id, nombre, usuario, rol }
    const registroTurnos = ref([])

    const estaAutenticado = computed(() => !!currentUser.value)
    const esAdmin = computed(() => currentUser.value?.rol === 'admin')

    function login(usuario, clave) {
        const encontrado = USUARIOS.find(
            (u) => u.usuario === usuario.trim().toLowerCase() && u.clave === clave
        )
        if (!encontrado) {
            return { ok: false, mensaje: 'Usuario o contrasena incorrectos' }
        }

        currentUser.value = {
            id: encontrado.id,
            nombre: encontrado.nombre,
            usuario: encontrado.usuario,
            rol: encontrado.rol
        }

        registroTurnos.value.unshift({
            id: uidTurno(),
            usuario: encontrado.nombre,
            rol: encontrado.rol,
            accion: 'apertura',
            hora: new Date().toISOString()
        })

        const diaStore = useDiaStore()
        if (!diaStore.abierto_por) {
            diaStore.abierto_por = encontrado.nombre
        }

        return { ok: true }
    }

    function logout() {
        if (currentUser.value) {
            registroTurnos.value.unshift({
                id: uidTurno(),
                usuario: currentUser.value.nombre,
                rol: currentUser.value.rol,
                accion: 'cierre',
                hora: new Date().toISOString()
            })
        }
        currentUser.value = null
    }

    return { currentUser, registroTurnos, estaAutenticado, esAdmin, login, logout }
}, {
    persist: true
})
