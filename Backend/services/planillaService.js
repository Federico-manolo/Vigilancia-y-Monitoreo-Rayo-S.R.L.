const { Planilla, PlanillaVigilador } = require('../models');
const { sequelize } = require('../config/db');
const AppError = require('../structure/AppError');
const DiaPlanillaService = require('./diaPlanillaService');
const LogService = require('./logService');
const TurnoService = require('./turnoService');
const DiaVigiladorService = require('./diaVigiladorService');
const PlanillaVigiladorService = require('./planillaVigiladorService');
const generarFechasDelMes = require('../src/utils/fechas');
const ContinuidadTurnoService = require('./continuidadTurnoService');
const { DiaVigiladorEstado } = require('../src/constants/status');


class PlanillaService {
    static async crearPlanilla({ id_puesto, mes, anio}, id_usuario, transaction ) {
        // 1. Validar que no exista una planilla ya creada
        const yaExiste = await Planilla.findOne({
            where: { id_puesto, mes, anio }
        });

        if (yaExiste) {
            throw new AppError('Ya existe una planilla para este puesto en ese mes y año.', 400);
        }

        const t = transaction || await sequelize.transaction();

        try {
            // 2. Crear planilla base (horas_mensuales se calcula después)
            const planilla = await Planilla.create({
                id_puesto,
                mes,
                anio,
                horas_mensuales: 0, // temporal, se actualiza luego
                id_usuario
            }, { transaction: t });

            await LogService.registrarAccion({
                id_usuario,
                accion: 'crear_planilla',
                detalles: `Se creó la planilla para el puesto ${id_puesto} en el mes ${mes} del año ${anio}`,
            });

            const dias = [];
            const totalDiasMes = new Date(anio, mes, 0).getDate(); // último día del mes

            for (let d = 1; d <= totalDiasMes; d++) {
                const fecha = new Date(anio, mes - 1, d);
                const fechaStr = fecha.toISOString().split('T')[0];

                dias.push({
                    id_planilla: planilla.id_planilla,
                    id_puesto,
                    fecha: fechaStr
                });
            }

            // Crear los días utilizando el servicio modular
            const diasCreados = await DiaPlanillaService.crearDiasEnLote(dias, t);

            // Sumar horas totales
            const horasTotales = diasCreados.reduce((acc, dia) => acc + dia.horas_requeridas, 0);

            // Actualizar la planilla con el total de horas
            await planilla.update({ horas_mensuales: horasTotales }, { transaction: t });

            if (!transaction) await t.commit();
            return planilla;

        } catch (error) {
            if (!transaction) await t.rollback();
            throw new AppError('Error al crear la planilla: ' + error.message, 500);
        }
    }

