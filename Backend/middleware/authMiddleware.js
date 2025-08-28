const { verifyToken } = require('../config/jwt');
const UsuarioService = require('../services/usuarioService');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token requerido', code: 'TOKEN_REQUIRED' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    const usuario = await UsuarioService.obtenerPorId(decoded.id_usuario);
    
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Usuario no válido', code: 'USER_INVALID' });
    }

    req.user = usuario;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido', code: 'TOKEN_INVALID' });
    }
    return res.status(500).json({ error: 'Error de autenticación', code: 'AUTH_ERROR' });
  }
};

module.exports = authMiddleware;
