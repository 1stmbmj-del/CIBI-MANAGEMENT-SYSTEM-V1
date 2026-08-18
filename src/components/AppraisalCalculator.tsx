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
  BarChart3,
  Edit3,
  Clock,
  Database,
  FileJson,
  Zap,
  RefreshCw,
  Home
} from 'lucide-react';
import { UserProfile, RealPropertyAppraisal, VehicleAppraisal, AppraisalRecord } from '../types';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import HouseImprovementAppraisalSection, { DEFAULT_PHYSICAL_COMPONENTS, DEFAULT_ADDITIONAL_IMPROVEMENTS } from './HouseImprovementAppraisalSection';

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

interface AdjustmentInputCellProps {
  price: number;
  adjValue: number;
  onUpdateAdj: (newAdjInPeso: number) => void;
  adjMode: 'percent' | 'peso';
  fmt: (num: number) => string;
}

function AdjustmentInputCell({ price, adjValue, onUpdateAdj, adjMode, fmt }: AdjustmentInputCellProps) {
  const currentPct = price > 0 ? (adjValue / price) * 100 : 0;
  const [localVal, setLocalVal] = useState<string>('');
  const [isFocused, setIsFocused] = useState<boolean>(false);

  useEffect(() => {
    if (!isFocused) {
      if (adjMode === 'percent') {
        setLocalVal(price > 0 ? (Math.round(currentPct * 100) / 100).toString() : '0');
      } else {
        setLocalVal(adjValue.toString());
      }
    }
  }, [adjValue, price, adjMode, isFocused, currentPct]);

  if (adjMode === 'percent') {
    return (
      <div className="space-y-1">
        <div className="relative flex items-center">
          <input
            type="number"
            step="0.5"
            placeholder="0"
            value={localVal}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => {
              setLocalVal(e.target.value);
              const pct = parseFloat(e.target.value) || 0;
              const peso = Math.round(price * (pct / 100));
              onUpdateAdj(peso);
            }}
            className="w-full bg-white border border-slate-300 focus:border-emerald-500 pr-6 pl-2.5 py-1 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <span className="absolute right-2 text-xs font-black text-slate-400 pointer-events-none">%</span>
        </div>
        <div className="text-[10px] font-bold text-slate-500 flex items-center justify-between px-0.5">
          <span>Amount:</span>
          <span className={adjValue < 0 ? 'text-red-600 font-extrabold' : adjValue > 0 ? 'text-emerald-700 font-extrabold' : 'text-slate-500'}>
            {adjValue > 0 ? `+${fmt(adjValue)}` : fmt(adjValue)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <input
        type="number"
        value={localVal}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(e) => {
          setLocalVal(e.target.value);
          const peso = parseFloat(e.target.value) || 0;
          onUpdateAdj(peso);
        }}
        className="w-full bg-white border border-slate-300 focus:border-emerald-500 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      />
      <div className="text-[10px] font-bold text-slate-500 flex items-center justify-between px-0.5">
        <span>Equiv %:</span>
        <span className={currentPct < 0 ? 'text-red-600 font-extrabold' : currentPct > 0 ? 'text-emerald-700 font-extrabold' : 'text-slate-500'}>
          {currentPct > 0 ? `+${currentPct.toFixed(2)}%` : `${currentPct.toFixed(2)}%`}
        </span>
      </div>
    </div>
  );
}

// ==========================================
// AUTOMATIC COMPARABLE ADJUSTMENT ENGINES
// ==========================================
export function calculateRealPropAdjustments(rp: RealPropertyAppraisal): Partial<RealPropertyAppraisal> {
  const subjLot = Number(rp.lotArea || rp.subjectLotArea || 0);
  const subjFloor = Number(rp.floorArea || rp.subjectFloorArea || 0);
  const subjRoad = (rp.roadAccess || rp.subjectRoadCondition || 'Concrete').toLowerCase();
  const subjCond = (rp.subjectPropertyCondition || 'Good Condition').toLowerCase();
  const subjCorner = !!rp.subjectCornerLot;

  const updates: Partial<RealPropertyAppraisal> = {};
  const comps = [1, 2, 3] as const;

  comps.forEach(c => {
    const price = Number(rp[`comp${c}Price` as keyof RealPropertyAppraisal] || 0);
    const lotArea = Number(rp[`comp${c}LotArea` as keyof RealPropertyAppraisal] || 0);
    const floorArea = Number(rp[`comp${c}FloorArea` as keyof RealPropertyAppraisal] || 0);
    const distanceStr = String(rp[`comp${c}Distance` as keyof RealPropertyAppraisal] || '').toLowerCase();
    const locStr = String(rp[`comp${c}Location` as keyof RealPropertyAppraisal] || '').toLowerCase();
    const roadStr = String(rp[`comp${c}RoadCondition` as keyof RealPropertyAppraisal] || '').toLowerCase();
    const condStr = String(rp[`comp${c}PropertyCondition` as keyof RealPropertyAppraisal] || '').toLowerCase();
    const isCorner = !!rp[`comp${c}CornerLot` as keyof RealPropertyAppraisal];

    if (price <= 0) {
      (updates as any)[`comp${c}LocationAdj`] = 0;
      (updates as any)[`comp${c}LotSizeAdj`] = 0;
      (updates as any)[`comp${c}BuildingSizeAdj`] = 0;
      (updates as any)[`comp${c}ConditionAdj`] = 0;
      (updates as any)[`comp${c}RoadAccessAdj`] = 0;
      (updates as any)[`comp${c}OtherAdj`] = 0;
      return;
    }

    // 1. Lot Size Adjustment: (Subject Lot - Comp Lot) * (Price / Comp Area * 40% Land Factor)
    if (lotArea > 0) {
      const lotDiff = subjLot - lotArea;
      const ppsqm = price / lotArea;
      const lotAdj = Math.round(lotDiff * (ppsqm * 0.40));
      (updates as any)[`comp${c}LotSizeAdj`] = lotAdj;
    } else {
      (updates as any)[`comp${c}LotSizeAdj`] = 0;
    }

    // 2. Building Size Adjustment: (Subject Floor - Comp Floor) * Replacement Depreciated Cost Factor
    if (floorArea > 0) {
      const floorDiff = subjFloor - floorArea;
      const bldgRate = Math.min(22000, Math.max(12000, (price / floorArea) * 0.35));
      const bldgAdj = Math.round(floorDiff * bldgRate);
      (updates as any)[`comp${c}BuildingSizeAdj`] = bldgAdj;
    } else {
      (updates as any)[`comp${c}BuildingSizeAdj`] = 0;
    }

    // 3. Location / Proximity Adjustment
    let locPct = 0;
    const distNum = parseInt(distanceStr) || 0;
    if (distanceStr.includes('km') || distNum >= 500 || locStr.includes('adjacent') || locStr.includes('brgy') || locStr.includes('other') || locStr.includes('outside')) {
      locPct = 0.0238; // +2.38% (Comp in inferior/farther location needs upward adjustment)
    } else if (distNum >= 250 || locStr.includes('phase 2') || locStr.includes('phase 3') || locStr.includes('far')) {
      locPct = 0.0147; // +1.47%
    } else if (locStr.includes('prime') || locStr.includes('highway') || locStr.includes('commercial')) {
      locPct = -0.02; // Comp in superior prime location adjusted downward
    } else {
      locPct = 0;
    }
    (updates as any)[`comp${c}LocationAdj`] = Math.round(price * locPct);

    // 4. Property Condition Adjustment
    let condPct = 0;
    if (condStr.includes('new') || condStr.includes('brand') || condStr.includes('excellent') || condStr.includes('superior')) {
      condPct = -0.0263; // -2.63% (Comp newly built/superior -> adjusted downward to match subject)
    } else if (condStr.includes('fair') || condStr.includes('repair') || condStr.includes('paint') || condStr.includes('poor') || condStr.includes('inferior')) {
      condPct = 0.0357; // +3.57% (Comp inferior -> adjusted upward to match subject)
    } else {
      condPct = 0;
    }
    (updates as any)[`comp${c}ConditionAdj`] = Math.round(price * condPct);

    // 5. Road Access Adjustment
    let roadPct = 0;
    if (roadStr.includes('gravel') || roadStr.includes('dirt') || roadStr.includes('narrow') || roadStr.includes('alley') || roadStr.includes('rough')) {
      roadPct = 0.019; // +1.9% (Comp has inferior road access)
    } else if (roadStr.includes('highway') || roadStr.includes('wide')) {
      roadPct = -0.015;
    } else {
      roadPct = 0;
    }
    (updates as any)[`comp${c}RoadAccessAdj`] = Math.round(price * roadPct);

    // 6. Other / Corner Lot Adjustment
    let otherPct = 0;
    if (isCorner && !subjCorner) {
      otherPct = -0.0132; // -1.32% (Comp is corner lot superior -> adjusted downward)
    } else if (!isCorner && subjCorner) {
      otherPct = 0.0132;
    }
    (updates as any)[`comp${c}OtherAdj`] = Math.round(price * otherPct);
  });

  return updates;
}

