// Estados de comparación de asistencias
const AsistenciaEstado = Object.freeze({
  OK: 'OK',
  DESVIO: 'DESVIO',
  SIN_PLANIFICACION: 'SIN_PLANIFICACION',
  VIGILADOR_DESCONOCIDO: 'VIGILADOR_DESCONOCIDO',
  SIN_COMPARACION: 'SIN_COMPARACION',
});

// Estados posibles para DiaVigilador
const DiaVigiladorEstado = Object.freeze({
  TRABAJA: 'trabaja',
  NO_ASIGNADO: 'No Asignado',
  FERIADO: 'feriado',
  ENFERMO: 'enfermo',
});

module.exports = { AsistenciaEstado, DiaVigiladorEstado };


