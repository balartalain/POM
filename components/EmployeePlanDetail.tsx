import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Plan, User } from '../types';
import { ArrowLeftIcon, CheckCircleIcon, ClockIcon, LinkIcon, ExternalLinkIcon, UploadIcon, PencilIcon, TrashIcon } from './Icons';
import { userService, UserActivity } from '../services/UserService';
import { activityService } from '../services/ActivityService';
import Drawer from './Drawer';
import Spinner from './shared/Spinner';
import { useToast } from '../hooks/useToast';
import { useDataSync } from '../hooks/useDataSync';
import { formatDate } from '../utils/formatDate';
import { getProgressBarColor, getTextColor } from '@/utils/progressColor';

const MONTH_NAMES: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
  5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
  9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

interface EmployeePlanDetailProps {
  plan: Plan;
  employee: User;
  onBack: () => void;
  onUpdatePlan: (planId: number, metrics: Pick<Plan, 'total_completed' | 'completion_percentage'>) => void;
}

interface UploadEvidenceProps {
  description: string;
  selectedFile: File | null;
  observations: string;
  isUploading: boolean;
  onFileChange: (file: File | null) => void;
  onObservationsChange: (value: string) => void;
  onCancel: () => void;
  onUpload: () => void;
  submitLabel?: string;
  submittingLabel?: string;
  fileRequired?: boolean;
  currentEvidenceUrl?: string | null;
}

