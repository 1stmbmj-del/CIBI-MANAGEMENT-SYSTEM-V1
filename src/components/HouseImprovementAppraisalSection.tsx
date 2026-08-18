import React, { useState } from 'react';
import { 
  Home, 
  Layers, 
  Calculator, 
  TrendingUp, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Sparkles, 
  Zap, 
  RefreshCw, 
  ShieldCheck, 
  DollarSign, 
  Building2, 
  AlertCircle, 
  Info,
  Sliders,
  Check,
  Percent,
  CheckSquare,
  Square
} from 'lucide-react';
import { 
  HouseImprovementAppraisal, 
  HousePhysicalInspectionComponent, 
  AdditionalImprovementItem 
} from '../types';

export const DEFAULT_PHYSICAL_COMPONENTS: HousePhysicalInspectionComponent[] = [
  { component: 'Foundation', description: 'Reinforced Concrete Footing & Tie Beam', condition: 'Good', depreciationPct: 5 },
  { component: 'Structural Frame', description: 'Reinforced Concrete Columns & Beams', condition: 'Good', depreciationPct: 5 },
  { component: 'Exterior Walls', description: 'Plastered Concrete Hollow Blocks (CHB)', condition: 'Good', depreciationPct: 10 },
  { component: 'Interior Walls', description: 'Plastered & Painted CHB / Drywall', condition: 'Good', depreciationPct: 10 },
  { component: 'Flooring', description: 'Ceramic Floor Tiles throughout', condition: 'Good', depreciationPct: 10 },
  { component: 'Ceiling', description: 'Gypsum Board on Metal Furring', condition: 'Good', depreciationPct: 10 },
  { component: 'Roofing', description: 'Rib-Type Longspan Pre-painted GI Sheets', condition: 'Good', depreciationPct: 15 },
  { component: 'Doors & Windows', description: 'Solid Panel Main Door, Aluminum Sliding Windows', condition: 'Good', depreciationPct: 10 },
  { component: 'Electrical', description: 'Concealed PVC Conduits & Standard Fixtures', condition: 'Good', depreciationPct: 10 },
  { component: 'Plumbing', description: 'PPR Waterlines & PVC Sanitary Lines', condition: 'Good', depreciationPct: 10 },
  { component: 'Kitchen', description: 'Granite Countertop with Built-in Cabinets', condition: 'Good', depreciationPct: 15 },
  { component: 'Toilet & Bath', description: 'Full Ceramic Tiles with Standard Fixtures', condition: 'Good', depreciationPct: 15 },
  { component: 'Painting/Finishes', description: 'Latex Acrylic Paint Interior & Exterior', condition: 'Good', depreciationPct: 20 },
  { component: 'Garage/Carport', description: 'Concrete Slab with Steel Canopy', condition: 'Good', depreciationPct: 10 },
  { component: 'Overall Condition', description: 'Well-maintained residential structure', condition: 'Good', depreciationPct: 12 },
];

export const DEFAULT_ADDITIONAL_IMPROVEMENTS: AdditionalImprovementItem[] = [
  { id: 'imp-1', name: 'Main House Structure', qtyArea: '80 sqm', unitCost: 30000, newCost: 2400000, depreciationPct: 20, depreciatedValue: 1920000 },
  { id: 'imp-2', name: 'Garage / Carport', qtyArea: '20 sqm', unitCost: 18000, newCost: 360000, depreciationPct: 20, depreciatedValue: 288000 },
  { id: 'imp-3', name: 'Perimeter Concrete Fence', qtyArea: '30 lm', unitCost: 5000, newCost: 150000, depreciationPct: 25, depreciatedValue: 112500 },
  { id: 'imp-4', name: 'Steel Gate with Grillwork', qtyArea: '1 unit', unitCost: 50000, newCost: 50000, depreciationPct: 20, depreciatedValue: 40000 }
];

