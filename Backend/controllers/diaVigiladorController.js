const DiaVigiladorService = require('../services/diaVigiladorService');
const { validationResult } = require('express-validator');
const AppError = require('../structure/AppError');
const { sequelize } = require('../config/db');


class DiaVigiladorController {
    static async crearDia(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

            const { id_vigilador, fecha, estado } = req.body;
            const nuevoDia = await DiaVigiladorService.crearDia({ id_vigilador, fecha, estado }, req.transaction);
            return res.status(201).json(nuevoDia);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al crear día vigilador', 500, error.message));
        }
    }

    static async crearDiasAutomaticosDelMes(req, res, next) {
        try {
            const { id_vigilador, mes, anio } = req.body;
            const dias = await DiaVigiladorService.crearDiasAutomaticosDelMes(id_vigilador, mes, anio, req.transaction);
            return res.status(201).json(dias);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al crear días automáticos', 500, error.message));
        }
    }

    static async listarDiasDelMes(req, res, next) {
        try {
            const { id_vigilador, mes, anio } = req.query;

            const dias = await DiaVigiladorService.listarDiasDelMes(id_vigilador, mes, anio);
            return res.status(200).json(dias);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al listar días', 500, error.message));
        }
    }

    static async obtenerPorId(req, res, next) {
        try {
            const { id } = req.params;
            const dia = await DiaVigiladorService.obtenerPorId(id);
            return res.status(200).json(dia);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al obtener día', 500, error.message));
        }
    }

    static async buscarPorVigiladorYFecha(req, res, next) {
        try {
            const { id_vigilador, fecha } = req.query;

            const dia = await DiaVigiladorService.buscarPorVigiladorYFecha(id_vigilador, fecha);
            return res.status(200).json(dia);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al buscar día', 500, error.message));
        }
    }

    static async actualizarDia(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

            const { id } = req.params;
            const data = req.body;
            const id_usuario = req.user?.id_usuario;

            const diaActualizado = await DiaVigiladorService.actualizarDia(id, data, id_usuario, req.transaction);
            return res.status(200).json(diaActualizado);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al actualizar día', 500, error.message));
        }
    }

    static async eliminarDia(req, res, next) {
        try {
            const { id } = req.params;
            await DiaVigiladorService.eliminarDia(id, req.transaction);
            return res.status(200).json({ mensaje: 'Día eliminado correctamente' });
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al eliminar día', 500, error.message));
        }
    }

    static async eliminarDiasDelMes(req, res, next) {
        try {
            const { id_vigilador, mes, anio } = req.query;

            const eliminados = await DiaVigiladorService.eliminarDiasDelMes(id_vigilador, mes, anio, req.transaction);
            return res.status(200).json({ mensaje: `Se eliminaron ${eliminados} días del mes` });
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al eliminar días del mes', 500, error.message));
        }
    }
}

module.exports = DiaVigiladorController;