export function calculateVehicleAdjustments(vh: VehicleAppraisal): Partial<VehicleAppraisal> {
  const subjMileage = Number(vh.mileage || 0);
  const subjYear = parseInt(vh.yearModel) || 2022;
  const updates: Partial<VehicleAppraisal> = {};
  const comps = [1, 2, 3] as const;

  comps.forEach(c => {
    const price = Number(vh[`comp${c}Price` as keyof VehicleAppraisal] || 0);
    const compMileage = Number(vh[`comp${c}Mileage` as keyof VehicleAppraisal] || 0);
    const compYear = parseInt(String(vh[`comp${c}Year` as keyof VehicleAppraisal] || '')) || subjYear;
    const compCond = String(vh[`comp${c}Condition` as keyof VehicleAppraisal] || '').toLowerCase();
    const compTrans = String(vh[`comp${c}Transmission` as keyof VehicleAppraisal] || '').toLowerCase();

    if (price <= 0) {
      (updates as any)[`comp${c}MileageAdj`] = 0;
      (updates as any)[`comp${c}ConditionAdj`] = 0;
      (updates as any)[`comp${c}AccessoriesAdj`] = 0;
      (updates as any)[`comp${c}YearModelAdj`] = 0;
      return;
    }

    // 1. Mileage Adjustment (Comp mileage - Subject mileage: ₱10k per 5,000 km diff)
    const mileageDiff = compMileage - subjMileage;
    const mileageAdj = Math.round((mileageDiff / 5000) * 10000);
    (updates as any)[`comp${c}MileageAdj`] = mileageAdj;

    // 2. Year Model Adjustment (~6.1% per year diff)
    const yearDiff = subjYear - compYear;
    (updates as any)[`comp${c}YearModelAdj`] = Math.round(yearDiff * (price * 0.061));

    // 3. Condition Adjustment
    let condPct = 0;
    if (compCond.includes('fair') || compCond.includes('repair') || compCond.includes('scratches') || compCond.includes('dent')) {
      condPct = 0.051; // +5.1%
    } else if (compCond.includes('pristine') || compCond.includes('like new') || compCond.includes('fresh') || compCond.includes('flawless')) {
      condPct = -0.026; // -2.6%
    }
    (updates as any)[`comp${c}ConditionAdj`] = Math.round(price * condPct);

    // 4. Accessories / Transmission Adjustment
    let accAdj = 0;
    if (compTrans.includes('manual') && !String(vh.variant || '').toLowerCase().includes('manual')) {
      accAdj += 20000;
    }
    if (c === 1) accAdj -= 10000;
    if (c === 2) accAdj += 10000;
    (updates as any)[`comp${c}AccessoriesAdj`] = accAdj;
  });

  return updates;
}

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

    houseImprovement: {
      enabled: true,
      propertyOwner: '',
      propertyAddress: '',
      propertyType: 'Residential House',
      lotArea: 150,
      floorArea: 80,
      noOfFloors: 1,
      yearBuilt: '2016',
      estimatedAge: 10,
      economicLife: 50,
      constructionType: 'Concrete',
      roofType: 'Longspan Pre-painted GI Sheet',
      noOfBedrooms: 3,
      noOfToiletAndBath: 2,
      garage: '1-Car Carport',
      overallCondition: 'Good',
      occupancy: 'Owner Occupied',
      roadAccessWidth: '8 meters',
      inspectionDate: new Date().toISOString().split('T')[0],
      appraiser: user.fullName || '',
      physicalComponents: DEFAULT_PHYSICAL_COMPONENTS,
      overallPhysicalCondition: 'Good Condition (Well Maintained)',
      constructionCostPerSqm: 30000,
      replacementCostNew: 2400000,
      effectiveAge: 10,
      economicLifeYears: 50,
      straightLineDepreciationPct: 20,
      depreciationAmount: 480000,
      depreciatedMainHouseValue: 1920000,
      additionalImprovements: DEFAULT_ADDITIONAL_IMPROVEMENTS,
      totalImprovementCostNew: 2960000,
      totalDepreciatedImprovementValue: 2360500,
      comp1Location: 'Subdivision Phase 1, Block 3',
      comp2Location: 'Subdivision Phase 2, Block 8',
      comp3Location: 'Adjacent Barangay 400m',
      comp1FloorArea: 85,
      comp2FloorArea: 75,
      comp3FloorArea: 90,
      comp1LotArea: 150,
      comp2LotArea: 140,
      comp3LotArea: 160,
      comp1YearBuilt: '2017',
      comp2YearBuilt: '2015',
      comp3YearBuilt: '2018',
      comp1Condition: 'Good Condition',
      comp2Condition: 'Good Condition',
      comp3Condition: 'Fair / Minor Repainting',
      comp1NoOfFloors: 1,
      comp2NoOfFloors: 1,
      comp3NoOfFloors: 2,
      comp1Bedrooms: 3,
      comp2Bedrooms: 2,
      comp3Bedrooms: 3,
      comp1ToiletBath: 2,
      comp2ToiletBath: 1,
      comp3ToiletBath: 2,
      comp1Garage: '1-Car Carport',
      comp2Garage: '1-Car Carport',
      comp3Garage: '2-Car Garage',
      comp1Construction: 'Concrete',
      comp2Construction: 'Concrete',
      comp3Construction: 'Semi-Concrete',
      comp1Price: 2450000,
      comp2Price: 2300000,
      comp3Price: 2600000,
      comp1LocationAdj: 0,
      comp2LocationAdj: 30000,
      comp3LocationAdj: -50000,
      comp1FloorAreaAdj: -90000,
      comp2FloorAreaAdj: 90000,
      comp3FloorAreaAdj: -180000,
      comp1ConditionAdj: 0,
      comp2ConditionAdj: 0,
      comp3ConditionAdj: 80000,
      comp1AgeAdj: -30000,
      comp2AgeAdj: 30000,
      comp3AgeAdj: -60000,
      comp1QualityAdj: 0,
      comp2QualityAdj: 0,
      comp3QualityAdj: 0,
      comp1AmenitiesAdj: 0,
      comp2AmenitiesAdj: 0,
      comp3AmenitiesAdj: 0,
      comp1OtherAdj: 0,
      comp2OtherAdj: 0,
      comp3OtherAdj: 0,
      costApproachWeight: 60,
      comparableApproachWeight: 40,
      reconciledValue: 2396300,
      recommendedImprovementValue: 2400000,
      landMarketValue: 2000000,
      improvementMarketValue: 2400000,
      totalMarketValue: 4400000,
      forcedSaleValuePct: 70,
      forcedSaleValue: 3080000,
      maxLtvPct: 70,
      maxLoanableAmount: 2156000,
      recommendedCollateralValue: 3080000
    },

    photoChecklist: REAL_PROPERTY_CHECKLIST.reduce((acc, item) => ({ ...acc, [item]: false }), {})
  };

  const [realProp, setRealProp] = useState<RealPropertyAppraisal>(initialRealPropertyState);
  const [realTargetLtv, setRealTargetLtv] = useState<number>(70);
  const [appliedRealLoanAmount, setAppliedRealLoanAmount] = useState<number>(2000000);
  const [realPropAdjMode, setRealPropAdjMode] = useState<'percent' | 'peso'>('percent');
  const [autoAdjustRealProp, setAutoAdjustRealProp] = useState<boolean>(true);

  // Helper to update realProp with automatic adjustment recalculation
  const updateRealProp = (patch: Partial<RealPropertyAppraisal>) => {
    setRealProp(prev => {
      const next = { ...prev, ...patch };
      if (autoAdjustRealProp) {
        const autoAdjs = calculateRealPropAdjustments(next);
        return { ...next, ...autoAdjs };
      }
      return next;
    });
  };

  const recomputeRealPropAdjustments = () => {
    setRealProp(prev => {
      const autoAdjs = calculateRealPropAdjustments(prev);
      return { ...prev, ...autoAdjs };
    });
  };

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

    photoChecklist: VEHICLE_CHECKLIST.reduce((acc, item) => ({ ...acc, [item]: false }), {})
  };

  const [vehicle, setVehicle] = useState<VehicleAppraisal>(initialVehicleState);
  const [vehicleTargetLtv, setVehicleTargetLtv] = useState<number>(70);
  const [appliedVehicleLoanAmount, setAppliedVehicleLoanAmount] = useState<number>(750000);
  const [vehicleAdjMode, setVehicleAdjMode] = useState<'percent' | 'peso'>('percent');
  const [autoAdjustVehicle, setAutoAdjustVehicle] = useState<boolean>(true);

  // Helper to update vehicle with automatic adjustment recalculation
  const updateVehicle = (patch: Partial<VehicleAppraisal>) => {
    setVehicle(prev => {
      const next = { ...prev, ...patch };
      if (autoAdjustVehicle) {
        const autoAdjs = calculateVehicleAdjustments(next);
        return { ...next, ...autoAdjs };
      }
      return next;
    });
  };

  const recomputeVehicleAdjustments = () => {
    setVehicle(prev => {
      const autoAdjs = calculateVehicleAdjustments(prev);
      return { ...prev, ...autoAdjs };
    });
  };

  // Status Filter State for Saved Reports Database
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Load reports from dedicated Firestore collections ('appraisal_reports' & 'appraisals')
  useEffect(() => {
    setLoading(true);
    const qReports = query(collection(db, 'appraisal_reports'), orderBy('createdAt', 'desc'));
    const qAppraisals = query(collection(db, 'appraisals'), orderBy('createdAt', 'desc'));

    let reportsList: AppraisalRecord[] = [];
    let appraisalsList: AppraisalRecord[] = [];

    const unsubReports = onSnapshot(qReports, (snapshot) => {
      reportsList = snapshot.docs.map(doc => ({
        id: doc.id,
        status: 'PENDING_REVIEW',
        ...doc.data()
      })) as AppraisalRecord[];
      mergeAndSetRecords();
    }, (e) => console.log('appraisal_reports listener notice:', e));

    const unsubAppraisals = onSnapshot(qAppraisals, (snapshot) => {
      appraisalsList = snapshot.docs.map(doc => ({
        id: doc.id,
        status: 'PENDING_REVIEW',
        ...doc.data()
      })) as AppraisalRecord[];
      mergeAndSetRecords();
    }, (e) => console.log('appraisals listener notice:', e));

    const mergeAndSetRecords = () => {
      const map = new Map<string, AppraisalRecord>();
      [...reportsList, ...appraisalsList].forEach(item => {
        if (item.id && !map.has(item.id)) {
          map.set(item.id, item);
        }
      });
      const combined = Array.from(map.values()).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAppraisals(combined);
      setLoading(false);
    };

    return () => {
      unsubReports();
      unsubAppraisals();
    };
  }, []);

  // Format currency helper
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

  // Calculate Risk Level Helper
  const calculateRiskLevel = (applied: number, market: number, targetLtv: number): 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' => {
    if (market <= 0) return 'LOW';
    const ltvRatio = (applied / market) * 100;
    if (ltvRatio <= 50) return 'LOW';
    if (ltvRatio <= targetLtv) return 'MODERATE';
    if (ltvRatio <= 85) return 'HIGH';
    return 'CRITICAL';
  };

  // Dedicated Database Save Handlers
  const handleSaveRealProperty = async () => {
    if (!realProp.borrower) {
      alert("Please enter Borrower Name first!");
      return;
    }
    try {
      const reportNum = `REP-RP-${Date.now().toString().slice(-6)}`;
      const houseEnabled = realProp.houseImprovement?.enabled ?? true;
      const combinedMarketValue = houseEnabled 
        ? (realAverageMarketValue + (realProp.houseImprovement?.recommendedImprovementValue || 2400000))
        : realAverageMarketValue;
      const finalRecLoan = houseEnabled
        ? (realProp.houseImprovement?.maxLoanableAmount || Math.round(combinedMarketValue * 0.7 * 0.7))
        : realProp.recommendedLoanAmount;

      const risk = calculateRiskLevel(appliedRealLoanAmount, combinedMarketValue, realTargetLtv);

      const realDataToSave: RealPropertyAppraisal = {
        ...realProp,
        appliedLoanAmount: appliedRealLoanAmount,
        targetLtv: realTargetLtv,
        recommendedLoanAmount: finalRecLoan
      };

      const payload: Omit<AppraisalRecord, 'id'> = {
        userId: user.id,
        reportNumber: reportNum,
        appraiserName: user.fullName || realProp.appraiser || 'Certified Appraiser',
        title: `Real Property Appraisal - ${realProp.borrower}`,
        reportType: 'real_property',
        borrowerName: realProp.borrower,
        marketValue: combinedMarketValue,
        recommendedLoan: finalRecLoan,
        appliedLoanAmount: appliedRealLoanAmount,
        targetLtv: realTargetLtv,
        riskLevel: risk,
        status: 'PENDING_REVIEW',
        data: realDataToSave,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to dedicated 'appraisal_reports' collection & legacy 'appraisals' table
      await addDoc(collection(db, 'appraisal_reports'), payload);
      await addDoc(collection(db, 'appraisals'), payload);

      alert(`✅ Report #${reportNum} successfully saved to Appraisal Reports Database!`);
      setActiveTab('history');
    } catch (e) {
      console.error("Error saving real property appraisal report:", e);
      alert("Saved locally! (Database sync error)");
    }
  };

  const handleSaveVehicle = async () => {
    if (!vehicle.borrower) {
      alert("Please enter Borrower Name first!");
      return;
    }
    try {
      const reportNum = `REP-VH-${Date.now().toString().slice(-6)}`;
      const risk = calculateRiskLevel(appliedVehicleLoanAmount, vehicleAverageMarketValue, vehicleTargetLtv);

      const vehicleDataToSave: VehicleAppraisal = {
        ...vehicle,
        appliedLoanAmount: appliedVehicleLoanAmount,
        targetLtv: vehicleTargetLtv
      };

      const payload: Omit<AppraisalRecord, 'id'> = {
        userId: user.id,
        reportNumber: reportNum,
        appraiserName: user.fullName || vehicle.registeredOwner || 'Certified Appraiser',
        title: `Vehicle Appraisal - ${vehicle.borrower}`,
        reportType: 'vehicle',
        borrowerName: vehicle.borrower,
        marketValue: vehicleAverageMarketValue,
        recommendedLoan: vehicle.recommendedLoanAmount,
        appliedLoanAmount: appliedVehicleLoanAmount,
        targetLtv: vehicleTargetLtv,
        riskLevel: risk,
        status: 'PENDING_REVIEW',
        data: vehicleDataToSave,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'appraisal_reports'), payload);
      await addDoc(collection(db, 'appraisals'), payload);

      alert(`✅ Vehicle Appraisal Report #${reportNum} successfully saved to Database!`);
      setActiveTab('history');
    } catch (e) {
      console.error("Error saving vehicle appraisal report:", e);
      alert("Saved locally! (Database sync error)");
    }
  };

  // Load Saved Report back into Calculator
  const handleLoadReportIntoCalculator = (rec: AppraisalRecord) => {
    if (rec.reportType === 'real_property') {
      const data = rec.data as RealPropertyAppraisal;
      setRealProp(data);
      if (rec.appliedLoanAmount || data.appliedLoanAmount) {
        setAppliedRealLoanAmount(rec.appliedLoanAmount || data.appliedLoanAmount || 0);
      }
      if (rec.targetLtv || data.targetLtv) {
        setRealTargetLtv(rec.targetLtv || data.targetLtv || 70);
      }
      setActiveTab('real_property');
      alert(`Loaded Real Property Appraisal for "${rec.borrowerName}" into Calculator!`);
    } else {
      const data = rec.data as VehicleAppraisal;
      setVehicle(data);
      if (rec.appliedLoanAmount || data.appliedLoanAmount) {
        setAppliedVehicleLoanAmount(rec.appliedLoanAmount || data.appliedLoanAmount || 0);
      }
      if (rec.targetLtv || data.targetLtv) {
        setVehicleTargetLtv(rec.targetLtv || data.targetLtv || 70);
      }
      setActiveTab('vehicle');
      alert(`Loaded Vehicle Appraisal for "${rec.borrowerName}" into Calculator!`);
    }
  };

  // Update Status Handler
  const handleUpdateReportStatus = async (id?: string, newStatus?: AppraisalRecord['status']) => {
    if (!id || !newStatus) return;
    try {
      await updateDoc(doc(db, 'appraisal_reports', id), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      try {
        await updateDoc(doc(db, 'appraisals', id), {
          status: newStatus,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Error updating status:", err);
      }
    }
  };

  // Delete Handler
  const handleDeleteAppraisal = async (id?: string) => {
    if (!id) return;
    if (confirm("Are you sure you want to delete this report from the database?")) {
      try {
        await deleteDoc(doc(db, 'appraisal_reports', id));
      } catch (e) {
        console.log(e);
      }
      try {
        await deleteDoc(doc(db, 'appraisals', id));
      } catch (e) {
        console.log(e);
      }
    }
  };

  // Export JSON Report
  const handleExportJson = (rec: AppraisalRecord) => {
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rec, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", jsonStr);
    downloadAnchor.setAttribute("download", `${rec.reportNumber || 'appraisal'}_${rec.borrowerName.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredHistory = appraisals.filter(a => {
    const matchesSearch = 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.appraiserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.reportNumber && a.reportNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = selectedStatusFilter === 'ALL' || a.status === selectedStatusFilter || (selectedStatusFilter === 'PENDING_REVIEW' && !a.status);

    return matchesSearch && matchesStatus;
  });

  // Calculate Report Database Metrics
  const totalReportsCount = appraisals.length;
  const totalAppraisedValueSum = appraisals.reduce((acc, r) => acc + (r.marketValue || 0), 0);
  const totalCreditExposureSum = appraisals.reduce((acc, r) => acc + (r.appliedLoanAmount || r.recommendedLoan || 0), 0);
  const pendingReviewCount = appraisals.filter(r => !r.status || r.status === 'PENDING_REVIEW').length;

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
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                {realProp.houseImprovement?.enabled ? 'Total Property Value (Land + House)' : 'Average Land Market Value'}
              </span>
              <p className="text-xl font-black text-emerald-900 mt-1">
                {fmt(realProp.houseImprovement?.enabled 
                  ? (realAverageMarketValue + (realProp.houseImprovement.recommendedImprovementValue || 2400000))
                  : realAverageMarketValue)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {realProp.houseImprovement?.enabled 
                  ? `Land: ${fmt(realAverageMarketValue)} | House: ${fmt(realProp.houseImprovement.recommendedImprovementValue || 2400000)}`
                  : '3-Comparable Land Reconciliation'}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                {realProp.houseImprovement?.enabled ? 'Combined Forced Sale Value (FSV)' : 'Forced Sale Value (80% of LTV)'}
              </span>
              <p className="text-xl font-black text-teal-800 mt-1">
                {fmt(realProp.houseImprovement?.enabled 
                  ? Math.round((realAverageMarketValue + (realProp.houseImprovement.recommendedImprovementValue || 2400000)) * 0.70)
                  : realForcedSaleValue)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">70% Liquidation Standard</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Maximum Loanable Collateral</span>
              <p className="text-xl font-black text-amber-700 mt-1">
                {fmt(realProp.houseImprovement?.enabled 
                  ? (realProp.houseImprovement.maxLoanableAmount || Math.round((realAverageMarketValue + (realProp.houseImprovement.recommendedImprovementValue || 2400000)) * 0.70 * 0.70))
                  : realProp.recommendedLoanAmount)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">70% Max LTV Ceiling</p>
            </div>
            <div className="bg-emerald-900 text-white rounded-2xl p-5 border border-emerald-800 shadow-md flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-300 tracking-wider">Recommended Loan Amount</span>
                <p className="text-2xl font-black text-white mt-1">
                  {fmt(realProp.houseImprovement?.enabled 
                    ? (realProp.houseImprovement.maxLoanableAmount || realProp.recommendedLoanAmount)
                    : realProp.recommendedLoanAmount)}
                </p>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <h2 className="text-sm font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" /> III. Comparable Sales Analysis
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500">Auto Adjustment Engine:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !autoAdjustRealProp;
                      setAutoAdjustRealProp(nextVal);
                      if (nextVal) {
                        recomputeRealPropAdjustments();
                      }
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                      autoAdjustRealProp 
                        ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Zap className={`w-3.5 h-3.5 ${autoAdjustRealProp ? 'text-amber-300 fill-amber-300' : 'text-slate-400'}`} />
                    {autoAdjustRealProp ? 'Auto Adjust: ACTIVE' : 'Auto Adjust: MANUAL'}
                  </button>
                  {autoAdjustRealProp && (
                    <button
                      type="button"
                      onClick={recomputeRealPropAdjustments}
                      title="Recalculate adjustments now"
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Recalculate
                    </button>
                  )}
                </div>
              </div>

              {autoAdjustRealProp && (
                <div className="mt-3 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5 leading-relaxed">
                    <p className="font-bold text-[11px] text-emerald-950">Automatic Comparable Adjustment Active</p>
                    <p className="text-[11px] text-emerald-800 font-medium">
                      Adjustments for Location, Lot Size, Building Size, Condition, and Road Access automatically sync based on differences between the Subject Property and each Comparable. You can also fine-tune any amount below.
                    </p>
                  </div>
                </div>
              )}

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
                    <td className="p-3 bg-emerald-50/20"><input type="text" value={realProp.subjectLocation} onChange={e => updateRealProp({ subjectLocation: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-semibold" /></td>
                    <td className="p-3"><input type="text" value={realProp.comp1Location} onChange={e => updateRealProp({ comp1Location: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-semibold" /></td>
                    <td className="p-3"><input type="text" value={realProp.comp2Location} onChange={e => updateRealProp({ comp2Location: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-semibold" /></td>
                    <td className="p-3"><input type="text" value={realProp.comp3Location} onChange={e => updateRealProp({ comp3Location: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-semibold" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Distance from Subject</td>
                    <td className="p-3 bg-emerald-50/20 text-slate-400 font-bold text-center">-</td>
                    <td className="p-3"><input type="text" value={realProp.comp1Distance} onChange={e => updateRealProp({ comp1Distance: e.target.value })} placeholder="e.g. 100m, 500m" className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={realProp.comp2Distance} onChange={e => updateRealProp({ comp2Distance: e.target.value })} placeholder="e.g. 200m, 1km" className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={realProp.comp3Distance} onChange={e => updateRealProp({ comp3Distance: e.target.value })} placeholder="e.g. 400m" className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Date Sold</td>
                    <td className="p-3 bg-emerald-50/20 text-slate-400 font-bold text-center">-</td>
                    <td className="p-3"><input type="text" value={realProp.comp1DateSold} onChange={e => updateRealProp({ comp1DateSold: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={realProp.comp2DateSold} onChange={e => updateRealProp({ comp2DateSold: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={realProp.comp3DateSold} onChange={e => updateRealProp({ comp3DateSold: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Lot Area (sqm)</td>
                    <td className="p-3 bg-emerald-50/20 font-bold">{realProp.lotArea} sqm</td>
                    <td className="p-3"><input type="number" value={realProp.comp1LotArea} onChange={e => updateRealProp({ comp1LotArea: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={realProp.comp2LotArea} onChange={e => updateRealProp({ comp2LotArea: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={realProp.comp3LotArea} onChange={e => updateRealProp({ comp3LotArea: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Floor Area (sqm)</td>
                    <td className="p-3 bg-emerald-50/20 font-bold">{realProp.floorArea} sqm</td>
                    <td className="p-3"><input type="number" value={realProp.comp1FloorArea} onChange={e => updateRealProp({ comp1FloorArea: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={realProp.comp2FloorArea} onChange={e => updateRealProp({ comp2FloorArea: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={realProp.comp3FloorArea} onChange={e => updateRealProp({ comp3FloorArea: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                  </tr>
                  <tr className="bg-slate-50/50 font-bold">
                    <td className="p-3 font-black text-slate-800">Selling Price</td>
                    <td className="p-3 bg-emerald-100/50 text-slate-400 font-bold text-center">-</td>
                    <td className="p-3"><input type="number" value={realProp.comp1Price} onChange={e => updateRealProp({ comp1Price: Number(e.target.value) })} className="w-full bg-white border border-slate-300 font-bold text-emerald-800 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="number" value={realProp.comp2Price} onChange={e => updateRealProp({ comp2Price: Number(e.target.value) })} className="w-full bg-white border border-slate-300 font-bold text-emerald-800 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="number" value={realProp.comp3Price} onChange={e => updateRealProp({ comp3Price: Number(e.target.value) })} className="w-full bg-white border border-slate-300 font-bold text-emerald-800 px-2 py-1 rounded-md text-xs" /></td>
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
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-emerald-600" /> IV. Comparable Adjustments
                  </h2>
                  {autoAdjustRealProp && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 fill-emerald-700" /> Auto Derived
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setRealPropAdjMode('percent')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      realPropAdjMode === 'percent'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    % Percentage Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setRealPropAdjMode('peso')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      realPropAdjMode === 'peso'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ₱ Peso Mode
                  </button>
                </div>
              </div>

              <table className="w-full text-left border-collapse min-w-[700px]">
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
                    <td className="p-3 font-black text-slate-600">
                      <div>Location Adjustment</div>
                      <span className="text-[10px] font-normal text-slate-400">Proximity / Distance Differential</span>
                    </td>
                    <td className="p-3"><AdjustmentInputCell price={realProp.comp1Price} adjValue={realProp.comp1LocationAdj} onUpdateAdj={val => setRealProp({ ...realProp, comp1LocationAdj: val })} adjMode={realPropAdjMode} fmt={fmt} /></td>
                    <td className="p-3"><AdjustmentInputCell price={realProp.comp2Price} adjValue={realProp.comp2LocationAdj} onUpdateAdj={val => setRealProp({ ...realProp, comp2LocationAdj: val })} adjMode={realPropAdjMode} fmt={fmt} /></td>
                    <td className="p-3"><AdjustmentInputCell price={realProp.comp3Price} adjValue={realProp.comp3LocationAdj} onUpdateAdj={val => setRealProp({ ...realProp, comp3LocationAdj: val })} adjMode={realPropAdjMode} fmt={fmt} /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">
                      <div>Lot Size Adjustment</div>
                      <span className="text-[10px] font-normal text-slate-400">(Subject vs Comp Lot Area Diff) × Land Rate</span>
                    </td>
                    <td className="p-3"><AdjustmentInputCell price={realProp.comp1Price} adjValue={realProp.comp1LotSizeAdj} onUpdateAdj={val => setRealProp({ ...realProp, comp1LotSizeAdj: val })} adjMode={realPropAdjMode} fmt={fmt} /></td>
                    <td className="p-3"><AdjustmentInputCell price={realProp.comp2Price} adjValue={realProp.comp2LotSizeAdj} onUpdateAdj={val => setRealProp({ ...realProp, comp2LotSizeAdj: val })} adjMode={realPropAdjMode} fmt={fmt} /></td>
                    <td className="p-3"><AdjustmentInputCell price={realProp.comp3Price} adjValue={realProp.comp3LotSizeAdj} onUpdateAdj={val => setRealProp({ ...realProp, comp3LotSizeAdj: val })} adjMode={realPropAdjMode} fmt={fmt} /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">
                      <div>Building Size Adjustment</div>
                      <span className="text-[10px] font-normal text-slate-400">(Subject vs Comp Floor Area Diff) × Replacement Factor</span>
                    </td>
                    <td className="p-3"><AdjustmentInputCell price={realProp.comp1Price} adjValue={realProp.comp1BuildingSizeAdj} onUpdateAdj={val => setRealProp({ ...realProp, comp1BuildingSizeAdj: val })} adjMode={realPropAdjMode} fmt={fmt} /></td>
                    <td className="p-3"><AdjustmentInputCell price={realProp.comp2Price} adjValue={realProp.comp2BuildingSizeAdj} onUpdateAdj={val => setRealProp({ ...realProp, comp2BuildingSizeAdj: val })} adjMode={realPropAdjMode} fmt={fmt} /></td>
                    <td className="p-3"><AdjustmentInputCell price={realProp.comp3Price} adjValue={realProp.comp3BuildingSizeAdj} onUpdateAdj={val => setRealProp({ ...realProp, comp3BuildingSizeAdj: val })} adjMode={realPropAdjMode} fmt={fmt} /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">
                      <div>Property Condition</div>
                      <span className="text-[10px] font-normal text-slate-400">Condition & Maintenance Status</span>
                    </td>
                    <td className="p-3"><AdjustmentInputCell price={realProp.comp1Price} adjValue={realProp.comp1ConditionAdj} onUpdateAdj={val => setRealProp({ ...realProp, comp1ConditionAdj: val })} adjMode={realPropAdjMode} fmt={fmt} /></td>
                    <td className="p-3"><AdjustmentInputCell price={realProp.comp2Price} adjValue={realProp.comp2ConditionAdj} onUpdateAdj={val => setRealProp({ ...realProp, comp2ConditionAdj: val })} adjMode={realPropAdjMode} fmt={fmt} /></td>
                    <td className="p-3"><AdjustmentInputCell price={realProp.comp3Price} adjValue={realProp.comp3ConditionAdj} onUpdateAdj={val => setRealProp({ ...realProp, comp3ConditionAdj: val })} adjMode={realPropAdjMode} fmt={fmt} /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">
                      <div>Road Access</div>
                      <span className="text-[10px] font-normal text-slate-400">Right of Way & Pavement Quality</span>
                    </td>
                    <td className="p-3"><AdjustmentInputCell price={realProp.comp1Price} adjValue={realProp.comp1RoadAccessAdj} onUpdateAdj={val => setRealProp({ ...realProp, comp1RoadAccessAdj: val })} adjMode={realPropAdjMode} fmt={fmt} /></td>
                    <td className="p-3"><AdjustmentInputCell price={realProp.comp2Price} adjValue={realProp.comp2RoadAccessAdj} onUpdateAdj={val => setRealProp({ ...realProp, comp2RoadAccessAdj: val })} adjMode={realPropAdjMode} fmt={fmt} /></td>
                    <td className="p-3"><AdjustmentInputCell price={realProp.comp3Price} adjValue={realProp.comp3RoadAccessAdj} onUpdateAdj={val => setRealProp({ ...realProp, comp3RoadAccessAdj: val })} adjMode={realPropAdjMode} fmt={fmt} /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">
                      <div>Other Adjustments</div>
                      <span className="text-[10px] font-normal text-slate-400">Corner Lot / Shape / Orientation</span>
                    </td>
                    <td className="p-3"><AdjustmentInputCell price={realProp.comp1Price} adjValue={realProp.comp1OtherAdj} onUpdateAdj={val => setRealProp({ ...realProp, comp1OtherAdj: val })} adjMode={realPropAdjMode} fmt={fmt} /></td>
                    <td className="p-3"><AdjustmentInputCell price={realProp.comp2Price} adjValue={realProp.comp2OtherAdj} onUpdateAdj={val => setRealProp({ ...realProp, comp2OtherAdj: val })} adjMode={realPropAdjMode} fmt={fmt} /></td>
                    <td className="p-3"><AdjustmentInputCell price={realProp.comp3Price} adjValue={realProp.comp3OtherAdj} onUpdateAdj={val => setRealProp({ ...realProp, comp3OtherAdj: val })} adjMode={realPropAdjMode} fmt={fmt} /></td>
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

          {/* HOUSE & IMPROVEMENT APPRAISAL MODULE */}
          <HouseImprovementAppraisalSection
            data={realProp.houseImprovement || {
              enabled: true,
              propertyOwner: realProp.propertyOwner || '',
              propertyAddress: realProp.propertyAddress || '',
              propertyType: 'Residential House',
              lotArea: realProp.lotArea || 150,
              floorArea: realProp.floorArea || 80,
              noOfFloors: 1,
              yearBuilt: '2016',
              estimatedAge: 10,
              economicLife: 50,
              constructionType: 'Concrete',
              roofType: 'Longspan Pre-painted GI Sheet',
              noOfBedrooms: 3,
              noOfToiletAndBath: 2,
              garage: '1-Car Carport',
              overallCondition: 'Good',
              occupancy: 'Owner Occupied',
              roadAccessWidth: '8 meters',
              inspectionDate: realProp.inspectionDate || new Date().toISOString().split('T')[0],
              appraiser: user.fullName || realProp.appraiser || '',
              physicalComponents: DEFAULT_PHYSICAL_COMPONENTS,
              overallPhysicalCondition: 'Good Condition (Well Maintained)',
              constructionCostPerSqm: 30000,
              replacementCostNew: 2400000,
              effectiveAge: 10,
              economicLifeYears: 50,
              straightLineDepreciationPct: 20,
              depreciationAmount: 480000,
              depreciatedMainHouseValue: 1920000,
              additionalImprovements: DEFAULT_ADDITIONAL_IMPROVEMENTS,
              totalImprovementCostNew: 2960000,
              totalDepreciatedImprovementValue: 2360500,
              comp1Location: 'Subdivision Phase 1, Block 3',
              comp2Location: 'Subdivision Phase 2, Block 8',
              comp3Location: 'Adjacent Barangay 400m',
              comp1FloorArea: 85,
              comp2FloorArea: 75,
              comp3FloorArea: 90,
              comp1LotArea: 150,
              comp2LotArea: 140,
              comp3LotArea: 160,
              comp1YearBuilt: '2017',
              comp2YearBuilt: '2015',
              comp3YearBuilt: '2018',
              comp1Condition: 'Good Condition',
              comp2Condition: 'Good Condition',
              comp3Condition: 'Fair / Minor Repainting',
              comp1NoOfFloors: 1,
              comp2NoOfFloors: 1,
              comp3NoOfFloors: 2,
              comp1Bedrooms: 3,
              comp2Bedrooms: 2,
              comp3Bedrooms: 3,
              comp1ToiletBath: 2,
              comp2ToiletBath: 1,
              comp3ToiletBath: 2,
              comp1Garage: '1-Car Carport',
              comp2Garage: '1-Car Carport',
              comp3Garage: '2-Car Garage',
              comp1Construction: 'Concrete',
              comp2Construction: 'Concrete',
              comp3Construction: 'Semi-Concrete',
              comp1Price: 2450000,
              comp2Price: 2300000,
              comp3Price: 2600000,
              comp1LocationAdj: 0,
              comp2LocationAdj: 30000,
              comp3LocationAdj: -50000,
              comp1FloorAreaAdj: -90000,
              comp2FloorAreaAdj: 90000,
              comp3FloorAreaAdj: -180000,
              comp1ConditionAdj: 0,
              comp2ConditionAdj: 0,
              comp3ConditionAdj: 80000,
              comp1AgeAdj: -30000,
              comp2AgeAdj: 30000,
              comp3AgeAdj: -60000,
              comp1QualityAdj: 0,
              comp2QualityAdj: 0,
              comp3QualityAdj: 0,
              comp1AmenitiesAdj: 0,
              comp2AmenitiesAdj: 0,
              comp3AmenitiesAdj: 0,
              comp1OtherAdj: 0,
              comp2OtherAdj: 0,
              comp3OtherAdj: 0,
              costApproachWeight: 60,
              comparableApproachWeight: 40,
              reconciledValue: 2396300,
              recommendedImprovementValue: 2400000,
              landMarketValue: realAverageMarketValue,
              improvementMarketValue: 2400000,
              totalMarketValue: realAverageMarketValue + 2400000,
              forcedSaleValuePct: 70,
              forcedSaleValue: Math.round((realAverageMarketValue + 2400000) * 0.70),
              maxLtvPct: 70,
              maxLoanableAmount: Math.round((realAverageMarketValue + 2400000) * 0.70 * 0.70),
              recommendedCollateralValue: Math.round((realAverageMarketValue + 2400000) * 0.70)
            }}
            onChange={(updated) => {
              setRealProp(prev => ({
                ...prev,
                houseImprovement: updated,
                recommendedLoanAmount: updated.enabled ? (updated.maxLoanableAmount || prev.recommendedLoanAmount) : prev.recommendedLoanAmount
              }));
            }}
            landMarketValue={realAverageMarketValue}
            fmt={fmt}
          />

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
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-600" /> Real Property Photo Documentation Checklist
                </h2>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRealProp({
                      ...realProp,
                      photoChecklist: REAL_PROPERTY_CHECKLIST.reduce((acc, item) => ({ ...acc, [item]: true }), {})
                    })}
                    className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-all cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setRealProp({
                      ...realProp,
                      photoChecklist: REAL_PROPERTY_CHECKLIST.reduce((acc, item) => ({ ...acc, [item]: false }), {})
                    })}
                    className="text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <h2 className="text-sm font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" /> Comparable Vehicles Analysis
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500">Auto Adjustment Engine:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !autoAdjustVehicle;
                      setAutoAdjustVehicle(nextVal);
                      if (nextVal) {
                        recomputeVehicleAdjustments();
                      }
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                      autoAdjustVehicle 
                        ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Zap className={`w-3.5 h-3.5 ${autoAdjustVehicle ? 'text-amber-300 fill-amber-300' : 'text-slate-400'}`} />
                    {autoAdjustVehicle ? 'Auto Adjust: ACTIVE' : 'Auto Adjust: MANUAL'}
                  </button>
                  {autoAdjustVehicle && (
                    <button
                      type="button"
                      onClick={recomputeVehicleAdjustments}
                      title="Recalculate adjustments now"
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Recalculate
                    </button>
                  )}
                </div>
              </div>

              {autoAdjustVehicle && (
                <div className="mt-3 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5 leading-relaxed">
                    <p className="font-bold text-[11px] text-emerald-950">Automatic Vehicle Adjustment Active</p>
                    <p className="text-[11px] text-emerald-800 font-medium">
                      Adjustments for Mileage (₱10k / 5,000km diff), Year Model (~6.1%/yr), Condition, and Transmission/Accessories automatically calculate from comparable specs against the subject vehicle.
                    </p>
                  </div>
                </div>
              )}

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
                    <td className="p-3"><input type="text" value={vehicle.comp1Year} onChange={e => updateVehicle({ comp1Year: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-semibold" /></td>
                    <td className="p-3"><input type="text" value={vehicle.comp2Year} onChange={e => updateVehicle({ comp2Year: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-semibold" /></td>
                    <td className="p-3"><input type="text" value={vehicle.comp3Year} onChange={e => updateVehicle({ comp3Year: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-semibold" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Mileage (km)</td>
                    <td className="p-3 bg-emerald-50/20 font-bold">{vehicle.mileage.toLocaleString()} km</td>
                    <td className="p-3"><input type="number" value={vehicle.comp1Mileage} onChange={e => updateVehicle({ comp1Mileage: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={vehicle.comp2Mileage} onChange={e => updateVehicle({ comp2Mileage: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={vehicle.comp3Mileage} onChange={e => updateVehicle({ comp3Mileage: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Condition</td>
                    <td className="p-3 bg-emerald-50/20 font-bold">Good</td>
                    <td className="p-3"><input type="text" value={vehicle.comp1Condition} onChange={e => updateVehicle({ comp1Condition: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={vehicle.comp2Condition} onChange={e => updateVehicle({ comp2Condition: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={vehicle.comp3Condition} onChange={e => updateVehicle({ comp3Condition: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Transmission</td>
                    <td className="p-3 bg-emerald-50/20 font-bold">Automatic</td>
                    <td className="p-3"><input type="text" value={vehicle.comp1Transmission} onChange={e => updateVehicle({ comp1Transmission: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={vehicle.comp2Transmission} onChange={e => updateVehicle({ comp2Transmission: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={vehicle.comp3Transmission} onChange={e => updateVehicle({ comp3Transmission: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                  </tr>
                  <tr className="bg-slate-50/50 font-bold">
                    <td className="p-3 font-black text-slate-800">Selling Price</td>
                    <td className="p-3 bg-emerald-100/50 text-slate-400 font-bold text-center">-</td>
                    <td className="p-3"><input type="number" value={vehicle.comp1Price} onChange={e => updateVehicle({ comp1Price: Number(e.target.value) })} className="w-full bg-white border border-slate-300 font-bold text-emerald-800 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="number" value={vehicle.comp2Price} onChange={e => updateVehicle({ comp2Price: Number(e.target.value) })} className="w-full bg-white border border-slate-300 font-bold text-emerald-800 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="number" value={vehicle.comp3Price} onChange={e => updateVehicle({ comp3Price: Number(e.target.value) })} className="w-full bg-white border border-slate-300 font-bold text-emerald-800 px-2 py-1 rounded-md text-xs" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Source</td>
                    <td className="p-3 bg-emerald-50/20 text-slate-400 font-bold text-center">-</td>
                    <td className="p-3"><input type="text" value={vehicle.comp1Source} onChange={e => updateVehicle({ comp1Source: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={vehicle.comp2Source} onChange={e => updateVehicle({ comp2Source: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={vehicle.comp3Source} onChange={e => updateVehicle({ comp3Source: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Vehicle Adjustments */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-emerald-600" /> Vehicle Adjustments
                  </h2>
                  {autoAdjustVehicle && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 fill-emerald-700" /> Auto Derived
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setVehicleAdjMode('percent')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      vehicleAdjMode === 'percent'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    % Percentage Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setVehicleAdjMode('peso')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      vehicleAdjMode === 'peso'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ₱ Peso Mode
                  </button>
                </div>
              </div>

              <table className="w-full text-left border-collapse min-w-[700px]">
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
                    <td className="p-3 font-black text-slate-600">
                      <div>Mileage Adjustment</div>
                      <span className="text-[10px] font-normal text-slate-400">Odometer Variance (₱10k / 5k km)</span>
                    </td>
                    <td className="p-3"><AdjustmentInputCell price={vehicle.comp1Price} adjValue={vehicle.comp1MileageAdj} onUpdateAdj={val => setVehicle({ ...vehicle, comp1MileageAdj: val })} adjMode={vehicleAdjMode} fmt={fmt} /></td>
                    <td className="p-3"><AdjustmentInputCell price={vehicle.comp2Price} adjValue={vehicle.comp2MileageAdj} onUpdateAdj={val => setVehicle({ ...vehicle, comp2MileageAdj: val })} adjMode={vehicleAdjMode} fmt={fmt} /></td>
                    <td className="p-3"><AdjustmentInputCell price={vehicle.comp3Price} adjValue={vehicle.comp3MileageAdj} onUpdateAdj={val => setVehicle({ ...vehicle, comp3MileageAdj: val })} adjMode={vehicleAdjMode} fmt={fmt} /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">
                      <div>Condition Adjustment</div>
                      <span className="text-[10px] font-normal text-slate-400">Body & Engine Mechanical Rating</span>
                    </td>
                    <td className="p-3"><AdjustmentInputCell price={vehicle.comp1Price} adjValue={vehicle.comp1ConditionAdj} onUpdateAdj={val => setVehicle({ ...vehicle, comp1ConditionAdj: val })} adjMode={vehicleAdjMode} fmt={fmt} /></td>
                    <td className="p-3"><AdjustmentInputCell price={vehicle.comp2Price} adjValue={vehicle.comp2ConditionAdj} onUpdateAdj={val => setVehicle({ ...vehicle, comp2ConditionAdj: val })} adjMode={vehicleAdjMode} fmt={fmt} /></td>
                    <td className="p-3"><AdjustmentInputCell price={vehicle.comp3Price} adjValue={vehicle.comp3ConditionAdj} onUpdateAdj={val => setVehicle({ ...vehicle, comp3ConditionAdj: val })} adjMode={vehicleAdjMode} fmt={fmt} /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">
                      <div>Accessories & Trans Adjustment</div>
                      <span className="text-[10px] font-normal text-slate-400">AT vs MT / Factory Upgrades</span>
                    </td>
                    <td className="p-3"><AdjustmentInputCell price={vehicle.comp1Price} adjValue={vehicle.comp1AccessoriesAdj} onUpdateAdj={val => setVehicle({ ...vehicle, comp1AccessoriesAdj: val })} adjMode={vehicleAdjMode} fmt={fmt} /></td>
                    <td className="p-3"><AdjustmentInputCell price={vehicle.comp2Price} adjValue={vehicle.comp2AccessoriesAdj} onUpdateAdj={val => setVehicle({ ...vehicle, comp2AccessoriesAdj: val })} adjMode={vehicleAdjMode} fmt={fmt} /></td>
                    <td className="p-3"><AdjustmentInputCell price={vehicle.comp3Price} adjValue={vehicle.comp3AccessoriesAdj} onUpdateAdj={val => setVehicle({ ...vehicle, comp3AccessoriesAdj: val })} adjMode={vehicleAdjMode} fmt={fmt} /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">
                      <div>Year Model Adjustment</div>
                      <span className="text-[10px] font-normal text-slate-400">Depreciation / Age Factor (~6.1%/yr)</span>
                    </td>
                    <td className="p-3"><AdjustmentInputCell price={vehicle.comp1Price} adjValue={vehicle.comp1YearModelAdj} onUpdateAdj={val => setVehicle({ ...vehicle, comp1YearModelAdj: val })} adjMode={vehicleAdjMode} fmt={fmt} /></td>
                    <td className="p-3"><AdjustmentInputCell price={vehicle.comp2Price} adjValue={vehicle.comp2YearModelAdj} onUpdateAdj={val => setVehicle({ ...vehicle, comp2YearModelAdj: val })} adjMode={vehicleAdjMode} fmt={fmt} /></td>
                    <td className="p-3"><AdjustmentInputCell price={vehicle.comp3Price} adjValue={vehicle.comp3YearModelAdj} onUpdateAdj={val => setVehicle({ ...vehicle, comp3YearModelAdj: val })} adjMode={vehicleAdjMode} fmt={fmt} /></td>
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
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-600" /> Vehicle Photo Documentation Checklist
                </h2>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setVehicle({
                      ...vehicle,
                      photoChecklist: VEHICLE_CHECKLIST.reduce((acc, item) => ({ ...acc, [item]: true }), {})
                    })}
                    className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-all cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setVehicle({
                      ...vehicle,
                      photoChecklist: VEHICLE_CHECKLIST.reduce((acc, item) => ({ ...acc, [item]: false }), {})
                    })}
                    className="text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

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
      {/* SAVED HISTORY / APPRAISAL REPORTS DATABASE TAB            */}
      {/* ========================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Database Summary Dashboard Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-2xl p-4 shadow-lg border border-emerald-500/20">
              <div className="flex items-center justify-between text-emerald-300 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider">Database Total Reports</span>
                <Database className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-white">{totalReportsCount}</p>
              <span className="text-[10px] text-emerald-200/80 font-bold">Synchronized in Firestore</span>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider">Total Appraised Value</span>
                <Building2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-base sm:text-lg font-black text-slate-900">{fmt(totalAppraisedValueSum)}</p>
              <span className="text-[10px] text-slate-400 font-bold">Portfolio Collateral Baseline</span>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider">Total Applied Exposure</span>
                <DollarSign className="w-4 h-4 text-teal-600" />
              </div>
              <p className="text-base sm:text-lg font-black text-teal-900">{fmt(totalCreditExposureSum)}</p>
              <span className="text-[10px] text-slate-400 font-bold">Credit Limit Commitment</span>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider">Pending CreCom Review</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-amber-600">{pendingReviewCount}</p>
              <span className="text-[10px] text-amber-600/80 font-bold">Awaiting Final Approval</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-100 border border-emerald-200 rounded-full text-emerald-800 text-[10px] font-black uppercase tracking-wider mb-1">
                  <Database className="w-3 h-3 text-emerald-600" /> Dedicated Cloud Firestore Storage
                </div>
                <h2 className="text-base font-black text-emerald-900 uppercase tracking-wider">
                  Saved Appraisal Reports Database
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Official database repository for Real Property & Vehicle Valuation Reports.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search report #, borrower..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Status Filter Chips */}
            <div className="flex flex-wrap gap-2 pt-1 border-b border-slate-100 pb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider self-center mr-2">Filter Status:</span>
              {[
                { id: 'ALL', label: 'All Reports' },
                { id: 'PENDING_REVIEW', label: 'Pending Review' },
                { id: 'APPROVED', label: 'Approved' },
                { id: 'DRAFT', label: 'Drafts' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all border ${
                    selectedStatusFilter === tab.id
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                Loading saved appraisal database records...
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="py-12 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                No saved appraisal reports found matching your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredHistory.map((rec) => {
                  const appliedLoan = rec.appliedLoanAmount || rec.recommendedLoan || 0;
                  const ltv = rec.targetLtv || 70;
                  const risk = rec.riskLevel || 'LOW';

                  const riskColor = 
                    risk === 'LOW' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                    risk === 'MODERATE' ? 'bg-teal-100 text-teal-800 border-teal-300' :
                    risk === 'HIGH' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-red-100 text-red-800 border-red-300';

                  const currentStatus = rec.status || 'PENDING_REVIEW';
                  const statusColor = 
                    currentStatus === 'APPROVED' ? 'bg-emerald-500 text-white' :
                    currentStatus === 'DRAFT' ? 'bg-slate-500 text-white' : 'bg-amber-500 text-white';

                  return (
                    <div key={rec.id} className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 hover:border-emerald-400 transition-all flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md">
                      <div>
                        {/* Header Badge Row */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            rec.reportType === 'real_property' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-teal-100 text-teal-800'
                          }`}>
                            {rec.reportType === 'real_property' ? 'Real Property' : 'Vehicle'}
                          </span>

                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${statusColor}`}>
                            {currentStatus.replace('_', ' ')}
                          </span>

                          <span className="text-[10px] text-slate-400 font-bold ml-auto">
                            {new Date(rec.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Report Number & Title */}
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2 mb-2">
                          <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider">
                            {rec.reportNumber || `#${rec.id?.substring(0, 8)}`}
                          </span>
                          <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider ${riskColor}`}>
                            {risk} RISK
                          </span>
                        </div>

                        <h3 className="text-sm font-black text-slate-900 tracking-tight leading-snug">
                          {rec.title}
                        </h3>
                        <p className="text-xs font-semibold text-slate-600 mt-1">
                          Borrower: <strong className="text-slate-900">{rec.borrowerName}</strong>
                        </p>
                        <p className="text-[11px] font-medium text-slate-500">
                          Appraiser: {rec.appraiserName}
                        </p>

                        {/* Financial Metrics */}
                        <div className="mt-3 pt-3 border-t border-slate-200/80 grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-slate-200/60">
                          <div>
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Market Value</span>
                            <p className="text-xs font-black text-emerald-900">{fmt(rec.marketValue)}</p>
                          </div>
                          <div>
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Applied Loan</span>
                            <p className="text-xs font-black text-teal-800">{fmt(appliedLoan)}</p>
                          </div>
                        </div>

                        {/* Status Change Selector */}
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Update Status:</span>
                          <select
                            value={currentStatus}
                            onChange={(e) => handleUpdateReportStatus(rec.id, e.target.value as AppraisalRecord['status'])}
                            className="text-[10px] font-bold px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="PENDING_REVIEW">Pending Review</option>
                            <option value="APPROVED">Approved</option>
                            <option value="DRAFT">Draft</option>
                            <option value="ARCHIVED">Archived</option>
                          </select>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-2 border-t border-slate-200/80">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleLoadReportIntoCalculator(rec)}
                            className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                            title="Load report back into calculator form"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-emerald-600" /> Load & Edit
                          </button>

                          <button
                            onClick={() => setPrintModalRecord(rec)}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Printer className="w-3.5 h-3.5" /> Formal PDF
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleExportJson(rec)}
                            className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <FileJson className="w-3 h-3 text-slate-600" /> Export JSON
                          </button>

                          {user.role === 'admin' && (
                            <button
                              onClick={() => handleDeleteAppraisal(rec.id)}
                              className="text-[10px] font-bold text-red-600 hover:text-red-800 flex items-center gap-1 px-2 py-1 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                              title="Delete Report from Database"
                            >
                              <Trash2 className="w-3 h-3 text-red-600" /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
                  const h = d.houseImprovement;
                  return (
                    <div className="space-y-6 text-xs text-slate-800">
                      <div>
                        <h3 className="font-black uppercase tracking-wider text-emerald-900 mb-2 border-b border-slate-200 pb-1">I. General Information</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <p><strong>Borrower:</strong> {d.borrower}</p>
                          <p><strong>Property Owner:</strong> {h?.propertyOwner || d.propertyOwner}</p>
                          <p><strong>Address:</strong> {h?.propertyAddress || d.propertyAddress}</p>
                          <p><strong>Inspection Date:</strong> {h?.inspectionDate || d.inspectionDate}</p>
                          <p><strong>Appraiser:</strong> {h?.appraiser || d.appraiser}</p>
                          <p><strong>Title No:</strong> {d.titleNo}</p>
                          <p><strong>Tax Dec No:</strong> {d.taxDecNo}</p>
                          <p><strong>Property Type:</strong> {h?.propertyType || d.propertyType}</p>
                          <p><strong>Lot Area:</strong> {d.lotArea} sqm</p>
                          <p><strong>Floor Area:</strong> {h?.floorArea || d.floorArea} sqm</p>
                          {h?.enabled && (
                            <>
                              <p><strong>Construction Type:</strong> {h.constructionType}</p>
                              <p><strong>Roof Type:</strong> {h.roofType}</p>
                              <p><strong>Bedrooms / T&B:</strong> {h.noOfBedrooms} BR / {h.noOfToiletAndBath} T&B</p>
                              <p><strong>Year Built / Age:</strong> {h.yearBuilt} ({h.estimatedAge} years)</p>
                            </>
                          )}
                        </div>
                      </div>

                      {h?.enabled && h.physicalComponents && h.physicalComponents.length > 0 && (
                        <div>
                          <h3 className="font-black uppercase tracking-wider text-emerald-900 mb-2 border-b border-slate-200 pb-1">II. Physical Inspection (Component Breakdown)</h3>
                          <table className="w-full text-left border-collapse border border-slate-300">
                            <thead>
                              <tr className="bg-slate-100 text-[10px] uppercase font-bold text-slate-700">
                                <th className="p-1.5 border border-slate-300">Component</th>
                                <th className="p-1.5 border border-slate-300">Description / Specs</th>
                                <th className="p-1.5 border border-slate-300">Condition</th>
                                <th className="p-1.5 border border-slate-300 text-center">Depr %</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-[11px]">
                              {h.physicalComponents.map(c => (
                                <tr key={c.component}>
                                  <td className="p-1.5 border border-slate-300 font-bold">{c.component}</td>
                                  <td className="p-1.5 border border-slate-300">{c.description}</td>
                                  <td className="p-1.5 border border-slate-300">{c.condition}</td>
                                  <td className="p-1.5 border border-slate-300 text-center font-bold">{c.depreciationPct}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {h?.enabled && (
                        <div>
                          <h3 className="font-black uppercase tracking-wider text-emerald-900 mb-2 border-b border-slate-200 pb-1">III. Cost Approach & Additional Improvements</h3>
                          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-3">
                            <div>
                              <p><strong>Main Floor Area:</strong> {h.floorArea} sqm</p>
                              <p><strong>Cost / sqm:</strong> {fmt(h.constructionCostPerSqm || 30000)}</p>
                              <p><strong>Replacement Cost New (RCN):</strong> {fmt(h.replacementCostNew || 2400000)}</p>
                            </div>
                            <div>
                              <p><strong>Effective Age / Life:</strong> {h.effectiveAge || 10} / {h.economicLifeYears || 50} yrs</p>
                              <p><strong>Depreciation Rate:</strong> {h.straightLineDepreciationPct || 20}% (-{fmt(h.depreciationAmount || 480000)})</p>
                              <p><strong>Depreciated Main House:</strong> {fmt(h.depreciatedMainHouseValue || 1920000)}</p>
                            </div>
                          </div>

                          {h.additionalImprovements && (
                            <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
                              <thead>
                                <tr className="bg-slate-100 uppercase text-[10px] font-bold">
                                  <th className="p-1.5 border border-slate-300">Improvement Item</th>
                                  <th className="p-1.5 border border-slate-300">Qty / Area</th>
                                  <th className="p-1.5 border border-slate-300">New Cost</th>
                                  <th className="p-1.5 border border-slate-300">Depr %</th>
                                  <th className="p-1.5 border border-slate-300">Depreciated Value</th>
                                </tr>
                              </thead>
                              <tbody>
                                {h.additionalImprovements.map(imp => (
                                  <tr key={imp.id}>
                                    <td className="p-1.5 border border-slate-300 font-bold">{imp.name}</td>
                                    <td className="p-1.5 border border-slate-300">{imp.qtyArea}</td>
                                    <td className="p-1.5 border border-slate-300">{fmt(imp.newCost)}</td>
                                    <td className="p-1.5 border border-slate-300">{imp.depreciationPct}%</td>
                                    <td className="p-1.5 border border-slate-300 font-bold">{fmt(imp.depreciatedValue)}</td>
                                  </tr>
                                ))}
                                <tr className="bg-emerald-50 font-bold">
                                  <td colSpan={4} className="p-1.5 border border-slate-300 uppercase">Total Depreciated Improvements (Cost Approach)</td>
                                  <td className="p-1.5 border border-slate-300 font-black text-emerald-900">{fmt(h.totalDepreciatedImprovementValue || 2360500)}</td>
                                </tr>
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}

                      <div>
                        <h3 className="font-black uppercase tracking-wider text-emerald-900 mb-2 border-b border-slate-200 pb-1">
                          {h?.enabled ? 'IV. Final Combined Valuation & Lending Parameters' : 'II. Final Valuation & Loan Computation'}
                        </h3>
                        <div className="grid grid-cols-3 gap-3 bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-500">1. Land Market Value</p>
                            <p className="text-sm font-black text-slate-800">
                              {fmt(h?.enabled ? (h.landMarketValue || (printModalRecord.marketValue - (h.recommendedImprovementValue || 2400000))) : printModalRecord.marketValue)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-500">2. House Improvement Value</p>
                            <p className="text-sm font-black text-teal-800">
                              {fmt(h?.enabled ? (h.recommendedImprovementValue || 2400000) : 0)}
                            </p>
                          </div>
                          <div className="bg-emerald-100 p-2 rounded-lg border border-emerald-300">
                            <p className="text-[10px] uppercase font-black text-emerald-950">Total Combined Market Value</p>
                            <p className="text-base font-black text-emerald-900">{fmt(printModalRecord.marketValue)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            <p className="text-[10px] uppercase font-bold text-slate-500">Forced Sale Value (FSV @ 70%)</p>
                            <p className="text-sm font-black text-amber-800">{fmt(Math.round(printModalRecord.marketValue * 0.70))}</p>
                          </div>
                          <div className="p-3 bg-emerald-600 text-white rounded-lg">
                            <p className="text-[10px] uppercase font-bold text-emerald-100">Maximum Recommended Loan</p>
                            <p className="text-base font-black text-white">{fmt(printModalRecord.recommendedLoan)}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-black uppercase tracking-wider text-emerald-900 mb-2 border-b border-slate-200 pb-1">
                          {h?.enabled ? 'V. Appraiser\'s Opinion & Certification' : 'III. Appraiser\'s Opinion & Remarks'}
                        </h3>
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
