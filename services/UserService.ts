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
  completed: boolean;
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

  /** GET /api/v1/usuarios/metrics/?plan_id={planId} */
  async getUsersWithMetrics(planId: number): Promise<UserWithMetrics[]> {
    const data = await this.request<ApiUserWithMetrics[]>(`/api/v1/usuarios/metrics/?plan_id=${planId}`);
    return data.map(u => ({
      ...mapApiUser(u),
      totalCompleted: u.total_completed,
      totalPending: u.total_pending,
      completedPercentage: u.completed_percentage,
    }));
  }

  /** GET /api/v1/usuarios/{userId}/actividades/?year={year} */
  async getUserActivities(userId: number, year: number): Promise<UserActivity[]> {
    const data = await this.request<ApiUserActivity[]>(`/api/v1/usuarios/${userId}/actividades/?year=${year}`);
    return data.map(a => ({
      id: a.id,
      planId: a.plan_id,
      title: a.title,
      description: a.description,
      completed: a.completed,
      completedAt: a.completed_at,
      evidenceUrl: a.evidence_url,
    }));
  }

  /** GET /api/v1/usuarios/actividad/{activity_id}/ */
  async getUsersByActivity(activityId: number): Promise<UserWithCompletion[]> {
    const data = await this.request<ApiUserWithCompletion[]>(`/api/v1/usuarios/actividad/${activityId}/`);
    return data.map(mapApiUserWithCompletion);
  }

  /** POST /api/v1/usuarios/completar-actividad/ */
  async completeActivity(
    activityId: number,
    employeeId: number,
    evidenceUrl: string,
    observations?: string
  ): Promise<ActivityCompletion> {
    const data = await this.request<ApiActivityCompletion>('/api/v1/usuarios/completar-actividad/', {
      method: 'POST',
      body: JSON.stringify({
        activity_id: activityId,
        employee_id: employeeId,
        evidence_url: evidenceUrl,
        observations: observations || '',
      }),
    });
    return {
      id: data.id,
      activityId: data.activity_id,
      evidenceUrl: data.evidence_url,
      observations: data.observations,
      createdAt: data.created_at,
    };
  }

}

export const userService = new UserService();
