import React, { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { usePlanilla } from '../hooks/usePlanillas'
import { usePlanillaDias, usePlanillaVigiladores, useTurnosByDiaPlanilla, useAddVigiladorToPlanilla, useRemoveVigiladorFromPlanilla, useCreateTurno } from '../hooks/usePlanillaDetalle'
import { useVigiladores } from '../hooks/useVigiladores'
import { usePermissions } from '../hooks/usePermissions'
import toast from 'react-hot-toast'
import { diaVigiladorService } from '../services/diaVigilador'

const PlanillaDetalleScreen: React.FC = () => {
  const params = useParams()
  const planillaId = useMemo(() => Number(params.id || 0), [params.id])
  const { data: planilla } = usePlanilla(planillaId)
  const { data: dias = [] } = usePlanillaDias(planillaId)
  const { data: vigiladores = [] } = usePlanillaVigiladores(planillaId)
  const { data: todosVigiladores = [] } = useVigiladores()
  const perms = usePermissions()
  const [selectedDia, setSelectedDia] = useState<number | null>(null)
  const { data: turnos = [] } = useTurnosByDiaPlanilla(selectedDia || 0)
  const addVig = useAddVigiladorToPlanilla(planillaId)
  const removeVig = useRemoveVigiladorFromPlanilla(planillaId)
  const [nuevoVigLegajo, setNuevoVigLegajo] = useState<string>("")
  const createTurno = useCreateTurno()
  const [turnoForm, setTurnoForm] = useState({ id_vigilador: '', hora_inicio: '', cantidad_horas: '' })

  if (!planillaId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Planilla no especificada.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planilla #{planilla?.id_planilla}</h1>
          <p className="text-sm text-gray-700">Mes {planilla?.mes}/{planilla?.anio} - Horas requeridas: {planilla?.horas_mensuales}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card">
          <div className="p-4">
            <h3 className="font-semibold mb-2">Días</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">Fecha</th>
                    <th className="table-header">Horas requeridas</th>
                    <th className="table-header">Horas trabajadas</th>
                    <th className="table-header">Cumplidas</th>
                    <th className="table-header">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dias.map((d: any) => (
                    <tr key={d.id_dia_planilla} className={selectedDia === d.id_dia_planilla ? 'bg-blue-50' : ''}>
                      <td className="table-cell">{d.fecha}</td>
                      <td className="table-cell">{d.horas_requeridas}</td>
                      <td className="table-cell">{d.horas_totales_trabajadas || 0}</td>
                      <td className="table-cell">{d.horas_cumplidas || 0}</td>
                      <td className="table-cell">
                        <button className="btn-secondary" onClick={() => setSelectedDia(d.id_dia_planilla)}>Ver turnos</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card p-4 space-y-4">
          <div>
            <h3 className="font-semibold">Vigiladores ({vigiladores.length})</h3>
            {perms.canManagePlanillas && (
            <div className="flex items-center gap-2 mb-2">
              <input
                type="number"
                className="input-field"
                placeholder="Legajo vigilador"
                value={nuevoVigLegajo}
                onChange={(e) => setNuevoVigLegajo(e.target.value)}
              />
              <button
                className="btn-primary"
                disabled={addVig.isPending || !nuevoVigLegajo}
                onClick={() => {
                  const leg = Number(nuevoVigLegajo)
                  const v = todosVigiladores.find((x: any) => Number(x.legajo) === leg)
                  if (!v) { toast.error('No se encontró vigilador con ese legajo'); return }
                  addVig.mutateAsync(Number(v.id_vigilador)).then(() => setNuevoVigLegajo(""))
                }}
              >
                {addVig.isPending ? 'Agregando...' : 'Agregar'}
              </button>
            </div>
            )}
            <ul className="text-sm text-gray-700 space-y-1">
              {vigiladores.map((v: any) => (
                <li key={v.id_vigilador} className="flex items-center justify-between">
                  <span>Legajo {v.legajo} - {v.apellido}, {v.nombre}</span>
                  {perms.canManagePlanillas && (
                    <button
                      className="text-red-600"
                      disabled={removeVig.isPending}
                      onClick={() => removeVig.mutate(v.id_vigilador)}
                    >
                      Quitar
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Turnos del día seleccionado</h3>
            {!selectedDia ? (
              <p className="text-sm text-gray-600">Seleccioná un día para ver los turnos</p>
            ) : (
              <>
                <div className="space-y-2">
                  {perms.canManagePlanillas && (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        <select className="input-field" value={turnoForm.id_vigilador} onChange={(e) => setTurnoForm({ ...turnoForm, id_vigilador: e.target.value })}>
                          <option value="">Seleccionar vigilador (asignados)</option>
                          {vigiladores.map((v: any) => (
                            <option key={v.id_vigilador} value={v.id_vigilador}>Legajo {v.legajo} - {v.apellido}, {v.nombre}</option>
                          ))}
                        </select>
                        <input className="input-field" placeholder="Hora inicio (HH:mm)" value={turnoForm.hora_inicio} onChange={(e) => setTurnoForm({ ...turnoForm, hora_inicio: e.target.value })} />
                        <input className="input-field" placeholder="Horas (ej 8)" value={turnoForm.cantidad_horas} onChange={(e) => setTurnoForm({ ...turnoForm, cantidad_horas: e.target.value })} />
                      </div>
                      <button
                        className="btn-primary"
                        disabled={createTurno.isPending}
                        onClick={async () => {
                          if (!turnoForm.id_vigilador || !turnoForm.hora_inicio || !turnoForm.cantidad_horas) { toast.error('Completá vigilador, hora y horas'); return }
                          const vId = Number(turnoForm.id_vigilador)
                          const diaSel = dias.find((d: any) => d.id_dia_planilla === selectedDia)
                          if (!diaSel) { toast.error('Día no válido'); return }
                          const dv = await diaVigiladorService.getByVigiladorYFecha(vId, diaSel.fecha)
                          if (!dv) { toast.error('No existe Día del Vigilador para ese vigilador y fecha. Agregalo a la planilla para generar sus días.'); return }
                          createTurno.mutate({ id_dia_vigilador: dv.id_dia_vigilador, id_dia_planilla: selectedDia!, hora_inicio: turnoForm.hora_inicio, cantidad_horas: Number(turnoForm.cantidad_horas), id_planilla: planilla?.id_planilla } as any)
                        }}
                      >
                        {createTurno.isPending ? 'Creando...' : 'Crear turno'}
                      </button>
                    </>
                  )}
                </div>
                <ul className="text-sm text-gray-700 space-y-1 mt-4">
                  {turnos.map((t: any) => (
                    <li key={t.id_turno} className="flex items-center justify-between">
                      <span>#{t.id_turno} {t.hora_inicio} - {t.hora_fin} ({t.cantidad_horas} h)</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlanillaDetalleScreen
