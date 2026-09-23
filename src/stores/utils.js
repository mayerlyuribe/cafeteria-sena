export const siguienteId = (lista, campo = 'id') =>
    lista.reduce((max, x) => Math.max(max, x[campo] || 0), 0) + 1

export const hoyLocal = () => {
    const d = new Date()
    const mes = String(d.getMonth() + 1).padStart(2, '0')
    const dia = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${mes}-${dia}`
}

export function formatoMoneda(valor) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor || 0)
}

export function formatearHora(iso) {
    if (!iso) return '-'
    return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

