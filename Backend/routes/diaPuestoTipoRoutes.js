const { Router } = require('express');
const { body, param } = require('express-validator');
const DiaPuestoTipoController = require('../controllers/diaPuestoTipoController');
const authMiddleware = require('../middleware/authMiddleware');
const rlsMiddleware = require('../middleware/rlsMiddleware');

const router = Router();

// Crear un nuevo Día Tipo
router.post(
  '/',
  authMiddleware, rlsMiddleware,
  [
    body('id_puesto')
      .notEmpty().withMessage('El id_puesto es obligatorio')
      .isInt().withMessage('El id_puesto debe ser un número'),
    body('dia_semana')
      .notEmpty().withMessage('El dia_semana es obligatorio')
      .isInt({ min: 0, max: 6 }).withMessage('El dia_semana debe estar entre 0 y 6'),
    body('es_laborable')
      .notEmpty().withMessage('El campo es_laborable es obligatorio')
      .isBoolean().withMessage('es_laborable debe ser booleano'),
    body('jornada_horario_partido')
      .notEmpty().withMessage('El campo jornada_horario_partido es obligatorio')
      .isBoolean().withMessage('jornada_horario_partido debe ser booleano'),
    // Los campos horario_entrada, horario_salida, horario_entrada2, horario_salida2, fecha_especial son opcionales,
    // pero podemos validarlos si vienen, por ejemplo que sean de tipo hora o fecha:
    body('horario_entrada').optional({ nullable: true }).isString().withMessage('horario_entrada debe ser una cadena (HH:mm)'),
    body('horario_salida').optional({ nullable: true }).isString().withMessage('horario_salida debe ser una cadena (HH:mm)'),
    body('horario_entrada2').optional({ nullable: true }).isString().withMessage('horario_entrada2 debe ser una cadena (HH:mm)'),
    body('horario_salida2').optional({ nullable: true }).isString().withMessage('horario_salida2 debe ser una cadena (HH:mm)'),
    body('fecha_especial')
      .custom((value) => {
        // Permitir null o undefined
        if (value === null || value === undefined || value === '') return true;
        // Si viene un valor, debe ser una fecha válida ISO8601
        if (typeof value === 'string' && !isNaN(Date.parse(value))) return true;
        throw new Error('fecha_especial debe ser una fecha válida o null');
      }),
  ],
  DiaPuestoTipoController.crearDiaTipo
);

// Listar DPTs por puesto
router.get(
  '/puesto/:id_puesto',
  authMiddleware, rlsMiddleware,
  [
    param('id_puesto').isInt().withMessage('id_puesto debe ser un número'),
  ],
  DiaPuestoTipoController.listarPorPuesto
);

// Obtener DPT por ID
router.get(
  '/:id',
  authMiddleware, rlsMiddleware,
  [
    param('id').isInt().withMessage('id debe ser un número'),
  ],
  DiaPuestoTipoController.obtenerPorId
);

// Actualizar DPT
router.put(
  '/:id',
  authMiddleware, rlsMiddleware,
  [
    param('id').isInt().withMessage('id debe ser un número'),
    // En el body puede venir cualquier campo de los que se pueden actualizar:
    body('dia_semana').optional().isInt({ min: 0, max: 6 }).withMessage('dia_semana debe estar entre 0 y 6'),
    body('es_laborable').optional().isBoolean().withMessage('es_laborable debe ser booleano'),
    body('jornada_horario_partido').optional().isBoolean().withMessage('jornada_horario_partido debe ser booleano'),
    body('horario_entrada').optional({ nullable: true }).isString().withMessage('horario_entrada debe ser una cadena (HH:mm)'),
    body('horario_salida').optional({ nullable: true }).isString().withMessage('horario_salida debe ser una cadena (HH:mm)'),
    body('horario_entrada2').optional({ nullable: true }).isString().withMessage('horario_entrada2 debe ser una cadena (HH:mm)'),
    body('horario_salida2').optional({ nullable: true }).isString().withMessage('horario_salida2 debe ser una cadena (HH:mm)'),
    body('fecha_especial').optional({ nullable: true }).isISO8601().withMessage('fecha_especial debe ser una fecha válida'),
  ],
  DiaPuestoTipoController.actualizarDiaTipo
);

// Eliminar DPT
router.delete(
  '/:id',
  authMiddleware, rlsMiddleware,
  [
    param('id').isInt().withMessage('id debe ser un número'),
  ],
  DiaPuestoTipoController.eliminarDiaTipo
);

module.exports = router;
