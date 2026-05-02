import { useState, useEffect, useRef } from 'react';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) ?? '';
const HEALTH_URL = `${BASE_URL}/api/v1/health/`;
const POLL_INTERVAL = 30_000; // 30 seconds

const checkServer = async (): Promise<boolean> => {
  try {
    const res = await fetch(HEALTH_URL, { method: 'GET', signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
};

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = async () => {
    const serverUp = await checkServer();
    setIsOnline(serverUp);
  };

  useEffect(() => {
    const onBrowserOnline  = () => poll();
    const onBrowserOffline = () => setIsOnline(false);

    window.addEventListener('online',  onBrowserOnline);
    window.addEventListener('offline', onBrowserOffline);

    // Initial check
    poll();

    // Periodic polling
    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      window.removeEventListener('online',  onBrowserOnline);
      window.removeEventListener('offline', onBrowserOffline);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return isOnline;
};
