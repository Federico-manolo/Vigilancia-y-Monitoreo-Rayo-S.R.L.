const { ContinuidadTurno } = require('../models');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');

class ContinuidadTurnoService {
  
  static async crearContinuidad({ id_turno, id_vigilador, fecha, id_dia_planilla_destino, id_dia_vigilador_destino, hora_inicio_heredada, hora_fin_heredada }, transaction = null) {
    return await ContinuidadTurno.create(
      { id_turno, id_vigilador, fecha, id_dia_planilla_destino, id_dia_vigilador_destino, hora_inicio_heredada, hora_fin_heredada },
      { transaction }
    );
  }

  static async obtenerPorDiaPlanilla(id_dia_planilla_destino, transaction = null) {
    return await ContinuidadTurno.findAll({
      where: { id_dia_planilla_destino },
      transaction
    });
  }

  static async obtenerPorDiaVigilador(id_dia_vigilador, transaction = null) {
    return await ContinuidadTurno.findAll({
      where: { id_dia_vigilador_destino: id_dia_vigilador },
      transaction
    });
  }

  static async eliminarPorTurno(id_turno, transaction = null) {
    return await ContinuidadTurno.destroy({
      where: { id_turno },
      transaction
    });
  }

  static async actualizarPorTurno(id_turno, fields, transaction = null) {
    // Actualiza todas las continuidades asociadas a un turno (suele ser 1)
    return await ContinuidadTurno.update(fields, {
      where: { id_turno },
      transaction
    });
  }

  static async eliminarPorDiaPlanilla(id_dia_planilla_destino, transaction = null) {
    return await ContinuidadTurno.destroy({
      where: { id_dia_planilla_destino },
      transaction
    });
  }

  static async obtenerPorTurno(id_turno, transaction = null) {
    return await ContinuidadTurno.findAll({
      where: { id_turno },
      transaction
    });
  }

  static async eliminarPorPlanillaDestino(id_planilla, transaction = null) {
    // Borra continuidades cuyo día planilla destino pertenece a la planilla dada
    return await ContinuidadTurno.destroy({
      where: {
        id_dia_planilla_destino: {
          [Op.in]: sequelize.literal(`(
            SELECT id_dia_planilla FROM dia_planilla WHERE id_planilla = ${id_planilla}
          )`)
        }
      },
      transaction
    });
  }

  static async eliminarPorPlanillaOrigen(id_planilla, transaction = null) {
    // Borra continuidades cuyo turno original pertenece a un día de la planilla dada
    return await ContinuidadTurno.destroy({
      where: {
        id_turno: {
          [Op.in]: sequelize.literal(`(
            SELECT t.id_turno FROM turno t
            WHERE t.id_dia_planilla IN (
              SELECT id_dia_planilla FROM dia_planilla WHERE id_planilla = ${id_planilla}
            )
          )`)
        }
      },
      transaction
    });
  }

  static async obtenerPorVigiladorYFecha(id_vigilador, fecha, transaction = null) {
    return await ContinuidadTurno.findAll({
      where: { id_vigilador, fecha },
      transaction
    });
  }
  static async crearContinuidadesEnLote(continuidades, transaction = null) {
    // continuidades: array de objetos con los campos de ContinuidadTurno
    return await ContinuidadTurno.bulkCreate(continuidades, { transaction });
  }

  // Más métodos si necesitas...
}

module.exports = ContinuidadTurnoService;
