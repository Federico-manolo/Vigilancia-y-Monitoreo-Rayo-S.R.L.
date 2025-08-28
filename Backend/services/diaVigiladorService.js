const { DiaVigilador } = require('../models');
const { DiaVigiladorEstado } = require('../src/constants/status');
const { Op } = require('sequelize');
const AppError = require('../structure/AppError');
const LogService = require('./logService');

class DiaVigiladorService {

    static async crearDia(data, transaction = null) {
        return await DiaVigilador.create(data, { transaction });
    }

    static async crearDiasEnLote(diasData, transaction = null) {
        return await DiaVigilador.bulkCreate(diasData, { transaction });
    }

    static async crearDiasAutomaticosDelMes(id_vigilador, mes, anio, transaction = null) {
        // Calcular el primer y último día del mes
        const fechaInicio = new Date(anio, mes - 1, 1);
        const fechaFin = new Date(anio, mes, 0); // último día del mes

        // Generar todas las fechas del mes en formato YYYY-MM-DD
        const diasData = [];
        for (
            let d = new Date(fechaInicio);
            d <= fechaFin;
            d.setDate(d.getDate() + 1)
        ) {
            const fechaStr = d.toISOString().split('T')[0];
            diasData.push({
                id_vigilador,
                fecha: fechaStr,
                estado: DiaVigiladorEstado.NO_ASIGNADO
            });
        }

        // Evitar duplicados: filtrar días que ya existen para ese vigilador y mes
        const fechasExistentes = await DiaVigilador.findAll({
            where: {
                id_vigilador,
                fecha: {
                    [Op.between]: [
                        fechaInicio.toISOString().split('T')[0],
                        fechaFin.toISOString().split('T')[0]
                    ]
                }
            },
            attributes: ['fecha']
        });

        const fechasExistentesSet = new Set(fechasExistentes.map(d => d.fecha));
        const diasDataFiltrados = diasData.filter(d => !fechasExistentesSet.has(d.fecha));

        // Solo crear los días que no existen
        if (diasDataFiltrados.length === 0) {
            return [];
        }

        return await this.crearDiasEnLote(diasDataFiltrados, transaction);
    }

    static async listarDiasDelMes(id_vigilador, mes, anio) {
        const fechaInicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
        const fechaFin = new Date(anio, mes, 0).toISOString().split('T')[0];
        return await DiaVigilador.findAll({
            where: {
                id_vigilador,
                fecha: {
                    [Op.between]: [fechaInicio, fechaFin]
                }
            },
            order: [['fecha', 'ASC']]
        });
    }

    static async obtenerPorId(id_dia_vigilador) {
        const dia = await DiaVigilador.findByPk(id_dia_vigilador);
        if (!dia) throw new Error('Día de vigilador no encontrado');
        return dia;
    }

    static async buscarPorVigiladorYFecha(id_vigilador, fecha) {
        return await DiaVigilador.findOne({
            where: {
                id_vigilador,
                fecha
            }
        });
    }

    static async buscarPorVigiladorYFechas(id_vigilador, fechas, t) {
        return await DiaVigilador.findAll({
            where: { id_vigilador, fecha: fechas },
            transaction: t
        });
    }

    static async actualizarDia(id_dia_vigilador, data, id_usuario, transaction = null) {
        const dia = await DiaVigilador.findByPk(id_dia_vigilador, { transaction });
        if (!dia) throw new AppError('Día no encontrado');
        await dia.update(data, { transaction });
        await LogService.registrarAccion({
            id_usuario,
            accion: 'actualizar_dia_vigilador',
            detalles: `Se actualizó el día vigilador ${id_dia_vigilador} con los datos: ${JSON.stringify(data)}`
        }, transaction);
        return dia;
    }

    static async eliminarDia(id_dia_vigilador, transaction = null) {
        const dia = await DiaVigilador.findByPk(id_dia_vigilador, { transaction });
        if (!dia) throw new Error('Día no encontrado');
        await dia.destroy({ transaction });
        return true;
    }

    static async eliminarDiasDelMes(id_vigilador, mes, anio, transaction = null) {
        const fechaInicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
        const fechaFin = new Date(anio, mes, 0).toISOString().split('T')[0];

        return await DiaVigilador.destroy({
            where: {
                id_vigilador,
                fecha: {
                    [Op.between]: [fechaInicio, fechaFin]
                }
            },
            transaction
        });
    }

    static async obtenerDiaSiguiente(id_vigilador, fecha) {
        // Aprovecha el índice compuesto (id_vigilador, fecha) para buscar el siguiente día
        // fecha debe estar en formato 'YYYY-MM-DD'
        return await DiaVigilador.findOne({
            where: {
                id_vigilador,
                fecha: { [Op.gt]: fecha }
            },
            order: [['fecha', 'ASC']]
        });
    }
}

module.exports = DiaVigiladorService;
