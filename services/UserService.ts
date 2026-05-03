import { request } from './apiClient';

export interface UserActivity {
  id: number;
  plan_id: number;
  title: string;
  description: string;
  completed: boolean;
  completed_at: string | null;
  evidence_url: string | null;
  observations: string | null;
}

export interface UserWithMetrics {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  total_completed: number;
  total_pending: number;
  completed_percentage: number;
}

class UserService {
  /** GET /api/v1/usuarios/?plan_id={planId} */
  async getUsers(planId: number): Promise<UserWithMetrics[]> {
    return request<UserWithMetrics[]>(`/api/v1/usuarios/?plan_id=${planId}`);
  }

  /** GET /api/v1/usuarios/{userId}/actividades/?plan_id={planId} */
  async getActivities(userId: number, planId: number): Promise<UserActivity[]> {
    return request<UserActivity[]>(`/api/v1/usuarios/${userId}/actividades/?plan_id=${planId}`);
  }
}

export const userService = new UserService();
