
import React, { useMemo } from 'react';
import { Plan, ActivityStatus } from '../types';
import ProgressBar from './ProgressBar';

interface WorkerProgressProps {
  plans: Plan[];
}

const WorkerProgress: React.FC<WorkerProgressProps> = ({ plans }) => {
  const progressData = useMemo(() => {
    const allActivities = plans.flatMap(p => p.activities);
    const allCompletions = allActivities.flatMap(a => a.completions);
    
    const totalCompleted = allCompletions.filter(c => c.status === ActivityStatus.COMPLETED).length;
    const totalOverall = allCompletions.length;
    const globalProgress = totalOverall > 0 ? (totalCompleted / totalOverall) * 100 : 0;

    return { globalProgress, totalCompleted, totalOverall };
  }, [plans]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div>
        <h3 className="text-lg font-semibold text-dark-gray">Progreso Global</h3>
        <p className="text-sm text-gray-500 mb-2">
          {progressData.totalCompleted} de {progressData.totalOverall} actividades completadas.
        </p>
        <ProgressBar value={progressData.globalProgress} />
      </div>
    </div>
  );
};

export default WorkerProgress;
