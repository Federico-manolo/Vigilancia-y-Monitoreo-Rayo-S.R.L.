const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { body } = require('express-validator');

// Login
router.post('/login',
    body('email').isEmail().withMessage('Email inválido'),
    body('contraseña').notEmpty().withMessage('Contraseña es requerida'),
    AuthController.login
);

// Refresh token
router.post('/refresh', AuthController.refresh);

// Logout
router.post('/logout', AuthController.logout);

// Solicitar recuperación de contraseña
router.post('/recuperar-password',
    body('email').isEmail().withMessage('Email inválido'),
    AuthController.solicitarRecuperacionPassword
);

// Resetear contraseña
router.post('/reset-password',
    body('token').notEmpty().withMessage('Token es requerido'),
    body('nuevaContraseña').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    AuthController.resetPassword
);

module.exports = router;
