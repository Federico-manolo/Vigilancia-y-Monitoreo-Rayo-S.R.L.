//Middleware para verificar roles
const rolMiddleware = (rolesPermitidos = []) => {
  return (req, res, next) => {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que el rol esté permitido
    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ 
        error: 'Acceso denegado',
        mensaje: `Se requiere uno de estos roles: ${rolesPermitidos.join(', ')}`
      });
    }

    next();
  };
};

// Middleware para verificar si el usuario puede modificar un recurso
const propietarioMiddleware = (modelo) => {
  return async (req, res, next) => {
    try {
      // Admin y contabilidad pueden modificar todo
      if (['admin', 'contabilidad'].includes(req.user.rol)) {
        return next();
      }

      // Para supervisores, verificar propiedad
      if (req.user.rol === 'supervisor') {
        const { id } = req.params;
        const recurso = await modelo.findByPk(id);
        
        if (!recurso) {
          return res.status(404).json({ error: 'Recurso no encontrado' });
        }

        // Verificar si el supervisor es el propietario
        if (recurso.id_usuario !== req.user.id_usuario) {
          return res.status(403).json({ 
            error: 'Acceso denegado',
            mensaje: 'Solo puedes modificar recursos que creaste'
          });
        }
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: 'Error al verificar permisos' });
    }
  };
};

module.exports = { rolMiddleware, propietarioMiddleware };
  