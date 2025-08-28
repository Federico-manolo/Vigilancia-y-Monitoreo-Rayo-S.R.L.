const { Turno, DiaVigilador } = require('../models');
const DiaVigiladorService = require('./diaVigiladorService');
const DiaPlanillaService = require('./diaPlanillaService');
const { calcularHoraFin, calcularHorasDiurnasNocturnas, horaToMinutes } = require('../src/utils/horas');
const AppError = require('../structure/AppError');
const { DiaVigiladorEstado } = require('../src/constants/status');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');
const LogService = require('./logService');
const ContinuidadTurnoService = require('./continuidadTurnoService');
const PlanillaVigiladorService = require('./planillaVigiladorService');

class TurnoService {

    static async verificarSolapamientoRobusto(id_dia_vigilador, id_dia_vigilador_siguiente, hora_inicio, hora_fin, transaction, turnosEnMemoria = [], excluirIdTurno = null) {
        const inicioNuevo = horaToMinutes(hora_inicio);
        const finNuevo = horaToMinutes(hora_fin);
        const cruzaMedianoche = finNuevo <= inicioNuevo;
    
        // 1️⃣ Obtener turnos existentes del mismo vigilador en el día actual
        let turnosActuales = await Turno.findAll({
            where: { id_dia_vigilador },
            transaction
        });
        if (excluirIdTurno) {
            turnosActuales = turnosActuales.filter(t => t.id_turno !== excluirIdTurno);
        }
    
        // 2️⃣ Obtener continuidades que tienen como destino el día actual
        const continuidades = await ContinuidadTurnoService.obtenerPorDiaVigilador(id_dia_vigilador, transaction);
    
        // 3️⃣ Si el nuevo turno cruza medianoche, obtener turnos del mismo vigilador del día siguiente
        let turnosDiaSiguiente = [];
        if (cruzaMedianoche) {
            if (id_dia_vigilador_siguiente) {
                turnosDiaSiguiente = await Turno.findAll({
                    where: { id_dia_vigilador: id_dia_vigilador_siguiente },
                    transaction
                });
            }
        }
    
        // Helper para detectar solapamiento entre dos intervalos
        const hayInterseccion = (ini1, fin1, ini2, fin2) =>
            (ini1 < fin2 && fin1 > ini2);
    
        // 🔍 4️⃣ Verificar contra turnos existentes del día actual
        for (const t of turnosActuales) {
            const ti = horaToMinutes(t.hora_inicio);
            const tf = horaToMinutes(t.hora_fin);
            const cruzaT = tf <= ti;
    
            if (cruzaT) {
                // Turno existente cruza medianoche → se parte en dos fragmentos lógicos
                // Fragmento 1: ti–1440 (23:00–24:00)
                if (hayInterseccion(inicioNuevo, finNuevo, ti, 1440)) return true;
                // Fragmento 2: 0–tf (00:00–03:00)
                if (hayInterseccion(inicioNuevo, finNuevo, 0, tf)) return true;
            } else {
                if (hayInterseccion(inicioNuevo, finNuevo, ti, tf)) return true;
            }
        }
    
        // 🔍 5️⃣ Verificar contra continuidades que caen sobre el día actual
        for (const c of continuidades) {
            const ci = horaToMinutes(c.hora_inicio_heredada);
            const cf = horaToMinutes(c.hora_fin_heredada);
            if (hayInterseccion(inicioNuevo, finNuevo, ci, cf)) return true;
        }
    
        // 🔍 6️⃣ Si el nuevo turno cruza medianoche, verificar fragmento heredado contra turnos del día siguiente
        if (cruzaMedianoche && turnosDiaSiguiente.length > 0) {
            // fragmento heredado: 00:00 hasta finNuevo
            for (const t of turnosDiaSiguiente) {
                const ti = horaToMinutes(t.hora_inicio);
                const tf = horaToMinutes(t.hora_fin);
                const cruzaT = tf <= ti;
    
                if (cruzaT) {
                    // Turno existente cruza medianoche
                    if (hayInterseccion(0, finNuevo, ti, 1440)) return true;
                    if (hayInterseccion(0, finNuevo, 0, tf)) return true;
                } else {
                    if (hayInterseccion(0, finNuevo, ti, tf)) return true;
                }
            }
        }
    
        // 🔍 7️⃣ Verificar contra turnos del lote en memoria (del mismo vigilador, mismo día)
        for (const t of turnosEnMemoria) {
            const ti = horaToMinutes(t.hora_inicio);
            const tf = horaToMinutes(t.hora_fin);
            const cruzaT = tf <= ti;
    
            if (cruzaT) {
                if (hayInterseccion(inicioNuevo, finNuevo, ti, 1440)) return true;
                if (hayInterseccion(inicioNuevo, finNuevo, 0, tf)) return true;
            } else {
                if (hayInterseccion(inicioNuevo, finNuevo, ti, tf)) return true;
            }
        }
    
        // ✅ Si pasó todo, no hay solapamiento
        return false;
    } 

    static async crearTurno(id_usuario, data, transaction = null) {
        let localTransaction = null;
        const useTransaction = transaction || (localTransaction = await sequelize.transaction());
        try {
            const { id_dia_vigilador, id_dia_planilla, hora_inicio, cantidad_horas } = data; 
            // Obtener día vigilador actual (para id_vigilador actual)
            const diaVigActual = await DiaVigiladorService.obtenerPorId(id_dia_vigilador);
            
            // Calcular hora_fin
            const hora_fin = calcularHoraFin(hora_inicio, cantidad_horas);
            // Obtenemos el día vigilador siguiente y el vigilador
            const { idDiaVigiladorSiguiente, fechaSiguiente, id_vigilador } = await this.obtenerDiaVigiladorSiguienteInfo(id_dia_vigilador);
            // Validar solapamiento (considerando posible continuidad en día siguiente)
            const haySolape = await this.verificarSolapamientoRobusto(
                id_dia_vigilador,
                idDiaVigiladorSiguiente,
                hora_inicio,
                hora_fin,
                useTransaction
            );
            if (haySolape) {
                throw new AppError('El turno se solapa con otro ya asignado al vigilador ese día', 400);
            }
            // Validar que el vigilador esté asignado a la planilla (usar vigilador del día actual)
            const diaPlan = await DiaPlanillaService.obtenerPorId(id_dia_planilla);
            const asignados = await PlanillaVigiladorService.obtenerVigiladoresPorPlanilla(diaPlan.id_planilla);
            const asignado = asignados.some(v => v.id_vigilador === (diaVigActual ? diaVigActual.id_vigilador : null));
            if (!asignado) {
                throw new AppError('El vigilador no está asignado a la planilla', 400);
            }
            // Calcular horas diurnas y nocturnas
            const { horas_diurnas, horas_nocturnas } = calcularHorasDiurnasNocturnas(hora_inicio, hora_fin);
            // Crear el turno
            const nuevoTurno = await Turno.create({
                id_dia_vigilador,
                id_dia_planilla,
                hora_inicio,
                cantidad_horas,
                horas_diurnas,
                horas_nocturnas,
                hora_fin, 
            }, { transaction: useTransaction });

            //Sumamos las horas trabajadas al dia_planilla
            await DiaPlanillaService.recalcularHorasDiaPlanilla(id_dia_planilla, useTransaction);
            // Actualizar el estado del DiaVigilador
            await DiaVigiladorService.actualizarDia(id_dia_vigilador, { estado: DiaVigiladorEstado.TRABAJA }, id_usuario);

            // Si el turno cruza medianoche, crear continuidad en día siguiente
            if (horaToMinutes(hora_fin) <= horaToMinutes(hora_inicio) && idDiaVigiladorSiguiente && fechaSiguiente) {
                // Buscar día planilla siguiente por fecha
                const diaPlanillaActual = await DiaPlanillaService.obtenerPorId(id_dia_planilla);
                const planillaDiaSiguiente = await sequelize.query(
                    `SELECT id_dia_planilla FROM dia_planilla WHERE id_planilla = :id_planilla AND fecha = :fecha`,
                    {
                        replacements: { id_planilla: diaPlanillaActual.id_planilla, fecha: fechaSiguiente },
                        type: sequelize.QueryTypes.SELECT,
                        transaction: useTransaction
                    }
                );
                const destino = Array.isArray(planillaDiaSiguiente) && planillaDiaSiguiente[0] ? planillaDiaSiguiente[0].id_dia_planilla : null;
                if (destino) {
                    await ContinuidadTurnoService.crearContinuidad({
                        id_turno: nuevoTurno.id_turno,
                        id_vigilador: diaVigActual ? diaVigActual.id_vigilador : null,
                        fecha: fechaSiguiente,
                        id_dia_planilla_destino: destino,
                        id_dia_vigilador_destino: idDiaVigiladorSiguiente,
                        hora_inicio_heredada: '00:00',
                        hora_fin_heredada: hora_fin
                    }, useTransaction);
                    await DiaPlanillaService.recalcularHorasDiaPlanilla(destino, useTransaction);
                }
            }

            await LogService.registrarAccion({
                id_usuario,
                accion: 'crear_turno',
                detalles: `Se creó un turno (ID: ${nuevoTurno.id_turno}) para el día del vigilador (ID: ${id_dia_vigilador}). Estado del trabajador actualizado a '${DiaVigiladorEstado.TRABAJA}' y se sumaron ${cantidad_horas} horas en DiaPlanilla (ID: ${id_dia_planilla}).`
            });
            
            if (localTransaction) await localTransaction.commit();
            return nuevoTurno;
        } catch (error) {
            if (localTransaction) await localTransaction.rollback();
            throw error;
        }
    }

