const { validationResult } = require('express-validator');
const AppError = require('../structure/AppError');
const { Vigilador, DiaVigilador, Turno, Servicio, Puesto, Planilla } = require('../models');
const { calcularHorasDiurnasNocturnas, horaToMinutes } = require('../src/utils/horas');
const { parseExcelAsistencias, compararConSistema } = require('../services/contabilidadService');
const { DiaVigiladorEstado } = require('../src/constants/status');
const { AsistenciaEstado } = require('../src/constants/status');
const path = require('path');

class ContabilidadController {
  /**
   * GET /contabilidad/vigiladores/:id/resumen?mes&anio
   * Suma horas diurnas/nocturnas/totales del mes a partir de turnos planificados.
   */
  static async resumenVigilador(req, res, next) {
    try {
      const { id } = req.params;
      const { mes, anio } = req.query;
      const year = Number(anio);
      const month = Number(mes);
      if (!id || !year || !month) {
        return res.status(400).json({ error: 'Parámetros requeridos: id, mes, anio' });
      }
      const inicio = `${year}-${String(month).padStart(2,'0')}-01`;
      const finDate = new Date(year, month, 0);
      const fin = finDate.toISOString().split('T')[0];

      const dias = await DiaVigilador.findAll({ where: { id_vigilador: id, fecha: { [require('sequelize').Op.between]: [inicio, fin] } } });
      const ids = dias.map(d => d.id_dia_vigilador);
      const turnos = ids.length ? await Turno.findAll({ where: { id_dia_vigilador: ids } }) : [];

      let horasDiurnas = 0, horasNocturnas = 0, horasTotales = 0, diasTrabajados = 0;
      for (const t of turnos) {
        const { horas_diurnas, horas_nocturnas } = calcularHorasDiurnasNocturnas(t.hora_inicio, t.hora_fin);
        horasDiurnas += horas_diurnas;
        horasNocturnas += horas_nocturnas;
        const ini = horaToMinutes(t.hora_inicio);
        const finM = horaToMinutes(t.hora_fin) <= ini ? horaToMinutes(t.hora_fin) + 24*60 : horaToMinutes(t.hora_fin);
        horasTotales += (finM - ini) / 60;
      }
      diasTrabajados = new Set(dias.filter(d => d.estado === DiaVigiladorEstado.TRABAJA).map(d => d.fecha)).size;

      return res.status(200).json({
        id_vigilador: Number(id),
        mes: month,
        anio: year,
        horas_diurnas: +horasDiurnas.toFixed(2),
        horas_nocturnas: +horasNocturnas.toFixed(2),
        horas_totales: +horasTotales.toFixed(2),
        dias_trabajados: diasTrabajados,
      });
    } catch (error) {
      next(error instanceof AppError ? error : new AppError('Error al obtener resumen', 500, error.message));
    }
  }

