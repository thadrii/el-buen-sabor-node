# El Buen Sabor — Sistema de Pedidos y Cocina en Tiempo Real

Aplicación web full-stack para agilizar pedidos en restaurante usando **Node.js + Express + EJS + Socket.IO + JWT**, siguiendo la arquitectura por capas de `Entregable-fullstacknode502`.

## Flujo principal

1. **Cliente en mesa (`/mesa/MESA-07`)**: Escanea su mesa (sin descargar apps ni esperar al mozo), explora la carta o consulta al **Asistente de Carta**, arma su pedido y lo envía directo a cocina.
2. **Cocina KDS (`/cocina`)**: Recibe el pedido al instante vía Socket.IO ordenado por llegada, con número de mesa, notas y cronómetro en vivo. Marca `Empezar a preparar` y `Marcar LISTO`.
3. **Panel de Mozo (`/mozo`)**: Recibe notificación inmediata cuando un plato está listo y a qué mesa llevarlo, además de alertas si una mesa llama al mozo o pide la cuenta.
4. **Pago desde mesa & Reseña**: El cliente ve su cuenta, paga al instante (`Tarjeta`, `Yape / Plin`, `Efectivo`), libera la mesa y publica su calificación de 1 a 5 estrellas.
5. **Dashboard Admin (`/dashboard`)**: KPIs en tiempo real, gestión CRUD de platos, reseñas y enlaces QR por mesa.

## Instalación y ejecución

```bash
npm install
npm run seed
npm start
```

Abrir `http://localhost:3000`.

## Credenciales de prueba (JWT)

| Rol | Correo | Contraseña | Vista |
| :--- | :--- | :--- | :--- |
| Administrador | `admin@buensabor.pe` | `12345` | `/dashboard` |
| Cocinero | `cocina@buensabor.pe` | `12345` | `/cocina` |
| Mozo | `mozo@buensabor.pe` | `12345` | `/mozo` |

## Estructura del proyecto

- `app.js` — Servidor Express, vistas EJS, rutas API y Socket.IO
- `config.js` — Puerto, secreto JWT y ruta de datos JSON
- `socket.js` — Autenticación Socket.IO por JWT (personal) y por mesa (clientes)
- `database/` — Persistencia atómica en `database/data.json` + auto-seed
- `models/` — Modelos (`authModel`, `mesaModel`, `platoModel`, `pedidoModel`, `resenaModel`)
- `services/` — Lógica de negocio y recomendador de carta (`asistenteService`)
- `controllers/` & `routers/` — Endpoints REST protegidos con `verifyToken` y `requireRoles`
- `views/` — Plantillas EJS (`index`, `login`, `mesa`, `cocina`, `mozo`, `dashboard`)