    static async eliminarTurno(id_usuario, id_turno, transaction = null) {
        let localTransaction = null;
        const useTransaction = transaction || (localTransaction = await sequelize.transaction());
        try {
            const turno = await Turno.findByPk(id_turno, { transaction: useTransaction });
            if (!turno) throw new AppError('Turno no encontrado', 404);

            const { id_dia_vigilador, id_dia_planilla } = turno;

            // 1) Obtener continuidades asociadas a este turno (si las hay)
            const continuidades = await ContinuidadTurnoService.obtenerPorTurno(id_turno, useTransaction);

            // 2) Si había continuidades, eliminarlas primero y guardar destinos únicos
            let destinosUnicos = [];
            if (continuidades && continuidades.length > 0) {
                await ContinuidadTurnoService.eliminarPorTurno(id_turno, useTransaction);
                destinosUnicos = [...new Set(continuidades.map(c => c.id_dia_planilla_destino))];
            }

            // 3) Eliminar el turno
            await turno.destroy({ transaction: useTransaction });

            // 4) Recalcular día origen
            await DiaPlanillaService.recalcularHorasDiaPlanilla(id_dia_planilla, useTransaction);

            // 5) Recalcular horas de cada día planilla destino único (si los hay)
            if (destinosUnicos.length > 0) {
                // Podríamos hacer esto en paralelo si hay muchos destinos, pero normalmente es 1
                for (const idDestino of destinosUnicos) {
                    await DiaPlanillaService.recalcularHorasDiaPlanilla(idDestino, useTransaction);
                }
            }

            // Verificar si quedan turnos para este día del vigilador
            const turnosRestantes = await Turno.findAll({where: { id_dia_vigilador }, transaction: useTransaction});

            const diaPlanilla = await DiaPlanillaService.obtenerPorId(id_dia_planilla);
            //Si no hay más turnos en el día para el vigilador, entonces pasará a No Asignado. 
            if (turnosRestantes.length === 0) {
                await DiaVigiladorService.actualizarDia(id_dia_vigilador, { estado: DiaVigiladorEstado.NO_ASIGNADO }, id_usuario);
            }

            // Registrar acción en el log
            await LogService.registrarAccion({
                id_usuario,
                accion: 'eliminar_turno',
                detalles: `Se eliminó el turno ${id_turno}, (del día planilla ${id_dia_planilla} y día vigilador ${id_dia_vigilador}, con fecha ${diaPlanilla.fecha}`,
            }, useTransaction);

            if (localTransaction) await localTransaction.commit();
            return true;
        } catch (error) {
            if (localTransaction) await localTransaction.rollback();
            throw error;
        }
    }

    static async obtenerTurnosPorDiaVigilador(id_dia_vigilador) {
        return await Turno.findAll({
            where: { id_dia_vigilador },
            order: [['hora_inicio', 'ASC']]
        });
    }

    static async obtenerTurnosPorDiaPlanilla(id_dia_planilla, transaction=null) {
        return await Turno.findAll({
            where: { id_dia_planilla },
            order: [['hora_inicio', 'ASC']], 
            transaction
        });
    }

    static async obtenerTurnosPorPlanilla(id_planilla, transaction = null) {
        const rows = await Turno.findAll({
            where: {
                id_dia_planilla: {
                    [Op.in]: sequelize.literal(`(
                        SELECT id_dia_planilla FROM dia_planilla WHERE id_planilla = ${id_planilla}
                    )`)
                }
            },
            include: [{ model: require('../models').DiaVigilador, attributes: ['id_vigilador'] }],
            order: [['id_dia_planilla', 'ASC'], ['hora_inicio', 'ASC']],
            transaction
        });
        return rows.map(r => {
            const dv = r.DiaVigilador || r.dia_vigilador || null;
            return {
                id_turno: r.id_turno,
                id_dia_planilla: r.id_dia_planilla,
                id_dia_vigilador: r.id_dia_vigilador,
                id_vigilador: dv ? dv.id_vigilador : undefined,
                hora_inicio: r.hora_inicio,
                hora_fin: r.hora_fin,
                cantidad_horas: r.cantidad_horas,
                horas_diurnas: r.horas_diurnas,
                horas_nocturnas: r.horas_nocturnas,
            };
        });
    }

    static async listarPorDias(idsDiasPlanilla) {
        if (!Array.isArray(idsDiasPlanilla) || idsDiasPlanilla.length === 0) {
            return [];
        }
        const rows = await Turno.findAll({
            where: {
                id_dia_planilla: idsDiasPlanilla
            },
            include: [{ model: DiaVigilador, attributes: ['id_vigilador'] }],
            order: [['id_dia_planilla', 'ASC'], ['hora_inicio', 'ASC']]
        });
        // Aplanar para exponer id_vigilador directamente
        return rows.map(r => ({
            id_turno: r.id_turno,
            id_dia_planilla: r.id_dia_planilla,
            id_dia_vigilador: r.id_dia_vigilador,
            id_vigilador: r.DiaVigilador ? r.DiaVigilador.id_vigilador : undefined,
            hora_inicio: r.hora_inicio,
            hora_fin: r.hora_fin,
            cantidad_horas: r.cantidad_horas,
            horas_diurnas: r.horas_diurnas,
            horas_nocturnas: r.horas_nocturnas,
        }));
    }

