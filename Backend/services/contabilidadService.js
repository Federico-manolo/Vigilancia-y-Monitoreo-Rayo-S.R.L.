const XLSX = require('xlsx');
const path = require('path');
const { Vigilador, DiaVigilador, Turno } = require('../models');
const { calcularHorasDiurnasNocturnas, horaToMinutes, minutesToHora } = require('../src/utils/horas');

/**
 * Convierte un valor de celda a string HH:mm.
 * - Soporta números de Excel (fracción de día)
 * - Soporta strings "H:MM" o "HH:MM"
 */
function parseHoraStr(str) {
  if (!str) return null;
  if (typeof str === 'number') {
    // Excel guarda horas como fracción del día (0..1)
    const totalMinutes = Math.round(str * 24 * 60);
    const hh = Math.floor(totalMinutes / 60) % 24;
    const mm = totalMinutes % 60;
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
  }
  const s = String(str).trim();
  if (!s) return null;
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hh = m[1].padStart(2, '0');
  const mm = m[2];
  return `${hh}:${mm}`;
}

/**
 * Heurística simple: detecta si una celda de la fila 1 parece ser el encabezado de un día (ej: "9-jul MIÉRCOLES").
 * Actualmente no se usa, pero queda como helper si se requiere refinar la detección de bloques.
 */
function isMergedHeaderCell(cell) {
  return typeof cell === 'string' && /\d{1,2}\s*[-/\s]?\s*(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)/i.test(cell);
}

function monthMap() {
  return { ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, oct: 10, nov: 11, dic: 12 };
}

function unmergeWorksheet(ws) {
  const merges = ws['!merges'] || [];

  for (const merge of merges) {
    const startAddr = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c });
    const value = ws[startAddr]?.v ?? null;

    for (let R = merge.s.r; R <= merge.e.r; R++) {
      for (let C = merge.s.c; C <= merge.e.c; C++) {
        const cellAddr = XLSX.utils.encode_cell({ r: R, c: C });
        ws[cellAddr] = { v: value };
      }
    }
  }

  // Eliminamos la info de merges ya que ahora está "plano"
  delete ws['!merges'];
}

/**
 * Parsea los encabezados en fila 1 (días combinados) y fila 2 (subcolumnas) para construir bloques por día.
 * Asume que las columnas fijas (LEGAJO, APELLIDO Y NOMBRE, DESTINO, RAZÓN SOCIAL) aparecen al inicio
 * y que a partir de allí empiezan bloques repetidos con el mismo título en fila 1.
 */
