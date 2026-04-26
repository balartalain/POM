import React, { useState } from 'react';
import { User } from '../types';
import { CalendarIcon, UserIcon } from './Icons';
import SupervisorDashboard from './SupervisorDashboard';
import EmployeesView from './EmployeesView';

type Section = 'plans' | 'employees';

const NAV_ITEMS: { id: Section; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'plans',     label: 'Planes',    icon: CalendarIcon },
  { id: 'employees', label: 'Empleados', icon: UserIcon },
];

interface SupervisorLayoutProps {
  supervisor: User;
}

const SupervisorLayout: React.FC<SupervisorLayoutProps> = ({ supervisor }) => {
  const [active, setActive] = useState<Section>('plans');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (section: Section) => {
    setActive(section);
    setMobileOpen(false);
  };

  return (
    <div className="flex gap-6 items-start">

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-30 w-56 bg-white shadow-xl pt-6
          transform transition-transform duration-200 ease-in-out
          md:static md:h-auto md:z-auto md:shadow-none md:translate-x-0
          md:bg-white md:rounded-lg md:border md:border-gray-200 md:pt-0
          shrink-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Menú</p>
          <nav className="space-y-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleNav(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active === id
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden flex items-center gap-2 px-3 py-2 mb-4 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          {NAV_ITEMS.find(n => n.id === active)?.label}
        </button>

        {active === 'plans'
          ? <SupervisorDashboard supervisor={supervisor} />
          : <EmployeesView />
        }
      </div>
    </div>
  );
};

export default SupervisorLayout;
