const ServicioService = require('../services/servicioService');
const { validationResult } = require('express-validator');
const AppError = require('../structure/AppError');
 
class ServicioController {

    static async crearServicio(req, res, next) {
        try {
            // Validaciones previas
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { nombre, ubicacion } = req.body;
            const id_usuario = req.user?.id_usuario; // suponiendo que viene desde el middleware de auth

            const nuevoServicio = await ServicioService.crearServicio(nombre, ubicacion, id_usuario, req.transaction);

            return res.status(201).json(nuevoServicio);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al crear el servicio', 500, error.message));
        }
    }

    static async obtenerTodosServicios(req, res, next) {
        try {
            const incluirInactivos = req.query.incluirInactivos === 'true';
            const servicios = await ServicioService.obtenerTodosServicios({ incluirInactivos });
            return res.status(200).json(servicios);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al obtener los servicios', 500, error.message));
        }
    }

    static async obtenerServicioPorUsuario(req, res, next){
        try {
            const id_usuario = req.user?.id_usuario;
            const incluirInactivos = req.query.incluirInactivos === 'true';
            if (!id_usuario) {
                throw new AppError('ID de usuario no proporcionado', 400);
             }
             
            const servicios = await ServicioService.obtenerServiciosPorUsuario(id_usuario, { incluirInactivos });
            return res.status(200).json(servicios);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al obtener los servicios del usuario', 500, error.message));
        }
    }

    static async obtenerServicioPorId(req, res, next) {
        try {
            const id = req.params.id;
            const servicio = await ServicioService.obtenerServicioPorId(id);
            return res.status(200).json(servicio);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al obtener el servicio', 404, error.message));
        }
    }

    static async actualizarServicio(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const id = req.params.id;
            const { nombre, ubicacion } = req.body;
            const id_usuario = req.user?.id_usuario;

            const servicioActualizado = await ServicioService.actualizarServicio(id, { nombre, ubicacion }, id_usuario, req.transaction);
            return res.status(200).json(servicioActualizado);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al actualizar el servicio', 500, error.message));
        }
    }

    static async eliminarServicio(req, res, next) {
        try {
            const id = req.params.id;
            const id_usuario = req.user?.id_usuario;

            await ServicioService.eliminarServicio(id, id_usuario, req.transaction);
            return res.status(200).json({ mensaje: 'Servicio eliminado correctamente (soft delete)' });
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al eliminar el servicio', 500, error.message));
        }
    }

}

module.exports = ServicioController;
