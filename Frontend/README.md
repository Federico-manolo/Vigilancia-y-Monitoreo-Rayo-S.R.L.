# Proyecto Rayo - Frontend Web

## Descripción
Aplicación web moderna para la gestión de servicios de vigilancia, planillas, turnos y contabilidad. Desarrollada con React, TypeScript y Vite.

## Stack Tecnológico

### Core
- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y servidor de desarrollo

### UI y Estilos
- **Tailwind CSS** - Framework de CSS utility-first
- **Lucide React** - Iconos modernos
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas

### Estado y Datos
- **TanStack Query (React Query)** - Gestión de estado del servidor
- **Axios** - Cliente HTTP

### Navegación
- **React Router v6** - Enrutamiento de la aplicación

## Estructura del Proyecto

```
Frontend/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   └── Layout.tsx      # Layout principal con navegación
│   ├── screens/            # Pantallas de la aplicación
│   │   ├── ServiciosScreen.tsx      # ✅ Implementada
│   │   ├── PuestosScreen.tsx        # 🔄 Placeholder
│   │   ├── PlanillasScreen.tsx      # 🔄 Placeholder
│   │   ├── PlanillaDetalleScreen.tsx # 🔄 Placeholder
│   │   ├── GestionVigiladoresScreen.tsx # 🔄 Placeholder
│   │   ├── VigiladorAgendaScreen.tsx # 🔄 Placeholder
│   │   ├── ContabilidadScreen.tsx   # 🔄 Placeholder
│   │   ├── ResumenVigiladorScreen.tsx # 🔄 Placeholder
│   │   ├── PlanillaVigiladorScreen.tsx # 🔄 Placeholder
│   │   └── ImportarAsistenciasScreen.tsx # 🔄 Placeholder
│   ├── hooks/              # Hooks personalizados (React Query)
│   ├── services/           # Servicios de API
│   ├── types/              # Tipos TypeScript
│   ├── App.tsx             # Componente principal
│   ├── main.tsx            # Punto de entrada
│   └── index.css           # Estilos globales
├── package.json            # Dependencias y scripts
├── vite.config.ts          # Configuración de Vite
├── tsconfig.json           # Configuración de TypeScript
├── tailwind.config.js      # Configuración de Tailwind CSS
└── postcss.config.js       # Configuración de PostCSS
```

## Estado de Implementación

### ✅ FASE 0: Setup y Migración Base (COMPLETADA)
- [x] Configuración de React + TypeScript + Vite
- [x] Configuración de Tailwind CSS
- [x] Estructura de navegación con React Router
- [x] Layout principal con sidebar responsive
- [x] Pantalla de Servicios completamente funcional
- [x] Hooks de React Query para Servicios
- [x] Pantallas placeholder para futuras fases

### 🔄 FASE 1: Planillas por Puesto (PENDIENTE)
- [ ] Pantalla de Puestos funcional
- [ ] CRUD completo de Puestos
- [ ] Navegación a Planillas
- [ ] Gestión de días de planilla

### 🔄 FASE 2: Gestión de Turnos (PENDIENTE)
- [ ] Creación individual de turnos
- [ ] Creación en lote de turnos
- [ ] Gestión de continuidades
- [ ] Validación de solapamiento

### 🔄 FASE 3: Gestión de Vigiladores (PENDIENTE)
- [ ] Asignación a planillas
- [ ] Estados de vigiladores
- [ ] Agenda de vigiladores

### 🔄 FASE 4: Gestión de Días (PENDIENTE)
- [ ] Configuración de días laborables
- [ ] Cálculo de horas
- [ ] Turnos divididos
- [ ] Horas requeridas

### 🔄 FASE 5: Gestión de Continuidades (PENDIENTE)
- [ ] Creación automática
- [ ] Turnos que cruzan medianoche
- [ ] Recalculación de horas

### 🔄 FASE 6: Gestión de Planillas (PENDIENTE)
- [ ] Duplicación de planillas
- [ ] Eliminación con relaciones
- [ ] Gestión de entidades relacionadas

### 🔄 FASE 7: Gestión de Turnos en Lote (PENDIENTE)
- [ ] Múltiples turnos
- [ ] Asignación masiva
- [ ] Validaciones en lote

### 🔄 FASE 8: Contabilidad (PENDIENTE)
- [ ] Resumen mensual
- [ ] Planilla diaria
- [ ] Importar/Comparar asistencias
- [ ] Reportes de diferencias

## Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm o yarn

### Instalación
```bash
cd Frontend
npm install
```

### Variables de Entorno
Crear archivo `.env.local` en la raíz del proyecto:
```env
VITE_API_URL=http://localhost:3001/api
```

### Desarrollo
```bash
npm run dev
```
La aplicación se abrirá en `http://localhost:3000`

### Build de Producción
```bash
npm run build
npm run preview
```

## Características Implementadas

### Pantalla de Servicios
- ✅ Listado de servicios con búsqueda
- ✅ Crear nuevo servicio
- ✅ Editar servicio existente
- ✅ Eliminar servicio
- ✅ Activar/Desactivar servicio
- ✅ Formularios con validación Zod
- ✅ Notificaciones toast
- ✅ Estado de carga y errores

### Navegación
- ✅ Sidebar responsive para desktop
- ✅ Menú hamburguesa para móvil
- ✅ Navegación entre pantallas
- ✅ Indicador de página activa

### UI/UX
- ✅ Diseño moderno con Tailwind CSS
- ✅ Componentes reutilizables
- ✅ Responsive design
- ✅ Iconos Lucide React
- ✅ Tema de colores personalizado

## Próximos Pasos

1. **Instalar dependencias**: `npm install`
2. **Configurar variables de entorno**
3. **Ejecutar en desarrollo**: `npm run dev`
4. **Implementar FASE 1**: Pantalla de Puestos
5. **Continuar con las fases restantes**

## Tecnologías y Librerías

- **React 18**: Hooks modernos, Suspense, Concurrent Features
- **TypeScript**: Tipado estático, interfaces, generics
- **Vite**: HMR rápido, build optimizado, plugins
- **Tailwind CSS**: Utility-first CSS, responsive, custom components
- **TanStack Query**: Cache, sincronización, optimistic updates
- **React Router**: Navegación declarativa, lazy loading
- **React Hook Form**: Formularios performantes, validación
- **Zod**: Validación de esquemas, inferencia de tipos

## Contribución

El proyecto está estructurado en fases para facilitar el desarrollo incremental. Cada fase se puede implementar de forma independiente siguiendo los patrones establecidos en la FASE 0.
