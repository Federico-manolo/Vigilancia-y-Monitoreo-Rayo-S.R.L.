const express = require('express');
const router = express.Router();

// Importar todas las rutas
const vigiladorRoutes = require('../routes/vigiladorRoutes');
const servicioRoutes = require('../routes/servicioRoutes');
const puestoRoutes = require('../routes/puestoRoutes');
const planillaRoutes = require('../routes/planillaRoutes');
const diaVigiladorRoutes = require('../routes/diaVigiladorRoutes');
const diaPuestoTipoRoutes = require('../routes/diaPuestoTipoRoutes');
const turnoRoutes = require('../routes/turnoRoutes');
const usuarioRoutes = require('../routes/usuarioRoutes');
const authRoutes = require('../routes/authRoutes');
const contabilidadRoutes = require('../routes/contabilidadRoutes');

// Registrar las rutas con sus prefijos
router.use('/vigiladores', vigiladorRoutes);
router.use('/servicios', servicioRoutes);
router.use('/puestos', puestoRoutes);
router.use('/planillas', planillaRoutes);
router.use('/dia-vigilador', diaVigiladorRoutes);
router.use('/dia-puesto-tipo', diaPuestoTipoRoutes);
router.use('/turnos', turnoRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/auth', authRoutes);
router.use('/contabilidad', contabilidadRoutes);

module.exports = router; 