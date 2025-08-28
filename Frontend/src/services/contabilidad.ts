import api from './api'
import { ComparacionAsistencia, ResumenMensual, ContabilidadResumen, ContabilidadPlanilla } from '../types'

export const contabilidadService = {
  importarAsistencias: async (file: File, toleranciaMin: number = 20, anio?: number): Promise<{ asistencias: ComparacionAsistencia[]; resumen: ResumenMensual[] }> => {
    const formData = new FormData()
    formData.append('file', file)
    const params = new URLSearchParams()
    params.set('toleranciaMin', String(toleranciaMin))
    if (anio) params.set('anio', String(anio))
    const { data } = await api.post(`/contabilidad/asistencias/importar?${params.toString()}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  getResumenVigilador: async (id: number, mes: number, anio: number): Promise<ContabilidadResumen> => {
    const { data } = await api.get(`/contabilidad/vigiladores/${id}/resumen`, { params: { mes, anio } })
    return data
  },

  getPlanillaVigilador: async (id: number, mes: number, anio: number): Promise<ContabilidadPlanilla[]> => {
    const { data } = await api.get(`/contabilidad/vigiladores/${id}/planilla`, { params: { mes, anio } })
    return data
  },
}

export default contabilidadService


