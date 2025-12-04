// Cargar variables de entorno
require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const { testConnection } = require('./config/database');
const { userLocals } = require('./middlewares/auth');

const app = express();

// Configurar motor de vistas
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para parsear datos
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configurar sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'mi-secreto-super-seguro-cambiar-en-produccion',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true en producción con HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Middleware para hacer disponible el usuario en las vistas
app.use(userLocals);

// Rutas
const authRoutes = require('./routes/auth');
const reservaRoutes = require('./routes/reservas');
const mesaRoutes = require('./routes/mesas');
const horarioRoutes = require('./routes/horarios');
const clienteRoutes = require('./routes/clientes');
const configuracionRoutes = require('./routes/configuracion');
const usuarioRoutes = require('./routes/usuarios');

app.use('/', authRoutes);
app.use('/', reservaRoutes);
app.use('/mesas', mesaRoutes);
app.use('/horarios', horarioRoutes);
app.use('/clientes', clienteRoutes);
app.use('/configuracion', configuracionRoutes);
app.use('/usuarios', usuarioRoutes);

// Página de inicio pública (muestra reservas)
app.get('/', (req, res) => res.redirect('/inicio'));

// Probar conexión a la base de datos al iniciar
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
  await testConnection();
});