// Tipos base para la aplicación
export interface ApiResponse<T> {
  data: T;
  total?: number;
  page?: number;
  limit?: number;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

// Entidades principales
export interface Servicio {
  id_servicio: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ServicioForm {
  nombre: string;
  descripcion?: string;
}

export interface ServicioFilters extends PaginationParams {
  nombre?: string;
  activo?: boolean;
}

export interface Puesto {
  id_puesto: number;
  id_servicio: number;
  nombre: string;
  descripcion?: string;
  cant_horas: number;
  activo: boolean;
  created_at: string;
  updated_at?: string;
}

export interface PuestoForm {
  id_servicio: number;
  nombre: string;
  descripcion?: string;
  cant_horas: number;
}

export interface PuestoFilters extends PaginationParams {
  id_servicio?: number;
  nombre?: string;
  activo?: boolean;
}

export interface Planilla {
  id_planilla: number;
  id_puesto: number;
  mes: number;
  anio: number;
  horas_mensuales: number;
  id_usuario: number;
  created_at: string;
  updated_at?: string;
}

export interface PlanillaForm {
  id_puesto: number;
  mes: number;
  anio: number;
}

export interface PlanillaFilters extends PaginationParams {
  id_puesto?: number;
  mes?: number;
  anio?: number;
}

export interface DiaPlanilla {
  id_dia_planilla: number;
  id_planilla: number;
  id_dia_tipo?: number;
  fecha: string;
  horas_requeridas: number;
  horas_totales_trabajadas: number;
  horas_cumplidas: number;
  horario_entrada?: string;
  horario_salida?: string;
  horario_entrada_2?: string;
  horario_salida_2?: string;
  jornada_partida: boolean;
  es_laborable: boolean;
}

export interface DiaPuestoTipo {
  id_dia_tipo: number;
  id_puesto: number;
  dia_semana: number;
  fecha_especial?: string | null;
  horario_entrada?: string | null;
  horario_salida?: string | null;
  horario_entrada_2?: string | null;
  horario_salida_2?: string | null;
  horas_requeridas: number;
  jornada_horario_partido: boolean;
  es_laborable: boolean;
}

export interface DiaPuestoTipoForm {
  id_puesto: number;
  dia_semana: number;
  fecha_especial?: string | null;
  horario_entrada?: string | null;
  horario_salida?: string | null;
  horario_entrada_2?: string | null;
  horario_salida_2?: string | null;
  jornada_horario_partido: boolean;
  es_laborable: boolean;
}

export interface Turno {
  id_turno: number;
  id_dia_planilla: number;
  id_dia_vigilador: number;
  hora_inicio: string;
  cantidad_horas: number;
  horas_diurnas: string;
  horas_nocturnas: string;
  hora_fin: string;
  turno_compartido?: boolean;
}

export interface DiaVigiladorIndexMap {
  [idVigilador: number]: { [fecha: string]: any };
}

export interface TurnoForm {
  id_dia_vigilador: number;
  id_dia_planilla: number;
  hora_inicio: string;
  cantidad_horas: number;
  turno_compartido?: boolean;
}

export interface TurnoBulkForm {
  vigiladores: Array<{
    id_vigilador: number;
    dias_vigilador: Array<{
      id_dia_vigilador: number;
      fecha: string;
      id_dia_planilla: number;
    }>;
  }>;
  turnosOrganizadosPorDia: Array<{
    id_dia_planilla: number;
    vigiladores: Array<{
      id_vigilador: number;
      id_dia_vigilador: number;
      turnos: Array<{
        hora_inicio: string;
        cantidad_horas: number;
      }>;
    }>;
  }>;
}

export interface DiaVigilador {
  id_dia_vigilador: number;
  id_vigilador: number;
  fecha: string;
  estado: 'trabaja' | 'franco' | 'ausente' | 'vacaciones' | 'licencia' | 'feriado' | 'enfermo' | 'No Asignado';
}

export interface ContinuidadTurno {
  id_continuidad_turno: number;
  id_turno: number;
  id_dia_planilla_destino: number;
  id_dia_vigilador_destino: number;
  id_vigilador: number;
  fecha: string;
  hora_inicio_heredada: string;
  hora_fin_heredada: string;
}

// Estados compartidos
export const AsistenciaEstado = {
  OK: 'OK',
  DESVIO: 'DESVIO',
  SIN_PLANIFICACION: 'SIN_PLANIFICACION',
  VIGILADOR_DESCONOCIDO: 'VIGILADOR_DESCONOCIDO',
  SIN_COMPARACION: 'SIN_COMPARACION',
} as const
export type AsistenciaEstadoType = typeof AsistenciaEstado[keyof typeof AsistenciaEstado]

export const DiaVigiladorEstado = {
  TRABAJA: 'trabaja',
  NO_ASIGNADO: 'No Asignado',
  FRANCO: 'franco',
  AUSENTE: 'ausente',
  VACACIONES: 'vacaciones',
  LICENCIA: 'licencia',
  FERIADO: 'feriado',
  ENFERMO: 'enfermo',
} as const
export type DiaVigiladorEstadoType = typeof DiaVigiladorEstado[keyof typeof DiaVigiladorEstado]

export interface Vigilador {
  id_vigilador: number;
  nombre: string;
  apellido: string;
  legajo: string;
  dni: string;
  activo: boolean;
  created_at: string;
  updated_at?: string;
}

export interface PlanillaVigilador {
  id_planilla: number;
  id_vigilador: number;
}

// Tipos para contabilidad
export interface ContabilidadResumen {
  id_vigilador: number;
  mes: number;
  anio: number;
  horas_diurnas: number;
  horas_nocturnas: number;
  horas_totales: number;
  dias_trabajados: number;
}

export interface ContabilidadPlanilla {
  fecha: string;
  estado: string;
  turnos: Array<{
    hora_inicio: string;
    hora_fin: string;
    horas_diurnas: number;
    horas_nocturnas: number;
    horas_totales: number;
  }>;
  horas_diurnas: number;
  horas_nocturnas: number;
  horas_totales: number;
}

export interface AsistenciaExcel {
  legajo: number;
  fecha: string;
  pares?: Array<{ entrada: string; salida: string }>;
  horas_diurnas: number;
  horas_nocturnas: number;
  horas_totales: number;
  feriado?: boolean;
  dia_trabajado: boolean;
}

// Estados reales que puede devolver el backend actualmente
export type EstadoComparacion =
  | 'OK'
  | 'DESVIO'
  | 'SIN_COMPARACION'
  | 'VIGILADOR_DESCONOCIDO'
  | 'SIN_PLANIFICACION';

export interface ComparacionDetalle {
  excel: { inicio: string; fin: string; dur_min: number };
  plan: { inicio: string; fin: string; dur_min: number };
  delta_min: number;
  dentro_tolerancia: boolean;
}

export interface ComparacionAsistencia extends AsistenciaExcel {
  id_vigilador?: number;
  estado: EstadoComparacion;
  comparaciones?: ComparacionDetalle[];
  delta_total_min?: number;
}

export interface ResumenMensual {
  legajo: number | string;
  horas_diurnas: number;
  horas_nocturnas: number;
  horas_totales: number;
  dias_trabajado: number;
  ausencias: number;
}

// Tipos para formularios y filtros
export interface LoginForm {
  email: string;
  password: string;
}

export interface User {
  id_usuario: number;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
}

// Tipos para navegación