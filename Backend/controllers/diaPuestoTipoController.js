const DiaPuestoTipoService = require('../services/diaPuestoTipoService');
const { validationResult } = require('express-validator');
const AppError = require('../structure/AppError');

class DiaPuestoTipoController {

    static async crearDiaTipo(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            

            const data = req.body;
            const nuevoDPT = await DiaPuestoTipoService.crearDPT(data, req.transaction);
            return res.status(201).json(nuevoDPT);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al crear día tipo', 500, error.message));
        }
    }

    static async listarPorPuesto(req, res, next) {
        try {
            const id_puesto = req.params.id_puesto;
            const lista = await DiaPuestoTipoService.listarDPTPorPuesto(id_puesto);
            return res.status(200).json(lista);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al obtener días tipo del puesto', 500, error.message));
        }
    }

    static async obtenerPorId(req, res, next) {
        try {
            const id = req.params.id;
            const dpt = await DiaPuestoTipoService.obtenerDPTPorId(id);
            return res.status(200).json(dpt);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al obtener el día tipo', 404, error.message));
        }
    }

    static async actualizarDiaTipo(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const id = req.params.id;
            const data = req.body;
            console.log(data);
            const actualizado = await DiaPuestoTipoService.actualizarDPT(id, data, req.transaction);
            return res.status(200).json(actualizado);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al actualizar el día tipo', 500, error.message));
        }
    }

    static async eliminarDiaTipo(req, res, next) {
        try {
            const id = req.params.id;
            await DiaPuestoTipoService.eliminarDPT(id, req.transaction);
            return res.status(200).json({ mensaje: 'Día tipo eliminado correctamente' });
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al eliminar el día tipo', 500, error.message));
        }
    }
}

module.exports = DiaPuestoTipoController;
