
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ReactTabulator, ColumnDefinition } from 'react-tabulator';
import 'react-tabulator/lib/styles.css';
import 'react-tabulator/lib/css/tabulator_bootstrap3.min.css';
import { Plan, Activity, User } from '../types';
import ConfirmationModal from './ConfirmationModal';
import Drawer from './Drawer';
import { ArrowLeftIcon, PlusIcon } from './Icons';
import { useToast } from '../hooks/useToast';
import { activityService } from '../services/ActivityService';
import { userService, UserWithCompletion } from '../services/UserService';
import Spinner from './shared/Spinner';

interface PlanDetailProps {
  plan: Plan;
  employees?: User[];
  onBack: () => void;
  onUpdatePlan: (updatedPlan: Plan) => void;
}

const MONTH_NAMES: Record<number, string> = {
  1: 'Enero',     2: 'Febrero',   3: 'Marzo',     4: 'Abril',
  5: 'Mayo',      6: 'Junio',     7: 'Julio',      8: 'Agosto',
  9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

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

interface ActivityRow {
  id: number;
  plan_id: number;
  titulo: string;
  descripcion: string;
  progreso: number;
}

const PlanDetail: React.FC<PlanDetailProps> = ({ plan, employees = [], onBack }) => {
  const [activeSection, setActiveSection] = useState<'activities' | 'employees'>('activities');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const [activityToView, setActivityToView] = useState<ActivityRow | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<ActivityRow | null>(null);
  const [activityToEdit, setActivityToEdit] = useState<ActivityRow | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [employeeToView, setEmployeeToView] = useState<User | null>(null);
  const [activityCompletions, setActivityCompletions] = useState<UserWithCompletion[]>([]);
  const [loadingCompletions, setLoadingCompletions] = useState(false);

  const employeesRef = useRef(employees);
  employeesRef.current = employees;

  const { addToast } = useToast();

  useEffect(() => {
    if (!activityToView) return;
    let cancelled = false;
    setLoadingCompletions(true);
    setActivityCompletions([]);
    userService.getUsersByActivity(activityToView.id)
      .then(data => { if (!cancelled) setActivityCompletions(data); })
      .catch(() => { if (!cancelled) addToast('Error al cargar el progreso de la actividad.', 'error'); })
      .finally(() => { if (!cancelled) setLoadingCompletions(false); });
    return () => { cancelled = true; };
  }, [activityToView?.id]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    activityService.getActivities(plan.id)
      .then(data => { if (!cancelled) setActivities(data); })
      .catch(() => { if (!cancelled) addToast('Error al cargar las actividades.', 'error'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [plan.id]);

  const tableData: ActivityRow[] = useMemo(() =>
    activities.map(a => ({
      id: a.id,
      plan_id: a.plan_id,
      titulo: a.title,
      descripcion: a.description,
      progreso: 0,
    })),
  [activities]);

  const handleCellClick = (_e: any, cell: any) => {
    const target = _e.target as HTMLElement;
    const action = target.dataset.action;
    if (!action) return;
    const row = cell.getData() as ActivityRow;
    if (action === 'view') setActivityToView(row);
    if (action === 'edit') {
      setActivityToEdit(row);
      setEditTitle(row.titulo);
      setEditDescription(row.descripcion);
    }
    if (action === 'delete') setActivityToDelete(row);
  };

  const columns: ColumnDefinition[] = useMemo(() => [
    { title: 'Título',      field: 'titulo',      widthGrow: 2, headerSort: true },
    { title: 'Descripción', field: 'descripcion', widthGrow: 3, headerSort: true },
    { title: 'Progreso',    field: 'progreso',    widthGrow: 2, headerSort: true, formatter: progressFormatter, cellClick: handleCellClick },
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

  const employeeTableData = useMemo(() =>
    employees.map(employee => ({
      employeeId: employee.id,
      nombre: employee.name,
      tareas: `0/${activities.length}`,
      progreso: 0,
    })),
  [employees, activities]);

  const employeeColumns: ColumnDefinition[] = useMemo(() => [
    { title: 'Nombre',   field: 'nombre',  widthGrow: 2, headerSort: true },
    { title: 'Tareas',   field: 'tareas',  width: 90, hozAlign: 'center' as const, headerSort: false },
    {
      title: 'Progreso', field: 'progreso', widthGrow: 2, headerSort: true, formatter: progressFormatter,
      cellClick: (_e: any, cell: any) => {
        const target = _e.target as HTMLElement;
        if (target.dataset.action !== 'view') return;
        const { employeeId } = cell.getData();
        const employee = employeesRef.current.find(w => w.id === employeeId);
        if (employee) setEmployeeToView(employee);
      },
    },
  ], []);

  const tabClass = (section: 'activities' | 'employees') =>
    activeSection === section
      ? 'border-primary text-primary whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm';

  const handleAddActivity = async () => {
    if (!newTitle.trim() || !newDescription.trim()) {
      addToast('El título y la descripción son obligatorios.', 'error');
      return;
    }
    setIsAdding(true);
    try {
      const created = await activityService.createActivity({
        plan_id: plan.id,
        title: newTitle.trim(),
        description: newDescription.trim(),
      });
      setActivities(prev => [...prev, created]);
      addToast('Actividad añadida con éxito.', 'success');
      closeAddDrawer();
    } catch {
      addToast('Error al crear la actividad.', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleConfirmEditActivity = async () => {
    if (!activityToEdit || !editTitle.trim() || !editDescription.trim()) {
      addToast('El título y la descripción son obligatorios.', 'error');
      return;
    }
    setIsSavingEdit(true);
    try {
      const updated = await activityService.updateActivity(activityToEdit.id, {
        plan_id: activityToEdit.plan_id,
        title: editTitle.trim(),
        description: editDescription.trim(),
      });
      setActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
      addToast('Actividad actualizada con éxito.', 'success');
      setActivityToEdit(null);
    } catch {
      addToast('Error al actualizar la actividad.', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDeleteActivity = async () => {
    if (!activityToDelete) return;
    setIsDeleting(true);
    try {
      await activityService.deleteActivity(activityToDelete.id);
      setActivities(prev => prev.filter(a => a.id !== activityToDelete.id));
      addToast('Actividad eliminada correctamente.', 'success');
      setActivityToDelete(null);
    } catch {
      addToast('Error al eliminar la actividad.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const closeAddDrawer = () => {
    setIsAddOpen(false);
    setNewTitle('');
    setNewDescription('');
  };

  const [year, month, day] = plan.expiration_date.split('-').map(Number);
  const deadlineStr = new Date(year, month - 1, day).toLocaleDateString('es-ES');

  return (
    <>
      <div className="space-y-4">
        <div>
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline mb-4">
            <ArrowLeftIcon className="w-5 h-5" />
            Volver al Panel
          </button>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-primary">{plan.title}</h1>
            <p className="text-dark-gray mt-1">
              {MONTH_NAMES[plan.month] ?? plan.month} | Fecha Límite: {deadlineStr}
            </p>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6">
            <button className={tabClass('activities')} onClick={() => setActiveSection('activities')}>Actividades</button>
            <button className={tabClass('employees')} onClick={() => setActiveSection('employees')}>Empleados</button>
          </nav>
        </div>

        {activeSection === 'activities' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center flex-wrap gap-3">
              <h2 className="text-2xl font-bold text-dark-gray">Actividades</h2>
              <button
                onClick={() => setIsAddOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                Añadir Actividad
              </button>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="flex justify-center py-8"><Spinner className="h-6 w-6 text-primary" /></div>
              ) : (
                <ReactTabulator
                  data={tableData}
                  columns={columns}
                  layout="fitColumns"
                  options={{ movableColumns: true }}
                />
              )}
            </div>
          </div>
        )}

        {activeSection === 'employees' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h2 className="text-2xl font-bold text-dark-gray">Empleados</h2>
            </div>
            <div className="p-4">
              {employeeTableData.length ? (
                <ReactTabulator
                  data={employeeTableData}
                  columns={employeeColumns}
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

      {/* Drawer: añadir actividad */}
      <Drawer isOpen={isAddOpen} onClose={closeAddDrawer} title="Añadir Actividad">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Título</label>
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-3 border-t pt-4">
          <button onClick={closeAddDrawer} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm">Cancelar</button>
          <button
            onClick={handleAddActivity}
            disabled={isAdding}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark text-sm font-semibold disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAdding && <Spinner />}
            {isAdding ? 'Añadiendo...' : 'Añadir'}
          </button>
        </div>
      </Drawer>

      {/* Drawer: editar actividad */}
      <Drawer isOpen={activityToEdit !== null} onClose={() => setActivityToEdit(null)} title="Editar Actividad">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Título</label>
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-3 border-t pt-4">
          <button onClick={() => setActivityToEdit(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm">Cancelar</button>
          <button
            onClick={handleConfirmEditActivity}
            disabled={isSavingEdit}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark text-sm font-semibold disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSavingEdit && <Spinner />}
            {isSavingEdit ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </Drawer>

      {/* Drawer: progreso de actividad */}
      <Drawer
        isOpen={activityToView !== null}
        onClose={() => setActivityToView(null)}
        title={`Progreso — ${activityToView?.titulo ?? ''}`}
      >
        {loadingCompletions ? (
          <div className="flex justify-center py-10"><Spinner className="h-6 w-6 text-primary" /></div>
        ) : activityCompletions.length ? (
          <div className="space-y-3">
            {activityCompletions.map(u => (
              <div key={u.id} className="flex items-start justify-between p-3 rounded-lg bg-gray-50 border border-gray-100 gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 text-sm">{u.name}</p>
                  {u.completion.observations && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{u.completion.observations}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(u.completion.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                {u.completion.evidenceUrl && (
                  <a
                    href={u.completion.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary font-medium hover:underline whitespace-nowrap"
                  >
                    Ver evidencia
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-10 text-sm">Ningún empleado ha completado esta actividad aún.</p>
        )}
      </Drawer>

      {/* Drawer: actividades completadas por empleado */}
      <Drawer
        isOpen={employeeToView !== null}
        onClose={() => setEmployeeToView(null)}
        title={employeeToView?.name ?? ''}
      >
        {employeeToView && (
          <>
            <p className="text-xs text-gray-400 mb-4">{plan.title}</p>
            {activities.length ? (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-3 py-2 border-b">Actividad</th>
                    <th className="px-3 py-2 border-b">Descripción</th>
                    <th className="px-3 py-2 border-b text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activities.map(act => (
                    <tr key={act.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-gray-800">{act.title}</td>
                      <td className="px-3 py-2.5 text-gray-500 text-xs">{act.description}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-full px-2 py-0.5">Pendiente</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-gray-400 py-8 text-sm">Este plan no tiene actividades aún.</p>
            )}
          </>
        )}
      </Drawer>

      <ConfirmationModal
        isOpen={activityToDelete !== null}
        onClose={() => setActivityToDelete(null)}
        onConfirm={handleConfirmDeleteActivity}
        title="Confirmar Eliminación de Actividad"
        confirmText="Eliminar"
        isLoading={isDeleting}
      >
        <p>¿Estás seguro de que quieres eliminar <strong>"{activityToDelete?.titulo}"</strong>?</p>
        <p className="mt-2 text-sm text-red-700">Esta acción no se puede deshacer.</p>
      </ConfirmationModal>
    </>
  );
};

export default PlanDetail;
