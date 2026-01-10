
import React, { useState, useCallback, useMemo } from 'react';
import { User, Role } from './types';
import { USERS } from './data/mockData';
import Login from './components/Login';
import SupervisorDashboard from './components/SupervisorDashboard';
import WorkerDashboard from './components/WorkerDashboard';
import Header from './components/Header';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = useCallback((username: string): boolean => {
    const user = USERS.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const renderContent = useMemo(() => {
    if (!currentUser) {
      return <Login onLogin={handleLogin} />;
    }

    return (
      <div className="min-h-screen bg-light-gray">
        <Header user={currentUser} onLogout={handleLogout} />
        <main className="p-4 sm:p-6 lg:p-8">
          {currentUser.role === Role.SUPERVISOR ? (
            <SupervisorDashboard supervisor={currentUser} />
          ) : (
            <WorkerDashboard worker={currentUser} />
          )}
        </main>
      </div>
    );
  }, [currentUser, handleLogin, handleLogout]);

  return <>{renderContent}</>;
};

export default App;
