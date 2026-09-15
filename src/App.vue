<template>
  <q-btn to="/rutaejemplo">ruta de ejemplo</q-btn>

  <p>{{ carrito.contadorCarrito }}</p>
  
  <q-btn label="Sumar" @click="carrito.incrementarContador()" />
</template>

<script setup>
import { useCarritoStore } from './stores/stores.js'

const carrito = useCarritoStore()
</script>