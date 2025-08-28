const PuestoService = require('../services/puestoService');
const { validationResult } = require('express-validator');
const AppError = require('../structure/AppError');

class PuestoController {

    static async crearPuesto(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { id_servicio, nombre, cant_horas  } = req.body;
            const id_usuario = req.user?.id_usuario;

            const nuevoPuesto = await PuestoService.crearPuesto(id_servicio, nombre, cant_horas, id_usuario, req.transaction);

            return res.status(201).json(nuevoPuesto);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al crear el puesto', 500, error.message));
        }
    }

    static async crearPuestoConDiasTipo(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const datosPuesto = req.body.datosPuesto; // ej: { id_servicio, nombre }
            const dptList = req.body.dptList || [];   // lista de días tipo
            const id_usuario = req.user?.id_usuario;

            const nuevoPuesto = await PuestoService.crearPuestoConDPTs(datosPuesto, dptList, id_usuario, req.transaction);
            return res.status(201).json(nuevoPuesto);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al crear el puesto con días tipo', 500, error.message));
        }
    }

    static async obtenerTodosPuestos(req, res, next) {
        try {
            const incluirInactivos = req.query.incluirInactivos === 'true';
            const puestos = await PuestoService.obtenerTodosPuestos({ incluirInactivos });
            return res.status(200).json(puestos);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al obtener los puestos', 500, error.message));
        }
    }

    static async obtenerPuestoPorServicio(req, res, next){
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const id_servicio = req.params.id_servicio || req.query.id_servicio || req.body.id_servicio;
            const puestos = await PuestoService.obtenerPuestoPorServicio(id_servicio);

            return res.status(200).json(puestos);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al obtener los puestos por servicio', 500, error.message));
        }

    }

    static async obtenerPuestoPorId(req, res, next) {
        try {
            const id = req.params.id;
            const puesto = await PuestoService.obtenerPuestoPorId(id);
            return res.status(200).json(puesto);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al obtener el puesto', 404, error.message));
        }
    }

    static async actualizarPuesto(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const id = req.params.id;
            const { nombre, id_servicio, cant_horas } = req.body;
            const id_usuario = req.user?.id_usuario;

            const puestoActualizado = await PuestoService.actualizarPuesto(id, { nombre, id_servicio, cant_horas }, id_usuario);
            return res.status(200).json(puestoActualizado);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al actualizar el puesto', 500, error.message));
        }
    }

    static async eliminarPuesto(req, res, next) {
        try {
            const id = req.params.id;
            const id_usuario = req.user?.id_usuario;

            await PuestoService.eliminarPuesto(id, id_usuario, req.transaction);
            return res.status(200).json({ mensaje: 'Puesto eliminado correctamente (soft delete)' });
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al eliminar el puesto', 500, error.message));
        }
    }

}

module.exports = PuestoController;
