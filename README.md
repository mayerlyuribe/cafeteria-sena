# CafeterIA pinkipai ☕

Aplicación web para la gestión de una cafetería/restaurant (proyecto SENA). Cubre el flujo completo:
**inicio de sesión → mapa de mesas → orden → cobro → cierre de día → historial**.

## Stack tecnológico

| Capa       | Tecnología                                  |
|------------|---------------------------------------------|
| Framework  | Vue 3 (Composition API + `<script setup>`)  |
| UI         | Quasar 2 (Material Design)                  |
| Estado     | Pinia + `pinia-plugin-persistedstate`       |
| Rutas      | Vue Router 4 (hash history) + guards        |
| Build      | Vite                                         |

## Requisitos

- Node.js 18 o superior
- npm

## Instalación y ejecución

```bash
npm install     # instalar dependencias
npm run dev     # servidor de desarrollo (http://localhost:5173)
npm run build   # generar build de producción en dist/
npm run preview # previsualizar el build
npm test        # test funcional de stores (auth, mesas, reservas, ordenes, cobro, cierre)
```

## Usuarios de prueba

| Rol      | Usuario  | Contraseña |
|----------|----------|------------|
| Admin    | `admin`  | `admin`    |
| Empleado | `maria`  | `1234`     |
| Admin    | `mondaivel` | `123456789` |

> Autenticación simulada en el cliente (sin backend). Las credenciales viven en el bundle, no usar en producción real.

## Funcionalidades

### Roles
- **Admin**: acceso a todo (mapa, menú, cierre del día, historial).
- **Empleado**: solo mapa de mesas, órdenes y cobros.

### Mesas (`src/stores/mesas.js`)
- Crear, editar y eliminar mesas (máx. 4 personas por mesa).
- Unir mesas libres en grupos (máx. 12 personas) y volver a separarlas.
- Estados visuales con color: libre, ocupada, por cobrar, unida, reservada.

### Reservas
- Horario de atención: **07:00 a 19:00**.
- Cada reserva usa la mesa **60 minutos** + **15 minutos** de limpieza/preparación antes de la siguiente.
- Detección de conflictos, avisos próximos y cancelación automática por no presentarse.
- Historial de reservas resueltas (llegó / no llegó / cancelada).

### Órdenes y cobro (`src/stores/ordenes.js`)
- Abrir orden por mesa, agregar productos por categoría y manejar cantidades.
- "Pedir la cuenta" deja la mesa en estado *por cobrar*.
- Cobro con método de pago simulado (efectivo, tarjeta, transferencia, Nequi/Daviplata).
- Dividir la cuenta: por producto o en partes iguales, con seguimiento de pagos individuales.
- El método de pago y la división quedan guardados en la orden cerrada y aparecen en el historial.

### Cierre de día (`src/stores/dia.js`)
- Resumen: total recaudado, mesas atendidas, ticket promedio y producto más vendido.
- Archiva órdenes cerradas y reservas del día, cancela órdenes abiertas y libera mesas.
- El historial no se borra al cerrar un día.

### Persistencia
Todos los stores se persisten en `localStorage`, por lo que los datos (mesas, órdenes, historial) sobreviven al cerrar el navegador. Para reiniciar la aplicación, limpia el almacenamiento del navegador o elimina las claves `*` de los stores en DevTools.

## Estructura del proyecto

```
src/
├── main.js               # Punto de entrada (Vue + Quasar + Pinia + Router)
├── App.vue
├── routes/routes.js      # Rutas y guards de autenticación/roles
├── stores/
│   ├── stores.js         # Barrel que re-exporta todos los stores
│   ├── auth.js           # Sesión y usuarios
│   ├── mesas.js          # Mesas, uniones y reservas
│   ├── productos.js      # Menú de productos
│   ├── ordenes.js        # Órdenes, items y cobro
│   ├── dia.js            # Cierre de día e historial
│   └── utils.js          # Helpers (fechas, moneda, ids)
└── views/
    ├── LoginView.vue       # Inicio de sesión
    ├── MainLayout.vue      # Layout con header/drawer + revisión de reservas
    ├── MapaLocalView.vue   # Mapa de mesas y reservas
    ├── OrdenMesaView.vue   # Orden de una mesa
    ├── CobroView.vue       # Cobro y división de cuenta
    ├── MenuView.vue        # CRUD de productos (admin)
    ├── CierreDiaView.vue   # Resumen y cierre del día (admin)
    ├── HistorialView.vue   # Historial filtrable (admin)
    └── ErrorNotFoundView.vue
```