export function calculateHouseComparableAdjustments(h: HouseImprovementAppraisal): Partial<HouseImprovementAppraisal> {
  const subjFloor = Number(h.floorArea || 80);
  const subjAge = Number(h.estimatedAge || h.effectiveAge || 10);
  const updates: Partial<HouseImprovementAppraisal> = {};
  const comps = [1, 2, 3] as const;

  comps.forEach(c => {
    const price = Number(h[`comp${c}Price` as keyof HouseImprovementAppraisal] || 0);
    const floorArea = Number(h[`comp${c}FloorArea` as keyof HouseImprovementAppraisal] || 0);
    const yearBuilt = parseInt(String(h[`comp${c}YearBuilt` as keyof HouseImprovementAppraisal] || '')) || (new Date().getFullYear() - 5);
    const compAge = Math.max(0, new Date().getFullYear() - yearBuilt);
    const condStr = String(h[`comp${c}Condition` as keyof HouseImprovementAppraisal] || '').toLowerCase();
    const locStr = String(h[`comp${c}Location` as keyof HouseImprovementAppraisal] || '').toLowerCase();

    if (price <= 0) {
      (updates as any)[`comp${c}LocationAdj`] = 0;
      (updates as any)[`comp${c}FloorAreaAdj`] = 0;
      (updates as any)[`comp${c}ConditionAdj`] = 0;
      (updates as any)[`comp${c}AgeAdj`] = 0;
      (updates as any)[`comp${c}QualityAdj`] = 0;
      (updates as any)[`comp${c}AmenitiesAdj`] = 0;
      (updates as any)[`comp${c}OtherAdj`] = 0;
      return;
    }

    // 1. Floor Area Adjustment: (Subject Floor - Comp Floor) * Rate
    if (floorArea > 0) {
      const floorDiff = subjFloor - floorArea;
      const rate = 18000; // Depreciated house floor cost factor
      (updates as any)[`comp${c}FloorAreaAdj`] = Math.round(floorDiff * rate);
    } else {
      (updates as any)[`comp${c}FloorAreaAdj`] = 0;
    }

    // 2. Age Adjustment: (Comp Age - Subj Age) * ~1.5% per year diff
    const ageDiff = compAge - subjAge;
    (updates as any)[`comp${c}AgeAdj`] = Math.round(ageDiff * (price * 0.015));

    // 3. Condition Adjustment
    let condPct = 0;
    if (condStr.includes('new') || condStr.includes('excellent')) {
      condPct = -0.04;
    } else if (condStr.includes('fair') || condStr.includes('poor') || condStr.includes('repair')) {
      condPct = 0.05;
    }
    (updates as any)[`comp${c}ConditionAdj`] = Math.round(price * condPct);

    // 4. Location Adjustment
    let locPct = 0;
    if (locStr.includes('adjacent') || locStr.includes('phase 2') || locStr.includes('phase 3') || locStr.includes('outside')) {
      locPct = 0.02;
    } else if (locStr.includes('prime') || locStr.includes('main')) {
      locPct = -0.02;
    }
    (updates as any)[`comp${c}LocationAdj`] = Math.round(price * locPct);

    (updates as any)[`comp${c}QualityAdj`] = (updates as any)[`comp${c}QualityAdj`] || 0;
    (updates as any)[`comp${c}AmenitiesAdj`] = (updates as any)[`comp${c}AmenitiesAdj`] || 0;
    (updates as any)[`comp${c}OtherAdj`] = (updates as any)[`comp${c}OtherAdj`] || 0;
  });

  return updates;
}

interface HouseImprovementAppraisalSectionProps {
  data: HouseImprovementAppraisal;
  onChange: (updated: HouseImprovementAppraisal) => void;
  landMarketValue: number;
  fmt: (num: number) => string;
}

