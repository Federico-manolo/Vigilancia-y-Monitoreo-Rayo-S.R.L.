const express = require('express');
const router = express.Router();
const VigiladorController = require('../controllers/vigiladorController');
const authMiddleware = require('../middleware/authMiddleware');
const { rolMiddleware, propietarioMiddleware } = require('../middleware/rolMiddleware');
const { body, param } = require('express-validator');

// Crear vigilador (admin, contabilidad y supervisor)
router.post('/',
    authMiddleware,
    rolMiddleware(['admin', 'contabilidad', 'supervisor']),
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('apellido').notEmpty().withMessage('El apellido es requerido'),
    body('dni').isInt().withMessage('El DNI debe ser numérico'),
    body('legajo').isInt().withMessage('El legajo debe ser numérico'),
    VigiladorController.crearVigilador
);

// Obtener por ID
router.get('/:id',
    authMiddleware,
    param('id').isInt().withMessage('El ID debe ser un número'),
    VigiladorController.obtenerPorId
);

// Obtener por DNI
router.get('/dni/:dni',
    authMiddleware,
    param('dni').isInt().withMessage('El DNI debe ser un número'),
    VigiladorController.obtenerPorDni
);

// Listar todos
router.get('/',
    authMiddleware,
    VigiladorController.listarTodos
);

// Actualizar vigilador (admin, contabilidad y supervisor)
router.put('/:id',
    authMiddleware,
    rolMiddleware(['admin', 'contabilidad', 'supervisor']),
    param('id').isInt().withMessage('El ID debe ser un número'),
    body('nombre').optional().isString(),
    body('apellido').optional().isString(),
    body('dni').optional().isInt(),
    body('legajo').optional().isInt(),
    VigiladorController.actualizarVigilador
);

// Eliminar vigilador (admin, contabilidad y supervisor)
router.delete('/:id',
    authMiddleware,
    rolMiddleware(['admin', 'contabilidad', 'supervisor']),
    param('id').isInt().withMessage('El ID debe ser un número'),
    VigiladorController.eliminarVigilador
);

module.exports = router;
