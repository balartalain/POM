
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
import { usePushNotifications } from './hooks/usePushNotifications';
import type { DataUpdateType } from './hooks/useDataSync';

// ─── Sesión expirada ────────────────────────────────────────────────────────

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

// ─── Notificaciones en tiempo real ──────────────────────────────────────────

type UpdateMeta = { title: string; body: string };

const UPDATE_META: Record<DataUpdateType, UpdateMeta> = {
  UPDATE_PLANS:      { title: 'Planes actualizados',      body: 'Hay cambios en los planes disponibles.' },
  UPDATE_ACTIVITIES: { title: 'Actividades actualizadas', body: 'Hay cambios en las actividades disponibles.' },
  UPDATE_COMPLETIONS:{ title: 'Completados actualizados', body: 'Hay cambios en los completados disponibles.' },
};

function dispatch(type: DataUpdateType) {
  window.dispatchEvent(new CustomEvent('pame:data-update', { detail: { type } }));
}

const RealtimeListener: React.FC<{ user: User }> = ({ user }) => {
  const { addToast } = useToast();
  const { subscribe, getPendingUpdates } = usePushNotifications();

  // Solicita permiso push y registra la suscripción al hacer login
  useEffect(() => {
    subscribe().catch(() => {});
  }, [user, subscribe]);

  // Comprueba pending updates: al montar, al ganar foco y al volver a ser visible
  const checkPending = useCallback(async () => {
    const updates = await getPendingUpdates();
    if (updates.length === 0) return;
    updates.forEach((type) => dispatch(type as DataUpdateType));
    addToast('Hay datos actualizados disponibles', 'info');
  }, [getPendingUpdates, addToast]);

  useEffect(() => {
    checkPending();
    window.addEventListener('focus', checkPending);
    document.addEventListener('visibilitychange', checkPending);
    return () => {
      window.removeEventListener('focus', checkPending);
      document.removeEventListener('visibilitychange', checkPending);
    };
  }, [checkPending]);

  // Pusher: notificaciones en tiempo real cuando la app está activa
  useEffect(() => {
    const pusher = new Pusher('b23e7b8bf6ab3b8b19ff', { cluster: 'us2' });
    const channel = pusher.subscribe('pame');

    const handleUpdate = (type: DataUpdateType) => {
      const meta = UPDATE_META[type];
      addToast(meta.body, 'info');
      dispatch(type);
    };

    channel.bind('UPDATE_PLANS',       () => handleUpdate('UPDATE_PLANS'));
    channel.bind('UPDATE_ACTIVITIES',  () => handleUpdate('UPDATE_ACTIVITIES'));
    channel.bind('UPDATE_COMPLETIONS', () => handleUpdate('UPDATE_COMPLETIONS'));

    return () => { pusher.disconnect(); };
  }, [user, addToast]);

  return null;
};

// ─── App principal ──────────────────────────────────────────────────────────

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setCurrentUser(stored);
    setAuthChecked(true);
  }, []);

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
      {currentUser && <RealtimeListener user={currentUser} />}
      {renderContent}
      <TailwindIndicator />
      <ToastContainer />
    </ToastProvider>
  );
};

export default App;
