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

interface ApiActivityCompletion {
  id: number;
  activity_id: number;
  evidence_url: string;
  observations: string;
  created_at: string;
}

interface ApiUserWithCompletion extends ApiUser {
  activity_completion: ApiActivityCompletion;
}

export interface ActivityCompletion {
  id: number;
  activityId: number;
  evidenceUrl: string;
  observations: string;
  createdAt: string;
}

export interface UserWithCompletion extends User {
  completion: ActivityCompletion;
}

const mapApiUser = (u: ApiUser): User => ({
  id: u.id,
  username: u.username,
  name: `${u.first_name} ${u.last_name}`.trim(),
  role: u.is_employ ? Role.WORKER : Role.SUPERVISOR,
});

const mapApiUserWithCompletion = (u: ApiUserWithCompletion): UserWithCompletion => ({
  ...mapApiUser(u),
  completion: {
    id: u.activity_completion.id,
    activityId: u.activity_completion.activity_id,
    evidenceUrl: u.activity_completion.evidence_url,
    observations: u.activity_completion.observations,
    createdAt: u.activity_completion.created_at,
  },
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

  /** GET /api/v1/usuarios/actividad/{activity_id}/ */
  async getUsersByActivity(activityId: number): Promise<UserWithCompletion[]> {
    const data = await this.request<ApiUserWithCompletion[]>(`/api/v1/usuarios/actividad/${activityId}/`);
    return data.map(mapApiUserWithCompletion);
  }

}

export const userService = new UserService();
