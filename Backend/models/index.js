const { sequelize } = require('../config/db');

const Usuario = require('./usuario');
const Vigilador = require('./vigilador');
const Servicio = require('./servicio');
const Puesto = require('./puesto');
const Planilla = require('./planilla');
const DiaPlanilla = require('./dia_planilla');
const Turno = require('./turno');
const DiaVigilador = require('./dia_vigilador');
const DiaPuestoTipo = require('./dia_puesto_tipo');
const LogAccion = require('./log_accion');
const PlanillaVigilador = require('./planilla_vigilador');
const ContinuidadTurno = require('./continuidad_turno');
const RefreshToken = require('./refresh_token');
const PasswordResetToken = require('./password_reset_token');

// RELACIONES

// Servicio → Puesto
Servicio.hasMany(Puesto, { foreignKey: 'id_servicio' });
Puesto.belongsTo(Servicio, { foreignKey: 'id_servicio' });

// Servicio → Usuario (creador)
Servicio.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'creador' });
Usuario.hasMany(Servicio, { foreignKey: 'id_usuario', as: 'servicios' });

// Puesto → Planilla
Puesto.hasMany(Planilla, { foreignKey: 'id_puesto' });
Planilla.belongsTo(Puesto, { foreignKey: 'id_puesto' });

//Puesto posee varios DiaPuestoTipo
Puesto.hasMany(DiaPuestoTipo, { foreignKey: 'id_puesto' });
DiaPuestoTipo.belongsTo(Puesto, { foreignKey: 'id_puesto' }); 

// Planilla → DíaPlanilla
Planilla.hasMany(DiaPlanilla, { foreignKey: 'id_planilla' });
DiaPlanilla.belongsTo(Planilla, { foreignKey: 'id_planilla' });

//DiaPlanilla está basado en DiaPlanillaTipo
DiaPlanilla.belongsTo(DiaPuestoTipo, { foreignKey: 'id_dia_tipo' });

// DíaPlanilla → Turno
DiaPlanilla.hasMany(Turno, { foreignKey: 'id_dia_planilla' });
Turno.belongsTo(DiaPlanilla, { foreignKey: 'id_dia_planilla' });

// Vigilador → DíaVigilador
Vigilador.hasMany(DiaVigilador, { foreignKey: 'id_vigilador' });
DiaVigilador.belongsTo(Vigilador, { foreignKey: 'id_vigilador' });

//Turno está asociado a DiaVigilador
DiaVigilador.hasMany(Turno, { foreignKey: 'id_dia_vigilador' });
Turno.belongsTo(DiaVigilador, { foreignKey: 'id_dia_vigilador' });  

// PlanillaVigilador: relación entre Planilla y Vigilador
Planilla.belongsToMany(Vigilador, {
  through: PlanillaVigilador,
  foreignKey: 'id_planilla',
  otherKey: 'id_vigilador',
  as: 'vigiladores'
});
Vigilador.belongsToMany(Planilla, {
  through: PlanillaVigilador,
  foreignKey: 'id_vigilador',
  otherKey: 'id_planilla',
  as: 'planillas'
});
PlanillaVigilador.belongsTo(Planilla, { foreignKey: 'id_planilla' });
PlanillaVigilador.belongsTo(Vigilador, { foreignKey: 'id_vigilador' });
Planilla.hasMany(PlanillaVigilador, { foreignKey: 'id_planilla' });
Vigilador.hasMany(PlanillaVigilador, { foreignKey: 'id_vigilador' });

// Relaciones para ContinuidadTurno
ContinuidadTurno.belongsTo(Turno, { foreignKey: 'id_turno' });
ContinuidadTurno.belongsTo(DiaPlanilla, { foreignKey: 'id_dia_planilla_destino' });
ContinuidadTurno.belongsTo(DiaVigilador, { foreignKey: 'id_dia_vigilador_destino' });
ContinuidadTurno.belongsTo(Vigilador, { foreignKey: 'id_vigilador' });
// Relaciones inversas si se requieren consultas desde el otro lado:
Turno.hasMany(ContinuidadTurno, { foreignKey: 'id_turno' });
DiaPlanilla.hasMany(ContinuidadTurno, { foreignKey: 'id_dia_planilla_destino' });
DiaVigilador.hasMany(ContinuidadTurno, { foreignKey: 'id_dia_vigilador_destino' });
Vigilador.hasMany(ContinuidadTurno, { foreignKey: 'id_vigilador' });

// Relaciones para LogAccion
LogAccion.belongsTo(Usuario, { foreignKey: 'id_usuario' });
Usuario.hasMany(LogAccion, { foreignKey: 'id_usuario' });

module.exports = {
  sequelize,
  Usuario,
  Vigilador,
  Servicio,
  Puesto,
  Planilla,
  DiaPlanilla,
  Turno,
  DiaVigilador,
  DiaPuestoTipo,
  LogAccion,
  PlanillaVigilador,
  ContinuidadTurno,
  RefreshToken,
  PasswordResetToken,
};    
