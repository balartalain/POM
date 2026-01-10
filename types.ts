
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
  evidenceFile?: string;
}

export interface Activity {
  id: number;
  name: string;
  completions: ActivityCompletion[];
}

export interface Plan {
  id: number;
  name: string;
  month: string;
  year: number;
  monthIndex: number;
  deadline: string; // ISO 8601 format date string
  activities: Activity[];
}