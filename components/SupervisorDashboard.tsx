
import React, { useState, useMemo } from 'react';
import { User, Plan, Activity, ActivityStatus, Role } from '../types';
import { INITIAL_PLANS, USERS } from '../data/mockData';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import { PlusIcon } from './Icons';
import PlanCard from './PlanCard';
import PlanDetail from './PlanDetail';
import { useToast } from '../hooks/useToast';

interface SupervisorDashboardProps {
  supervisor: User;
}

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const YEARS = Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i);

const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({ supervisor }) => {
  const [plans, setPlans] = useState<Plan[]>(INITIAL_PLANS);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDeadline, setNewPlanDeadline] = useState('');
  const [newPlanActivities, setNewPlanActivities] = useState<Array<{name: string}>>([{ name: '' }]);
  const [formErrors, setFormErrors] = useState<{ name?: string; deadline?: string }>({});

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [planToDeleteId, setPlanToDeleteId] = useState<number | null>(null);
  
  const { addToast } = useToast();

  const workers = useMemo(() => USERS.filter(u => u.role === Role.WORKER), []);

  const filteredPlans = useMemo(() => {
    return plans
      .filter(plan => plan.year === selectedYear)
      .sort((a, b) => a.monthIndex - b.monthIndex);
  }, [plans, selectedYear]);

  const plansByMonth = useMemo(() => {
    // FIX: Explicitly cast the initial value of reduce to ensure `plansByMonth` is correctly typed.
    return filteredPlans.reduce((acc: Record<string, Plan[]>, plan) => {
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

  const handleAddActivitiesToPlan = (planId: number, activitiesToAdd: Array<{name: string}>) => {
    const updatedPlans = plans.map(p => {
        if (p.id === planId) {
            const newActivities: Activity[] = activitiesToAdd.map((act, index) => ({
                id: Date.now() + index,
                name: act.name,
                completions: workers.map(w => ({
                    workerId: w.id,
                    status: ActivityStatus.PENDING
                })),
            }));
            const updatedPlan = { ...p, activities: [...p.activities, ...newActivities] };
            setSelectedPlan(updatedPlan);
            return updatedPlan;
        }
        return p;
    });
    setPlans(updatedPlans);
    addToast('Actividades añadidas correctamente.', 'success');
  };

  const handleUpdatePlan = (updatedPlan: Plan) => {
    const updatedPlans = plans.map(p => p.id === updatedPlan.id ? updatedPlan : p);
    setPlans(updatedPlans);
    if (selectedPlan && selectedPlan.id === updatedPlan.id) {
        setSelectedPlan(updatedPlan);
    }
  };

  const handleAddActivityField = () => {
    setNewPlanActivities([...newPlanActivities, { name: '' }]);
  };

  const handleActivityChange = (index: number, value: string) => {
    const updatedActivities = [...newPlanActivities];
    updatedActivities[index].name = value;
    setNewPlanActivities(updatedActivities);
  };
  
  const handleRemoveActivityField = (index: number) => {
      const updated = newPlanActivities.filter((_, i) => i !== index);
      setNewPlanActivities(updated);
  }

  const validateForm = () => {
    const errors: { name?: string; deadline?: string } = {};
    if (!newPlanName.trim()) {
      errors.name = "El nombre del plan es obligatorio.";
    }
    if (!newPlanDeadline) {
      errors.deadline = "La fecha límite es obligatoria.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSavePlan = () => {
    if (!validateForm()) {
        return;
    }

    const validActivities = newPlanActivities.filter(act => act.name.trim() !== '');
    const newActivitiesMapped = validActivities.map((act, index) => ({
        id: Date.now() + index,
        name: act.name.trim(),
        completions: workers.map(w => ({
            workerId: w.id,
            status: ActivityStatus.PENDING,
        })),
    }));

    const deadlineDate = new Date(`${newPlanDeadline}T23:59:59`);
    const monthName = deadlineDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

    if (editingPlan) {
        setPlans(prevPlans => prevPlans.map(p =>
            p.id === editingPlan.id
                ? {
                    ...p,
                    name: newPlanName,
                    deadline: deadlineDate.toISOString(),
                    month: monthName,
                    year: deadlineDate.getFullYear(),
                    monthIndex: deadlineDate.getMonth(),
                    activities: [...p.activities, ...newActivitiesMapped],
                  }
                : p
        ));
        addToast('Plan actualizado con éxito.', 'success');
    } else {
        const newPlan: Plan = {
          id: Date.now(),
          name: newPlanName,
          month: monthName,
          year: deadlineDate.getFullYear(),
          monthIndex: deadlineDate.getMonth(),
          deadline: deadlineDate.toISOString(),
          activities: newActivitiesMapped,
        };
        setPlans(prevPlans => [newPlan, ...prevPlans]);
        addToast('Nuevo plan creado con éxito.', 'success');
    }
    closeModal();
  };
  
  const handleOpenCreateModal = () => {
    setEditingPlan(null);
    setNewPlanName('');
    setNewPlanDeadline('');
    setNewPlanActivities([{ name: '' }]);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (planToEdit: Plan) => {
    setEditingPlan(planToEdit);
    setNewPlanName(planToEdit.name);
    const deadlineDate = new Date(planToEdit.deadline);
    const formattedDate = deadlineDate.toISOString().split('T')[0];
    setNewPlanDeadline(formattedDate);
    setNewPlanActivities([{ name: '' }]);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (planId: number) => {
    setPlanToDeleteId(planId);
  };

  const handleCloseDeleteModal = () => {
    setPlanToDeleteId(null);
  };

  const handleConfirmDelete = () => {
    if (planToDeleteId) {
      setPlans(prevPlans => prevPlans.filter(p => p.id !== planToDeleteId));
      handleCloseDeleteModal();
      addToast('Plan eliminado correctamente.', 'success');
    }
  };
  
  const closeModal = () => {
      setIsModalOpen(false);
      setEditingPlan(null);
      setNewPlanName('');
      setNewPlanDeadline('');
      setNewPlanActivities([{ name: '' }]);
      setFormErrors({});
  }

  if (selectedPlan) {
    return (
      <PlanDetail 
        plan={selectedPlan} 
        workers={workers}
        onBack={handleBackToDashboard}
        onAddActivities={handleAddActivitiesToPlan}
        onUpdatePlan={handleUpdatePlan}
      />
    );
  }

  return (
    <div className="space-y-8">
        <div className="animate-fade-in space-y-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-dark-gray">Planes del Año {selectedYear}</h2>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label htmlFor="year-select" className="text-sm font-medium text-dark-gray">Año:</label>
                        <select id="year-select" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary">
                            {YEARS.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                    </div>
                    <button
                    onClick={handleOpenCreateModal}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark transition-colors"
                    >
                    <PlusIcon className="w-5 h-5"/>
                    Añadir Nuevo Plan
                    </button>
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
                                      userRole={supervisor.role}
                                      onClick={() => handleSelectPlan(plan)}
                                      onEdit={() => handleOpenEditModal(plan)}
                                      onDelete={() => handleOpenDeleteModal(plan.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-dark-gray p-8 bg-white rounded-lg shadow">
                  <p>No se encontraron planes para el año {selectedYear}.</p>
                </div>
            )}
        </div>
        
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingPlan ? "Editar Plan" : "Crear Nuevo Plan Mensual"}>
        <div className="space-y-4">
          <div>
            <label htmlFor="planName" className="block text-sm font-medium text-gray-700">Nombre del Plan</label>
            <input type="text" id="planName" value={newPlanName} 
              onChange={e => {
                setNewPlanName(e.target.value);
                if (formErrors.name) setFormErrors(prev => ({...prev, name: undefined}));
              }} 
              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary ${formErrors.name ? 'border-red-500' : 'border-gray-300'}`}
            />
            {formErrors.name && <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>}
          </div>
          <div>
            <label htmlFor="planDeadline" className="block text-sm font-medium text-gray-700">Fecha Límite</label>
            <input type="date" id="planDeadline" value={newPlanDeadline} 
              onChange={e => {
                setNewPlanDeadline(e.target.value)
                if (formErrors.deadline) setFormErrors(prev => ({...prev, deadline: undefined}));
              }} 
              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary ${formErrors.deadline ? 'border-red-500' : 'border-gray-300'}`}
            />
            {formErrors.deadline && <p className="text-sm text-red-600 mt-1">{formErrors.deadline}</p>}
          </div>
          <h3 className="text-lg font-medium text-gray-900 border-t pt-4">
            {editingPlan ? 'Añadir Nuevas Actividades' : 'Actividades'}
          </h3>
          {newPlanActivities.map((activity, index) => (
            <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
              <input 
                type="text" 
                placeholder="Descripción de la actividad" 
                value={activity.name}
                onChange={e => handleActivityChange(index, e.target.value)}
                className="flex-grow mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
              />
              {newPlanActivities.length > 1 && (
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
          <button onClick={handleSavePlan} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
            {editingPlan ? 'Guardar Cambios' : 'Crear Plan'}
          </button>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={planToDeleteId !== null}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        confirmText="Eliminar"
      >
        <p className="text-base">
          ¿Estás seguro de que quieres eliminar el plan 
          <span className="font-bold"> "{plans.find(p => p.id === planToDeleteId)?.name}"</span>?
        </p>
        <p className="mt-2 text-sm text-red-700">Esta acción no se puede deshacer.</p>
      </ConfirmationModal>
    </div>
  );
};

export default SupervisorDashboard;
