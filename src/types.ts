export type UserRole = 'admin' | 'user' | 'coordinator' | 'supervisor';

export interface UserProfile {
  id: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  role: UserRole;
  isVerified?: boolean;
  photoURL?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export type AccountType = 'New' | 'Renewal' | 'Restructure' | 'Additional';
export type Tribe = 'NCR' | 'Rizal' | 'Mindoro' | 'Cavite';
export type MOP = 'Daily' | 'Weekly' | 'Semi-Monthly' | 'Monthly';
export type TOP = 'Collection' | 'PDC';
export type LoanCategory = 'SME' | 'MCL' | 'Seaman';
export type AssignmentStatus = 
  | 'Assigned' 
  | 'Start to Perform Assignment' 
  | 'Reviewing' 
  | 'Field CIBI' 
  | 'Cashflowing' 
  | 'Report Submitted' 
  | 'Pre-approved'
  | 'Approved' 
  | 'Denied'
  | 'Completed'
  | 'Archived';

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
  businessIncome: CashflowMonth;
  otherIncome: number;
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
    remarks: string;
    hasCollateral?: boolean;
    collateralType?: string;
    collateralValue100?: number;
    collateralValue70?: number;
    ltvPercentage?: number;
    amountAtRisk?: number;
    collaterals?: Array<{
      id: string;
      type: string;
      value100: number;
      value70: number;
    }>;
  };
  operationRecommendation: {
    loanAmount: number;
    term: number;
    interest: number;
    rate: number;
    monthlyAmort: number;
    semiMonthlyAmort: number;
    weeklyAmort: number;
    remarks: string;
  };
}

export interface CreditScore {
  // Catch-all for dynamic questions
  answers?: Record<string, string>;
  
  // Legacy fields (maintain for compatibility if needed, but we'll move to answers)
  neighbor1: 'Good' | 'Poor';
  neighbor2: 'Good' | 'Poor';
  barangayVerification: 'No Bad Records' | 'With Bad Records';
  loanHistory: 'Yes' | 'No';
  goodCreditBackground: 'Yes' | 'No' | 'None';
  cooperationOfApplicant: 'Very Cooperative' | 'Cooperative' | 'Poor';
  
  // Capital
  totalAssetLiabilities: 'Yes' | 'No';
  collateral: 'Yes' | 'No';
  
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
  loanType: 'Renewal' | 'New' | 'Additional';

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
  recommendation: 'Approved' | 'Denied' | 'Conditional';
  ciRemarks: string;
  isBusinessEnabled?: boolean;
  riskClassification?: string;
  finalGrade?: string;
}

export interface MCLCreditScore {
  answers?: Record<string, string>;
  character: {
    reputation: number;
    repaymentHistory: number;
    creditBackground: number;
    cooperation: number;
  };
  incomeCapacity: {
    stability: number;
    incomeVsAmort: number;
    otherIncome: number;
    bankAccount: number;
  };
  employmentBusiness: {
    typeOfWork: number;
    lengthOfService: number;
    consistency: number;
  };
  residence: {
    ownership: number;
    lengthOfStay: number;
    condition: number;
  };
  loanFactors: {
    purpose: number;
    downpayment: number;
    existingDebts: number;
    cicCmap: number;
  };
  totalScore: number;
  riskClassification: 'Low Risk' | 'Medium Risk' | 'High Risk';
  ciRemarks: string;
  isBusinessEnabled?: boolean;
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
  loanCategory: LoanCategory;
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
  mclCreditScore?: MCLCreditScore;
  cashflowReport?: CashflowReport;
  deniedComments?: string;
  archiveReason?: string;
  isMCLReferral?: boolean;
  aiAnalysis?: string;
  createdAt: string;
  assignedDate?: string;
  cashflowHistory?: CashflowReport[];
  survey?: {
    satisfaction: number;
    speed: number;
    clarity: number;
    affordability: number;
    customerService: number;
    recommend: 'Yes' | 'No';
    recommendExplanation: string;
    comments: string;
    createdAt: string;
  };
}

