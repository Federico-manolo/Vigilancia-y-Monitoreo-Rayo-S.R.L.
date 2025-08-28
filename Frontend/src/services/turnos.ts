import api from './api';

export const turnosService = {
  async getByDiaPlanilla(idDiaPlanilla: number) {
    const response = await api.get(`/turnos/dia-planilla/${idDiaPlanilla}`);
    return response.data;
  },

  async listByDias(idsDiasPlanilla: number[]) {
    const response = await api.post('/turnos/listar-por-dias', { idsDiasPlanilla });
    return response.data;
  },

  async getByPlanilla(idPlanilla: number) {
    const response = await api.get(`/turnos/planilla/${idPlanilla}`);
    return response.data;
  },

  async getByDiaVigilador(idDiaVigilador: number) {
    const response = await api.get(`/turnos/dia-vigilador/${idDiaVigilador}`);
    return response.data;
  },

  async createTurno(payload: { id_dia_vigilador: number; id_dia_planilla: number; hora_inicio: string; cantidad_horas: number; turno_compartido?: boolean }) {
    const response = await api.post('/turnos', payload);
    return response.data;
  },

  async updateTurno(id: number, data: Partial<{ hora_inicio: string; cantidad_horas: number; turno_compartido?: boolean }>) {
    const response = await api.put(`/turnos/${id}`, data);
    return response.data;
  },

  async deleteTurno(id: number) {
    const response = await api.delete(`/turnos/${id}`);
    return response.data;
  },
};


