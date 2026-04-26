
export enum Role {
  SUPERVISOR = 'supervisor',
  WORKER = 'worker',
}

export interface User {
  id: number;
  name: string;
  username: string;
  role: Role;
}

export enum ActivityStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
}

export interface ActivityCompletion {
  workerId: number;
  status: ActivityStatus;
  completedAt?: string;
  evidenceFile?: string;
}

export interface Activity {
  id: number;
  name: string;
  completions: ActivityCompletion[];
}

export interface Plan {
  id: number;
  title: string;
  supervisor_id: number;
  expiration_date: string;
  month: number;
  total_activities: number;
  total_completed: number;
}