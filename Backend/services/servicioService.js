const Servicio = require('../models/servicio');
const Puesto = require('../models/puesto'); 
const AppError = require('../structure/AppError');
const LogService = require('./logService');
const PuestoService = require('./puestoService');

class ServicioService{
    static async crearServicio(nombre, ubicacion, id_usuario, transaction = null){
        const servicio = await Servicio.create({nombre, ubicacion, id_usuario}, { transaction });
        await LogService.registrarAccion({id_usuario, accion:`Se creó el servicio ${servicio.nombre}`}, transaction);
        return servicio;
    }

    static async obtenerTodosServicios({ incluirInactivos = false } = {}) {
        const where = incluirInactivos ? {} : { activo: true };
        return await Servicio.findAll({ 
            where,
            include: [{ association: 'creador', attributes: ['id_usuario','nombre','apellido','email'] }]
        });
    }

    static async obtenerServicioPorId(id) {
        const servicio = await Servicio.findByPk(id, {
            include: [
                { model: Puesto },
                { association: 'creador', attributes: ['id_usuario','nombre','apellido','email'] }
            ],
        });
        if (!servicio) {
            throw new AppError('El servicio especificado no se encuentra', 404);
        }
        return servicio;
    }

    static async obtenerServiciosPorUsuario(id_usuario, { incluirInactivos = false } = {}) {
        const where = { id_usuario };
        if (!incluirInactivos) {
            where.activo = true;
        }
        return await Servicio.findAll({ where });
    }
    static async actualizarServicio(id, data, id_usuario, transaction = null) {
        const servicio = await Servicio.findByPk(id, { transaction });
        if (!servicio) {
            throw new AppError('El servicio especificado no se encuentra', 404);
        }
        await servicio.update(data, { transaction });
        await LogService.registrarAccion({
            id_usuario, 
            accion: `Se actualizó información del servicio ${servicio.nombre}`, 
            detalles: JSON.stringify(data)}, transaction);
        return servicio;
    }

    static async eliminarServicio(id, id_usuario, transaction = null) {
        const servicio = await Servicio.findByPk(id, {
            include: [{ model: Puesto }],
            transaction
        });
        if (!servicio) {
            throw new AppError('El servicio especificado no se encuentra', 404);
        }
        // Eliminar todos los puestos asociados primero
        if (servicio.Puestos && servicio.Puestos.length > 0) {
            await Promise.all(servicio.Puestos.map(puesto => PuestoService.eliminarPuesto(puesto.id_puesto, id_usuario, transaction)));
        }

        // Luego eliminar el servicio de manera lógica 
        await servicio.update({activo:false}, { transaction });        
        //Levamos acabo el registro
        await LogService.registrarAccion({id_usuario, accion:`Se eliminó de manera lógica el servicio ${servicio.nombre}.`}, transaction);
    }
}


module.exports = ServicioService;