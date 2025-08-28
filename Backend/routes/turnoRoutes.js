const express = require('express');
const router = express.Router();
const TurnoController = require('../controllers/turnoController');
const authMiddleware = require('../middleware/authMiddleware');
const rlsMiddleware = require('../middleware/rlsMiddleware');
const { body, param } = require('express-validator');

// Crear turno individual
router.post('/',
    authMiddleware, rlsMiddleware,
    body('id_dia_vigilador').isInt().withMessage('ID de día vigilador debe ser numérico'),
    body('id_dia_planilla').isInt().withMessage('ID de día planilla debe ser numérico'),
    body('hora_inicio').notEmpty().withMessage('Hora de inicio es requerida'),
    body('cantidad_horas').isInt({ min: 1 }).withMessage('Cantidad de horas debe ser un número positivo'),
    TurnoController.crearTurno
);

// Crear turnos en lote
router.post('/lote',
    authMiddleware, rlsMiddleware,
    body('vigiladores').isArray().withMessage('Vigiladores debe ser un array'),
    body('turnosOrganizadosPorDia').isArray().withMessage('Turnos organizados por día debe ser un array'),
    TurnoController.crearTurnosEnLote
);

// Obtener turnos por día vigilador
router.get('/dia-vigilador/:id_dia_vigilador',
    authMiddleware, rlsMiddleware,
    param('id_dia_vigilador').isInt().withMessage('ID de día vigilador debe ser numérico'),
    TurnoController.obtenerTurnosPorDiaVigilador
);

// Obtener turnos por día planilla
router.get('/dia-planilla/:id_dia_planilla',
    authMiddleware, rlsMiddleware,
    param('id_dia_planilla').isInt().withMessage('ID de día planilla debe ser numérico'),
    TurnoController.obtenerTurnosPorDiaPlanilla
);

// Obtener turnos por planilla (optimizado)
router.get('/planilla/:id_planilla',
    authMiddleware, rlsMiddleware,
    param('id_planilla').isInt().withMessage('ID de planilla debe ser numérico'),
    TurnoController.obtenerTurnosPorPlanilla
);

// Listar turnos por múltiples días
router.post('/listar-por-dias',
    authMiddleware, rlsMiddleware,
    body('idsDiasPlanilla').isArray().withMessage('IDs de días planilla debe ser un array'),
    TurnoController.listarPorDias
);

// Actualizar turno
router.put('/:id',
    authMiddleware, rlsMiddleware,
    param('id').isInt().withMessage('ID de turno debe ser numérico'),
    body('hora_inicio').optional().notEmpty().withMessage('Hora de inicio no puede estar vacía'),
    body('cantidad_horas').optional().isInt({ min: 1 }).withMessage('Cantidad de horas debe ser un número positivo'),
    TurnoController.actualizarTurno
);

// Eliminar turno
router.delete('/:id',
    authMiddleware, rlsMiddleware,
    param('id').isInt().withMessage('ID de turno debe ser numérico'),
    TurnoController.eliminarTurno
);

// Verificar solapamiento de horarios
router.post('/verificar-solapamiento',
    authMiddleware, rlsMiddleware,
    body('id_dia_vigilador').isInt().withMessage('ID de día vigilador debe ser numérico'),
    body('hora_inicio').notEmpty().withMessage('Hora de inicio es requerida'),
    body('hora_fin').notEmpty().withMessage('Hora de fin es requerida'),
    body('id_dia_vigilador_siguiente').optional().isInt().withMessage('ID de día vigilador siguiente debe ser numérico'),
    TurnoController.verificarSolapamiento
);

module.exports = router; 