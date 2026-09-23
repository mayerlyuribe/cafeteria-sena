import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const USUARIOS = [
    { id: 1, nombre: 'Administrador', usuario: 'admin', clave: 'admin123', rol: 'admin' },
    { id: 2, nombre: 'Maria Gomez', usuario: 'maria', clave: '1234', rol: 'empleado' },
    { id: 3, nombre: 'Rosa melano', usuario: 'mondaivel', clave: '123456789', rol: 'admin' }
]


export const useAuthStore = defineStore('auth', () => {
    const currentUser = ref(null)

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

        return { ok: true }
    }

    function logout() {
        currentUser.value = null
    }

    return { currentUser, estaAutenticado, esAdmin, login, logout }
}, {
    persist: true
})
