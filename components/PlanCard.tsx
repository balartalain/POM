
import React from 'react';
import { Plan, Role } from '../types';
import ProgressBar from './ProgressBar';
import { CalendarIcon, PencilIcon, TrashIcon } from './Icons';

interface PlanCardProps {
  plan: Plan;
  userRole: Role;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, userRole, onClick, onEdit, onDelete }) => {
  const [year, month, day] = plan.expiration_date.split('-').map(Number);
  const deadline = new Date(year, month - 1, day, 23, 59, 59);
  const isPastDeadline = new Date() > deadline;
  const progress = plan.total_activities > 0
    ? (plan.total_completed / plan.total_activities) * 100
    : 0;

  const handleCardClick = () => {
    if (onClick) onClick();
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
      aria-label={`Ver detalles del plan: ${plan.title}`}
    >
      {userRole === Role.SUPERVISOR && onEdit && onDelete && (
        <div className="absolute top-3 right-3 flex items-center">
          <button onClick={handleEditClick} className="p-1.5 text-gray-400 hover:text-blue-700 rounded-full hover:bg-blue-100 transition-all duration-200" aria-label={`Editar plan ${plan.title}`}>
            <PencilIcon className="w-5 h-5" />
          </button>
          <button onClick={handleDeleteClick} className="p-1.5 text-gray-400 hover:text-red-700 rounded-full hover:bg-red-100 transition-all duration-200" aria-label={`Eliminar plan ${plan.title}`}>
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex flex-col h-full">
        <h3 className="text-lg font-bold text-primary truncate pr-16">{plan.title}</h3>

        <div className="flex items-center gap-2 text-sm text-dark-gray mb-4 mt-1">
          <CalendarIcon className={`w-4 h-4 ${isPastDeadline ? 'text-red-600' : ''}`} />
          <span className={`${isPastDeadline ? 'text-red-700 line-through' : ''}`}>
            Fecha Límite: {deadline.toLocaleDateString('es-ES')}
          </span>
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
