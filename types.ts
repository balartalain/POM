
export enum Role {
  SUPERVISOR = 'supervisor',
  EMPLOYEE = 'employee',
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
  employeeId: number;
  status: ActivityStatus;
  completedAt?: string;
  evidenceFile?: string;
}

export interface Activity {
  id: number;
  plan_id: number;
  title: string;
  description: string;
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