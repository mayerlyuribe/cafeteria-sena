import {defineStore} from 'pinia'
import {ref} from 'vue'

export const useCarritoStore = defineStore('carrito', () => {
    let contadorCarrito = ref(10)
    
    function incrementarContador() {
        contadorCarrito.value++
    }

    return {
        contadorCarrito, incrementarContador
    }
},
{
    persist: true
}
)