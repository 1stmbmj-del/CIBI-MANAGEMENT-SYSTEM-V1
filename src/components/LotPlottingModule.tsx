import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Compass, 
  Layers, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Download, 
  Printer, 
  Share2, 
  ArrowRight, 
  MapPin, 
  FileText, 
  Grid, 
  Sparkles, 
  Info, 
  Save, 
  RefreshCw, 
  HelpCircle,
  TrendingUp,
  Sliders,
  Move,
  Hash,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { TraverseLine, LotCoordinate, TiePoint, LotPlottingData, UserProfile } from '../types';

interface LotPlottingModuleProps {
  initialData?: LotPlottingData;
  onSave?: (data: LotPlottingData) => void;
  onChange?: (data: LotPlottingData) => void;
  onSyncToAppraisal?: (synced: {
    lotArea: number;
    lotShape: string;
    frontageMeters: number;
    depthMeters: number;
    numberOfCorners: number;
    titleNo: string;
    roadWidth: string;
    lotPlottingData: LotPlottingData;
  }) => void;
  user?: UserProfile;
}

// Preset samples
export const PRESET_LOTS: { name: string; desc: string; data: Partial<LotPlottingData> }[] = [
  {
    name: 'Sample 1: Standard 4-Corner Residential Lot (500 sqm)',
    desc: 'Classic rectangular residential lot (20m frontage × 25m depth) with 100% closure.',
    data: {
      propertyId: 'PROP-2026-00125',
      lotNo: 'Lot 123, Blk 4',
      surveyPlan: 'Psd-04-123456',
      titleNo: 'T-123456',
      location: 'Brgy. San Antonio, Pasig City',
      statedArea: 500.0,
      numberOfCorners: 4,
      plotStatus: 'Verified',
      lotShape: 'Regular Rectangular',
      frontageMeters: 20.0,
      depthMeters: 25.0,
      roadWidth: '8.00 meters concrete road',
      roadAccessType: 'Along Barangay Concrete Road',
      boundaryNorth: 'Lot 124 (Residential)',
      boundaryEast: 'Lot 125 (Vacant Lot)',
      boundarySouth: 'Road Lot 2 (8m wide)',
      boundaryWest: 'Lot 122 (Residential)',
      tiePoint: {
        monumentName: 'BLLM No. 1, Cad 579',
        quadrant: 'N-E',
        deg: 35,
        min: 20,
        sec: 0,
        distance: 245.35,
        bearingString: "N 35° 20' E"
      },
      traverses: [
        { id: '1', fromPoint: 1, toPoint: 2, quadrant: 'S-E', deg: 25, min: 30, sec: 0, distance: 25.0, bearingString: "S 25° 30' E" },
        { id: '2', fromPoint: 2, toPoint: 3, quadrant: 'S-W', deg: 64, min: 30, sec: 0, distance: 20.0, bearingString: "S 64° 30' W" },
        { id: '3', fromPoint: 3, toPoint: 4, quadrant: 'N-W', deg: 25, min: 30, sec: 0, distance: 25.0, bearingString: "N 25° 30' W" },
        { id: '4', fromPoint: 4, toPoint: 1, quadrant: 'N-E', deg: 64, min: 30, sec: 0, distance: 20.0, bearingString: "N 64° 30' E" }
      ]
    }
  },
  {
    name: 'Sample 2: 6-Corner Irregular Subdivision Lot (499.87 sqm)',
    desc: 'Irregular shape corner boundary matching Cadastral technical description.',
    data: {
      propertyId: 'PROP-2026-00482',
      lotNo: 'Lot 5-A',
      surveyPlan: 'Psd-13-098765',
      titleNo: 'T-987654',
      location: 'Brgy. Culiat, Quezon City',
      statedArea: 500.0,
      numberOfCorners: 6,
      plotStatus: 'Verified',
      lotShape: 'Irregular',
      frontageMeters: 21.53,
      depthMeters: 28.4,
      roadWidth: '10.00 meters main road',
      roadAccessType: 'Corner Access / Subdivision Main',
      boundaryNorth: 'Lot 6 (Residential)',
      boundaryEast: 'Lot 7 (Residential)',
      boundarySouth: 'Road Lot 1 (10m wide)',
      boundaryWest: 'Road Lot 3 (8m wide)',
      tiePoint: {
        monumentName: 'BLLM No. 2, QC Cadastre',
        quadrant: 'N-W',
        deg: 42,
        min: 15,
        sec: 0,
        distance: 312.8,
        bearingString: "N 42° 15' W"
      },
      traverses: [
        { id: '1', fromPoint: 1, toPoint: 2, quadrant: 'S-E', deg: 25, min: 30, sec: 0, distance: 21.53, bearingString: "S 25° 30' E" },
        { id: '2', fromPoint: 2, toPoint: 3, quadrant: 'S-W', deg: 65, min: 20, sec: 0, distance: 22.40, bearingString: "S 65° 20' W" },
        { id: '3', fromPoint: 3, toPoint: 4, quadrant: 'N-W', deg: 78, min: 10, sec: 0, distance: 15.20, bearingString: "N 78° 10' W" },
        { id: '4', fromPoint: 4, toPoint: 5, quadrant: 'N-W', deg: 24, min: 40, sec: 0, distance: 18.60, bearingString: "N 24° 40' W" },
        { id: '5', fromPoint: 5, toPoint: 6, quadrant: 'N-E', deg: 35, min: 15, sec: 0, distance: 12.80, bearingString: "N 35° 15' E" },
        { id: '6', fromPoint: 6, toPoint: 1, quadrant: 'N-E', deg: 74, min: 50, sec: 0, distance: 25.10, bearingString: "N 74° 50' E" }
      ]
    }
  },
  {
    name: 'Sample 3: 5-Corner Commercial Property (780 sqm)',
    desc: 'High-value commercial lot along national highway with wide frontage.',
    data: {
      propertyId: 'PROP-2026-00910',
      lotNo: 'Lot 1-B-2',
      surveyPlan: 'Pcs-04-004321',
      titleNo: 'T-554433',
      location: 'Brgy. Dolores, San Fernando, Pampanga',
      statedArea: 780.0,
      numberOfCorners: 5,
      plotStatus: 'Verified',
      lotShape: 'Trapezoidal',
      frontageMeters: 30.0,
      depthMeters: 26.0,
      roadWidth: '15.00 meters Commercial Highway',
      roadAccessType: 'Direct Commercial Highway Access',
      boundaryNorth: 'Lot 1-A (Commercial Bank)',
      boundaryEast: 'National Highway (4 Lanes)',
      boundarySouth: 'Lot 1-C (Gasoline Station)',
      boundaryWest: 'Creek / Easement Buffer',
      tiePoint: {
        monumentName: 'BBM No. 14, San Fernando',
        quadrant: 'S-E',
        deg: 18,
        min: 45,
        sec: 0,
        distance: 185.0,
        bearingString: "S 18° 45' E"
      },
      traverses: [
        { id: '1', fromPoint: 1, toPoint: 2, quadrant: 'S-E', deg: 12, min: 0, sec: 0, distance: 30.0, bearingString: "S 12° 00' E" },
        { id: '2', fromPoint: 2, toPoint: 3, quadrant: 'S-W', deg: 78, min: 0, sec: 0, distance: 25.0, bearingString: "S 78° 00' W" },
        { id: '3', fromPoint: 3, toPoint: 4, quadrant: 'N-W', deg: 45, min: 0, sec: 0, distance: 8.5, bearingString: "N 45° 00' W" },
        { id: '4', fromPoint: 4, toPoint: 5, quadrant: 'N-W', deg: 12, min: 0, sec: 0, distance: 24.0, bearingString: "N 12° 00' W" },
        { id: '5', fromPoint: 5, toPoint: 1, quadrant: 'N-E', deg: 78, min: 0, sec: 0, distance: 31.0, bearingString: "N 78° 00' E" }
      ]
    }
  }
];