  /**
   * GET /contabilidad/vigiladores/:id/planilla?mes&anio
   * Devuelve la grilla diaria del mes con turnos y horas por día.
   */
  static async planillaVigilador(req, res, next) {
    try {
      const { id } = req.params;
      const { mes, anio } = req.query;
      const year = Number(anio);
      const month = Number(mes);
      if (!id || !year || !month) {
        return res.status(400).json({ error: 'Parámetros requeridos: id, mes, anio' });
      }
      const inicio = `${year}-${String(month).padStart(2,'0')}-01`;
      const finDate = new Date(year, month, 0);
      const fin = finDate.toISOString().split('T')[0];

      const dias = await DiaVigilador.findAll({ where: { id_vigilador: id, fecha: { [require('sequelize').Op.between]: [inicio, fin] } } });
      const ids = dias.map(d => d.id_dia_vigilador);
      const turnos = ids.length ? await Turno.findAll({ where: { id_dia_vigilador: ids } }) : [];

      const porDia = {};
      for (const d of dias) {
        porDia[d.fecha] = porDia[d.fecha] || { fecha: d.fecha, estado: d.estado, turnos: [], horas_diurnas: 0, horas_nocturnas: 0, horas_totales: 0 };
      }
      for (const t of turnos) {
        const d = dias.find(x => x.id_dia_vigilador === t.id_dia_vigilador);
        if (!d) continue;
        const bucket = porDia[d.fecha];
        const { horas_diurnas, horas_nocturnas } = calcularHorasDiurnasNocturnas(t.hora_inicio, t.hora_fin);
        const ini = horaToMinutes(t.hora_inicio);
        const finM = horaToMinutes(t.hora_fin) <= ini ? horaToMinutes(t.hora_fin) + 24*60 : horaToMinutes(t.hora_fin);
        const total = (finM - ini) / 60;
        bucket.turnos.push({ hora_inicio: t.hora_inicio, hora_fin: t.hora_fin, horas_diurnas, horas_nocturnas, horas_totales: +total.toFixed(2) });
        bucket.horas_diurnas = +(bucket.horas_diurnas + horas_diurnas).toFixed(2);
        bucket.horas_nocturnas = +(bucket.horas_nocturnas + horas_nocturnas).toFixed(2);
        bucket.horas_totales = +(bucket.horas_totales + total).toFixed(2);
      }

      return res.status(200).json(Object.values(porDia).sort((a,b) => a.fecha.localeCompare(b.fecha)));
    } catch (error) {
      next(error instanceof AppError ? error : new AppError('Error al obtener planilla', 500, error.message));
    }
  }

  /**
   * POST /contabilidad/asistencias/importar (form-data: file)
   * 1) Parsea Excel (primer hoja). 2) Normaliza asistencias por legajo+fecha.
   * 3) Compara contra planificación (turnos) con tolerancia en minutos.
   * Devuelve detalle por día y un resumen por legajo.
   */
  static async importarExcel(req, res, next) {
    try {
      const toleranciaMin = Number(req.query.toleranciaMin || 20);
      const yearHint = req.query.anio ? Number(req.query.anio) : undefined;
      const filePath = req.file?.path || (Array.isArray(req.files) && req.files[0]?.path);
      if (!filePath) {
        return res.status(400).json({ error: 'Archivo requerido' });
      }
      const asistencias = parseExcelAsistencias(filePath, yearHint);
      console.log('Asistencias parseadas:', asistencias);

      if (process.env.SKIP_DB === '1') {
        // Modo prueba: devolver solo el parseo del Excel
        const resumen = {};
        for (const c of asistencias) {
          const key = `${c.legajo}`;
          if (!resumen[key]) resumen[key] = { legajo: c.legajo, horas_diurnas: 0, horas_nocturnas: 0, horas_totales: 0, dias_trabajado: 0, ausencias: 0 };
          resumen[key].horas_diurnas += c.horas_diurnas;
          resumen[key].horas_nocturnas += c.horas_nocturnas;
          resumen[key].horas_totales += c.horas_totales;
          if (c.dia_trabajado) resumen[key].dias_trabajado += 1; else resumen[key].ausencias += 1;
        }
        return res.status(200).json({ asistencias: asistencias.map(a => ({ ...a, estado: AsistenciaEstado.SIN_COMPARACION })), resumen: Object.values(resumen) });
      }

      const comparacion = await compararConSistema({ asistencias, toleranciaMin });

      // Resumen mensual por vigilador
      const resumen = {};
      for (const c of comparacion) {
        const key = `${c.legajo}`;
        if (!resumen[key]) resumen[key] = { legajo: c.legajo, horas_diurnas: 0, horas_nocturnas: 0, horas_totales: 0, dias_trabajado: 0, ausencias: 0 };
        resumen[key].horas_diurnas += c.horas_diurnas;
        resumen[key].horas_nocturnas += c.horas_nocturnas;
        resumen[key].horas_totales += c.horas_totales;
        if (c.dia_trabajado) resumen[key].dias_trabajado += 1; else resumen[key].ausencias += 1;
      }

      return res.status(200).json({ asistencias: comparacion, resumen: Object.values(resumen) });
    } catch (error) {
      next(error instanceof AppError ? error : new AppError('Error al importar y comparar', 500, error.message));
    }
  }
}

module.exports = ContabilidadController;
