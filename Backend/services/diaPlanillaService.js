const { DiaPlanilla, Turno } = require('../models');
const DiaPuestoTipoService = require('./diaPuestoTipoService');
const AppError = require('../structure/AppError');
const ContinuidadTurnoService= require('./continuidadTurnoService');
const { sumarHoras, calcularHorasSinSuperposicion, horaToMinutes } = require('../src/utils/horas');


class DiaPlanillaService {
    static async crearDia({ id_planilla, id_puesto, fecha }, transaction = null) {
        const config = await DiaPuestoTipoService.obtenerConfiguracionParaFecha(id_puesto, fecha);

        const diaData = {
            id_planilla,
            fecha,
            id_dia_tipo: config ? config.id_dia_tipo : null,
            horario_entrada: config?.horario_entrada || null,
            horario_salida: config?.horario_salida || null,
            horario_entrada_2: config?.horario_entrada_2 || null,
            horario_salida_2: config?.horario_salida_2 || null,
            horas_requeridas: config?.horas_requeridas || 0,
            jornada_partida: config?.jornada_horario_partido || false,
            es_laborable: config?.es_laborable || false,
        };

        return await DiaPlanilla.create(diaData, { transaction });
    }

    static async crearDiasEnLote(dias, transaction = null) {
        const diasFinales = [];

        for (const dia of dias) {
            const config = await DiaPuestoTipoService.obtenerConfiguracionParaFecha(dia.id_puesto, dia.fecha);

            diasFinales.push({
                id_planilla: dia.id_planilla,
                fecha: dia.fecha,
                id_dia_tipo: config ? config.id_dia_tipo : null,
                horario_entrada: config?.horario_entrada || null,
                horario_salida: config?.horario_salida || null,
                horario_entrada_2: config?.horario_entrada_2 || null,
                horario_salida_2: config?.horario_salida_2 || null,
                horas_requeridas: config?.horas_requeridas || 0,
                jornada_partida: config?.jornada_horario_partido || false,
                es_laborable: config?.es_laborable || false,
            });
        }

        return await DiaPlanilla.bulkCreate(diasFinales, { transaction });
    }

    static async obtenerPorId(id_dia_planilla, transaction = null) {
        const dia = await DiaPlanilla.findByPk(id_dia_planilla, { transaction });
        if (!dia) throw new AppError('Día de planilla no encontrado', 404);
        return dia;
    }

    static async actualizar(id_dia_planilla, data, transaction = null) {
        const dia = await DiaPlanilla.findByPk(id_dia_planilla, { transaction });
        if (!dia) throw new AppError('Día de planilla no encontrado', 404);
        await dia.update(data, { transaction });
        return dia;
    }

    static async eliminar(id_dia_planilla, transaction = null) {
        const dia = await DiaPlanilla.findByPk(id_dia_planilla, { transaction });
        if (!dia) throw new AppError('Día de planilla no encontrado', 404);
        await dia.destroy({ transaction });
        return true;
    }

    static async listarPorPlanilla(id_planilla, transaction = null) {
        return await DiaPlanilla.findAll({
            where: { id_planilla },
            order: [['fecha', 'ASC']],
            transaction
        });
    }

    static async sumarHorasTrabajadas(id_dia_planilla, horasASumar, transaction = null) {
        const dia = await DiaPlanilla.findByPk(id_dia_planilla, { transaction });
        if (!dia) throw new AppError('Día de planilla no encontrado', 404);
        const nuevasHoras = (dia.horas_totales_trabajadas || 0) + Number(horasASumar);
        await dia.update({ horas_totales_trabajadas: nuevasHoras }, { transaction });
        return dia;
    }