const UploadEvidence: React.FC<UploadEvidenceProps> = ({
  description, selectedFile, observations, isUploading, onFileChange, onObservationsChange, onCancel, onUpload,
  submitLabel = 'Completar actividad', submittingLabel = 'Subiendo...', fileRequired = true, currentEvidenceUrl,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <div className="space-y-6">
        <p className="text-sm text-gray-500">{description}</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {fileRequired ? 'Archivo de evidencia *' : 'Archivo de evidencia (opcional, reemplaza el actual)'}
          </label>
          {currentEvidenceUrl && (
            <a
              href={currentEvidenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mb-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver evidencia actual
            </a>
          )}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-[#1e3a8a] hover:bg-blue-50 transition-colors"
          >
            <UploadIcon className="w-8 h-8 text-gray-400" />
            {selectedFile ? (
              <div className="text-center">
                <p className="text-sm font-medium text-[#1e3a8a]">{selectedFile.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Haz click para seleccionar un archivo</p>
                <p className="text-xs text-gray-400 mt-0.5">PDF, imagen o documento</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={e => onFileChange(e.target.files?.[0] ?? null)}
          />
        </div>
        {selectedFile && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border text-sm">
            <span className="text-gray-700 truncate">{selectedFile.name}</span>
            <button
              onClick={() => { onFileChange(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              className="ml-3 text-gray-400 hover:text-red-500 transition-colors shrink-0"
            >
              ✕
            </button>
          </div>
        )}
        <div>
          <label htmlFor="evidenceObservations" className="block text-sm font-medium text-gray-700 mb-1">
            Observaciones (opcional)
          </label>
          <textarea
            id="evidenceObservations"
            value={observations}
            onChange={e => onObservationsChange(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
            placeholder="Agrega alguna observación sobre la evidencia..."
          />
        </div>
      </div>
      <div className="mt-8 flex justify-end gap-3 border-t pt-4">
        <button onClick={onCancel} disabled={isUploading} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm disabled:opacity-70">
          Cancelar
        </button>
        <button
          onClick={onUpload}
          disabled={(fileRequired && !selectedFile) || isUploading}
          className="px-4 py-2 bg-[#1e3a8a] text-white rounded-md hover:bg-[#162d6e] text-sm font-semibold disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isUploading && <Spinner />}
          {isUploading ? submittingLabel : submitLabel}
        </button>
      </div>
    </>
  );
};

interface ActivityItemProps {
  activity: UserActivity;
  onComplete: (activity: UserActivity) => void;
  isPlanExpired: boolean;
  onEdit?: (activity: UserActivity) => void;
  onDeleteEvidence?: (activityId: number) => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, onComplete, isPlanExpired, onEdit, onDeleteEvidence }) => {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  return (
  <div
    className={`bg-white border border-slate-200 rounded-xl overflow-hidden ${
      activity.completed ? 'border-l-4 border-l-emerald-400' : 'border-l-4 border-l-amber-400'
    }`}
  >
    <div className="flex items-start justify-between gap-3 sm:gap-6 px-4 sm:px-6 py-4 sm:py-5">
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-slate-800 mb-1 break-words">{activity.title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed break-words">{activity.description}</p>
      </div>
      {activity.completed ? (
        <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-50 text-emerald-600 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Completada
        </span>
      ) : (
        <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium bg-amber-50 text-amber-500 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          Pendiente
        </span>
      )}
    </div>
    <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-100">
      {activity.completed ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <svg className="w-3 h-3 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span className="text-xs text-slate-400">Completada el <span className="text-slate-500">{formatDate(activity.completed_at)}</span></span>
            </div>
            {activity.observations && (
              <p className="text-xs text-slate-500 italic break-words">{activity.observations}</p>
            )}
          </div>
          {activity.evidence_url && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs shrink-0 pt-2 sm:pt-0 border-t border-slate-200 sm:border-0">
              <span className="text-slate-400 font-medium">Evidencia:</span>
              <a
                href={activity.evidence_url}
                target="_blank"
                rel="noopener noreferrer"
                title="Ver evidencia"
                aria-label="Ver evidencia"
                className="inline-flex items-center gap-1 py-1 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <ExternalLinkIcon className="w-3.5 h-3.5" />
                Ver
              </a>
              {!isPlanExpired && (confirmingDelete ? (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-500">¿Eliminar evidencia?</span>
                  <button
                    onClick={() => { setConfirmingDelete(false); onDeleteEvidence?.(activity.id); }}
                    className="py-1 px-1 font-semibold text-red-600 hover:text-red-700 transition-colors"
                  >
                    Sí
                  </button>
                  <button
                    onClick={() => setConfirmingDelete(false)}
                    className="py-1 px-1 font-medium text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    No
                  </button>
                </>
              ) : (
                <>
                  <span className="text-slate-300">·</span>
                  <button
                    onClick={() => onEdit?.(activity)}
                    title="Editar evidencia"
                    aria-label="Editar evidencia"
                    className="inline-flex items-center gap-1 py-1 font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    onClick={() => setConfirmingDelete(true)}
                    title="Eliminar evidencia"
                    aria-label="Eliminar evidencia"
                    className="inline-flex items-center gap-1 py-1 font-medium text-red-600 hover:text-red-700 transition-colors"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                    Eliminar
                  </button>
                </>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <span className="text-xs text-slate-400 sm:flex-1">Para completar esta actividad, sube un archivo de evidencia</span>
          <button
            onClick={() => onComplete(activity)}
            disabled={isPlanExpired}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-medium bg-[#1e3a8a] hover:bg-[#162d6e] text-white px-4 py-2.5 sm:py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#1e3a8a]"
          >
            <UploadIcon className="w-3 h-3" />
            Subir evidencia
          </button>
        </div>
      )}
    </div>
  </div>
  );
};

const EmployeePlanDetail: React.FC<EmployeePlanDetailProps> = ({ plan, employee, onBack, onUpdatePlan }) => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const [activityToComplete, setActivityToComplete] = useState<UserActivity | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [evidenceObservations, setEvidenceObservations] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<UserActivity | null>(null);
  const [editingObservations, setEditingObservations] = useState('');
  const [editingFile, setEditingFile] = useState<File | null>(null);

  const fetchActivities = useCallback(() => {
    setLoading(true);
    setError(null);
    userService.getActivities(employee.id, plan.id)
      .then(data => setActivities(data))
      .catch(err => setError(err instanceof Error ? err.message : 'Error al cargar las actividades.'))
      .finally(() => setLoading(false));
  }, [employee.id, plan.id]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  //useDataSync(['UPDATE_ACTIVITIES', 'UPDATE_COMPLETIONS'], fetchActivities);

  const metrics = useMemo(() => {
    const completed = activities.filter(a => a.completed).length;
    const pending = activities.filter(a => !a.completed).length;
    const total = activities.length;
    return { completed, pending, total };
  }, [activities]);

  const progress = useMemo(() => {
    if (metrics.total === 0) return 0;
    return Math.round((metrics.completed / metrics.total) * 100);
  }, [metrics]);

  const isPlanExpired = useMemo(() => {
    const [year, month, day] = plan.expiration_date.split('-').map(Number);
    const expiry = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expiry < today;
  }, [plan.expiration_date]);


  const closeDrawer = () => {
    setActivityToComplete(null);
    setSelectedFile(null);
    setEvidenceObservations('');
    setActivityToEdit(null);
    setEditingObservations('');
    setEditingFile(null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !activityToComplete) return;
    setIsUploading(true);
    try {
      const completion = await activityService.complete(
        activityToComplete.id,
        employee.id,
        selectedFile,
        evidenceObservations.trim() || undefined
      );
      const updatedActivities = activities.map(a =>
        a.id === activityToComplete.id ? { ...a, ...completion } : a
      );
      setActivities(updatedActivities);
      const total_completed = updatedActivities.filter(a => a.completed).length;
      const completion_percentage = plan.total_activities > 0
        ? Math.round((total_completed / plan.total_activities) * 100)
        : 0;
      onUpdatePlan(plan.id, { total_completed, completion_percentage });
      addToast('Actividad completada con éxito.', 'success');
      closeDrawer();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Error al completar la actividad.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const startEdit = (activity: UserActivity) => {
    setActivityToEdit(activity);
    setEditingObservations(activity.observations ?? '');
    setEditingFile(null);
  };

  const saveEdit = async () => {
    if (!activityToEdit) return;
    const observations = editingObservations.trim();
    if (!editingFile && observations === (activityToEdit.observations ?? '').trim()) {
      closeDrawer();
      return;
    }
    setIsUploading(true);
    try {
      const completion = await activityService.updateMyCompletion(
        activityToEdit.id,
        observations,
        editingFile ?? undefined
      );
      setActivities(activities.map(a =>
        a.id === activityToEdit.id ? { ...a, ...completion } : a
      ));
      addToast('Actividad actualizada con éxito.', 'success');
      closeDrawer();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Error al actualizar la actividad.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteMyEvidence = async (activityId: number) => {
    try {
      await activityService.deleteMyCompletion(activityId);
      // Update local state - mark activity as pending (no evidence) and remove observations
      const updatedActivities = activities.map(a =>
        a.id === activityId ? { ...a, completed: false, evidence_url: null, observations: null } : a
      );
      setActivities(updatedActivities);
      addToast('Evidencia eliminada con éxito.', 'success');
      closeDrawer();
      // Refresh plan progress
      const updatedActivitiesFilter = updatedActivities.filter(a => a.completed).length;
      const completion_percentage = plan.total_activities > 0
        ? Math.round((updatedActivitiesFilter / plan.total_activities) * 100)
        : 0;
      onUpdatePlan(plan.id, { total_completed: updatedActivitiesFilter, completion_percentage });
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Error al eliminar la evidencia.', 'error');
    }
  };

  const planYear = Number(plan.expiration_date.split('-')[0]);

  const [, month, day] = plan.expiration_date.split('-').map(Number);
  const deadlineStr = formatDate(new Date(planYear, month - 1, day));

  if (loading) {
    return (
      <div className="flex justify-center p-8 bg-white rounded-xl shadow">
        <Spinner className="h-6 w-6 text-[#1e3a8a]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8 bg-white rounded-xl shadow">
        <p>{error}</p>
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

        <div className="bg-white border border-slate-200 rounded-xl p-4 lg:p-7">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
            <div>
              <h3 className="text-lg lg:text-2xl font-semibold text-[#1e3a8a]">{plan.title}</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                {MONTH_NAMES[plan.month] || `Mes ${plan.month}`} • Fecha límite: {deadlineStr}
              </p>
            </div>
            <div className="grid grid-cols-2 lg:flex gap-2 lg:gap-3 w-full lg:w-auto">
              <div className="bg-emerald-50 rounded-lg px-2 lg:px-4 py-2 text-center">
                <div className="text-xl lg:text-2xl font-bold text-emerald-600">{metrics.completed}</div>
                <div className="text-xs text-emerald-600">Completadas</div>
              </div>
              <div className="bg-amber-50 rounded-lg px-2 lg:px-4 py-2 text-center">
                <div className="text-xl lg:text-2xl font-bold text-amber-500">{metrics.pending}</div>
                <div className="text-xs text-amber-500">Pendientes</div>
              </div>
              <div className="col-span-2 lg:col-span-1 bg-slate-100 rounded-lg px-2 lg:px-4 py-2 text-center">
                <div className="text-xl lg:text-2xl font-bold text-slate-500">{metrics.total}</div>
                <div className="text-xs text-slate-500">Total</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl px-7 py-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-600 font-medium whitespace-nowrap">Progreso general</span>
            <div className="flex-1 mx-4">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProgressBarColor(progress)} rounded-full transition-all duration-300`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <span className={`font-semibold whitespace-nowrap ${getTextColor(progress)}`}>
              {progress}%
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Actividades</h4>
          <div className="space-y-4">
            {activities.length > 0 ? activities.map(activity => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                onComplete={a => { setActivityToComplete(a); }}
                isPlanExpired={isPlanExpired}
                onEdit={startEdit}
                onDeleteEvidence={deleteMyEvidence}
              />
            )) : (
              <div className="text-center text-slate-500 p-8 bg-white border border-slate-200 rounded-xl">
                <p>Este plan no tiene actividades asignadas.</p>
              </div>
            )}
          </div>
        </div>      
      </div>
      <Drawer
        isOpen={activityToComplete !== null}
        onClose={closeDrawer}
        title={`Completar actividad — ${activityToComplete?.title ?? ''}`}
      >
        <UploadEvidence
          description={activityToComplete?.description ?? ''}
          selectedFile={selectedFile}
          observations={evidenceObservations}
          isUploading={isUploading}
          onFileChange={setSelectedFile}
          onObservationsChange={setEvidenceObservations}
          onCancel={closeDrawer}
          onUpload={handleUpload}
        />
      </Drawer>
      <Drawer
        isOpen={activityToEdit !== null}
        onClose={closeDrawer}
        title={`Editar actividad — ${activityToEdit?.title ?? ''}`}
      >
        <UploadEvidence
          description={activityToEdit?.description ?? ''}
          selectedFile={editingFile}
          observations={editingObservations}
          isUploading={isUploading}
          onFileChange={setEditingFile}
          onObservationsChange={setEditingObservations}
          onCancel={closeDrawer}
          onUpload={saveEdit}
          submitLabel="Guardar cambios"
          submittingLabel="Guardando..."
          fileRequired={false}
          currentEvidenceUrl={activityToEdit?.evidence_url}
        />
      </Drawer>
    </>
  );
};
export default EmployeePlanDetail;