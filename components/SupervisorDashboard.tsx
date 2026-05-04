
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { User, Plan } from '../types';
import { planService } from '../services/PlanService';
import ConfirmationModal from './ConfirmationModal';
import Drawer from './Drawer';
import { PlusIcon } from './Icons';
import Spinner from './shared/Spinner';
import PlanCard from './PlanCard';
import PlanDetail from './PlanDetail';
import { useToast } from '../hooks/useToast';
import { useDataSync } from '../hooks/useDataSync';

interface SupervisorDashboardProps {
  supervisor: User;
}

const MONTHS: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
  5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
  9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};
const YEARS = Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i);

const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({ supervisor }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDeadline, setNewPlanDeadline] = useState('');
  const [formErrors, setFormErrors] = useState<{ name?: string; deadline?: string }>({});

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [planToDeleteId, setPlanToDeleteId] = useState<number | null>(null);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);

  const { addToast } = useToast();

  const fetchPlans = useCallback(() => {
    setLoading(true);
    setError(null);
    planService.getPlans(selectedYear)
      .then(data => setPlans(data))
      .catch(err => setError(err instanceof Error ? err.message : 'Error al cargar los planes.'))
      .finally(() => setLoading(false));
  }, [selectedYear]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  //useDataSync('UPDATE_PLANS', fetchPlans);

  const filteredPlans = useMemo(() =>
    [...plans].sort((a, b) => b.month - a.month || new Date(b.expiration_date).getTime() - new Date(a.expiration_date).getTime()),
  [plans]);

  const plansByMonth = useMemo(() =>
    filteredPlans.reduce((acc: Record<string, Plan[]>, plan) => {
      const key = MONTHS[plan.month] ?? `Mes ${plan.month}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(plan);
      return acc;
    }, {}),
  [filteredPlans]);

  const handleSelectPlan = (plan: Plan) => setSelectedPlan(plan);
  const handleBackToDashboard = () => setSelectedPlan(null);

  const handleUpdatePlan = (updatedPlan: Plan) => {
    setPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
    if (selectedPlan?.id === updatedPlan.id) setSelectedPlan(updatedPlan);
  };

  const validateForm = () => {
    const errors: { name?: string; deadline?: string } = {};
    if (!newPlanName.trim()) errors.name = "El nombre del plan es obligatorio.";
    if (!newPlanDeadline) errors.deadline = "La fecha límite es obligatoria.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSavePlan = async () => {
    if (!validateForm()) return;

    setIsSavingPlan(true);
    try {
      if (editingPlan) {
        const updated = await planService.updatePlan(editingPlan.id, {
          ...editingPlan,
          title: newPlanName,
          expiration_date: newPlanDeadline,
        });
        handleUpdatePlan(updated);
        addToast('Plan actualizado con éxito.', 'success');
      } else {
        const created = await planService.createPlan({
          title: newPlanName,
          expiration_date: newPlanDeadline,
          supervisor_id: supervisor.id,
        });
        setPlans(prev => [created, ...prev]);
        addToast('Nuevo plan creado con éxito.', 'success');
      }
      closeModal();
    } catch {
      addToast(editingPlan ? 'Error al actualizar el plan.' : 'Error al crear el plan.', 'error');
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingPlan(null);
    setNewPlanName('');
    setNewPlanDeadline('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setNewPlanName(plan.title);
    setNewPlanDeadline(plan.expiration_date);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (planId: number) => setPlanToDeleteId(planId);
  const handleCloseDeleteModal = () => setPlanToDeleteId(null);

  const handleConfirmDelete = async () => {
    if (!planToDeleteId) return;
    setIsDeletingPlan(true);
    try {
      await planService.deletePlan(planToDeleteId);
      setPlans(prev => prev.filter(p => p.id !== planToDeleteId));
      addToast('Plan eliminado correctamente.', 'success');
      handleCloseDeleteModal();
    } catch {
      addToast('Error al eliminar el plan.', 'error');
    } finally {
      setIsDeletingPlan(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
    setNewPlanName('');
    setNewPlanDeadline('');
    setFormErrors({});
  };

  if (selectedPlan) {
    return (
      <PlanDetail
        plan={selectedPlan}
        employees={[]}
        onBack={handleBackToDashboard}
        onUpdatePlan={handleUpdatePlan}
      />
    );
  }

  return (
    <div>
      <div className="animate-fade-in space-y-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg sm:text-2xl font-bold text-dark-gray leading-tight">
            <span className="block sm:inline">Planes del Año</span>
            <span className="sm:hidden text-primary ml-1">{selectedYear}</span>
            <span className="hidden sm:inline"> {selectedYear}</span>
          </h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <label htmlFor="year-select" className="hidden sm:inline text-sm font-medium text-dark-gray">Año:</label>
              <select id="year-select" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="bg-white border border-gray-300 rounded-md shadow-sm py-1.5 sm:py-2 px-2 sm:px-3 text-sm focus:outline-none focus:ring-primary focus:border-primary">
                {YEARS.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Añadir Nuevo Plan</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-8 bg-white rounded-lg shadow">
            <Spinner className="h-6 w-6 text-primary" />
          </div>
        ) : error ? (
          <div className="text-center text-red-600 p-8 bg-white rounded-lg shadow">
            <p>{error}</p>
          </div>
        ) : filteredPlans.length > 0 ? (
          <div className="space-y-8">
            {Object.entries(plansByMonth).map(([month, monthPlans]) => (
              <div key={month}>
                <h3 className="text-xl font-semibold text-dark-gray mb-3 pb-2 border-b capitalize">{month}</h3>
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

      <Drawer isOpen={isModalOpen} onClose={closeModal} title={editingPlan ? 'Editar Plan' : 'Crear Nuevo Plan'}>
        <div className="space-y-5">
          <div>
            <label htmlFor="planName" className="block text-sm font-medium text-gray-700">Nombre del Plan</label>
            <input
              type="text"
              id="planName"
              value={newPlanName}
              onChange={e => {
                setNewPlanName(e.target.value);
                if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined }));
              }}
              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-primary focus:border-primary ${formErrors.name ? 'border-red-500' : 'border-gray-300'}`}
            />
            {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="planDeadline" className="block text-sm font-medium text-gray-700">Fecha Límite</label>
            <input
              type="date"
              id="planDeadline"
              value={newPlanDeadline}
              onChange={e => {
                setNewPlanDeadline(e.target.value);
                if (formErrors.deadline) setFormErrors(prev => ({ ...prev, deadline: undefined }));
              }}
              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-primary focus:border-primary ${formErrors.deadline ? 'border-red-500' : 'border-gray-300'}`}
            />
            {formErrors.deadline && <p className="text-xs text-red-600 mt-1">{formErrors.deadline}</p>}
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t pt-4">
          <button onClick={closeModal} disabled={isSavingPlan} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm disabled:opacity-70 disabled:cursor-not-allowed">Cancelar</button>
          <button
            onClick={handleSavePlan}
            disabled={isSavingPlan}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark text-sm font-semibold disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSavingPlan && <Spinner />}
            {isSavingPlan
              ? (editingPlan ? 'Guardando...' : 'Creando...')
              : (editingPlan ? 'Guardar Cambios' : 'Crear Plan')
            }
          </button>
        </div>
      </Drawer>

      <ConfirmationModal
        isOpen={planToDeleteId !== null}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        confirmText="Eliminar"
        isLoading={isDeletingPlan}
      >
        <p className="text-base">
          ¿Estás seguro de que quieres eliminar el plan
          <span className="font-bold"> "{plans.find(p => p.id === planToDeleteId)?.title}"</span>?
        </p>
        <p className="mt-2 text-sm text-red-700">Esta acción no se puede deshacer.</p>
      </ConfirmationModal>
    </div>
  );
};

export default SupervisorDashboard;
