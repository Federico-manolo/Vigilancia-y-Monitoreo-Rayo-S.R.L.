const express = require('express');
const router = express.Router();
const UsuarioController = require('../controllers/usuarioController');
const authMiddleware = require('../middleware/authMiddleware');
const { rolMiddleware } = require('../middleware/rolMiddleware');
const { body, param, query } = require('express-validator');

// Crear usuario (admin, contabilidad y supervisor)
router.post('/',
    authMiddleware,
    rolMiddleware(['admin', 'contabilidad', 'supervisor']),
    body('nombre').notEmpty().withMessage('Nombre es requerido'),
    body('apellido').notEmpty().withMessage('Apellido es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('contraseña').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('rol').optional().isString(),
    UsuarioController.crearUsuario
);

// Obtener usuario por ID
router.get('/:id',
    authMiddleware,
    param('id').isInt().withMessage('ID debe ser numérico'),
    UsuarioController.obtenerUsuarioPorId
);

// Obtener usuario por email
router.get('/email/:email',
    authMiddleware,
    param('email').isEmail().withMessage('Email inválido'),
    UsuarioController.obtenerUsuarioPorEmail
);

// Listar usuarios
router.get('/',
    authMiddleware,
    query('rol').optional().isString(),
    query('activo').optional().isBoolean(),
    UsuarioController.listarUsuarios
);

// Actualizar usuario
router.put('/:id',
    authMiddleware,
    param('id').isInt().withMessage('ID debe ser numérico'),
    body('nombre').optional().isString(),
    body('apellido').optional().isString(),
    body('email').optional().isEmail(),
    body('contraseña').optional().isLength({ min: 6 }),
    body('rol').optional().isString(),
    UsuarioController.actualizarUsuario
);

// Cambiar rol (admin y contabilidad)
router.put('/:id/rol',
    authMiddleware,
    rolMiddleware(['admin', 'contabilidad']),
    param('id').isInt().withMessage('ID debe ser numérico'),
    body('nuevoRol').notEmpty().withMessage('Nuevo rol es requerido'),
    UsuarioController.cambiarRol
);

// Cambiar estado (activo/inactivo) (admin y contabilidad)
router.put('/:id/estado',
    authMiddleware,
    rolMiddleware(['admin', 'contabilidad']),
    param('id').isInt().withMessage('ID debe ser numérico'),
    body('activo').isBoolean().withMessage('Activo debe ser booleano'),
    UsuarioController.cambiarEstado
);

// Eliminar usuario (admin y contabilidad)
router.delete('/:id',
    authMiddleware,
    rolMiddleware(['admin', 'contabilidad']),
    param('id').isInt().withMessage('ID debe ser numérico'),
    UsuarioController.eliminarUsuario
);

module.exports = router; 