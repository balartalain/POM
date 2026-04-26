
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Pusher from 'pusher-js';
import { User, Role } from './types';
import { userService } from './services/UserService';
import Login from './components/Login';
import SupervisorLayout from './components/SupervisorLayout';
import EmployeeDashboard from './components/EmployeeDashboard';
import Header from './components/Header';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/ToastContainer';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
     console.log('Entrando a la app');
    const pusher = new Pusher('b23e7b8bf6ab3b8b19ff', {
      cluster: 'us2',
    });

    // 2. Suscribirse al canal (usando la lógica de recintos que hablamos)
    const channel = pusher.subscribe('plan');

    channel.bind('update-plan', (data) => {      
      console.log('Datos recibidos desde Django:', data);
    });

    // 4. Limpieza: Desconectar al desmontar el componente
    return () => {
      pusher.unsubscribe('plan');
    };
  }, []);

  const handleLogin = useCallback(async (username: string): Promise<boolean> => {
    try {
      const users = await userService.getUsers();
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (user) {
        setCurrentUser(user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const renderContent = useMemo(() => {
    if (!currentUser) {
      return <Login onLogin={handleLogin} />;
    }
    debugger;
    return (
      <div className="min-h-screen bg-light-gray">
        <Header user={currentUser} onLogout={handleLogout} />
        <main className="p-4 sm:p-6 lg:p-8">
          {currentUser.role === Role.SUPERVISOR ? (
            <SupervisorLayout supervisor={currentUser} />
          ) : (
            <EmployeeDashboard employee={currentUser} />
          )}
        </main>
      </div>
    );
  }, [currentUser, handleLogin, handleLogout]);

  return (
    <ToastProvider>
      {renderContent}
      <ToastContainer />
    </ToastProvider>
  );
};

export default App;