export interface CIStarAward {
  id: string;
  ciOfficerId: string;
  ciOfficerName: string;
  ciOfficerPhoto?: string;
  stars: number;
  accomplishment: string;
  month: number;
  year: number;
  dateAssigned: string;
  awardedBy: string;
  awardedById: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  status: 'ON TIME' | 'LATE' | 'UNDERTIME' | 'OVERTIME';
  tasks: string;
  itinerary?: string;
  plannedTasks?: string;
  coordinatorRemarks?: string;
  createdAt: string;
}

export type LeaveType = 'Sick Leave' | 'Vacation Leave' | 'Emergency Leave' | 'Maternity Leave' | 'Paternity Leave';
export type RequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: RequestStatus;
  remarks?: string;
  createdAt: string;
}

export interface OvertimeRequest {
  id: string;
  userId: string;
  userName: string;
  date: string;
  hours: number;
  minutes: number;
  reason: string;
  status: RequestStatus;
  remarks?: string;
  createdAt: string;
}

export interface OBRequest {
  id: string;
  userId: string;
  userName: string;
  startDate: string;
  endDate: string;
  hours?: number;
  minutes?: number;
  reason: string;
  status: RequestStatus;
  remarks?: string;
  createdAt: string;
}

export interface HousePhysicalInspectionComponent {
  component: string;
  description: string;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  depreciationPct: number;
}

export interface AdditionalImprovementItem {
  id: string;
  name: string;
  qtyArea: string;
  unitCost: number;
  newCost: number;
  depreciationPct: number;
  depreciatedValue: number;
}

export interface HouseImprovementAppraisal {
  enabled: boolean;
  
  // Particulars
  propertyOwner: string;
  propertyAddress: string;
  propertyType: string;
  lotArea: number;
  floorArea: number;
  noOfFloors: number;
  yearBuilt: string;
  estimatedAge: number;
  economicLife: number;
  constructionType: string;
  roofType: string;
  noOfBedrooms: number;
  noOfToiletAndBath: number;
  garage: string;
  overallCondition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  occupancy: 'Owner Occupied' | 'Tenant Occupied' | 'Vacant';
  roadAccessWidth: string;
  inspectionDate: string;
  appraiser: string;

  // A. Physical Inspection
  physicalComponents: HousePhysicalInspectionComponent[];
  overallPhysicalCondition: string;

  // B & C. Cost Approach
  constructionCostPerSqm: number;
  replacementCostNew: number;
  effectiveAge: number;
  economicLifeYears: number;
  straightLineDepreciationPct: number;
  depreciationAmount: number;
  depreciatedMainHouseValue: number;

  // D. Additional Improvements
  additionalImprovements: AdditionalImprovementItem[];
  totalImprovementCostNew: number;
  totalDepreciatedImprovementValue: number;

  // E. Comparable House Analysis
  comp1Location: string;
  comp2Location: string;
  comp3Location: string;

  comp1FloorArea: number;
  comp2FloorArea: number;
  comp3FloorArea: number;

  comp1LotArea: number;
  comp2LotArea: number;
  comp3LotArea: number;

  comp1YearBuilt: string;
  comp2YearBuilt: string;
  comp3YearBuilt: string;

  comp1Condition: string;
  comp2Condition: string;
  comp3Condition: string;

  comp1NoOfFloors: number;
  comp2NoOfFloors: number;
  comp3NoOfFloors: number;

  comp1Bedrooms: number;
  comp2Bedrooms: number;
  comp3Bedrooms: number;

  comp1ToiletBath: number;
  comp2ToiletBath: number;
  comp3ToiletBath: number;

  comp1Garage: string;
  comp2Garage: string;
  comp3Garage: string;

  comp1Construction: string;
  comp2Construction: string;
  comp3Construction: string;

  comp1Price: number;
  comp2Price: number;
  comp3Price: number;

  // Comparable Adjustments
  comp1LocationAdj: number;
  comp2LocationAdj: number;
  comp3LocationAdj: number;

  comp1FloorAreaAdj: number;
  comp2FloorAreaAdj: number;
  comp3FloorAreaAdj: number;

  comp1ConditionAdj: number;
  comp2ConditionAdj: number;
  comp3ConditionAdj: number;

  comp1AgeAdj: number;
  comp2AgeAdj: number;
  comp3AgeAdj: number;

