/// <reference types="vite/client" />
import { Plan } from '../types';

// Tipos que el API puede devolver (pueden diferir del tipo frontend)
export interface ApiActivity {
  id: number;
  name: string;
  completions: Array<{
    workerId: number;
    status: string;
    completedAt?: string;
    evidenceFile?: string;
  }>;
}

export interface ApiPlan {
  id: number;
  name: string;
  month: string;
  year: number;
  monthIndex: number;
  deadline: string;
  activities: ApiActivity[];
}

class PlanService {
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

  /** GET /api/v1/planes/?year={year} */
  async getPlans(year: number): Promise<Plan[]> {
    return this.request<Plan[]>(`/api/v1/planes/?year=${year}`);
  }

  /** POST /api/v1/planes/ */
  async createPlan(plan: Pick<Plan, 'title' | 'expiration_date'>): Promise<Plan> {
    return this.request<Plan>('/api/v1/planes/', {
      method: 'POST',
      body: JSON.stringify(plan),
    });
  }

  /** PATCH /api/v1/planes/{id}/ */
  async updatePlan(id: number, plan: Partial<Plan>): Promise<Plan> {
    return this.request<Plan>(`/api/v1/planes/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(plan),
    });
  }

  /** DELETE /api/v1/planes/{id}/ */
  async deletePlan(id: number): Promise<void> {
    return this.request<void>(`/api/v1/planes/${id}/`, { method: 'DELETE' });
  }
}

export const planService = new PlanService();