    static async duplicarPlanilla({ id_puesto, mes_origen, anio_origen, mes_destino, anio_destino}, id_usuario, transaction = null) {
        // validar que no exista destino
        const yaExisteDestino = await Planilla.findOne({ where: { id_puesto, mes: mes_destino, anio: anio_destino } });
        if (yaExisteDestino) {
            throw new AppError('Ya existe una planilla en el mes/año destino para este puesto.', 400);
        }

        const planillaADuplicar = await Planilla.findOne({
            where: { id_puesto, mes: mes_origen, anio: anio_origen }
        });
    
        if (!planillaADuplicar) {
            throw new AppError('No existe planilla del mes correspondiente para duplicar.', 404);
        }
    
        const diasADuplicar = await DiaPlanillaService.listarPorPlanilla(planillaADuplicar.id_planilla);
        const idsDiasADuplicar = diasADuplicar.map(d => d.id_dia_planilla);
        const turnosADuplicar = await TurnoService.listarPorDias(idsDiasADuplicar);
    
        const t = transaction || await sequelize.transaction();
        const advertencias = [];
    
        try {
            const nuevaPlanilla = await Planilla.create({
                id_puesto,
                mes: mes_destino,
                anio: anio_destino,
                horas_mensuales: 0,
                id_usuario
            }, { transaction: t });
    
            // Crear días en paralelo
            const nuevosDias = await Promise.all(
                diasADuplicar.map(async diaAnt => {
                    const fechaAnt = new Date(diaAnt.fecha);
                    const lastDay = new Date(anio_destino, mes_destino, 0).getDate();
                    const targetDay = Math.min(fechaAnt.getDate(), lastDay);
                    const nuevaFecha = new Date(anio_destino, mes_destino - 1, targetDay);
                    const nuevaFechaStr = nuevaFecha.toISOString().split('T')[0];
                    const nuevoDia = await DiaPlanillaService.crearDia({
                        ...diaAnt.toJSON(),
                        id_planilla: nuevaPlanilla.id_planilla,
                        fecha: nuevaFechaStr
                    }, t);
                    return [diaAnt.id_dia_planilla, nuevoDia];
                })
            );
    
            const mapDias = new Map(nuevosDias);
            const turnosPorDia = {};
            for (const turnoAnt of turnosADuplicar) {
                if (!turnosPorDia[turnoAnt.id_dia_planilla]) {
                    turnosPorDia[turnoAnt.id_dia_planilla] = [];
                }
                turnosPorDia[turnoAnt.id_dia_planilla].push(turnoAnt);
            }
    
            // Calcular horas mensuales desde horas_requeridas de los días creados
            const horasRequeridasTotales = nuevosDias.reduce((acc, [_, dia]) => acc + parseFloat(dia.horas_requeridas || 0), 0);
    
            for (const [id_dia_planilla_ant, nuevoDia] of mapDias.entries()) {
                const turnosDelDia = turnosPorDia[id_dia_planilla_ant] || [];
                const sumaHorasTurnos = turnosDelDia.reduce((acc, t) => acc + parseFloat(t.cantidad_horas), 0);
    
                if (turnosDelDia.length > 0 && sumaHorasTurnos !== parseFloat(nuevoDia.horas_requeridas)) {
                    advertencias.push(`El día ${nuevoDia.fecha} requiere ${nuevoDia.horas_requeridas}h pero los turnos a duplicar suman ${sumaHorasTurnos}h. No se asignaron turnos para ese día.`);
                    continue;
                }
    
                await Promise.all(turnosDelDia.map(async (turnoAnt) => {
                    const diaVigAnt = await DiaVigiladorService.obtenerPorId(turnoAnt.id_dia_vigilador);
                    if (!diaVigAnt) {
                        throw new AppError(`No se encontró el dia_vigilador ${turnoAnt.id_dia_vigilador}`, 404);
                    }
    
                    let diaVigNuevo = await DiaVigiladorService.buscarPorVigiladorYFecha(diaVigAnt.id_vigilador, nuevoDia.fecha);
                    if (!diaVigNuevo) {
                        diaVigNuevo = await DiaVigiladorService.crearDia({
                            id_vigilador: diaVigAnt.id_vigilador,
                            fecha: nuevoDia.fecha,
                            estado: DiaVigiladorEstado.TRABAJA
                        }, t);
                    }
    
                    const nuevoTurno = await TurnoService.crearTurno(
                    id_usuario,
                        {
                        id_dia_vigilador: diaVigNuevo.id_dia_vigilador,
                        id_dia_planilla: nuevoDia.id_dia_planilla,
                        hora_inicio: turnoAnt.hora_inicio,
                        cantidad_horas: turnoAnt.cantidad_horas,
                        horas_diurnas: turnoAnt.horas_diurnas,
                        horas_nocturnas: turnoAnt.horas_nocturnas,
                        hora_fin: turnoAnt.hora_fin
                    }, 
                    t
                );
                }));
            }
    
            await nuevaPlanilla.update({ horas_mensuales: horasRequeridasTotales }, { transaction: t });
    
            await LogService.registrarAccion({
                id_usuario,
                accion: 'Duplicación de planilla.',
                detalles: `Se duplicó la planilla ${planillaADuplicar.mes}/${planillaADuplicar.anio} a ${mes_destino}/${anio_destino} para puesto ${id_puesto}`
            });
    
            if (!transaction) await t.commit();
            return { nuevaPlanilla, advertencias };
        } catch (error) {
            if (!transaction) await t.rollback();
            throw new AppError('Error al duplicar planilla: ' + error.message, 500);
        }
    }
    
