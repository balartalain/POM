
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Pusher from 'pusher-js';
import { User, Role } from './types';
import { loginWithGoogle, getStoredUser, logout } from './services/authService';
import Login from './components/Login';
import SupervisorLayout from './components/SupervisorLayout';
import UserLayout from './components/UserLayout';
import Header from './components/Header';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/ToastContainer';
import TailwindIndicator from './components/TailwindIndicator';
import { useToast } from './hooks/useToast';

const SessionExpiredListener: React.FC<{ onExpired: () => void }> = ({ onExpired }) => {
  const { addToast } = useToast();
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  useEffect(() => {
    const handler = () => {
      onExpiredRef.current();
      addToast('Su sesión ha expirado', 'info');
    };
    window.addEventListener('session-expired', handler);
    return () => window.removeEventListener('session-expired', handler);
  }, [addToast]);

  return null;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setCurrentUser(stored);
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const pusher = new Pusher('b23e7b8bf6ab3b8b19ff', { cluster: 'us2' });
    const channel = pusher.subscribe('plan');
    channel.bind('update-plan', (data: unknown) => {
      console.log('Datos recibidos desde Django:', data);
    });

    return () => { pusher.unsubscribe('plan'); };
  }, [currentUser]);

  const handleGoogleLogin = useCallback(async (credential: string) => {
    const user = await loginWithGoogle(credential);
    setCurrentUser(user);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setCurrentUser(null);
  }, []);

  const renderContent = useMemo(() => {
    if (!authChecked) return null;

    if (!currentUser) {
      return <Login onLogin={handleGoogleLogin} />;
    }

    return (
      <div className="min-h-screen bg-light-gray">
        <Header user={currentUser} onLogout={handleLogout} />
        <main className="p-4 sm:p-6 lg:p-8">
          {currentUser.role === Role.SUPERVISOR ? (
            <SupervisorLayout supervisor={currentUser} />
          ) : (
            <UserLayout employee={currentUser} />
          )}
        </main>
      </div>
    );
  }, [currentUser, authChecked, handleGoogleLogin, handleLogout]);

  return (
    <ToastProvider>
      <SessionExpiredListener onExpired={handleLogout} />
      {renderContent}
      <TailwindIndicator />
      <ToastContainer />
    </ToastProvider>
  );
};

export default App;
