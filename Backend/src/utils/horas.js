// Suma horas a una hora en string
function sumarHoras(hora, cantidad_horas) {
    const minutosInicio = horaToMinutes(hora);
    const minutosFin = minutosInicio + cantidad_horas * 60;
    return minutosFin;
}

// Calcula cantidad total de horas sin superposiciones
function calcularHorasSinSuperposicion(intervalos) {
    if (intervalos.length === 0) return 0;

    // Ordenar por inicio
    intervalos.sort((a, b) => a.inicio - b.inicio);

    let total = 0;
    let [start, end] = [intervalos[0].inicio, intervalos[0].fin];

    for (let i = 1; i < intervalos.length; i++) {
        const { inicio, fin } = intervalos[i];
        if (inicio <= end) {
            // Se superpone: extendemos fin si hace falta
            end = Math.max(end, fin);
        } else {
            // No se superpone: sumamos bloque anterior
            total += (end - start);
            start = inicio;
            end = fin;
        }
    }
    total += (end - start);
    return total / 60; // Pasamos a horas
}



// Convierte una hora 'HH:mm' a minutos desde las 00:00
function horaToMinutes(hora) {
    const [hrs, mins] = hora.split(':').map(Number);
    return hrs * 60 + mins;
}

// Convierte minutos desde las 00:00 a formato 'HH:mm'
function minutesToHora(mins) {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Calcula la hora de fin dado hora_inicio ('HH:mm') y cantidad_horas (número o string decimal)
function calcularHoraFin(hora_inicio, cantidad_horas) {
    const inicioMins = horaToMinutes(hora_inicio);
    const duracionMins = Math.round(Number(cantidad_horas) * 60);
    const finMins = (inicioMins + duracionMins) % (24 * 60);
    return minutesToHora(finMins);
}

// Calcula horas diurnas y nocturnas entre dos horas (ambas 'HH:mm')
// Nocturnas: 21:00 a 06:00 (sin incluir 6:00)
// Diurnas: 06:00 a 21:00 (sin incluir 21:00)
function calcularHorasDiurnasNocturnas(hora_inicio, hora_fin) {
    let inicio = horaToMinutes(hora_inicio);
    let fin = horaToMinutes(hora_fin);
    if (fin <= inicio) fin += 24 * 60; // Cruza medianoche

    let diurnas = 0, nocturnas = 0;
    for (let t = inicio; t < fin; t++) {
        const horaDelDia = t % (24 * 60);
        if (horaDelDia >= 6 * 60 && horaDelDia < 21 * 60) {
            diurnas++;
        } else {
            nocturnas++;
        }
    }
    return {
        horas_diurnas: +(diurnas / 60).toFixed(2),
        horas_nocturnas: +(nocturnas / 60).toFixed(2)
    };
}

module.exports = {
    horaToMinutes,
    minutesToHora,
    calcularHoraFin,
    calcularHorasDiurnasNocturnas,
    sumarHoras,
    calcularHorasSinSuperposicion
}; 