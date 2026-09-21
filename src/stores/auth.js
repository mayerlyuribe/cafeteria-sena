import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useDiaStore } from './dia.js'
import { siguienteId } from './utils.js'

const USUARIOS = [
    { id: 1, nombre: 'Administrador', usuario: 'admin', clave: 'admin123', rol: 'admin' },
    { id: 2, nombre: 'Maria Gomez', usuario: 'maria', clave: '1234', rol: 'empleado' },
    { id: 3, nombre: 'Rosa melano', usuario: 'mondaivel', clave: '123456789', rol: 'admin' }
]


export const useAuthStore = defineStore('auth', () => {
    const currentUser = ref(null)
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
            id: siguienteId(registroTurnos.value),
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
                id: siguienteId(registroTurnos.value),
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