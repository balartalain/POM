
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ReactTabulator, ColumnDefinition } from 'react-tabulator';
import 'react-tabulator/lib/styles.css';
import 'react-tabulator/lib/css/tabulator_bootstrap3.min.css';
import { Plan, User } from '../types';
import { ArrowLeftIcon, UploadIcon } from './Icons';
import { userService, UserActivity } from '../services/UserService';
import Drawer from './Drawer';
import Spinner from './shared/Spinner';

const MONTH_NAMES: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
  5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
  9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

const statusFormatter = (cell: any) => {
  const completed: boolean = cell.getValue();
  return completed
    ? `<span style="font-size:0.7rem;font-weight:600;color:#15803d;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:9999px;padding:2px 8px">Completada</span>`
    : `<span style="font-size:0.7rem;font-weight:600;color:#a16207;background:#fefce8;border:1px solid #fef08a;border-radius:9999px;padding:2px 8px">Pendiente</span>`;
};

const dateFormatter = (cell: any) => {
  const val: string | null = cell.getValue();
  if (!val) return '<span style="color:#d1d5db">—</span>';
  return new Date(val).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
};

const evidenceFormatter = (cell: any) => {
  const url: string | null = cell.getValue();
  if (url) {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#15803d;font-size:0.75rem;font-weight:500;text-decoration:underline">Ver evidencia</a>`;
  }
  return `<button data-action="upload" style="padding:3px 10px;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;border-radius:6px;font-size:0.75rem;cursor:pointer;white-space:nowrap">Subir evidencia</button>`;
};

interface EmployeePlanDetailProps {
  plan: Plan;
  employee: User;
  onBack: () => void;
}

const EmployeePlanDetail: React.FC<EmployeePlanDetailProps> = ({ plan, employee, onBack }) => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activityToUpload, setActivityToUpload] = useState<UserActivity | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const planYear = Number(plan.expiration_date.split('-')[0]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    userService.getUserActivities(employee.id, planYear)
      .then(data => { if (!cancelled) setActivities(data.filter(a => a.planId === plan.id)); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar las actividades.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [employee.id, plan.id, planYear]);

  const closeDrawer = () => {
    setActivityToUpload(null);
    setSelectedFile(null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !activityToUpload) return;
    setIsUploading(true);
    try {
      // TODO: conectar con endpoint de subida de evidencia
      await new Promise(r => setTimeout(r, 1000));
      closeDrawer();
    } finally {
      setIsUploading(false);
    }
  };

  const columns: ColumnDefinition[] = useMemo(() => [
    { title: 'Actividad',        field: 'title',       widthGrow: 2, headerSort: true },
    { title: 'Descripción',      field: 'description', widthGrow: 3, headerSort: false },
    { title: 'Estado',           field: 'completed',   widthGrow: 1, headerSort: true, formatter: statusFormatter, hozAlign: 'center' as const },
    { title: 'Fecha completada', field: 'completedAt', widthGrow: 1, headerSort: true, formatter: dateFormatter },
    {
      title: 'Evidencia',
      field: 'evidenceUrl',
      widthGrow: 1,
      headerSort: false,
      formatter: evidenceFormatter,
      cellClick: (_e: any, cell: any) => {
        const target = _e.target as HTMLElement;
        if (target.dataset.action === 'upload') {
          setActivityToUpload(cell.getData() as UserActivity);
        }
      },
    },
  ], []);

  const [, month, day] = plan.expiration_date.split('-').map(Number);
  const deadlineStr = new Date(planYear, month - 1, day).toLocaleDateString('es-ES');

  return (
    <>
      <div className="space-y-6">
        <div>
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline mb-4">
            <ArrowLeftIcon className="w-5 h-5" />
            Volver a Mis Planes
          </button>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-primary">{plan.title}</h1>
            <p className="text-dark-gray mt-1">
              {MONTH_NAMES[plan.month] ?? plan.month} | Fecha Límite: {deadlineStr}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="text-2xl font-bold text-dark-gray">Actividades del Plan</h2>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner className="h-6 w-6 text-primary" />
              </div>
            ) : error ? (
              <p className="text-center text-red-600 py-8">{error}</p>
            ) : activities.length ? (
              <ReactTabulator
                data={activities}
                columns={columns}
                layout="fitColumns"
                options={{ movableColumns: true }}
              />
            ) : (
              <p className="text-center text-dark-gray py-4">Este plan no tiene actividades asignadas.</p>
            )}
          </div>
        </div>
      </div>

      <Drawer
        isOpen={activityToUpload !== null}
        onClose={closeDrawer}
        title={`Subir evidencia — ${activityToUpload?.title ?? ''}`}
      >
        <div className="space-y-6">
          <p className="text-sm text-gray-500">{activityToUpload?.description}</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Archivo de evidencia</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-primary hover:bg-blue-50 transition-colors"
            >
              <UploadIcon className="w-8 h-8 text-gray-400" />
              {selectedFile ? (
                <div className="text-center">
                  <p className="text-sm font-medium text-primary">{selectedFile.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
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
              onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border text-sm">
              <span className="text-gray-700 truncate">{selectedFile.name}</span>
              <button
                onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="ml-3 text-gray-400 hover:text-red-500 transition-colors shrink-0"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t pt-4">
          <button onClick={closeDrawer} disabled={isUploading} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm disabled:opacity-70">
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark text-sm font-semibold disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading && <Spinner />}
            {isUploading ? 'Subiendo...' : 'Subir evidencia'}
          </button>
        </div>
      </Drawer>
    </>
  );
};

export default EmployeePlanDetail;