function parseHeaderBlocks(ws) {
  // Lee todo el rango y extrae fila 1 y 2
  // Obtenemos el rango de celdas de la hoja de Excel (por ejemplo, A1:Z100)
  // Usar antes de recorrer
  unmergeWorksheet(ws);
  const range = XLSX.utils.decode_range(ws['!ref']);
 
  // Creamos dos arrays para almacenar los encabezados de la fila 1 y la fila 2
  const headersRow1 = []; // Encabezados principales (por día, ej: "9-jul MIÉRCOLES")
  const headersRow2 = []; // Subencabezados (por ejemplo: "ENTRADA", "SALIDA", etc.)
 
  // Recorremos todas las columnas del rango
  for (let C = range.s.c; C <= range.e.c; C++) {
    // Armamos la dirección de celda para la fila 1 (r: 0) y fila 2 (r: 1) en la columna actual
    const addr1 = XLSX.utils.encode_cell({ r: 0, c: C }); // Ejemplo: "A1", "B1", etc.
    const addr2 = XLSX.utils.encode_cell({ r: 1, c: C }); // Ejemplo: "A2", "B2", etc.
 
    // Extraemos el valor de la celda (si existe), si no, ponemos null
    headersRow1.push(ws[addr1]?.v ?? null);
    headersRow2.push(ws[addr2]?.v ?? null);
  }
  console.log('Headers row 1:', headersRow1);
  console.log('Headers row 2:', headersRow2);
  
  // Heurística: encontrar la última columna fija (fila 2) y comenzar datos desde la siguiente
  // "norm" es una función que normaliza los encabezados convirtiéndolos a mayúsculas y asegurando que sean string.
  const norm = (s) => String(s ?? '').toUpperCase();
  const h2 = headersRow2.map(norm);
  const idxLegajo = h2.findIndex((t) => t.includes('LEGAJO'));
  const idxApeNom = h2.findIndex((t) => t.includes('APELLIDO'));
  const idxDestino = h2.findIndex((t) => t.includes('DESTINO'));
  let idxRazon = h2.findIndex((t) => t.includes('RAZ'));
  if (idxRazon === -1) idxRazon = h2.findIndex((t) => t.includes('SOCIAL'));
  let startDataCol = Math.max(idxLegajo, idxApeNom, idxDestino, idxRazon) + 1;
  if (!Number.isFinite(startDataCol) || startDataCol < 1) {
    // Fallback: asumimos 4 columnas fijas A..D
    startDataCol = 4;
  }
  
  const blocks = [];
  let c = startDataCol;
  while (c < headersRow1.length) {
    const dayHeader = headersRow1[c];
    console.log('Day header:', dayHeader);
    if (!dayHeader) { c++; continue; }
    // Agrupar columnas consecutivas con el mismo encabezado de día
    const startC = c;
    let endC = c;
    while (endC + 1 < headersRow1.length && headersRow1[endC + 1] === dayHeader) {
      endC++;
    }
    // Subencabezados (fila 2) asociados al bloque del día
    const subcols = [];
    for (let cc = startC; cc <= endC; cc++) {
      const name = String(headersRow2[cc] || '').trim();
      subcols.push({ col: cc, name });
    }
    
    blocks.push({ header: String(dayHeader).trim(), startC, endC, subcols });
    console.log('Bloque:', { header: String(dayHeader).trim(), startC, endC, subcols });
    c = endC + 1;
  }
  return { startDataCol, blocks };
}

/**
 * Construye una fecha ISO (YYYY-MM-DD) a partir del encabezado del día ("9-jul ...").
 * yearHint permite fijar año; si no, se usa el actual.
 */
