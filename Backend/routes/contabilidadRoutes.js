const express = require('express');
const router = express.Router();
const ContabilidadController = require('../controllers/contabilidadController');
const authMiddleware = require('../middleware/authMiddleware');
const { rolMiddleware } = require('../middleware/rolMiddleware');
const rlsMiddleware = require('../middleware/rlsMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { query, param } = require('express-validator');

// Autenticación condicional para facilitar pruebas locales
if (process.env.SKIP_AUTH !== '1') {
  router.use(authMiddleware, rlsMiddleware, rolMiddleware(['admin', 'contabilidad']));
}

// Resumen mensual de horas por vigilador (planificación)
router.get('/vigiladores/:id/resumen',
  param('id').isInt(),
  query('mes').isInt({ min:1, max:12 }),
  query('anio').isInt({ min:2000 }),
  ContabilidadController.resumenVigilador
);

// Planilla diaria del mes por vigilador (planificación detallada)
router.get('/vigiladores/:id/planilla',
  param('id').isInt(),
  query('mes').isInt({ min:1, max:12 }),
  query('anio').isInt({ min:2000 }),
  ContabilidadController.planillaVigilador
);

// Importa Excel de asistencias reales y compara contra planificación
router.post('/asistencias/importar',
  upload.any(),
  //upload.single('file'),
  ContabilidadController.importarExcel
);

module.exports = router;
