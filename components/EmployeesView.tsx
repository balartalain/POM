import React, { useState, useEffect, useMemo } from 'react';
import { Role, Plan } from '../types';
import { userService, UserActivity, UserWithMetrics } from '../services/UserService';
import { planService } from '../services/PlanService';
import Spinner from './shared/Spinner';
import { getBgColor, getTextColor, getProgressBarColor, getAvatarColor } from '@/utils/progressColor';
import { formatDate } from '@/utils/formatDate';

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

const BackArrowIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);

// ── component ─────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 4 }, (_, i) => CURRENT_YEAR - i);

const EmployeesView: React.FC = () => {
  const [year, setYear] = useState(CURRENT_YEAR);

  const [employees, setEmployees]           = useState<UserWithMetrics[]>([]);
  const [plans, setPlans]                   = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedEmpId, setSelectedEmpId]   = useState<number | null>(null);
  const [selActs, setSelActs]               = useState<UserActivity[]>([]);
  const [loadingInit, setLoadingInit]       = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [search, setSearch]                 = useState('');
  const [showDetail, setShowDetail]         = useState(false);

  // Load plans
  useEffect(() => {
    let cancelled = false;
    setLoadingInit(true);
    planService.getPlans(year)
      .then(fetchedPlans => {
        if (cancelled) return;
        const ps = [...fetchedPlans].sort((a, b) => b.month - a.month);
        setPlans(ps);
        setSelectedPlanId(ps.length > 0 ? ps[0].id : null);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingInit(false); });
    return () => { cancelled = true; };
  }, [year]);

  // Load employees with metrics when plan changes
  useEffect(() => {
    if (!selectedPlanId) return;
    let cancelled = false;
    setLoadingEmployees(true);
    userService.getUsers(selectedPlanId)
      .then(users => {
        if (cancelled) return;
        const emps = users.filter(u => u.role === Role.EMPLOYEE);
        setEmployees(emps);
        setSelectedEmpId(prev => prev ?? (emps.length > 0 ? emps[0].id : null));
      })
      .catch(() => { if (!cancelled) setEmployees([]); })
      .finally(() => { if (!cancelled) setLoadingEmployees(false); });
    return () => { cancelled = true; };
  }, [selectedPlanId]);

  // Load activities for the selected employee + plan on demand
  useEffect(() => {
    if (!selectedEmpId || !selectedPlanId) return;
    let cancelled = false;
    setLoadingActivities(true);
    userService.getActivities(selectedEmpId, selectedPlanId)
      .then(acts => { if (!cancelled) setSelActs(acts); })
      .catch(() => { if (!cancelled) setSelActs([]); })
      .finally(() => { if (!cancelled) setLoadingActivities(false); });
    return () => { cancelled = true; };
  }, [selectedEmpId, selectedPlanId, year]);

  // Derived state
  const selectedPlan     = useMemo(() => plans.find(p => p.id === selectedPlanId) ?? null, [plans, selectedPlanId]);
  const selectedEmployee = useMemo(() => employees.find(e => e.id === selectedEmpId) ?? null, [employees, selectedEmpId]);

  const filteredEmployees = useMemo(
  () => {
    const term = search.trim().toLowerCase();
    if (!term) return employees;

    return employees.filter(e => 
      e.name.toLowerCase().includes(term) || 
      e.username.toLowerCase().includes(term)
    );
  },
  [employees, search]
);

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
      <div className="px-4 lg:px-8 py-3 lg:py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-3 flex-shrink-0">
        <h1 className="hidden lg:block text-lg font-semibold text-slate-800 flex-1">Empleados</h1>
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center gap-1.5 flex-1 lg:flex-none">
            <label className="hidden sm:inline text-sm text-slate-500 whitespace-nowrap">Año:</label>
            <select
              className="flex-1 lg:flex-none text-sm border border-slate-200 bg-white rounded-lg px-2 lg:px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
              value={year}
              onChange={e => { setYear(Number(e.target.value)); setSelectedPlanId(null); setSelectedEmpId(null); setSelActs([]); }}
            >
              {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5 flex-1 lg:flex-none">
            <label className="hidden sm:inline text-sm text-slate-500 whitespace-nowrap">Plan:</label>
            <select
              className="flex-1 lg:flex-none text-sm border border-slate-200 bg-white rounded-lg px-2 lg:px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
              value={selectedPlanId ?? ''}
              onChange={e => setSelectedPlanId(Number(e.target.value))}
            >
              {Array.from(new Set(plans.map(p => p.month))).map(month => (
                <optgroup key={month} label={MONTHS_ES[month - 1]}>
                  {plans.filter(p => p.month === month).map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* No plans message */}
      {plans.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
          No hay planes en este año
        </div>
      )}

      {/* Split panel */}
      {plans.length > 0 && (
        <>
          {/* ── Mobile: sliding panels (< md) ─────────────────────────────── */}
          <div className="lg:hidden flex-1 relative overflow-hidden">

            {/* Employee list — slides out to the left */}
            <div className={`absolute inset-0 flex flex-col bg-white transition-transform duration-300 ease-in-out ${showDetail ? '-translate-x-full' : 'translate-x-0'}`}>
              <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
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
              <div className="overflow-y-auto flex-1">
                {loadingEmployees ? (
                  <div className="flex justify-center py-8"><Spinner className="h-5 w-5 text-slate-400" /></div>
                ) : filteredEmployees.map(emp => {
                  const pct   = emp.completedPercentage;
                  const done  = emp.totalCompleted;
                  const total = emp.totalCompleted + emp.totalPending;
                  return (
                    <div
                      key={emp.id}
                      onClick={() => { setSelectedEmpId(emp.id); setShowDetail(true); }}
                      className="emp-row px-4 py-3.5 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-2.5">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${getAvatarColor(pct)}`}>
                          {getInitials(emp.name || emp.username)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{emp.name}</p>
                          <p className="text-xs text-slate-400 truncate">{emp.username}</p>
                        </div>
                        <span className={`text-xs font-bold flex-shrink-0 ${getTextColor(pct)}`}>{pct}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className={`progress-bar h-full rounded-full ${getProgressBarColor(pct)}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap">{done}/{total}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detail panel — slides in from the right */}
            <div className={`absolute inset-0 overflow-y-auto bg-slate-50 transition-transform duration-300 ease-in-out ${showDetail ? 'translate-x-0' : 'translate-x-full'}`}>
              <div className="p-4 flex flex-col gap-4">
                <button
                  onClick={() => setShowDetail(false)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-[#1e3a8a]"
                >
                  <BackArrowIcon />
                  Empleados
                </button>

                {selectedEmployee && selectedPlan ? (
                  <>
                    <div className="bg-white border border-slate-200 rounded-xl px-4 py-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${getAvatarColor(selPct)}`}>
                          {getInitials(selectedEmployee.name || selectedEmployee.username)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{selectedEmployee.name || selectedEmployee.username}</p>
                          <p className="text-xs text-slate-400">{selectedPlan.title} · {planLabel(selectedPlan)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 text-center bg-emerald-50 rounded-lg py-2">
                          <p className="text-base font-semibold text-emerald-600 leading-none">{selDone}</p>
                          <p className="text-xs text-emerald-500 mt-0.5">Completadas</p>
                        </div>
                        <div className="flex-1 text-center bg-amber-50 rounded-lg py-2">
                          <p className="text-base font-semibold text-amber-500 leading-none">{selTotal - selDone}</p>
                          <p className="text-xs text-amber-500 mt-0.5">Faltan</p>
                        </div>
                        <div className={`flex-1 text-center ${getBgColor(selPct)} rounded-lg py-2`}>
                          <p className={`text-base font-semibold leading-none ${getTextColor(selPct)}`}>{selPct}%</p>
                          <p className={`text-xs ${getTextColor(selPct)} mt-0.5`}>Cumplimiento</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Actividades</p>
                      {loadingActivities ? (
                        <div className="flex justify-center py-6"><Spinner className="h-5 w-5 text-slate-400" /></div>
                      ) : selActs.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-6">No hay actividades en este Plan</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {selActs.map(act => (
                            <div key={act.id} className={`bg-white border border-slate-200 rounded-xl overflow-hidden flex items-center gap-3 px-4 py-3 border-l-4 ${act.completed ? 'border-l-emerald-400' : 'border-l-slate-200'}`}>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${act.completed ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                {act.completed ? <CheckIcon /> : <ClockIcon />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${act.completed ? 'text-slate-800' : 'text-slate-500'}`}>{act.title}</p>
                                {act.completed ? (
                                  <p className="text-xs text-slate-400 mt-0.5">Completada el {act.completedAt ? formatDate(act.completedAt) : '—'}</p>
                                ) : (
                                  <p className="text-xs text-amber-400 mt-0.5">Pendiente</p>
                                )}
                              </div>
                              {act.completed ? (
                                act.evidenceUrl ? (
                                  <a href={act.evidenceUrl} target="_blank" rel="noopener noreferrer"
                                     className="text-xs text-blue-600 hover:underline flex items-center gap-1 flex-shrink-0">
                                    <ExternalIcon />Ver evidencia
                                  </a>
                                ) : (
                                  <span className="text-xs text-slate-300 flex-shrink-0">Sin evidencia</span>
                                )
                              ) : (
                                <span className="text-xs bg-amber-50 text-amber-500 px-2.5 py-1 rounded-full flex-shrink-0">Pendiente</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {/* ── Desktop: split panel (md+) ────────────────────────────────── */}
          <div className="hidden lg:flex flex-1 overflow-hidden">

            {/* Left: employee list */}
            <div className="w-80 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
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
              <div className="overflow-y-auto flex-1">
                {loadingEmployees ? (
                  <div className="flex justify-center py-8"><Spinner className="h-5 w-5 text-slate-400" /></div>
                ) : filteredEmployees.map(emp => {
                  const selected = emp.id === selectedEmpId;
                  const pct      = emp.completedPercentage;
                  const done     = emp.totalCompleted;
                  const total    = emp.totalCompleted + emp.totalPending;
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
                          <p className={`text-sm font-medium emp-name truncate ${selected ? 'text-[#1e3a8a]' : 'text-slate-800'}`}>{emp.name}</p>
                          <p className="text-xs text-slate-400 truncate">{emp.username}</p>
                        </div>
                        <span className={`text-xs font-bold flex-shrink-0 ${getTextColor(pct)}`}>{pct}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className={`progress-bar h-full rounded-full ${getProgressBarColor(pct)}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap">{done}/{total}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: detail panel */}
            <div className="flex-1 bg-slate-50 p-6 overflow-y-auto flex flex-col gap-5">
              {!selectedEmployee || !selectedPlan ? (
                <div className="flex items-center justify-center h-full text-sm text-slate-400">
                  Selecciona un empleado
                </div>
              ) : (
                <>
                  <div className="bg-white border border-slate-200 rounded-xl px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${getAvatarColor(selPct)}`}>
                        {getInitials(selectedEmployee.name || selectedEmployee.username)}
                      </div>
                      <div>
                        <p className="text-base font-semibold text-slate-800">{selectedEmployee.name || selectedEmployee.username}</p>
                        <p className="text-xs text-slate-400">{selectedPlan.title} · {planLabel(selectedPlan)}</p>
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

                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Actividades</p>
                    {loadingActivities ? (
                      <div className="flex justify-center py-6"><Spinner className="h-5 w-5 text-slate-400" /></div>
                    ) : selActs.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-6">No hay actividades en este Plan</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {selActs.map(act => (
                          <div key={act.id} className={`bg-white border border-slate-200 rounded-xl overflow-hidden flex items-center gap-4 px-5 py-4 border-l-4 ${act.completed ? 'border-l-emerald-400' : 'border-l-slate-200'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${act.completed ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                              {act.completed ? <CheckIcon /> : <ClockIcon />}
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${act.completed ? 'text-slate-800' : 'text-slate-500'}`}>{act.title}</p>
                              {act.completed ? (
                                <p className="text-xs text-slate-400 mt-0.5">Completada el {act.completedAt ? formatDate(act.completedAt) : '—'}</p>
                              ) : (
                                <p className="text-xs text-amber-400 mt-0.5">Pendiente</p>
                              )}
                            </div>
                            {act.completed ? (
                              act.evidenceUrl ? (
                                <a href={act.evidenceUrl} target="_blank" rel="noopener noreferrer"
                                   className="text-xs text-blue-600 hover:underline flex items-center gap-1 flex-shrink-0">
                                  <ExternalIcon />Ver evidencia
                                </a>
                              ) : (
                                <span className="text-xs text-slate-300 flex-shrink-0">Sin evidencia</span>
                              )
                            ) : (
                              <span className="text-xs bg-amber-50 text-amber-500 px-2.5 py-1 rounded-full flex-shrink-0">Pendiente</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EmployeesView;