function parseDateFromHeader(header, yearHint) {
  const parts = header.toLowerCase().split(/\s+/)[0];
  const [dayStr, monStrRaw] = parts.split(/[-/]/);
  const monStr = (monStrRaw || '').slice(0,3);
  const day = parseInt(dayStr, 10);
  const mon = monthMap()[monStr] || null;
  if (!day || !mon) return null;
  const year = yearHint || (new Date()).getFullYear();
  const mm = mon.toString().padStart(2, '0');
  const dd = day.toString().padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/**
 * Convierte una hoja a matriz cruda de celdas (para facilitar recorridos por fila/columna).
 */
function extractRows(ws) {
  const range = XLSX.utils.decode_range(ws['!ref']);
  const rows = [];
  for (let R = 0; R <= range.e.r; R++) {
    const row = [];
    for (let C = 0; C <= range.e.c; C++) {
      // Convierte el número de fila (R) y columna (C) en una referencia de celda de Excel (por ejemplo, {r:0, c:0} => "A1")
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      // Accede al valor de la celda en la hoja de Excel (ws[addr]), si existe toma el valor (propiedad .v), si no existe pone null
      // El operador ?.v accede al valor solo si la celda existe, y el ?? null asegura que si no hay valor, se pone null en la matriz
      row.push(ws[addr]?.v ?? null);
    }
    rows.push(row);
  }
  return rows;
}

/**
 * Parsea el Excel de asistencias con el formato provisto:
 * - Toma la primer hoja
 * - Columnas fijas: LEGAJO, APELLIDO Y NOMBRE, DESTINO, RAZÓN SOCIAL
 * - Por cada día (bloque con celdas combinadas): subcolumnas Entrada/Salida (múltiples turnos), Total hs., FERIADO, DIA TRABAJADO
 * Devuelve una lista plana de registros { legajo, fecha, pares: [{entrada, salida}], horas_diurnas, horas_nocturnas, horas_totales, ... }.
 */
function parseExcelAsistencias(filePath, yearHint) {
  const wb = XLSX.readFile(filePath, { cellDates: false });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = extractRows(ws);
  const { startDataCol, blocks } = parseHeaderBlocks(ws);
  // Localizar columnas de identificación (robusto a posiciones cambiantes)
  // Buscamos la columna que contiene "LEGAJO" en la segunda fila (índice 1), que suele ser la fila de encabezados principal
  let colLegajo = rows[1]?.findIndex(h => String(h).toUpperCase().includes('LEGAJO'));
  // Si no la encontramos en la segunda fila, intentamos buscar en la primera fila (índice 0) como fallback
  if (colLegajo === -1 || colLegajo == null) {
    colLegajo = rows[0]?.findIndex(h => String(h).toUpperCase().includes('LEGAJO')) ?? 0;
    // Si tampoco la encontramos, por defecto usamos la columna 0 (esto es un último recurso)
  }
  const firstDataRow = 2; // Fila 3 (1-based) es donde empiezan los datos
  console.log('First data row:', firstDataRow);
  const asistencias = [];

  for (let r = firstDataRow; r < rows.length; r++) {
    const legajo = rows[r][colLegajo];
    if (!legajo) continue;
    for (const block of blocks) {
      const fecha = parseDateFromHeader(block.header, yearHint);
      if (!fecha) continue;

      // Recolectar todos los pares Entrada/Salida presentes en el bloque (múltiples turnos por día)
      const pares = [];
      const entradaCols = block.subcols.filter(s => /entrada/i.test(s.name));
      const salidaCols = block.subcols.filter(s => /salida/i.test(s.name));
      const feriadoCol = block.subcols.find(s => /feriado/i.test(s.name));
      const trabajadoCol = block.subcols.find(s => /dia\s*trabajado/i.test(s.name));

      const numTurnos = Math.max(entradaCols.length, salidaCols.length);
      for (let i = 0; i < numTurnos; i++) {
        const entrada = parseHoraStr(rows[r][entradaCols[i]?.col]);
        const salida = parseHoraStr(rows[r][salidaCols[i]?.col]);
        if (entrada && salida) {
          pares.push({ entrada, salida });
        }
      }

      // Calcular horas diurnas/nocturnas para el día sumando cada par
      let totalDiurnas = 0;
      let totalNocturnas = 0;
      let totalMin = 0;
      for (const p of pares) {
        const { horas_diurnas, horas_nocturnas } = calcularHorasDiurnasNocturnas(p.entrada, p.salida);
        totalDiurnas += horas_diurnas;
        totalNocturnas += horas_nocturnas;
        const mins = (horaToMinutes(p.salida) - horaToMinutes(p.entrada) + 24*60) % (24*60);
        totalMin += mins;
      }

      const feriado = feriadoCol ? !!rows[r][feriadoCol.col] : false;
      const diaTrabajado = trabajadoCol ? !!rows[r][trabajadoCol.col] : pares.length > 0;

      asistencias.push({
        legajo: Number(legajo),
        fecha,
        pares,
        horas_diurnas: +totalDiurnas.toFixed(2),
        horas_nocturnas: +totalNocturnas.toFixed(2),
        horas_totales: +(totalMin / 60).toFixed(2),
        feriado,
        dia_trabajado: diaTrabajado,
      });
    }
  }
  console.log('Asistencias:', asistencias);
  return asistencias;
}

/**
 * Compara las asistencias reales (Excel) contra la planificación del sistema por legajo+fecha.
 * - Empareja cada par Entrada/Salida con el turno planificado más cercano en inicio
 * - Calcula diferencias de duración en minutos y evalúa tolerancia
 */
const { AsistenciaEstado } = require('../src/constants/status');

async function compararConSistema({ asistencias, toleranciaMin = 20 }) {
  const resultados = [];
  for (const a of asistencias) {
    const vigilador = await Vigilador.findOne({ where: { legajo: a.legajo } });
    if (!vigilador) {
      resultados.push({ ...a, estado: AsistenciaEstado.VIGILADOR_DESCONOCIDO });
      continue;
    }
    const dia = await DiaVigilador.findOne({ where: { id_vigilador: vigilador.id_vigilador, fecha: a.fecha } });
    if (!dia) {
      resultados.push({ ...a, id_vigilador: vigilador.id_vigilador, estado: AsistenciaEstado.SIN_PLANIFICACION });
      continue;
    }
    const turnos = await Turno.findAll({ where: { id_dia_vigilador: dia.id_dia_vigilador } });

    // Caso: hay fichada pero el día no tiene turnos planificados
    if (!turnos || turnos.length === 0) {
      resultados.push({ ...a, id_vigilador: vigilador.id_vigilador, estado: AsistenciaEstado.SIN_PLANIFICACION, comparaciones: [], delta_total_min: 0 });
      continue;
    }

    let deltaTotalMin = 0;
    const comparaciones = [];
    const usados = new Set();
    for (const p of a.pares) {
      const ini = horaToMinutes(p.entrada);
      const fin = horaToMinutes(p.salida) <= ini ? horaToMinutes(p.salida) + 24*60 : horaToMinutes(p.salida);

      // Elegir el turno que minimice la desviación total de inicio y fin; evitar reutilizar el mismo turno
      let mejor = null;
      let mejorScore = Infinity;
      let mejorIdx = -1;
      for (let idx = 0; idx < turnos.length; idx++) {
        if (usados.has(idx)) continue;
        const t = turnos[idx];
        const tIni = horaToMinutes(t.hora_inicio);
        const tFin = horaToMinutes(t.hora_fin) <= tIni ? horaToMinutes(t.hora_fin) + 24*60 : horaToMinutes(t.hora_fin);
        const deltaIniAbs = Math.abs(tIni - ini);
        const deltaFinAbs = Math.abs(tFin - fin);
        const score = deltaIniAbs + deltaFinAbs;
        if (score < mejorScore) {
          mejorScore = score;
          mejor = { t, tIni, tFin, deltaIniAbs, deltaFinAbs };
          mejorIdx = idx;
        }
      }
      if (mejor) {
        usados.add(mejorIdx);
        const durTurno = mejor.tFin - mejor.tIni;
        const durExcel = (fin - ini);
        const dentroInicio = mejor.deltaIniAbs <= toleranciaMin;
        const dentroFin = mejor.deltaFinAbs <= toleranciaMin;
        const dentro = dentroInicio && dentroFin;
        deltaTotalMin += (mejor.deltaIniAbs + mejor.deltaFinAbs);
        comparaciones.push({
          excel: { inicio: p.entrada, fin: p.salida, dur_min: durExcel },
          plan: { inicio: minutesToHora(mejor.tIni % (24*60)), fin: minutesToHora(mejor.tFin % (24*60)), dur_min: durTurno },
          delta_inicio_min: mejor.deltaIniAbs,
          delta_fin_min: mejor.deltaFinAbs,
          delta_total_min: (mejor.deltaIniAbs + mejor.deltaFinAbs),
          dentro_tolerancia: dentro,
        });
      }
    }

    const dentroTolerancia = comparaciones.length > 0 && comparaciones.every(c => c.dentro_tolerancia);
    resultados.push({
      ...a,
      id_vigilador: vigilador.id_vigilador,
      estado: dentroTolerancia ? AsistenciaEstado.OK : AsistenciaEstado.DESVIO,
      comparaciones,
      delta_total_min: deltaTotalMin,
    });
  }
  for (const resultado of resultados) {
    console.log('Resultado:', resultado);
    if (resultado.comparaciones) {
      console.log('Comparaciones:', resultado.comparaciones);
    }
  }
  return resultados;
}

module.exports = {
  parseExcelAsistencias,
  compararConSistema,
};