    static async actualizarTurno(id_turno, data, id_usuario, transaction = null) {
        let localTransaction = null;
        const useTransaction = transaction || (localTransaction = await sequelize.transaction());        
        try {
            const turno = await Turno.findByPk(id_turno, { transaction: useTransaction });
            if (!turno) throw new AppError('Turno no encontrado', 404);
    
            // Helpers para modularizar y evitar repetición
            const buildNewHorarioData = (hora_inicio_input, cantidad_horas_input) => {
                const hora_inicio_calculada = hora_inicio_input ?? turno.hora_inicio;
                const cantidad_horas_calculada = cantidad_horas_input ?? turno.cantidad_horas;
                const hora_fin_calculada = calcularHoraFin(hora_inicio_calculada, cantidad_horas_calculada);
                const { horas_diurnas, horas_nocturnas } = calcularHorasDiurnasNocturnas(hora_inicio_calculada, hora_fin_calculada);
                return { hora_inicio: hora_inicio_calculada, cantidad_horas: cantidad_horas_calculada, hora_fin: hora_fin_calculada, horas_diurnas, horas_nocturnas };
            };

            const getDestinoContinuidad = async () => {
                const { idDiaVigiladorSiguiente, fechaSiguiente } = await this.obtenerDiaVigiladorSiguienteInfo(turno.id_dia_vigilador);
                if (!idDiaVigiladorSiguiente || !fechaSiguiente) return { idDiaVigiladorSiguiente: null, idDiaPlanillaDestino: null, fechaSiguiente: null };
                const diaPlanillaActual = await DiaPlanillaService.obtenerPorId(turno.id_dia_planilla);
                const result = await sequelize.query(
                    `SELECT id_dia_planilla FROM dia_planilla WHERE id_planilla = :id_planilla AND fecha = :fecha`,
                    {
                        replacements: { id_planilla: diaPlanillaActual.id_planilla, fecha: fechaSiguiente },
                        type: sequelize.QueryTypes.SELECT,
                        transaction: useTransaction
                    }
                );
                const idDiaPlanillaDestino = Array.isArray(result) && result[0] ? result[0].id_dia_planilla : null;
                return { idDiaVigiladorSiguiente, idDiaPlanillaDestino, fechaSiguiente };
            };

            const syncContinuidad = async (nuevaHoraInicio, nuevaHoraFin) => {
                const cruza = horaToMinutes(nuevaHoraFin) <= horaToMinutes(nuevaHoraInicio);
                const continuidadesActuales = await ContinuidadTurnoService.obtenerPorTurno(id_turno, useTransaction);
                const destinosUnicos = [...new Set(continuidadesActuales.map(c => c.id_dia_planilla_destino))];

                if (!cruza) {
                    if (continuidadesActuales.length > 0) {
                        await ContinuidadTurnoService.eliminarPorTurno(id_turno, useTransaction);
                        for (const idDestino of destinosUnicos) {
                            await DiaPlanillaService.recalcularHorasDiaPlanilla(idDestino, useTransaction);
                        }
                    }
                    return;
                }

                const { idDiaVigiladorSiguiente, idDiaPlanillaDestino, fechaSiguiente } = await getDestinoContinuidad();
                if (!idDiaVigiladorSiguiente || !idDiaPlanillaDestino) {
                    if (continuidadesActuales.length > 0) {
                        await ContinuidadTurnoService.eliminarPorTurno(id_turno, useTransaction);
                        for (const idDestino of destinosUnicos) {
                            await DiaPlanillaService.recalcularHorasDiaPlanilla(idDestino, useTransaction);
                        }
                    }
                    return;
                }

                if (continuidadesActuales.length === 0) {
                    const diaVigActual = await DiaVigiladorService.obtenerPorId(turno.id_dia_vigilador);
                    await ContinuidadTurnoService.crearContinuidad({
                        id_turno: turno.id_turno,
                        id_vigilador: diaVigActual ? diaVigActual.id_vigilador : null,
                        fecha: fechaSiguiente,
                        id_dia_planilla_destino: idDiaPlanillaDestino,
                        id_dia_vigilador_destino: idDiaVigiladorSiguiente,
                        hora_inicio_heredada: '00:00',
                        hora_fin_heredada: nuevaHoraFin
                    }, useTransaction);
                    await DiaPlanillaService.recalcularHorasDiaPlanilla(idDiaPlanillaDestino, useTransaction);
                    return;
                }

                const mismaRuta = continuidadesActuales.every(c => c.id_dia_vigilador_destino === idDiaVigiladorSiguiente && c.id_dia_planilla_destino === idDiaPlanillaDestino);
                if (mismaRuta) {
                    await ContinuidadTurnoService.actualizarPorTurno(id_turno, { hora_inicio_heredada: '00:00', hora_fin_heredada: nuevaHoraFin }, useTransaction);
                    await DiaPlanillaService.recalcularHorasDiaPlanilla(idDiaPlanillaDestino, useTransaction);
                } else {
                    await ContinuidadTurnoService.eliminarPorTurno(id_turno, useTransaction);
                    for (const idDestino of destinosUnicos) {
                        await DiaPlanillaService.recalcularHorasDiaPlanilla(idDestino, useTransaction);
                    }
                    const diaVigActual = await DiaVigiladorService.obtenerPorId(turno.id_dia_vigilador);
                    await ContinuidadTurnoService.crearContinuidad({
                        id_turno: turno.id_turno,
                        id_vigilador: diaVigActual ? diaVigActual.id_vigilador : null,
                        fecha: fechaSiguiente,
                        id_dia_planilla_destino: idDiaPlanillaDestino,
                        id_dia_vigilador_destino: idDiaVigiladorSiguiente,
                        hora_inicio_heredada: '00:00',
                        hora_fin_heredada: nuevaHoraFin
                    }, useTransaction);
                    await DiaPlanillaService.recalcularHorasDiaPlanilla(idDiaPlanillaDestino, useTransaction);
                }
            };

            // Si cambian horas, recalcular horarios, validar solape y actualizar
            let newData = { ...data };
            const cambianHoras = Boolean(data.hora_inicio || data.cantidad_horas);
            if (cambianHoras) {
                const next = buildNewHorarioData(data.hora_inicio, data.cantidad_horas);
                newData.hora_fin = next.hora_fin;
                newData.horas_diurnas = next.horas_diurnas;
                newData.horas_nocturnas = next.horas_nocturnas;

                const diaVigActual = await DiaVigiladorService.obtenerPorId(turno.id_dia_vigilador);
                let idDiaVigiladorSiguiente = null;
                if (diaVigActual) {
                    const diaSig = await DiaVigiladorService.obtenerDiaSiguiente(diaVigActual.id_vigilador, diaVigActual.fecha);
                    idDiaVigiladorSiguiente = diaSig ? diaSig.id_dia_vigilador : null;
                }
                const haySolape = await this.verificarSolapamientoRobusto(
                    turno.id_dia_vigilador,
                    idDiaVigiladorSiguiente,
                    next.hora_inicio,
                    next.hora_fin,
                    useTransaction,
                    [],
                    turno.id_turno
                );
                if (haySolape) {
                    throw new AppError('El nuevo horario se solapa con otro turno del mismo día', 400);
                }
            }

            await turno.update(newData, { transaction: useTransaction });

            // Recalcular horas del día planilla de origen
            await DiaPlanillaService.recalcularHorasDiaPlanilla(turno.id_dia_planilla, useTransaction);

            if (cambianHoras) {
                const nuevaHoraInicio = newData.hora_inicio ?? turno.hora_inicio;
                const nuevaHoraFin = newData.hora_fin ?? turno.hora_fin;
                await syncContinuidad(nuevaHoraInicio, nuevaHoraFin);
            }
    
            await LogService.registrarAccion({
                id_usuario,
                accion: 'actualizar_turno',
                detalles: `Se actualizó el turno ${id_turno} con los datos: ${JSON.stringify(newData)}`
            }, useTransaction);
    
            if (localTransaction) await localTransaction.commit();
            return turno;
        } catch (error) {
            if (localTransaction) await localTransaction.rollback();
            throw error;
        }
    }

