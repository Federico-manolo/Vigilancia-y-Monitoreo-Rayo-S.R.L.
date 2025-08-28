// app.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
// const morgan = require('morgan'); // opcional
const routes = require('./routes'); // suponiendo que tengas un index.js que agrupe todas las rutas

const app = express();

// Middlewares básicos
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map(o => o.trim());
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
// app.use(morgan('dev')); // descomentá si querés logs de peticiones

// Rutas
app.use('/api', routes);

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    // Normalizar y mapear status de error a códigos HTTP coherentes
    const details = err?.details;
    const originalCode = err?.original?.code
      || err?.parent?.code
      || (typeof details === 'object' && (details?.original?.code || details?.code))
      || undefined;
    const messageStr = typeof err?.message === 'string' ? err.message : '';
    const detailsStr = typeof details === 'string' ? details : '';
    const isRlsViolation = originalCode === '42501'
      || messageStr.includes('violates row-level security policy')
      || detailsStr.includes('violates row-level security policy');

    let status = 500;
    if (isRlsViolation) {
        status = 403;
    } else if (typeof err?.status === 'number') {
        status = err.status;
    } else if (err?.name === 'SequelizeValidationError') {
        status = 400;
    } else if (err?.name === 'SequelizeUniqueConstraintError' || originalCode === '23505') {
        status = 409;
    } else if (originalCode === '23503') {
        status = 409;
    } else if (originalCode === '22P02') {
        status = 400;
    }

    const mensaje = isRlsViolation ? 'Acceso denegado por política de seguridad (RLS)' : (messageStr || 'Error interno del servidor');

    // Alinear el status en el objeto de error para que los logs no confundan
    err.status = status;
    // Log compacto y alineado con la respuesta
    console.error({ status, code: originalCode, message: mensaje });

    res.status(status).json({
        mensaje,
        detalles: details || null
    });
});

module.exports = app;
