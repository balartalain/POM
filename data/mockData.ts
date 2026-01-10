
import { User, Plan, Role, ActivityStatus } from '../types';

export const USERS: User[] = [
  { id: 1, name: 'Alice Manager', username: 'supervisor', role: Role.SUPERVISOR },
  { id: 2, name: 'Bob Worker', username: 'worker1', role: Role.WORKER },
  { id: 3, name: 'Charlie Worker', username: 'worker2', role: Role.WORKER },
];

const today = new Date();
const endOfThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);

const thisMonthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });
const nextMonthName = new Date(today.getFullYear(), today.getMonth() + 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

export const INITIAL_PLANS: Plan[] = [
  {
    id: 1,
    name: `Quarterly Report Preparation - ${thisMonthName}`,
    month: thisMonthName,
    deadline: endOfThisMonth.toISOString(),
    activities: [
      { id: 101, name: 'Gather sales data from Q1', status: ActivityStatus.COMPLETED, workerId: 2, evidenceFile: 'sales_data_q1.pdf' },
      { id: 102, name: 'Compile marketing analytics', status: ActivityStatus.PENDING, workerId: 2 },
      { id: 103, name: 'Draft initial report summary', status: ActivityStatus.PENDING, workerId: 3 },
      { id: 104, name: 'Review financial statements', status: ActivityStatus.COMPLETED, workerId: 3, evidenceFile: 'financials_review.pdf' },
    ],
  },
  {
    id: 2,
    name: `Product Launch Campaign - ${thisMonthName}`,
    month: thisMonthName,
    deadline: new Date(today.getFullYear(), today.getMonth(), 15).toISOString(), // A past deadline for testing
    activities: [
      { id: 201, name: 'Design promotional materials', status: ActivityStatus.COMPLETED, workerId: 2, evidenceFile: 'promo_designs.pdf' },
      { id: 202, name: 'Setup social media ads', status: ActivityStatus.PENDING, workerId: 3 },
    ],
  },
    {
    id: 3,
    name: `Client Onboarding Process Improvement - ${nextMonthName}`,
    month: nextMonthName,
    deadline: endOfNextMonth.toISOString(),
    activities: [
      { id: 301, name: 'Survey existing clients for feedback', status: ActivityStatus.PENDING, workerId: 2 },
      { id: 302, name: 'Analyze competitor onboarding flows', status: ActivityStatus.PENDING, workerId: 2 },
      { id: 303, name: 'Propose new onboarding checklist', status: ActivityStatus.PENDING, workerId: 3 },
    ],
  },
];