    static async eliminarPorPlanilla(id_planilla, transaction) {
        // Asegurar que las continuidades queden limpias si se usa este método de forma directa
        await ContinuidadTurnoService.eliminarPorPlanillaDestino(id_planilla, transaction);
        await ContinuidadTurnoService.eliminarPorPlanillaOrigen(id_planilla, transaction);
        // Eliminar turnos cuyos días pertenecen a la planilla
        return await Turno.destroy({
            where: {
                id_dia_planilla: {
                    [Op.in]: sequelize.literal(`(
                        SELECT id_dia_planilla 
                        FROM dia_planilla 
                        WHERE id_planilla = ${id_planilla}
                    )`)
                }
            },
            transaction
        });
    }
    
    static async crearTurnosEnLote(id_usuario, datos, outerTransaction = null) {
        const { vigiladores, turnosOrganizadosPorDia } = datos;
    
        const turnosValidos = [];
        const turnosFallidos = [];
        const continuidadesACrear = [];
        const diasVigiladorAActualizar = new Set();
    
        // Crear un índice rápido: id_vigilador -> lista de dias_vigilador
        const indexDiasVigilador = new Map();
        for (const vig of vigiladores) {
            indexDiasVigilador.set(vig.id_vigilador, vig.dias_vigilador);
        }
    
        // ✅ Validación previa y armado de datos
        for (const dia of turnosOrganizadosPorDia) {
            const { id_dia_planilla, vigiladores: vigiladoresDelDia } = dia;
    
            if (!id_dia_planilla || !Array.isArray(vigiladoresDelDia)) {
                turnosFallidos.push({ id_dia_planilla, motivo: 'Datos incompletos en día planilla' });
                continue;
            }
    
            for (const vig of vigiladoresDelDia) {
                const { id_vigilador, id_dia_vigilador, turnos } = vig;
    
                if (!id_vigilador || !id_dia_vigilador || !Array.isArray(turnos)) {
                    turnosFallidos.push({ id_dia_vigilador, motivo: 'Datos incompletos en vigilador' });
                    continue;
                }
                // Antes de iterar turnos, calculo el siguiente día vigilador
                const diasVig = indexDiasVigilador.get(id_vigilador) || [];
                const idxActual = diasVig.findIndex(d => d.id_dia_vigilador === id_dia_vigilador);
                const idDiaVigiladorSiguiente = (idxActual >= 0 && diasVig[idxActual + 1])
                  ? diasVig[idxActual + 1].id_dia_vigilador
                  : null;
    
                let turnosPrevios = [];
    
                for (const turno of turnos) {
                    try {
                        turno.hora_fin = calcularHoraFin(turno.hora_inicio, turno.cantidad_horas);
                        const cruzaMedianoche = turno.hora_fin <= turno.hora_inicio;
    
                        // 🚀 Verificar solapamiento (pasando el array de dias_vigilador del vigilador)
                        const haySolap = await this.verificarSolapamientoRobusto(
                            id_dia_vigilador,
                            idDiaVigiladorSiguiente,
                            turno.hora_inicio,
                            turno.hora_fin,
                            null,
                            turnosPrevios,
                        );
    
                        if (haySolap) {
                            turnosFallidos.push({ id_dia_vigilador, id_dia_planilla, turno, motivo: 'Solapamiento detectado' });
                            continue;
                        }
    
                        const { horas_diurnas, horas_nocturnas } = calcularHorasDiurnasNocturnas(turno.hora_inicio, turno.hora_fin);

                        turnosValidos.push({
                            id_dia_vigilador,
                            id_dia_planilla,
                            hora_inicio: turno.hora_inicio,
                            cantidad_horas: turno.cantidad_horas,
                            hora_fin: turno.hora_fin,
                            horas_diurnas,
                            horas_nocturnas
                        });

                        const sourceIndex = turnosValidos.length - 1;
    
                        diasVigiladorAActualizar.add(id_dia_vigilador);
                        turnosPrevios.push(turno);
    
                        // ➕ Detectar continuidad si cruza medianoche
                        if (cruzaMedianoche) {
                            // Buscar siguiente día planilla en memoria
                            const indexActual = turnosOrganizadosPorDia.findIndex(d => d.id_dia_planilla === id_dia_planilla);
                            const diaSiguiente = turnosOrganizadosPorDia[indexActual + 1];
                            if (!diaSiguiente) {
                                turnosFallidos.push({ id_dia_vigilador, id_dia_planilla, turno, motivo: 'No se encontró día siguiente para continuidad' });
                                continue;
                            }
                            
                            if (!idDiaVigiladorSiguiente) {
                                turnosFallidos.push({ id_dia_vigilador, id_dia_planilla, turno, motivo: 'No se encontró día vigilador siguiente para continuidad' });
                                continue;
                            }
    
                            continuidadesACrear.push({
                                sourceIndex, // correlación robusta
                                id_turno: null, // se completa después
                                id_dia_planilla_destino: diaSiguiente.id_dia_planilla,
                                id_dia_vigilador_destino: idDiaVigiladorSiguiente,
                                id_vigilador,
                                hora_inicio_heredada: "00:00",
                                hora_fin_heredada: turno.hora_fin
                            });
                        }
    
                    } catch (error) {
                        turnosFallidos.push({ id_dia_vigilador, id_dia_planilla, turno, motivo: `Error: ${error.message}` });
                        continue;
                    }
                }
            }
        }
    
        // ✅ Si no hay turnos válidos, devolver solo los fallidos
        if (turnosValidos.length === 0) {
            return { turnosCreados: [], turnosFallidos };
        }
    
        // ⚙ Entramos en transacción
        const transaction = outerTransaction || await sequelize.transaction();
        try {
            // Bulk create de turnos
            const nuevosTurnos = await Turno.bulkCreate(turnosValidos, { transaction, returning: true });
    
            // Asignar id_turno a continuidades usando correlación por índice de origen
            continuidadesACrear.forEach(cont => {
                if (typeof cont.sourceIndex === 'number' && nuevosTurnos[cont.sourceIndex]) {
                    cont.id_turno = nuevosTurnos[cont.sourceIndex].id_turno;
                }
                delete cont.sourceIndex;
            });
    
            // Crear continuidades filtradas
            const continuidadesFiltradas = continuidadesACrear.filter(c => c.id_turno);
            if (continuidadesFiltradas.length > 0) {
                await ContinuidadTurnoService.crearContinuidadesEnLote(continuidadesFiltradas, transaction);
            }
    
            // Recalcular horas en días planilla
            const idsDiaPlanillaUnicos = [...new Set(turnosValidos.map(t => t.id_dia_planilla))];
            await Promise.all(idsDiaPlanillaUnicos.map(id =>
                DiaPlanillaService.recalcularHorasDiaPlanilla(id, transaction)
            ));
    
            // Actualizar estado de días vigilador

            await Promise.all([...diasVigiladorAActualizar].map(id =>
                DiaVigiladorService.actualizarDia(id, { estado: DiaVigiladorEstado.TRABAJA }, id_usuario, transaction)
            ));
    
            // Log
            await LogService.registrarAccion({
                id_usuario,
                accion: 'crear_turnos_en_lote',
                detalles: `Se crearon ${nuevosTurnos.length} turnos y ${continuidadesFiltradas.length} continuidades`
            }, transaction);
    
            if (!outerTransaction) await transaction.commit();
            return { turnosCreados: nuevosTurnos, turnosFallidos };
    
        } catch (error) {
            if (!outerTransaction) await transaction.rollback();
            throw error;
        }
    }    
    
