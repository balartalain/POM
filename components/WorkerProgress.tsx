
import React, { useState, useMemo } from 'react';
import { Plan, User, ActivityStatus } from '../types';
import ProgressBar from './ProgressBar';
import { SearchIcon } from './Icons';

interface WorkerProgressProps {
  plans: Plan[];
  users: User[];
  onSelectWorker?: (worker: User) => void;
}

const WorkerProgress: React.FC<WorkerProgressProps> = ({ plans, users, onSelectWorker }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const progressData = useMemo(() => {
    const allActivities = plans.flatMap(p => p.activities);
    const allCompletions = allActivities.flatMap(a => a.completions);
    
    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const workerStats = filteredUsers.map(worker => {
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
  }, [plans, users, searchTerm]);

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
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
          <h3 className="text-lg font-semibold text-dark-gray">Progreso por Trabajador</h3>
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar trabajador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>
        </div>
        <div className="space-y-4">
          {progressData.workerStats.length > 0 ? (
            progressData.workerStats.map(({ worker, completed, total, progress }) => (
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
            ))
          ) : (
            <p className="text-center text-dark-gray py-4">No se encontraron trabajadores.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkerProgress;
