const VigiladorService = require('../services/vigiladorService');
const { validationResult } = require('express-validator');
const AppError = require('../structure/AppError');

class VigiladorController {
    static async crearVigilador(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const { nombre, apellido, dni, legajo } = req.body;
            const id_usuario = req.user?.id_usuario;

            const vigilador = await VigiladorService.crearVigilador({ nombre, apellido, dni, legajo }, id_usuario);
            return res.status(201).json(vigilador);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al crear vigilador', 500, error.message));
        }
    }

    static async obtenerPorId(req, res, next) {
        try {
            const { id } = req.params;
            const vigilador = await VigiladorService.obtenerPorId(id);
            return res.status(200).json(vigilador);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al obtener vigilador', 500, error.message));
        }
    }

    static async obtenerPorDni(req, res, next) {
        try {
            const { dni } = req.params;
            const vigilador = await VigiladorService.obtenerPorDni(dni);
            return res.status(200).json(vigilador);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al obtener vigilador por DNI', 500, error.message));
        }
    }

    static async listarTodos(req, res, next) {
        try {
            // opción query ?incluirInactivos=true
            const incluirInactivos = req.query.incluirInactivos === 'true';
            const vigiladores = await VigiladorService.listarTodos({ incluirInactivos });
            return res.status(200).json(vigiladores);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al listar vigiladores', 500, error.message));
        }
    }

    static async actualizarVigilador(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const { id } = req.params;
            const data = req.body;
            const id_usuario = req.user?.id_usuario;

            const vigiladorActualizado = await VigiladorService.actualizarVigilador(id, data, id_usuario);
            return res.status(200).json(vigiladorActualizado);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al actualizar vigilador', 500, error.message));
        }
    }

    static async eliminarVigilador(req, res, next) {
        try {
            const { id } = req.params;
            const id_usuario = req.user?.id_usuario;

            await VigiladorService.eliminarVigilador(id, id_usuario);
            return res.status(200).json({ mensaje: 'Vigilador eliminado correctamente' });
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al eliminar vigilador', 500, error.message));
        }
    }
}

module.exports = VigiladorController;
