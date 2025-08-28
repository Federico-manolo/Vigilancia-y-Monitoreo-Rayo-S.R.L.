const { DiaPuestoTipo, Puesto } = require('../models');
const AppError = require('../structure/AppError');

class DiaPuestoTipoService {

    static async crearDPT(data, transaction = null) {
        const puesto = await Puesto.findByPk(data.id_puesto, { transaction });
        if (!puesto) {
            throw new AppError('Puesto no encontrado', 404);
        }
        return await DiaPuestoTipo.create(data, { transaction });
    }

    
    static async listarDPTPorPuesto(id_puesto) {
        return await DiaPuestoTipo.findAll({
            where: { id_puesto },
            order: [
                ['fecha_especial', 'ASC'],
                ['dia_semana', 'ASC']
            ]
        });
    }

    
    static async obtenerDPTPorId(id) {
        const dpt = await DiaPuestoTipo.findByPk(id);
        if (!dpt) {
            throw new AppError('Día tipo no encontrado', 404);
        }
        return dpt;
    }

    
    static async actualizarDPT(id, data, transaction = null) {
        const dpt = await DiaPuestoTipo.findByPk(id, { transaction });
        if (!dpt) {
            throw new AppError('Día tipo no encontrado', 404);
        }
        await dpt.update(data, { transaction });
        return dpt;
    }

    
    static async eliminarDPT(id, transaction = null) {
        const dpt = await DiaPuestoTipo.findByPk(id, { transaction });
        if (!dpt) {
            throw new AppError('Día tipo no encontrado', 404);
        }
        await dpt.destroy({ transaction });
        return true;
    }

    
    static async obtenerConfiguracionParaFecha(id_puesto, fecha) {
        const diaSemana = new Date(fecha).getDay(); // 0 a 6

        // 1. Buscar configuración específica para ese día
        let config = await DiaPuestoTipo.findOne({
            where: {
                id_puesto,
                fecha_especial: fecha
            }
        });

        // 2. Si no hay específica, usar la general por día de semana
        if (!config) {
            config = await DiaPuestoTipo.findOne({
                where: {
                    id_puesto,
                    dia_semana: diaSemana,
                    fecha_especial: null
                }
            });
        }

        return config;
    }
}

module.exports = DiaPuestoTipoService;