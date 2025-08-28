const express = require('express');
const { body, param, query } = require('express-validator');
const PuestoController = require('../controllers/puestoController');
const authMiddleware = require('../middleware/authMiddleware');
const rlsMiddleware = require('../middleware/rlsMiddleware');
const { rolMiddleware, propietarioMiddleware } = require('../middleware/rolMiddleware');
const Puesto = require('../models/puesto');

const router = express.Router();

// Aplicar authMiddleware + RLS a todas las rutas del módulo Puesto
router.use(authMiddleware, rlsMiddleware);

// Crear un puesto (admin, contabilidad y supervisor)
router.post('/', 
    rolMiddleware(['admin', 'contabilidad', 'supervisor']),
    [
        body('id_servicio').isInt().withMessage('El ID del servicio debe ser un número'),
        body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
        body('cant_horas').isInt().withMessage('La cantidad de horas es obligatoria'),
    ], 
    PuestoController.crearPuesto
);

// Crear un puesto con días tipo (admin, contabilidad y supervisor)
router.post('/con-dias-tipo', 
    rolMiddleware(['admin', 'contabilidad', 'supervisor']),
    [
        body('datosPuesto.id_servicio').isInt().withMessage('El ID del servicio debe ser un número'),
        body('datosPuesto.nombre').notEmpty().withMessage('El nombre del puesto es obligatorio'),
    ], 
    PuestoController.crearPuestoConDiasTipo
);

// Obtener todos los puestos (opcional incluir inactivos)
router.get('/', [
    query('incluirInactivos').optional().isBoolean().withMessage('Debe ser true o false'),
], PuestoController.obtenerTodosPuestos);

// Obtener puestos por servicio
router.get('/servicio/:id_servicio', [
    param('id_servicio').isInt().withMessage('El ID del servicio debe ser un número'),
], PuestoController.obtenerPuestoPorServicio);

// Obtener un puesto por ID
router.get('/:id', [
    param('id').isInt().withMessage('El ID debe ser un número'),
], PuestoController.obtenerPuestoPorId);

// Actualizar un puesto (admin, contabilidad y supervisor propietario)
router.put('/:id', 
    rolMiddleware(['admin', 'contabilidad', 'supervisor']),
    propietarioMiddleware(Puesto),
    [
        param('id').isInt().withMessage('El ID debe ser un número'),
        body('nombre').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
        body('id_servicio').optional().isInt().withMessage('El ID del servicio debe ser un número'),
        body('cant_horas').isInt().withMessage('La cantidad de horas es obligatoria'),
    ], 
    PuestoController.actualizarPuesto
);

// Eliminar (soft delete) un puesto (admin, contabilidad y supervisor propietario)
router.delete('/:id', 
    rolMiddleware(['admin', 'contabilidad', 'supervisor']),
    propietarioMiddleware(Puesto),
    [
        param('id').isInt().withMessage('El ID debe ser un número'),
    ], 
    PuestoController.eliminarPuesto
);

module.exports = router;
