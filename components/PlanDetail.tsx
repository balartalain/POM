
import React, { useState, useEffect, useMemo } from 'react';
import { ReactTabulator, ColumnDefinition } from 'react-tabulator';
import 'react-tabulator/lib/styles.css';
import 'react-tabulator/lib/css/tabulator_bootstrap3.min.css';
import { Plan, Activity } from '../types';
import ConfirmationModal from './ConfirmationModal';
import Drawer from './Drawer';
import { ArrowLeftIcon, PlusIcon } from './Icons';
import { useToast } from '../hooks/useToast';
import { activityService } from '../services/ActivityService';
import Spinner from './shared/Spinner';

interface PlanDetailProps {
  plan: Plan;
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

const PlanDetail: React.FC<PlanDetailProps> = ({ plan, onBack }) => {
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

  const { addToast } = useToast();

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
              <p className="text-center text-dark-gray py-8">Cargando actividades...</p>
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
        {activityToView && (
          <p className="text-center text-gray-400 py-8 text-sm">Ningún empleado ha completado esta actividad aún.</p>
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
