import React, { useState, useEffect, useMemo } from 'react';
import { Plan, Activity, User } from '../types';
import ConfirmationModal from './ConfirmationModal';
import Drawer from './Drawer';
import { ArrowLeftIcon, PlusIcon, PencilIcon, TrashIcon } from './Icons';
import { useToast } from '../hooks/useToast';
import { activityService, ActivityProgress } from '../services/ActivityService';
import Spinner from './shared/Spinner';
import { getProgressBarColor, getBorderColor, getTextColor, getBgColor } from '../utils/progressColor';
import { formatDate } from '../utils/formatDate';

interface PlanDetailProps {
  plan: Plan;
  employees?: User[];
  onBack: () => void;
  onUpdatePlan: (updatedPlan: Plan) => void;
}

const MONTH_NAMES: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
  5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
  9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

interface ActivityWithCompletions extends Activity {
  completions: ActivityProgress[];
}

interface ActivityItemProps {
  activity: ActivityWithCompletions;
  completedCount: number;
  pendingCount: number;
  percent: number;
  onEdit: (activity: ActivityWithCompletions) => void;
  onDelete: (activity: ActivityWithCompletions) => void;
  onView: (activity: ActivityWithCompletions) => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, completedCount, pendingCount, percent, onEdit, onDelete, onView }) => {
  const borderColor = getBorderColor(percent);
  return (
    <div className={`bg-white border border-slate-200 rounded-xl overflow-hidden border-l-4 ${borderColor}`}>
      <div className="flex items-start gap-6 px-6 py-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-sm font-semibold text-slate-800">{activity.title}</h3>
            <button
              onClick={() => onEdit(activity)}
              className="p-1 text-gray-400 hover:text-blue-700 rounded-full hover:bg-blue-100 transition-all duration-200"
              aria-label={`Editar actividad ${activity.title}`}
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(activity)}
              className="p-1 text-gray-400 hover:text-red-700 rounded-full hover:bg-red-100 transition-all duration-200"
              aria-label={`Eliminar actividad ${activity.title}`}
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{activity.description}</p>
        </div>
        <div className="flex items-center gap-6 flex-shrink-0">
          <div className="text-center">
            <p className="text-xl font-semibold text-emerald-600 leading-none">{completedCount}</p>
            <p className="text-xs text-slate-400 mt-1">Completaron</p>
          </div>
          <div className="w-px h-10 bg-slate-100"></div>
          <div className="text-center">
            <p className="text-xl font-semibold text-slate-400 leading-none">{pendingCount}</p>
            <p className="text-xs text-slate-400 mt-1">Faltan</p>
          </div>
          <div className="w-px h-10 bg-slate-100"></div>
          <div className="text-center min-w-[48px]">
            <p className="text-xl font-semibold text-[#1e3a8a] leading-none">{percent}%</p>
            <p className="text-xs text-slate-400 mt-1">Completado</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-4">
        <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
          <div className={`h-full rounded-full ${getProgressBarColor(percent)}`} style={{ width: `${percent}%` }}></div>
        </div>
        <button
          onClick={() => onView(activity)}
          className="text-xs text-[#1e3a8a] hover:underline font-medium whitespace-nowrap"
        >
          Ver progreso →
        </button>
      </div>
    </div>
  );
};

