import React, { useState, useEffect, useMemo } from 'react';
import { User, Role, Plan } from '../types';
import { userService, UserActivity } from '../services/UserService';
import { planService } from '../services/PlanService';
import Spinner from './shared/Spinner';
import { getBgColor, getTextColor, getProgressBarColor, getAvatarColor } from '@/utils/progressColor';

// ── helpers ───────────────────────────────────────────────────────────────────

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const getInitials = (name: string) => {
  const connectors = ['de', 'del', 'la', 'las', 'los', 'y'];
  return name
    .split(' ')
    .filter(w => Boolean(w) && !connectors.includes(w.toLowerCase()))
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
};


const planLabel = (plan: Plan) => {
  const m = MONTHS_ES[(plan.month ?? 1) - 1] ?? '';
  try {
    const yr = plan.expiration_date ? new Date(plan.expiration_date).getFullYear() : new Date().getFullYear();
    return `${m} ${yr}`;
  } catch {
    return m;
  }
};

// ── icons ─────────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
       viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
  </svg>
);

const CheckIcon = () => (
  <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
);

const ClockIcon = () => (
  <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
  </svg>
);

const ExternalIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

// ── component ─────────────────────────────────────────────────────────────────

const EmployeesView: React.FC = () => {
  const year = new Date().getFullYear();

  const [employees, setEmployees]             = useState<User[]>([]);
  const [plans, setPlans]                     = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId]   = useState<number | null>(null);
  const [selectedEmpId, setSelectedEmpId]     = useState<number | null>(null);
  const [allActivities, setAllActivities]     = useState<Record<number, UserActivity[]>>({});
  const [loadingInit, setLoadingInit]         = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [search, setSearch]                   = useState('');

  // Load employees + plans
  useEffect(() => {
    let cancelled = false;
    Promise.all([userService.getUsers(), planService.getPlans(year)])
      .then(([users, fetchedPlans]) => {
        if (cancelled) return;
        const emps = users.filter(u => u.role === Role.EMPLOYEE);
        const ps   = fetchedPlans.slice(0, 3);
        setEmployees(emps);
        setPlans(ps);
        if (ps.length > 0)   setSelectedPlanId(ps[0].id);
        if (emps.length > 0) setSelectedEmpId(emps[0].id);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingInit(false); });
    return () => { cancelled = true; };
  }, [year]);

  // Load activities for all employees once employee list is ready
  useEffect(() => {
    if (employees.length === 0) return;
    let cancelled = false;
    setLoadingActivities(true);
    Promise.all(
      employees.map(emp =>
        userService.getUserActivities(emp.id, year)
          .then(acts => ({ id: emp.id, acts }))
          .catch(() => ({ id: emp.id, acts: [] as UserActivity[] }))
      )
    ).then(results => {
      if (cancelled) return;
      const map: Record<number, UserActivity[]> = {};
      results.forEach(r => { map[r.id] = r.acts; });
      setAllActivities(map);
    }).finally(() => { if (!cancelled) setLoadingActivities(false); });
    return () => { cancelled = true; };
  }, [employees, year]);

  // Derived state
  const selectedPlan     = useMemo(() => plans.find(p => p.id === selectedPlanId) ?? null, [plans, selectedPlanId]);
  const selectedEmployee = useMemo(() => employees.find(e => e.id === selectedEmpId) ?? null, [employees, selectedEmpId]);

  const filteredEmployees = useMemo(
    () => search.trim()
      ? employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
      : employees,
    [employees, search]
  );

  const getPlanActs = (empId: number): UserActivity[] =>
    selectedPlanId ? (allActivities[empId] ?? []).filter(a => a.planId === selectedPlanId) : [];

  const getPct = (empId: number) => {
    const acts = getPlanActs(empId);
    return acts.length === 0 ? 0 : Math.round((acts.filter(a => a.completed).length / acts.length) * 100);
  };

  const selActs  = selectedEmpId ? getPlanActs(selectedEmpId) : [];
  const selDone  = selActs.filter(a => a.completed).length;
  const selTotal = selActs.length;
  const selPct   = selTotal === 0 ? 0 : Math.round((selDone / selTotal) * 100);

  if (loadingInit) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-6 w-6 text-primary" />
      </div>
    );
  }

  return (
    <div
      className="mt-4 md:-mt-6 lg:-mt-8 -mb-4 sm:-mb-6 lg:-mb-8 -mr-4 sm:-mr-6 lg:-mr-8 flex flex-col overflow-hidden"
      style={{ minHeight: 'calc(100vh - 4rem)' }}
    >
      {/* Page subheader */}
      <div className="px-8 py-4 bg-white border-b border-slate-200 flex items-center justify-between flex-shrink-0">
        <h1 className="text-lg font-semibold text-slate-800">Empleados</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500 whitespace-nowrap">Plan:</label>
          <select
            className="text-sm border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
            value={selectedPlanId ?? ''}
            onChange={e => setSelectedPlanId(Number(e.target.value))}
          >
            {plans.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Split panel */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left: employee list ──────────────────────────────────────── */}
        <div className="w-80 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">

          {/* Search */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="relative">
              <SearchIcon />
              <input
                type="text"
                placeholder="Buscar empleado..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 bg-slate-50"
              />
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {filteredEmployees.map(emp => {
              const pct      = getPct(emp.id);
              const acts     = getPlanActs(emp.id);
              const done     = acts.filter(a => a.completed).length;
              const total    = acts.length;
              const selected = emp.id === selectedEmpId;

              return (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmpId(emp.id)}
                  className={`emp-row px-4 py-3.5 border-b border-slate-100 cursor-pointer transition-colors ${selected ? 'selected' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${getAvatarColor(pct)}`}>
                      {getInitials(emp.name || emp.username)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium emp-name truncate ${selected ? 'text-[#1e3a8a]' : 'text-slate-800'}`}>
                        {emp.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{emp.username}</p>
                    </div>
                    <span className={`text-xs font-bold flex-shrink-0 ${getTextColor(pct)}`}>{pct}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`progress-bar h-full rounded-full ${getProgressBarColor(pct)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{done}/{total}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: detail panel ──────────────────────────────────────── */}
        <div className="flex-1 bg-slate-50 p-6 overflow-y-auto flex flex-col gap-5">
          {!selectedEmployee || !selectedPlan ? (
            <div className="flex items-center justify-center h-full text-sm text-slate-400">
              Selecciona un empleado
            </div>
          ) : (
            <>
              {/* Employee header card */}
              <div className="bg-white border border-slate-200 rounded-xl px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${getAvatarColor(selPct)}`}>
                    {getInitials(selectedEmployee.name)}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-800">{selectedEmployee.name}</p>
                    <p className="text-xs text-slate-400">
                      {selectedPlan.title} · {planLabel(selectedPlan)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="text-center bg-emerald-50 rounded-lg px-4 py-2 min-w-[56px]">
                    <p className="text-lg font-semibold text-emerald-600 leading-none">{selDone}</p>
                    <p className="text-xs text-emerald-500 mt-0.5">Completadas</p>
                  </div>
                  <div className="text-center bg-amber-50 rounded-lg px-4 py-2 min-w-[56px]">
                    <p className="text-lg font-semibold text-amber-500 leading-none">{selTotal - selDone}</p>
                    <p className="text-xs text-amber-500 mt-0.5">Faltan</p>
                  </div>
                  <div className={`${getBgColor(selPct)} rounded-lg px-4 py-2 min-w-[56px] text-center`}>
                    <p className={`text-lg font-semibold leading-none ${getTextColor(selPct)}`}>{selPct}%</p>
                    <p className={`text-xs ${getTextColor(selPct)} mt-0.5`}>Cumplimiento</p>
                  </div>
                </div>
              </div>

              {/* Activities */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Actividades del plan
                </p>
                {loadingActivities ? (
                  <div className="flex justify-center py-6">
                    <Spinner className="h-5 w-5 text-slate-400" />
                  </div>
                ) : selActs.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">
                    No hay actividades en este plan
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selActs.map(act => (
                      <div key={act.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div
                          className="flex items-center gap-4 px-5 py-4"
                          style={{ borderLeft: `4px solid ${act.completed ? '#34d399' : '#e2e8f0'}` }}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${act.completed ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                            {act.completed ? <CheckIcon /> : <ClockIcon />}
                          </div>

                          <div className="flex-1">
                            <p className={`text-sm font-medium ${act.completed ? 'text-slate-800' : 'text-slate-500'}`}>
                              {act.title}
                            </p>
                            {act.completed ? (
                              <p className="text-xs text-slate-400 mt-0.5">
                                Completada el{' '}
                                {act.completedAt
                                  ? new Date(act.completedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                                  : '—'}
                              </p>
                            ) : (
                              <p className="text-xs text-amber-400 mt-0.5">Pendiente</p>
                            )}
                          </div>

                          {act.completed ? (
                            act.evidenceUrl ? (
                              <a
                                href={act.evidenceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1 flex-shrink-0"
                              >
                                <ExternalIcon />
                                Ver evidencia
                              </a>
                            ) : (
                              <span className="text-xs text-slate-300 flex-shrink-0">Sin evidencia</span>
                            )
                          ) : (
                            <span className="text-xs bg-amber-50 text-amber-500 px-2.5 py-1 rounded-full flex-shrink-0">
                              Pendiente
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeesView;
