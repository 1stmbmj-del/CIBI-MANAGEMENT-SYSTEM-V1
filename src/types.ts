export type UserRole = 'admin' | 'user' | 'coordinator';

export interface UserProfile {
  uid: string;
  fullName: string;
  mobileNumber: string;
  role: UserRole;
  photoURL?: string;
  createdAt: string;
}

export type AccountType = 'New' | 'Renewal' | 'Restructure' | 'Additional';
export type Tribe = 'NCR' | 'Rizal' | 'Mindoro' | 'Cavite';
export type MOP = 'Weekly' | 'Semi-Monthly' | 'Monthly';
export type TOP = 'Collection' | 'PDC';
export type AssignmentStatus = 
  | 'Assigned' 
  | 'Start to Perform Assignment' 
  | 'Reviewing' 
  | 'Field CIBI' 
  | 'Cashflowing' 
  | 'Report Submitted' 
  | 'Completed' 
  | 'Approved' 
  | 'Denied';

export interface TimelineStep {
  step: string;
  timestamp: string;
}

export interface ValidationResults {
  didAnswerCalls: boolean;
  didReceiveProceeds: boolean;
  didExplainPN: boolean;
  didExplainDeductions: boolean;
}

export interface Assignment {
  id: string;
  borrowerName: string;
  mobileNumber: string;
  accountType: AccountType;
  location: string;
  tribe: Tribe;
  businessPin: string;
  addressPin: string;
  requestedAmount: number;
  term: string;
  intRate: number;
  mop: MOP;
  top: TOP;
  ciOfficerId: string;
  ciOfficerName: string;
  status: AssignmentStatus;
  timeline: TimelineStep[];
  approvedAmount?: number;
  approvedTerm?: string;
  approvedIntRate?: number;
  approvedMop?: MOP;
  approvedTop?: TOP;
  crecomComments?: string;
  netIncome?: number;
  ndiPercentage?: 30 | 40 | 50;
  ndiValue?: number;
  validationResults?: ValidationResults;
  createdAt: string;
}
