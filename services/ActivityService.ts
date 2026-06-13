import { Activity } from '../types';
import { request } from './apiClient';

export interface ActivityCompletion {
  id: number;
  plan_id: number;
  title: string;
  description: string;
  completed: boolean;
  completed_at: string | null;
  evidence_url: string | null;
  observations: string | null;
}

export interface ActivityProgress {
  activity_id: number;
  employee_id: number;
  employee_name: string;
  evidence_url: string;
  observations: string;
  created_at: string;
}

class ActivityService {
  /** GET /api/v1/actividades/?plan_id={planId} */
  async getActivities(planId: number): Promise<Activity[]> {
    return request<Activity[]>(`/api/v1/actividades/?plan_id=${planId}`);
  }

  /** POST /api/v1/actividades/ */
  async createActivity(activity: Omit<Activity, 'id'>): Promise<Activity> {
    return request<Activity>('/api/v1/actividades/', {
      method: 'POST',
      body: JSON.stringify(activity),
    });
  }

  /** PATCH /api/v1/actividades/{id}/ */
  async updateActivity(id: number, activity: Omit<Activity, 'id'>): Promise<Activity> {
    return request<Activity>(`/api/v1/actividades/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(activity),
    });
  }

  /** DELETE /api/v1/actividades/{id}/ */
  async deleteActivity(id: number): Promise<void> {
    return request<void>(`/api/v1/actividades/${id}/`, { method: 'DELETE' });
  }

  /** GET /api/v1/actividades/{id}/progreso/ */
  async getActivityProgress(activityId: number): Promise<ActivityProgress[]> {
    return request<ActivityProgress[]>(`/api/v1/actividades/${activityId}/progreso/`);
  }

  /** POST /api/v1/actividades/{id}/completar/ */
  async complete(
    activityId: number,
    employeeId: number,
    evidenceFile: File,
    observations?: string
  ): Promise<ActivityCompletion> {
    const formData = new FormData();
    formData.append('employee_id', String(employeeId));
    formData.append('observations', observations || '');
    formData.append('evidencia_file', evidenceFile);
    return request<ActivityCompletion>(`/api/v1/actividades/${activityId}/completar/`, {
      method: 'POST',
      body: formData,
    });
  }
}

export const activityService = new ActivityService();
