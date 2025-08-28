//Retornamos las fechas del mes en el anio correspondiente
function generarFechasDelMes(anio, mes) {
    const totalDias = new Date(anio, mes, 0).getDate();
    return Array.from({ length: totalDias }, (_, i) =>
        new Date(anio, mes - 1, i + 1).toISOString().split('T')[0]
    );
}

module.exports = generarFechasDelMes;