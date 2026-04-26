
import React, { useState, useMemo, useEffect } from 'react';
import { User, Plan } from '../types';
import { planService } from '../services/PlanService';
import PlanCard from './PlanCard';
import EmployeePlanDetail from './EmployeePlanDetail';

interface EmployeeDashboardProps {
  employee: User;
}

const MONTH_NAMES: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
  5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
  9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ employee }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    planService.getPlans(selectedYear)
      .then(data => { if (!cancelled) setPlans(data); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar los planes.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedYear]);

  const plansByMonth = useMemo(() =>
    [...plans]
      .sort((a, b) => b.month - a.month)
      .reduce((acc: Record<string, Plan[]>, plan) => {
        const key = MONTH_NAMES[plan.month] ?? `Mes ${plan.month}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(plan);
        return acc;
      }, {}),
  [plans]);

  if (selectedPlan) {
    return (
      <EmployeePlanDetail
        plan={selectedPlan}
        employee={employee}
        onBack={() => setSelectedPlan(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-dark-gray">Mis Planes del Año {selectedYear}</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="year-select" className="text-sm font-medium text-dark-gray">Año:</label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
          >
            {YEARS.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-dark-gray p-8 bg-white rounded-lg shadow">
          <p>Cargando planes...</p>
        </div>
      ) : error ? (
        <div className="text-center text-red-600 p-8 bg-white rounded-lg shadow">
          <p>{error}</p>
        </div>
      ) : plans.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(plansByMonth).map(([month, monthPlans]) => (
            <div key={month}>
              <h3 className="text-xl font-semibold text-dark-gray mb-3 pb-2 border-b">{month}</h3>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {monthPlans.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    userRole={employee.role}
                    onClick={() => setSelectedPlan(plan)}
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
  );
};

export default EmployeeDashboard;
