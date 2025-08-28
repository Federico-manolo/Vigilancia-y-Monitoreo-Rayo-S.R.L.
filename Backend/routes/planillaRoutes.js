const express = require('express');
const router = express.Router();
const PlanillaController = require('../controllers/planillaController');
const authMiddleware = require('../middleware/authMiddleware');
const rlsMiddleware = require('../middleware/rlsMiddleware');
const { rolMiddleware, propietarioMiddleware } = require('../middleware/rolMiddleware');
const Planilla = require('../models/planilla');
const { body, param } = require('express-validator');

// Crear planilla (admin, contabilidad y supervisor)
router.post('/',
    authMiddleware, rlsMiddleware,
    rolMiddleware(['admin', 'contabilidad', 'supervisor']),
    body('id_puesto').isInt().withMessage('El id_puesto debe ser numérico'),
    body('mes').isInt({ min: 1, max: 12 }).withMessage('Mes inválido'),
    body('anio').isInt().withMessage('Año inválido'),
    PlanillaController.crearPlanilla
);

// Obtener planillas por puesto
router.get('/puesto/:idPuesto',
    authMiddleware, rlsMiddleware,
    param('idPuesto').isInt().withMessage('El ID debe ser un número'),
    PlanillaController.obtenerPorPuesto
);

// Obtener por id
router.get('/:id',
    authMiddleware, rlsMiddleware,
    param('id').isInt().withMessage('El ID debe ser un número'),
    PlanillaController.obtenerPorId
);

// Listar días de una planilla
router.get('/:id/dias',
    authMiddleware, rlsMiddleware,
    param('id').isInt().withMessage('El ID debe ser un número'),
    PlanillaController.listarDias
);

/*// Actualizar planilla
router.put('/:id',
    authMiddleware,
    param('id').isInt().withMessage('El ID debe ser un número'),
    PlanillaController.actualizarPlanilla
);*/

// Eliminar planilla (admin, contabilidad y supervisor propietario)
router.delete('/:id',
    authMiddleware, rlsMiddleware,
    rolMiddleware(['admin', 'contabilidad', 'supervisor']),
    propietarioMiddleware(Planilla),
    param('id').isInt().withMessage('El ID debe ser un número'),
    PlanillaController.eliminarPlanilla
);

// Duplicar planilla (admin, contabilidad y supervisor)
router.post('/duplicar',
    authMiddleware, rlsMiddleware,
    rolMiddleware(['admin', 'contabilidad', 'supervisor']),
    body('id_puesto').isInt().withMessage('El id_puesto debe ser numérico'),
    body('mes_origen').isInt({ min: 1, max: 12 }).withMessage('Mes de origen inválido'),
    body('anio_origen').isInt().withMessage('Año de origen inválido'),
    body('mes_destino').isInt({ min: 1, max: 12 }).withMessage('Mes destino inválido'),
    body('anio_destino').isInt().withMessage('Año destino inválido'),
    PlanillaController.duplicarPlanilla
);

// Listar vigiladores de una planilla
router.get('/:id/vigiladores',
    authMiddleware, rlsMiddleware,
    param('id').isInt().withMessage('El ID debe ser un número'),
    PlanillaController.listarVigiladoresPorPlanilla
);

// Agregar vigilador a una planilla (admin, contabilidad y supervisor propietario)
router.post('/:id/vigiladores',
    authMiddleware, rlsMiddleware,
    rolMiddleware(['admin', 'contabilidad', 'supervisor']),
    propietarioMiddleware(Planilla),
    param('id').isInt().withMessage('El ID debe ser un número'),
    body('id_vigilador').isInt().withMessage('El id_vigilador debe ser numérico'),
    PlanillaController.agregarVigilador
);

// Quitar vigilador de una planilla (admin, contabilidad y supervisor propietario)
router.delete('/:id/vigiladores',
    authMiddleware, rlsMiddleware,
    rolMiddleware(['admin', 'contabilidad', 'supervisor']),
    propietarioMiddleware(Planilla),
    param('id').isInt().withMessage('El ID debe ser un número'),
    body('id_vigilador').isInt().withMessage('El id_vigilador debe ser numérico'),
    PlanillaController.quitarVigilador
);

module.exports = router;
