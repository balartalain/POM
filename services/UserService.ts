/// <reference types="vite/client" />
import { User, Role } from '../types';

interface ApiUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_employ: boolean;
}

const mapApiUser = (u: ApiUser): User => ({
  id: u.id,
  username: u.username,
  name: `${u.first_name} ${u.last_name}`.trim(),
  role: u.is_employ ? Role.WORKER : Role.SUPERVISOR,
});

class UserService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = (import.meta.env.VITE_API_BASE_URL as string) ?? '';
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options,
    });

    if (!response.ok) {
      const message = await response.text().catch(() => response.statusText);
      throw new Error(`[${response.status}] ${message}`);
    }

    return response.json() as Promise<T>;
  }

  /** GET /api/v1/usuarios/ */
  async getUsers(): Promise<User[]> {
    const data = await this.request<ApiUser[]>('/api/v1/usuarios/');
    return data.map(mapApiUser);
  }

}

export const userService = new UserService();