    static async listarPorPuesto(id_puesto) {
        return await Planilla.findAll({
            where: { id_puesto },
            order: [['anio', 'DESC'], ['mes', 'DESC']]
        });
    }

    static async obtenerPorId(id_planilla) {
        const planilla = await Planilla.findByPk(id_planilla);
        if (!planilla) throw new AppError('Planilla no encontrada', 404);
        return planilla;
    }

    static async eliminar(id_planilla, id_usuario, transaction = null) {
        const planilla = await Planilla.findByPk(id_planilla);
        if (!planilla) throw new AppError('Planilla no encontrada', 404);
        
        const t = transaction || await sequelize.transaction();
        
        try {
            // Eliminamos continuidades cuyo destino u origen pertenecen a esta planilla
            await ContinuidadTurnoService.eliminarPorPlanillaDestino(id_planilla, t);
            await ContinuidadTurnoService.eliminarPorPlanillaOrigen(id_planilla, t);

            // Eliminamos todos los turnos asociados a los días planillas de la misma
            await TurnoService.eliminarPorPlanilla(id_planilla, t);
            
            // Eliminar los días de la planilla
            await DiaPlanillaService.eliminarPorPlanilla(id_planilla, t);
            
            // Eliminar relaciones de vigiladores asociados a la planilla
            await PlanillaVigilador.destroy({ where: { id_planilla }, transaction: t });

            // Eliminar la planilla
            await planilla.destroy({ transaction: t });
            
            await LogService.registrarAccion({
                id_usuario,
                accion: 'Eliminación de Planilla',
                detalles: `Se eliminó la planilla ${planilla.mes}/${planilla.anio} del puesto ${planilla.id_puesto}`
            }, t);
            
            if (!transaction) await t.commit();
            return true;
        } catch (error) {
            if (!transaction) await t.rollback();
            throw new AppError('Error al eliminar la planilla: ' + error.message, 500);
        }
    }

    static async agregarVigilador(id_planilla, id_vigilador, id_usuario, transaction = null) {
        const planilla = await Planilla.findByPk(id_planilla);
        if (!planilla) throw new AppError('Planilla no encontrada', 404);
        console.log('id_vigilador', id_vigilador);
        console.log('id_planilla', id_planilla);
        // Verificar existencia previa
        const existe = await PlanillaVigilador.findOne({
            where: { id_planilla, id_vigilador }
        });
        if (existe) throw new AppError('El vigilador ya está agregado a esta planilla.', 400);
        console.log('existe', existe);

        const t = transaction || await sequelize.transaction();

        try {
            await PlanillaVigilador.create({ id_planilla, id_vigilador }, { transaction: t });

            // Generar fechas del mes
            const fechas = generarFechasDelMes(planilla.anio, planilla.mes);

            // Buscar días existentes
            const diasExistentes = await DiaVigiladorService.buscarPorVigiladorYFechas(id_vigilador, fechas, t);
            const fechasExistentes = new Set(diasExistentes.map(d => d.fecha));

            let diasCreados = 0;
            if (fechasExistentes.size < fechas.length) {
                const diasANuevos = fechas
                    .filter(f => !fechasExistentes.has(f))
                    .map(f => ({
                        id_vigilador,
                        fecha: f,
                        estado: DiaVigiladorEstado.NO_ASIGNADO
                    }));
                if (diasANuevos.length) {
                    await DiaVigiladorService.crearDiasEnLote(diasANuevos,t );
                    diasCreados = diasANuevos.length;
                }
            }

            await LogService.registrarAccion({
                id_usuario,
                accion: 'Agregar vigilador a planilla',
                detalles: `Vigilador ${id_vigilador} agregado a planilla ${id_planilla}. Se crearon ${diasCreados} días nuevos`
            }, t);

            if (!transaction) await t.commit();
            return { mensaje: 'Vigilador agregado correctamente', dias_creados: diasCreados };
        } catch (error) {
            if (!transaction) await t.rollback();
            throw new AppError('Error al agregar vigilador a planilla: ' + error.message, 500);
        }
    }