  comp1QualityAdj: number;
  comp2QualityAdj: number;
  comp3QualityAdj: number;

  comp1AmenitiesAdj: number;
  comp2AmenitiesAdj: number;
  comp3AmenitiesAdj: number;

  comp1OtherAdj: number;
  comp2OtherAdj: number;
  comp3OtherAdj: number;

  // F. Final Reconciliation
  costApproachWeight: number;
  comparableApproachWeight: number;
  reconciledValue: number;
  recommendedImprovementValue: number;

  // G. Final Property & Lending Values
  landMarketValue: number;
  improvementMarketValue: number;
  totalMarketValue: number;
  forcedSaleValuePct: number;
  forcedSaleValue: number;
  maxLtvPct: number;
  maxLoanableAmount: number;
  recommendedCollateralValue: number;
}

export interface TraverseLine {
  id: string;
  fromPoint: number;
  toPoint: number;
  quadrant: 'N-E' | 'S-E' | 'S-W' | 'N-W' | 'DUE-N' | 'DUE-E' | 'DUE-S' | 'DUE-W';
  deg: number;
  min: number;
  sec?: number;
  distance: number;
  bearingString?: string;
  azimuthDeg?: number;
  deltaE?: number;
  deltaN?: number;
  boundaryDescription?: string;
}

export interface LotCoordinate {
  point: number;
  label: string;
  x: number; // Easting (meters)
  y: number; // Northing (meters)
  adjustedX?: number;
  adjustedY?: number;
}

export interface TiePoint {
  monumentName: string;
  quadrant: 'N-E' | 'S-E' | 'S-W' | 'N-W' | 'DUE-N' | 'DUE-E' | 'DUE-S' | 'DUE-W';
  deg: number;
  min: number;
  sec?: number;
  distance: number;
  bearingString: string;
  eastingOffset?: number;
  northingOffset?: number;
}

export interface LotPlottingData {
  propertyId: string;
  lotNo: string;
  surveyPlan: string;
  titleNo: string;
  location: string;
  statedArea: number;
  numberOfCorners: number;
  plotStatus: 'Verified' | 'Discrepancy' | 'Draft' | 'Needs Review';
  tiePoint?: TiePoint;
  traverses: TraverseLine[];
  coordinates: LotCoordinate[];
  computedArea: number;
  areaDifference: number;
  areaVariancePct: number;
  areaMatchStatus: 'PASS' | 'DISCREPANCY';
  linearMisclosure: number;
  closureRatio: string;
  closureRatioNumber: number;
  closureStatus: 'GOOD' | 'FAIR' | 'HIGH_MISCLOSURE';
  lotShape: 'Regular Rectangular' | 'Square' | 'Trapezoidal' | 'Triangular' | 'Irregular' | 'Corner Lot';
  frontageMeters: number;
  depthMeters: number;
  roadWidth: string;
  roadAccessType: string;
  boundaryNorth?: string;
  boundaryEast?: string;
  boundarySouth?: string;
  boundaryWest?: string;
  notes?: string;
}

export interface RealPropertyAppraisal {
  type: 'real_property';
  borrower: string;
  propertyOwner: string;
  propertyAddress: string;
  inspectionDate: string;
  appraiser: string;
  titleNo: string;
  taxDecNo: string;
  lotArea: number;
  floorArea: number;
  propertyType: 'Residential' | 'Commercial' | 'Agricultural' | 'Industrial' | 'Mixed-Use';
  
  // House / Improvement Appraisal (Separate or Integrated)
  houseImprovement?: HouseImprovementAppraisal;
  
  // Lot Plotting & Boundary Analysis
  lotPlotting?: LotPlottingData;
  
  // Description
  terrain: string;
  roadAccess: string;
  floodCondition: string;
  utilitiesAvailable: string[];
  neighborhoodClassification: string;
  highestAndBestUse: string;
  descriptionRemarks: string;

  // Comparables
  subjectLocation: string;
  comp1Location: string;
  comp2Location: string;
  comp3Location: string;
  
  comp1Distance: string;
  comp2Distance: string;
  comp3Distance: string;

