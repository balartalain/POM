
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
    return plans
      .map(plan => ({
        ...plan,
        activities: plan.activities.filter(act => act.workerId === worker.id),
      }))
      .filter(plan => plan.activities.length > 0);
  }, [plans, worker.id]);

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
                return { ...activity, status: ActivityStatus.COMPLETED, evidenceFile: fileName };
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
      <h2 className="text-2xl font-bold text-dark-gray">My Assigned Plans</h2>
      {workerPlans.length > 0 ? (
        workerPlans.map(plan => (
          <div key={plan.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div onClick={() => handleTogglePlan(plan.id)} className="cursor-pointer">
              <PlanCard plan={plan} userRole={worker.role} />
            </div>
            {expandedPlanId === plan.id && (
              <div className="p-4 sm:p-6 border-t border-gray-200">
                <h4 className="text-md font-semibold text-dark-gray mb-3">My Activities</h4>
                <ul className="space-y-3">
                  {plan.activities.map(activity => (
                    <ActivityItem
                      key={activity.id}
                      activity={activity}
                      planDeadline={plan.deadline}
                      onComplete={(fileName) => handleCompleteActivity(plan.id, activity.id, fileName)}
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))
      ) : (
        <p className="text-center text-dark-gray p-6 bg-white rounded-lg shadow">No plans assigned to you yet.</p>
      )}
    </div>
  );
};

export default WorkerDashboard;
