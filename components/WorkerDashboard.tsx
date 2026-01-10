
import React, { useState, useMemo } from 'react';
import { User, Plan, ActivityStatus } from '../types';
import { INITIAL_PLANS } from '../data/mockData';
import PlanCard from './PlanCard';
import ActivityItem from './ActivityItem';

interface WorkerDashboardProps {
  worker: User;
}

const WorkerDashboard: React.FC<WorkerDashboardProps> = ({ worker }) => {
  const [plans, setPlans] = useState<Plan[]>(INITIAL_PLANS);
  const [expandedPlanId, setExpandedPlanId] = useState<number | null>(null);
  
  const workerPlans = useMemo(() => {
    return plans;
  }, [plans]);

  const handleTogglePlan = (planId: number) => {
    setExpandedPlanId(prevId => (prevId === planId ? null : planId));
  };
  
  const handleCompleteActivity = (planId: number, activityId: number, fileName: string) => {
    setPlans(prevPlans => {
      return prevPlans.map(plan => {
        if (plan.id === planId) {
          return {
            ...plan,
            activities: plan.activities.map(activity => {
              if (activity.id === activityId) {
                const updatedCompletions = activity.completions.map(comp => {
                    if (comp.workerId === worker.id) {
                        return { ...comp, status: ActivityStatus.COMPLETED, evidenceFile: fileName };
                    }
                    return comp;
                });
                return { ...activity, completions: updatedCompletions };
              }
              return activity;
            }),
          };
        }
        return plan;
      });
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-dark-gray">Mis Planes Asignados</h2>
      {workerPlans.length > 0 ? (
        workerPlans.map(plan => (
          <div key={plan.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <PlanCard 
              plan={plan} 
              userRole={worker.role} 
              onClick={() => handleTogglePlan(plan.id)}
            />
            {expandedPlanId === plan.id && (
              <div className="p-4 sm:p-6 border-t border-gray-200">
                <h4 className="text-md font-semibold text-dark-gray mb-3">Mis Actividades</h4>
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
                        onComplete={(fileName) => handleCompleteActivity(plan.id, activity.id, fileName)}
                        />
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        ))
      ) : (
        <p className="text-center text-dark-gray p-6 bg-white rounded-lg shadow">Aún no tienes planes asignados.</p>
      )}
    </div>
  );
};

export default WorkerDashboard;
