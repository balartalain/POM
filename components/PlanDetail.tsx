
import React, { useState, useMemo, useRef } from 'react';
import { ReactTabulator, ColumnDefinition } from 'react-tabulator';
import 'react-tabulator/lib/styles.css';
import 'react-tabulator/lib/css/tabulator_bootstrap3.min.css';
import { Plan, User, ActivityStatus, ActivityCompletion } from '../types';
import ConfirmationModal from './ConfirmationModal';
import Drawer from './Drawer';
import { ArrowLeftIcon, PlusIcon } from './Icons';
import { useToast } from '../hooks/useToast';
import { fakeActivities, FakeActivity } from '../data/fakeActivities';

interface PlanDetailProps {
  plan: Plan;
  workers: User[];
  onBack: () => void;
  onAddActivities: (planId: number, newActivities: Array<{name: string}>) => void;
  onUpdatePlan: (updatedPlan: Plan) => void;
}

const progressFormatter = (cell: any) => {
  const val: number = cell.getValue();
  const color = val < 40 ? '#ef4444' : val < 75 ? '#eab308' : '#22c55e';
  return `
    <div style="display:flex;flex-direction:column;gap:4px;min-width:80px">
      <div style="background:#e5e7eb;border-radius:9999px;height:5px;overflow:hidden">
        <div style="width:${val}%;background:${color};height:100%;border-radius:9999px;transition:width 0.3s"></div>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <span style="font-size:0.7rem;color:#6b7280">${val}%</span>
        <a
          data-action="view"
          style="font-size:0.7rem;color:#15803d;text-decoration:underline;cursor:pointer;white-space:nowrap"
        >Ver progreso</a>
      </div>
    </div>
  `;
};

const dateFormatter = (cell: any) =>
  new Date(cell.getValue()).toLocaleDateString('es-ES');

const actionsFormatter = () => `
  <div style="display:flex;gap:6px;justify-content:center">
    <button
      data-action="edit"
      style="padding:4px 10px;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;border-radius:6px;font-size:0.75rem;cursor:pointer"
    >Editar</button>
    <button
      data-action="delete"
      style="padding:4px 10px;background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;border-radius:6px;font-size:0.75rem;cursor:pointer"
    >Eliminar</button>
  </div>
`;

