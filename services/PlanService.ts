import { Plan } from '../types';
import { request } from './apiClient';

export interface ApiActivity {
  id: number;
  name: string;
  completions: Array<{
    employeeId: number;
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
  /** GET /api/v1/planes/?year={year} */
  async getPlans(year: number): Promise<Plan[]> {
    return request<Plan[]>(`/api/v1/planes/?year=${year}`);
  }

  /** POST /api/v1/planes/ */
  async createPlan(plan: Pick<Plan, 'title' | 'expiration_date' | 'supervisor_id'>): Promise<Plan> {
    return request<Plan>('/api/v1/planes/', {
      method: 'POST',
      body: JSON.stringify(plan),
    });
  }

  /** PATCH /api/v1/planes/{id}/ */
  async updatePlan(id: number, plan: Partial<Plan>): Promise<Plan> {
    return request<Plan>(`/api/v1/planes/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(plan),
    });
  }

  /** DELETE /api/v1/planes/{id}/ */
  async deletePlan(id: number): Promise<void> {
    return request<void>(`/api/v1/planes/${id}/`, { method: 'DELETE' });
  }
}

export const planService = new PlanService();