const PlanDetail: React.FC<PlanDetailProps> = ({ plan, employees = [], onBack }) => {
  const [activities, setActivities] = useState<ActivityWithCompletions[]>([]);
  const [loading, setLoading] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const [activityToView, setActivityToView] = useState<ActivityWithCompletions | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  const [activityToEdit, setActivityToEdit] = useState<Activity | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    if (activityToEdit) {
      setEditTitle(activityToEdit.title);
      setEditDescription(activityToEdit.description);
    }
  }, [activityToEdit]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    activityService.getActivities(plan.id)
      .then(async data => {
        if (cancelled) return;
        const activitiesWithCompletions = await Promise.all(
          data.map(async (activity) => {
            try {
              const completions = await activityService.getActivityProgress(activity.id);
              return { ...activity, completions };
            } catch {
              return { ...activity, completions: [] };
            }
          })
        );
        setActivities(activitiesWithCompletions);
      })
      .catch(() => { if (!cancelled) addToast('Error al cargar las actividades.', 'error'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [plan.id]);

  const metrics = useMemo(() => {
    const completed = activities.filter(a=>a.total_pending === 0).length;
    const pending = activities.filter(a=>a.total_pending > 0).length;
    const total = activities.length;
    return { completed, pending, total };
  }, [activities]);

  const overallProgress = useMemo(() => {
    if (activities.length === 0) return 0;
    
    const sum = activities.reduce((acc, a) => acc + (a.completion_percentage || 0), 0);
    return Math.round(sum / activities.length);
}, [activities]);

  const getActivityMetrics = (activity: ActivityWithCompletions) => {
    const completedCount = activity.total_completed;
    const pendingCount = activity.total_pending || 0;
    const percent = Math.round((completedCount / activities.length) * 100);
    return { completedCount, pendingCount, percent };
  };



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
      const newActivity: ActivityWithCompletions = {
        ...created,
        completions: []
      };
      setActivities(prev => [...prev, newActivity]);
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
      setActivities(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a));
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

  const [, month, day] = plan.expiration_date.split('-').map(Number);
  const deadlineStr = formatDate(new Date(new Date().getFullYear(), month - 1, day));

  if (loading) {
    return (
      <div className="flex justify-center p-8 bg-white rounded-xl shadow">
        <Spinner className="h-6 w-6 text-[#1e3a8a]" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 font-['DM_Sans']">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-[#1e3a8a] hover:underline mb-4">
          <ArrowLeftIcon className="w-5 h-5" />
          Planes
        </button>

        <div className="bg-white border border-slate-200 rounded-xl p-7">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h3 className="text-2xl font-semibold text-[#1e3a8a]">{plan.title}</h3>
              <p className="text-slate-500 mt-1">
                {MONTH_NAMES[plan.month] || `Mes ${plan.month}`} • Fecha límite: {deadlineStr}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="bg-slate-100 rounded-lg px-4 py-2 min-w-[100px] text-center">
                <div className="text-2xl font-bold text-slate-500">{metrics.total}</div>
                <div className="text-xs text-slate-500">Total</div>
              </div>
              <div className="bg-emerald-50 rounded-lg px-4 py-2 min-w-[100px] text-center">
                <div className="text-2xl font-bold text-emerald-600">{metrics.completed}</div>
                <div className="text-xs text-emerald-600">Completas</div>
              </div>
              <div className="bg-amber-50 rounded-lg px-4 py-2 min-w-[100px] text-center">
                <div className="text-2xl font-bold text-amber-500">{metrics.pending}</div>
                <div className="text-xs text-amber-500">Pendientes</div>
              </div>
              <div className={`${getBgColor(overallProgress)} rounded-lg px-4 py-2 min-w-[100px] text-center`}>
                <div className={`text-2xl font-bold ${getTextColor(overallProgress)}`}>{overallProgress}%</div>
                <div className={`text-xs ${getTextColor(overallProgress)}`}>Cumplimiento</div>
              </div>              
            </div>
          </div>
        </div>
        {/*
        <div className="bg-white border border-slate-200 rounded-xl px-7 py-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-600 font-medium whitespace-nowrap">Progreso general</span>
            <div className="flex-1 mx-4">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
            <span className="text-emerald-600 font-semibold whitespace-nowrap">{overallProgress}%</span>
          </div>
        </div>
        */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Actividades</h4>
            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-2 text-xs font-medium bg-[#1e3a8a] hover:bg-[#162d6e] text-white px-4 py-2 rounded-lg transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Añadir actividad
            </button>
          </div>
          <div className="space-y-4">
            {activities.length > 0 ? activities.map(activity => {
              const { completedCount, pendingCount, percent } = getActivityMetrics(activity);
              return (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  completedCount={completedCount}
                  pendingCount={pendingCount}
                  percent={percent}
                  onEdit={setActivityToEdit}
                  onDelete={setActivityToDelete}
                  onView={setActivityToView}
                />
              );
            }) : (
              <div className="text-center text-slate-500 p-8 bg-white border border-slate-200 rounded-xl">
                <p>Este plan no tiene actividades aún.</p>
              </div>
            )}
          </div>
        </div>
      </div>
        {/* Drawer: añadir actividad */}
        <Drawer isOpen={isAddOpen} onClose={closeAddDrawer} title="Añadir Actividad">
          <div className="space-y-5">
            <div>
              <label htmlFor="newTitle" className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                type="text"
                id="newTitle"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
                placeholder="Ej: Recopilar datos de ventas del T1"
              />
            </div>
            <div>
              <label htmlFor="newDescription" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                id="newDescription"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
                placeholder="Describe los objetivos y detalles de la actividad..."
              />
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3 border-t pt-4">
            <button onClick={closeAddDrawer} disabled={isAdding} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm disabled:opacity-70">Cancelar</button>
            <button
              onClick={handleAddActivity}
              disabled={isAdding || !newTitle.trim() || !newDescription.trim()}
              className="px-4 py-2 bg-[#1e3a8a] text-white rounded-md hover:bg-[#162d6e] text-sm font-semibold disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAdding && <Spinner />}
              {isAdding ? 'Añadiendo...' : 'Añadir'}
            </button>
          </div>
        </Drawer>

        {/* Drawer: editar actividad */}
        <Drawer isOpen={activityToEdit !== null} onClose={() => setActivityToEdit(null)} title="Editar Actividad">
          <div className="space-y-5">
            <div>
              <label htmlFor="editTitle" className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                type="text"
                id="editTitle"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="editDescription" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                id="editDescription"
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
              />
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3 border-t pt-4">
            <button onClick={() => setActivityToEdit(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm">Cancelar</button>
            <button
              onClick={handleConfirmEditActivity}
              disabled={isSavingEdit}
              className="px-4 py-2 bg-[#1e3a8a] text-white rounded-md hover:bg-[#162d6e] text-sm font-semibold disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
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
          title={`Progreso — ${activityToView?.title ?? ''}`}
        >
          {activityToView && activityToView.completions.length > 0 ? (
            <div className="space-y-3">
              {activityToView.completions.map(u => (
                <div key={u.employeeId} className="flex items-start justify-between p-3 rounded-lg bg-gray-50 border border-gray-100 gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm">{u.employeeName}</p>
                    {u.observations && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{u.observations}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {u.createdAt && formatDate(u.createdAt, { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  {u.evidenceUrl && (
                    <a
                      href={u.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#1e3a8a] font-medium hover:underline whitespace-nowrap"
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

        <ConfirmationModal
          isOpen={activityToDelete !== null}
          onClose={() => setActivityToDelete(null)}
          onConfirm={handleConfirmDeleteActivity}
          title="Confirmar Eliminación de Actividad"
          confirmText="Eliminar"
          isLoading={isDeleting}
        >
          <p>¿Estás seguro de que quieres eliminar <strong>"{activityToDelete?.title}"</strong>?</p>
          <p className="mt-2 text-sm text-red-700">Esta acción no se puede deshacer.</p>
        </ConfirmationModal>       
    </>
  );
};

export default PlanDetail;