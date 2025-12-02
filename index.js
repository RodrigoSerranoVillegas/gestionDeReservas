const express = require('express');
const path = require('path');

const app = express();

// Configurar motor de vistas
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para parsear datos
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Rutas
const authRoutes = require('./routes/auth');
const reservaRoutes = require('./routes/reservas');
app.use('/', authRoutes);
app.use('/', reservaRoutes);

app.get('/dashboard', (req, res) => {
  res.send('Dashboard - Sesiones en desarrollo');
});

// Página de inicio pública (muestra reservas)
app.get('/', (req, res) => res.redirect('/inicio'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});