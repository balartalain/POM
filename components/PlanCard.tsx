
import React, { useMemo } from 'react';
import { Plan, Role, ActivityStatus } from '../types';
import ProgressBar from './ProgressBar';
import { CalendarIcon, PencilIcon, TrashIcon } from './Icons';

interface PlanCardProps {
  plan: Plan;
  userRole: Role;
  userId?: number;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, userRole, userId, onClick, onEdit, onDelete }) => {
  
  const progress = useMemo(() => {
    if (userRole === Role.WORKER && userId) {
        const workerCompletions = plan.activities
            .map(a => a.completions.find(c => c.workerId === userId))
            .filter(c => c !== undefined);

        if (workerCompletions.length === 0) return 0;
        
        const completedCount = workerCompletions.filter(c => c?.status === ActivityStatus.COMPLETED).length;
        return (completedCount / workerCompletions.length) * 100;
    }

    // Supervisor view (or fallback)
    const allCompletions = plan.activities.flatMap(a => a.completions);
    if (allCompletions.length === 0) return 0;

    const completedCount = allCompletions.filter(c => c.status === ActivityStatus.COMPLETED).length;
    return (completedCount / allCompletions.length) * 100;
  }, [plan.activities, userRole, userId]);

  const deadline = new Date(plan.deadline);
  const isPastDeadline = new Date() > deadline;

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete();
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`p-4 sm:p-6 rounded-lg shadow-md transition-all duration-300 relative ${isPastDeadline ? 'bg-red-50' : 'bg-white'} ${onClick ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1' : ''}`}
      role={onClick ? 'button' : 'figure'}
      tabIndex={onClick ? 0 : -1}
      onKeyDown={e => { if (e.key === 'Enter' && onClick) onClick() }}
      aria-label={`Ver detalles del plan: ${plan.name}`}
    >
      {userRole === Role.SUPERVISOR && onEdit && onDelete && (
        <div className="absolute top-3 right-3 flex items-center">
          <button onClick={handleEditClick} className="p-1.5 text-gray-400 hover:text-blue-700 rounded-full hover:bg-blue-100 transition-all duration-200" aria-label={`Editar plan ${plan.name}`}>
            <PencilIcon className="w-5 h-5" />
          </button>
          <button onClick={handleDeleteClick} className="p-1.5 text-gray-400 hover:text-red-700 rounded-full hover:bg-red-100 transition-all duration-200" aria-label={`Eliminar plan ${plan.name}`}>
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex flex-col h-full">
        <h3 className="text-lg font-bold text-primary truncate pr-16">{plan.name}</h3>
        <p className="text-sm text-dark-gray mb-3 capitalize">{plan.month}</p>
        
        <div className="flex items-center gap-2 text-sm text-dark-gray mb-4">
          <CalendarIcon className={`w-4 h-4 ${isPastDeadline ? 'text-red-600' : ''}`} />
          <span className={`${isPastDeadline ? 'text-red-700 line-through' : ''}`}>
            Fecha Límite: {deadline.toLocaleDateString('es-ES')}
          </span>
        </div>

        <div className="mt-auto">
            <div className="flex justify-between items-center text-sm text-dark-gray mb-1">
                <span>Progreso {userRole === Role.WORKER ? 'Personal' : 'General'}</span>
                <span>{Math.round(progress)}%</span>
            </div>
            <ProgressBar value={progress} />
        </div>
      </div>
    </div>
  );
};

export default PlanCard;
