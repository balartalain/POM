
import React, { useMemo } from 'react';
import { Plan, User, ActivityStatus } from '../types';
import ProgressBar from './ProgressBar';

interface WorkerProgressProps {
  plans: Plan[];
  users: User[];
  onSelectWorker?: (worker: User) => void;
}

const WorkerProgress: React.FC<WorkerProgressProps> = ({ plans, users, onSelectWorker }) => {
  const progressData = useMemo(() => {
    const allActivities = plans.flatMap(p => p.activities);
    const allCompletions = allActivities.flatMap(a => a.completions);
    
    const workerStats = users.map(worker => {
      const workerCompletions = allCompletions.filter(c => c.workerId === worker.id);
      const completed = workerCompletions.filter(c => c.status === ActivityStatus.COMPLETED).length;
      const total = workerCompletions.length;
      const progress = total > 0 ? (completed / total) * 100 : 0;
      return { worker, completed, total, progress };
    });

    const totalCompleted = allCompletions.filter(c => c.status === ActivityStatus.COMPLETED).length;
    const totalOverall = allCompletions.length;
    const globalProgress = totalOverall > 0 ? (totalCompleted / totalOverall) * 100 : 0;

    return { workerStats, globalProgress, totalCompleted, totalOverall };
  }, [plans, users]);

  const canSelectWorker = !!onSelectWorker;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-dark-gray">Progreso Global</h3>
        <p className="text-sm text-gray-500 mb-2">
          {progressData.totalCompleted} de {progressData.totalOverall} actividades completadas.
        </p>
        <ProgressBar value={progressData.globalProgress} />
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold text-dark-gray mb-4">Progreso por Trabajador</h3>
        <div className="space-y-4">
          {progressData.workerStats.map(({ worker, completed, total, progress }) => (
            <div 
              key={worker.id} 
              onClick={canSelectWorker ? () => onSelectWorker(worker) : undefined}
              className={`${canSelectWorker ? 'cursor-pointer hover:bg-light-gray p-2 -m-2 rounded-lg transition-colors' : ''}`}
              role={canSelectWorker ? 'button' : undefined}
              tabIndex={canSelectWorker ? 0 : -1}
              onKeyDown={canSelectWorker ? (e) => e.key === 'Enter' && onSelectWorker(worker) : undefined}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-dark-gray">{worker.name}</span>
                <span className="text-sm text-gray-500">{completed} / {total} tareas</span>
              </div>
              <ProgressBar value={progress} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkerProgress;
