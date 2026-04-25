export interface FakeActivity {
  id: number;
  titulo: string;
  nombre: string;
  createdAt: string;
  progreso: number;
}

export const fakeActivities: FakeActivity[] = [
  { id: 1, titulo: 'Levantamiento de necesidades', nombre: 'Plan de Capacitación Anual', createdAt: '2025-01-15', progreso: 72 },
  { id: 2, titulo: 'Revisión presupuestaria',      nombre: 'Gestión Financiera Q1',       createdAt: '2025-02-03', progreso: 45 },
  { id: 3, titulo: 'Taller de inducción',           nombre: 'Formación de personal',       createdAt: '2025-02-20', progreso: 90 },
  { id: 4, titulo: 'Diagnóstico institucional',    nombre: 'Evaluación de desempeño',     createdAt: '2025-03-01', progreso: 30 },
  { id: 5, titulo: 'Diseño del cronograma',        nombre: 'Planificación estratégica',   createdAt: '2025-03-12', progreso: 60 },
  { id: 6, titulo: 'Seguimiento de indicadores',   nombre: 'Monitoreo y evaluación',      createdAt: '2025-04-05', progreso: 15 },
];
