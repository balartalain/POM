/// <reference types="vite/client" />
import { User, Role } from '../types';

interface ApiUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export interface UserActivity {
  id: number;
  planId: number;
  title: string;
  description: string;
  completed: boolean;
  completedAt: string | null;
  evidenceUrl: string | null;
}

interface ApiUserActivity {
  id: number;
  plan_id: number;
  title: string;
  description: string;
  total_pending: number;
  completed_at: string | null;
  evidence_url: string | null;
}

interface ApiUserWithMetrics extends ApiUser {
  total_completed: number;
  total_pending: number;
  completed_percentage: number;
}

export interface UserWithMetrics extends User {
  totalCompleted: number;
  totalPending: number;
  completedPercentage: number;
}

const mapApiUser = (u: ApiUser): User => ({
  id: u.id,
  username: u.username,
  name: `${u.first_name} ${u.last_name}`.trim(),
  role: u.role=== 'employee' ? Role.EMPLOYEE : Role.SUPERVISOR,
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

  /** GET /api/v1/usuarios/?plan_id={planId} */
  async getUsers(planId: number): Promise<UserWithMetrics[]> {
    const data = await this.request<ApiUserWithMetrics[]>(`/api/v1/usuarios/?plan_id=${planId}`);
    return data.map(u => ({
      ...mapApiUser(u),
      totalCompleted: u.total_completed,
      totalPending: u.total_pending,
      completedPercentage: u.completed_percentage,
    }));
  }

  /** GET /api/v1/usuarios/{userId}/actividades/?plan_id={planId} */
  async getActivities(userId: number, planId: number): Promise<UserActivity[]> {
    const data = await this.request<ApiUserActivity[]>(`/api/v1/usuarios/${userId}/actividades/?plan_id=${planId}`);   
    return data.map(a => ({
      id: a.id,
      planId: a.plan_id,
      title: a.title,
      description: a.description,
      completed: a.completed_at !== null,
      completedAt: a.completed_at,
      evidenceUrl: a.evidence_url,
    }));
  }


}

export const userService = new UserService();
