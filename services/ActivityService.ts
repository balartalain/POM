/// <reference types="vite/client" />
import { Activity } from '../types';

class ActivityService {
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

  /** GET /api/v1/actividades/?plan_id={planId} */
  async getActivities(planId: number): Promise<Activity[]> {
    return this.request<Activity[]>(`/api/v1/actividades/?plan_id=${planId}`);
  }

  /** POST /api/v1/actividades/ */
  async createActivity(activity: Omit<Activity, 'id'>): Promise<Activity> {
    return this.request<Activity>('/api/v1/actividades/', {
      method: 'POST',
      body: JSON.stringify(activity),
    });
  }

  /** PATCH /api/v1/actividades/{id}/ */
  async updateActivity(id: number, activity: Omit<Activity, 'id'>): Promise<Activity> {
    return this.request<Activity>(`/api/v1/actividades/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(activity),
    });
  }

  /** DELETE /api/v1/actividades/{id}/ */
  async deleteActivity(id: number): Promise<void> {
    return this.request<void>(`/api/v1/actividades/${id}/`, { method: 'DELETE' });
  }
}

export const activityService = new ActivityService();
