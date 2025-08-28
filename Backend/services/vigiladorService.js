const { Vigilador } = require('../models');
const LogService = require('./logService');
const AppError = require('../structure/AppError');
class VigiladorService {
    static async crearVigilador(data, id_usuario) {
        console.log('holaa', data);
        const existente = await Vigilador.findOne({ where: { dni: data.dni } });
        if (existente) {
            throw new AppError('Ya existe un vigilador con ese DNI.', 400);
        }
        console.log('data', data);
        const vigilador = Vigilador.create(data);
        await LogService.registrarAccion({id_usuario, accion :`Se creó el el vigilador ${vigilador.nombre}`});
        return vigilador;
    }

    static async obtenerPorId(id_vigilador) {
        const vigilador = await Vigilador.findByPk(id_vigilador);
        if (!vigilador) throw new Error('Vigilador no encontrado');
        return vigilador;
    }

    static async obtenerPorDni(dni) {
        const vigilador = await Vigilador.findOne({ where: { dni } });
        if (!vigilador) throw new Error('Vigilador no encontrado por DNI');
        return vigilador;
    }

    static async listarTodos({incluirInactivos = false} = {}) {
        const where = incluirInactivos ? {} : {activo:true};
        return await Vigilador.findAll({
            where,
            order: [['apellido', 'ASC'], ['nombre', 'ASC']]
        });
    }

    static async actualizarVigilador(id_vigilador, data, id_usuario) {
        const vigilador = await Vigilador.findByPk(id_vigilador);
        if (!vigilador) throw new Error('Vigilador no encontrado');
        await vigilador.update(data);
        await LogService.registrarAccion({
            id_usuario, 
            accion :`Se actualizaron los datos del vigilador ${vigilador.nombre}`, 
            detalles:`Las modificaciones fueron ${JSON.stringify(data)}`
        });
        return vigilador;
    }

    static async eliminarVigilador(id_vigilador, id_usuario) {
        const vigilador = await Vigilador.findByPk(id_vigilador);
        if (!vigilador) throw new Error('Vigilador no encontrado');
        await vigilador.update({ activo: false });
        await LogService.registrarAccion({
            id_usuario,
            accion: `Se eliminó de manera lógica el vigilador ${vigilador.nombre}.`
        });

        return { mensaje: 'Vigilador eliminado de manera lógica correctamente.' };    }
}

module.exports = VigiladorService;
