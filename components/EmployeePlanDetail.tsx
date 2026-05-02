import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plan, User } from '../types';
import { ArrowLeftIcon, CheckCircleIcon, ClockIcon, LinkIcon, ExternalLinkIcon, UploadIcon } from './Icons';
import { userService, UserActivity } from '../services/UserService';
import { activityService } from '../services/ActivityService';
import Drawer from './Drawer';
import Spinner from './shared/Spinner';
import { useToast } from '../hooks/useToast';
import { formatDate } from '../utils/formatDate';

const MONTH_NAMES: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
  5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
  9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

interface EmployeePlanDetailProps {
  plan: Plan;
  employee: User;
  onBack: () => void;
}

interface UploadEvidenceProps {
  description: string;
  selectedFile: File | null;
  isUploading: boolean;
  onFileChange: (file: File | null) => void;
  onCancel: () => void;
  onUpload: () => void;
}

const UploadEvidence: React.FC<UploadEvidenceProps> = ({ description, selectedFile, isUploading, onFileChange, onCancel, onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <div className="space-y-6">
        <p className="text-sm text-gray-500">{description}</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Archivo de evidencia</label>
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
      </div>
      <div className="mt-8 flex justify-end gap-3 border-t pt-4">
        <button onClick={onCancel} disabled={isUploading} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm disabled:opacity-70">
          Cancelar
        </button>
        <button
          onClick={onUpload}
          disabled={!selectedFile || isUploading}
          className="px-4 py-2 bg-[#1e3a8a] text-white rounded-md hover:bg-[#162d6e] text-sm font-semibold disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isUploading && <Spinner />}
          {isUploading ? 'Subiendo...' : 'Subir evidencia'}
        </button>
      </div>
    </>
  );
};

interface ActivityItemProps {
  activity: UserActivity;
  onComplete: (activity: UserActivity) => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, onComplete }) => (
  <div
    className={`bg-white border border-slate-200 rounded-xl overflow-hidden ${
      activity.completed ? 'border-l-4 border-l-emerald-400' : 'border-l-4 border-l-amber-400'
    }`}
  >
    <div className="flex items-center gap-6 px-6 py-5">
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">{activity.title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{activity.description}</p>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        {activity.completed ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Completada
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-50 text-amber-500 px-3 py-1.5 rounded-full">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            Pendiente
          </span>
        )}
        {activity.completed && activity.evidenceUrl && (
          <a
            href={activity.evidenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Ver evidencia
          </a>
        )}
      </div>
    </div>
    <div className={`px-6 ${activity.completed ? 'py-2.5' : 'py-3'} bg-slate-50 border-t border-slate-100 flex items-center gap-2`}>
      {activity.completed ? (
        <div className="flex items-center gap-2">
          <svg className="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span className="text-xs text-slate-400">Completada el <span className="text-slate-500">{formatDate(activity.completedAt)}</span></span>
        </div>
      ) : (
        <div className="flex items-center gap-3 w-full">
          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
          </svg>
          <span className="text-xs text-slate-400 flex-1">Para completar esta actividad, pega el enlace de tu evidencia en Google Drive</span>
          <button
            onClick={() => onComplete(activity)}
            className="inline-flex items-center gap-2 text-xs font-medium bg-[#1e3a8a] hover:bg-[#162d6e] text-white px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
            Pegar enlace de evidencia
          </button>
        </div>
      )}
    </div>
  </div>
);

const EmployeePlanDetail: React.FC<EmployeePlanDetailProps> = ({ plan, employee, onBack }) => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const [activityToComplete, setActivityToComplete] = useState<UserActivity | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceObservations, setEvidenceObservations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUrlDrawer, setShowUrlDrawer] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    userService.getActivities(employee.id, plan.id)
      .then(data => { if (!cancelled) setActivities(data); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar las actividades.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [employee.id, plan.id]);

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


  const closeDrawer = () => {
    setActivityToComplete(null);
    setEvidenceUrl('');
    setEvidenceObservations('');
  };

  const handleUpload = async () => {
    if (!selectedFile || !activityToComplete) return;
    setIsUploading(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      closeDrawer();
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitEvidence = async () => {
    if (!activityToComplete || !evidenceUrl.trim()) return;
    setIsSubmitting(true);
    try {
      const completion = await activityService.complete(
        activityToComplete.id,
        employee.id,
        evidenceUrl.trim(),
        evidenceObservations.trim() || undefined
      );
      setActivities(prev => prev.map(a => 
        a.id === activityToComplete.id 
          ? { 
              ...a, 
              completed: true, 
              completedAt: completion.createdAt, 
              evidenceUrl: completion.evidenceUrl 
            }
          : a
      ));
      addToast('Actividad completada con éxito.', 'success');
      closeDrawer();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Error al completar la actividad.', 'error');
    } finally {
      setIsSubmitting(false);
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
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <span className="text-emerald-600 font-semibold whitespace-nowrap">{progress}%</span>
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
              />
            )) : (
              <div className="text-center text-slate-500 p-8 bg-white border border-slate-200 rounded-xl">
                <p>Este plan no tiene actividades asignadas.</p>
              </div>
            )}
          </div>
        </div>      
      </div>
      {/*}
      <Drawer
        isOpen={activityToUpload !== null}
        onClose={closeDrawer}
        title={`Subir evidencia — ${activityToUpload?.title ?? ''}`}
      >
        <UploadEvidence
          description={activityToUpload?.description ?? ''}
          selectedFile={selectedFile}
          isUploading={isUploading}
          onFileChange={setSelectedFile}
          onCancel={closeDrawer}
          onUpload={handleUpload}
        />
      </Drawer>
      */}
      <Drawer
        isOpen={activityToComplete !== null}
        onClose={closeDrawer}
        title={`Completar actividad — ${activityToComplete?.title ?? ''}`}
      >
        <div className="space-y-5">
          <p className="text-sm text-gray-500">{activityToComplete?.description}</p>

          <div>
            <label htmlFor="evidenceUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Enlace de evidencia *
            </label>
            <input
              type="url"
              id="evidenceUrl"
              value={evidenceUrl}
              onChange={e => setEvidenceUrl(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
              placeholder="https://drive.google.com/..."
            />
          </div>

          <div>
            <label htmlFor="evidenceObservations" className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones (opcional)
            </label>
            <textarea
              id="evidenceObservations"
              value={evidenceObservations}
              onChange={e => setEvidenceObservations(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
              placeholder="Agrega alguna observación sobre la evidencia..."
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t pt-4">
          <button onClick={closeDrawer} disabled={isSubmitting} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm disabled:opacity-70">
            Cancelar
          </button>
          <button
            onClick={handleSubmitEvidence}
            disabled={isSubmitting || !evidenceUrl.trim()}
            className="px-4 py-2 bg-[#1e3a8a] text-white rounded-md hover:bg-[#162d6e] text-sm font-semibold disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && <Spinner />}
            {isSubmitting ? 'Guardando...' : 'Completar actividad'}
          </button>
        </div>
      </Drawer>
    </>
  );
};

export default EmployeePlanDetail;