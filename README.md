# Sistema de Gestión de Reservas

Sistema web completo para la gestión de reservas de un restaurante, desarrollado con Node.js, Express, Pug y MySQL.

## Características

- ✅ Gestión de Mesas
- ✅ Gestión de Horarios de Atención
- ✅ Gestión de Reservas (con asignación automática de mesas)
- ✅ Gestión de Clientes
- ✅ Gestión de Usuarios (Admin, Recepcionista, Mesero)
- ✅ Configuración del Restaurante
- ✅ Dashboard con estadísticas
- ✅ Autenticación con sesiones
- ✅ Control de roles y permisos

## Requisitos

- Node.js (v14 o superior)
- MySQL (v5.7 o superior) o MariaDB
- npm o yarn

## Instalación

1. **Clonar o descargar el proyecto**

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar la base de datos:**
   - Abre phpMyAdmin o tu cliente MySQL
   - Importa el archivo `gestionDeReservas.sql` que está en la raíz del proyecto
   - O ejecuta el contenido del archivo SQL manualmente

4. **Configurar la conexión a la base de datos:**
   
   Crea un archivo `.env` en la raíz del proyecto:
   
   **En Windows:**
   ```bash
   copy .env.example .env
   ```
   
   **En Linux/Mac:**
   ```bash
   cp .env.example .env
   ```
   
   O crea manualmente el archivo `.env` con el siguiente contenido:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=tu_contraseña_mysql
   DB_NAME=gestionDeReservas
   PORT=3000
   SESSION_SECRET=tu-secreto-super-seguro-aqui
   ```
   
   **Importante:** 
   - Reemplaza `tu_contraseña_mysql` con tu contraseña de MySQL (déjala vacía si no tienes contraseña)
   - Cambia `SESSION_SECRET` por un valor aleatorio y seguro (puedes usar cualquier texto largo)
   - El archivo `.env` no se sube a Git (está en `.gitignore`) por seguridad

5. **Generar hash de contraseña para el administrador:**
   
   El usuario administrador por defecto es:
   - Email: `admin@restaurante.com`
   - Contraseña: `admin123`
   
   Para generar el hash correcto, ejecuta:
   ```bash
   node scripts/generarHashAdmin.js
   ```
   
   Luego actualiza la contraseña en la base de datos con el hash generado.

6. **Iniciar el servidor:**
```bash
npm start
```

O en modo desarrollo:
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

## Estructura del Proyecto

```
gestionDeReservas/
├── config/
│   └── database.js          # Configuración de conexión a MySQL
├── controllers/             # Controladores de cada módulo
│   ├── authController.js
│   ├── clienteController.js
│   ├── configuracionController.js
│   ├── horarioController.js
│   ├── mesaController.js
│   ├── reservaController.js
│   └── usuarioController.js
├── data/
│   └── db.json             # (Ya no se usa, ahora es MySQL)
├── middlewares/
│   ├── auth.js             # Middleware de autenticación y roles
│   └── roles.js
├── models/                 # Modelos de datos (acceso a BD)
│   ├── cliente.js
│   ├── configuracion.js
│   ├── horario.js
│   ├── mesa.js
│   ├── reserva.js
│   ├── usuario.js
│   ├── store.js            # (Ya no se usa)
│   └── user.js             # (Ya no se usa)
├── public/                 # Archivos estáticos (CSS)
│   ├── styles.css
│   ├── inicio.css
│   └── reservar.css
├── routes/                 # Rutas de la aplicación
│   ├── auth.js
│   ├── clientes.js
│   ├── configuracion.js
│   ├── horarios.js
│   ├── mesas.js
│   ├── reservas.js
│   └── usuarios.js
├── scripts/
│   └── generarHashAdmin.js  # Script para generar hash de contraseña
├── views/                  # Vistas Pug
│   ├── layout.pug
│   ├── login.pug
│   ├── registro.pug
│   ├── reservar.pug
│   ├── inicio.pug
│   ├── dashboard.pug
│   ├── mesas/
│   ├── horarios/
│   ├── clientes/
│   ├── reservas/
│   ├── usuarios/
│   └── configuracion/
├── gestionDeReservas.sql    # Script SQL para crear la base de datos
├── index.js                 # Archivo principal
└── package.json
```

## Roles de Usuario

### Administrador
- Acceso completo al sistema
- Gestión de mesas, horarios, usuarios y configuración
- Ver todas las reservas y estadísticas

### Recepcionista / Host
- Crear y gestionar reservas
- Ver clientes y su historial
- Confirmar, cancelar y actualizar reservas
- Marcar reservas como "en curso" o "completadas"

### Mesero (opcional)
- Ver reservas del día
- Ver estado de mesas

## Uso

### Acceso Público
- `/` o `/inicio` - Ver reservas públicas
- `/reservar` - Formulario para crear reserva (público)

### Acceso Autenticado
- `/login` - Iniciar sesión
- `/dashboard` - Panel principal con reservas del día
- `/reservas` - Lista de todas las reservas
- `/clientes` - Gestión de clientes

### Solo Administrador
- `/mesas` - Gestión de mesas
- `/horarios` - Gestión de horarios de atención
- `/usuarios` - Gestión de usuarios del sistema
- `/configuracion` - Configuración del restaurante

## Base de Datos

El sistema utiliza las siguientes tablas principales:

- `usuarios` - Usuarios del sistema
- `clientes` - Clientes del restaurante
- `mesas` - Mesas disponibles
- `reservas` - Reservas realizadas
- `horarios_atencion` - Horarios de atención por día
- `configuracion_restaurante` - Configuración general

## Notas Importantes

1. **Seguridad**: En producción, cambia el secreto de sesión en `index.js`
2. **Contraseñas**: Las contraseñas se almacenan hasheadas con bcrypt
3. **Validaciones**: El sistema valida horarios, disponibilidad de mesas y capacidad
4. **Asignación automática**: Las reservas se asignan automáticamente a mesas disponibles según capacidad

## Desarrollo

Para desarrollo con recarga automática:
```bash
npm run dev
```

## Licencia

ISC

## Autor

Rodrigo Serrano Villegas

