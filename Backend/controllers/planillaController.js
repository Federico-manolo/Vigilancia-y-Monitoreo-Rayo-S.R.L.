const PlanillaService = require('../services/planillaService');
const { validationResult } = require('express-validator');
const AppError = require('../structure/AppError');
const DiaPlanillaService = require('../services/diaPlanillaService');

class PlanillaController {

    static async crearPlanilla(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { id_puesto, mes, anio } = req.body;
            const id_usuario = req.user?.id_usuario;

            const nuevaPlanilla = await PlanillaService.crearPlanilla({ id_puesto, mes, anio }, id_usuario, req.transaction);
            return res.status(201).json(nuevaPlanilla);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al crear la planilla', 500, error.message));
        }
    }

    static async listarDias(req, res, next) {
        try {
            const id_planilla = req.params.id;
            const dias = await DiaPlanillaService.listarPorPlanilla(id_planilla, req.transaction);
            return res.status(200).json(dias);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al obtener días de la planilla', 500, error.message));
        }
    }

    static async obtenerPorPuesto(req, res, next) {
        try {
            const idPuesto = req.params.idPuesto;
            const planillas = await PlanillaService.listarPorPuesto(idPuesto);
            return res.status(200).json(planillas);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al obtener planillas', 500, error.message));
        }
    }

    static async obtenerPorId(req, res, next) {
        try {
            const id = req.params.id;
            const planilla = await PlanillaService.obtenerPorId(id);
            return res.status(200).json(planilla);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al obtener la planilla', 404, error.message));
        }
    }

 /*   static async actualizarPlanilla(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const id = req.params.id;
            const data = req.body;
            const id_usuario = req.user?.id_usuario;

            const planillaActualizada = await PlanillaService.actualizarPlanilla(id, data, id_usuario);
            return res.status(200).json(planillaActualizada);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al actualizar la planilla', 500, error.message));
        }
    }
*/
    static async eliminarPlanilla(req, res, next) {
        try {
            const id = req.params.id;
            const id_usuario = req.user?.id_usuario;

            await PlanillaService.eliminar(id, id_usuario, req.transaction);
            return res.status(200).json({ mensaje: 'Planilla eliminada correctamente (soft delete)' });
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al eliminar la planilla', 500, error.message));
        }
    }

    static async duplicarPlanilla(req, res, next) {
        try {
            const { id_puesto, mes_origen, anio_origen, mes_destino, anio_destino } = req.body;
            const id_usuario = req.user?.id_usuario;

            const resultado = await PlanillaService.duplicarPlanilla({ 
                id_puesto, 
                mes_origen, anio_origen, 
                mes_destino, anio_destino 
            }, id_usuario, req.transaction);
            return res.status(200).json(resultado);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al duplicar la planilla', 500, error.message));
        }
    }

    static async listarVigiladoresPorPlanilla(req, res, next) {
        try {
            const id_planilla = req.params.id;
            const vigiladores = await PlanillaService.listarVigiladoresPorPlanilla(id_planilla);
            return res.status(200).json(vigiladores);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al obtener vigiladores de la planilla', 500, error.message));
        }
    }

    static async agregarVigilador(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const id_planilla = req.params.id;
            const { id_vigilador } = req.body;
            const id_usuario = req.user?.id_usuario;

            if (!id_vigilador) {
                return res.status(400).json({ errors: [{ msg: 'id_vigilador es requerido' }] });
            }

            const resultado = await PlanillaService.agregarVigilador(id_planilla, id_vigilador, id_usuario, req.transaction);
            return res.status(200).json(resultado);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al agregar vigilador a la planilla', 500, error.message));
        }
    }

    static async quitarVigilador(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const id_planilla = req.params.id;
            const { id_vigilador } = req.body;
            const id_usuario = req.user?.id_usuario;

            if (!id_vigilador) {
                return res.status(400).json({ errors: [{ msg: 'id_vigilador es requerido' }] });
            }

            const resultado = await PlanillaService.quitarVigilador(id_planilla, id_vigilador, id_usuario, req.transaction);
            return res.status(200).json(resultado);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al quitar vigilador de la planilla', 500, error.message));
        }
    }

    
}

module.exports = PlanillaController;
