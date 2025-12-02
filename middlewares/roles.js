function requireRole(roles = []) {
  return function (req, res, next) {
    // Scaffold: no sesión implementada aún, pasar siempre
    // En el futuro, comprobar `req.user` y su `rol`
    next();
  };
}

module.exports = { requireRole };
