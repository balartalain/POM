/// <reference types="vite/client" />

const BASE_URL: string = (import.meta.env.VITE_API_BASE_URL as string) ?? '';

function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // exp está en segundos; restamos 10s de margen
    return payload.exp * 1000 - 10_000 < Date.now();
  } catch {
    return true;
  }
}

async function refreshAccessToken(): Promise<void> {
  const refresh = localStorage.getItem('refresh');
  if (!refresh) throw new Error('No refresh token');

  const response = await fetch(`${BASE_URL}/api/v1/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    throw new Error('Session expired');
  }

  const { access } = await response.json() as { access: string };
  localStorage.setItem('access', access);
}

async function getValidToken(): Promise<string> {
  const access = localStorage.getItem('access');
  if (!access || isExpired(access)) {
    await refreshAccessToken();
  }
  return localStorage.getItem('access')!;
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getValidToken();

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
