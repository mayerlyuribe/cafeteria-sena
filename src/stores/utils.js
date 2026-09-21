export const siguienteId = (lista, campo = 'id') =>
    lista.reduce((max, x) => Math.max(max, x[campo] || 0), 0) + 1

export const hoyLocal = () => {
    const d = new Date()
    const mes = String(d.getMonth() + 1).padStart(2, '0')
    const dia = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${mes}-${dia}`
}