
import { User, Plan, Role, ActivityStatus } from '../types';

export const USERS: User[] = [
  { id: 2, name: 'Alain Supervisor', username: 'supervisor', role: Role.SUPERVISOR },
  { id: 3, name: 'Roberto Trabajador', username: 'worker1', role: Role.EMPLOYEE },
  { id: 4, name: 'Carlos Trabajador', username: 'worker2', role: Role.EMPLOYEE },
];

const EMPLOYEES = USERS.filter(u => u.role === Role.EMPLOYEE);

const today = new Date();
const yesterday = new Date();
yesterday.setDate(today.getDate() - 1); // Para probar planes vencidos

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
    deadline: yesterday.toISOString(), // Establecido a ayer para mostrar el estado vencido
    activities: [
      { 
        id: 101, 
        name: 'Recopilar datos de ventas del T1', 
        completions: [
          { employeeId: 2, status: ActivityStatus.COMPLETED, completedAt: '2025-01-18', evidenceFile: 'datos_ventas_t1.pdf' },
          { employeeId: 3, status: ActivityStatus.PENDING }
        ]
      },
      { 
        id: 102, 
        name: 'Compilar análisis de marketing', 
        completions: [
          { employeeId: 2, status: ActivityStatus.PENDING },
          { employeeId: 3, status: ActivityStatus.PENDING }
        ]
      },
      { 
        id: 103, 
        name: 'Redactar borrador del resumen del informe', 
        completions: [
          { employeeId: 2, status: ActivityStatus.PENDING },
          { employeeId: 3, status: ActivityStatus.PENDING }
        ]
      },
      { 
        id: 104, 
        name: 'Revisar estados financieros', 
        completions: [
          { employeeId: 2, status: ActivityStatus.PENDING },
          { employeeId: 3, status: ActivityStatus.COMPLETED, completedAt: '2025-01-22', evidenceFile: 'revision_financiera.pdf' }
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
    deadline: new Date(today.getFullYear(), today.getMonth(), 15).toISOString(), // Una fecha límite pasada para pruebas
    activities: [
      { 
        id: 201, 
        name: 'Diseñar materiales promocionales', 
        completions: [
          { employeeId: 2, status: ActivityStatus.COMPLETED, completedAt: '2025-02-05', evidenceFile: 'diseños_promocionales.pdf' },
          { employeeId: 3, status: ActivityStatus.PENDING }
        ]
      },
      { 
        id: 202, 
        name: 'Configurar anuncios en redes sociales', 
        completions: [
          { employeeId: 2, status: ActivityStatus.PENDING },
          { employeeId: 3, status: ActivityStatus.PENDING }
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
        completions: EMPLOYEES.map(w => ({ employeeId: w.id, status: ActivityStatus.PENDING }))
      },
      { 
        id: 302, 
        name: 'Analizar flujos de onboarding de la competencia', 
        completions: EMPLOYEES.map(w => ({ employeeId: w.id, status: ActivityStatus.PENDING }))
      },
      { 
        id: 303, 
        name: 'Proponer nueva checklist de onboarding', 
        completions: EMPLOYEES.map(w => ({ employeeId: w.id, status: ActivityStatus.PENDING }))
      },
    ],
  },
];
