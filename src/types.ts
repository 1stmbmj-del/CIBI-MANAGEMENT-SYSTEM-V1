export type UserRole = 'admin' | 'user';

export interface UserProfile {
  id: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  role: UserRole;
  photoURL?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
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

export interface Liability {
  source: string;
  loanType: string;
  loanAmount: number;
  startDate: string;
  endDate: string;
  lastUpdate: string;
  periodicity: string;
  amortization: number;
  balance: number;
  status: string;
  remarks: string;
}

export interface CashflowMonth {
  gross: number;
  expenses: number;
  net: number;
}

export interface CashflowReport {
  liabilities: Liability[];
  businessIncome: {
    january: CashflowMonth;
    february: CashflowMonth;
    march: CashflowMonth;
    average: CashflowMonth;
  };
  householdExpenses: {
    food: number;
    rent: number;
    electricity: number;
    water: number;
    insurance: number;
    clothing: number;
    lpg: number;
    association: number;
    loanPayments: number;
    vehicle: number;
    transportation: number;
    internet: number;
    education: number;
    medical: number;
    miscellaneous: number;
    total: number;
  };
  analysis: {
    grossBusinessIncome: number;
    businessExpenses: number;
    businessNetIncome: number;
    additionalIncome: number;
    totalHouseholdExpenses: number;
    netIncome: number;
    ndiPercentage: number;
    monthlyNdi: number;
    recommendedLoan: number;
    loanableAmount: number;
    difference: number;
  };
  ciRecommendation: {
    loanAmount: number;
    term: number;
    interest: number;
    rate: number;
    monthlyAmort: number;
    semiMonthlyAmort: number;
    weeklyAmort: number;
  };
  operationRecommendation: {
    loanAmount: number;
    term: number;
    interest: number;
    rate: number;
    monthlyAmort: number;
    semiMonthlyAmort: number;
    weeklyAmort: number;
  };
}

export interface CreditScore {
  // Character
  neighbor1: 'Good' | 'Poor';
  neighbor2: 'Good' | 'Poor';
  barangayVerification: 'No Bad Records' | 'With Bad Records';
  loanHistory: 'Yes' | 'No';
  goodCreditBackground: 'Yes' | 'No' | 'None';
  cooperationOfApplicant: 'Very Cooperative' | 'Cooperative' | 'Poor';
  
  // Capital
  totalAssetLiabilities: 'Yes' | 'No';
  
  // Stability
  houseOwnership: 'Owned' | 'Mortgage' | 'Rented' | 'Residing w/ Relatives';
  childrenSchooling: 'Yes' | 'No';
  residingDuration: 'More Than 5yrs.' | '4yrs - 3yrs.' | 'Less than 1yr.';
  houseMaterials: 'Concrete' | 'Semi-Concrete' | 'Light Materials';
  
  // Business Status
  businessLocation: 'Commercial' | 'Residential' | 'Public Market';
  floodProne: 'Yes' | 'No';
  footTraffic: 'Good' | 'Poor';
  businessSpace: 'Owned' | 'Rent Free' | 'Rented';
  permitType: "Mayor's Permit" | 'Barangay / DTI';
  businessDuration: 'More than 10 yrs.' | '5 yrs. - 10 yrs.' | '1 yr. - 5 yrs.';
  inventoryVsSales: 'Good' | 'Minimal' | 'Poor';

  // Financial & Maturity
  loanVsCashflow: 'Yes' | 'No';
  otherIncome: 'Yes' | 'No';
  businessKnowledge: 'Yes' | 'No';
  watchBusiness: 'Full Time' | 'Limited';
  bankAccount: 'CA & SA' | 'CA or SA' | 'None';
  cicCmapFindings: 'Current Status' | 'With Past Due' | 'None';

  // Other Personal
  medicalCondition: 'Yes' | 'No';
  civilStatus: 'Married' | 'Live-in' | 'Single';
  ageGroup: '20-65' | '<20 or >65';
  educationalAttainment: 'College Graduate' | 'College Undergrad' | 'HS Graduate' | 'HS Undergrad' | 'Elem. Graduate' | 'Elem. Undergrad';
  loanType: 'Renewal' | 'New' | 'New - APL';

  // Summaries
  sectionGrades: {
    character: number;
    capital: number;
    stability: number;
    businessStatus: number;
    financialMaturity: number;
    personalStatus: number;
  };
  totalGrade: number;
  riskScore: number;
  recommendation: 'Approved' | 'Declined' | 'Conditional';
  ciRemarks: string;
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
  creditScore?: CreditScore;
  cashflowReport?: CashflowReport;
  deniedComments?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'assignment' | 'status_change';
  assignmentId?: string;
  read: boolean;
  createdAt: string;
}
