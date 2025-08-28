const { LogAccion } = require('../models');

class LogService {

    static async registrarAccion({ id_usuario, accion, detalles = null }, transaction = null) {
        if (!id_usuario || !accion) {
            // Evitar romper el flujo por errores de logging
            console.warn('[LogService] registrarAccion: faltan parámetros id_usuario o accion');
            return null;
        }

        // Dejar que la BD complete fecha y hora por defecto
        return await LogAccion.create({
            id_usuario,
            accion,
            detalles,
        }, { transaction });
    }

    static async obtenerLogs({ id_usuario, accion } = {}) {
        const where = {};
        if (id_usuario) where.id_usuario = id_usuario;
        if (accion) where.accion = accion;

        return await LogAccion.findAll({
            where,
            order: [['fecha', 'DESC']],
        });
    }
}

module.exports = LogService;
