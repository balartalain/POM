import { useCallback } from 'react';
import { request } from '../services/apiClient';

const VAPID_PUBLIC_KEY = 'BG_yvHrLJk0_dihF253nkBhnIljre6DmaBpgtkpj9cKAOvk-OmxpzkHxhhUxkTxrtZgOTNKTrvzJf0dHpiGDnA0';
const PUSH_USER_KEY = 'pame_push_user_id';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const subscribe = useCallback(async (userId: number): Promise<void> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const registration = await navigator.serviceWorker.ready;

    // Si el usuario cambió respecto al último login, forzar nuevo endpoint
    // para que el backend no asocie la suscripción al usuario equivocado.
    const storedUserId = localStorage.getItem(PUSH_USER_KEY);
    if (storedUserId && storedUserId !== String(userId)) {
      const existing = await registration.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();
    }

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    await request('/api/v1/push/subscribe/', {
      method: 'POST',
      body: JSON.stringify(subscription.toJSON()),
    });

    localStorage.setItem(PUSH_USER_KEY, String(userId));
  }, []);

  const unsubscribePush = useCallback(async (): Promise<void> => {
    if (!('serviceWorker' in navigator)) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await request(
        `/api/v1/push/subscribe/?endpoint=${encodeURIComponent(subscription.endpoint)}`,
        { method: 'DELETE' }
      ).catch(() => {});
      await subscription.unsubscribe();
    }

    localStorage.removeItem(PUSH_USER_KEY);
  }, []);

  const getPendingUpdates = useCallback(async (): Promise<string[]> => {
    if (!('serviceWorker' in navigator)) return [];

    const registration = await navigator.serviceWorker.ready;
    const controller = registration.active;
    if (!controller) return [];

    return new Promise<string[]>((resolve) => {
      const channel = new MessageChannel();
      const timeout = setTimeout(() => resolve([]), 1500);
      channel.port1.onmessage = (event: MessageEvent<{ updates: string[] }>) => {
        clearTimeout(timeout);
        resolve(event.data.updates ?? []);
      };
      controller.postMessage({ type: 'GET_PENDING_UPDATES' }, [channel.port2]);
    });
  }, []);

  return { subscribe, unsubscribePush, getPendingUpdates };
}
