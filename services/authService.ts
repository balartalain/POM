import { User, Role } from '../types';

interface JwtPayload {
  user_id: number;
  exp: number;
}

interface TokenResponse {
  access: string;
  refresh: string;
  user: User;
}

const BASE_URL: string = (import.meta.env.VITE_API_BASE_URL as string) ?? '';

function decodePayload(token: string): JwtPayload {
  return JSON.parse(atob(token.split('.')[1])) as JwtPayload;
}

export async function loginWithGoogle(credential: string): Promise<User> {
  const response = await fetch(`${BASE_URL}/api/v1/auth/google/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });

  if (!response.ok) {
    throw new Error('No se pudo autenticar con Google');
  }

  const { access, refresh, user } = await response.json() as TokenResponse;
  localStorage.setItem('access', access);
  localStorage.setItem('refresh', refresh);
  localStorage.setItem('user', JSON.stringify(user));
  return user;
}

/**
 * Devuelve el usuario si la sesión es recuperable (refresh válido).
 * La info del usuario se lee del payload del access token sin verificar firma.
 */
export function getStoredUser(): User | null {
  const access = localStorage.getItem('access');
  const refresh = localStorage.getItem('refresh');
  if (!access || !refresh) return null;

  try {
    const refreshPayload = decodePayload(refresh);
    if (refreshPayload.exp * 1000 < Date.now()) return null;
    return localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) as User : null;
  } catch {
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
  localStorage.removeItem('user');
}
