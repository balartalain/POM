import { Activity } from '../types';
import { request } from './apiClient';

interface ApiActivityCompletion {
  id: number;
  activity_id: number;
  evidence_url: string;
  observations: string;
  completed_at: string;
}

export interface ActivityCompletion {
  id: number;
  evidenceUrl: string;
  observations: string;
  completedAt: string;
  completed: boolean;
}

interface ApiActivityProgress {
  activity_id: number;
  employee_id: number;
  employee_name: string;
  evidence_url: string;
  observations: string;
  created_at: string;
}

export interface ActivityProgress {
  activityId: number;
  employeeId: number;
  employeeName: string;
  evidenceUrl: string;
  observations: string;
  createdAt: string;
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
    const data = await request<ApiActivityProgress[]>(`/api/v1/actividades/${activityId}/progreso/`);
    return data.map(d => ({
      activityId: d.activity_id,
      employeeId: d.employee_id,
      employeeName: d.employee_name,
      evidenceUrl: d.evidence_url,
      observations: d.observations,
      createdAt: d.created_at,
    }));
  }

  /** POST /api/v1/actividades/completar/ */
  async complete(
    activityId: number,
    employeeId: number,
    evidenceUrl: string,
    observations?: string
  ): Promise<ActivityCompletion> {
    const data = await request<ApiActivityCompletion>(`/api/v1/actividades/${activityId}/completar/`, {
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
      completed: true,
      evidenceUrl: data.evidence_url,
      observations: data.observations,
      completedAt: data.completed_at,
    };
  }
}

export const activityService = new ActivityService();
