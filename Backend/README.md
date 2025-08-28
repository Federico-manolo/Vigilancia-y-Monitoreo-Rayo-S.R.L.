# Backend - Proyecto Rayo

Sistema de gestión de vigiladores y planillas de seguridad.

## 🚀 Configuración Inicial

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Copia el archivo `env.example` a `.env` y configura las variables:

```bash
cp env.example .env
```

Edita el archivo `.env` con tus configuraciones:

```env
# Configuración de la base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=proyecto_rayo
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_DIALECT=postgres

# Configuración del servidor
PORT=3000
NODE_ENV=development

# Configuración de JWT
JWT_SECRET=tu_clave_secreta_muy_segura_aqui
SECRET_KEY=tu_clave_secreta_muy_segura_aqui
```

### 3. Configurar la base de datos
Asegúrate de tener PostgreSQL instalado y crear la base de datos:

```sql
CREATE DATABASE proyecto_rayo;
```

### 4. Ejecutar migraciones (si es necesario)
```bash
npx sequelize-cli db:migrate
```

## 🏃‍♂️ Ejecutar el servidor

### Desarrollo (con nodemon)
```bash
npm run dev
```

### Producción
```bash
npm start
```

## 📡 Endpoints de la API

### Autenticación
- `POST /api/auth/login` - Login de usuario

### Usuarios
- `GET /api/usuarios` - Listar usuarios
- `POST /api/usuarios` - Crear usuario
- `GET /api/usuarios/:id` - Obtener usuario por ID
- `PUT /api/usuarios/:id` - Actualizar usuario
- `DELETE /api/usuarios/:id` - Eliminar usuario

### Vigiladores
- `GET /api/vigiladores` - Listar vigiladores
- `POST /api/vigiladores` - Crear vigilador
- `GET /api/vigiladores/:id` - Obtener vigilador por ID
- `PUT /api/vigiladores/:id` - Actualizar vigilador
- `DELETE /api/vigiladores/:id` - Eliminar vigilador

### Servicios
- `GET /api/servicios` - Listar servicios
- `POST /api/servicios` - Crear servicio
- `GET /api/servicios/:id` - Obtener servicio por ID
- `PUT /api/servicios/:id` - Actualizar servicio
- `DELETE /api/servicios/:id` - Eliminar servicio

### Puestos
- `GET /api/puestos` - Listar puestos
- `POST /api/puestos` - Crear puesto
- `GET /api/puestos/:id` - Obtener puesto por ID
- `PUT /api/puestos/:id` - Actualizar puesto
- `DELETE /api/puestos/:id` - Eliminar puesto

### Planillas
- `GET /api/planillas` - Listar planillas
- `POST /api/planillas` - Crear planilla
- `GET /api/planillas/:id` - Obtener planilla por ID
- `PUT /api/planillas/:id` - Actualizar planilla
- `DELETE /api/planillas/:id` - Eliminar planilla

### Turnos
- `GET /api/turnos` - Listar turnos
- `POST /api/turnos` - Crear turno
- `GET /api/turnos/:id` - Obtener turno por ID
- `PUT /api/turnos/:id` - Actualizar turno
- `DELETE /api/turnos/:id` - Eliminar turno

### Autenticación (NUEVO: Refresh Tokens)
- `POST /api/auth/login` - Login de usuario (devuelve access token y setea refresh token en cookie httpOnly)
- `POST /api/auth/refresh` - Renueva access token usando refresh token (cookie)
- `POST /api/auth/logout` - Revoca refresh token y elimina cookie

#### ¿Cómo funciona?
- Al hacer login, recibís un access token (en el body) y un refresh token (en cookie httpOnly).
- Usá el access token en el header Authorization para acceder a rutas protegidas.
- Cuando el access token expira, hacé POST a `/api/auth/refresh` (con la cookie) para obtener uno nuevo.
- Para cerrar sesión, hacé POST a `/api/auth/logout` (elimina el refresh token y la cookie).

