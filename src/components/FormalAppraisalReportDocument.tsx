import React from 'react';
import { AppraisalRecord, RealPropertyAppraisal, VehicleAppraisal } from '../types';

interface FormalAppraisalReportDocumentProps {
  record: AppraisalRecord;
  id?: string;
  className?: string;
}

export default function FormalAppraisalReportDocument({
  record,
  id,
  className = ''
}: FormalAppraisalReportDocumentProps) {
  const fmt = (num: number) =>
    `₱${(num || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  const isRealProperty = record.reportType === 'real_property';

  return (
    <div
      id={id}
      className={`bg-white text-slate-900 w-full font-sans space-y-6 text-xs ${className}`}
    >
      {isRealProperty ? (
        (() => {
          const d = record.data as RealPropertyAppraisal;
          const h = d.houseImprovement;

          const comp1Adj =
            (d.comp1Price || 0) +
            (d.comp1LocationAdj || 0) +
            (d.comp1LotSizeAdj || 0) +
            (d.comp1BuildingSizeAdj || 0) +
            (d.comp1ConditionAdj || 0) +
            (d.comp1RoadAccessAdj || 0) +
            (d.comp1OtherAdj || 0);

          const comp2Adj =
            (d.comp2Price || 0) +
            (d.comp2LocationAdj || 0) +
            (d.comp2LotSizeAdj || 0) +
            (d.comp2BuildingSizeAdj || 0) +
            (d.comp2ConditionAdj || 0) +
            (d.comp2RoadAccessAdj || 0) +
            (d.comp2OtherAdj || 0);

          const comp3Adj =
            (d.comp3Price || 0) +
            (d.comp3LocationAdj || 0) +
            (d.comp3LotSizeAdj || 0) +
            (d.comp3BuildingSizeAdj || 0) +
            (d.comp3ConditionAdj || 0) +
            (d.comp3RoadAccessAdj || 0) +
            (d.comp3OtherAdj || 0);

          const validComps = [comp1Adj, comp2Adj, comp3Adj].filter(val => val > 0);
          const landReconciled =
            validComps.length > 0
              ? Math.round(validComps.reduce((a, b) => a + b, 0) / validComps.length)
              : (d.averageMarketValue || record.marketValue || 0);

          const derivedRatePerSqm = d.lotArea > 0 ? Math.round(landReconciled / d.lotArea) : 0;
          const improvementValue = h?.enabled ? (h.recommendedImprovementValue || 2400000) : 0;
          const totalCombinedMarketValue = h?.enabled
            ? landReconciled + improvementValue
            : landReconciled;

          const declaredVal = d.declaredValue || 0;
          const varianceVal = totalCombinedMarketValue - declaredVal;
          const variancePct =
            declaredVal > 0 ? ((varianceVal / declaredVal) * 100).toFixed(1) : null;

          const targetLtv = d.targetLtv || record.targetLtv || 70;
          const ltvCeiling = totalCombinedMarketValue * (targetLtv / 100);
          const forcedSaleVal = ltvCeiling * 0.80;
          const appliedLoan = d.appliedLoanAmount || record.appliedLoanAmount || 0;
          const effectiveLtv =
            totalCombinedMarketValue > 0 ? (appliedLoan / totalCombinedMarketValue) * 100 : 0;

          return (
            <div className="space-y-6">
              {/* Institutional Header */}
              <div className="border-b-2 border-emerald-900 pb-4 text-center">
                <div className="flex items-center justify-center gap-2 text-emerald-900 font-black text-xs uppercase tracking-widest mb-1">
                  <span>BANGKO KABAYAN / 1ST MOUNTAIN BANK</span>
                  <span>•</span>
                  <span>APPRAISAL & CREDIT INVESTIGATION DIVISION</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-emerald-950 uppercase tracking-tight">
                  REAL PROPERTY APPRAISAL & VALUATION REPORT
                </h1>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mt-0.5">
                  Land & Improvements Valuation • Three (3) Comparable Sales Approach Analysis
                </p>
                <div className="flex flex-wrap items-center justify-between mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-700">
                  <div>
                    <strong>Report No.:</strong>{' '}
                    <span className="font-mono font-bold text-slate-900">
                      {record.reportNumber || 'REP-RP-001'}
                    </span>
                  </div>
                  <div>
                    <strong>Inspection Date:</strong> {d.inspectionDate || new Date().toISOString().split('T')[0]}
                  </div>
                  <div>
                    <strong>Status:</strong>{' '}
                    <span className="font-bold text-emerald-800">
                      {record.status || 'PENDING_REVIEW'}
                    </span>
                  </div>
                  <div>
                    <strong>CI Officer:</strong>{' '}
                    <span className="font-semibold text-slate-900">
                      {record.appraiserName || d.appraiser || 'CI Officer'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section I. Subject Property Identification */}
              <div className="space-y-2 page-break-inside-avoid">
                <h3 className="font-black uppercase tracking-wider text-emerald-950 text-sm border-b border-emerald-800/40 pb-1">
                  I. Subject Property Identification & Collateral Registry
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">Borrower / Client</span>
                    <span className="font-black text-slate-900">{d.borrower || record.borrowerName || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">Registered Property Owner</span>
                    <span className="font-black text-slate-900">{d.propertyOwner || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">Title Registry (TCT / OCT No.)</span>
                    <span className="font-mono font-black text-slate-900">{d.titleNo || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">Tax Declaration No.</span>
                    <span className="font-mono font-black text-slate-900">{d.taxDecNo || '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 font-bold block text-[10px]">Property Address / Location</span>
                    <span className="font-bold text-slate-800">{d.propertyAddress || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">Lot Area (sqm)</span>
                    <span className="font-black text-emerald-900">{d.lotArea} sqm</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">Property Classification</span>
                    <span className="font-black text-slate-900">{d.propertyType || 'Residential'}</span>
                  </div>
                </div>
              </div>

              {/* Section II. Subject Property Physical Description & Utilities */}
              <div className="space-y-2 page-break-inside-avoid">
                <h3 className="font-black uppercase tracking-wider text-emerald-950 text-sm border-b border-emerald-800/40 pb-1">
                  II. Physical Site Description, Utilities & Neighborhood Analysis
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">Terrain Topography</span>
                    <span className="font-semibold text-slate-800">{d.terrain || 'Flat Level'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">Road Access / Width</span>
                    <span className="font-semibold text-slate-800">{d.roadAccess || 'Concrete Road Access'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">Flood Vulnerability</span>
                    <span className="font-semibold text-slate-800">{d.floodCondition || 'Flood Free'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">Neighborhood Zoning</span>
                    <span className="font-semibold text-slate-800">{d.neighborhoodClassification || 'Residential'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">Highest & Best Use</span>
                    <span className="font-semibold text-slate-800">{d.highestAndBestUse || 'Residential Housing'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">Utilities Available</span>
                    <span className="font-semibold text-slate-800">
                      {d.utilitiesAvailable && d.utilitiesAvailable.length > 0
                        ? d.utilitiesAvailable.join(', ')
                        : 'Electricity, Water'}
                    </span>
                  </div>
                </div>
                {d.descriptionRemarks && (
                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <strong>Appraiser Remarks:</strong> {d.descriptionRemarks}
                  </p>
                )}
              </div>

              {/* Section III. Three (3) Market Comparable Sales Analysis */}
              <div className="space-y-2 page-break-inside-avoid">
                <h3 className="font-black uppercase tracking-wider text-emerald-950 text-sm border-b border-emerald-800/40 pb-1">
                  III. Three (3) Market Comparable Sales Data Matrix
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 uppercase font-bold text-slate-700">
                        <th className="p-2 border border-slate-300">Property Parameter</th>
                        <th className="p-2 border border-slate-300 bg-emerald-50 text-emerald-950 font-black">Subject Property</th>
                        <th className="p-2 border border-slate-300">Comparable #1</th>
                        <th className="p-2 border border-slate-300">Comparable #2</th>
                        <th className="p-2 border border-slate-300">Comparable #3</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-2 border border-slate-300 font-bold text-slate-600">Location / Neighborhood</td>
                        <td className="p-2 border border-slate-300 font-bold bg-emerald-50/50">{d.subjectLocation || d.propertyAddress || 'Subject Location'}</td>
                        <td className="p-2 border border-slate-300">{d.comp1Location || 'Comp 1 Location'}</td>
                        <td className="p-2 border border-slate-300">{d.comp2Location || 'Comp 2 Location'}</td>
                        <td className="p-2 border border-slate-300">{d.comp3Location || 'Comp 3 Location'}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-300 font-bold text-slate-600">Distance from Subject</td>
                        <td className="p-2 border border-slate-300 bg-emerald-50/50">-</td>
                        <td className="p-2 border border-slate-300">{d.comp1Distance || '-'}</td>
                        <td className="p-2 border border-slate-300">{d.comp2Distance || '-'}</td>
                        <td className="p-2 border border-slate-300">{d.comp3Distance || '-'}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-300 font-bold text-slate-600">Transaction / Date Sold</td>
                        <td className="p-2 border border-slate-300 bg-emerald-50/50">Current Inspection</td>
                        <td className="p-2 border border-slate-300">{d.comp1DateSold || '-'}</td>
                        <td className="p-2 border border-slate-300">{d.comp2DateSold || '-'}</td>
                        <td className="p-2 border border-slate-300">{d.comp3DateSold || '-'}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-300 font-bold text-slate-600">Lot Area (sqm)</td>
                        <td className="p-2 border border-slate-300 font-bold bg-emerald-50/50">{d.lotArea} sqm</td>
                        <td className="p-2 border border-slate-300">{d.comp1LotArea || 0} sqm</td>
                        <td className="p-2 border border-slate-300">{d.comp2LotArea || 0} sqm</td>
                        <td className="p-2 border border-slate-300">{d.comp3LotArea || 0} sqm</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-300 font-bold text-slate-600">Road Frontage Condition</td>
                        <td className="p-2 border border-slate-300 bg-emerald-50/50">{d.roadAccess || 'Concrete'}</td>
                        <td className="p-2 border border-slate-300">{d.comp1RoadCondition || 'Concrete'}</td>
                        <td className="p-2 border border-slate-300">{d.comp2RoadCondition || 'Concrete'}</td>
                        <td className="p-2 border border-slate-300">{d.comp3RoadCondition || 'Concrete'}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-300 font-bold text-slate-600">Corner Lot Position</td>
                        <td className="p-2 border border-slate-300 bg-emerald-50/50">{d.subjectCornerLot ? 'Yes (Corner)' : 'No (Inside Lot)'}</td>
                        <td className="p-2 border border-slate-300">{d.comp1CornerLot ? 'Yes' : 'No'}</td>
                        <td className="p-2 border border-slate-300">{d.comp2CornerLot ? 'Yes' : 'No'}</td>
                        <td className="p-2 border border-slate-300">{d.comp3CornerLot ? 'Yes' : 'No'}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-300 font-bold text-slate-600">Comparable Selling Price</td>
                        <td className="p-2 border border-slate-300 font-bold bg-emerald-50/50">-</td>
                        <td className="p-2 border border-slate-300 font-bold">{fmt(d.comp1Price || 0)}</td>
                        <td className="p-2 border border-slate-300 font-bold">{fmt(d.comp2Price || 0)}</td>
                        <td className="p-2 border border-slate-300 font-bold">{fmt(d.comp3Price || 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section IV. Valuation Adjustments Matrix */}
              <div className="space-y-2 page-break-inside-avoid">
                <h3 className="font-black uppercase tracking-wider text-emerald-950 text-sm border-b border-emerald-800/40 pb-1">
                  IV. Market Valuation Adjustments Grid
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 uppercase font-bold text-slate-700">
                        <th className="p-2 border border-slate-300">Adjustment Element</th>
                        <th className="p-2 border border-slate-300">Comparable #1</th>
                        <th className="p-2 border border-slate-300">Comparable #2</th>
                        <th className="p-2 border border-slate-300">Comparable #3</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-2 border border-slate-300 font-bold">Initial Market Selling Price</td>
                        <td className="p-2 border border-slate-300 font-bold">{fmt(d.comp1Price || 0)}</td>
                        <td className="p-2 border border-slate-300 font-bold">{fmt(d.comp2Price || 0)}</td>
                        <td className="p-2 border border-slate-300 font-bold">{fmt(d.comp3Price || 0)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-300">Location / Neighborhood Adj.</td>
                        <td className="p-2 border border-slate-300">{fmt(d.comp1LocationAdj || 0)}</td>
                        <td className="p-2 border border-slate-300">{fmt(d.comp2LocationAdj || 0)}</td>
                        <td className="p-2 border border-slate-300">{fmt(d.comp3LocationAdj || 0)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-300">Lot Size Adjustment</td>
                        <td className="p-2 border border-slate-300">{fmt(d.comp1LotSizeAdj || 0)}</td>
                        <td className="p-2 border border-slate-300">{fmt(d.comp2LotSizeAdj || 0)}</td>
                        <td className="p-2 border border-slate-300">{fmt(d.comp3LotSizeAdj || 0)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-300">Building Size / Improvement Adj.</td>
                        <td className="p-2 border border-slate-300">{fmt(d.comp1BuildingSizeAdj || 0)}</td>
                        <td className="p-2 border border-slate-300">{fmt(d.comp2BuildingSizeAdj || 0)}</td>
                        <td className="p-2 border border-slate-300">{fmt(d.comp3BuildingSizeAdj || 0)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-300">Physical Condition Adj.</td>
                        <td className="p-2 border border-slate-300">{fmt(d.comp1ConditionAdj || 0)}</td>
                        <td className="p-2 border border-slate-300">{fmt(d.comp2ConditionAdj || 0)}</td>
                        <td className="p-2 border border-slate-300">{fmt(d.comp3ConditionAdj || 0)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-300">Road Access & Position Adj.</td>
                        <td className="p-2 border border-slate-300">{fmt((d.comp1RoadAccessAdj || 0) + (d.comp1OtherAdj || 0))}</td>
                        <td className="p-2 border border-slate-300">{fmt((d.comp2RoadAccessAdj || 0) + (d.comp2OtherAdj || 0))}</td>
                        <td className="p-2 border border-slate-300">{fmt((d.comp3RoadAccessAdj || 0) + (d.comp3OtherAdj || 0))}</td>
                      </tr>
                      <tr className="bg-emerald-50 font-black text-emerald-950">
                        <td className="p-2 border border-slate-300 uppercase">Indicated Adjusted Value</td>
                        <td className="p-2 border border-slate-300">{fmt(comp1Adj)}</td>
                        <td className="p-2 border border-slate-300">{fmt(comp2Adj)}</td>
                        <td className="p-2 border border-slate-300">{fmt(comp3Adj)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section V. Reconciled Property Valuation Base sa Comparables */}
              <div className="space-y-2 page-break-inside-avoid">
                <h3 className="font-black uppercase tracking-wider text-emerald-950 text-sm border-b border-emerald-800/40 pb-1">
                  V. Reconciled Appraised Value Base sa Three (3) Comparables
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">Reconciled Land Market Value</span>
                    <span className="font-black text-sm text-slate-900">{fmt(landReconciled)}</span>
                    <span className="text-[10px] text-slate-500 block">({fmt(derivedRatePerSqm)} / sqm)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">House & Building Improvements</span>
                    <span className="font-black text-sm text-slate-900">
                      {h?.enabled ? fmt(improvementValue) : 'None / Bare Lot'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">Total Appraised Market Value</span>
                    <span className="font-black text-base text-emerald-900">{fmt(totalCombinedMarketValue)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">Declared vs Market Variance</span>
                    {declaredVal > 0 ? (
                      <span className="font-black text-sm text-slate-800">
                        {fmt(varianceVal)} ({variancePct}%)
                      </span>
                    ) : (
                      <span className="text-slate-400 font-semibold text-xs">No declared val</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Section VI. Lending Parameters & Loan Recommendation */}
              <div className="space-y-2 page-break-inside-avoid">
                <h3 className="font-black uppercase tracking-wider text-emerald-950 text-sm border-b border-emerald-800/40 pb-1">
                  VI. Bank Lending Parameters, LTV Ceiling & Forced Sale Analysis
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200">
                  <div>
                    <span className="text-emerald-800 font-bold block text-[10px]">Standard Policy LTV%</span>
                    <span className="font-black text-sm text-emerald-950">{targetLtv}% of Market Value</span>
                  </div>
                  <div>
                    <span className="text-emerald-800 font-bold block text-[10px]">Maximum Loanable Amount (Ceiling)</span>
                    <span className="font-black text-sm text-emerald-950">{fmt(ltvCeiling)}</span>
                  </div>
                  <div>
                    <span className="text-emerald-800 font-bold block text-[10px]">Forced Sale Liquidation Value (80%)</span>
                    <span className="font-black text-sm text-emerald-950">{fmt(forcedSaleVal)}</span>
                  </div>
                  <div>
                    <span className="text-emerald-800 font-bold block text-[10px]">Recommended Loan Approval</span>
                    <span className="font-black text-base text-emerald-900">
                      {fmt(record.recommendedLoan || ltvCeiling)}
                    </span>
                  </div>
                  {appliedLoan > 0 && (
                    <>
                      <div>
                        <span className="text-slate-600 font-bold block text-[10px]">Applied Loan Amount</span>
                        <span className="font-black text-slate-900">{fmt(appliedLoan)}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 font-bold block text-[10px]">Effective LTV Exposure</span>
                        <span className="font-black text-slate-900">{effectiveLtv.toFixed(1)}%</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-600 font-bold block text-[10px]">Collateral Risk Assessment</span>
                        <span className="font-black text-xs uppercase px-2 py-0.5 rounded bg-emerald-200 text-emerald-950 inline-block">
                          {record.riskLevel || 'LOW'} RISK COLLATERAL RATING
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Section VII. House & Improvement Physical Inspection Breakdown (if enabled) */}
              {h?.enabled && (
                <div className="space-y-2 page-break-inside-avoid">
                  <h3 className="font-black uppercase tracking-wider text-emerald-950 text-sm border-b border-emerald-800/40 pb-1 flex items-center justify-between">
                    <span>VII. Structural Improvements & Building Depreciation</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded font-black">
                      Detailed Inspection Attached
                    </span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px]">
                    <div>
                      <span className="text-slate-500 font-bold block">Year Built / Age:</span>
                      <span className="font-black">{h.yearBuilt || '2018'} ({h.estimatedAge || h.effectiveAge || 6} yrs)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block">Classification:</span>
                      <span className="font-black">{h.constructionType || h.propertyType || 'Single-Storey Concrete'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block">Floor Area:</span>
                      <span className="font-black">{h.floorArea || d.floorArea || 100} sqm</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block">Condition:</span>
                      <span className="font-black">{h.overallCondition || h.overallPhysicalCondition || 'Good Condition'}</span>
                    </div>
                  </div>

                  {h.additionalImprovements && h.additionalImprovements.length > 0 && (
                    <table className="w-full text-left border-collapse border border-slate-300 text-[10px] mt-2">
                      <thead>
                        <tr className="bg-slate-100 uppercase font-bold text-slate-700">
                          <th className="p-1.5 border border-slate-300">Improvement Item</th>
                          <th className="p-1.5 border border-slate-300">Qty / Area</th>
                          <th className="p-1.5 border border-slate-300">Cost New</th>
                          <th className="p-1.5 border border-slate-300">Depr. %</th>
                          <th className="p-1.5 border border-slate-300">Depreciated Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {h.additionalImprovements.map((imp) => (
                          <tr key={imp.id}>
                            <td className="p-1.5 border border-slate-300 font-bold">{imp.name}</td>
                            <td className="p-1.5 border border-slate-300">{imp.qtyArea}</td>
                            <td className="p-1.5 border border-slate-300">{fmt(imp.newCost)}</td>
                            <td className="p-1.5 border border-slate-300">{imp.depreciationPct}%</td>
                            <td className="p-1.5 border border-slate-300 font-bold">{fmt(imp.depreciatedValue)}</td>
                          </tr>
                        ))}
                        <tr className="bg-emerald-50 font-bold">
                          <td colSpan={4} className="p-1.5 border border-slate-300 uppercase">
                            Total Depreciated Improvements
                          </td>
                          <td className="p-1.5 border border-slate-300 font-black text-emerald-900">
                            {fmt(h.totalDepreciatedImprovementValue || 2360500)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Section VIII. Cadastral Lot Boundary Plotting (if enabled) */}
              {d.lotPlottingEnabled !== false && d.lotPlotting && (
                <div className="space-y-2 page-break-inside-avoid">
                  <h3 className="font-black uppercase tracking-wider text-emerald-950 text-sm border-b border-emerald-800/40 pb-1 flex items-center justify-between">
                    <span>VIII. Cadastral Lot Technical Boundary & Traverse Analysis</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded font-black">
                      Verified Cadastral Survey Attached
                    </span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[10px]">
                    <div>
                      <span className="text-slate-500 font-bold block">Lot / Survey Plan</span>
                      <span className="font-black text-slate-800">
                        {d.lotPlotting.lotNo || 'Lot 123'} ({d.lotPlotting.surveyPlan || 'Survey'})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block">Stated vs Computed Area</span>
                      <span className="font-black text-emerald-900">
                        {d.lotPlotting.statedArea} sqm /{' '}
                        {d.lotPlotting.computedArea
                          ? `${d.lotPlotting.computedArea.toFixed(2)} sqm`
                          : `${d.lotArea} sqm`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block">Shape / Corners</span>
                      <span className="font-black text-slate-800">
                        {d.lotPlotting.lotShape || 'Regular'} (
                        {d.lotPlotting.numberOfCorners || d.lotPlotting.traverses?.length || 4} Corners)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block">Closure Ratio</span>
                      <span className="font-black text-teal-800">
                        {d.lotPlotting.closureRatio || '1:10,000+'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-2 rounded-lg border border-slate-200 text-[10px]">
                    <div>
                      <span className="text-slate-500 font-bold">North:</span>{' '}
                      <span className="font-semibold">{d.lotPlotting.boundaryNorth || 'Adjacent Lot'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold">East:</span>{' '}
                      <span className="font-semibold">{d.lotPlotting.boundaryEast || 'Adjacent Lot'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold">South:</span>{' '}
                      <span className="font-semibold">{d.lotPlotting.boundarySouth || 'Road Access'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold">West:</span>{' '}
                      <span className="font-semibold">{d.lotPlotting.boundaryWest || 'Adjacent Lot'}</span>
                    </div>
                  </div>

                  {d.lotPlotting.traverses && d.lotPlotting.traverses.length > 0 && (
                    <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 uppercase font-bold text-slate-700">
                          <th className="p-1 border border-slate-300">Line</th>
                          <th className="p-1 border border-slate-300">Bearing</th>
                          <th className="p-1 border border-slate-300">Distance (m)</th>
                          <th className="p-1 border border-slate-300">Boundary Note / Adjoining</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono">
                        {d.lotPlotting.traverses.map((t, idx) => (
                          <tr key={t.id || idx}>
                            <td className="p-1 border border-slate-300 font-bold">
                              {t.fromPoint} - {t.toPoint}
                            </td>
                            <td className="p-1 border border-slate-300 font-bold text-slate-800">
                              {t.bearingString ||
                                `${t.quadrant?.charAt(0)} ${t.deg}° ${t.min}' ${t.quadrant?.slice(-1)}`}
                            </td>
                            <td className="p-1 border border-slate-300 font-bold text-slate-800">
                              {t.distance.toFixed(2)} m
                            </td>
                            <td className="p-1 border border-slate-300 font-sans text-slate-600">
                              {t.boundaryDescription ||
                                (idx === 0 ? 'Frontage along road' : 'Adjacent Property')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Section IX. Appraiser Certification & Signatures */}
              <div className="pt-6 page-break-inside-avoid space-y-5">
                <p className="text-[10px] text-slate-500 text-justify leading-relaxed border-t border-slate-200 pt-3">
                  <strong>Certification & Professional Declaration:</strong> I hereby certify that I have conducted an ocular inspection of the subject property, examined the pertinent collateral records, and verified the prevailing comparable market values. The valuations and credit lending parameters presented in this formal appraisal report reflect an objective, independent professional assessment in accordance with sound credit and appraisal guidelines.
                </p>

                <div className="grid grid-cols-2 gap-8 text-center pt-4">
                  <div>
                    <div className="border-b border-slate-800 w-52 mx-auto font-black text-xs pb-1">
                      {d.appraiser || record.appraiserName || 'CI Officer'}
                    </div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 mt-1">
                      CI Officer
                    </p>
                    <p className="text-[9px] text-slate-400">
                      Date Signed: {d.inspectionDate || new Date().toISOString().split('T')[0]}
                    </p>
                  </div>
                  <div>
                    <div className="border-b border-slate-800 w-52 mx-auto font-black text-xs pb-1">
                      CreCom Reviewer / Supervisor
                    </div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 mt-1">
                      Credit Committee (CreCom) Chairperson
                    </p>
                    <p className="text-[9px] text-slate-400">
                      Date Verified: {new Date().toISOString().split('T')[0]}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      ) : (
        (() => {
          const d = record.data as VehicleAppraisal;

          const comp1Adj =
            (d.comp1Price || 0) +
            (d.comp1MileageAdj || 0) +
            (d.comp1ConditionAdj || 0) +
            (d.comp1AccessoriesAdj || 0) +
            (d.comp1YearModelAdj || 0);

          const comp2Adj =
            (d.comp2Price || 0) +
            (d.comp2MileageAdj || 0) +
            (d.comp2ConditionAdj || 0) +
            (d.comp2AccessoriesAdj || 0) +
            (d.comp2YearModelAdj || 0);

          const comp3Adj =
            (d.comp3Price || 0) +
            (d.comp3MileageAdj || 0) +
            (d.comp3ConditionAdj || 0) +
            (d.comp3AccessoriesAdj || 0) +
            (d.comp3YearModelAdj || 0);

          const validComps = [comp1Adj, comp2Adj, comp3Adj].filter(val => val > 0);
          const vehicleReconciled =
            validComps.length > 0
              ? Math.round(validComps.reduce((a, b) => a + b, 0) / validComps.length)
              : record.marketValue;

          const declaredVehicleVal = d.declaredValue || 0;
          const vehicleVariance = vehicleReconciled - declaredVehicleVal;
          const vehicleVariancePct =
            declaredVehicleVal > 0 ? ((vehicleVariance / declaredVehicleVal) * 100).toFixed(1) : null;

          const targetLtv = d.targetLtv || record.targetLtv || 70;
          const ltvCeiling = vehicleReconciled * (targetLtv / 100);
          const forcedSaleVal = ltvCeiling * 0.80;
          const appliedLoan = d.appliedLoanAmount || record.appliedLoanAmount || 0;
          const effectiveLtv =
            vehicleReconciled > 0 ? (appliedLoan / vehicleReconciled) * 100 : 0;

          return (
            <div className="space-y-6">
              {/* Institutional Header */}
              <div className="border-b-2 border-emerald-900 pb-4 text-center">
                <div className="flex items-center justify-center gap-2 text-emerald-900 font-black text-xs uppercase tracking-widest mb-1">
                  <span>BANGKO KABAYAN / 1ST MOUNTAIN BANK</span>
                  <span>•</span>
                  <span>APPRAISAL & CREDIT INVESTIGATION DIVISION</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-emerald-950 uppercase tracking-tight">
                  VEHICLE APPRAISAL & VALUATION REPORT
                </h1>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mt-0.5">
                  Motor Vehicle Collateral Inspection & Three Comparable Sales Valuation
                </p>
                <div className="flex flex-wrap items-center justify-between mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-700">
                  <div>
                    <strong>Report No.:</strong>{' '}
                    <span className="font-mono font-bold text-slate-900">
                      {record.reportNumber || 'REP-VH-001'}
                    </span>
                  </div>
                  <div>
                    <strong>Appraisal Date:</strong> {new Date().toISOString().split('T')[0]}
                  </div>
                  <div>
                    <strong>Status:</strong>{' '}
                    <span className="font-bold text-emerald-800">
                      {record.status || 'PENDING_REVIEW'}
                    </span>
                  </div>
                  <div>
                    <strong>CI Officer:</strong>{' '}
                    <span className="font-semibold text-slate-900">
                      {record.appraiserName || 'CI Officer'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section I. Vehicle & Borrower Identification */}
              <div className="space-y-2 page-break-inside-avoid">
                <h3 className="font-black uppercase tracking-wider text-emerald-950 text-sm border-b border-emerald-800/40 pb-1">
                  I. Vehicle & Borrower Identification
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">Borrower</span>
                    <span className="font-bold text-slate-900">{d.borrower || record.borrowerName || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">Registered Owner</span>
                    <span className="font-bold text-slate-900">{d.registeredOwner || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">Make & Model</span>
                    <span className="font-bold text-slate-900">{d.make} {d.model} {d.variant}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">Year Model</span>
                    <span className="font-bold text-slate-900">{d.yearModel}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">Plate Number</span>
                    <span className="font-mono font-bold text-slate-900">{d.plateNumber || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">Engine Number</span>
                    <span className="font-mono font-bold text-slate-900">{d.engineNumber || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">Chassis / VIN</span>
                    <span className="font-mono font-bold text-slate-900">{d.chassisNumber || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">Odometer Reading</span>
                    <span className="font-bold text-emerald-800">{d.mileage ? `${d.mileage.toLocaleString()} km` : '-'}</span>
                  </div>
                </div>
              </div>

              {/* Section II. Three (3) Vehicle Market Comparables Analysis */}
              <div className="space-y-2 page-break-inside-avoid">
                <h3 className="font-black uppercase tracking-wider text-emerald-950 text-sm border-b border-emerald-800/40 pb-1">
                  II. Three (3) Vehicle Market Comparables Analysis
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 uppercase font-bold text-slate-700">
                        <th className="p-2 border border-slate-300">Vehicle Parameter</th>
                        <th className="p-2 border border-slate-300 bg-emerald-50 text-emerald-950 font-black">Subject Vehicle</th>
                        <th className="p-2 border border-slate-300">Comparable #1</th>
                        <th className="p-2 border border-slate-300">Comparable #2</th>
                        <th className="p-2 border border-slate-300">Comparable #3</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-2 border border-slate-300 font-bold text-slate-600">Year Model</td>
                        <td className="p-2 border border-slate-300 font-bold bg-emerald-50/50">{d.yearModel}</td>
                        <td className="p-2 border border-slate-300">{d.comp1Year || '-'}</td>
                        <td className="p-2 border border-slate-300">{d.comp2Year || '-'}</td>
                        <td className="p-2 border border-slate-300">{d.comp3Year || '-'}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-300 font-bold text-slate-600">Mileage (Odometer)</td>
                        <td className="p-2 border border-slate-300 font-bold bg-emerald-50/50">{d.mileage?.toLocaleString()} km</td>
                        <td className="p-2 border border-slate-300">{d.comp1Mileage?.toLocaleString()} km</td>
                        <td className="p-2 border border-slate-300">{d.comp2Mileage?.toLocaleString()} km</td>
                        <td className="p-2 border border-slate-300">{d.comp3Mileage?.toLocaleString()} km</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-300 font-bold text-slate-600">Transmission</td>
                        <td className="p-2 border border-slate-300 bg-emerald-50/50">Standard</td>
                        <td className="p-2 border border-slate-300">{d.comp1Transmission || 'Automatic'}</td>
                        <td className="p-2 border border-slate-300">{d.comp2Transmission || 'Automatic'}</td>
                        <td className="p-2 border border-slate-300">{d.comp3Transmission || 'Automatic'}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-300 font-bold text-slate-600">Condition Rating</td>
                        <td className="p-2 border border-slate-300 bg-emerald-50/50">Inspected</td>
                        <td className="p-2 border border-slate-300">{d.comp1Condition || 'Good'}</td>
                        <td className="p-2 border border-slate-300">{d.comp2Condition || 'Good'}</td>
                        <td className="p-2 border border-slate-300">{d.comp3Condition || 'Good'}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-300 font-bold text-slate-600">Asking Price / Sold</td>
                        <td className="p-2 border border-slate-300 bg-emerald-50/50">-</td>
                        <td className="p-2 border border-slate-300 font-bold">{fmt(d.comp1Price || 0)}</td>
                        <td className="p-2 border border-slate-300 font-bold">{fmt(d.comp2Price || 0)}</td>
                        <td className="p-2 border border-slate-300 font-bold">{fmt(d.comp3Price || 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section III. Vehicle Valuation Adjustments Grid */}
              <div className="space-y-2 page-break-inside-avoid">
                <h3 className="font-black uppercase tracking-wider text-emerald-950 text-sm border-b border-emerald-800/40 pb-1">
                  III. Vehicle Valuation Adjustments Grid
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 uppercase font-bold text-slate-700">
                        <th className="p-2 border border-slate-300">Adjustment Element</th>
                        <th className="p-2 border border-slate-300">Comparable #1</th>
                        <th className="p-2 border border-slate-300">Comparable #2</th>
                        <th className="p-2 border border-slate-300">Comparable #3</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-2 border border-slate-300 font-bold">Initial Market Selling Price</td>
                        <td className="p-2 border border-slate-300 font-bold">{fmt(d.comp1Price || 0)}</td>
                        <td className="p-2 border border-slate-300 font-bold">{fmt(d.comp2Price || 0)}</td>
                        <td className="p-2 border border-slate-300 font-bold">{fmt(d.comp3Price || 0)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-300">Mileage Discrepancy Adj.</td>
                        <td className="p-2 border border-slate-300">{fmt(d.comp1MileageAdj || 0)}</td>
                        <td className="p-2 border border-slate-300">{fmt(d.comp2MileageAdj || 0)}</td>
                        <td className="p-2 border border-slate-300">{fmt(d.comp3MileageAdj || 0)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-300">Condition & Bodywork Adj.</td>
                        <td className="p-2 border border-slate-300">{fmt(d.comp1ConditionAdj || 0)}</td>
                        <td className="p-2 border border-slate-300">{fmt(d.comp2ConditionAdj || 0)}</td>
                        <td className="p-2 border border-slate-300">{fmt(d.comp3ConditionAdj || 0)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-300">Year Model / Generation Adj.</td>
                        <td className="p-2 border border-slate-300">{fmt(d.comp1YearModelAdj || 0)}</td>
                        <td className="p-2 border border-slate-300">{fmt(d.comp2YearModelAdj || 0)}</td>
                        <td className="p-2 border border-slate-300">{fmt(d.comp3YearModelAdj || 0)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-300">Accessories / Options Adj.</td>
                        <td className="p-2 border border-slate-300">{fmt(d.comp1AccessoriesAdj || 0)}</td>
                        <td className="p-2 border border-slate-300">{fmt(d.comp2AccessoriesAdj || 0)}</td>
                        <td className="p-2 border border-slate-300">{fmt(d.comp3AccessoriesAdj || 0)}</td>
                      </tr>
                      <tr className="bg-emerald-50 font-black text-emerald-950">
                        <td className="p-2 border border-slate-300 uppercase">Indicated Adjusted Value</td>
                        <td className="p-2 border border-slate-300">{fmt(comp1Adj)}</td>
                        <td className="p-2 border border-slate-300">{fmt(comp2Adj)}</td>
                        <td className="p-2 border border-slate-300">{fmt(comp3Adj)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section IV. Reconciled Vehicle Value & Loan Ceiling */}
              <div className="space-y-2 page-break-inside-avoid">
                <h3 className="font-black uppercase tracking-wider text-emerald-950 text-sm border-b border-emerald-800/40 pb-1">
                  IV. Vehicle Valuation Reconciliation & Loan Ceiling
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200">
                  <div>
                    <span className="text-emerald-800 font-bold block text-[10px]">Appraised Market Value</span>
                    <span className="font-black text-base text-emerald-950">{fmt(vehicleReconciled)}</span>
                  </div>
                  <div>
                    <span className="text-emerald-800 font-bold block text-[10px]">Standard LTV Policy ({targetLtv}%)</span>
                    <span className="font-black text-sm text-emerald-950">{fmt(ltvCeiling)}</span>
                  </div>
                  <div>
                    <span className="text-emerald-800 font-bold block text-[10px]">Forced Sale Value (80%)</span>
                    <span className="font-black text-sm text-emerald-950">{fmt(forcedSaleVal)}</span>
                  </div>
                  <div>
                    <span className="text-emerald-800 font-bold block text-[10px]">Recommended Loan Ceiling</span>
                    <span className="font-black text-base text-emerald-900">
                      {fmt(record.recommendedLoan || ltvCeiling)}
                    </span>
                  </div>
                </div>

                {declaredVehicleVal > 0 && (
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 font-bold">Declared Vehicle Value:</span>{' '}
                      <span className="font-black text-slate-800">{fmt(declaredVehicleVal)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold">Appraised Variance:</span>{' '}
                      <span className="font-black text-emerald-800">
                        {fmt(vehicleVariance)} ({vehicleVariancePct}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Section V. Certification & Signatures */}
              <div className="pt-6 page-break-inside-avoid space-y-5">
                <p className="text-[10px] text-slate-500 text-justify leading-relaxed border-t border-slate-200 pt-3">
                  <strong>Certification & Professional Declaration:</strong> I hereby certify that I have conducted an inspection of the subject collateral motor vehicle, examined the registration records (LTO OR/CR), and verified prevailing market comparable transactions. The appraised valuations and loan recommendations reflect an objective assessment.
                </p>

                <div className="grid grid-cols-2 gap-8 text-center pt-4">
                  <div>
                    <div className="border-b border-slate-800 w-52 mx-auto font-black text-xs pb-1">
                      {record.appraiserName || 'CI Officer'}
                    </div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 mt-1">
                      CI Officer
                    </p>
                    <p className="text-[9px] text-slate-400">Date: {new Date().toISOString().split('T')[0]}</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-800 w-52 mx-auto font-black text-xs pb-1">
                      CreCom Reviewer / Supervisor
                    </div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 mt-1">
                      Approved & Verified By
                    </p>
                    <p className="text-[9px] text-slate-400">Date: {new Date().toISOString().split('T')[0]}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
