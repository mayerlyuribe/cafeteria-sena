import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useOrdenesStore } from './ordenes.js'
import { hoyLocal } from './utils.js'

// Caja del local: fondo inicial, ventas por medio de pago y arqueo.
// Almacena la informacion necesaria para que el cierre del dia sea
// conciliable: cuanto efectivo se espera en caja (fondo + cobrado en
// efectivo) para compararlo contra el conteo fisico al momento de cerrar.
export const useCajaStore = defineStore('caja', () => {
    const fondoInicial = ref(null)
    const apertura = ref(null)

    const abierta = computed(() => fondoInicial.value !== null)

    // Suma de las ordenes cerradas agrupada por metodo de pago. Los metodos
    // coinciden con las etiquetas de CobroView.vue: Efectivo, Tarjeta,
    // Transferencia y Nequi / Daviplata.
    const totalesPorMetodo = computed(() => {
        const ordenesStore = useOrdenesStore()
        const totales = {}
        for (const orden of ordenesStore.ordenesCerradas) {
            const metodo = orden.metodo_pago || 'Sin registrar'
            totales[metodo] = (totales[metodo] || 0) + (orden.total_final || 0)
        }
        return totales
    })

    const efectivoCobrado = computed(() => totalesPorMetodo.value['Efectivo'] || 0)

    // Efectivo que deberia haber fisicamente en caja al momento del cierre.
    const esperadoEfectivo = computed(() => (fondoInicial.value || 0) + efectivoCobrado.value)

    function abrirCaja({ monto, usuario } = {}) {
        if (fondoInicial.value !== null) {
            return { ok: false, mensaje: 'La caja ya esta abierta.' }
        }
        const montoNum = Number(monto)
        if (Number.isNaN(montoNum) || montoNum < 0) {
            return { ok: false, mensaje: 'El fondo inicial debe ser un monto valido.' }
        }

        fondoInicial.value = montoNum
        apertura.value = {
            fecha: hoyLocal(),
            hora: new Date().toISOString(),
            usuario: usuario || null,
            monto: montoNum
        }
        return { ok: true }
    }

    // Deja la caja lista para un nuevo dia (sin fondo inicial).
    function limpiarCaja() {
        fondoInicial.value = null
        apertura.value = null
    }

    return {
        fondoInicial, apertura, abierta,
        totalesPorMetodo, efectivoCobrado, esperadoEfectivo,
        abrirCaja, limpiarCaja
    }
}, {
    persist: {
        storage: localStorage
    }
})
