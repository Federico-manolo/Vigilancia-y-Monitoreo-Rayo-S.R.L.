const express = require('express');
const router = express.Router();
const DiaVigiladorController = require('../controllers/diaVigiladorController');
const authMiddleware = require('../middleware/authMiddleware');
const rlsMiddleware = require('../middleware/rlsMiddleware');
const { body, param, query } = require('express-validator');

// Crear día
router.post('/',
    authMiddleware, rlsMiddleware,
    body('id_vigilador').isInt().withMessage('El id_vigilador debe ser numérico'),
    body('fecha').isISO8601().withMessage('La fecha debe ser válida (YYYY-MM-DD)'),
    body('estado').notEmpty().withMessage('El estado es requerido'),
    DiaVigiladorController.crearDia
);

// Crear días automáticos del mes
router.post('/automaticos',
    authMiddleware, rlsMiddleware,
    body('id_vigilador').isInt().withMessage('El id_vigilador debe ser numérico'),
    body('mes').isInt({ min: 1, max: 12 }).withMessage('Mes inválido'),
    body('anio').isInt().withMessage('Año inválido'),
    DiaVigiladorController.crearDiasAutomaticosDelMes
);

// Listar días del mes
router.get('/',
    authMiddleware, rlsMiddleware,
    query('id_vigilador').isInt().withMessage('El id_vigilador debe ser numérico'),
    query('mes').isInt({ min: 1, max: 12 }).withMessage('Mes inválido'),
    query('anio').isInt().withMessage('Año inválido'),
    DiaVigiladorController.listarDiasDelMes
);

// Obtener por ID
router.get('/:id',
    authMiddleware, rlsMiddleware,
    param('id').isInt().withMessage('El ID debe ser un número'),
    DiaVigiladorController.obtenerPorId
);

// Buscar por vigilador y fecha
router.get('/buscar/por-fecha',
    authMiddleware, rlsMiddleware,
    query('id_vigilador').isInt().withMessage('El id_vigilador debe ser numérico'),
    query('fecha').isISO8601().withMessage('La fecha debe ser válida (YYYY-MM-DD)'),
    DiaVigiladorController.buscarPorVigiladorYFecha
);

// Actualizar día
router.put('/:id',
    authMiddleware, rlsMiddleware,
    param('id').isInt().withMessage('El ID debe ser un número'),
    body('estado').optional().isString(),
    body('fecha').optional().isISO8601(),
    DiaVigiladorController.actualizarDia
);

// Eliminar día
router.delete('/:id',
    authMiddleware, rlsMiddleware,
    param('id').isInt().withMessage('El ID debe ser un número'),
    DiaVigiladorController.eliminarDia
);

// Eliminar días del mes
router.delete('/',
    authMiddleware, rlsMiddleware,
    query('id_vigilador').isInt().withMessage('El id_vigilador debe ser numérico'),
    query('mes').isInt({ min: 1, max: 12 }).withMessage('Mes inválido'),
    query('anio').isInt().withMessage('Año inválido'),
    DiaVigiladorController.eliminarDiasDelMes
);

module.exports = router;
