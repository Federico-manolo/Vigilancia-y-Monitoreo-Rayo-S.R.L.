const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const ServicioController = require('../controllers/servicioController');
const authMiddleware = require('../middleware/authMiddleware');
const rlsMiddleware = require('../middleware/rlsMiddleware');
const { rolMiddleware, propietarioMiddleware } = require('../middleware/rolMiddleware');
const Servicio = require('../models/servicio');

// Todas las rutas usan autenticación y RLS
router.use(authMiddleware, rlsMiddleware);

// Crear servicio (admin, contabilidad y supervisor)
router.post('/',
    rolMiddleware(['admin', 'contabilidad', 'supervisor']),
    [
        body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
        body('ubicacion').optional().isString().withMessage('La ubicación debe ser un texto'),
    ],
    ServicioController.crearServicio
);

// Obtener todos los servicios (puede incluir inactivos con query)
router.get('/',
    [
        query('incluirInactivos').optional().isBoolean().withMessage('Debe ser true o false'),
    ],
    ServicioController.obtenerTodosServicios
);

// Obtener servicios asociados a un usuario
router.get('/usuario',
    [
        query('incluirInactivos').optional().isBoolean().withMessage('Debe ser true o false'),
    ],
    ServicioController.obtenerServicioPorUsuario
);

// Obtener un servicio por ID
router.get('/:id',
    [
        param('id').isInt().withMessage('El ID debe ser un número entero'),
    ],
    ServicioController.obtenerServicioPorId
);

// Actualizar servicio (admin, contabilidad y supervisor propietario)
router.put('/:id',
    rolMiddleware(['admin', 'contabilidad', 'supervisor']),
    propietarioMiddleware(Servicio),
    [
        param('id').isInt().withMessage('El ID debe ser un número entero'),
        body('nombre').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
        body('ubicacion').optional().isString().withMessage('La ubicación debe ser un texto'),
    ],
    ServicioController.actualizarServicio
);

// Eliminar (soft delete) un servicio (admin, contabilidad y supervisor propietario)
router.delete('/:id',
    rolMiddleware(['admin', 'contabilidad', 'supervisor']),
    propietarioMiddleware(Servicio),
    [
        param('id').isInt().withMessage('El ID debe ser un número entero'),
    ],
    ServicioController.eliminarServicio
);

module.exports = router;