// Helper: Convert Quadrant + Deg + Min + Sec to Azimuth in degrees (from North 0° clockwise)
export function calculateAzimuth(
  quadrant: 'N-E' | 'S-E' | 'S-W' | 'N-W' | 'DUE-N' | 'DUE-E' | 'DUE-S' | 'DUE-W',
  deg: number,
  min: number,
  sec: number = 0
): { azimuthDeg: number; deltaE: number; deltaN: number; bearingStr: string } {
  const decimalAngle = deg + min / 60 + sec / 3600;
  let azimuthDeg = 0;
  let bearingStr = '';

  switch (quadrant) {
    case 'N-E':
      azimuthDeg = decimalAngle;
      bearingStr = `N ${deg}° ${min.toString().padStart(2, '0')}' E`;
      break;
    case 'S-E':
      azimuthDeg = 180 - decimalAngle;
      bearingStr = `S ${deg}° ${min.toString().padStart(2, '0')}' E`;
      break;
    case 'S-W':
      azimuthDeg = 180 + decimalAngle;
      bearingStr = `S ${deg}° ${min.toString().padStart(2, '0')}' W`;
      break;
    case 'N-W':
      azimuthDeg = 360 - decimalAngle;
      bearingStr = `N ${deg}° ${min.toString().padStart(2, '0')}' W`;
      break;
    case 'DUE-N':
      azimuthDeg = 0;
      bearingStr = 'DUE NORTH';
      break;
    case 'DUE-E':
      azimuthDeg = 90;
      bearingStr = 'DUE EAST';
      break;
    case 'DUE-S':
      azimuthDeg = 180;
      bearingStr = 'DUE SOUTH';
      break;
    case 'DUE-W':
      azimuthDeg = 270;
      bearingStr = 'DUE WEST';
      break;
    default:
      azimuthDeg = decimalAngle;
      bearingStr = `N ${deg}° ${min}' E`;
  }

  // Radians
  const rad = (azimuthDeg * Math.PI) / 180;
  // In surveying math: Delta East = Distance * sin(Azimuth), Delta North = Distance * cos(Azimuth)
  const sinVal = Math.sin(rad);
  const cosVal = Math.cos(rad);

  return {
    azimuthDeg,
    deltaE: sinVal,
    deltaN: cosVal,
    bearingStr
  };
}

