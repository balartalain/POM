
import React, { useMemo } from 'react';
import { Plan, User, ActivityStatus } from '../types';
import ProgressBar from './ProgressBar';

interface WorkerProgressProps {
  plans: Plan[];
  users: User[];
}

const WorkerProgress: React.FC<WorkerProgressProps> = ({ plans, users }) => {
  const progressData = useMemo(() => {
    const allActivities = plans.flatMap(p => p.activities);
    
    const workerStats = users.map(worker => {
      const workerActivities = allActivities.filter(a => a.workerId === worker.id);
      const completed = workerActivities.filter(a => a.status === ActivityStatus.COMPLETED).length;
      const total = workerActivities.length;
      const progress = total > 0 ? (completed / total) * 100 : 0;
      return { worker, completed, total, progress };
    });

    const totalCompleted = allActivities.filter(a => a.status === ActivityStatus.COMPLETED).length;
    const totalOverall = allActivities.length;
    const globalProgress = totalOverall > 0 ? (totalCompleted / totalOverall) * 100 : 0;

    return { workerStats, globalProgress, totalCompleted, totalOverall };
  }, [plans, users]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-dark-gray">Global Progress</h3>
        <p className="text-sm text-gray-500 mb-2">
          {progressData.totalCompleted} of {progressData.totalOverall} activities completed across all plans.
        </p>
        <ProgressBar value={progressData.globalProgress} />
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold text-dark-gray mb-4">Progress by Worker</h3>
        <div className="space-y-4">
          {progressData.workerStats.map(({ worker, completed, total, progress }) => (
            <div key={worker.id}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-dark-gray">{worker.name}</span>
                <span className="text-sm text-gray-500">{completed} / {total} tasks</span>
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
