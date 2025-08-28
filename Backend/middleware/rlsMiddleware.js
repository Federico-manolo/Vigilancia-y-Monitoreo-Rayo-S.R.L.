const { sequelize } = require('../config/db');

/**
 * Middleware que garantiza que todas las queries del request se ejecuten dentro
 * de una transacción y con GUCs SET LOCAL para RLS: app.user_id y app.role.
 * Requiere que los handlers y servicios usen la transacción actual implícita por CLS.
 */
const rlsMiddleware = async (req, res, next) => {
  // Si no hay usuario (ruta pública), continuar sin RLS
  if (!req.user) return next();

  try {
    await sequelize.transaction(async (t) => {
      await sequelize.query('SET LOCAL app.user_id = :id', {
        replacements: { id: req.user.id_usuario },
        transaction: t,
      });
      await sequelize.query('SET LOCAL app.role = :role', {
        replacements: { role: req.user.rol },
        transaction: t,
      });

      if (process.env.RLS_DEBUG === '1') {
        const [[row]] = await sequelize.query(
          "SELECT current_setting('app.user_id') AS user_id, current_setting('app.role') AS role",
          { transaction: t }
        );
        console.log('RLS_DEBUG GUCs:', row);
      }

      req.transaction = t;

      // Esperar a que la respuesta se complete para mantener viva la transacción
      await new Promise((resolve, reject) => {
        res.on('finish', resolve);
        res.on('close', resolve);
        res.on('error', reject);
        next();
      });
    });
  } catch (error) {
    console.error('RLS middleware error:', error);
    return res.status(500).json({ error: 'Error interno configurando seguridad de filas' });
  }
};

module.exports = rlsMiddleware;


