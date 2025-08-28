const { Vigilador, PlanillaVigilador } = require('../models');

class PlanillaVigiladorService{
    static async obtenerVigiladoresPorPlanilla(id_planilla, transaction = null) {
        const opciones = {
            where: { id_planilla },
            include: [{
                model: Vigilador,
                attributes: ['id_vigilador', 'nombre', 'apellido', 'legajo', 'dni']
            }],
            order: [[Vigilador, 'legajo', 'ASC']]
        };
        if (transaction) {
            opciones.transaction = transaction;
        }
        const relaciones = await PlanillaVigilador.findAll(opciones);

        // Retornamos solo los datos del vigilador
        const vistosPorLegajo = new Set();
        const resultado = [];
        for (const item of relaciones) {
            const v = item.vigilador || item.Vigilador;
            if (!v) continue;
            if (vistosPorLegajo.has(v.legajo)) continue; // filtrar por legajo, evitar duplicados
            vistosPorLegajo.add(v.legajo);
            resultado.push({
                id_vigilador: v.id_vigilador,
                nombre: v.nombre,
                apellido: v.apellido,
                legajo: v.legajo,
                dni: v.dni
            });
        }
        return resultado;
    }
    
}

module.exports = PlanillaVigiladorService;  