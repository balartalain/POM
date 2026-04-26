export interface FakeCompletion {
  employeeName: string;
  completedAt: string;
  evidenceUrl: string;
}

export interface FakeActivity {
  id: number;
  titulo: string;
  nombre: string;
  createdAt: string;
  progreso: number;
  completions: FakeCompletion[];
}

export const fakeActivities: FakeActivity[] = [
  {
    id: 1,
    titulo: 'Levantamiento de necesidades',
    nombre: 'Plan de Capacitación Anual',
    createdAt: '2025-01-15',
    progreso: 72,
    completions: [
      { employeeName: 'Ana Martínez',   completedAt: '2025-01-22', evidenceUrl: 'https://docs.example.com/ev-001.pdf' },
      { employeeName: 'Carlos Pérez',   completedAt: '2025-01-24', evidenceUrl: 'https://docs.example.com/ev-002.pdf' },
      { employeeName: 'Laura Gómez',    completedAt: '2025-01-28', evidenceUrl: 'https://docs.example.com/ev-003.pdf' },
      { employeeName: 'Pedro Sánchez',  completedAt: '2025-02-01', evidenceUrl: 'https://docs.example.com/ev-004.pdf' },
    ],
  },
  {
    id: 2,
    titulo: 'Revisión presupuestaria',
    nombre: 'Gestión Financiera Q1',
    createdAt: '2025-02-03',
    progreso: 45,
    completions: [
      { employeeName: 'María López',    completedAt: '2025-02-10', evidenceUrl: 'https://docs.example.com/ev-005.pdf' },
      { employeeName: 'José Ramírez',   completedAt: '2025-02-15', evidenceUrl: 'https://docs.example.com/ev-006.pdf' },
    ],
  },
  {
    id: 3,
    titulo: 'Taller de inducción',
    nombre: 'Formación de personal',
    createdAt: '2025-02-20',
    progreso: 90,
    completions: [
      { employeeName: 'Ana Martínez',   completedAt: '2025-02-25', evidenceUrl: 'https://docs.example.com/ev-007.pdf' },
      { employeeName: 'Carlos Pérez',   completedAt: '2025-02-26', evidenceUrl: 'https://docs.example.com/ev-008.pdf' },
      { employeeName: 'Laura Gómez',    completedAt: '2025-02-27', evidenceUrl: 'https://docs.example.com/ev-009.pdf' },
      { employeeName: 'Pedro Sánchez',  completedAt: '2025-03-01', evidenceUrl: 'https://docs.example.com/ev-010.pdf' },
      { employeeName: 'María López',    completedAt: '2025-03-02', evidenceUrl: 'https://docs.example.com/ev-011.pdf' },
    ],
  },
  {
    id: 4,
    titulo: 'Diagnóstico institucional',
    nombre: 'Evaluación de desempeño',
    createdAt: '2025-03-01',
    progreso: 30,
    completions: [
      { employeeName: 'José Ramírez',   completedAt: '2025-03-10', evidenceUrl: 'https://docs.example.com/ev-012.pdf' },
    ],
  },
  {
    id: 5,
    titulo: 'Diseño del cronograma',
    nombre: 'Planificación estratégica',
    createdAt: '2025-03-12',
    progreso: 60,
    completions: [
      { employeeName: 'Laura Gómez',    completedAt: '2025-03-20', evidenceUrl: 'https://docs.example.com/ev-013.pdf' },
      { employeeName: 'Carlos Pérez',   completedAt: '2025-03-22', evidenceUrl: 'https://docs.example.com/ev-014.pdf' },
      { employeeName: 'Ana Martínez',   completedAt: '2025-03-25', evidenceUrl: 'https://docs.example.com/ev-015.pdf' },
    ],
  },
  {
    id: 6,
    titulo: 'Seguimiento de indicadores',
    nombre: 'Monitoreo y evaluación',
    createdAt: '2025-04-05',
    progreso: 15,
    completions: [
      { employeeName: 'Pedro Sánchez',  completedAt: '2025-04-12', evidenceUrl: 'https://docs.example.com/ev-016.pdf' },
    ],
  },
];
