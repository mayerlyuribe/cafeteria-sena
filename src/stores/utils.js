export const siguienteId = (lista, campo = 'id') =>
    lista.reduce((max, x) => Math.max(max, x[campo] || 0), 0) + 1

