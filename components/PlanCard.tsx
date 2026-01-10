
import React, { useMemo } from 'react';
import { Plan, Role, ActivityStatus } from '../types';
import ProgressBar from './ProgressBar';
import { CalendarIcon } from './Icons';

interface PlanCardProps {
  plan: Plan;
  userRole: Role;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, userRole }) => {
  
  const progress = useMemo(() => {
    const totalActivities = plan.activities.length;
    if (totalActivities === 0) return 0;
    const completedActivities = plan.activities.filter(a => a.status === ActivityStatus.COMPLETED).length;
    return (completedActivities / totalActivities) * 100;
  }, [plan.activities]);

  const deadline = new Date(plan.deadline);
  const isPastDeadline = new Date() > deadline;

  return (
    <div className={`p-4 sm:p-6 rounded-lg shadow-md transition-all duration-300 ${userRole === Role.WORKER ? 'bg-secondary hover:shadow-lg' : 'bg-white'}`}>
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-bold text-primary truncate">{plan.name}</h3>
        <p className="text-sm text-dark-gray mb-3">{plan.month}</p>
        
        <div className="flex items-center gap-2 text-sm text-dark-gray mb-4">
          <CalendarIcon className="w-4 h-4" />
          <span>Deadline: {deadline.toLocaleDateString()}</span>
          {isPastDeadline && <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Overdue</span>}
        </div>

        <div className="mt-auto">
            <div className="flex justify-between items-center text-sm text-dark-gray mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
            </div>
            <ProgressBar value={progress} />
        </div>
      </div>
    </div>
  );
};

export default PlanCard;