export default function HouseImprovementAppraisalSection({
  data,
  onChange,
  landMarketValue,
  fmt
}: HouseImprovementAppraisalSectionProps) {
  const [autoAdjust, setAutoAdjust] = useState(true);
  const [adjMode, setAdjMode] = useState<'percent' | 'peso'>('percent');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemUnitCost, setNewItemUnitCost] = useState<number>(10000);
  const [newItemDeprPct, setNewItemDeprPct] = useState<number>(20);

  const update = (patch: Partial<HouseImprovementAppraisal>) => {
    let next: HouseImprovementAppraisal = { ...data, ...patch };

    // Auto calculate Cost Approach
    const floor = Number(next.floorArea || 80);
    const unitCost = Number(next.constructionCostPerSqm || 30000);
    const rcn = floor * unitCost;
    next.replacementCostNew = rcn;

    const effAge = Number(next.effectiveAge || 10);
    const econLife = Number(next.economicLifeYears || 50);
    const deprPct = econLife > 0 ? Math.min(80, Math.max(0, (effAge / econLife) * 100)) : 20;
    next.straightLineDepreciationPct = Math.round(deprPct * 10) / 10;
    const deprAmount = Math.round(rcn * (deprPct / 100));
    next.depreciationAmount = deprAmount;
    next.depreciatedMainHouseValue = rcn - deprAmount;

    // Auto calculate Additional Improvements
    if (next.additionalImprovements && next.additionalImprovements.length > 0) {
      const updatedItems = next.additionalImprovements.map(item => {
        if (item.name.toLowerCase().includes('main house')) {
          return {
            ...item,
            qtyArea: `${floor} sqm`,
            unitCost: unitCost,
            newCost: rcn,
            depreciationPct: next.straightLineDepreciationPct,
            depreciatedValue: next.depreciatedMainHouseValue
          };
        }
        const numericQty = parseFloat(item.qtyArea) || 1;
        const nCost = item.unitCost > 0 ? Math.round(numericQty * item.unitCost) : item.newCost;
        const dVal = Math.round(nCost * (1 - (item.depreciationPct / 100)));
        return {
          ...item,
          newCost: nCost,
          depreciatedValue: dVal
        };
      });
      next.additionalImprovements = updatedItems;
      next.totalImprovementCostNew = updatedItems.reduce((acc, i) => acc + (i.newCost || 0), 0);
      next.totalDepreciatedImprovementValue = updatedItems.reduce((acc, i) => acc + (i.depreciatedValue || 0), 0);
    } else {
      next.totalImprovementCostNew = rcn;
      next.totalDepreciatedImprovementValue = next.depreciatedMainHouseValue;
    }

    // Auto adjust comps if enabled
    if (autoAdjust) {
      const autoAdjs = calculateHouseComparableAdjustments(next);
      next = { ...next, ...autoAdjs };
    }

    onChange(next);
  };

  // Calculations for Section E (House Comparables)
  const comp1AdjTotal = Number(data.comp1Price || 0) + Number(data.comp1LocationAdj || 0) + Number(data.comp1FloorAreaAdj || 0) + Number(data.comp1ConditionAdj || 0) + Number(data.comp1AgeAdj || 0) + Number(data.comp1QualityAdj || 0) + Number(data.comp1AmenitiesAdj || 0) + Number(data.comp1OtherAdj || 0);
  const comp2AdjTotal = Number(data.comp2Price || 0) + Number(data.comp2LocationAdj || 0) + Number(data.comp2FloorAreaAdj || 0) + Number(data.comp2ConditionAdj || 0) + Number(data.comp2AgeAdj || 0) + Number(data.comp2QualityAdj || 0) + Number(data.comp2AmenitiesAdj || 0) + Number(data.comp2OtherAdj || 0);
  const comp3AdjTotal = Number(data.comp3Price || 0) + Number(data.comp3LocationAdj || 0) + Number(data.comp3FloorAreaAdj || 0) + Number(data.comp3ConditionAdj || 0) + Number(data.comp3AgeAdj || 0) + Number(data.comp3QualityAdj || 0) + Number(data.comp3AmenitiesAdj || 0) + Number(data.comp3OtherAdj || 0);

  const activeCompCounts = [data.comp1Price, data.comp2Price, data.comp3Price].filter(p => Number(p) > 0).length || 1;
  const houseCompAverage = (comp1AdjTotal + comp2AdjTotal + comp3AdjTotal) / activeCompCounts;

  // Final Improvement Reconciliation
  const costWeight = Number(data.costApproachWeight ?? 60);
  const compWeight = Number(data.comparableApproachWeight ?? 40);
  const totalDeprImprovement = Number(data.totalDepreciatedImprovementValue || 2360500);

  const reconciledImprovementValue = Math.round((totalDeprImprovement * (costWeight / 100)) + (houseCompAverage * (compWeight / 100)));
  const recommendedImprovement = data.recommendedImprovementValue > 0 ? data.recommendedImprovementValue : Math.round(reconciledImprovementValue / 10000) * 10000;

  // Final Combined Valuation
  const effectiveLandVal = landMarketValue > 0 ? landMarketValue : Number(data.landMarketValue || 2000000);
  const totalMarketVal = effectiveLandVal + recommendedImprovement;
  const fsvPct = Number(data.forcedSaleValuePct ?? 70);
  const forcedSaleVal = Math.round(totalMarketVal * (fsvPct / 100));
  const maxLtvPct = Number(data.maxLtvPct ?? 70);
  const maxLoanable = Math.round(forcedSaleVal * (maxLtvPct / 100));

  // Handler for adding custom improvement item
  const handleAddImprovement = () => {
    if (!newItemName.trim()) return;
    const numericQty = parseFloat(newItemQty) || 1;
    const nCost = Math.round(numericQty * newItemUnitCost);
    const dVal = Math.round(nCost * (1 - (newItemDeprPct / 100)));
    const newItem: AdditionalImprovementItem = {
      id: `imp-${Date.now()}`,
      name: newItemName.trim(),
      qtyArea: newItemQty || '1 unit',
      unitCost: newItemUnitCost,
      newCost: nCost,
      depreciationPct: newItemDeprPct,
      depreciatedValue: dVal
    };

    const current = data.additionalImprovements || DEFAULT_ADDITIONAL_IMPROVEMENTS;
    const updated = [...current, newItem];
    update({ additionalImprovements: updated });
    setNewItemName('');
    setNewItemQty('');
    setShowAddModal(false);
  };

  const handleRemoveImprovement = (id: string) => {
    const current = data.additionalImprovements || DEFAULT_ADDITIONAL_IMPROVEMENTS;
    const updated = current.filter(item => item.id !== id);
    update({ additionalImprovements: updated });
  };

  const handleUpdateComponent = (index: number, patch: Partial<HousePhysicalInspectionComponent>) => {
    const list = [...(data.physicalComponents || DEFAULT_PHYSICAL_COMPONENTS)];
    list[index] = { ...list[index], ...patch };
    update({ physicalComponents: list });
  };

  return (
    <div className="space-y-6 pt-4">
      {/* ========================================================= */}
      {/* TOGGLE BANNER FOR HOUSE / IMPROVEMENT APPRAISAL           */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border-2 border-emerald-500/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-emerald-300 text-[11px] font-black uppercase tracking-wider">
              <Home className="w-3.5 h-3.5" /> Hiwalay na Pag-Appraise ng Improvement / House
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              House & Improvement Appraisal Module
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl font-medium">
              Hiwalay ang analysis ng <span className="text-emerald-300 font-bold">Land Value</span> at <span className="text-emerald-300 font-bold">Improvement Value</span>. Ginagamit ang <span className="text-amber-300 font-bold">Cost Approach</span> (Replacement Cost & Depreciation) at vinerify gamit ang <span className="text-teal-300 font-bold">Market / Comparable Approach</span>.
            </p>
          </div>

          {/* On/Off Switch Button */}
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md p-2 rounded-2xl border border-emerald-500/40">
            <span className="text-xs font-black uppercase text-emerald-200 tracking-wider pl-2">
              Appraise House/Improvement:
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => update({ enabled: true })}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  data.enabled
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 ring-2 ring-white/20'
                    : 'bg-white/10 hover:bg-white/20 text-slate-300'
                }`}
              >
                <Check className="w-3.5 h-3.5" /> Oo (Active)
              </button>
              <button
                type="button"
                onClick={() => update({ enabled: false })}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  !data.enabled
                    ? 'bg-red-500/80 text-white shadow-lg ring-2 ring-white/20'
                    : 'bg-white/10 hover:bg-white/20 text-slate-300'
                }`}
              >
                Hindi (Land Only)
              </button>
            </div>
          </div>
        </div>

        {/* Quick Value Summary Strip */}
        {data.enabled && (
          <div className="mt-6 pt-5 border-t border-emerald-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] font-black uppercase text-emerald-300 tracking-wider">Land Market Value</span>
              <p className="text-sm sm:text-base font-black text-white mt-0.5">{fmt(effectiveLandVal)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] font-black uppercase text-teal-300 tracking-wider">Improvement Value</span>
              <p className="text-sm sm:text-base font-black text-teal-200 mt-0.5">{fmt(recommendedImprovement)}</p>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-md p-3 rounded-2xl border border-emerald-400/40">
              <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">Total Property Market Value</span>
              <p className="text-base sm:text-lg font-black text-amber-200 mt-0.5">{fmt(totalMarketVal)}</p>
            </div>
            <div className="bg-emerald-500 text-slate-950 p-3 rounded-2xl shadow-md font-black">
              <span className="text-[10px] uppercase text-emerald-950 tracking-wider font-extrabold">Maximum Loanable Amount</span>
              <p className="text-base sm:text-lg font-black text-slate-950 mt-0.5">{fmt(maxLoanable)}</p>
            </div>
          </div>
        )}
      </div>

      {!data.enabled ? (
        <div className="p-8 bg-slate-100 rounded-3xl border border-dashed border-slate-300 text-center space-y-3">
          <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">
            House & Improvement Appraisal is currently set to "Hindi" (Off)
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The appraisal calculation will evaluate the <strong>Land Value only</strong>. Click <strong>"Oo (Active)"</strong> on the switch above if you want to include house physical inspection, replacement cost new, depreciation, and separate improvement appraisal.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ========================================================= */}
          {/* 1. HOUSE/IMPROVEMENT SUBJECT PROPERTY PARTICULARS          */}
          {/* ========================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                <Home className="w-4 h-4 text-emerald-600" /> House / Improvement Particulars (Subject Property)
              </h3>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
                Official Template
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Property Owner</label>
                <input
                  type="text"
                  placeholder="Owner Name"
                  value={data.propertyOwner}
                  onChange={e => update({ propertyOwner: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Property Address</label>
                <input
                  type="text"
                  placeholder="Address"
                  value={data.propertyAddress}
                  onChange={e => update({ propertyAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Property Type</label>
                <select
                  value={data.propertyType}
                  onChange={e => update({ propertyType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="Residential House">Residential House (Single Family)</option>
                  <option value="Residential Townhouse">Residential Townhouse</option>
                  <option value="Residential Duplex">Residential Duplex</option>
                  <option value="Bungalow House">Bungalow House</option>
                  <option value="Commercial Building">Commercial Building</option>
                  <option value="Industrial Warehouse">Industrial Warehouse</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Lot Area (sqm)</label>
                <input
                  type="number"
                  value={data.lotArea}
                  onChange={e => update({ lotArea: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Floor Area (sqm) *</label>
                <input
                  type="number"
                  value={data.floorArea}
                  onChange={e => update({ floorArea: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-300 font-bold text-emerald-950 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">No. of Floors</label>
                <input
                  type="number"
                  value={data.noOfFloors}
                  onChange={e => update({ noOfFloors: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Year Built</label>
                <input
                  type="text"
                  placeholder="e.g. 2016"
                  value={data.yearBuilt}
                  onChange={e => {
                    const yr = parseInt(e.target.value);
                    const age = !isNaN(yr) ? Math.max(0, new Date().getFullYear() - yr) : data.estimatedAge;
                    update({ yearBuilt: e.target.value, estimatedAge: age, effectiveAge: age });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Estimated Age (years)</label>
                <input
                  type="number"
                  value={data.estimatedAge}
                  onChange={e => update({ estimatedAge: Number(e.target.value), effectiveAge: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Construction Type</label>
                <select
                  value={data.constructionType}
                  onChange={e => update({ constructionType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="Concrete">Concrete (Reinforced Frame)</option>
                  <option value="Semi-Concrete">Semi-Concrete (Mixed CHB & Wood)</option>
                  <option value="Wood">Timber / Wood</option>
                  <option value="Steel Frame">Structural Steel Frame</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Roof Type</label>
                <input
                  type="text"
                  placeholder="e.g. Longspan GI / Tile / Deck"
                  value={data.roofType}
                  onChange={e => update({ roofType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Bedrooms / T&B</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="BR"
                    value={data.noOfBedrooms}
                    onChange={e => update({ noOfBedrooms: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                  <input
                    type="number"
                    placeholder="T&B"
                    value={data.noOfToiletAndBath}
                    onChange={e => update({ noOfToiletAndBath: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Garage / Carport</label>
                <input
                  type="text"
                  placeholder="e.g. 1-Car Carport / None"
                  value={data.garage}
                  onChange={e => update({ garage: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Overall Condition</label>
                <select
                  value={data.overallCondition}
                  onChange={e => update({ overallCondition: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="Excellent">Excellent (Like New)</option>
                  <option value="Good">Good (Well Maintained)</option>
                  <option value="Fair">Fair (Needs Minor Repairs)</option>
                  <option value="Poor">Poor (Major Dilapidation)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Occupancy</label>
                <select
                  value={data.occupancy}
                  onChange={e => update({ occupancy: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="Owner Occupied">Owner Occupied</option>
                  <option value="Tenant Occupied">Tenant Occupied</option>
                  <option value="Vacant">Vacant</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Road Access (Width)</label>
                <input
                  type="text"
                  placeholder="e.g. 8 meters"
                  value={data.roadAccessWidth}
                  onChange={e => update({ roadAccessWidth: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Inspection Date / Appraiser</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={data.inspectionDate}
                    onChange={e => update({ inspectionDate: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-800"
                  />
                  <input
                    type="text"
                    placeholder="Appraiser"
                    value={data.appraiser}
                    onChange={e => update({ appraiser: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* A. PHYSICAL INSPECTION (14 COMPONENT BREAKDOWN)           */}
          {/* ========================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> A. Physical Inspection (Component Breakdown)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed inspection of building structural, architectural, and mechanical components.
                </p>
              </div>
              <span className="text-[11px] font-black text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-xl">
                14 Standard Components + Overall
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="p-3 border-b border-slate-200">Component</th>
                    <th className="p-3 border-b border-slate-200">Description / Specifications</th>
                    <th className="p-3 border-b border-slate-200">Condition</th>
                    <th className="p-3 border-b border-slate-200 text-center">Estimated Depreciation %</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium text-slate-700 divide-y divide-slate-100">
                  {(data.physicalComponents || DEFAULT_PHYSICAL_COMPONENTS).map((item, idx) => (
                    <tr key={item.component} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-800 whitespace-nowrap">{item.component}</td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => handleUpdateComponent(idx, { description: e.target.value })}
                          className="w-full bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs"
                        />
                      </td>
                      <td className="p-3">
                        <select
                          value={item.condition}
                          onChange={e => handleUpdateComponent(idx, { condition: e.target.value as any })}
                          className="bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs font-semibold"
                        >
                          <option value="Excellent">Excellent</option>
                          <option value="Good">Good</option>
                          <option value="Fair">Fair</option>
                          <option value="Poor">Poor</option>
                        </select>
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            value={item.depreciationPct}
                            onChange={e => handleUpdateComponent(idx, { depreciationPct: Number(e.target.value) })}
                            className="w-16 bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs text-center font-bold"
                          />
                          <span className="text-slate-400 font-bold">%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================= */}
          {/* B & C. COST APPROACH – REPLACEMENT COST & DEPRECIATION    */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* B. Replacement Cost New (RCN) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-600" /> B. Cost Approach – Replacement Cost
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Formula: <span className="font-mono font-bold text-slate-700">RCN = Floor Area × Current Construction Cost/sqm</span>
                </p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Floor Area (sqm)</label>
                    <input
                      type="number"
                      value={data.floorArea}
                      onChange={e => update({ floorArea: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Cost / sqm (₱)</label>
                    <input
                      type="number"
                      value={data.constructionCostPerSqm}
                      onChange={e => update({ constructionCostPerSqm: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                {/* Construction cost presets */}
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Quick Benchmark Presets:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {[
                      { label: 'Economic (₱22k)', val: 22000 },
                      { label: 'Standard (₱30k)', val: 30000 },
                      { label: 'Semi-Deluxe (₱38k)', val: 38000 },
                      { label: 'Deluxe (₱48k)', val: 48000 },
                      { label: 'Luxury (₱60k)', val: 60000 },
                    ].map(preset => (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => update({ constructionCostPerSqm: preset.val })}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          data.constructionCostPerSqm === preset.val
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-950">Replacement Cost New (RCN)</span>
                    <span className="text-base font-black text-emerald-900">{fmt(data.replacementCostNew)}</span>
                  </div>
                  <p className="text-[10px] text-emerald-700 font-medium">
                    {data.floorArea} sqm × {fmt(data.constructionCostPerSqm)}/sqm = {fmt(data.replacementCostNew)}
                  </p>
                </div>
              </div>
            </div>

            {/* C. Depreciation */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" /> C. Straight-Line Depreciation
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Formula: <span className="font-mono font-bold text-slate-700">Depreciation % = Effective Age ÷ Economic Life</span>
                </p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Effective Age (years)</label>
                    <input
                      type="number"
                      value={data.effectiveAge}
                      onChange={e => update({ effectiveAge: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Economic Life (years)</label>
                    <input
                      type="number"
                      value={data.economicLifeYears}
                      onChange={e => update({ economicLifeYears: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-1 divide-y divide-slate-100 text-xs">
                  <div className="flex justify-between items-center pt-1">
                    <span className="font-bold text-slate-600">Calculated Depreciation Rate:</span>
                    <span className="font-black text-amber-700">{data.straightLineDepreciationPct}%</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-bold text-slate-600">Depreciation Amount (RCN × {data.straightLineDepreciationPct}%):</span>
                    <span className="font-black text-red-600">-{fmt(data.depreciationAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <span className="font-black uppercase text-emerald-950 text-[11px]">Depreciated Main House Value:</span>
                    <span className="font-black text-emerald-900 text-sm">{fmt(data.depreciatedMainHouseValue)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* D. ADDITIONAL IMPROVEMENTS BREAKDOWN                      */}
          {/* ========================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" /> D. Additional Improvements Breakdown
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Granular valuation of Main House, Garage, Fence, Gate, Lanai, and other site improvements.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" /> Add Improvement
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="p-3 border-b border-slate-200">Improvement</th>
                    <th className="p-3 border-b border-slate-200">Qty / Area</th>
                    <th className="p-3 border-b border-slate-200">Unit Cost (₱)</th>
                    <th className="p-3 border-b border-slate-200">New Cost (₱)</th>
                    <th className="p-3 border-b border-slate-200">Depreciation %</th>
                    <th className="p-3 border-b border-slate-200">Depreciated Value (₱)</th>
                    <th className="p-3 border-b border-slate-200 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium text-slate-700 divide-y divide-slate-100">
                  {(data.additionalImprovements || DEFAULT_ADDITIONAL_IMPROVEMENTS).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-800">{item.name}</td>
                      <td className="p-3 text-slate-600 font-semibold">{item.qtyArea}</td>
                      <td className="p-3">{fmt(item.unitCost)}</td>
                      <td className="p-3 font-bold text-slate-800">{fmt(item.newCost)}</td>
                      <td className="p-3 text-amber-700 font-bold">{item.depreciationPct}%</td>
                      <td className="p-3 font-black text-emerald-900">{fmt(item.depreciatedValue)}</td>
                      <td className="p-3 text-center">
                        {!item.name.toLowerCase().includes('main house') && (
                          <button
                            type="button"
                            onClick={() => handleRemoveImprovement(item.id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-900 text-white font-black text-xs">
                    <td colSpan={3} className="p-3.5 uppercase tracking-wider font-extrabold">
                      Total Improvements (Cost Approach)
                    </td>
                    <td className="p-3.5 font-extrabold text-emerald-200">{fmt(data.totalImprovementCostNew)}</td>
                    <td className="p-3.5">-</td>
                    <td className="p-3.5 font-extrabold text-emerald-100 text-sm">{fmt(data.totalDepreciatedImprovementValue)}</td>
                    <td className="p-3.5"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal for adding custom improvement */}
          {showAddModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-black text-emerald-900 uppercase tracking-wider">
                    Add Custom Site Improvement
                  </h4>
                  <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Improvement Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Lanai / Paved Driveway / Swimming Pool"
                      value={newItemName}
                      onChange={e => setNewItemName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Quantity / Area</label>
                      <input
                        type="text"
                        placeholder="e.g. 25 sqm, 1 unit"
                        value={newItemQty}
                        onChange={e => setNewItemQty(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Unit Cost (₱)</label>
                      <input
                        type="number"
                        value={newItemUnitCost}
                        onChange={e => setNewItemUnitCost(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Depreciation %</label>
                    <input
                      type="number"
                      value={newItemDeprPct}
                      onChange={e => setNewItemDeprPct(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddImprovement}
                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md"
                  >
                    Add Improvement
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* E. COMPARABLE HOUSE ANALYSIS (MARKET APPROACH)            */}
          {/* ========================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6 overflow-x-auto">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" /> E. Comparable House Analysis (Market Approach)
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !autoAdjust;
                      setAutoAdjust(nextVal);
                      if (nextVal) {
                        const adjs = calculateHouseComparableAdjustments(data);
                        update(adjs);
                      }
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                      autoAdjust 
                        ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Zap className={`w-3.5 h-3.5 ${autoAdjust ? 'text-amber-300 fill-amber-300' : 'text-slate-400'}`} />
                    {autoAdjust ? 'Auto Adjust: ACTIVE' : 'Auto Adjust: MANUAL'}
                  </button>
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setAdjMode('percent')}
                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                        adjMode === 'percent' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjMode('peso')}
                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                        adjMode === 'peso' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      ₱
                    </button>
                  </div>
                </div>
              </div>

              {/* Factors Comparison Grid */}
              <table className="w-full mt-4 text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="p-3 border-b border-slate-200">Factor</th>
                    <th className="p-3 border-b border-slate-200 bg-emerald-50/50 text-emerald-900">Subject Property</th>
                    <th className="p-3 border-b border-slate-200">Comparable 1</th>
                    <th className="p-3 border-b border-slate-200">Comparable 2</th>
                    <th className="p-3 border-b border-slate-200">Comparable 3</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium text-slate-700 divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-black text-slate-600">Location</td>
                    <td className="p-3 bg-emerald-50/20 font-bold">{data.propertyAddress || 'Subject Location'}</td>
                    <td className="p-3"><input type="text" value={data.comp1Location} onChange={e => update({ comp1Location: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-semibold" /></td>
                    <td className="p-3"><input type="text" value={data.comp2Location} onChange={e => update({ comp2Location: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-semibold" /></td>
                    <td className="p-3"><input type="text" value={data.comp3Location} onChange={e => update({ comp3Location: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-semibold" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Floor Area (sqm)</td>
                    <td className="p-3 bg-emerald-50/20 font-bold">{data.floorArea} sqm</td>
                    <td className="p-3"><input type="number" value={data.comp1FloorArea} onChange={e => update({ comp1FloorArea: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={data.comp2FloorArea} onChange={e => update({ comp2FloorArea: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                    <td className="p-3"><input type="number" value={data.comp3FloorArea} onChange={e => update({ comp3FloorArea: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Lot Area (sqm)</td>
                    <td className="p-3 bg-emerald-50/20 font-bold">{data.lotArea} sqm</td>
                    <td className="p-3"><input type="number" value={data.comp1LotArea} onChange={e => update({ comp1LotArea: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="number" value={data.comp2LotArea} onChange={e => update({ comp2LotArea: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="number" value={data.comp3LotArea} onChange={e => update({ comp3LotArea: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Year Built / Age</td>
                    <td className="p-3 bg-emerald-50/20 font-bold">{data.yearBuilt} ({data.estimatedAge} yrs)</td>
                    <td className="p-3"><input type="text" value={data.comp1YearBuilt} onChange={e => update({ comp1YearBuilt: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={data.comp2YearBuilt} onChange={e => update({ comp2YearBuilt: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={data.comp3YearBuilt} onChange={e => update({ comp3YearBuilt: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-black text-slate-600">Condition</td>
                    <td className="p-3 bg-emerald-50/20 font-bold">{data.overallCondition}</td>
                    <td className="p-3"><input type="text" value={data.comp1Condition} onChange={e => update({ comp1Condition: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={data.comp2Condition} onChange={e => update({ comp2Condition: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="text" value={data.comp3Condition} onChange={e => update({ comp3Condition: e.target.value })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                  </tr>
                  <tr className="bg-slate-50/50 font-bold">
                    <td className="p-3 font-black text-slate-800">Selling Price</td>
                    <td className="p-3 bg-emerald-100/50 text-slate-400 font-bold text-center">-</td>
                    <td className="p-3"><input type="number" value={data.comp1Price} onChange={e => update({ comp1Price: Number(e.target.value) })} className="w-full bg-white border border-slate-300 font-bold text-emerald-800 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="number" value={data.comp2Price} onChange={e => update({ comp2Price: Number(e.target.value) })} className="w-full bg-white border border-slate-300 font-bold text-emerald-800 px-2 py-1 rounded-md text-xs" /></td>
                    <td className="p-3"><input type="number" value={data.comp3Price} onChange={e => update({ comp3Price: Number(e.target.value) })} className="w-full bg-white border border-slate-300 font-bold text-emerald-800 px-2 py-1 rounded-md text-xs" /></td>
                  </tr>
                </tbody>
              </table>

              {/* Adjustments Grid */}
              <div className="mt-6">
                <h4 className="text-xs font-black uppercase text-emerald-900 tracking-wider mb-2">
                  House Adjustments Summary
                </h4>
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="p-3 border-b border-slate-200">Adjustment Item</th>
                      <th className="p-3 border-b border-slate-200">Comp 1 (₱)</th>
                      <th className="p-3 border-b border-slate-200">Comp 2 (₱)</th>
                      <th className="p-3 border-b border-slate-200">Comp 3 (₱)</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-medium text-slate-700 divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 font-bold text-slate-600">Location</td>
                      <td className="p-3"><input type="number" value={data.comp1LocationAdj} onChange={e => update({ comp1LocationAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                      <td className="p-3"><input type="number" value={data.comp2LocationAdj} onChange={e => update({ comp2LocationAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                      <td className="p-3"><input type="number" value={data.comp3LocationAdj} onChange={e => update({ comp3LocationAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-600">Floor Area</td>
                      <td className="p-3"><input type="number" value={data.comp1FloorAreaAdj} onChange={e => update({ comp1FloorAreaAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                      <td className="p-3"><input type="number" value={data.comp2FloorAreaAdj} onChange={e => update({ comp2FloorAreaAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                      <td className="p-3"><input type="number" value={data.comp3FloorAreaAdj} onChange={e => update({ comp3FloorAreaAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-600">Condition</td>
                      <td className="p-3"><input type="number" value={data.comp1ConditionAdj} onChange={e => update({ comp1ConditionAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                      <td className="p-3"><input type="number" value={data.comp2ConditionAdj} onChange={e => update({ comp2ConditionAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                      <td className="p-3"><input type="number" value={data.comp3ConditionAdj} onChange={e => update({ comp3ConditionAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-600">Age / Year Built</td>
                      <td className="p-3"><input type="number" value={data.comp1AgeAdj} onChange={e => update({ comp1AgeAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                      <td className="p-3"><input type="number" value={data.comp2AgeAdj} onChange={e => update({ comp2AgeAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                      <td className="p-3"><input type="number" value={data.comp3AgeAdj} onChange={e => update({ comp3AgeAdj: Number(e.target.value) })} className="w-full bg-white border border-slate-200 px-2 py-1 rounded-md text-xs" /></td>
                    </tr>
                    <tr className="bg-emerald-900 text-white font-black text-xs">
                      <td className="p-3.5 uppercase tracking-wider">Adjusted Comparable Value</td>
                      <td className="p-3.5 font-extrabold text-emerald-200">{fmt(comp1AdjTotal)}</td>
                      <td className="p-3.5 font-extrabold text-emerald-200">{fmt(comp2AdjTotal)}</td>
                      <td className="p-3.5 font-extrabold text-emerald-200">{fmt(comp3AdjTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* F. FINAL RECONCILIATION (COST vs COMPARABLE APPROACH)     */}
          {/* ========================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> F. Final Improvement Valuation Reconciliation
              </h3>
              <span className="text-xs font-extrabold text-emerald-800">
                Weight Split: Cost ({costWeight}%) / Market ({compWeight}%)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <div>
                    <span className="text-xs font-bold text-slate-700">Cost Approach (Indicated Value)</span>
                    <p className="text-[10px] text-slate-400">Total Depreciated Improvements</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-800">{fmt(totalDeprImprovement)}</span>
                    <span className="block text-[10px] font-bold text-emerald-700">Weight: {costWeight}%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <div>
                    <span className="text-xs font-bold text-slate-700">Comparable Approach (Indicated Value)</span>
                    <p className="text-[10px] text-slate-400">Market 3-Comparable Average</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-800">{fmt(houseCompAverage)}</span>
                    <span className="block text-[10px] font-bold text-teal-700">Weight: {compWeight}%</span>
                  </div>
                </div>

                {/* Weight slider */}
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/60 space-y-2">
                  <div className="flex justify-between text-[11px] font-black text-emerald-950">
                    <span>Cost Weight: {costWeight}%</span>
                    <span>Market Weight: {100 - costWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={costWeight}
                    onChange={e => {
                      const cw = Number(e.target.value);
                      update({ costApproachWeight: cw, comparableApproachWeight: 100 - cw });
                    }}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-3 flex flex-col justify-between">
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-900 tracking-wider">Reconciled Improvement Value</span>
                  <p className="text-lg font-black text-emerald-900">{fmt(reconciledImprovementValue)}</p>
                  <p className="text-[10px] text-emerald-700 font-medium">
                    ({fmt(totalDeprImprovement)} × {costWeight}%) + ({fmt(houseCompAverage)} × {compWeight}%)
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                    Recommended Improvement Value (₱)
                  </label>
                  <input
                    type="number"
                    value={recommendedImprovement}
                    onChange={e => update({ recommendedImprovementValue: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-emerald-50/80 border-2 border-emerald-500/40 rounded-xl text-sm font-black text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 italic">* Editable field. Defaults to rounded reconciled value.</p>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* G. FINAL COMBINED PROPERTY VALUE & LENDING APPRAISAL      */}
          {/* ========================================================= */}
          <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-emerald-500/30 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                  Comprehensive Collateral Valuation
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" /> G. Final Property & Lending Appraisal
                </h3>
              </div>
              <span className="text-xs font-black bg-emerald-500/30 text-emerald-200 px-3 py-1 rounded-xl border border-emerald-400/40">
                Land + Improvement Combined
              </span>
            </div>

            {/* Core Component Breakdown Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <span className="text-[10px] font-black uppercase text-emerald-300 tracking-wider">1. Land Value</span>
                <p className="text-xl font-black text-white mt-1">{fmt(effectiveLandVal)}</p>
                <span className="text-[10px] text-emerald-200/80">From Land Sales Analysis</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <span className="text-[10px] font-black uppercase text-teal-300 tracking-wider">2. Improvement Value</span>
                <p className="text-xl font-black text-teal-200 mt-1">{fmt(recommendedImprovement)}</p>
                <span className="text-[10px] text-teal-200/80">From House Appraisal Module</span>
              </div>

              <div className="bg-emerald-500/20 backdrop-blur-md p-4 rounded-2xl border-2 border-emerald-400/50">
                <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">Total Market Value (1 + 2)</span>
                <p className="text-2xl font-black text-amber-200 mt-1">{fmt(totalMarketVal)}</p>
                <span className="text-[10px] text-amber-200/80">Combined Property Market Value</span>
              </div>
            </div>

            {/* Lending Standards & Loan Limit Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="bg-black/30 p-4 rounded-2xl border border-white/10">
                <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider">Market Value</span>
                <p className="text-base sm:text-lg font-black text-white mt-0.5">{fmt(totalMarketVal)}</p>
                <span className="text-[10px] text-slate-400">Baseline Appraisal</span>
              </div>

              <div className="bg-black/30 p-4 rounded-2xl border border-white/10">
                <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider">Forced Sale Value (FSV @ 70%)</span>
                <p className="text-base sm:text-lg font-black text-amber-300 mt-0.5">{fmt(forcedSaleVal)}</p>
                <span className="text-[10px] text-slate-400">Liquidation Benchmark</span>
              </div>

              <div className="bg-black/30 p-4 rounded-2xl border border-white/10">
                <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider">Maximum LTV</span>
                <p className="text-base sm:text-lg font-black text-teal-300 mt-0.5">{maxLtvPct}%</p>
                <span className="text-[10px] text-slate-400">Loan to Collateral Cap</span>
              </div>

              <div className="bg-emerald-500 text-slate-950 p-4 rounded-2xl shadow-lg font-black">
                <span className="text-[10px] uppercase text-emerald-950 tracking-wider font-extrabold">Maximum Loanable Amount</span>
                <p className="text-xl font-black text-slate-950 mt-0.5">{fmt(maxLoanable)}</p>
                <span className="text-[10px] text-emerald-900 font-extrabold">FSV × {maxLtvPct}% Limit</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
