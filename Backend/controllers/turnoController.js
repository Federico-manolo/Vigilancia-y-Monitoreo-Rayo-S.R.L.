const TurnoService = require('../services/turnoService');
const { validationResult } = require('express-validator');
const AppError = require('../structure/AppError');

class TurnoController {

    static async crearTurno(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { id_dia_vigilador, id_dia_planilla, hora_inicio, cantidad_horas, id_planilla } = req.body;
            const id_usuario = req.user?.id_usuario;
            const nuevoTurno = await TurnoService.crearTurno(id_usuario, {
                id_dia_vigilador,
                id_dia_planilla,
                hora_inicio,
                cantidad_horas
            }, req.transaction);

            return res.status(201).json(nuevoTurno);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al crear turno', 500, error.message));
        }
    }

    static async crearTurnosEnLote(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { vigiladores, turnosOrganizadosPorDia } = req.body;
            const id_usuario = req.user?.id_usuario;

            const resultado = await TurnoService.crearTurnosEnLote(id_usuario, {
                vigiladores,
                turnosOrganizadosPorDia
            }, req.transaction);

            return res.status(201).json(resultado);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al crear turnos en lote', 500, error.message));
        }
    }

    static async obtenerTurnosPorDiaVigilador(req, res, next) {
        try {
            const { id_dia_vigilador } = req.params;
            
            if (!id_dia_vigilador) {
                throw new AppError('ID de día vigilador es requerido', 400);
            }

            const turnos = await TurnoService.obtenerTurnosPorDiaVigilador(id_dia_vigilador);
            return res.status(200).json(turnos);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al obtener turnos por día vigilador', 500, error.message));
        }
    }

    static async obtenerTurnosPorDiaPlanilla(req, res, next) {
        try {
            const { id_dia_planilla } = req.params;
            
            if (!id_dia_planilla) {
                throw new AppError('ID de día planilla es requerido', 400);
            }

            const turnos = await TurnoService.obtenerTurnosPorDiaPlanilla(id_dia_planilla, req.transaction);
            return res.status(200).json(turnos);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al obtener turnos por día planilla', 500, error.message));
        }
    }

    static async listarPorDias(req, res, next) {
        try {
            const { idsDiasPlanilla } = req.body;
            
            if (!Array.isArray(idsDiasPlanilla) || idsDiasPlanilla.length === 0) {
                throw new AppError('Array de IDs de días planilla es requerido', 400);
            }

            const turnos = await TurnoService.listarPorDias(idsDiasPlanilla);
            return res.status(200).json(turnos);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al listar turnos por días', 500, error.message));
        }
    }

    static async obtenerTurnosPorPlanilla(req, res, next) {
        try {
            const { id_planilla } = req.params;
            if (!id_planilla) throw new AppError('ID de planilla es requerido', 400);
            const turnos = await TurnoService.obtenerTurnosPorPlanilla(id_planilla, req.transaction);
            return res.status(200).json(turnos);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al obtener turnos por planilla', 500, error.message));
        }
    }

    static async actualizarTurno(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { id } = req.params;
            const data = req.body;
            const id_usuario = req.user?.id_usuario;

            const turnoActualizado = await TurnoService.actualizarTurno(id, data, id_usuario, req.transaction);
            return res.status(200).json(turnoActualizado);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al actualizar turno', 500, error.message));
        }
    }

    static async eliminarTurno(req, res, next) {
        try {
            const { id } = req.params;
            const id_usuario = req.user?.id_usuario;

            await TurnoService.eliminarTurno(id_usuario, id, req.transaction);
            return res.status(200).json({ mensaje: 'Turno eliminado correctamente' });
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al eliminar turno', 500, error.message));
        }
    }

    static async verificarSolapamiento(req, res, next) {
        try {
            const { id_dia_vigilador, id_dia_vigilador_siguiente, hora_inicio, hora_fin } = req.body;
            
            if (!id_dia_vigilador || !hora_inicio || !hora_fin) {
                throw new AppError('id_dia_vigilador, hora_inicio y hora_fin son requeridos', 400);
            }

            const haySolapamiento = await TurnoService.verificarSolapamientoRobusto(
                id_dia_vigilador, 
                id_dia_vigilador_siguiente, 
                hora_inicio, 
                hora_fin
            );

            return res.status(200).json({ 
                haySolapamiento,
                mensaje: haySolapamiento ? 'Existe solapamiento de horarios' : 'No hay solapamiento de horarios'
            });
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al verificar solapamiento', 500, error.message));
        }
    }
}

module.exports = TurnoController; 