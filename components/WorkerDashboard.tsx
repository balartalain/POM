
import React, { useState, useMemo } from 'react';
import { User, Plan, ActivityStatus, Role } from '../types';
import { INITIAL_PLANS } from '../data/mockData';
import PlanCard from './PlanCard';
import WorkerPlanDetail from './WorkerPlanDetail';

interface WorkerDashboardProps {
  worker: User;
}

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const YEARS = Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i);

const WorkerDashboard: React.FC<WorkerDashboardProps> = ({ worker }) => {
  const [plans, setPlans] = useState<Plan[]>(INITIAL_PLANS);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const filteredPlans = useMemo(() => {
    return plans
      .filter(plan => plan.year === selectedYear && plan.activities.some(act => act.completions.some(c => c.workerId === worker.id)))
      .sort((a, b) => a.monthIndex - b.monthIndex);
  }, [plans, selectedYear, worker.id]);
  
  const plansByMonth = useMemo(() => {
    return filteredPlans.reduce((acc, plan) => {
      const monthName = MONTHS[plan.monthIndex];
      if (!acc[monthName]) {
        acc[monthName] = [];
      }
      acc[monthName].push(plan);
      return acc;
    }, {} as Record<string, Plan[]>);
  }, [filteredPlans]);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
  };

  const handleBackToDashboard = () => {
    setSelectedPlan(null);
  };

  const handleCompleteActivity = (planId: number, activityId: number, fileName: string) => {
    const updatePlansState = (prevPlans: Plan[]) => {
        return prevPlans.map(plan => {
            if (plan.id === planId) {
                const updatedActivities = plan.activities.map(activity => {
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
                });
                return { ...plan, activities: updatedActivities };
            }
            return plan;
        });
    };
    
    setPlans(updatePlansState);

    if(selectedPlan && selectedPlan.id === planId) {
        setSelectedPlan(prevPlan => {
            if (!prevPlan) return null;
            const updatedPlan = updatePlansState([prevPlan])[0];
            return updatedPlan;
        });
    }
  };

  if (selectedPlan) {
    return (
      <WorkerPlanDetail 
        plan={selectedPlan}
        worker={worker}
        onBack={handleBackToDashboard}
        onCompleteActivity={handleCompleteActivity}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-dark-gray">Mis Planes del Año {selectedYear}</h2>
        <div className="flex items-center gap-2">
            <label htmlFor="year-select" className="text-sm font-medium text-dark-gray">Año:</label>
            <select id="year-select" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary">
                {YEARS.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
        </div>
      </div>

      {filteredPlans.length > 0 ? (
        <div className="space-y-8">
            {Object.entries(plansByMonth).map(([month, monthPlans]) => (
                <div key={month}>
                    <h3 className="text-xl font-semibold text-dark-gray mb-3 pb-2 border-b">{month}</h3>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {monthPlans.map(plan => (
                            <PlanCard 
                                key={plan.id} 
                                plan={plan}
                                userRole={worker.role}
                                userId={worker.id}
                                onClick={() => handleSelectPlan(plan)}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
      ) : (
        <div className="text-center text-dark-gray p-8 bg-white rounded-lg shadow">
          <p>No se encontraron planes asignados para el año {selectedYear}.</p>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;
