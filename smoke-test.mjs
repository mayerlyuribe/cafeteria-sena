// Test funcional rapido de los stores (se ejecuta con: node smoke-test.mjs)
// Simula localStorage para Node y ejercita el flujo completo de la cafeteria.

globalThis.localStorage = {
    _d: {},
    getItem(k) { return this._d[k] ?? null },
    setItem(k, v) { this._d[k] = String(v) },
    removeItem(k) { delete this._d[k] }
}

const { createPinia, setActivePinia } = await import('pinia')
setActivePinia(createPinia())

const { useAuthStore, useMesasStore, useProductosStore, useOrdenesStore, useDiaStore } =
    await import('./src/stores/stores.js')

let fallos = 0
function ok(cond, msg) {
    if (cond) console.log('  OK  -', msg)
    else { fallos++; console.error('  FALLA -', msg) }
}

/* ---------------------------- Auth ---------------------------- */
const auth = useAuthStore()
ok(auth.login('admin', 'admin').ok === true, 'login admin correcto')
ok(auth.esAdmin === true, 'rol admin detectado')
ok(auth.login('admin', 'mala').ok === false, 'clave incorrecta rechazada')
auth.logout()
ok(auth.estaAutenticado === false, 'logout limpia la sesion')
auth.login('maria', '1234')
ok(auth.estaAutenticado && !auth.esAdmin, 'empleado autenticado sin permisos de admin')

/* ---------------------------- Mesas y reservas ---------------------------- */
const mesas = useMesasStore()
ok(mesas.mesasVisibles.length === 6, '6 mesas iniciales visibles')

const r1 = mesas.agendarMesa(1, { fecha: '2027-01-10', hora: '08:00' })
ok(r1.ok === true, 'reserva valida creada')
const r2 = mesas.agendarMesa(1, { fecha: '2027-01-10', hora: '09:00' })
ok(r2.ok === false, 'conflicto detectado (60 min de uso + 15 min de limpieza)')
const r3 = mesas.agendarMesa(1, { fecha: '2027-01-10', hora: '05:00' })
ok(r3.ok === false, 'reserva fuera del horario rechazada')
const r4 = mesas.agendarMesa(1, { fecha: '2020-01-10', hora: '10:00' })
ok(r4.ok === false, 'reserva en el pasado rechazada')

const unir = mesas.unirMesas([1, 5])
ok(unir.ok === true, 'union de mesas libres correcta')
ok(mesas.mesasVisibles.length === 5, 'mesa hija oculta tras la union')
ok(mesas.separarUnion(1).ok === true, 'separacion de union correcta')
ok(mesas.mesasVisibles.length === 6, 'mesas restauradas tras separar')
ok(mesas.agregarMesa({ numero: 7, capacidad: 99 }).ok === false, 'capacidad maxima validada')
ok(mesas.editarMesa(2, { numero: 1 }).ok === false, 'numero de mesa duplicado rechazado')

/* ---------------------------- Productos ---------------------------- */
const prods = useProductosStore()
ok(prods.productos.length === 6, '6 productos iniciales')
ok(prods.porCategoria['Bebidas'].length === 2, 'agrupacion por categoria correcta')

/* ---------------------------- Ordenes y cobro ---------------------------- */
const ordenes = useOrdenesStore()
const orden = ordenes.abrirOrden(2, 'Maria Gomez')
ok(orden.estado === 'abierta', 'orden abierta')
ok(mesas.obtenerPorId(2).estado === 'ocupada', 'mesa marcada como ocupada')

const cafe = prods.obtenerPorId(1)
ordenes.agregarItem(orden.id, cafe, 2)
ordenes.agregarItem(orden.id, cafe, 1)
ok(ordenes.subtotalDeOrden(orden.id) === 3500 * 3, 'cantidad acumulada y subtotal correcto')

ordenes.pedirCuenta(orden.id)
ok(mesas.obtenerPorId(2).estado === 'por_cobrar', 'mesa pasa a estado por cobrar')

ordenes.cobrarYLiberar(orden.id, { metodoPago: 'Efectivo', division: 'Dividida en 2 partes iguales' })
const cerrada = ordenes.ordenesCerradas[0]
ok(cerrada.total_final === 10500, 'total final guardado')
ok(cerrada.metodo_pago === 'Efectivo', 'metodo de pago persistido en la orden')
ok(cerrada.division === 'Dividida en 2 partes iguales', 'division de cuenta persistida')
ok(mesas.obtenerPorId(2).estado === 'libre', 'mesa liberada tras el cobro')

/* ---------------------------- Cierre del dia ---------------------------- */
const dia = useDiaStore()
ok(dia.resumenDelDia.totalRecaudado === 10500, 'resumen del dia calcula el total recaudado')
ok(dia.resumenDelDia.cantidadOrdenes === 1, 'resumen cuenta las ordenes cerradas')
ok(dia.resumenDelDia.productoMasVendido === 'Cafe americano', 'producto mas vendido calculado')

dia.cerrarDia()
ok(dia.diaCerrado === true, 'dia cerrado')
ok(dia.cierres.length === 1, 'cierre archivado en el historial')
ok(dia.cierres[0].ordenes.length === 1, 'ordenes archivadas en el historial')
ok(dia.cierres[0].ordenes[0].metodo_pago === 'Efectivo', 'historial incluye metodo de pago')
ok(dia.cierres[0].totalRecaudado === 10500, 'historial guarda el total del dia')

dia.iniciarNuevoDia()
ok(dia.diaCerrado === false, 'nuevo dia iniciado')

/* ---------------------------- Guard de rutas ---------------------------- */
auth.logout()
ok(auth.estaAutenticado === false, 'sin sesion => el guard redirige a login')
ok(auth.esAdmin === false, 'sin sesion no hay permisos de admin')

console.log(fallos === 0 ? '\nRESULTADO: TODO OK (0 fallos)' : `\nRESULTADO: ${fallos} FALLO(S)`)
process.exit(fallos === 0 ? 0 : 1)
