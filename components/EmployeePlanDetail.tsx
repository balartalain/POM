
import React, { useState, useEffect } from 'react';
import { Plan, User, Activity } from '../types';
import { ArrowLeftIcon } from './Icons';
import { activityService } from '../services/ActivityService';
import Spinner from './shared/Spinner';

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

const EmployeePlanDetail: React.FC<EmployeePlanDetailProps> = ({ plan, onBack }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    activityService.getActivities(plan.id)
      .then(data => { if (!cancelled) setActivities(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [plan.id]);

  const [year, month, day] = plan.expiration_date.split('-').map(Number);
  const deadlineStr = new Date(year, month - 1, day).toLocaleDateString('es-ES');

  return (
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

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-dark-gray mb-4">Actividades del Plan</h2>
        {loading ? (
          <div className="flex justify-center py-8"><Spinner className="h-6 w-6 text-primary" /></div>
        ) : activities.length ? (
          <ul className="space-y-3">
            {activities.map(activity => (
              <li key={activity.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border">
                <div>
                  <p className="font-medium text-dark-gray">{activity.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{activity.description}</p>
                </div>
                <span className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-full px-2 py-0.5 whitespace-nowrap ml-4">
                  Pendiente
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-dark-gray py-4">Este plan no tiene actividades aún.</p>
        )}
      </div>
    </div>
  );
};

export default EmployeePlanDetail;
