
import React, { useState, useMemo } from 'react';
import { User, Plan, Activity, ActivityStatus, Role } from '../types';
import { INITIAL_PLANS, USERS } from '../data/mockData';
import WorkerProgress from './WorkerProgress';
import Modal from './Modal';
import { PlusIcon } from './Icons';
import PlanCard from './PlanCard';

interface SupervisorDashboardProps {
  supervisor: User;
}

const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({ supervisor }) => {
  const [plans, setPlans] = useState<Plan[]>(INITIAL_PLANS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDeadline, setNewPlanDeadline] = useState('');
  const [newPlanActivities, setNewPlanActivities] = useState<Array<{name: string, workerId: number}>>([{ name: '', workerId: -1 }]);

  const workers = useMemo(() => USERS.filter(u => u.role === Role.WORKER), []);

  const handleAddActivityField = () => {
    setNewPlanActivities([...newPlanActivities, { name: '', workerId: -1 }]);
  };

  const handleActivityChange = (index: number, field: 'name' | 'workerId', value: string | number) => {
    const updatedActivities = [...newPlanActivities];
    if(field === 'workerId'){
        updatedActivities[index][field] = Number(value);
    } else {
        updatedActivities[index][field] = String(value);
    }
    setNewPlanActivities(updatedActivities);
  };
  
  const handleRemoveActivityField = (index: number) => {
      const updated = newPlanActivities.filter((_, i) => i !== index);
      setNewPlanActivities(updated);
  }

  const handleCreatePlan = () => {
    if (!newPlanName || !newPlanDeadline || newPlanActivities.some(a => !a.name || a.workerId === -1)) {
        alert("Please fill all fields for the plan and its activities.");
        return;
    }

    const deadlineDate = new Date(newPlanDeadline);
    const monthName = deadlineDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    const newPlan: Plan = {
      id: Date.now(),
      name: newPlanName,
      month: monthName,
      deadline: deadlineDate.toISOString(),
      activities: newPlanActivities.map((act, index) => ({
        id: Date.now() + index,
        name: act.name,
        status: ActivityStatus.PENDING,
        workerId: act.workerId,
      })),
    };

    setPlans(prevPlans => [newPlan, ...prevPlans]);
    closeModal();
  };
  
  const closeModal = () => {
      setIsModalOpen(false);
      setNewPlanName('');
      setNewPlanDeadline('');
      setNewPlanActivities([{ name: '', workerId: -1 }]);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-dark-gray mb-4">Overall Progress</h2>
        <WorkerProgress plans={plans} users={workers} />
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-dark-gray">Monthly Plans</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark transition-colors"
        >
          <PlusIcon className="w-5 h-5"/>
          Add New Plan
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map(plan => (
          <PlanCard key={plan.id} plan={plan} userRole={supervisor.role} />
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Create New Monthly Plan">
        <div className="space-y-4">
          <div>
            <label htmlFor="planName" className="block text-sm font-medium text-gray-700">Plan Name</label>
            <input type="text" id="planName" value={newPlanName} onChange={e => setNewPlanName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"/>
          </div>
          <div>
            <label htmlFor="planDeadline" className="block text-sm font-medium text-gray-700">Deadline</label>
            <input type="date" id="planDeadline" value={newPlanDeadline} onChange={e => setNewPlanDeadline(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"/>
          </div>
          <h3 className="text-lg font-medium text-gray-900 border-t pt-4">Activities</h3>
          {newPlanActivities.map((activity, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2 border rounded-md">
              <input 
                type="text" 
                placeholder="Activity description" 
                value={activity.name}
                onChange={e => handleActivityChange(index, 'name', e.target.value)}
                className="col-span-3 md:col-span-2 mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
              />
              <div className="flex items-center gap-2">
                 <select
                    value={activity.workerId}
                    onChange={e => handleActivityChange(index, 'workerId', e.target.value)}
                    className="flex-grow mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                 >
                    <option value={-1} disabled>Assign to...</option>
                    {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                 </select>
                {newPlanActivities.length > 1 && (
                     <button onClick={() => handleRemoveActivityField(index)} className="text-red-500 hover:text-red-700 p-1">
                        &times;
                     </button>
                )}
              </div>
            </div>
          ))}
          <button onClick={handleAddActivityField} className="text-sm text-primary hover:underline">+ Add another activity</button>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
          <button onClick={handleCreatePlan} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Create Plan</button>
        </div>
      </Modal>
    </div>
  );
};

export default SupervisorDashboard;
