
import { User, Plan, Role, ActivityStatus } from '../types';

export const USERS: User[] = [
  { id: 1, name: 'Alicia Supervisora', username: 'supervisor', role: Role.SUPERVISOR },
  { id: 2, name: 'Roberto Trabajador', username: 'worker1', role: Role.WORKER },
  { id: 3, name: 'Carlos Trabajador', username: 'worker2', role: Role.WORKER },
];

const WORKERS = USERS.filter(u => u.role === Role.WORKER);

const today = new Date();
const thisMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);

const endOfThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);

const thisMonthName = today.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
const nextMonthName = nextMonthDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

export const INITIAL_PLANS: Plan[] = [
  {
    id: 1,
    name: `Preparación Informe Trimestral - ${thisMonthName}`,
    month: thisMonthName,
    year: thisMonthDate.getFullYear(),
    monthIndex: thisMonthDate.getMonth(),
    deadline: endOfThisMonth.toISOString(),
    activities: [
      { 
        id: 101, 
        name: 'Recopilar datos de ventas del T1', 
        completions: [
          { workerId: 2, status: ActivityStatus.COMPLETED, evidenceFile: 'datos_ventas_t1.pdf' },
          { workerId: 3, status: ActivityStatus.PENDING }
        ]
      },
      { 
        id: 102, 
        name: 'Compilar análisis de marketing', 
        completions: [
          { workerId: 2, status: ActivityStatus.PENDING },
          { workerId: 3, status: ActivityStatus.PENDING }
        ]
      },
      { 
        id: 103, 
        name: 'Redactar borrador del resumen del informe', 
        completions: [
          { workerId: 2, status: ActivityStatus.PENDING },
          { workerId: 3, status: ActivityStatus.PENDING }
        ]
      },
      { 
        id: 104, 
        name: 'Revisar estados financieros', 
        completions: [
          { workerId: 2, status: ActivityStatus.PENDING },
          { workerId: 3, status: ActivityStatus.COMPLETED, evidenceFile: 'revision_financiera.pdf' }
        ]
      },
    ],
  },
  {
    id: 2,
    name: `Campaña Lanzamiento de Producto - ${thisMonthName}`,
    month: thisMonthName,
    year: thisMonthDate.getFullYear(),
    monthIndex: thisMonthDate.getMonth(),
    deadline: new Date(today.getFullYear(), today.getMonth(), 15).toISOString(), // A past deadline for testing
    activities: [
      { 
        id: 201, 
        name: 'Diseñar materiales promocionales', 
        completions: [
          { workerId: 2, status: ActivityStatus.COMPLETED, evidenceFile: 'diseños_promocionales.pdf' },
          { workerId: 3, status: ActivityStatus.PENDING }
        ]
      },
      { 
        id: 202, 
        name: 'Configurar anuncios en redes sociales', 
        completions: [
          { workerId: 2, status: ActivityStatus.PENDING },
          { workerId: 3, status: ActivityStatus.PENDING }
        ]
      },
    ],
  },
    {
    id: 3,
    name: `Mejora Proceso de Onboarding - ${nextMonthName}`,
    month: nextMonthName,
    year: nextMonthDate.getFullYear(),
    monthIndex: nextMonthDate.getMonth(),
    deadline: endOfNextMonth.toISOString(),
    activities: [
      { 
        id: 301, 
        name: 'Encuestar a clientes existentes para feedback', 
        completions: WORKERS.map(w => ({ workerId: w.id, status: ActivityStatus.PENDING }))
      },
      { 
        id: 302, 
        name: 'Analizar flujos de onboarding de la competencia', 
        completions: WORKERS.map(w => ({ workerId: w.id, status: ActivityStatus.PENDING }))
      },
      { 
        id: 303, 
        name: 'Proponer nueva checklist de onboarding', 
        completions: WORKERS.map(w => ({ workerId: w.id, status: ActivityStatus.PENDING }))
      },
    ],
  },
];
