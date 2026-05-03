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
  isSelected: boolean;
  onEdit: (activity: ActivityWithCompletions) => void;
  onDelete: (activity: ActivityWithCompletions) => void;
  onSelect: (activity: ActivityWithCompletions) => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  activity, isSelected, onEdit, onDelete, onSelect,
}) => {
  const completedCount = activity.total_completed;
  const percent = activity.completion_percentage || 0;
  const borderColor = isSelected ? 'border-[#2563EB]' : getBorderColor(percent);
  return (
    <div
      onClick={() => onSelect(activity)}
      className={`bg-white rounded-xl overflow-hidden border-l-4 ${borderColor} cursor-pointer transition-all duration-200
        ${isSelected
          ? 'border border-[#2563EB] shadow-xl relative z-10 bg-blue-50'
          : 'border border-slate-200 hover:shadow-md hover:bg-gray-100'
        }`}
    >
      <div className="flex items-start gap-4 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-slate-800">
              {activity.title}
            </h3>
            <button
              onClick={e => { e.stopPropagation(); onEdit(activity); }}
              className="p-1 text-gray-400 hover:text-blue-700 rounded-full hover:bg-blue-100 transition-all duration-200"
              aria-label={`Editar actividad ${activity.title}`}
            >
              <PencilIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(activity); }}
              className="p-1 text-gray-400 hover:text-red-700 rounded-full hover:bg-red-100 transition-all duration-200"
              aria-label={`Eliminar actividad ${activity.title}`}
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{activity.description}</p>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-center">
            <p className="text-lg font-semibold text-emerald-600 leading-none">{completedCount}</p>
            <p className="text-xs text-slate-400 mt-0.5">Completaron</p>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div className="text-center min-w-[44px]">
            <p className={`text-lg font-semibold leading-none ${isSelected ? 'text-[#1e3a8a]' : 'text-[#1e3a8a]'}`}>{percent}%</p>
            <p className="text-xs text-slate-400 mt-0.5">Progreso</p>
          </div>
        </div>
      </div>
      <div className="px-5 pb-3">
        <div className="bg-slate-200 rounded-full h-1.5 overflow-hidden">
          <div className={`h-full rounded-full ${getProgressBarColor(percent)}`} style={{ width: `${percent}%` }} />
        </div>
      </div>
    </div>
  );
};

