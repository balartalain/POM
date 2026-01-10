
import React, { useState } from 'react';
import { User, Plan, ActivityCompletion, ActivityStatus } from '../types';
import { ArrowLeftIcon, CheckCircleIcon, ClockIcon, DocumentCheckIcon } from './Icons';
import ProgressBar from './ProgressBar';

interface WorkerDetailViewProps {
  worker: User;
  plans: Plan[];
  onBack: () => void;
}

const WorkerDetailView: React.FC<WorkerDetailViewProps> = ({ worker, plans, onBack }) => {
    const [expandedPlanIds, setExpandedPlanIds] = useState<Set<number>>(() => {
        // Automatically expand the first plan by default
        const initialId = plans.length > 0 ? new Set([plans[0].id]) : new Set<number>();
        return initialId;
    });

    const togglePlanExpansion = (planId: number) => {
        setExpandedPlanIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(planId)) {
                newSet.delete(planId);
            } else {
                newSet.add(planId);
            }
            return newSet;
        });
    };

    const renderStatusBadge = (completion: ActivityCompletion, planDeadline: string) => {
        if (completion.status === ActivityStatus.COMPLETED) {
            return (
                <div className="flex flex-col items-end text-right">
                    <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full w-fit">
                        <CheckCircleIcon className="w-4 h-4"/> Completado
                    </span>
                    {completion.evidenceFile && (
                        <a
                            href={`data:text/html, <html><body style="font-family: sans-serif; padding: 2rem;"><h1>Viendo: ${completion.evidenceFile}</h1><p>Este es un marcador de posición para el visor de documentos real. En una aplicación real, esto abriría el archivo PDF.</p></body></html>`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-blue-600 hover:underline truncate mt-1 group flex items-center w-fit" 
                            title={`Ver ${completion.evidenceFile}`}
                        >
                            <DocumentCheckIcon className="w-3 h-3 inline mr-1 text-gray-500 group-hover:text-blue-600"/>
                            {completion.evidenceFile}
                        </a>
                    )}
                </div>
            );
        }
        if (new Date() > new Date(planDeadline)) {
            return (
                <span className="flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full w-fit">
                    <ClockIcon className="w-4 h-4"/> Vencido
                </span>
            );
        }
        return (
            <span className="flex items-center gap-1 text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full w-fit">
                <ClockIcon className="w-4 h-4"/> Pendiente
            </span>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline mb-4">
                    <ArrowLeftIcon className="w-5 h-5" />
                    Volver al Panel
                </button>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h1 className="text-2xl sm:text-3xl font-bold text-primary">Progreso Detallado de {worker.name}</h1>
                    <p className="text-dark-gray mt-1">Revisión de todas las actividades asignadas en todos los planes.</p>
                </div>
            </div>
            
            <div className="space-y-4">
                {plans.map(plan => {
                    const isExpanded = expandedPlanIds.has(plan.id);
                    
                    const workerCompletionsInPlan = plan.activities
                        .map(activity => activity.completions.find(c => c.workerId === worker.id))
                        .filter((c): c is ActivityCompletion => c !== undefined);

                    const totalActivitiesForWorker = workerCompletionsInPlan.length;
                    const completedActivitiesForWorker = workerCompletionsInPlan.filter(c => c.status === ActivityStatus.COMPLETED).length;
                    const progress = totalActivitiesForWorker > 0 ? (completedActivitiesForWorker / totalActivitiesForWorker) * 100 : 0;

                    return (
                        <div key={plan.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                            <button 
                                className="w-full p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors"
                                onClick={() => togglePlanExpansion(plan.id)}
                                aria-expanded={isExpanded}
                                aria-controls={`plan-activities-${plan.id}`}
                            >
                                <div className="text-left">
                                    <h3 className="font-semibold text-dark-gray">{plan.name}</h3>
                                    <p className="text-sm text-gray-500 capitalize">{plan.month}</p>
                                </div>
                                
                                <div className="flex items-center gap-3 sm:gap-6">
                                    {totalActivitiesForWorker > 0 && (
                                        <div className="w-32 sm:w-48 hidden sm:block">
                                            <div className="flex justify-between text-xs text-dark-gray mb-1">
                                                <span>Progreso</span>
                                                <span>{`${completedActivitiesForWorker}/${totalActivitiesForWorker}`}</span>
                                            </div>
                                            <ProgressBar value={progress} />
                                        </div>
                                    )}
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </div>
                            </button>
                            
                            {isExpanded && (
                                <div id={`plan-activities-${plan.id}`} className="p-4 sm:p-6 border-t border-gray-200">
                                    <ul className="space-y-3">
                                        {plan.activities.map(activity => {
                                            const completion = activity.completions.find(c => c.workerId === worker.id);
                                            return (
                                                <li key={activity.id} className="flex items-center justify-between p-3 bg-light-gray rounded-lg border">
                                                    <span className="font-medium text-dark-gray flex-1 pr-4">{activity.name}</span>
                                                    {completion ? renderStatusBadge(completion, plan.deadline) : <span className="text-gray-400 text-sm">N/A</span>}
                                                </li>
                                            );
                                        })}
                                        {plan.activities.length === 0 && <p className="text-center text-dark-gray py-4">No hay actividades en este plan.</p>}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default WorkerDetailView;