      /**
       * Función para calcular hora fin, si no tienes la tuya:
       * hora_inicio: string "HH:mm"
       * cantidad_horas: número decimal o entero
       * retorna string "HH:mm"
       */
      static calcularHoraFin(hora_inicio, cantidad_horas) {
        // Puedes usar la función que ya tenías o esta:
        const [h, m] = hora_inicio.split(':').map(Number);
        const totalMinutos = h * 60 + m + Math.round(cantidad_horas * 60);
        const hFin = Math.floor(totalMinutos / 60) % 24;
        const mFin = totalMinutos % 60;
        return `${String(hFin).padStart(2, '0')}:${String(mFin).padStart(2, '0')}`;
      }

      static async obtenerDiaVigiladorSiguienteInfo(id_dia_vigilador) {
        const diaVigActual = await DiaVigiladorService.obtenerPorId(id_dia_vigilador);
        if (!diaVigActual) return { idDiaVigiladorSiguiente: null, fechaSiguiente: null };
        const diaSig = await DiaVigiladorService.obtenerDiaSiguiente(diaVigActual.id_vigilador, diaVigActual.fecha);
        return {
            idDiaVigiladorSiguiente: diaSig ? diaSig.id_dia_vigilador : null,
            fechaSiguiente: diaSig ? diaSig.fecha : null,
            id_vigilador: diaSig ? diaSig.id_vigilador : null
        };
      }



}