  comp1DateSold: string;
  comp2DateSold: string;
  comp3DateSold: string;

  subjectLotArea: number;
  comp1LotArea: number;
  comp2LotArea: number;
  comp3LotArea: number;

  subjectFloorArea: number;
  comp1FloorArea: number;
  comp2FloorArea: number;
  comp3FloorArea: number;

  comp1Price: number;
  comp2Price: number;
  comp3Price: number;

  subjectRoadCondition: string;
  comp1RoadCondition: string;
  comp2RoadCondition: string;
  comp3RoadCondition: string;

  subjectCornerLot: boolean;
  comp1CornerLot: boolean;
  comp2CornerLot: boolean;
  comp3CornerLot: boolean;

  subjectPropertyCondition: string;
  comp1PropertyCondition: string;
  comp2PropertyCondition: string;
  comp3PropertyCondition: string;

  subjectImprovements: string;
  comp1Improvements: string;
  comp2Improvements: string;
  comp3Improvements: string;

  subjectBuildingAge: number;
  comp1BuildingAge: number;
  comp2BuildingAge: number;
  comp3BuildingAge: number;

  // Adjustments
  comp1LocationAdj: number;
  comp2LocationAdj: number;
  comp3LocationAdj: number;

  comp1LotSizeAdj: number;
  comp2LotSizeAdj: number;
  comp3LotSizeAdj: number;

  comp1BuildingSizeAdj: number;
  comp2BuildingSizeAdj: number;
  comp3BuildingSizeAdj: number;

  comp1ConditionAdj: number;
  comp2ConditionAdj: number;
  comp3ConditionAdj: number;

  comp1RoadAccessAdj: number;
  comp2RoadAccessAdj: number;
  comp3RoadAccessAdj: number;

  comp1OtherAdj: number;
  comp2OtherAdj: number;
  comp3OtherAdj: number;

  // Results
  opinion: 'Highly Acceptable' | 'Acceptable' | 'Acceptable with Conditions' | 'Not Recommended';
  opinionRemarks: string;
  recommendedLoanAmount: number;
  appliedLoanAmount?: number;
  targetLtv?: number;

  // Photos checklist
  photoChecklist: Record<string, boolean>;
}

export interface VehicleAppraisal {
  type: 'vehicle';
  borrower: string;
  registeredOwner: string;
  make: string;
  model: string;
  variant: string;
  yearModel: string;
  plateNumber: string;
  engineNumber: string;
  chassisNumber: string;
  mileage: number;

  // Comparables
  comp1Year: string;
  comp2Year: string;
  comp3Year: string;

  comp1Mileage: number;
  comp2Mileage: number;
  comp3Mileage: number;

  comp1Condition: string;
  comp2Condition: string;
  comp3Condition: string;

  comp1Transmission: string;
  comp2Transmission: string;
  comp3Transmission: string;

  comp1Price: number;
  comp2Price: number;
  comp3Price: number;

  comp1Source: string;
  comp2Source: string;
  comp3Source: string;

  // Adjustments
  comp1MileageAdj: number;
  comp2MileageAdj: number;
  comp3MileageAdj: number;

  comp1ConditionAdj: number;
  comp2ConditionAdj: number;
  comp3ConditionAdj: number;

  comp1AccessoriesAdj: number;
  comp2AccessoriesAdj: number;
  comp3AccessoriesAdj: number;

  comp1YearModelAdj: number;
  comp2YearModelAdj: number;
  comp3YearModelAdj: number;

  // Final Valuation
  recommendedLoanAmount: number;
  appliedLoanAmount?: number;
  targetLtv?: number;

  // Photos checklist
  photoChecklist: Record<string, boolean>;
}

export interface AppraisalRecord {
  id?: string;
  userId: string;
  reportNumber?: string;
  appraiserName: string;
  title: string;
  reportType: 'real_property' | 'vehicle';
  borrowerName: string;
  marketValue: number;
  recommendedLoan: number;
  appliedLoanAmount?: number;
  targetLtv?: number;
  riskLevel?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  status?: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'ARCHIVED';
  data: RealPropertyAppraisal | VehicleAppraisal;
  createdAt: string;
  updatedAt?: string;
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
