const Puesto = require('../models/puesto');
const AppError = require('../structure/AppError');
const LogService = require('./logService');
const DiaPuestoTipoService = require('./diaPuestoTipoService');
const { sequelize } = require('../config/db');

class PuestoService{
    static async crearPuesto(id_servicio, nombre, cant_horas, id_usuario, transaction){
        const options = transaction ? { transaction } : undefined;
        const puesto = await Puesto.create({
            id_servicio,
            nombre,
            cant_horas,
            id_usuario
        }, options);
        await LogService.registrarAccion({ id_usuario, accion: `Creación del puesto ${puesto.nombre}`});
        return puesto; 
    }

    static async crearPuestoConDPTs(datosPuesto, dptList = [], id_usuario, transaction = null) {
        // Validación básica
        if (!datosPuesto?.id_servicio || !datosPuesto?.nombre || !datosPuesto?.cant_horas) {
            throw new AppError('Faltan datos obligatorios del puesto', 404);
        }
        const t = transaction || await sequelize.transaction();

        try {
            const puesto = await Puesto.create({
                ...datosPuesto,
                id_usuario
            }, { transaction: t });
                for (const dpt of dptList) {
                    const esLaborable = dpt.es_laborable === undefined ? true : !!dpt.es_laborable;
                    const jornadaPartida = esLaborable ? !!dpt.jornada_horario_partido : false;
                    const dptNormalized = {
                        id_puesto: puesto.id_puesto,
                        dia_semana: typeof dpt.dia_semana === 'number' ? dpt.dia_semana : parseInt(dpt.dia_semana, 10) || 0,
                        fecha_especial: dpt.fecha_especial || null,
                        horario_entrada: esLaborable ? (dpt.horario_entrada || null) : null,
                        horario_salida: esLaborable ? (dpt.horario_salida || null) : null,
                        horario_entrada_2: esLaborable && jornadaPartida ? (dpt.horario_entrada_2 || null) : null,
                        horario_salida_2: esLaborable && jornadaPartida ? (dpt.horario_salida_2 || null) : null,
                        es_laborable: esLaborable,
                        jornada_horario_partido: jornadaPartida,
                    };
                    await DiaPuestoTipoService.crearDPT(dptNormalized, t);
                }
            await LogService.registrarAccion({ id_usuario, accion: `Creación del puesto ${puesto.nombre}`});
            if (!transaction) await t.commit();
            return puesto;
        } catch (error) {
            if (!transaction) await t.rollback();
            throw new AppError(`Error al crear el puesto y sus días tipo: ${error.message}`, 404);
        }
    }

    static async obtenerTodosPuestos({incluirInactivos = false} = {}){
        const where = incluirInactivos ? {} : { activo: true };
        return await Puesto.findAll({ where });
    }

    static async obtenerPuestoPorId(id){
        const puesto = await Puesto.findByPk(id);
        if (!puesto) {
            throw new AppError('El puesto especificado no se encuentra', 404);
        }
        return puesto;
    }

    static async obtenerPuestoPorServicio(id_servicio){ 
        const puestos = await Puesto.findAll({
                where: { id_servicio, activo: true }
            });
        return puestos;
    }

    static async actualizarPuesto(id, data, id_usuario){
        const puesto = await Puesto.update(data, { where: { id_puesto: id } });
        
        if(!puesto){
            throw new AppError('No se pudo actualizar el puesto. Verificá si existe.', 404);
        }

        await LogService.registrarAccion({id_usuario, accion:`El puesto ${puesto.nombre} fue actualizado.`, detalles: JSON.stringify(data)});
        return puesto;
    }

    static async eliminarPuesto(id, id_usuario, transaction = null) {
        const puesto = await Puesto.findByPk(id, { transaction });
        if (!puesto) {
            throw new AppError('El puesto que intenta eliminar no existe.', 404);
        }

        // Tratar ausencia del campo "activo" como activo (compatibilidad con esquemas viejos)
        const activoValue = puesto.get('activo');
        const isActive = (activoValue === undefined || activoValue === null) ? true : !!activoValue;
        if (isActive === false) {
            throw new AppError('El puesto ya fue eliminado anteriormente.', 400);
        }

        await puesto.update({ activo: false }, { transaction });

        await LogService.registrarAccion({
            id_usuario,
            accion: `Eliminación lógica del puesto ${puesto.nombre}`,
        }, transaction);

        return { mensaje: 'Puesto eliminado correctamente.' };
    }
}

module.exports = PuestoService;