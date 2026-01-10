
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

export interface Activity {
  id: number;
  name: string;
  status: ActivityStatus;
  workerId: number;
  evidenceFile?: string;
}

export interface Plan {
  id: number;
  name: string;
  month: string;
  deadline: string; // ISO 8601 format date string
  activities: Activity[];
}