export const LotPlottingModule: React.FC<LotPlottingModuleProps> = ({
  initialData,
  onSave,
  onChange,
  onSyncToAppraisal,
  user
}) => {
  // State
  const [propertyId, setPropertyId] = useState(initialData?.propertyId || 'PROP-2026-00125');
  const [lotNo, setLotNo] = useState(initialData?.lotNo || 'Lot 123');
  const [surveyPlan, setSurveyPlan] = useState(initialData?.surveyPlan || 'Psd-04-123456');
  const [titleNo, setTitleNo] = useState(initialData?.titleNo || 'T-123456');
  const [location, setLocation] = useState(initialData?.location || 'Brgy. San Antonio, Pasig City');
  const [statedArea, setStatedArea] = useState<number>(initialData?.statedArea || 500.0);
  const [plotStatus, setPlotStatus] = useState<'Verified' | 'Discrepancy' | 'Draft' | 'Needs Review'>(initialData?.plotStatus || 'Verified');

  // Road & Boundaries
  const [roadWidth, setRoadWidth] = useState(initialData?.roadWidth || '8.00 meters concrete road');
  const [roadAccessType, setRoadAccessType] = useState(initialData?.roadAccessType || 'Along Barangay Concrete Road');
  const [boundaryNorth, setBoundaryNorth] = useState(initialData?.boundaryNorth || 'Lot 124');
  const [boundaryEast, setBoundaryEast] = useState(initialData?.boundaryEast || 'Lot 125');
  const [boundarySouth, setBoundarySouth] = useState(initialData?.boundarySouth || 'Road Lot 2');
  const [boundaryWest, setBoundaryWest] = useState(initialData?.boundaryWest || 'Lot 122');
  const [notes, setNotes] = useState(initialData?.notes || 'Technical descriptions verified from approved subdivision plan.');

  // Tie Point
  const [tiePoint, setTiePoint] = useState<TiePoint>(
    initialData?.tiePoint || {
      monumentName: 'BLLM No. 1, Cad 579',
      quadrant: 'N-E',
      deg: 35,
      min: 20,
      sec: 0,
      distance: 245.35,
      bearingString: "N 35° 20' E"
    }
  );
  const [showTieLineOnPlot, setShowTieLineOnPlot] = useState<boolean>(false);

  // Traverse lines
  const [traverses, setTraverses] = useState<TraverseLine[]>(
    initialData?.traverses && initialData.traverses.length > 0
      ? initialData.traverses
      : PRESET_LOTS[0].data.traverses || []
  );

  // Canvas / Plotting UI Toggles & States
  const [showBearings, setShowBearings] = useState(true);
  const [showDistances, setShowDistances] = useState(true);
  const [showPoints, setShowPoints] = useState(true);
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showFill, setShowFill] = useState(true);
  const [useBowditchAdjusted, setUseBowditchAdjusted] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [isSyncedNotice, setIsSyncedNotice] = useState(false);

  // Quick parser text
  const [quickInputText, setQuickInputText] = useState('');
  const [showQuickParser, setShowQuickParser] = useState(false);

  // SVG Pan state
  const svgRef = useRef<SVGSVGElement | null>(null);
  const isDraggingRef = useRef(false);
  const startDragPosRef = useRef({ x: 0, y: 0 });

  // -------------------------------------------------------------
  // CALCULATION ENGINE
  // -------------------------------------------------------------
  const calculationResult = useMemo(() => {
    if (traverses.length === 0) {
      return {
        coordinates: [] as LotCoordinate[],
        adjustedCoordinates: [] as LotCoordinate[],
        totalTraverseDistance: 0,
        linearMisclosure: 0,
        deltaXMisclosure: 0,
        deltaYMisclosure: 0,
        closureRatioStr: '1 : ∞',
        closureRatioNum: 999999,
        closureStatus: 'GOOD' as 'GOOD' | 'FAIR' | 'HIGH_MISCLOSURE',
        computedArea: 0,
        areaDiff: 0,
        areaVariancePct: 0,
        areaMatch: 'PASS' as 'PASS' | 'DISCREPANCY',
        lotShape: 'Irregular' as LotPlottingData['lotShape'],
        frontageMeters: 0,
        depthMeters: 0,
        tiePointCoordinates: { x: 0, y: 0 }
      };
    }

    let currX = 0;
    let currY = 0;
    let totalDist = 0;
    const rawCoords: LotCoordinate[] = [{ point: 1, label: 'Pt. 1', x: 0, y: 0 }];

    const calculatedTraverses: TraverseLine[] = traverses.map((t, idx) => {
      const { azimuthDeg, deltaE, deltaN, bearingStr } = calculateAzimuth(t.quadrant, t.deg, t.min, t.sec || 0);
      const segDeltaE = t.distance * deltaE;
      const segDeltaN = t.distance * deltaN;

      currX += segDeltaE;
      currY += segDeltaN;
      totalDist += t.distance;

      // Add to coords table if not closing back to 1
      const nextPointNum = t.toPoint;
      if (idx < traverses.length - 1) {
        rawCoords.push({
          point: nextPointNum,
          label: `Pt. ${nextPointNum}`,
          x: Math.round(currX * 1000) / 1000,
          y: Math.round(currY * 1000) / 1000
        });
      }

      return {
        ...t,
        bearingString: bearingStr,
        azimuthDeg: Math.round(azimuthDeg * 100) / 100,
        deltaE: Math.round(segDeltaE * 1000) / 1000,
        deltaN: Math.round(segDeltaN * 1000) / 1000
      };
    });

    // Misclosure check: Point N back to Point 1 (0,0)
    const deltaXMisclosure = currX;
    const deltaYMisclosure = currY;
    const linearMisclosure = Math.sqrt(deltaXMisclosure * deltaXMisclosure + deltaYMisclosure * deltaYMisclosure);

    const closureRatioNum = linearMisclosure > 0.0001 ? Math.round(totalDist / linearMisclosure) : 999999;
    const closureRatioStr = linearMisclosure > 0.0001 ? `1 : ${closureRatioNum.toLocaleString()}` : '1 : 100,000+';

    let closureStatus: 'GOOD' | 'FAIR' | 'HIGH_MISCLOSURE' = 'GOOD';
    if (linearMisclosure > 0.5 || closureRatioNum < 2000) {
      closureStatus = 'HIGH_MISCLOSURE';
    } else if (closureRatioNum < 5000) {
      closureStatus = 'FAIR';
    }

    // Bowditch Rule (Compass Rule Adjustment)
    let cumDist = 0;
    const adjustedCoords: LotCoordinate[] = rawCoords.map((pt, i) => {
      if (i === 0) return { ...pt, adjustedX: 0, adjustedY: 0 };
      cumDist += traverses[i - 1]?.distance || 0;
      const factor = totalDist > 0 ? cumDist / totalDist : 0;
      const adjX = pt.x - deltaXMisclosure * factor;
      const adjY = pt.y - deltaYMisclosure * factor;
      return {
        ...pt,
        adjustedX: Math.round(adjX * 1000) / 1000,
        adjustedY: Math.round(adjY * 1000) / 1000
      };
    });

    // Shoelace Formula for Area Computation
    // Using closed polygon points
    const activeCoords = rawCoords;
    const n = activeCoords.length;
    let shoelaceSum = 0;
    for (let i = 0; i < n; i++) {
      const nextIdx = (i + 1) % n;
      shoelaceSum += activeCoords[i].x * activeCoords[nextIdx].y - activeCoords[i].y * activeCoords[nextIdx].x;
    }
    const computedArea = Math.abs(shoelaceSum) / 2;
    const areaDiff = Math.abs(computedArea - statedArea);
    const areaVariancePct = statedArea > 0 ? (areaDiff / statedArea) * 100 : 0;
    const areaMatch: 'PASS' | 'DISCREPANCY' = areaVariancePct <= 2.0 ? 'PASS' : 'DISCREPANCY';

    // Lot Shape Estimation
    let lotShape: LotPlottingData['lotShape'] = 'Irregular';
    if (traverses.length === 3) {
      lotShape = 'Triangular';
    } else if (traverses.length === 4) {
      const d1 = traverses[0].distance;
      const d2 = traverses[1].distance;
      const d3 = traverses[2].distance;
      const d4 = traverses[3].distance;
      const isOppositeEqual = Math.abs(d1 - d3) < 1.0 && Math.abs(d2 - d4) < 1.0;
      if (isOppositeEqual && Math.abs(d1 - d2) < 1.0) {
        lotShape = 'Square';
      } else if (isOppositeEqual) {
        lotShape = 'Regular Rectangular';
      } else {
        lotShape = 'Trapezoidal';
      }
    } else if (traverses.length > 4) {
      lotShape = 'Irregular';
    }

    // Frontage (usually Line 1-2 or road-facing traverse)
    const frontageMeters = traverses[0]?.distance || 0;
    const depthMeters = traverses[1]?.distance || (computedArea > 0 && frontageMeters > 0 ? Math.round(computedArea / frontageMeters * 10) / 10 : 0);

    // Tie point relative coordinates to Pt 1
    const { deltaE: tieDE, deltaN: tieDN } = calculateAzimuth(
      tiePoint.quadrant,
      tiePoint.deg,
      tiePoint.min,
      tiePoint.sec || 0
    );
    const tieX = -(tiePoint.distance * tieDE);
    const tieY = -(tiePoint.distance * tieDN);

    return {
      coordinates: rawCoords,
      adjustedCoordinates: adjustedCoords,
      calculatedTraverses,
      totalTraverseDistance: Math.round(totalDist * 100) / 100,
      linearMisclosure: Math.round(linearMisclosure * 1000) / 1000,
      deltaXMisclosure: Math.round(deltaXMisclosure * 1000) / 1000,
      deltaYMisclosure: Math.round(deltaYMisclosure * 1000) / 1000,
      closureRatioStr,
      closureRatioNum,
      closureStatus,
      computedArea: Math.round(computedArea * 100) / 100,
      areaDiff: Math.round(areaDiff * 100) / 100,
      areaVariancePct: Math.round(areaVariancePct * 1000) / 1000,
      areaMatch,
      lotShape,
      frontageMeters,
      depthMeters,
      tiePointCoordinates: { x: tieX, y: tieY }
    };
  }, [traverses, statedArea, tiePoint]);

  // Sync plot status with calculation
  useEffect(() => {
    if (calculationResult.closureStatus === 'HIGH_MISCLOSURE' || calculationResult.areaMatch === 'DISCREPANCY') {
      setPlotStatus('Discrepancy');
    } else if (calculationResult.closureStatus === 'GOOD' && calculationResult.areaMatch === 'PASS') {
      setPlotStatus('Verified');
    }
  }, [calculationResult.closureStatus, calculationResult.areaMatch]);

  // Handle Add Traverse line
  const handleAddTraverse = () => {
    setTraverses(prev => {
      const nextFrom = prev.length > 0 ? prev[prev.length - 1].toPoint : 1;
      const nextTo = nextFrom + 1;
      const newTraverse: TraverseLine = {
        id: Date.now().toString(),
        fromPoint: nextFrom,
        toPoint: nextTo,
        quadrant: 'N-E',
        deg: 45,
        min: 0,
        sec: 0,
        distance: 20.0,
        bearingString: "N 45° 00' E"
      };
      return [...prev, newTraverse];
    });
  };

  // Handle Auto-Close Traverse (calculate closing bearing & distance back to Point 1)
  const handleAutoClose = () => {
    if (traverses.length < 2) return;
    const currentEndCoords = calculationResult.coordinates[calculationResult.coordinates.length - 1];
    if (!currentEndCoords) return;

    // Vector from currentEndCoords back to Point 1 (0,0)
    const dx = 0 - currentEndCoords.x;
    const dy = 0 - currentEndCoords.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.01) return;

    // Azimuth in rad
    let azimuthRad = Math.atan2(dx, dy); // math: dx = sin, dy = cos
    if (azimuthRad < 0) azimuthRad += 2 * Math.PI;
    const azimuthDeg = (azimuthRad * 180) / Math.PI;

    let quad: 'N-E' | 'S-E' | 'S-W' | 'N-W' = 'N-E';
    let angleDeg = azimuthDeg;

    if (azimuthDeg >= 0 && azimuthDeg < 90) {
      quad = 'N-E';
      angleDeg = azimuthDeg;
    } else if (azimuthDeg >= 90 && azimuthDeg < 180) {
      quad = 'S-E';
      angleDeg = 180 - azimuthDeg;
    } else if (azimuthDeg >= 180 && azimuthDeg < 270) {
      quad = 'S-W';
      angleDeg = azimuthDeg - 180;
    } else {
      quad = 'N-W';
      angleDeg = 360 - azimuthDeg;
    }

    const deg = Math.floor(angleDeg);
    const min = Math.round((angleDeg - deg) * 60);

    const fromPt = traverses[traverses.length - 1].toPoint;
    const closingTraverse: TraverseLine = {
      id: Date.now().toString(),
      fromPoint: fromPt,
      toPoint: 1,
      quadrant: quad,
      deg,
      min,
      sec: 0,
      distance: Math.round(dist * 100) / 100,
      bearingString: `${quad.charAt(0)} ${deg}° ${min.toString().padStart(2, '0')}' ${quad.charAt(2)}`
    };

    setTraverses(prev => [...prev, closingTraverse]);
  };

  // Handle update traverse row
  const handleUpdateTraverse = (index: number, field: keyof TraverseLine, value: any) => {
    setTraverses(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      
      // Update bearing string if angle changed
      if (field === 'quadrant' || field === 'deg' || field === 'min' || field === 'sec') {
        const { bearingStr } = calculateAzimuth(
          item.quadrant,
          item.deg || 0,
          item.min || 0,
          item.sec || 0
        );
        item.bearingString = bearingStr;
      }

      updated[index] = item;
      return updated;
    });
  };

  // Handle remove traverse row
  const handleRemoveTraverse = (index: number) => {
    setTraverses(prev => prev.filter((_, i) => i !== index));
  };

  // Quick Parser for bulk technical descriptions
  const handleParseQuickInput = () => {
    if (!quickInputText.trim()) return;
    const lines = quickInputText.split('\n').map(l => l.trim()).filter(Boolean);
    const parsed: TraverseLine[] = [];

    lines.forEach((line, idx) => {
      // Examples: "1-2 S 25 30 E 50.00" or "S 25° 30' E 50m" or "N 65-20 E 100"
      const clean = line.replace(/[°'m,]/g, ' ').replace(/-/g, ' ');
      const tokens = clean.split(/\s+/).filter(Boolean);

      let quad: 'N-E' | 'S-E' | 'S-W' | 'N-W' = 'N-E';
      let deg = 0;
      let min = 0;
      let dist = 20;

      // Find N/S and E/W
      const firstDir = tokens.find(t => t.toUpperCase() === 'N' || t.toUpperCase() === 'S');
      const secondDir = tokens.find(t => t.toUpperCase() === 'E' || t.toUpperCase() === 'W');

      if (firstDir && secondDir) {
        quad = `${firstDir.toUpperCase()}-${secondDir.toUpperCase()}` as any;
      }

      // Numbers
      const numbers = tokens.map(t => parseFloat(t)).filter(n => !isNaN(n));
      if (numbers.length >= 3) {
        // usually deg, min, distance OR point1, point2, deg, min, distance
        if (numbers.length >= 5) {
          deg = numbers[2];
          min = numbers[3];
          dist = numbers[4];
        } else if (numbers.length === 3) {
          deg = numbers[0];
          min = numbers[1];
          dist = numbers[2];
        } else if (numbers.length === 4) {
          deg = numbers[1];
          min = numbers[2];
          dist = numbers[3];
        }
      } else if (numbers.length === 2) {
        deg = numbers[0];
        dist = numbers[1];
      }

      parsed.push({
        id: `parsed_${idx}_${Date.now()}`,
        fromPoint: idx + 1,
        toPoint: idx + 2,
        quadrant: quad,
        deg: deg || 0,
        min: min || 0,
        sec: 0,
        distance: dist || 20,
        bearingString: `${quad.charAt(0)} ${deg}° ${min}' ${quad.charAt(2)}`
      });
    });

    if (parsed.length > 0) {
      // Ensure last toPoint wraps to 1
      parsed[parsed.length - 1].toPoint = 1;
      setTraverses(parsed);
      setShowQuickParser(false);
      setQuickInputText('');
    }
  };

  // Load Preset
  const handleLoadPreset = (preset: typeof PRESET_LOTS[0]) => {
    if (preset.data.propertyId) setPropertyId(preset.data.propertyId);
    if (preset.data.lotNo) setLotNo(preset.data.lotNo);
    if (preset.data.surveyPlan) setSurveyPlan(preset.data.surveyPlan);
    if (preset.data.titleNo) setTitleNo(preset.data.titleNo);
    if (preset.data.location) setLocation(preset.data.location);
    if (preset.data.statedArea) setStatedArea(preset.data.statedArea);
    if (preset.data.roadWidth) setRoadWidth(preset.data.roadWidth);
    if (preset.data.roadAccessType) setRoadAccessType(preset.data.roadAccessType);
    if (preset.data.boundaryNorth) setBoundaryNorth(preset.data.boundaryNorth);
    if (preset.data.boundaryEast) setBoundaryEast(preset.data.boundaryEast);
    if (preset.data.boundarySouth) setBoundarySouth(preset.data.boundarySouth);
    if (preset.data.boundaryWest) setBoundaryWest(preset.data.boundaryWest);
    if (preset.data.tiePoint) setTiePoint(preset.data.tiePoint);
    if (preset.data.traverses) setTraverses(preset.data.traverses);
    setSelectedPointIndex(null);
    setSelectedLineIndex(null);
  };

  // Compile full LotPlottingData payload
  const currentPlottingData: LotPlottingData = useMemo(() => {
    return {
      propertyId,
      lotNo,
      surveyPlan,
      titleNo,
      location,
      statedArea,
      numberOfCorners: traverses.length,
      plotStatus,
      tiePoint,
      traverses,
      coordinates: useBowditchAdjusted ? calculationResult.adjustedCoordinates : calculationResult.coordinates,
      computedArea: calculationResult.computedArea,
      areaDifference: calculationResult.areaDiff,
      areaVariancePct: calculationResult.areaVariancePct,
      areaMatchStatus: calculationResult.areaMatch,
      linearMisclosure: calculationResult.linearMisclosure,
      closureRatio: calculationResult.closureRatioStr,
      closureRatioNumber: calculationResult.closureRatioNum,
      closureStatus: calculationResult.closureStatus,
      lotShape: calculationResult.lotShape,
      frontageMeters: calculationResult.frontageMeters,
      depthMeters: calculationResult.depthMeters,
      roadWidth,
      roadAccessType,
      boundaryNorth,
      boundaryEast,
      boundarySouth,
      boundaryWest,
      notes
    };
  }, [
    propertyId,
    lotNo,
    surveyPlan,
    titleNo,
    location,
    statedArea,
    traverses,
    plotStatus,
    tiePoint,
    useBowditchAdjusted,
    calculationResult,
    roadWidth,
    roadAccessType,
    boundaryNorth,
    boundaryEast,
    boundarySouth,
    boundaryWest,
    notes
  ]);

  const lastEmittedRef = React.useRef<string>('');

  // Real-time parent state synchronization (guarded against loop)
  useEffect(() => {
    if (onChange && currentPlottingData) {
      const serialized = JSON.stringify(currentPlottingData);
      if (serialized !== lastEmittedRef.current) {
        lastEmittedRef.current = serialized;
        onChange(currentPlottingData);
      }
    }
  }, [currentPlottingData, onChange]);

  // Handle Save
  const handleSave = () => {
    if (onSave) {
      onSave(currentPlottingData);
    }
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3500);
  };

  // Handle Sync to Appraisal
  const handleSyncToAppraisal = () => {
    if (onSyncToAppraisal) {
      onSyncToAppraisal({
        lotArea: calculationResult.computedArea || statedArea,
        lotShape: calculationResult.lotShape,
        frontageMeters: calculationResult.frontageMeters,
        depthMeters: calculationResult.depthMeters,
        numberOfCorners: traverses.length,
        titleNo,
        roadWidth,
        lotPlottingData: currentPlottingData
      });
    }
    setIsSyncedNotice(true);
    setTimeout(() => setIsSyncedNotice(false), 3500);
  };

  // -------------------------------------------------------------
  // SVG RENDERING MATH
  // -------------------------------------------------------------
  const activeCoords = useBowditchAdjusted ? calculationResult.adjustedCoordinates : calculationResult.coordinates;

  // Bounding box of coordinates (including tie point if shown)
  const allPlotPoints = [...activeCoords];
  if (showTieLineOnPlot && calculationResult.tiePointCoordinates) {
    allPlotPoints.push({
      point: 999,
      label: tiePoint.monumentName,
      x: calculationResult.tiePointCoordinates.x,
      y: calculationResult.tiePointCoordinates.y
    });
  }

  const xs = allPlotPoints.map(p => p.adjustedX !== undefined && useBowditchAdjusted ? p.adjustedX : p.x);
  const ys = allPlotPoints.map(p => p.adjustedY !== undefined && useBowditchAdjusted ? p.adjustedY : p.y);
  const minX = xs.length ? Math.min(...xs) : -50;
  const maxX = xs.length ? Math.max(...xs) : 50;
  const minY = ys.length ? Math.min(...ys) : -50;
  const maxY = ys.length ? Math.max(...ys) : 50;

  const rawWidth = Math.max(maxX - minX, 20);
  const rawHeight = Math.max(maxY - minY, 20);
  const padding = Math.max(rawWidth, rawHeight) * 0.25;

  const viewBoxMinX = minX - padding;
  const viewBoxMinY = -(maxY + padding); // Flip Y because SVG Y is down
  const viewBoxWidth = rawWidth + padding * 2;
  const viewBoxHeight = rawHeight + padding * 2;

  // Polygon SVG Points string
  const polygonPointsStr = activeCoords
    .map(pt => {
      const px = pt.adjustedX !== undefined && useBowditchAdjusted ? pt.adjustedX : pt.x;
      const py = pt.adjustedY !== undefined && useBowditchAdjusted ? pt.adjustedY : pt.y;
      return `${px},${-py}`;
    })
    .join(' ');

  // Center of lot
  const centerLotX = (minX + maxX) / 2;
  const centerLotY = (minY + maxY) / 2;

  // Reset Zoom & Pan
  const handleResetView = () => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
    setSelectedPointIndex(null);
    setSelectedLineIndex(null);
  };

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startDragPosRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    setPanOffset({
      x: e.clientX - startDragPosRef.current.x,
      y: e.clientY - startDragPosRef.current.y
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="space-y-6">
      {/* 1. LOT PLOTTING DASHBOARD HEADER & QUICK PRESETS */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-black uppercase tracking-wider mb-3">
              <Compass className="w-3.5 h-3.5" /> Cadastral Survey & Technical Description Engine
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              Lot Plotting & Boundary Analysis
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-medium">
              Automated Azimuth conversion, Shoelace Area verification, Linear Misclosure analysis, and Interactive Boundary Plotting for Land Appraisal.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSyncToAppraisal}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" /> Apply to Real Property
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer border border-white/10"
            >
              <Save className="w-4 h-4" /> Save Plot
            </button>
          </div>
        </div>

        {/* Notices */}
        {isSavedNotice && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Lot plotting technical data successfully saved to database!
          </div>
        )}
        {isSyncedNotice && (
          <div className="mt-4 p-3 bg-teal-500/20 border border-teal-400/40 rounded-xl text-teal-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-teal-400" /> Area ({calculationResult.computedArea} sqm), shape, frontage, and boundaries synchronized with Real Property Valuation!
          </div>
        )}

        {/* Preset Selector */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Quick Presets:
          </span>
          {PRESET_LOTS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleLoadPreset(preset)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-all cursor-pointer"
              title={preset.desc}
            >
              {preset.name.split(':')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* 2. PROPERTY PARTICULARS & PLOT STATUS BANNER */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm col-span-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Property ID / Lot No.</span>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={propertyId}
              onChange={e => setPropertyId(e.target.value)}
              className="w-1/2 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-800"
              placeholder="PROP-ID"
            />
            <input
              type="text"
              value={lotNo}
              onChange={e => setLotNo(e.target.value)}
              className="w-1/2 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-800"
              placeholder="Lot 123"
            />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm col-span-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Survey Plan & Title</span>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={surveyPlan}
              onChange={e => setSurveyPlan(e.target.value)}
              className="w-1/2 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-800"
              placeholder="Psd-04-123456"
            />
            <input
              type="text"
              value={titleNo}
              onChange={e => setTitleNo(e.target.value)}
              className="w-1/2 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-800"
              placeholder="T-123456"
            />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm col-span-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Stated Title Area</span>
          <div className="flex items-center gap-1 mt-1">
            <input
              type="number"
              value={statedArea || ''}
              onChange={e => setStatedArea(parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-black text-emerald-900"
              placeholder="500.00"
            />
            <span className="text-[11px] font-bold text-slate-400">sqm</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm col-span-1 text-center flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Corners</span>
          <p className="text-lg font-black text-slate-800">{traverses.length}</p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm col-span-1 text-center flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Plot Status</span>
          <span className={`inline-block px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider ${
            plotStatus === 'Verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}>
            {plotStatus}
          </span>
        </div>
      </div>

      {/* 3. MAIN SPLIT VIEW: TECHNICAL DESCRIPTION ENCODER (LEFT) + INTERACTIVE PLOT (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: ENCODER, TIE POINT, COORDINATES & CLOSURE    */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* SECTION A: TIE POINT / REFERENCE MONUMENT */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-black text-xs">
                  TP
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    Tie Point Module (BLLM Reference)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Calculates starting Point 1 relative position from reference monument.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowTieLineOnPlot(!showTieLineOnPlot)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border transition-all cursor-pointer ${
                  showTieLineOnPlot 
                    ? 'bg-indigo-600 text-white border-indigo-700' 
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {showTieLineOnPlot ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {showTieLineOnPlot ? 'Tie Line Shown' : 'Show on Plot'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div className="sm:col-span-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Reference Monument Name</label>
                <input
                  type="text"
                  value={tiePoint.monumentName}
                  onChange={e => setTiePoint({ ...tiePoint, monumentName: e.target.value })}
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                  placeholder="BLLM No. 1, Cad 579"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Quadrant</label>
                <select
                  value={tiePoint.quadrant}
                  onChange={e => setTiePoint({ ...tiePoint, quadrant: e.target.value as any })}
                  className="w-full mt-1 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                >
                  <option value="N-E">N ... E</option>
                  <option value="S-E">S ... E</option>
                  <option value="S-W">S ... W</option>
                  <option value="N-W">N ... W</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Deg (°)</label>
                <input
                  type="number"
                  value={tiePoint.deg}
                  onChange={e => setTiePoint({ ...tiePoint, deg: parseInt(e.target.value) || 0 })}
                  className="w-full mt-1 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                  placeholder="35"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Min (')</label>
                <input
                  type="number"
                  value={tiePoint.min}
                  onChange={e => setTiePoint({ ...tiePoint, min: parseInt(e.target.value) || 0 })}
                  className="w-full mt-1 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                  placeholder="20"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Distance (m)</label>
                <input
                  type="number"
                  step="0.01"
                  value={tiePoint.distance}
                  onChange={e => setTiePoint({ ...tiePoint, distance: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-black text-indigo-900"
                  placeholder="245.35"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-600 bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-100 flex items-center justify-between">
              <span><strong>Tie Line:</strong> {tiePoint.monumentName} → Point 1: <strong>{tiePoint.quadrant.charAt(0)} {tiePoint.deg}° {tiePoint.min.toString().padStart(2, '0')}' {tiePoint.quadrant.charAt(2)}</strong></span>
              <span className="font-black text-indigo-900">{tiePoint.distance.toFixed(2)} m</span>
            </div>
          </div>

          {/* SECTION B: TECHNICAL DESCRIPTION ENCODER TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Hash className="w-4 h-4 text-emerald-600" /> Technical Description Encoder
                </h3>
                <p className="text-[11px] text-slate-500">
                  Enter boundary bearing and distance for every traverse line.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowQuickParser(!showQuickParser)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-slate-300"
                >
                  <FileText className="w-3.5 h-3.5" /> Bulk Paste
                </button>
                <button
                  onClick={handleAutoClose}
                  className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  title="Compute closing line back to Point 1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Auto-Close
                </button>
                <button
                  onClick={handleAddTraverse}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Traverse
                </button>
              </div>
            </div>

            {/* Quick Bulk Parser Dialog */}
            {showQuickParser && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 uppercase">Paste Technical Description Lines</span>
                  <span className="text-[10px] text-slate-500">Example: S 25 30 E 50.00</span>
                </div>
                <textarea
                  rows={4}
                  value={quickInputText}
                  onChange={e => setQuickInputText(e.target.value)}
                  placeholder={`1-2 S 25 30 E 50.00\n2-3 S 65 20 W 100.00\n3-4 N 24 40 W 50.00\n4-1 N 65 20 E 100.00`}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowQuickParser(false)}
                    className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleParseQuickInput}
                    className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg"
                  >
                    Parse & Load
                  </button>
                </div>
              </div>
            )}

            {/* Table of Traverses */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-[10px] uppercase font-black text-slate-600">
                    <th className="p-2 border border-slate-200 text-center w-12">From</th>
                    <th className="p-2 border border-slate-200">Bearing (Quad / Deg / Min)</th>
                    <th className="p-2 border border-slate-200 text-right w-24">Distance (m)</th>
                    <th className="p-2 border border-slate-200 text-center w-12">To</th>
                    <th className="p-2 border border-slate-200 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {traverses.map((t, idx) => (
                    <tr 
                      key={t.id || idx} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        selectedLineIndex === idx ? 'bg-amber-50/80' : ''
                      }`}
                      onClick={() => setSelectedLineIndex(idx)}
                    >
                      {/* From Point */}
                      <td className="p-2 border border-slate-200 text-center font-bold text-slate-700">
                        <input
                          type="number"
                          value={t.fromPoint}
                          onChange={e => handleUpdateTraverse(idx, 'fromPoint', parseInt(e.target.value) || 1)}
                          className="w-8 text-center bg-transparent font-bold"
                        />
                      </td>

                      {/* Bearing Quad / Deg / Min */}
                      <td className="p-2 border border-slate-200">
                        <div className="flex items-center gap-1">
                          <select
                            value={t.quadrant}
                            onChange={e => handleUpdateTraverse(idx, 'quadrant', e.target.value)}
                            className="px-1.5 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-800"
                          >
                            <option value="N-E">N ... E</option>
                            <option value="S-E">S ... E</option>
                            <option value="S-W">S ... W</option>
                            <option value="N-W">N ... W</option>
                            <option value="DUE-N">DUE N</option>
                            <option value="DUE-E">DUE E</option>
                            <option value="DUE-S">DUE S</option>
                            <option value="DUE-W">DUE W</option>
                          </select>

                          {!t.quadrant.startsWith('DUE') && (
                            <>
                              <input
                                type="number"
                                min={0}
                                max={89}
                                value={t.deg}
                                onChange={e => handleUpdateTraverse(idx, 'deg', parseInt(e.target.value) || 0)}
                                className="w-12 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-800 text-center"
                                placeholder="deg"
                              />
                              <span className="font-bold text-slate-400">°</span>
                              <input
                                type="number"
                                min={0}
                                max={59}
                                value={t.min}
                                onChange={e => handleUpdateTraverse(idx, 'min', parseInt(e.target.value) || 0)}
                                className="w-12 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-800 text-center"
                                placeholder="min"
                              />
                              <span className="font-bold text-slate-400">'</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Distance */}
                      <td className="p-2 border border-slate-200 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min={0.01}
                          value={t.distance}
                          onChange={e => handleUpdateTraverse(idx, 'distance', parseFloat(e.target.value) || 0)}
                          className="w-20 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs font-black text-slate-900 text-right"
                          placeholder="50.00"
                        />
                      </td>

                      {/* To Point */}
                      <td className="p-2 border border-slate-200 text-center font-bold text-slate-700">
                        <input
                          type="number"
                          value={t.toPoint}
                          onChange={e => handleUpdateTraverse(idx, 'toPoint', parseInt(e.target.value) || 1)}
                          className="w-8 text-center bg-transparent font-bold"
                        />
                      </td>

                      {/* Delete */}
                      <td className="p-2 border border-slate-200 text-center">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleRemoveTraverse(idx);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete Traverse"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Traverse Summary */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span>Total Traverse Distance:</span>
              <span className="text-emerald-900 font-black text-sm">{calculationResult.totalTraverseDistance.toFixed(2)} meters</span>
            </div>
          </div>

          {/* SECTION C: CALCULATED COORDINATE TABLE & BOWDITCH BALANCING */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Grid className="w-4 h-4 text-teal-600" /> Coordinate Computation Table
                </h3>
                <p className="text-[11px] text-slate-500">
                  Relative local coordinates based on Azimuth ($\Delta E$, $\Delta N$).
                </p>
              </div>

              <button
                onClick={() => setUseBowditchAdjusted(!useBowditchAdjusted)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  useBowditchAdjusted
                    ? 'bg-teal-600 text-white border-teal-700 shadow-sm'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                {useBowditchAdjusted ? '✓ Compass Rule Balanced' : 'Raw Coordinates'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-[10px] uppercase font-black text-slate-600">
                    <th className="p-2 border border-slate-200 text-center">Point</th>
                    <th className="p-2 border border-slate-200 text-right">Easting / X (m)</th>
                    <th className="p-2 border border-slate-200 text-right">Northing / Y (m)</th>
                    <th className="p-2 border border-slate-200">Departing Bearing</th>
                    <th className="p-2 border border-slate-200 text-right">Dist (m)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs font-mono">
                  {calculationResult.coordinates.map((c, i) => {
                    const adj = calculationResult.adjustedCoordinates[i];
                    const trav = traverses[i];
                    const isSelected = selectedPointIndex === i;

                    return (
                      <tr
                        key={c.point}
                        onClick={() => setSelectedPointIndex(i)}
                        className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                          isSelected ? 'bg-emerald-50 text-emerald-950 font-bold' : ''
                        }`}
                      >
                        <td className="p-2 border border-slate-200 text-center font-sans font-bold text-slate-800">
                          Pt. {c.point}
                        </td>
                        <td className="p-2 border border-slate-200 text-right font-bold text-slate-900">
                          {useBowditchAdjusted && adj?.adjustedX !== undefined ? adj.adjustedX.toFixed(3) : c.x.toFixed(3)}
                        </td>
                        <td className="p-2 border border-slate-200 text-right font-bold text-slate-900">
                          {useBowditchAdjusted && adj?.adjustedY !== undefined ? adj.adjustedY.toFixed(3) : c.y.toFixed(3)}
                        </td>
                        <td className="p-2 border border-slate-200 font-sans text-slate-600">
                          {trav?.bearingString || '-'}
                        </td>
                        <td className="p-2 border border-slate-200 text-right font-sans text-slate-700">
                          {trav ? `${trav.distance.toFixed(2)} m` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Closing back to 1 */}
                  <tr className="bg-slate-50/80 text-slate-500">
                    <td className="p-2 border border-slate-200 text-center font-sans font-bold">Pt. 1 (Close)</td>
                    <td className="p-2 border border-slate-200 text-right font-bold">
                      {calculationResult.deltaXMisclosure.toFixed(3)}
                    </td>
                    <td className="p-2 border border-slate-200 text-right font-bold">
                      {calculationResult.deltaYMisclosure.toFixed(3)}
                    </td>
                    <td className="p-2 border border-slate-200 font-sans italic" colSpan={2}>
                      Closing Misclosure Point
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION D: CLOSURE CHECK & AREA SHOELACE VERIFICATION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Closure Check Box */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Closure Verification</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  calculationResult.closureStatus === 'GOOD' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : calculationResult.closureStatus === 'FAIR'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {calculationResult.closureStatus === 'GOOD' ? '🟢 Good Closure' : calculationResult.closureStatus === 'FAIR' ? '🟡 Fair Closure' : '🔴 Check Tech Desc'}
                </span>
              </div>

              <div>
                <p className="text-xs text-slate-500">Linear Misclosure:</p>
                <p className="text-lg font-black text-slate-900">
                  {calculationResult.linearMisclosure.toFixed(3)} meters
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500">Closure Precision Ratio:</p>
                <p className="text-base font-black text-emerald-800 font-mono">
                  {calculationResult.closureRatioStr}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  DENR survey standard: 1:5,000 or better.
                </p>
              </div>
            </div>

            {/* Shoelace Area Check Box */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Shoelace Area Analysis</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  calculationResult.areaMatch === 'PASS' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {calculationResult.areaMatch === 'PASS' ? '✓ Area Match: PASS' : '⚠ Discrepancy'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Computed Area</p>
                  <p className="text-base font-black text-emerald-900">
                    {calculationResult.computedArea.toFixed(2)} sqm
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Stated Area</p>
                  <p className="text-base font-black text-slate-800">
                    {statedArea.toFixed(2)} sqm
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 font-bold">Variance: </span>
                  <span className="font-black text-slate-800">{calculationResult.areaDiff.toFixed(2)} sqm ({calculationResult.areaVariancePct.toFixed(3)}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION E: BOUNDARIES & ROAD ACCESS METADATA */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" /> Road Access & Adjoining Boundaries
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Road Width / Type</label>
                <input
                  type="text"
                  value={roadWidth}
                  onChange={e => setRoadWidth(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                  placeholder="8.00 meters concrete road"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Road Access Classification</label>
                <input
                  type="text"
                  value={roadAccessType}
                  onChange={e => setRoadAccessType(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                  placeholder="Along Barangay Concrete Road"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Boundary (North)</label>
                <input
                  type="text"
                  value={boundaryNorth}
                  onChange={e => setBoundaryNorth(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                  placeholder="Lot 124"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Boundary (East)</label>
                <input
                  type="text"
                  value={boundaryEast}
                  onChange={e => setBoundaryEast(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                  placeholder="Lot 125"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Boundary (South)</label>
                <input
                  type="text"
                  value={boundarySouth}
                  onChange={e => setBoundarySouth(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                  placeholder="Road Lot 2"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Boundary (West)</label>
                <input
                  type="text"
                  value={boundaryWest}
                  onChange={e => setBoundaryWest(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                  placeholder="Lot 122"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: INTERACTIVE LOT PLOT (SVG CANVAS)           */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 space-y-4 sticky top-6">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
            
            {/* Toolbar */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  {lotNo} ({calculationResult.lotShape})
                </span>
              </div>

              {/* View Control Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setZoomScale(z => Math.min(z * 1.25, 4))}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomScale(z => Math.max(z / 1.25, 0.4))}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={handleResetView}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer"
                  title="Reset View"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Display Layer Toggles */}
            <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-300">
              <label className="flex items-center gap-1 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={showBearings}
                  onChange={e => setShowBearings(e.target.checked)}
                  className="rounded text-emerald-500"
                />
                Bearings
              </label>
              <label className="flex items-center gap-1 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={showDistances}
                  onChange={e => setShowDistances(e.target.checked)}
                  className="rounded text-emerald-500"
                />
                Distances
              </label>
              <label className="flex items-center gap-1 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={showPoints}
                  onChange={e => setShowPoints(e.target.checked)}
                  className="rounded text-emerald-500"
                />
                Points
              </label>
              <label className="flex items-center gap-1 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={showCoordinates}
                  onChange={e => setShowCoordinates(e.target.checked)}
                  className="rounded text-emerald-500"
                />
                Coordinates
              </label>
              <label className="flex items-center gap-1 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={e => setShowGrid(e.target.checked)}
                  className="rounded text-emerald-500"
                />
                Grid
              </label>
            </div>

            {/* Main Interactive SVG Canvas */}
            <div 
              className="relative w-full h-[460px] bg-slate-950 overflow-hidden cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* North Arrow Widget in top-right */}
              <div className="absolute top-4 right-4 z-10 bg-slate-900/80 backdrop-blur border border-slate-700/80 rounded-2xl p-3 shadow-lg flex flex-col items-center pointer-events-none">
                <div className="relative w-8 h-10 flex flex-col items-center justify-center">
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[18px] border-b-rose-500 mb-0.5 animate-pulse" />
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[18px] border-t-slate-400" />
                </div>
                <span className="text-[11px] font-black text-white mt-1">N</span>
              </div>

              {/* Scale & Summary Overlay in bottom-left */}
              <div className="absolute bottom-4 left-4 z-10 bg-slate-900/85 backdrop-blur border border-slate-700/80 rounded-2xl p-3 shadow-lg pointer-events-none text-xs text-white space-y-1">
                <p className="font-black text-emerald-400 text-sm">
                  {calculationResult.computedArea.toFixed(2)} SQM
                </p>
                <p className="text-[10px] text-slate-400">
                  Shape: {calculationResult.lotShape} | {traverses.length} Corners
                </p>
                <div className="pt-1 border-t border-slate-700 flex items-center gap-2 text-[10px]">
                  <div className="w-12 h-1 bg-emerald-500 rounded-full" />
                  <span className="text-slate-300 font-mono">10 meters</span>
                </div>
              </div>

              {/* SVG Surface */}
              <svg
                ref={svgRef}
                viewBox={`${viewBoxMinX} ${viewBoxMinY} ${viewBoxWidth} ${viewBoxHeight}`}
                className="w-full h-full"
                style={{
                  transform: `scale(${zoomScale}) translate(${panOffset.x / zoomScale}px, ${panOffset.y / zoomScale}px)`,
                  transformOrigin: 'center center',
                  transition: isDraggingRef.current ? 'none' : 'transform 0.1s ease-out'
                }}
              >
                <defs>
                  {/* Subtle Grid Pattern */}
                  <pattern id="lotPlotGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                  </pattern>
                </defs>

                {/* Grid Background */}
                {showGrid && (
                  <rect
                    x={viewBoxMinX - 1000}
                    y={viewBoxMinY - 1000}
                    width={viewBoxWidth + 2000}
                    height={viewBoxHeight + 2000}
                    fill="url(#lotPlotGrid)"
                  />
                )}

                {/* Coordinate Axes (0,0) */}
                <line x1="-1000" y1="0" x2="1000" y2="0" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" strokeDasharray="4 4" />
                <line x1="0" y1="-1000" x2="0" y2="1000" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" strokeDasharray="4 4" />

                {/* Tie Line from Monument (if enabled) */}
                {showTieLineOnPlot && calculationResult.tiePointCoordinates && (
                  <g>
                    <line
                      x1={calculationResult.tiePointCoordinates.x}
                      y1={-calculationResult.tiePointCoordinates.y}
                      x2={0}
                      y2={0}
                      stroke="#818cf8"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                    {/* Monument Marker */}
                    <circle
                      cx={calculationResult.tiePointCoordinates.x}
                      cy={-calculationResult.tiePointCoordinates.y}
                      r="4"
                      fill="#6366f1"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    <text
                      x={calculationResult.tiePointCoordinates.x}
                      y={-calculationResult.tiePointCoordinates.y - 6}
                      fill="#a5b4fc"
                      fontSize="4"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {tiePoint.monumentName}
                    </text>
                  </g>
                )}

                {/* Filled Lot Polygon */}
                {showFill && (
                  <polygon
                    points={polygonPointsStr}
                    fill="rgba(16, 185, 129, 0.18)"
                    stroke="#10b981"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                )}

                {/* Traversed Boundary Lines with Bearing & Distance Labels */}
                {traverses.map((trav, idx) => {
                  const p1 = activeCoords[idx];
                  const p2 = activeCoords[(idx + 1) % activeCoords.length];
                  if (!p1 || !p2) return null;

                  const x1 = p1.adjustedX !== undefined && useBowditchAdjusted ? p1.adjustedX : p1.x;
                  const y1 = p1.adjustedY !== undefined && useBowditchAdjusted ? p1.adjustedY : p1.y;
                  const x2 = p2.adjustedX !== undefined && useBowditchAdjusted ? p2.adjustedX : p2.x;
                  const y2 = p2.adjustedY !== undefined && useBowditchAdjusted ? p2.adjustedY : p2.y;

                  // Midpoint for text
                  const midX = (x1 + x2) / 2;
                  const midY = (-y1 + -y2) / 2;

                  // Angle for text rotation
                  const dx = x2 - x1;
                  const dy = -(y2 - y1);
                  let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
                  if (angleDeg > 90 || angleDeg < -90) angleDeg += 180;

                  const isSelected = selectedLineIndex === idx;

                  return (
                    <g key={`line_${idx}`} onClick={() => setSelectedLineIndex(idx)} className="cursor-pointer">
                      {/* Line */}
                      <line
                        x1={x1}
                        y1={-y1}
                        x2={x2}
                        y2={-y2}
                        stroke={isSelected ? '#f59e0b' : idx === 0 ? '#34d399' : '#10b981'}
                        strokeWidth={isSelected ? 3.2 : 2}
                      />

                      {/* Text Label on Line */}
                      {(showBearings || showDistances) && (
                        <g transform={`translate(${midX}, ${midY}) rotate(${angleDeg})`}>
                          <rect
                            x="-16"
                            y="-4.5"
                            width="32"
                            height="9"
                            fill="rgba(15, 23, 42, 0.85)"
                            rx="2"
                          />
                          <text
                            x="0"
                            y="1.5"
                            fill={isSelected ? '#fef08a' : '#e2e8f0'}
                            fontSize="2.8"
                            fontWeight="bold"
                            textAnchor="middle"
                            fontFamily="monospace"
                          >
                            {showBearings && trav.bearingString}
                            {showBearings && showDistances ? ' | ' : ''}
                            {showDistances && `${trav.distance.toFixed(1)}m`}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Point Markers & Coordinates */}
                {activeCoords.map((pt, idx) => {
                  const px = pt.adjustedX !== undefined && useBowditchAdjusted ? pt.adjustedX : pt.x;
                  const py = pt.adjustedY !== undefined && useBowditchAdjusted ? pt.adjustedY : pt.y;
                  const isSelected = selectedPointIndex === idx;

                  return (
                    <g 
                      key={`pt_${pt.point}`} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPointIndex(idx);
                      }}
                      className="cursor-pointer"
                    >
                      {/* Highlight Ring */}
                      {isSelected && (
                        <circle
                          cx={px}
                          cy={-py}
                          r="5.5"
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth="1.2"
                          strokeDasharray="2 2"
                        />
                      )}

                      {/* Dot */}
                      <circle
                        cx={px}
                        cy={-py}
                        r="3"
                        fill={idx === 0 ? '#10b981' : '#38bdf8'}
                        stroke="#ffffff"
                        strokeWidth="1"
                      />

                      {/* Point Label */}
                      {showPoints && (
                        <text
                          x={px}
                          y={-py - 4}
                          fill="#ffffff"
                          fontSize="3.5"
                          fontWeight="black"
                          textAnchor="middle"
                        >
                          P{pt.point}
                        </text>
                      )}

                      {/* Coordinate Tooltip text */}
                      {showCoordinates && (
                        <text
                          x={px}
                          y={-py + 6.5}
                          fill="#94a3b8"
                          fontSize="2.2"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          ({px.toFixed(1)}, {py.toFixed(1)})
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Point / Line Inspector Drawer */}
            {(selectedPointIndex !== null || selectedLineIndex !== null) && (
              <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                {selectedPointIndex !== null ? (
                  <div>
                    <span className="text-[10px] font-black text-amber-400 uppercase">Selected Corner</span>
                    <p className="font-black text-white text-sm">
                      Point {activeCoords[selectedPointIndex]?.point}
                    </p>
                    <p className="text-slate-400 font-mono mt-0.5">
                      Easting (X): {activeCoords[selectedPointIndex]?.x.toFixed(3)} m | Northing (Y): {activeCoords[selectedPointIndex]?.y.toFixed(3)} m
                    </p>
                  </div>
                ) : selectedLineIndex !== null ? (
                  <div>
                    <span className="text-[10px] font-black text-amber-400 uppercase">Selected Boundary Line</span>
                    <p className="font-black text-white text-sm">
                      Line {traverses[selectedLineIndex]?.fromPoint} → {traverses[selectedLineIndex]?.toPoint}
                    </p>
                    <p className="text-slate-400 font-mono mt-0.5">
                      Bearing: {traverses[selectedLineIndex]?.bearingString} | Distance: {traverses[selectedLineIndex]?.distance.toFixed(2)} m
                    </p>
                  </div>
                ) : null}

                <button
                  onClick={() => {
                    setSelectedPointIndex(null);
                    setSelectedLineIndex(null);
                  }}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Deselect
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LotPlottingModule;