    static async recalcularHorasDiaPlanilla(id_dia_planilla, transaction = null) {
        // Traer el día para conocer su configuración requerida
        const diaInfo = await DiaPlanilla.findByPk(id_dia_planilla, { transaction });
        if (!diaInfo) throw new AppError('Día de planilla no encontrado', 404);

        // Traer todos los turnos propios del día planilla (evitar dependencia circular)
        const turnos = await Turno.findAll({
            where: { id_dia_planilla },
            order: [['hora_inicio', 'ASC']],
            transaction
        });
    
        // Traer todas las continuidades que afectan a este día planilla (en la práctica debería haber 0 o 1)
        const continuidades = await ContinuidadTurnoService.obtenerPorDiaPlanilla(id_dia_planilla, transaction);
    
        // Armar intervalos de los turnos
        const intervalos = turnos.map(t => ({
            inicio: horaToMinutes(t.hora_inicio),
            fin: sumarHoras(t.hora_inicio, parseFloat(t.cantidad_horas))
        }));
    
        // Agregar intervalos heredados de las continuidades
        continuidades.forEach(cont => {
            intervalos.push({
                inicio: horaToMinutes(cont.hora_inicio_heredada),
                fin: horaToMinutes(cont.hora_fin_heredada)
            });
        });
    
        // Suma bruta de horas trabajadas por turnos propios (no incluye continuidad)
        const horas_totales_trabajadas = turnos.reduce((acc, t) => acc + parseFloat(t.cantidad_horas), 0);

        // Recortar todos los intervalos al rango del día [00:00, 24:00) para evitar arrastre al día siguiente
        const inicioDia = 0;
        const finDia = 24 * 60;
        const intervalosDelDia = intervalos
            .map(({ inicio, fin }) => ({
                inicio: Math.max(inicioDia, inicio),
                fin: Math.min(finDia, fin)
            }))
            .filter(({ inicio, fin }) => fin > inicio);

        // Construir intervalos requeridos del día según configuración (tramo 1 y opcional tramo 2)
        const requeridos = [];
        const addRequerido = (iniStr, finStr) => {
            if (!iniStr || !finStr) return;
            const ini = horaToMinutes(iniStr);
            const fin = horaToMinutes(finStr);
            // Asegurar dentro del día y que fin > ini
            const inicio = Math.max(inicioDia, ini);
            const finOk = Math.min(finDia, fin);
            if (finOk > inicio) requeridos.push({ inicio, fin: finOk });
        };
        addRequerido(diaInfo.horario_entrada, diaInfo.horario_salida);
        addRequerido(diaInfo.horario_entrada_2, diaInfo.horario_salida_2);

        let horas_cumplidas = 0;
        if (requeridos.length > 0 && intervalosDelDia.length > 0) {
            // Intersectar cobertura con requeridos y sumar sin solapamientos
            const intersecciones = [];
            for (const cov of intervalosDelDia) {
                for (const req of requeridos) {
                    const ini = Math.max(cov.inicio, req.inicio);
                    const fin = Math.min(cov.fin, req.fin);
                    if (fin > ini) intersecciones.push({ inicio: ini, fin });
                }
            }
            horas_cumplidas = calcularHorasSinSuperposicion(intersecciones);
        } else {
            // Si no hay requeridos, no contabilizamos cumplidas (se interpreta como no exigible)
            horas_cumplidas = 0;
        }
    
        // Actualizar el día planilla con los nuevos valores
        await DiaPlanilla.update(
            { horas_totales_trabajadas, horas_cumplidas },
            { where: { id_dia_planilla }, transaction }
        );
        console.log('horas_totales_trabajadas', horas_totales_trabajadas);
        console.log('horas_cumplidas', horas_cumplidas);
        return { horas_totales_trabajadas, horas_cumplidas };
    }
    
    static async restarHorasTrabajadas(id_dia_planilla, horasARestar, transaction = null) {
        const dia = await DiaPlanilla.findByPk(id_dia_planilla, { transaction });
        if (!dia) throw new AppError('Día de planilla no encontrado', 404);
        const nuevasHoras = (dia.horas_trabajadas || 0) - Number(horasARestar);
        await dia.update({ horas_trabajadas: nuevasHoras }, { transaction });
        return dia;
    }

    static async eliminarPorPlanilla(id_planilla, transaction = null) {
        const diasEliminados = await DiaPlanilla.destroy({
            where: { id_planilla },
            transaction
        });
        return diasEliminados;
    }
}

module.exports = DiaPlanillaService;
