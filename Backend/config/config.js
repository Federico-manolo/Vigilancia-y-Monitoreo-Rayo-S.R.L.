require('dotenv').config();

module.exports = {
  development: {
    // Aceptar ambos nombres de variables de entorno para compatibilidad
    username: process.env.DB_USER || process.env.DB_USERNAME,
    password: process.env.DB_PASS || process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
  }
};
