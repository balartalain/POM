/// <reference types="vite/client" />

const BASE_URL: string = (import.meta.env.VITE_API_BASE_URL as string) ?? '';

class SessionExpiredError extends Error {
  constructor() {
    super('Session expired');
    this.name = 'SessionExpiredError';
  }
}

function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // exp está en segundos; restamos 10s de margen
    return payload.exp * 1000 - 10_000 < Date.now();
  } catch {
    return true;
  }
}

let refreshPromise: Promise<void> | null = null;

async function refreshAccessToken(): Promise<void> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refresh = localStorage.getItem('refresh');
    if (!refresh) throw new SessionExpiredError();

    const response = await fetch(`${BASE_URL}/api/v1/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!response.ok) {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      localStorage.removeItem('user');
      window.dispatchEvent(new CustomEvent('session-expired'));
      throw new SessionExpiredError();
    }

    const { access } = await response.json() as { access: string };
    localStorage.setItem('access', access);
  })().finally(() => { refreshPromise = null; });

  return refreshPromise;
}

async function getValidToken(): Promise<string> {
  const access = localStorage.getItem('access');
  if (!access || isExpired(access)) {
    await refreshAccessToken();
  }
  return localStorage.getItem('access')!;
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let token: string;
  try {
    token = await getValidToken();
  } catch (err) {
    if (err instanceof SessionExpiredError) {
      // El evento ya disparó — dejar que el app redirija al login sin propagar el error
      return new Promise<T>(() => {});
    }
    throw err;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`[${response.status}] ${message}`);
  }

  return response.json() as Promise<T>;
}
