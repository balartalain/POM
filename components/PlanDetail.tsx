
import React, { useState, useMemo, useEffect } from 'react';
import { Plan, User, ActivityStatus, ActivityCompletion, Activity } from '../types';
import Modal from './Modal';
import WorkerProgress from './WorkerProgress';
import ProgressBar from './ProgressBar';
import { ArrowLeftIcon, PlusIcon, CheckCircleIcon, ClockIcon, DocumentCheckIcon, SearchIcon, ChevronDownIcon } from './Icons';

interface PlanDetailProps {
  plan: Plan;
  workers: User[];
  onBack: () => void;
  onAddActivities: (planId: number, newActivities: Array<{name: string}>) => void;
  onSelectWorker: (worker: User) => void;
}

const PlanDetail: React.FC<PlanDetailProps> = ({ plan, workers, onBack, onAddActivities, onSelectWorker }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newActivities, setNewActivities] = useState<Array<{name: string}>>([{ name: '' }]);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [workerSearchTerm, setWorkerSearchTerm] = useState('');
    const [activeView, setActiveView] = useState<'activities' | 'workers'>('activities');
    const [workerListSearchTerm, setWorkerListSearchTerm] = useState('');
    const [expandedWorkerId, setExpandedWorkerId] = useState<number | null>(null);


    useEffect(() => {
        // Reset to activity list view when plan changes
        setSelectedActivity(null);
        setActiveView('activities');
        setExpandedWorkerId(null);
    }, [plan.id]);
    
    const filteredWorkersForActivity = useMemo(() => {
        if (!selectedActivity) return [];
        return workers.filter(worker =>
            worker.name.toLowerCase().includes(workerSearchTerm.toLowerCase())
        );
    }, [workers, workerSearchTerm, selectedActivity]);

    // Memoized calculation for worker progress within THIS plan
    const workerPlanProgress = useMemo(() => {
        return workers.map(worker => {
            const workerCompletions = plan.activities
                .map(a => a.completions.find(c => c.workerId === worker.id))
                .filter((c): c is ActivityCompletion => c !== undefined);
            
            const total = workerCompletions.length;
            if (total === 0) {
                return { worker, completed: 0, total: 0, progress: 0 };
            }
            
            const completed = workerCompletions.filter(c => c?.status === ActivityStatus.COMPLETED).length;
            const progress = (completed / total) * 100;
            return { worker, completed, total, progress };
        });
    }, [plan, workers]);

    // Memoized filtering of workers based on search
    const filteredWorkerPlanProgress = useMemo(() => {
        return workerPlanProgress.filter(({ worker }) =>
            worker.name.toLowerCase().includes(workerListSearchTerm.toLowerCase())
        );
    }, [workerPlanProgress, workerListSearchTerm]);

    const toggleWorkerExpansion = (workerId: number) => {
        setExpandedWorkerId(prevId => (prevId === workerId ? null : workerId));
    };

    const handleAddActivityField = () => {
        setNewActivities([...newActivities, { name: '' }]);
    };
    
    const handleRemoveActivityField = (index: number) => {
        setNewActivities(newActivities.filter((_, i) => i !== index));
    };

    const handleActivityChange = (index: number, value: string) => {
        const updatedActivities = [...newActivities];
        updatedActivities[index].name = value;
        setNewActivities(updatedActivities);
    };

    const handleSubmitNewActivities = () => {
        if (newActivities.some(a => !a.name)) {
            alert("Por favor, completa todos los campos para las nuevas actividades.");
            return;
        }
        onAddActivities(plan.id, newActivities);
        closeModal();
    };
    
    const closeModal = () => {
        setIsModalOpen(false);
        setNewActivities([{ name: '' }]);
    };
    
    const getActivityProgress = (activity: Activity) => {
        if (!activity || activity.completions.length === 0) return 0;
        const completedCount = activity.completions.filter(c => c.status === ActivityStatus.COMPLETED).length;
        return (completedCount / activity.completions.length) * 100;
    };

    const renderStatusBadge = (completion: ActivityCompletion, planDeadline: string) => {
        if (completion.status === ActivityStatus.COMPLETED) {
            return (
                <div className="flex flex-col items-end">
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
        <div className="space-y-6">
            <div>
                <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline mb-4">
                    <ArrowLeftIcon className="w-5 h-5" />
                    Volver al Panel
                </button>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h1 className="text-3xl font-bold text-primary">{plan.name}</h1>
                    <p className="text-dark-gray mt-1 capitalize">
                        {plan.month} | Fecha Límite: {new Date(plan.deadline).toLocaleDateString('es-ES')}
                    </p>
                </div>
            </div>
            
            <WorkerProgress plans={[plan]} users={workers} onSelectWorker={onSelectWorker} />
            
            {/* Conditional View: Tabs or Activity Detail */}
            {!selectedActivity ? (
                 <>
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            <button
                                onClick={() => setActiveView('activities')}
                                className={ activeView === 'activities'
                                    ? 'border-primary text-primary whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm'
                                }
                            >
                                Actividades
                            </button>
                            <button
                                onClick={() => setActiveView('workers')}
                                className={ activeView === 'workers'
                                    ? 'border-primary text-primary whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm'
                                }
                            >
                                Trabajadores
                            </button>
                        </nav>
                    </div>

                    {activeView === 'activities' && (
                        <div className="bg-white rounded-lg shadow-md overflow-hidden animate-fade-in">
                            <div className="p-4 bg-gray-50 border-b flex justify-between items-center flex-wrap gap-3">
                                <h2 className="text-2xl font-bold text-dark-gray">Estado de las Actividades</h2>
                                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark transition-colors">
                                    <PlusIcon className="w-5 h-5"/>
                                    Añadir Actividades
                                </button>
                            </div>
                            {plan.activities.length > 0 ? (
                                <ul className="divide-y divide-gray-200">
                                    {plan.activities.map((activity) => (
                                        <li key={activity.id}>
                                            <button 
                                                onClick={() => setSelectedActivity(activity)}
                                                className="w-full text-left p-4 hover:bg-light-gray transition-colors"
                                            >
                                                <p className="font-medium text-dark-gray">{activity.name}</p>
                                                <div className="mt-2">
                                                    <ProgressBar value={getActivityProgress(activity)} />
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="p-6 text-center text-dark-gray">No se encontraron actividades para este plan. Haz clic en "Añadir Actividades" para comenzar.</p>
                            )}
                        </div>
                    )}
                    
                    {activeView === 'workers' && (
                        <div className="bg-white rounded-lg shadow-md overflow-hidden animate-fade-in">
                            <div className="p-4 bg-gray-50 border-b flex justify-between items-center flex-wrap gap-3">
                                <h2 className="text-2xl font-bold text-dark-gray">Trabajadores del Plan</h2>
                                <div className="relative w-full sm:w-64">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <SearchIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Buscar trabajador..."
                                        value={workerListSearchTerm}
                                        onChange={(e) => setWorkerListSearchTerm(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                                    />
                                </div>
                            </div>
                            <div className="p-4 sm:p-6 space-y-2">
                                {filteredWorkerPlanProgress.length > 0 ? (
                                    filteredWorkerPlanProgress.map(({ worker, completed, total, progress }) => {
                                        const isExpanded = expandedWorkerId === worker.id;
                                        return (
                                        <div key={worker.id} className="bg-gray-50 rounded-lg border overflow-hidden">
                                            <button 
                                                className="w-full p-3 text-left flex justify-between items-center hover:bg-gray-100 transition-colors"
                                                onClick={() => toggleWorkerExpansion(worker.id)}
                                                aria-expanded={isExpanded}
                                                aria-controls={`worker-details-${worker.id}`}
                                            >
                                                <div className="flex-grow pr-4">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-medium text-dark-gray">{worker.name}</span>
                                                        <span className="text-sm text-gray-500">{completed} / {total} tareas</span>
                                                    </div>
                                                    <ProgressBar value={progress} />
                                                </div>
                                                <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isExpanded && (
                                                <div id={`worker-details-${worker.id}`} className="p-4 bg-white border-t animate-fade-in-fast">
                                                    <h5 className="text-sm font-semibold text-dark-gray mb-3">Detalle de Actividades Asignadas:</h5>
                                                    <ul className="space-y-3">
                                                        {plan.activities.map(activity => {
                                                            const completion = activity.completions.find(c => c.workerId === worker.id);
                                                            if (!completion) return null;
                                                            
                                                            return (
                                                                <li key={activity.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 bg-light-gray rounded-md border">
                                                                    <span className="text-sm text-dark-gray mb-2 sm:mb-0 flex-1 pr-2">{activity.name}</span>
                                                                    {renderStatusBadge(completion, plan.deadline)}
                                                                </li>
                                                            );
                                                        })}
                                                        {plan.activities.filter(a => a.completions.some(c => c.workerId === worker.id)).length === 0 && (
                                                            <p className="text-center text-sm text-gray-500 py-2">No hay actividades asignadas a este trabajador en este plan.</p>
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )})
                                ) : (
                                    <p className="text-center text-dark-gray py-4">No se encontraron trabajadores con ese nombre.</p>
                                )}
                                { workers.length === 0 && <p className="text-center text-dark-gray py-4">No hay trabajadores asignados a este plan.</p>}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                // Worker Progress for Selected Activity View
                <div className="bg-white rounded-lg shadow-md overflow-hidden animate-fade-in">
                    <div className="p-4 bg-gray-50 border-b">
                         <button onClick={() => setSelectedActivity(null)} className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline mb-4">
                            <ArrowLeftIcon className="w-5 h-5" />
                            Volver a Actividades
                        </button>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <h3 className="text-lg font-semibold text-dark-gray">Progreso por Trabajador</h3>
                            <div className="relative w-full sm:w-56">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <SearchIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar trabajador..."
                                    value={workerSearchTerm}
                                    onChange={(e) => setWorkerSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <h4 className="font-bold text-xl text-primary mb-4">{selectedActivity.name}</h4>
                        <ul className="space-y-3">
                            {filteredWorkersForActivity.length > 0 ? (
                                filteredWorkersForActivity.map(worker => {
                                    const completion = selectedActivity.completions.find(c => c.workerId === worker.id);
                                    return (
                                        <li key={worker.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                            <span className="font-medium text-dark-gray">{worker.name}</span>
                                            {completion ? renderStatusBadge(completion, plan.deadline) : <span className="text-gray-400 text-sm">N/A</span>}
                                        </li>
                                    )
                                })
                            ) : (
                                <p className="text-center text-dark-gray py-4">No se encontraron trabajadores con ese nombre.</p>
                            )}
                        </ul>
                    </div>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={closeModal} title={`Añadir Actividades a "${plan.name}"`}>
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Nuevas Actividades</h3>
                    {newActivities.map((activity, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                            <input 
                                type="text" 
                                placeholder="Descripción de la actividad" 
                                value={activity.name}
                                onChange={e => handleActivityChange(index, e.target.value)}
                                className="flex-grow mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                            />
                            {newActivities.length > 1 && (
                                <button onClick={() => handleRemoveActivityField(index)} className="text-red-500 hover:text-red-700 p-1 text-xl font-bold">
                                    &times;
                                </button>
                            )}
                        </div>
                    ))}
                    <button onClick={handleAddActivityField} className="text-sm text-primary hover:underline">+ Añadir otra actividad</button>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button onClick={handleSubmitNewActivities} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Añadir Actividades</button>
                </div>
            </Modal>
        </div>
    );
};

export default PlanDetail;