#### Notas de seguridad
- El refresh token nunca es accesible desde JS, solo el navegador lo envía automáticamente.
- El frontend debe usar `credentials: 'include'` (fetch) o `withCredentials: true` (axios) para enviar cookies.

#### Ejemplos
- Login (curl):
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "contraseña": "password123"
  }'
```
- Login (axios):
```js
const res = await axios.post('http://localhost:3000/api/auth/login', {
  email: 'admin@example.com',
  contraseña: 'password123'
}, { withCredentials: true });
const accessToken = res.data.token;
```
- Login (fetch):
```js
const res = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email: 'admin@example.com', contraseña: 'password123' })
});
const { token } = await res.json();
```
- Refresh (curl):
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  --cookie-jar cookies.txt --cookie cookies.txt
```
- Refresh (axios):
```js
const res = await axios.post('http://localhost:3000/api/auth/refresh', {}, { withCredentials: true });
const newAccessToken = res.data.token;
```
- Refresh (fetch):
```js
const res = await fetch('http://localhost:3000/api/auth/refresh', {
  method: 'POST',
  credentials: 'include'
});
const { token: newToken } = await res.json();
```
- Logout (curl):
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  --cookie-jar cookies.txt --cookie cookies.txt
```
- Logout (axios):
```js
await axios.post('http://localhost:3000/api/auth/logout', {}, { withCredentials: true });
```
- Logout (fetch):
```js
await fetch('http://localhost:3000/api/auth/logout', { method: 'POST', credentials: 'include' });
```

### Recuperación de contraseña
- `POST /api/auth/recuperar-password` - Solicita recuperación (recibe email). Siempre devuelve mensaje genérico.
- `POST /api/auth/reset-password` - Actualiza contraseña (recibe token y nueva contraseña).

Notas:
- El token de recuperación expira en `RESET_TOKEN_EXP_MINUTES` (por defecto 15 minutos) y es de un solo uso.
- Si no configurás SMTP, el envío de email se simula logueando el contenido en consola.

#### Ejemplos
- Solicitar recuperación (curl):
```bash
curl -X POST http://localhost:3000/api/auth/recuperar-password \
  -H "Content-Type: application/json" \
  -d '{ "email": "admin@example.com" }'
```
- Solicitar recuperación (axios):
```js
await axios.post('http://localhost:3000/api/auth/recuperar-password', { email: 'admin@example.com' });
```
- Resetear contraseña (curl):
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{ "token": "TOKEN_DEL_MAIL", "nuevaContraseña": "NuevoPass123" }'
```
- Resetear contraseña (axios):
```js
await axios.post('http://localhost:3000/api/auth/reset-password', { token: 'TOKEN_DEL_MAIL', nuevaContraseña: 'NuevoPass123' });
```

## 🔐 Autenticación

El sistema usa JWT (JSON Web Tokens) para la autenticación.

### Usar token en requests
```bash
curl -X GET http://localhost:3000/api/usuarios \
  -H "Authorization: Bearer tu_token_aqui"
```

## 🏗️ Estructura del Proyecto

```
Backend/
├── config/          # Configuración de base de datos
├── controllers/     # Controladores de la API
├── middleware/      # Middlewares (auth, etc.)
├── models/          # Modelos de Sequelize
├── routes/          # Rutas de la API
├── services/        # Lógica de negocio
├── src/             # Archivos principales del servidor
├── structure/       # Estructuras auxiliares
└── server.js        # Punto de entrada
```

## 🔧 Tecnologías

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **Sequelize** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación
- **bcrypt** - Encriptación de contraseñas
- **express-validator** - Validación de datos

## 📝 Notas

- El servidor corre por defecto en el puerto 3000
- Los tokens JWT expiran en 24 horas
- Todas las rutas (excepto login) requieren autenticación
- Las contraseñas se encriptan automáticamente con bcrypt 