const PlanDetail: React.FC<PlanDetailProps> = ({ plan, onBack }) => {
  const [activities, setActivities] = useState<ActivityWithCompletions[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [showCompletions, setShowCompletions] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  const [activityToEdit, setActivityToEdit] = useState<Activity | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { addToast } = useToast();

  const selectedActivity = useMemo(
    () => activities.find(a => a.id === selectedActivityId) ?? null,
    [activities, selectedActivityId],
  );

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
        setSelectedActivityId(prev => prev ?? (activitiesWithCompletions[0]?.id ?? null));
      })
      .catch(() => { if (!cancelled) addToast('Error al cargar las actividades.', 'error'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [plan.id]);

  const metrics = useMemo(() => {
    const completed = activities.filter(a => a.total_pending === 0).length;
    const pending = activities.filter(a => a.total_pending > 0).length;
    const total = activities.length;
    const completedPercent = plan.completion_percentage || 0;
    return { completed, pending, total, completedPercent };
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
      const newActivity: ActivityWithCompletions = { ...created, completions: [] };
      setActivities(prev => [...prev, newActivity]);
      setSelectedActivityId(prev => prev ?? created.id);
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
      setActivities(prev => {
        const next = prev.filter(a => a.id !== activityToDelete.id);
        if (selectedActivityId === activityToDelete.id) {
          setSelectedActivityId(next[0]?.id ?? null);
        }
        return next;
      });
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

        {/* Plan header */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 lg:p-7">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
            <div>
              <h3 className="text-lg lg:text-2xl font-semibold text-[#1e3a8a]">{plan.title}</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                {MONTH_NAMES[plan.month] || `Mes ${plan.month}`} • Fecha límite: {deadlineStr}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex gap-2 lg:gap-3 w-full lg:w-auto">
              <div className="bg-slate-100 rounded-lg px-2 lg:px-4 py-2 text-center">
                <div className="text-xl lg:text-2xl font-bold text-slate-500">{metrics.total}</div>
                <div className="text-xs text-slate-500">Total</div>
              </div>
              <div className="bg-emerald-50 rounded-lg px-2 lg:px-4 py-2 text-center">
                <div className="text-xl lg:text-2xl font-bold text-emerald-600">{metrics.completed}</div>
                <div className="text-xs text-emerald-600">Completas</div>
              </div>
              <div className="bg-amber-50 rounded-lg px-2 lg:px-4 py-2 text-center">
                <div className="text-xl lg:text-2xl font-bold text-amber-500">{metrics.pending}</div>
                <div className="text-xs text-amber-500">Pendientes</div>
              </div>
              <div className={`${getBgColor(metrics.completedPercent)} rounded-lg px-2 lg:px-4 py-2 text-center`}>
                <div className={`text-xl lg:text-2xl font-bold ${getTextColor(metrics.completedPercent)}`}>{metrics.completedPercent}%</div>
                <div className={`text-xs ${getTextColor(metrics.completedPercent)}`}>Cumplimiento</div>
              </div>
            </div>
          </div>
        </div>

        {/* Activities section */}
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

          {activities.length === 0 ? (
            <div className="text-center text-slate-500 p-8 bg-white border border-slate-200 rounded-xl">
              <p>Este plan no tiene actividades aún.</p>
            </div>
          ) : (
            <>
              {/* ── Mobile: sliding panels (< xl) ─────────────────────── */}
              <div className="xl:hidden relative overflow-hidden">
                {/* Activities panel — slides out to the left */}
                <div className={`space-y-3 transition-transform duration-300 ease-in-out ${showCompletions ? '-translate-x-full' : 'translate-x-0'}`}>
                  {activities.map(activity => (
                    <ActivityItem
                      key={activity.id}
                      activity={activity}
                      isSelected={selectedActivityId === activity.id}
                      onEdit={setActivityToEdit}
                      onDelete={setActivityToDelete}
                      onSelect={a => { setSelectedActivityId(a.id); setShowCompletions(true); }}
                    />
                  ))}
                </div>

                {/* Completions panel — slides in from the right */}
                <div className={`absolute inset-0 overflow-y-auto transition-transform duration-300 ease-in-out ${showCompletions ? 'translate-x-0' : 'translate-x-full'}`}>
                  <button
                    onClick={() => setShowCompletions(false)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-[#1e3a8a] mb-4"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Actividades
                  </button>
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    {selectedActivity ? (
                      <div className="px-6 py-5">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                          Empleados que completaron
                        </h4>
                        {selectedActivity.completions.length > 0 ? (
                          <div className="space-y-2">
                            {selectedActivity.completions.map(u => (
                              <div key={u.employee_id} className="flex items-start justify-between p-3 rounded-lg bg-gray-50 border border-gray-100 gap-4">
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-800 text-sm">{u.employee_name}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    Completada el {formatDate(u.created_at, { day: '2-digit', month: 'long', year: 'numeric' })}
                                  </p>
                                  {u.observations && <p className="text-xs text-gray-500 mt-0.5 truncate">{u.observations}</p>}
                                </div>
                                {u.evidence_url && (
                                  <a href={u.evidence_url} target="_blank" rel="noopener noreferrer"
                                     className="text-xs text-[#1e3a8a] font-medium hover:underline whitespace-nowrap">
                                    Ver evidencia
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-gray-400 py-10 text-sm">
                            Ningún empleado ha completado esta actividad aún.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <p className="text-sm">Selecciona una actividad para ver el progreso</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Desktop: 2-col grid (xl+) ─────────────────────────── */}
              <div className="hidden xl:grid grid-cols-2 gap-6 items-start">
                <div className="space-y-3">
                  {activities.map(activity => (
                    <ActivityItem
                      key={activity.id}
                      activity={activity}
                      isSelected={selectedActivityId === activity.id}
                      onEdit={setActivityToEdit}
                      onDelete={setActivityToDelete}
                      onSelect={a => setSelectedActivityId(a.id)}
                    />
                  ))}
                </div>

                <div className="sticky top-4 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  {selectedActivity ? (
                    <div className="px-6 py-5">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                        Empleados que completaron
                      </h4>
                      {selectedActivity.completions.length > 0 ? (
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                          {selectedActivity.completions.map(u => (
                            <div key={u.employee_id} className="flex items-start justify-between p-3 rounded-lg bg-gray-50 border border-gray-100 gap-4">
                              <div className="min-w-0">
                                <p className="font-medium text-gray-800 text-sm">{u.employee_name}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  Completada el {formatDate(u.created_at, { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                                {u.observations && <p className="text-xs text-gray-500 mt-0.5 truncate">{u.observations}</p>}
                              </div>
                              {u.evidence_url && (
                                <a href={u.evidence_url} target="_blank" rel="noopener noreferrer"
                                   className="text-xs text-[#1e3a8a] font-medium hover:underline whitespace-nowrap">
                                  Ver evidencia
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-400 py-10 text-sm">
                          Ningún empleado ha completado esta actividad aún.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                      <p className="text-sm">Selecciona una actividad para ver el progreso</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
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
