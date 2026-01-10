
import React, { useMemo } from 'react';
import { Plan, Role, ActivityStatus } from '../types';
import ProgressBar from './ProgressBar';
import { CalendarIcon } from './Icons';

interface PlanCardProps {
  plan: Plan;
  userRole: Role;
  onClick?: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, userRole, onClick }) => {
  
  const progress = useMemo(() => {
    const allCompletions = plan.activities.flatMap(a => a.completions);
    if (allCompletions.length === 0) return 0;

    const completedCount = allCompletions.filter(c => c.status === ActivityStatus.COMPLETED).length;
    return (completedCount / allCompletions.length) * 100;
  }, [plan.activities]);

  const deadline = new Date(plan.deadline);
  const isPastDeadline = new Date() > deadline;

  return (
    <div 
      onClick={onClick}
      className={`p-4 sm:p-6 rounded-lg shadow-md transition-all duration-300 ${userRole === Role.WORKER ? 'bg-secondary' : 'bg-white'} ${onClick ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1' : ''}`}
      role={onClick ? 'button' : 'figure'}
      tabIndex={onClick ? 0 : -1}
      onKeyDown={e => { if (e.key === 'Enter' && onClick) onClick() }}
      aria-label={`Ver detalles del plan: ${plan.name}`}
    >
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-bold text-primary truncate">{plan.name}</h3>
        <p className="text-sm text-dark-gray mb-3 capitalize">{plan.month}</p>
        
        <div className="flex items-center gap-2 text-sm text-dark-gray mb-4">
          <CalendarIcon className="w-4 h-4" />
          <span>Fecha Límite: {deadline.toLocaleDateString('es-ES')}</span>
          {isPastDeadline && <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Vencido</span>}
        </div>

        <div className="mt-auto">
            <div className="flex justify-between items-center text-sm text-dark-gray mb-1">
                <span>Progreso</span>
                <span>{Math.round(progress)}%</span>
            </div>
            <ProgressBar value={progress} />
        </div>
      </div>
    </div>
  );
};

export default PlanCard;