const PlanDetail: React.FC<PlanDetailProps> = ({ plan, workers, onBack, onAddActivities }) => {
  const [activeSection, setActiveSection] = useState<'activities' | 'workers'>('activities');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newActivities, setNewActivities] = useState<Array<{name: string}>>([{ name: '' }]);

  const [activityToDelete, setActivityToDelete] = useState<FakeActivity | null>(null);
  const [activityToEdit, setActivityToEdit] = useState<FakeActivity | null>(null);
  const [editedActivityName, setEditedActivityName] = useState('');
  const [activityToView, setActivityToView] = useState<FakeActivity | null>(null);
  const [workerToView, setWorkerToView] = useState<User | null>(null);

  const { addToast } = useToast();

  const workersRef = useRef(workers);
  workersRef.current = workers;

  const workerProgress = useMemo(() =>
    workers.map(worker => {
      const completions = plan.activities
        .map(a => a.completions.find(c => c.workerId === worker.id))
        .filter((c): c is ActivityCompletion => c !== undefined);
      const total = completions.length;
      const completed = completions.filter(c => c.status === ActivityStatus.COMPLETED).length;
      return { worker, completed, total, progress: total > 0 ? Math.round((completed / total) * 100) : 0 };
    }),
  [plan, workers]);

  const workerTableData = useMemo(() =>
    workerProgress.map(({ worker, completed, total, progress }) => ({
      workerId: worker.id,
      nombre: worker.name,
      plan: plan.name,
      tareas: `${completed}/${total}`,
      progreso: progress,
    })),
  [workerProgress, plan.name]);

  const workerActivities = useMemo(() => {
    if (!workerToView) return [];
    return plan.activities.flatMap(activity => {
      const completion = activity.completions.find(
        c => c.workerId === workerToView.id && c.status === ActivityStatus.COMPLETED
      );
      if (!completion) return [];
      return [{ id: activity.id, nombre: activity.name, completedAt: completion.completedAt, evidenceFile: completion.evidenceFile }];
    });
  }, [workerToView, plan]);

  const handleAddActivityField = () => setNewActivities([...newActivities, { name: '' }]);

  const handleRemoveActivityField = (index: number) =>
    setNewActivities(newActivities.filter((_, i) => i !== index));

  const handleActivityChange = (index: number, value: string) => {
    const updated = [...newActivities];
    updated[index].name = value;
    setNewActivities(updated);
  };

  const handleSubmitNewActivities = () => {
    if (newActivities.some(a => !a.name.trim())) {
      alert('Por favor, completa todos los campos para las nuevas actividades.');
      return;
    }
    onAddActivities(plan.id, newActivities);
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewActivities([{ name: '' }]);
  };

  const handleOpenEditActivityModal = (activity: FakeActivity) => {
    setActivityToEdit(activity);
    setEditedActivityName(activity.titulo);
  };

  const handleConfirmEditActivity = () => {
    if (!activityToEdit || !editedActivityName.trim()) {
      alert('El nombre de la actividad no puede estar vacío.');
      return;
    }
    setActivityToEdit(null);
    setEditedActivityName('');
    addToast('Actividad actualizada con éxito.', 'success');
  };

  const handleConfirmDeleteActivity = () => {
    if (!activityToDelete) return;
    setActivityToDelete(null);
    addToast('Actividad eliminada correctamente.', 'success');
  };

  const handleCellClick = (_e: any, cell: any) => {
    const target = _e.target as HTMLElement;
    const action = target.dataset.action;
    if (!action) return;
    const row = cell.getData() as FakeActivity;
    if (action === 'edit') handleOpenEditActivityModal(row);
    if (action === 'delete') setActivityToDelete(row);
    if (action === 'view') setActivityToView(row);
  };

  const workerColumns: ColumnDefinition[] = useMemo(() => [
    { title: 'Nombre',   field: 'nombre',  widthGrow: 2, headerSort: true },
    { title: 'Plan',     field: 'plan',    widthGrow: 2, headerSort: true },
    { title: 'Tareas',   field: 'tareas',  width: 90, hozAlign: 'center' as const, headerSort: false },
    {
      title: 'Progreso', field: 'progreso', widthGrow: 2, headerSort: true, formatter: progressFormatter,
      cellClick: (_e: any, cell: any) => {
        const target = _e.target as HTMLElement;
        if (target.closest('[data-action]')?.getAttribute('data-action') !== 'view') return;
        const { workerId } = cell.getData();
        const worker = workersRef.current.find((w: User) => w.id === workerId);
        if (worker) setWorkerToView(worker);
      },
    },
  ], []);

  const columns: ColumnDefinition[] = useMemo(() => [
    { title: 'Título',       field: 'titulo',    widthGrow: 2, headerSort: true },
    { title: 'Nombre',       field: 'nombre',    widthGrow: 2, headerSort: true },
    { title: 'Fecha Creada', field: 'createdAt', widthGrow: 1, headerSort: true, formatter: dateFormatter },
    { title: 'Progreso',     field: 'progreso',  widthGrow: 2, headerSort: true, formatter: progressFormatter, cellClick: handleCellClick },
    {
      title: 'Acciones',
      field: 'id',
      widthGrow: 1,
      hozAlign: 'center' as const,
      headerSort: false,
      formatter: actionsFormatter,
      cellClick: handleCellClick,
    },
  ], []);

  const tabClass = (section: 'activities' | 'workers') =>
    activeSection === section
      ? 'border-primary text-primary whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm';

  return (
    <>
    <div className="space-y-4">
      {/* Header */}
      <div>
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline mb-4">
          <ArrowLeftIcon className="w-5 h-5" />
          Volver al Panel
        </button>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-primary">{plan.name}</h1>
          <p className="text-dark-gray mt-1 capitalize">
            {plan.month} | Fecha Límite: {new Date(plan.deadline).toLocaleDateString('es-ES')}
          </p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6">
          <button className={tabClass('activities')} onClick={() => setActiveSection('activities')}>
            Actividades
          </button>
          <button className={tabClass('workers')} onClick={() => setActiveSection('workers')}>
            Empleados
          </button>
        </nav>
      </div>

      {/* Activities table */}
      {activeSection === 'activities' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center flex-wrap gap-3">
            <h2 className="text-2xl font-bold text-dark-gray">Actividades</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Añadir Actividades
            </button>
          </div>
          <div className="p-4">
            <ReactTabulator
              data={fakeActivities}
              columns={columns}
              layout="fitColumns"
              options={{ movableColumns: true }}
            />
          </div>
        </div>
      )}

      {/* Workers table */}
      {activeSection === 'workers' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="text-2xl font-bold text-dark-gray">Empleados</h2>
          </div>
          <div className="p-4">
            {workerTableData.length ? (
              <ReactTabulator
                data={workerTableData}
                columns={workerColumns}
                layout="fitColumns"
                options={{ movableColumns: false }}
              />
            ) : (
              <p className="text-center text-gray-400 py-8 text-sm">No hay empleados asignados a este plan.</p>
            )}
          </div>
        </div>
      )}

    </div>

    {/* Drawers y modales fuera del space-y-4 para que el overlay fixed cubra el 100% */}

      {/* Drawer: añadir actividades */}
      <Drawer isOpen={isModalOpen} onClose={closeModal} title="Añadir Nuevas Actividades">
        <div className="space-y-4">
          {newActivities.map((activity, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                placeholder={`Nombre de actividad ${index + 1}`}
                value={activity.name}
                onChange={e => handleActivityChange(index, e.target.value)}
                className="flex-grow block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary text-sm"
              />
              {newActivities.length > 1 && (
                <button onClick={() => handleRemoveActivityField(index)} className="text-red-500 hover:text-red-700 p-1 text-xl font-bold">
                  &times;
                </button>
              )}
            </div>
          ))}
          <button onClick={handleAddActivityField} className="text-sm text-primary hover:underline">+ Añadir otra actividad</button>
        </div>
        <div className="mt-8 flex justify-end gap-3 border-t pt-4">
          <button onClick={closeModal} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm">Cancelar</button>
          <button onClick={handleSubmitNewActivities} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark text-sm font-semibold">Añadir Actividades</button>
        </div>
      </Drawer>

      <ConfirmationModal
        isOpen={activityToDelete !== null}
        onClose={() => setActivityToDelete(null)}
        onConfirm={handleConfirmDeleteActivity}
        title="Confirmar Eliminación de Actividad"
        confirmText="Eliminar"
      >
        <p>¿Estás seguro de que quieres eliminar la actividad <strong>"{activityToDelete?.titulo}"</strong>?</p>
        <p className="mt-2 text-sm text-red-700">Esta acción no se puede deshacer.</p>
      </ConfirmationModal>

      {/* Drawer: activity completions */}
      <Drawer
        isOpen={activityToView !== null}
        onClose={() => setActivityToView(null)}
        title={`Progreso — ${activityToView?.titulo ?? ''}`}
      >
        {activityToView && (
          <>
            <p className="text-sm text-gray-500 mb-4">{activityToView.nombre}</p>
            {activityToView.completions.length ? (
              <div className="space-y-3">
                {activityToView.completions.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{c.workerName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(c.completedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <a
                      href={c.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary font-medium hover:underline whitespace-nowrap ml-4"
                    >
                      Ver evidencia
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-8 text-sm">Ningún empleado ha completado esta actividad aún.</p>
            )}
          </>
        )}
      </Drawer>

      {/* Drawer: worker completed activities */}
      <Drawer
        isOpen={workerToView !== null}
        onClose={() => setWorkerToView(null)}
        title={workerToView?.name ?? ''}
      >
        {workerToView && (
          <>
            <p className="text-xs text-gray-400 mb-4 capitalize">{plan.name} · {plan.month}</p>
            {workerActivities.length ? (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-3 py-2 border-b">Actividad</th>
                    <th className="px-3 py-2 border-b">Fecha completada</th>
                    <th className="px-3 py-2 border-b">Evidencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {workerActivities.map(act => (
                    <tr key={act.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-gray-800">{act.nombre}</td>
                      <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">
                        {act.completedAt
                          ? new Date(act.completedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        {act.evidenceFile
                          ? <a href="#" className="text-xs text-primary hover:underline">{act.evidenceFile}</a>
                          : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-gray-400 py-8 text-sm">Este empleado no ha completado ninguna actividad.</p>
            )}
          </>
        )}
      </Drawer>

      {/* Drawer: editar actividad */}
      <Drawer
        isOpen={activityToEdit !== null}
        onClose={() => setActivityToEdit(null)}
        title="Editar Actividad"
      >
        <div>
          <label htmlFor="activityName" className="block text-sm font-medium text-gray-700">Nombre de la Actividad</label>
          <input
            type="text"
            id="activityName"
            value={editedActivityName}
            onChange={(e) => setEditedActivityName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary text-sm"
          />
        </div>
        <div className="mt-8 flex justify-end gap-3 border-t pt-4">
          <button onClick={() => setActivityToEdit(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm">Cancelar</button>
          <button onClick={handleConfirmEditActivity} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark text-sm font-semibold">Guardar Cambios</button>
        </div>
      </Drawer>
    </>
  );
};

export default PlanDetail;
