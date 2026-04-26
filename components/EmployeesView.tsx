import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { userService } from '../services/UserService';
import Spinner from './shared/Spinner';

const EmployeesView: React.FC = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    userService.getUsers()
      .then(data => { if (!cancelled) setEmployees(data); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar los empleados.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-dark-gray">Empleados</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 bg-white rounded-lg shadow-md">
          <Spinner className="h-6 w-6 text-primary" />
        </div>
      ) : error ? (
        <div className="text-center text-red-600 p-8 bg-white rounded-lg shadow-md">
          <p>{error}</p>
        </div>
      ) : employees.length ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{emp.name}</td>
                  <td className="px-6 py-4 text-gray-500">{emp.username}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center text-dark-gray p-8 bg-white rounded-lg shadow-md">
          <p>No hay empleados registrados.</p>
        </div>
      )}
    </div>
  );
};

export default EmployeesView;
