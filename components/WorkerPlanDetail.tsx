
import React from 'react';
import { Plan, User } from '../types';
import ActivityItem from './ActivityItem';
import { ArrowLeftIcon } from './Icons';

interface WorkerPlanDetailProps {
  plan: Plan;
  worker: User;
  onBack: () => void;
  onCompleteActivity: (planId: number, activityId: number, fileName: string) => void;
}

const WorkerPlanDetail: React.FC<WorkerPlanDetailProps> = ({ plan, worker, onBack, onCompleteActivity }) => {
  return (
    <div className="space-y-6">
      <div>
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline mb-4">
          <ArrowLeftIcon className="w-5 h-5" />
          Volver a Mis Planes
        </button>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-primary">{plan.name}</h1>
          <p className="text-dark-gray mt-1 capitalize">
            {plan.month} | Fecha Límite: {new Date(plan.deadline).toLocaleDateString('es-ES')}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-dark-gray mb-4">Mis Actividades Asignadas</h2>
        <ul className="space-y-3">
          {plan.activities.map(activity => {
            const myCompletion = activity.completions.find(c => c.workerId === worker.id);
            if (!myCompletion) return null;

            return (
              <ActivityItem
                key={`${activity.id}-${worker.id}`}
                activityName={activity.name}
                completion={myCompletion}
                planDeadline={plan.deadline}
                onComplete={(fileName) => onCompleteActivity(plan.id, activity.id, fileName)}
              />
            );
          })}
        </ul>
        {plan.activities.filter(a => a.completions.some(c => c.workerId === worker.id)).length === 0 && (
            <p className="text-center text-dark-gray py-4">No tienes actividades asignadas en este plan.</p>
        )}
      </div>
    </div>
  );
};

export default WorkerPlanDetail;