module.exports = TurnoService;

/* 
Ejemplo del formato json que debería obtener el método crearTurnoEnLote

{
  "vigiladores": [
    {
      "id_vigilador": 1,
      "dias_vigilador": [
        { "id_dia_vigilador": 101, "fecha": "2025-07-22", "id_dia_planilla": 11 },
        { "id_dia_vigilador": 102, "fecha": "2025-07-23", "id_dia_planilla": 12 },
        { "id_dia_vigilador": 103, "fecha": "2025-07-24", "id_dia_planilla": 13 },
        { "id_dia_vigilador": 104, "fecha": "2025-07-25", "id_dia_planilla": 14 },
        { "id_dia_vigilador": 105, "fecha": "2025-07-26", "id_dia_planilla": 15 }
      ]
    },
    {
      "id_vigilador": 2,
      "dias_vigilador": [
        { "id_dia_vigilador": 201, "fecha": "2025-07-22", "id_dia_planilla": 11 },
        { "id_dia_vigilador": 202, "fecha": "2025-07-23", "id_dia_planilla": 12 },
        { "id_dia_vigilador": 203, "fecha": "2025-07-24", "id_dia_planilla": 13 },
        { "id_dia_vigilador": 204, "fecha": "2025-07-25", "id_dia_planilla": 14 },
        { "id_dia_vigilador": 205, "fecha": "2025-07-26", "id_dia_planilla": 15 }
      ]
    },
    {
      "id_vigilador": 3,
      "dias_vigilador": [
        { "id_dia_vigilador": 301, "fecha": "2025-07-22", "id_dia_planilla": 11 },
        { "id_dia_vigilador": 302, "fecha": "2025-07-23", "id_dia_planilla": 12 },
        { "id_dia_vigilador": 303, "fecha": "2025-07-24", "id_dia_planilla": 13 },
        { "id_dia_vigilador": 304, "fecha": "2025-07-25", "id_dia_planilla": 14 },
        { "id_dia_vigilador": 305, "fecha": "2025-07-26", "id_dia_planilla": 15 }
      ]
    }
  ],
  "turnosOrganizadosPorDia": [
    {
      "id_dia_planilla": 11,
      "vigiladores": [
        {
          "id_vigilador": 1,
          "id_dia_vigilador": 101,
          "turnos": [
            { "hora_inicio": "08:00", "cantidad_horas": 8 },
            { "hora_inicio": "20:00", "cantidad_horas": 4 }
          ]
        },
        {
          "id_vigilador": 2,
          "id_dia_vigilador": 201,
          "turnos": [
            { "hora_inicio": "07:00", "cantidad_horas": 8 },
            { "hora_inicio": "18:00", "cantidad_horas": 6 }
          ]
        },
        {
          "id_vigilador": 3,
          "id_dia_vigilador": 301,
          "turnos": [
            { "hora_inicio": "06:00", "cantidad_horas": 10 },
            { "hora_inicio": "22:00", "cantidad_horas": 2 }
          ]
        }
      ]
    },
    {
      "id_dia_planilla": 12,
      "vigiladores": [
        {
          "id_vigilador": 1,
          "id_dia_vigilador": 102,
          "turnos": [
            { "hora_inicio": "08:00", "cantidad_horas": 8 },
            { "hora_inicio": "20:00", "cantidad_horas": 4 }
          ]
        },
        {
          "id_vigilador": 2,
          "id_dia_vigilador": 202,
          "turnos": [
            { "hora_inicio": "07:00", "cantidad_horas": 8 },
            { "hora_inicio": "18:00", "cantidad_horas": 6 }
          ]
        },
        {
          "id_vigilador": 3,
          "id_dia_vigilador": 302,
          "turnos": [
            { "hora_inicio": "06:00", "cantidad_horas": 10 },
            { "hora_inicio": "22:00", "cantidad_horas": 2 }
          ]
        }
      ]
    },
    {
      "id_dia_planilla": 13,
      "vigiladores": [
        {
          "id_vigilador": 1,
          "id_dia_vigilador": 103,
          "turnos": [
            { "hora_inicio": "08:00", "cantidad_horas": 8 },
            { "hora_inicio": "20:00", "cantidad_horas": 4 }
          ]
        },
        {
          "id_vigilador": 2,
          "id_dia_vigilador": 203,
          "turnos": [
            { "hora_inicio": "07:00", "cantidad_horas": 8 },
            { "hora_inicio": "18:00", "cantidad_horas": 6 }
          ]
        },
        {
          "id_vigilador": 3,
          "id_dia_vigilador": 303,
          "turnos": [
            { "hora_inicio": "06:00", "cantidad_horas": 10 },
            { "hora_inicio": "22:00", "cantidad_horas": 2 }
          ]
        }
      ]
    },
    {
      "id_dia_planilla": 14,
      "vigiladores": [
        {
          "id_vigilador": 1,
          "id_dia_vigilador": 104,
          "turnos": [
            { "hora_inicio": "08:00", "cantidad_horas": 8 },
            { "hora_inicio": "20:00", "cantidad_horas": 4 }
          ]
        },
        {
          "id_vigilador": 2,
          "id_dia_vigilador": 204,
          "turnos": [
            { "hora_inicio": "07:00", "cantidad_horas": 8 },
            { "hora_inicio": "18:00", "cantidad_horas": 6 }
          ]
        },
        {
          "id_vigilador": 3,
          "id_dia_vigilador": 304,
          "turnos": [
            { "hora_inicio": "06:00", "cantidad_horas": 10 },
            { "hora_inicio": "22:00", "cantidad_horas": 2 }
          ]
        }
      ]
    },
    {
      "id_dia_planilla": 15,
      "vigiladores": [
        {
          "id_vigilador": 1,
          "id_dia_vigilador": 105,
          "turnos": [
            { "hora_inicio": "08:00", "cantidad_horas": 8 },
            { "hora_inicio": "20:00", "cantidad_horas": 4 }
          ]
        },
        {
          "id_vigilador": 2,
          "id_dia_vigilador": 205,
          "turnos": [
            { "hora_inicio": "07:00", "cantidad_horas": 8 },
            { "hora_inicio": "18:00", "cantidad_horas": 6 }
          ]
        },
        {
          "id_vigilador": 3,
          "id_dia_vigilador": 305,
          "turnos": [
            { "hora_inicio": "06:00", "cantidad_horas": 10 },
            { "hora_inicio": "22:00", "cantidad_horas": 2 }
          ]
        }
      ]
    }
  ]
}


*/