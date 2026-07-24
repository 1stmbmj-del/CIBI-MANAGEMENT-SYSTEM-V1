import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Car, 
  Calculator, 
  Save, 
  Printer, 
  CheckSquare, 
  Square, 
  Plus, 
  Sparkles, 
  Trash2, 
  Search, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Eye,
  TrendingUp,
  DollarSign,
  Download,
  FolderOpen,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Percent,
  Scale,
  ArrowUpRight,
  Info,
  BarChart3
} from 'lucide-react';
import { UserProfile, RealPropertyAppraisal, VehicleAppraisal, AppraisalRecord } from '../types';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';

interface AppraisalCalculatorProps {
  user: UserProfile;
}

// ==========================================
// PRESET OPTIONS & RECOMMENDED DEFAULTS
// ==========================================
const TERRAIN_OPTIONS = [
  'Flat Level',
  'Gently Sloping',
  'Moderately Sloping',
  'Steep / Hilly',
  'Rolling Terrain',
  'Low-Lying / Below Road Level'
];

const ROAD_ACCESS_OPTIONS = [
  '8m Wide Concrete Road',
  '10m Wide Concrete Road',
  '12m Main Thoroughfare',
  '6m Wide Concrete Alley',
  'Asphalt Paved Road',
  'Gravel Access Road',
  'Dirt / Unpaved Passageway',
  'Right of Way Passageway'
];

const FLOOD_CONDITION_OPTIONS = [
  'Flood Free / High Elevation',
  'Low Flood Risk (Gutter Deep)',
  'Moderate Flood Risk (Knee Deep)',
  'High Flood Risk (Waist Deep)',
  'Typhoon / Tidal Prone Zone'
];

const NEIGHBORHOOD_OPTIONS = [
  'Low-Density Residential',
  'Medium-Density Residential',
  'High-Density Commercial',
  'Mixed Commercial / Residential',
  'Agricultural / Open Space',
  'Industrial Zone / Estate',
  'Subdivision / Gated Community'
];

const HIGHEST_BEST_USE_OPTIONS = [
  'Single Family Residential',
  'Multi-Family Residential / Apartment',
  'Commercial Retail / Office Space',
  'Mixed Commercial & Residential',
  'Warehousing / Light Industrial',
  'Agricultural Farming / Poultry'
];

const ROAD_CONDITION_OPTIONS = [
  'Concrete Paved',
  'Concrete',
  'Asphalt Paved',
  'Gravel Access',
  'Dirt / Unpaved Road',
  'Paved with Drainage'
];

const PROPERTY_CONDITION_OPTIONS = [
  'Good Condition',
  'Newly Built',
  'Fair Condition / Minor Repairs Needed',
  'Poor Condition / Major Rehabilitation',
  'Dilapidated Structure'
];

const IMPROVEMENTS_OPTIONS = [
  '2-Storey Concrete Structure with Fence',
  '2-Storey Concrete Structure',
  '1-Storey Concrete Bungalow',
  '2-Storey Semi-Concrete Structure',
  'Commercial Storefront / Office',
  'Bare Lot (No Improvements)',
  'Warehouse Building'
];

const VEHICLE_MAKE_OPTIONS = [
  'Toyota',
  'Mitsubishi',
  'Isuzu',
  'Nissan',
  'Ford',
  'Honda',
  'Hyundai',
  'Kia',
  'Suzuki',
  'Mazda',
  'Fuso / Hino Truck'
];

const TRANSMISSION_OPTIONS = [
  'Automatic',
  'Manual',
  'CVT Automatic',
  'Dual-Clutch (DCT)'
];

const VEHICLE_CONDITION_OPTIONS = [
  'Good Condition',
  'Excellent / Showroom',
  'Fair / Normal Wear',
  'Needs Minor Mechanical Repair',
  'Poor / High Mileage & Damaged'
];

const VEHICLE_SOURCE_OPTIONS = [
  'Facebook Marketplace',
  'Used Car Dealer',
  'Direct Owner Sale',
  'Online Car Portal (AutoDeal/Carousell)',
  'Bank Foreclosed Asset Sales',
  'Auction Sale'
];

const REAL_PROPERTY_CHECKLIST = [
  'Front View',
  'Rear View',
  'Left Side',
  'Right Side',
  'Living Room',
  'Kitchen',
  'Bedrooms',
  'Toilet & Bath',
  'Street View',
  'Landmark',
  'GPS Coordinates'
];

const VEHICLE_CHECKLIST = [
  'Front',
  'Rear',
  'Left Side',
  'Right Side',
  'Dashboard (Mileage)',
  'Engine Bay',
  'Chassis Number',
  'Engine Number',
  'Interior',
  'Tires',
  'OR/CR'
];

// Reusable Select component with Recommended option highlight & custom text toggle
const SelectWithRecommended = ({
  label,
  value,
  onChange,
  options,
  recommendedValue
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  recommendedValue?: string;
}) => {
  const rec = recommendedValue || options[0];
  const isCustom = Boolean(value && !options.includes(value));

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">{label}</label>
        {rec && (
          <button
            type="button"
            onClick={() => onChange(rec)}
            className="text-[9px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
            title="Click to apply recommended option"
          >
            <Sparkles className="w-2.5 h-2.5 text-emerald-600 flex-shrink-0" /> Rec: {rec.length > 20 ? rec.substring(0, 18) + '...' : rec}
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        <select
          value={isCustom ? '__CUSTOM__' : value}
          onChange={(e) => {
            if (e.target.value === '__CUSTOM__') {
              onChange('');
            } else {
              onChange(e.target.value);
            }
          }}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt === rec ? `⭐ ${opt} (Recommended)` : opt}
            </option>
          ))}
          <option value="__CUSTOM__">✏️ Enter custom option...</option>
        </select>

        {isCustom && (
          <input
            type="text"
            placeholder={`Enter custom ${label.toLowerCase()}...`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        )}
      </div>
    </div>
  );
};