    static async quitarVigilador(id_planilla, id_vigilador, id_usuario, transaction = null) {
        const planilla = await Planilla.findByPk(id_planilla);
        if (!planilla) throw new AppError('Planilla no encontrada', 404);
    
        const t = transaction || await sequelize.transaction();
        try {
            // 1. Borrar las continuidades de los turnos que vamos a eliminar, luego eliminar los turnos
            const primerDiaMes = `${planilla.anio}-${String(planilla.mes).padStart(2,'0')}-01`;
            const ultimoDiaMes = `${planilla.anio}-${String(planilla.mes).padStart(2,'0')}-${new Date(planilla.anio, planilla.mes, 0).getDate()}`;

            // Primero, obtener los id_turno que serán eliminados
            const turnosAEliminar = await sequelize.query(`
                SELECT t.id_turno
                FROM turno t
                WHERE t.id_dia_planilla IN (
                    SELECT id_dia_planilla FROM dia_planilla WHERE id_planilla = :id_planilla
                )
                AND t.id_dia_vigilador IN (
                    SELECT id_dia_vigilador FROM dia_vigilador 
                    WHERE id_vigilador = :id_vigilador 
                    AND fecha BETWEEN :fechaInicio AND :fechaFin
                )
            `, {
                replacements: {
                    id_planilla,
                    id_vigilador,
                    fechaInicio: primerDiaMes,
                    fechaFin: ultimoDiaMes
                },
                type: sequelize.QueryTypes.SELECT,
                transaction: t
            });

            const idsTurnos = turnosAEliminar.map(t => t.id_turno);
            if (idsTurnos.length > 0) {
                // Eliminar continuidades asociadas a estos turnos
                await sequelize.query(`
                    DELETE FROM turno_continuidad
                    WHERE id_turno IN (:idsTurnos)
                `, {
                    replacements: { idsTurnos },
                    transaction: t
                });

                // Ahora sí, eliminar los turnos
                await sequelize.query(`
                    DELETE FROM turno
                    WHERE id_turno IN (:idsTurnos)
                `, {
                    replacements: { idsTurnos },
                    transaction: t
                });
            }

            // 1.1 Recalcular horas de todos los días de la planilla tras eliminar turnos
            const diasPlanilla = await sequelize.query(
                `SELECT id_dia_planilla FROM dia_planilla WHERE id_planilla = :id_planilla`,
                { replacements: { id_planilla }, type: sequelize.QueryTypes.SELECT, transaction: t }
            );
            for (const row of diasPlanilla) {
                await DiaPlanillaService.recalcularHorasDiaPlanilla(row.id_dia_planilla, t);
            }
    
            // 2. Borrar la relación vigilador-planilla
            const deleted = await PlanillaVigilador.destroy({
                where: { id_planilla, id_vigilador },
                transaction: t
            });
    
            if (!deleted) throw new AppError('El vigilador no estaba asignado a la planilla.', 400);
    
            // 3. Registrar en la bitácora
            await LogService.registrarAccion({
                id_usuario,
                accion: 'Quitar vigilador de planilla',
                detalles: `Se quitó el vigilador ${id_vigilador} de la planilla ${id_planilla} y se eliminaron sus turnos del mes`
            }, t);
    
            if (!transaction) await t.commit();
            return { mensaje: 'Vigilador quitado correctamente y turnos eliminados' };
    
        } catch (error) {
            if (!transaction) await t.rollback();
            throw new AppError('Error al quitar vigilador de planilla: ' + error.message, 500);
        }
    }

    static async listarVigiladoresPorPlanilla(id_planilla) {
        const planilla = await Planilla.findByPk(id_planilla);
        if (!planilla) throw new AppError('Planilla no encontrada', 404);
        // Buscamos todos los vigiladores asociados a la planilla
        return PlanillaVigiladorService.obtenerVigiladoresPorPlanilla(id_planilla);
    }

}

module.exports = PlanillaService;  