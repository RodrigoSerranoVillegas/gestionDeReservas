// Middleware para verificar si el usuario está autenticado
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  res.redirect('/login');
}

// Middleware para verificar roles
function requireRole(roles = []) {
  return function(req, res, next) {
    if (!req.session || !req.session.userId) {
      return res.redirect('/login');
    }
    
    if (roles.length === 0 || roles.includes(req.session.rol)) {
      return next();
    }
    
    res.status(403).send('No tienes permisos para acceder a esta página');
  };
}

// Middleware para hacer disponible el usuario en las vistas
function userLocals(req, res, next) {
  if (req.session && req.session.userId) {
    res.locals.user = {
      id: req.session.userId,
      nombre: req.session.nombre,
      email: req.session.email,
      rol: req.session.rol
    };
  }
  next();
}

module.exports = {
  requireAuth,
  requireRole,
  userLocals
};