// Reusable Collateral Risk Analysis Component
const CollateralRiskAnalysisCard = ({
  appliedLoanAmount,
  setAppliedLoanAmount,
  marketValue,
  targetLtv,
  setTargetLtv,
  fmt
}: {
  appliedLoanAmount: number;
  setAppliedLoanAmount: (val: number) => void;
  marketValue: number;
  targetLtv: number;
  setTargetLtv: (val: number) => void;
  fmt: (num: number) => string;
}) => {
  const ltvCeilingValue = marketValue * (targetLtv / 100);
  const forcedSaleValue = ltvCeilingValue * 0.80; // 80% of LTV ceiling
  const effectiveLtvRatio = marketValue > 0 ? (appliedLoanAmount / marketValue) * 100 : 0;
  const collateralMargin = marketValue - appliedLoanAmount;
  const forcedSaleSafetyMargin = forcedSaleValue - appliedLoanAmount;
  const unsecuredExposure = Math.max(0, appliedLoanAmount - forcedSaleValue);

  // Risk Rating Logic
  let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
  let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  let icon = <ShieldCheck className="w-5 h-5 text-emerald-600" />;
  let riskMessage = 'Low Risk: Requested loan is 100% fully covered by Forced Sale Value safety threshold.';

  if (effectiveLtvRatio <= 50 || appliedLoanAmount <= forcedSaleValue) {
    riskLevel = 'LOW';
    badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    icon = <ShieldCheck className="w-5 h-5 text-emerald-600" />;
    riskMessage = 'LOW RISK: Excellent collateral backing! Requested loan is safely within Forced Sale Liquidation Value.';
  } else if (effectiveLtvRatio <= targetLtv) {
    riskLevel = 'MODERATE';
    badgeColor = 'bg-teal-100 text-teal-800 border-teal-300';
    icon = <ShieldCheck className="w-5 h-5 text-teal-600" />;
    riskMessage = `MODERATE RISK: Within standard ${targetLtv}% LTV policy cap. Healthy collateral buffer available.`;
  } else if (effectiveLtvRatio <= 85) {
    riskLevel = 'HIGH';
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
    icon = <AlertTriangle className="w-5 h-5 text-amber-600" />;
    riskMessage = `HIGH RISK: Exceeds standard ${targetLtv}% LTV ceiling by ${fmt(appliedLoanAmount - ltvCeilingValue)}. Requires Credit Committee Special Approval or Additional Co-Maker.`;
  } else {
    riskLevel = 'CRITICAL';
    badgeColor = 'bg-red-100 text-red-800 border-red-300';
    icon = <ShieldAlert className="w-5 h-5 text-red-600" />;
    riskMessage = `CRITICAL RISK: Highly over-collateralized/under-secured! Uncovered risk exposure is ${fmt(unsecuredExposure)}. Strongly recommended to reduce loan amount or demand additional real estate/vehicle collateral.`;
  }

  // Quick Loan Presets
  const applyPresetLtv = (pct: number) => {
    setTargetLtv(pct);
    setAppliedLoanAmount(Math.round(marketValue * (pct / 100)));
  };

  const applyPresetFsv = () => {
    setAppliedLoanAmount(Math.round(forcedSaleValue));
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white rounded-2xl p-6 shadow-xl border border-emerald-500/30 space-y-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4 relative z-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-[10px] font-black uppercase tracking-wider mb-1">
            <Scale className="w-3 h-3" /> Real-time Credit Risk vs Collateral Value Engine
          </div>
          <h2 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
            Collateral Risk & Loan Calculator
          </h2>
        </div>

        {/* Risk Badge */}
        <div className={`px-3.5 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md ${badgeColor}`}>
          {icon}
          <span>{riskLevel} RISK ({effectiveLtvRatio.toFixed(1)}% LTV)</span>
        </div>
      </div>

      {/* Input Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 relative z-10">
        {/* Applied Loan Amount Input */}
        <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 space-y-3">
          <label className="block text-[10px] font-black text-emerald-300 uppercase tracking-wider">
            Applied / Requested Loan Amount (₱)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-black text-lg">₱</span>
            <input
              type="number"
              value={appliedLoanAmount || ''}
              onChange={(e) => setAppliedLoanAmount(Number(e.target.value))}
              placeholder="e.g. 2500000"
              className="w-full pl-8 pr-4 py-2.5 bg-white/10 border-2 border-emerald-400/40 rounded-xl text-lg font-black text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white/20 transition-all"
            />
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider self-center mr-1">Quick Apply:</span>
            <button
              type="button"
              onClick={applyPresetFsv}
              className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/40 border border-amber-400/40 text-amber-200 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all"
            >
              FSV (80% of LTV)
            </button>
            {[50, 60, 70, 75, 80].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => applyPresetLtv(pct)}
                className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all border ${
                  targetLtv === pct && Math.round(marketValue * (pct / 100)) === appliedLoanAmount
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-md'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/10'
                }`}
              >
                {pct}% LTV
              </button>
            ))}
          </div>
        </div>

        {/* LTV Policy Cap Setting */}
        <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] font-black text-emerald-300 uppercase tracking-wider">
              Target LTV Cap Policy (%)
            </label>
            <span className="text-xs font-black text-emerald-400">{targetLtv}% Ceiling</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {[50, 60, 70, 75, 80].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setTargetLtv(pct)}
                className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  targetLtv === pct 
                    ? 'bg-emerald-500 text-white ring-2 ring-emerald-300 shadow-lg' 
                    : 'bg-white/10 hover:bg-white/20 text-slate-300'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>

          <p className="text-[10px] text-slate-400 italic">
            Standard commercial lending threshold is 70% of appraised Market Value.
          </p>
        </div>
      </div>

      {/* Calculated Risk Breakdown Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Appraised Market Value</span>
          <p className="text-sm sm:text-base font-black text-white mt-1">{fmt(marketValue)}</p>
          <span className="text-[9px] text-emerald-400 font-bold">100% Baseline</span>
        </div>

        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Max Allowable ({targetLtv}% LTV)</span>
          <p className="text-sm sm:text-base font-black text-teal-300 mt-1">{fmt(ltvCeilingValue)}</p>
          <span className="text-[9px] text-teal-400 font-bold">Policy Ceiling</span>
        </div>

        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Forced Sale Value (FSV)</span>
          <p className="text-sm sm:text-base font-black text-amber-300 mt-1">{fmt(forcedSaleValue)}</p>
          <span className="text-[9px] text-amber-400 font-bold">Liquidation Value</span>
        </div>

        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Net Safety Buffer</span>
          <p className={`text-sm sm:text-base font-black mt-1 ${collateralMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {collateralMargin >= 0 ? `+${fmt(collateralMargin)}` : `-${fmt(Math.abs(collateralMargin))}`}
          </p>
          <span className="text-[9px] text-slate-400 font-bold">Market Cover</span>
        </div>
      </div>

      {/* Visual Collateral & Loan Meter Bar */}
      <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2 relative z-10">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-300">
          <span>Collateral Exposure Meter</span>
          <span className="text-emerald-300">{effectiveLtvRatio.toFixed(1)}% LTV Applied</span>
        </div>

        <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 relative flex items-center border border-white/20">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              effectiveLtvRatio <= 50 ? 'bg-emerald-500' :
              effectiveLtvRatio <= targetLtv ? 'bg-teal-400' :
              effectiveLtvRatio <= 85 ? 'bg-amber-400' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(5, effectiveLtvRatio))}%` }}
          />

          {/* Markers */}
          <div className="absolute left-[56%] top-0 bottom-0 w-0.5 bg-amber-400/80" title="FSV (56%)" />
          <div className={`absolute left-[${targetLtv}%] top-0 bottom-0 w-0.5 bg-emerald-400`} title={`Target LTV (${targetLtv}%)`} />
        </div>

        <div className="flex justify-between text-[9px] font-bold text-slate-400 pt-0.5">
          <span>₱0</span>
          <span className="text-amber-300">FSV ({fmt(forcedSaleValue)})</span>
          <span className="text-teal-300">{targetLtv}% LTV Cap ({fmt(ltvCeilingValue)})</span>
          <span className="text-white">MV ({fmt(marketValue)})</span>
        </div>
      </div>

      {/* Actionable Risk Advisory */}
      <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 flex items-start gap-3 relative z-10 text-xs">
        <Info className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-extrabold text-white uppercase tracking-wider text-[11px]">Appraisal Risk Factor Recommendation</p>
          <p className="text-slate-200 font-medium leading-relaxed">{riskMessage}</p>
        </div>
      </div>
    </div>
  );
};

export default function AppraisalCalculator({ user }: AppraisalCalculatorProps) {
  const [activeTab, setActiveTab] = useState<'real_property' | 'vehicle' | 'history'>('real_property');
  const [appraisals, setAppraisals] = useState<AppraisalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [printModalRecord, setPrintModalRecord] = useState<AppraisalRecord | null>(null);

  // ==========================================
  // REAL PROPERTY STATE
  // ==========================================
  const initialRealPropertyState: RealPropertyAppraisal = {
    type: 'real_property',
    borrower: '',
    propertyOwner: '',
    propertyAddress: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    appraiser: user.fullName || '',
    titleNo: '',
    taxDecNo: '',
    lotArea: 150,
    floorArea: 120,
    propertyType: 'Residential',

    terrain: 'Flat Level',
    roadAccess: '8m Wide Concrete Road',
    floodCondition: 'Flood Free / High Elevation',
    utilitiesAvailable: ['Electricity', 'Water', 'Internet'],
    neighborhoodClassification: 'Low-Density Residential',
    highestAndBestUse: 'Single Family Residential',
    descriptionRemarks: 'Property is situated in a well-developed residential subdivision.',

    subjectLocation: 'Subdivision Phase 1, City Proper',
    comp1Location: 'Subdivision Phase 1, Lot 12',
    comp2Location: 'Subdivision Phase 2, Lot 5',
    comp3Location: 'Adjacent Barangay 500m away',

    comp1Distance: '100 meters',
    comp2Distance: '350 meters',
    comp3Distance: '600 meters',

    comp1DateSold: '1 month ago',
    comp2DateSold: '2 months ago',
    comp3DateSold: '3 months ago',

    subjectLotArea: 150,
    comp1LotArea: 160,
    comp2LotArea: 140,
    comp3LotArea: 180,

    subjectFloorArea: 120,
    comp1FloorArea: 130,
    comp2FloorArea: 110,
    comp3FloorArea: 150,

    comp1Price: 3800000,
    comp2Price: 3400000,
    comp3Price: 4200000,

    subjectRoadCondition: 'Concrete',
    comp1RoadCondition: 'Concrete',
    comp2RoadCondition: 'Concrete',
    comp3RoadCondition: 'Gravel Access',

    subjectCornerLot: false,
    comp1CornerLot: true,
    comp2CornerLot: false,
    comp3CornerLot: false,

    subjectPropertyCondition: 'Good Condition',
    comp1PropertyCondition: 'Newly Built',
    comp2PropertyCondition: 'Good Condition',
    comp3PropertyCondition: 'Fair / Needs Painting',

    subjectImprovements: '2-Storey Concrete Structure with Fence',
    comp1Improvements: '2-Storey Concrete Structure',
    comp2Improvements: '1-Storey Concrete Bungalow',
    comp3Improvements: '2-Storey Concrete Structure',

    subjectBuildingAge: 5,
    comp1BuildingAge: 2,
    comp2BuildingAge: 6,
    comp3BuildingAge: 10,

    // Adjustments
    comp1LocationAdj: 0,
    comp2LocationAdj: 50000,
    comp3LocationAdj: 100000,

    comp1LotSizeAdj: -100000,
    comp2LotSizeAdj: 50000,
    comp3LotSizeAdj: -150000,

    comp1BuildingSizeAdj: -80000,
    comp2BuildingSizeAdj: 60000,
    comp3BuildingSizeAdj: -120000,

    comp1ConditionAdj: -100000,
    comp2ConditionAdj: 0,
    comp3ConditionAdj: 150000,

    comp1RoadAccessAdj: 0,
    comp2RoadAccessAdj: 0,
    comp3RoadAccessAdj: 80000,

    comp1OtherAdj: -50000,
    comp2OtherAdj: 0,
    comp3OtherAdj: 0,

    opinion: 'Acceptable',
    opinionRemarks: 'Subject property possesses sound structural integrity and favorable marketability.',
    recommendedLoanAmount: 0,

    photoChecklist: REAL_PROPERTY_CHECKLIST.reduce((acc, item) => ({ ...acc, [item]: true }), {})
  };

  const [realProp, setRealProp] = useState<RealPropertyAppraisal>(initialRealPropertyState);
  const [realTargetLtv, setRealTargetLtv] = useState<number>(70);
  const [appliedRealLoanAmount, setAppliedRealLoanAmount] = useState<number>(2000000);

  // ==========================================
  // VEHICLE STATE
  // ==========================================
  const initialVehicleState: VehicleAppraisal = {
    type: 'vehicle',
    borrower: '',
    registeredOwner: '',
    make: 'Toyota',
    model: 'Hilux',
    variant: '2.4 G 4x2 AT',
    yearModel: '2022',
    plateNumber: 'NBF 1234',
    engineNumber: '2GD1234567',
    chassisNumber: 'MHFJ123456789',
    mileage: 35000,

    comp1Year: '2022',
    comp2Year: '2022',
    comp3Year: '2021',

    comp1Mileage: 30000,
    comp2Mileage: 45000,
    comp3Mileage: 50000,

    comp1Condition: 'Good Condition',
    comp2Condition: 'Good Condition',
    comp3Condition: 'Fair Condition / Minor Repairs Needed',

    comp1Transmission: 'Automatic',
    comp2Transmission: 'Automatic',
    comp3Transmission: 'Manual',

    comp1Price: 1150000,
    comp2Price: 1080000,
    comp3Price: 980000,

    comp1Source: 'Facebook Marketplace',
    comp2Source: 'Used Car Dealer',
    comp3Source: 'Direct Owner Sale',

    // Adjustments
    comp1MileageAdj: -20000,
    comp2MileageAdj: 30000,
    comp3MileageAdj: 40000,

    comp1ConditionAdj: -30000,
    comp2ConditionAdj: 0,
    comp3ConditionAdj: 50000,

    comp1AccessoriesAdj: -10000,
    comp2AccessoriesAdj: 10000,
    comp3AccessoriesAdj: 20000,

    comp1YearModelAdj: 0,
    comp2YearModelAdj: 0,
    comp3YearModelAdj: 60000,

    recommendedLoanAmount: 0,

    photoChecklist: VEHICLE_CHECKLIST.reduce((acc, item) => ({ ...acc, [item]: true }), {})
  };

  const [vehicle, setVehicle] = useState<VehicleAppraisal>(initialVehicleState);
  const [vehicleTargetLtv, setVehicleTargetLtv] = useState<number>(70);
  const [appliedVehicleLoanAmount, setAppliedVehicleLoanAmount] = useState<number>(750000);

  // Load history from Firestore
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'appraisals'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppraisalRecord[];
      setAppraisals(records);
      setLoading(false);
    }, () => {
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Format currency helpers
  const fmt = (num: number) => `₱${(num || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ==========================================
  // REAL PROPERTY AUTO-CALCULATIONS
  // ==========================================
  const comp1Ppsqm = realProp.comp1LotArea > 0 ? realProp.comp1Price / realProp.comp1LotArea : 0;
  const comp2Ppsqm = realProp.comp2LotArea > 0 ? realProp.comp2Price / realProp.comp2LotArea : 0;
  const comp3Ppsqm = realProp.comp3LotArea > 0 ? realProp.comp3Price / realProp.comp3LotArea : 0;

  const comp1AdjTotal = realProp.comp1Price + realProp.comp1LocationAdj + realProp.comp1LotSizeAdj + realProp.comp1BuildingSizeAdj + realProp.comp1ConditionAdj + realProp.comp1RoadAccessAdj + realProp.comp1OtherAdj;
  const comp2AdjTotal = realProp.comp2Price + realProp.comp2LocationAdj + realProp.comp2LotSizeAdj + realProp.comp2BuildingSizeAdj + realProp.comp2ConditionAdj + realProp.comp2RoadAccessAdj + realProp.comp2OtherAdj;
  const comp3AdjTotal = realProp.comp3Price + realProp.comp3LocationAdj + realProp.comp3LotSizeAdj + realProp.comp3BuildingSizeAdj + realProp.comp3ConditionAdj + realProp.comp3RoadAccessAdj + realProp.comp3OtherAdj;

  const realAverageMarketValue = (comp1AdjTotal + comp2AdjTotal + comp3AdjTotal) / 3;
  const realLtv70 = realAverageMarketValue * (realTargetLtv / 100);
  const realForcedSaleValue = realLtv70 * 0.80; // 80% of LTV

  // Auto set recommended loan if not user overridden
  useEffect(() => {
    if (realProp.recommendedLoanAmount === 0 || realProp.recommendedLoanAmount === Math.round(realForcedSaleValue)) {
      setRealProp(prev => ({ ...prev, recommendedLoanAmount: Math.round(realForcedSaleValue) }));
    }
  }, [realForcedSaleValue]);

  // Sync appliedRealLoanAmount to default on init
  useEffect(() => {
    if (!appliedRealLoanAmount || appliedRealLoanAmount === 2000000) {
      setAppliedRealLoanAmount(Math.round(realForcedSaleValue));
    }
  }, [realAverageMarketValue]);

  // ==========================================
  // VEHICLE AUTO-CALCULATIONS
  // ==========================================
  const vComp1AdjTotal = vehicle.comp1Price + vehicle.comp1MileageAdj + vehicle.comp1ConditionAdj + vehicle.comp1AccessoriesAdj + vehicle.comp1YearModelAdj;
  const vComp2AdjTotal = vehicle.comp2Price + vehicle.comp2MileageAdj + vehicle.comp2ConditionAdj + vehicle.comp2AccessoriesAdj + vehicle.comp2YearModelAdj;
  const vComp3AdjTotal = vehicle.comp3Price + vehicle.comp3MileageAdj + vehicle.comp3ConditionAdj + vehicle.comp3AccessoriesAdj + vehicle.comp3YearModelAdj;

  const vehicleAverageMarketValue = (vComp1AdjTotal + vComp2AdjTotal + vComp3AdjTotal) / 3;
  const vehicleLtv70 = vehicleAverageMarketValue * (vehicleTargetLtv / 100);
  const vehicleForcedSaleValue = vehicleLtv70 * 0.80;

  useEffect(() => {
    if (vehicle.recommendedLoanAmount === 0 || vehicle.recommendedLoanAmount === Math.round(vehicleForcedSaleValue)) {
      setVehicle(prev => ({ ...prev, recommendedLoanAmount: Math.round(vehicleForcedSaleValue) }));
    }
  }, [vehicleForcedSaleValue]);

  useEffect(() => {
    if (!appliedVehicleLoanAmount || appliedVehicleLoanAmount === 750000) {
      setAppliedVehicleLoanAmount(Math.round(vehicleForcedSaleValue));
    }
  }, [vehicleAverageMarketValue]);

  // Save handlers
  const handleSaveRealProperty = async () => {
    if (!realProp.borrower) {
      alert("Please enter Borrower Name first!");
      return;
    }
    try {
      const realDataToSave: RealPropertyAppraisal = {
        ...realProp,
        appliedLoanAmount: appliedRealLoanAmount,
        targetLtv: realTargetLtv
      };

      const payload: Omit<AppraisalRecord, 'id'> = {
        userId: user.id,
        appraiserName: user.fullName || realProp.appraiser,
        title: `Real Property Appraisal - ${realProp.borrower}`,
        reportType: 'real_property',
        borrowerName: realProp.borrower,
        marketValue: realAverageMarketValue,
        recommendedLoan: realProp.recommendedLoanAmount,
        data: realDataToSave,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'appraisals'), payload);
      alert("Real Property Appraisal saved successfully!");
      setActiveTab('history');
    } catch (e) {
      console.error("Error saving real property appraisal:", e);
      alert("Saved locally! (Database synchronization error)");
    }
  };

  const handleSaveVehicle = async () => {
    if (!vehicle.borrower) {
      alert("Please enter Borrower Name first!");
      return;
    }
    try {
      const vehicleDataToSave: VehicleAppraisal = {
        ...vehicle,
        appliedLoanAmount: appliedVehicleLoanAmount,
        targetLtv: vehicleTargetLtv
      };

      const payload: Omit<AppraisalRecord, 'id'> = {
        userId: user.id,
        appraiserName: user.fullName || vehicle.registeredOwner || 'Appraiser',
        title: `Vehicle Appraisal - ${vehicle.borrower}`,
        reportType: 'vehicle',
        borrowerName: vehicle.borrower,
        marketValue: vehicleAverageMarketValue,
        recommendedLoan: vehicle.recommendedLoanAmount,
        data: vehicleDataToSave,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'appraisals'), payload);
      alert("Vehicle Appraisal saved successfully!");
      setActiveTab('history');
    } catch (e) {
      console.error("Error saving vehicle appraisal:", e);
      alert("Saved locally! (Database synchronization error)");
    }
  };

  const handleDeleteAppraisal = async (id?: string) => {
    if (!id) return;
    if (confirm("Are you sure you want to delete this appraisal record?")) {
      try {
        await deleteDoc(doc(db, 'appraisals', id));
      } catch (e) {
        console.error("Error deleting appraisal:", e);
      }
    }
  };

  const filteredHistory = appraisals.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.appraiserName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-black uppercase tracking-wider mb-3">
              <Calculator className="w-3.5 h-3.5" /> Three Comparable Valuation Calculator
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              Appraisal Calculator
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-2xl font-medium">
              Real Property & Vehicle Valuation using the Three Comparable Sales Approach & Market Analysis.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setActiveTab('real_property')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'real_property' 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                  : 'bg-white/10 hover:bg-white/20 text-white/80'
              }`}
            >
              <Building2 className="w-4 h-4" /> Real Property
            </button>
            <button
              onClick={() => setActiveTab('vehicle')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'vehicle' 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                  : 'bg-white/10 hover:bg-white/20 text-white/80'
              }`}
            >
              <Car className="w-4 h-4" /> Vehicle
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'history' 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                  : 'bg-white/10 hover:bg-white/20 text-white/80'
              }`}
            >
              <FolderOpen className="w-4 h-4" /> Saved Appraisals ({appraisals.length})
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* REAL PROPERTY APPRAISAL TAB                               */}
      {/* ========================================================= */}
      {activeTab === 'real_property' && (
        <div className="space-y-6">
          {/* Quick Metrics & Preset Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Average Market Value</span>
              <p className="text-xl font-black text-emerald-900 mt-1">{fmt(realAverageMarketValue)}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">3-Comparable Reconciliation</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Loan-to-Value (70%)</span>
              <p className="text-xl font-black text-teal-800 mt-1">{fmt(realLtv70)}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">70% Max Ceiling</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Forced Sale Value (80% of LTV)</span>
              <p className="text-xl font-black text-amber-700 mt-1">{fmt(realForcedSaleValue)}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Liquidation Safety Standard</p>
            </div>
            <div className="bg-emerald-900 text-white rounded-2xl p-5 border border-emerald-800 shadow-md flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-300 tracking-wider">Recommended Loan Amount</span>
                <p className="text-2xl font-black text-white mt-1">{fmt(realProp.recommendedLoanAmount)}</p>
              </div>
              <button
                onClick={handleSaveRealProperty}
                className="mt-3 w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                <Save className="w-3.5 h-3.5" /> Save Real Property Report
              </button>
            </div>
          </div>

          {/* I. General Information */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-black text-emerald-900 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" /> I. General Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Borrower *</label>
                <input
                  type="text"
                  placeholder="e.g. Juan De La Cruz"
                  value={realProp.borrower}
                  onChange={e => setRealProp({ ...realProp, borrower: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Property Owner</label>
                <input
                  type="text"
                  placeholder="e.g. Juan De La Cruz & Maria De La Cruz"
                  value={realProp.propertyOwner}
                  onChange={e => setRealProp({ ...realProp, propertyOwner: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Property Address</label>
                <input
                  type="text"
                  placeholder="Lot 5, Blk 2, Evergreen Subdivision, Davao City"
                  value={realProp.propertyAddress}
                  onChange={e => setRealProp({ ...realProp, propertyAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Inspection Date</label>
                <input
                  type="date"
                  value={realProp.inspectionDate}
                  onChange={e => setRealProp({ ...realProp, inspectionDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Appraiser</label>
                <input
                  type="text"
                  value={realProp.appraiser}
                  onChange={e => setRealProp({ ...realProp, appraiser: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Property Type</label>
                <select
                  value={realProp.propertyType}
                  onChange={e => setRealProp({ ...realProp, propertyType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Agricultural">Agricultural</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Mixed-Use">Mixed-Use</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Title No. (TCT / OCT)</label>
                <input
                  type="text"
                  placeholder="TCT No. T-123456"
                  value={realProp.titleNo}
                  onChange={e => setRealProp({ ...realProp, titleNo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Tax Declaration No.</label>
                <input
                  type="text"
                  placeholder="TD No. A-12-34-5678"
                  value={realProp.taxDecNo}
                  onChange={e => setRealProp({ ...realProp, taxDecNo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Lot Area (sqm)</label>
                  <input
                    type="number"
                    value={realProp.lotArea}
                    onChange={e => setRealProp({ ...realProp, lotArea: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Floor Area (sqm)</label>
                  <input
                    type="number"
                    value={realProp.floorArea}
                    onChange={e => setRealProp({ ...realProp, floorArea: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* II. Property Description */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-black text-emerald-900 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" /> II. Property Description
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SelectWithRecommended
                label="Terrain"
                value={realProp.terrain}
                onChange={val => setRealProp({ ...realProp, terrain: val })}
                options={TERRAIN_OPTIONS}
                recommendedValue="Flat Level"
              />

              <SelectWithRecommended
                label="Road Access"
                value={realProp.roadAccess}
                onChange={val => setRealProp({ ...realProp, roadAccess: val })}
                options={ROAD_ACCESS_OPTIONS}
                recommendedValue="8m Wide Concrete Road"
              />

              <SelectWithRecommended
                label="Flood Condition"
                value={realProp.floodCondition}
                onChange={val => setRealProp({ ...realProp, floodCondition: val })}
                options={FLOOD_CONDITION_OPTIONS}
                recommendedValue="Flood Free / High Elevation"
              />

              <SelectWithRecommended
                label="Neighborhood Classification"
                value={realProp.neighborhoodClassification}
                onChange={val => setRealProp({ ...realProp, neighborhoodClassification: val })}
                options={NEIGHBORHOOD_OPTIONS}
                recommendedValue="Low-Density Residential"
              />

              <SelectWithRecommended
                label="Highest and Best Use"
                value={realProp.highestAndBestUse}
                onChange={val => setRealProp({ ...realProp, highestAndBestUse: val })}
                options={HIGHEST_BEST_USE_OPTIONS}
                recommendedValue="Single Family Residential"
              />

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Utilities Available</label>
                <input
                  type="text"
                  placeholder="Electricity, Water, Internet, Drainage"
                  value={realProp.utilitiesAvailable.join(', ')}
                  onChange={e => setRealProp({ ...realProp, utilitiesAvailable: e.target.value.split(',').map(s => s.trim()) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Description Remarks</label>
              <textarea
                rows={2}
                value={realProp.descriptionRemarks}
                onChange={e => setRealProp({ ...realProp, descriptionRemarks: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* III. Comparable Sales Analysis & IV. Adjustments Grid */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6 overflow-x-auto">
            <div>
              <h2 className="text-sm font-black text-emerald-900 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" /> III. Comparable Sales Analysis
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Auto Calculates Price / Sqm</span>
              </h2>

              <table className="w-full mt-4 text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="p-3 border-b border-slate-200">Description</th>
                    <th className="p-3 border-b border-slate-200 bg-emerald-50/50 text-emerald-900">Subject Property</th>
                    <th className="p-3 border-b border-slate-200">Comparable 1</th>
                    <th className="p-3 border-b border-slate-200">Comparable 2</th>
                    <th className="p-3 border-b border-slate-200">Comparable 3</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium text-slate-700 divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-black text-slate-600">Location</td>
                    <td className="p-3 bg-emerald-50/20"><input type="text" value={realProp.subjectLocation} onChange={e => setRealProp({ ...realProp, subjectLocation: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={realProp.comp1Location} onChange={e => setRealProp({ ...realProp, comp1Location: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={realProp.comp2Location} onChange={e => setRealProp({ ...realProp, comp2Location: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={realProp.comp3Location} onChange={e => setRealProp({ ...realProp, comp3Location: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Distance from Subject</td>
                    <td className="p-3 bg-emerald-50/20 text-slate-400 font-bold text-center">-</td>
                    <td className="p-3"><input type="text" value={realProp.comp1Distance} onChange={e => setRealProp({ ...realProp, comp1Distance: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={realProp.comp2Distance} onChange={e => setRealProp({ ...realProp, comp2Distance: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={realProp.comp3Distance} onChange={e => setRealProp({ ...realProp, comp3Distance: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Date Sold</td>
                    <td className="p-3 bg-emerald-50/20 text-slate-400 font-bold text-center">-</td>
                    <td className="p-3"><input type="text" value={realProp.comp1DateSold} onChange={e => setRealProp({ ...realProp, comp1DateSold: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={realProp.comp2DateSold} onChange={e => setRealProp({ ...realProp, comp2DateSold: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={realProp.comp3DateSold} onChange={e => setRealProp({ ...realProp, comp3DateSold: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Lot Area (sqm)</td>
                    <td className="p-3 bg-emerald-50/20 font-bold">{realProp.lotArea} sqm</td>
                    <td className="p-3"><input type="number" value={realProp.comp1LotArea} onChange={e => setRealProp({ ...realProp, comp1LotArea: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="number" value={realProp.comp2LotArea} onChange={e => setRealProp({ ...realProp, comp2LotArea: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="number" value={realProp.comp3LotArea} onChange={e => setRealProp({ ...realProp, comp3LotArea: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Floor Area (sqm)</td>
                    <td className="p-3 bg-emerald-50/20 font-bold">{realProp.floorArea} sqm</td>
                    <td className="p-3"><input type="number" value={realProp.comp1FloorArea} onChange={e => setRealProp({ ...realProp, comp1FloorArea: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="number" value={realProp.comp2FloorArea} onChange={e => setRealProp({ ...realProp, comp2FloorArea: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="number" value={realProp.comp3FloorArea} onChange={e => setRealProp({ ...realProp, comp3FloorArea: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                  </tr>
                  <tr className="bg-slate-50/50 font-bold">
                    <td className="p-3 font-black text-slate-800">Selling Price</td>
                    <td className="p-3 bg-emerald-100/50 text-slate-400 font-bold text-center">-</td>
                    <td className="p-3"><input type="number" value={realProp.comp1Price} onChange={e => setRealProp({ ...realProp, comp1Price: Number(e.target.value) })} className="w-full bg-white border border-slate-300 font-bold text-emerald-800 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="number" value={realProp.comp2Price} onChange={e => setRealProp({ ...realProp, comp2Price: Number(e.target.value) })} className="w-full bg-white border border-slate-300 font-bold text-emerald-800 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="number" value={realProp.comp3Price} onChange={e => setRealProp({ ...realProp, comp3Price: Number(e.target.value) })} className="w-full bg-white border border-slate-300 font-bold text-emerald-800 px-2 py-1 rounded-md text-xs" /></td>
                  </tr>
                  <tr className="bg-emerald-50/30 font-bold text-emerald-900">
                    <td className="p-3 font-black">Price per sqm (Auto)</td>
                    <td className="p-3 bg-emerald-100/50 text-slate-400 font-bold text-center">-</td>
                    <td className="p-3 font-black">{fmt(comp1Ppsqm)}/sqm</td>
                    <td className="p-3 font-black">{fmt(comp2Ppsqm)}/sqm</td>
                    <td className="p-3 font-black">{fmt(comp3Ppsqm)}/sqm</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* IV. Comparable Adjustments */}
            <div>
              <h2 className="text-sm font-black text-emerald-900 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-600" /> IV. Comparable Adjustments
                </span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Real-time Valuation Engine
                </span>
              </h2>

              <table className="w-full mt-4 text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="p-3 border-b border-slate-200">Adjustment Item</th>
                    <th className="p-3 border-b border-slate-200 text-slate-700">Comp 1 (₱)</th>
                    <th className="p-3 border-b border-slate-200 text-slate-700">Comp 2 (₱)</th>
                    <th className="p-3 border-b border-slate-200 text-slate-700">Comp 3 (₱)</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium text-slate-700 divide-y divide-slate-100">
                  <tr className="bg-slate-50/40">
                    <td className="p-3 font-black text-slate-800">Selling Price</td>
                    <td className="p-3 font-bold text-slate-800">{fmt(realProp.comp1Price)}</td>
                    <td className="p-3 font-bold text-slate-800">{fmt(realProp.comp2Price)}</td>
                    <td className="p-3 font-bold text-slate-800">{fmt(realProp.comp3Price)}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Location Adjustment</td>
                    <td className="p-3"><input type="number" value={realProp.comp1LocationAdj} onChange={e => setRealProp({ ...realProp, comp1LocationAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={realProp.comp2LocationAdj} onChange={e => setRealProp({ ...realProp, comp2LocationAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={realProp.comp3LocationAdj} onChange={e => setRealProp({ ...realProp, comp3LocationAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Lot Size Adjustment</td>
                    <td className="p-3"><input type="number" value={realProp.comp1LotSizeAdj} onChange={e => setRealProp({ ...realProp, comp1LotSizeAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={realProp.comp2LotSizeAdj} onChange={e => setRealProp({ ...realProp, comp2LotSizeAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={realProp.comp3LotSizeAdj} onChange={e => setRealProp({ ...realProp, comp3LotSizeAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Building Size Adjustment</td>
                    <td className="p-3"><input type="number" value={realProp.comp1BuildingSizeAdj} onChange={e => setRealProp({ ...realProp, comp1BuildingSizeAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={realProp.comp2BuildingSizeAdj} onChange={e => setRealProp({ ...realProp, comp2BuildingSizeAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={realProp.comp3BuildingSizeAdj} onChange={e => setRealProp({ ...realProp, comp3BuildingSizeAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Property Condition</td>
                    <td className="p-3"><input type="number" value={realProp.comp1ConditionAdj} onChange={e => setRealProp({ ...realProp, comp1ConditionAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={realProp.comp2ConditionAdj} onChange={e => setRealProp({ ...realProp, comp2ConditionAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={realProp.comp3ConditionAdj} onChange={e => setRealProp({ ...realProp, comp3ConditionAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Road Access</td>
                    <td className="p-3"><input type="number" value={realProp.comp1RoadAccessAdj} onChange={e => setRealProp({ ...realProp, comp1RoadAccessAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={realProp.comp2RoadAccessAdj} onChange={e => setRealProp({ ...realProp, comp2RoadAccessAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={realProp.comp3RoadAccessAdj} onChange={e => setRealProp({ ...realProp, comp3RoadAccessAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Other Adjustments</td>
                    <td className="p-3"><input type="number" value={realProp.comp1OtherAdj} onChange={e => setRealProp({ ...realProp, comp1OtherAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={realProp.comp2OtherAdj} onChange={e => setRealProp({ ...realProp, comp2OtherAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={realProp.comp3OtherAdj} onChange={e => setRealProp({ ...realProp, comp3OtherAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                  </tr>
                  <tr className="bg-emerald-900 text-white font-black text-xs">
                    <td className="p-3.5 uppercase tracking-wider">Adjusted Market Value</td>
                    <td className="p-3.5 font-extrabold text-emerald-200">{fmt(comp1AdjTotal)}</td>
                    <td className="p-3.5 font-extrabold text-emerald-200">{fmt(comp2AdjTotal)}</td>
                    <td className="p-3.5 font-extrabold text-emerald-200">{fmt(comp3AdjTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Collateral Risk Factor & Loan Coverage Engine */}
          <CollateralRiskAnalysisCard
            appliedLoanAmount={appliedRealLoanAmount}
            setAppliedLoanAmount={setAppliedRealLoanAmount}
            marketValue={realAverageMarketValue}
            targetLtv={realTargetLtv}
            setTargetLtv={setRealTargetLtv}
            fmt={fmt}
          />

          {/* V. Market Value Reconciliation & VI. Loan Computation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-black text-emerald-900 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> V. Market Value Reconciliation
              </h2>

              <div className="space-y-3 divide-y divide-slate-100">
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs font-bold text-slate-600">Comparable 1 Adjusted Value</span>
                  <span className="text-xs font-black text-slate-800">{fmt(comp1AdjTotal)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs font-bold text-slate-600">Comparable 2 Adjusted Value</span>
                  <span className="text-xs font-black text-slate-800">{fmt(comp2AdjTotal)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs font-bold text-slate-600">Comparable 3 Adjusted Value</span>
                  <span className="text-xs font-black text-slate-800">{fmt(comp3AdjTotal)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t-2 border-emerald-500/20 bg-emerald-50/50 p-3 rounded-xl">
                  <span className="text-xs font-black uppercase text-emerald-900 tracking-wider">Average Market Value</span>
                  <span className="text-base font-black text-emerald-900">{fmt(realAverageMarketValue)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-black text-emerald-900 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" /> VI. Loan Computation
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <span className="text-xs font-bold text-slate-600">Average Market Value</span>
                  <span className="text-xs font-black text-slate-800">{fmt(realAverageMarketValue)}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <span className="text-xs font-bold text-slate-600">Loan-to-Value (70%)</span>
                  <span className="text-xs font-black text-teal-800">{fmt(realLtv70)}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <span className="text-xs font-bold text-slate-600">Forced Sale Value (80% of LTV)</span>
                  <span className="text-xs font-black text-amber-700">{fmt(realForcedSaleValue)}</span>
                </div>

                <div className="pt-2">
                  <label className="block text-[10px] font-black text-emerald-900 uppercase tracking-wider mb-1">Recommended Loan Amount (₱)</label>
                  <input
                    type="number"
                    value={realProp.recommendedLoanAmount}
                    onChange={e => setRealProp({ ...realProp, recommendedLoanAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-emerald-50 border-2 border-emerald-500/30 rounded-xl text-sm font-black text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 italic">* Editable field. Defaults to Forced Sale Value standard.</p>
                </div>
              </div>
            </div>
          </div>

          {/* VII. Appraiser's Opinion & Photo Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-black text-emerald-900 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-emerald-600" /> VII. Appraiser's Opinion
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'Highly Acceptable', label: 'Highly Acceptable', color: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
                  { id: 'Acceptable', label: 'Acceptable', color: 'border-teal-300 bg-teal-50 text-teal-800' },
                  { id: 'Acceptable with Conditions', label: 'Acceptable w/ Conditions', color: 'border-amber-300 bg-amber-50 text-amber-800' },
                  { id: 'Not Recommended', label: 'Not Recommended', color: 'border-red-300 bg-red-50 text-red-800' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRealProp({ ...realProp, opinion: opt.id as any })}
                    className={`p-3 rounded-xl border text-xs font-black uppercase tracking-wider text-left transition-all cursor-pointer ${
                      realProp.opinion === opt.id ? `${opt.color} ring-2 ring-emerald-500/30` : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    ☐ {opt.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Opinion Remarks</label>
                <textarea
                  rows={3}
                  value={realProp.opinionRemarks}
                  onChange={e => setRealProp({ ...realProp, opinionRemarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Photo Documentation Checklist */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-black text-emerald-900 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600" /> Real Property Photo Documentation Checklist
              </h2>

              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {REAL_PROPERTY_CHECKLIST.map((item) => {
                  const checked = realProp.photoChecklist[item] ?? false;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setRealProp({
                        ...realProp,
                        photoChecklist: {
                          ...realProp.photoChecklist,
                          [item]: !checked
                        }
                      })}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                        checked ? 'border-emerald-200 bg-emerald-50/60 text-emerald-900' : 'border-slate-200 bg-slate-50 text-slate-500'
                      }`}
                    >
                      {checked ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />}
                      <span className="truncate">{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VEHICLE APPRAISAL TAB                                    */}
      {/* ========================================================= */}
      {activeTab === 'vehicle' && (
        <div className="space-y-6">
          {/* Metrics Header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Average Market Value</span>
              <p className="text-xl font-black text-emerald-900 mt-1">{fmt(vehicleAverageMarketValue)}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Vehicle Valuation</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Recommended Loan Value (70%)</span>
              <p className="text-xl font-black text-teal-800 mt-1">{fmt(vehicleLtv70)}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">70% Standard Ceiling</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Forced Sale Value (80% of LTV)</span>
              <p className="text-xl font-black text-amber-700 mt-1">{fmt(vehicleForcedSaleValue)}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Liquidation Threshold</p>
            </div>
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Recommended Loan Amount</span>
                <p className="text-2xl font-black text-white mt-1">{fmt(vehicle.recommendedLoanAmount)}</p>
              </div>
              <button
                onClick={handleSaveVehicle}
                className="mt-3 w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                <Save className="w-3.5 h-3.5" /> Save Vehicle Report
              </button>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-black text-emerald-900 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
              <Car className="w-4 h-4 text-emerald-600" /> Vehicle Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Borrower *</label>
                <input
                  type="text"
                  placeholder="e.g. Pedro Penduko"
                  value={vehicle.borrower}
                  onChange={e => setVehicle({ ...vehicle, borrower: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Registered Owner</label>
                <input
                  type="text"
                  value={vehicle.registeredOwner}
                  onChange={e => setVehicle({ ...vehicle, registeredOwner: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <SelectWithRecommended
                label="Make"
                value={vehicle.make}
                onChange={val => setVehicle({ ...vehicle, make: val })}
                options={VEHICLE_MAKE_OPTIONS}
                recommendedValue="Toyota"
              />

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Model & Variant</label>
                <input
                  type="text"
                  placeholder="Hilux 2.4 G 4x2 AT"
                  value={`${vehicle.model} ${vehicle.variant}`}
                  onChange={e => {
                    const parts = e.target.value.split(' ');
                    setVehicle({ ...vehicle, model: parts[0] || '', variant: parts.slice(1).join(' ') });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Year Model</label>
                <input
                  type="text"
                  value={vehicle.yearModel}
                  onChange={e => setVehicle({ ...vehicle, yearModel: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Plate Number / CS No.</label>
                <input
                  type="text"
                  value={vehicle.plateNumber}
                  onChange={e => setVehicle({ ...vehicle, plateNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Engine Number</label>
                <input
                  type="text"
                  value={vehicle.engineNumber}
                  onChange={e => setVehicle({ ...vehicle, engineNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Chassis Number</label>
                <input
                  type="text"
                  value={vehicle.chassisNumber}
                  onChange={e => setVehicle({ ...vehicle, chassisNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Mileage (km)</label>
                <input
                  type="number"
                  value={vehicle.mileage}
                  onChange={e => setVehicle({ ...vehicle, mileage: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>

          {/* Comparable Vehicles & Adjustments Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6 overflow-x-auto">
            <div>
              <h2 className="text-sm font-black text-emerald-900 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> Comparable Vehicles Analysis
              </h2>

              <table className="w-full mt-4 text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="p-3 border-b border-slate-200">Description</th>
                    <th className="p-3 border-b border-slate-200 bg-emerald-50/50 text-emerald-900">Subject Vehicle</th>
                    <th className="p-3 border-b border-slate-200">Comp 1</th>
                    <th className="p-3 border-b border-slate-200">Comp 2</th>
                    <th className="p-3 border-b border-slate-200">Comp 3</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium text-slate-700 divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-black text-slate-600">Year Model</td>
                    <td className="p-3 bg-emerald-50/20 font-bold">{vehicle.yearModel}</td>
                    <td className="p-3"><input type="text" value={vehicle.comp1Year} onChange={e => setVehicle({ ...vehicle, comp1Year: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={vehicle.comp2Year} onChange={e => setVehicle({ ...vehicle, comp2Year: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={vehicle.comp3Year} onChange={e => setVehicle({ ...vehicle, comp3Year: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Mileage (km)</td>
                    <td className="p-3 bg-emerald-50/20 font-bold">{vehicle.mileage.toLocaleString()} km</td>
                    <td className="p-3"><input type="number" value={vehicle.comp1Mileage} onChange={e => setVehicle({ ...vehicle, comp1Mileage: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="number" value={vehicle.comp2Mileage} onChange={e => setVehicle({ ...vehicle, comp2Mileage: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="number" value={vehicle.comp3Mileage} onChange={e => setVehicle({ ...vehicle, comp3Mileage: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Condition</td>
                    <td className="p-3 bg-emerald-50/20 font-bold">Good</td>
                    <td className="p-3"><input type="text" value={vehicle.comp1Condition} onChange={e => setVehicle({ ...vehicle, comp1Condition: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={vehicle.comp2Condition} onChange={e => setVehicle({ ...vehicle, comp2Condition: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={vehicle.comp3Condition} onChange={e => setVehicle({ ...vehicle, comp3Condition: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Transmission</td>
                    <td className="p-3 bg-emerald-50/20 font-bold">Automatic</td>
                    <td className="p-3"><input type="text" value={vehicle.comp1Transmission} onChange={e => setVehicle({ ...vehicle, comp1Transmission: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={vehicle.comp2Transmission} onChange={e => setVehicle({ ...vehicle, comp2Transmission: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={vehicle.comp3Transmission} onChange={e => setVehicle({ ...vehicle, comp3Transmission: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                  </tr>
                  <tr className="bg-slate-50/50 font-bold">
                    <td className="p-3 font-black text-slate-800">Selling Price</td>
                    <td className="p-3 bg-emerald-100/50 text-slate-400 font-bold text-center">-</td>
                    <td className="p-3"><input type="number" value={vehicle.comp1Price} onChange={e => setVehicle({ ...vehicle, comp1Price: Number(e.target.value) })} className="w-full bg-white border border-slate-300 font-bold text-emerald-800 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="number" value={vehicle.comp2Price} onChange={e => setVehicle({ ...vehicle, comp2Price: Number(e.target.value) })} className="w-full bg-white border border-slate-300 font-bold text-emerald-800 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="number" value={vehicle.comp3Price} onChange={e => setVehicle({ ...vehicle, comp3Price: Number(e.target.value) })} className="w-full bg-white border border-slate-300 font-bold text-emerald-800 px-2 py-1 rounded-md text-xs" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Source</td>
                    <td className="p-3 bg-emerald-50/20 text-slate-400 font-bold text-center">-</td>
                    <td className="p-3"><input type="text" value={vehicle.comp1Source} onChange={e => setVehicle({ ...vehicle, comp1Source: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={vehicle.comp2Source} onChange={e => setVehicle({ ...vehicle, comp2Source: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={vehicle.comp3Source} onChange={e => setVehicle({ ...vehicle, comp3Source: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Vehicle Adjustments */}
            <div>
              <h2 className="text-sm font-black text-emerald-900 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-600" /> Vehicle Adjustments
                </span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Auto Calculates Adjusted Value
                </span>
              </h2>

              <table className="w-full mt-4 text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="p-3 border-b border-slate-200">Item</th>
                    <th className="p-3 border-b border-slate-200 text-slate-700">Comp 1 (₱)</th>
                    <th className="p-3 border-b border-slate-200 text-slate-700">Comp 2 (₱)</th>
                    <th className="p-3 border-b border-slate-200 text-slate-700">Comp 3 (₱)</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium text-slate-700 divide-y divide-slate-100">
                  <tr className="bg-slate-50/40">
                    <td className="p-3 font-black text-slate-800">Selling Price</td>
                    <td className="p-3 font-bold text-slate-800">{fmt(vehicle.comp1Price)}</td>
                    <td className="p-3 font-bold text-slate-800">{fmt(vehicle.comp2Price)}</td>
                    <td className="p-3 font-bold text-slate-800">{fmt(vehicle.comp3Price)}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Mileage Adjustment</td>
                    <td className="p-3"><input type="number" value={vehicle.comp1MileageAdj} onChange={e => setVehicle({ ...vehicle, comp1MileageAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={vehicle.comp2MileageAdj} onChange={e => setVehicle({ ...vehicle, comp2MileageAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={vehicle.comp3MileageAdj} onChange={e => setVehicle({ ...vehicle, comp3MileageAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Condition Adjustment</td>
                    <td className="p-3"><input type="number" value={vehicle.comp1ConditionAdj} onChange={e => setVehicle({ ...vehicle, comp1ConditionAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={vehicle.comp2ConditionAdj} onChange={e => setVehicle({ ...vehicle, comp2ConditionAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={vehicle.comp3ConditionAdj} onChange={e => setVehicle({ ...vehicle, comp3ConditionAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Accessories Adjustment</td>
                    <td className="p-3"><input type="number" value={vehicle.comp1AccessoriesAdj} onChange={e => setVehicle({ ...vehicle, comp1AccessoriesAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={vehicle.comp2AccessoriesAdj} onChange={e => setVehicle({ ...vehicle, comp2AccessoriesAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={vehicle.comp3AccessoriesAdj} onChange={e => setVehicle({ ...vehicle, comp3AccessoriesAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Year Model Adjustment</td>
                    <td className="p-3"><input type="number" value={vehicle.comp1YearModelAdj} onChange={e => setVehicle({ ...vehicle, comp1YearModelAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={vehicle.comp2YearModelAdj} onChange={e => setVehicle({ ...vehicle, comp2YearModelAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={vehicle.comp3YearModelAdj} onChange={e => setVehicle({ ...vehicle, comp3YearModelAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                  </tr>
                  <tr className="bg-slate-900 text-white font-black text-xs">
                    <td className="p-3.5 uppercase tracking-wider">Adjusted Value</td>
                    <td className="p-3.5 font-extrabold text-emerald-300">{fmt(vComp1AdjTotal)}</td>
                    <td className="p-3.5 font-extrabold text-emerald-300">{fmt(vComp2AdjTotal)}</td>
                    <td className="p-3.5 font-extrabold text-emerald-300">{fmt(vComp3AdjTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Collateral Risk Factor & Loan Coverage Engine */}
          <CollateralRiskAnalysisCard
            appliedLoanAmount={appliedVehicleLoanAmount}
            setAppliedLoanAmount={setAppliedVehicleLoanAmount}
            marketValue={vehicleAverageMarketValue}
            targetLtv={vehicleTargetLtv}
            setTargetLtv={setVehicleTargetLtv}
            fmt={fmt}
          />

          {/* Final Valuation & Photo Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-black text-emerald-900 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" /> Final Vehicle Valuation
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <span className="text-xs font-bold text-slate-600">Average Adjusted Value</span>
                  <span className="text-xs font-black text-slate-800">{fmt(vehicleAverageMarketValue)}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <span className="text-xs font-bold text-slate-600">Recommended Loan Value (70%)</span>
                  <span className="text-xs font-black text-teal-800">{fmt(vehicleLtv70)}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <span className="text-xs font-bold text-slate-600">Forced Sale Value</span>
                  <span className="text-xs font-black text-amber-700">{fmt(vehicleForcedSaleValue)}</span>
                </div>

                <div className="pt-2">
                  <label className="block text-[10px] font-black text-emerald-900 uppercase tracking-wider mb-1">Recommended Loan Amount (₱)</label>
                  <input
                    type="number"
                    value={vehicle.recommendedLoanAmount}
                    onChange={e => setVehicle({ ...vehicle, recommendedLoanAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-emerald-50 border-2 border-emerald-500/30 rounded-xl text-sm font-black text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 italic">* Editable field. Defaults to Forced Sale Value.</p>
                </div>
              </div>
            </div>

            {/* Vehicle Photo Checklist */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-black text-emerald-900 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600" /> Vehicle Photo Documentation Checklist
              </h2>

              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {VEHICLE_CHECKLIST.map((item) => {
                  const checked = vehicle.photoChecklist[item] ?? false;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setVehicle({
                        ...vehicle,
                        photoChecklist: {
                          ...vehicle.photoChecklist,
                          [item]: !checked
                        }
                      })}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                        checked ? 'border-emerald-200 bg-emerald-50/60 text-emerald-900' : 'border-slate-200 bg-slate-50 text-slate-500'
                      }`}
                    >
                      {checked ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />}
                      <span className="truncate">{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SAVED HISTORY TAB                                        */}
      {/* ========================================================= */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-emerald-900 uppercase tracking-wider">
                Saved Appraisal Dossiers
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Archived Real Property and Vehicle Appraisal Reports.
              </p>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search borrower or title..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
              Loading saved appraisal records...
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
              No saved appraisal reports found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHistory.map((rec) => (
                <div key={rec.id} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        rec.reportType === 'real_property' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-teal-100 text-teal-800'
                      }`}>
                        {rec.reportType === 'real_property' ? 'Real Property' : 'Vehicle'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(rec.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-slate-900 tracking-tight leading-snug">
                      {rec.title}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      Borrower: <strong className="text-slate-800">{rec.borrowerName}</strong>
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                      Appraiser: {rec.appraiserName}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9px] font-black uppercase text-slate-400">Market Value</span>
                        <p className="text-xs font-black text-emerald-900">{fmt(rec.marketValue)}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase text-slate-400">Rec. Loan</span>
                        <p className="text-xs font-black text-teal-800">{fmt(rec.recommendedLoan)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                    <button
                      onClick={() => setPrintModalRecord(rec)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" /> View / Print Report
                    </button>
                    {user.role === 'admin' && (
                      <button
                        onClick={() => handleDeleteAppraisal(rec.id)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all cursor-pointer"
                        title="Delete Appraisal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* PRINT / REPORT PREVIEW MODAL                              */}
      {/* ========================================================= */}
      {printModalRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl border border-slate-100 space-y-6 relative">
            <button
              onClick={() => setPrintModalRecord(null)}
              className="absolute top-6 right-6 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              ✕ Close
            </button>

            {/* Print trigger */}
            <div className="flex justify-end pr-12">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md"
              >
                <Printer className="w-4 h-4" /> Print Formal Report
              </button>
            </div>

            <div className="print-section space-y-6 font-serif">
              <div className="text-center border-b-2 border-emerald-900 pb-4">
                <h1 className="text-xl font-black text-emerald-900 uppercase tracking-widest">
                  {printModalRecord.reportType === 'real_property' 
                    ? 'REAL PROPERTY APPRAISAL REPORT' 
                    : 'VEHICLE APPRAISAL REPORT'}
                </h1>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                  (Three Comparable Valuation Analysis)
                </p>
              </div>

              {printModalRecord.reportType === 'real_property' ? (
                (() => {
                  const d = printModalRecord.data as RealPropertyAppraisal;
                  return (
                    <div className="space-y-6 text-xs text-slate-800">
                      <div>
                        <h3 className="font-black uppercase tracking-wider text-emerald-900 mb-2 border-b border-slate-200 pb-1">I. General Information</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <p><strong>Borrower:</strong> {d.borrower}</p>
                          <p><strong>Property Owner:</strong> {d.propertyOwner}</p>
                          <p><strong>Address:</strong> {d.propertyAddress}</p>
                          <p><strong>Inspection Date:</strong> {d.inspectionDate}</p>
                          <p><strong>Appraiser:</strong> {d.appraiser}</p>
                          <p><strong>Title No:</strong> {d.titleNo}</p>
                          <p><strong>Tax Dec No:</strong> {d.taxDecNo}</p>
                          <p><strong>Property Type:</strong> {d.propertyType}</p>
                          <p><strong>Lot Area:</strong> {d.lotArea} sqm</p>
                          <p><strong>Floor Area:</strong> {d.floorArea} sqm</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-black uppercase tracking-wider text-emerald-900 mb-2 border-b border-slate-200 pb-1">II. Final Valuation & Loan Computation</h3>
                        <div className="grid grid-cols-2 gap-4 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-500">Average Market Value</p>
                            <p className="text-sm font-black text-emerald-900">{fmt(printModalRecord.marketValue)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-500">Recommended Loan Amount</p>
                            <p className="text-sm font-black text-teal-900">{fmt(printModalRecord.recommendedLoan)}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-black uppercase tracking-wider text-emerald-900 mb-2 border-b border-slate-200 pb-1">III. Appraiser's Opinion & Remarks</h3>
                        <p><strong>Opinion:</strong> {d.opinion}</p>
                        <p className="mt-1 italic text-slate-600">"{d.opinionRemarks}"</p>
                      </div>
                    </div>
                  );
                })()
              ) : (
                (() => {
                  const d = printModalRecord.data as VehicleAppraisal;
                  return (
                    <div className="space-y-6 text-xs text-slate-800">
                      <div>
                        <h3 className="font-black uppercase tracking-wider text-emerald-900 mb-2 border-b border-slate-200 pb-1">Vehicle Information</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <p><strong>Borrower:</strong> {d.borrower}</p>
                          <p><strong>Registered Owner:</strong> {d.registeredOwner}</p>
                          <p><strong>Make & Model:</strong> {d.make} {d.model} {d.variant}</p>
                          <p><strong>Year Model:</strong> {d.yearModel}</p>
                          <p><strong>Plate Number:</strong> {d.plateNumber}</p>
                          <p><strong>Engine No:</strong> {d.engineNumber}</p>
                          <p><strong>Chassis No:</strong> {d.chassisNumber}</p>
                          <p><strong>Mileage:</strong> {d.mileage.toLocaleString()} km</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-black uppercase tracking-wider text-emerald-900 mb-2 border-b border-slate-200 pb-1">Final Valuation</h3>
                        <div className="grid grid-cols-2 gap-4 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-500">Average Market Value</p>
                            <p className="text-sm font-black text-emerald-900">{fmt(printModalRecord.marketValue)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-500">Recommended Loan Amount</p>
                            <p className="text-sm font-black text-teal-900">{fmt(printModalRecord.recommendedLoan)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              <div className="pt-12 grid grid-cols-2 gap-8 text-center border-t border-slate-300">
                <div>
                  <div className="border-b border-slate-800 w-48 mx-auto font-bold text-xs pb-1">
                    {printModalRecord.appraiserName}
                  </div>
                  <p className="text-[10px] uppercase font-bold text-slate-500 mt-1">Certified Appraiser</p>
                </div>
                <div>
                  <div className="border-b border-slate-800 w-48 mx-auto font-bold text-xs pb-1">
                    CreCom Reviewer / Supervisor
                  </div>
                  <p className="text-[10px] uppercase font-bold text-slate-500 mt-1">Approved & Verified By</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
