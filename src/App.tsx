import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, UserRole, Assignment, AssignmentStatus, TimelineStep, Liability, CashflowReport, MOP, TOP, LoanCategory, AttendanceRecord, LeaveRequest, OvertimeRequest, LeaveType, OBRequest } from './types';
import { 
  LineChart,
  Line,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp,
  LayoutDashboard, 
  Star,
  UserPlus, 
  ClipboardList, 
  CheckCircle2, 
  Key, 
  LogOut, 
  Menu, 
  ListChecks,
  X, 
  ChevronRight, 
  Check, 
  AlertCircle,
  Camera,
  Database,
  User,
  Phone,
  Calendar,
  Clock,
  Search,
  BarChart2,
  Settings2,
  Users,
  Trash2,
  Pencil,
  Download,
  Save,
  FileText,
  Bell,
  Presentation,
  Monitor,
  Tablet,
  Smartphone,
  CheckCircle,
  ShieldCheck,
  CalendarDays,
  Timer,
  Fingerprint,
  ClipboardCheck,
  BarChart3,
  Filter,
  ArrowRight,
  Briefcase,
  FileBarChart,
  CalendarRange,
  XCircle,
  Plus,
  Archive
} from 'lucide-react';
import pptxgen from "pptxgenjs";
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { auth, db } from './firebase';
import EvaluationModule from './components/EvaluationModule';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updatePassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  limit,
  getDocFromServer,
  addDoc,
  deleteField
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

import { AppNotification } from './types';

// PowerPoint Generation Utility
const generateAssignmentPPT = (a: Assignment) => {
  const pptx = new pptxgen();

  // Slide 1: Cover
  const slide1 = pptx.addSlide();
  slide1.addText("CREDIT INVESTIGATION & APPRAISAL REPORT", { x: 0.5, y: 1.0, w: 9.0, h: 1.0, fontSize: 32, bold: true, color: "065F46", align: "center" });
  slide1.addText(a.borrowerName.toUpperCase(), { x: 0.5, y: 2.2, w: 9.0, h: 0.5, fontSize: 24, bold: true, color: "064E3B", align: "center" });
  slide1.addText(`${a.accountType} • ${a.location}`, { x: 0.5, y: 2.8, w: 9.0, h: 0.3, fontSize: 14, color: "065F46", align: "center" });
  slide1.addShape(pptx.ShapeType.rect, { x: 1.0, y: 3.5, w: 8.0, h: 0.1, fill: { color: "10B981" } });
  slide1.addText(`CI Officer: ${a.ciOfficerName}`, { x: 0.5, y: 4.5, w: 9.0, h: 0.3, fontSize: 12, color: "6B7280", align: "center" });
  slide1.addText(`Status: ${a.status}`, { x: 0.5, y: 4.8, w: 9.0, h: 0.3, fontSize: 12, bold: true, color: "059669", align: "center" });

  // Slide 2: Personal & Loan Profile
  const slide2 = pptx.addSlide();
  slide2.addText("PROFILE & REQUEST SUMMARY", { x: 0.5, y: 0.3, w: 9.0, h: 0.5, fontSize: 18, bold: true, color: "065F46" });
  slide2.addTable(
    [
      [{ text: "BORROWER NAME", options: { bold: true, fill: { color: "F3F4F6" } } }, { text: a.borrowerName }],
      [{ text: "MOBILE NUMBER", options: { bold: true, fill: { color: "F3F4F6" } } }, { text: String(a.mobileNumber) }],
      [{ text: "LOCATION", options: { bold: true, fill: { color: "F3F4F6" } } }, { text: a.location }],
      [{ text: "TRIBE", options: { bold: true, fill: { color: "F3F4F6" } } }, { text: a.tribe }],
      [{ text: "ACCOUNT TYPE", options: { bold: true, fill: { color: "F3F4F6" } } }, { text: a.accountType }],
      [{ text: "REQUESTED AMOUNT", options: { bold: true, fill: { color: "F3F4F6" } } }, { text: `₱${a.requestedAmount.toLocaleString()}` }],
      [{ text: "TERM", options: { bold: true, fill: { color: "F3F4F6" } } }, { text: `${a.term} Months` }],
      [{ text: "INT. RATE", options: { bold: true, fill: { color: "F3F4F6" } } }, { text: `${a.intRate}% Flat` }],
    ],
    { x: 0.5, y: 1.0, w: 9.0, rowH: 0.4, fontSize: 11, border: { pt: 1, color: "E2E8F0" } }
  );

  // Slide 3: Credit Scoring Analysis
  if (a.creditScore) {
    const slide3 = pptx.addSlide();
    slide3.addText("CREDIT RISK ASSESSMENT", { x: 0.5, y: 0.3, w: 9.0, h: 0.5, fontSize: 18, bold: true, color: "065F46" });
    
    const scoreData = [];
    if (a.creditScore.sectionGrades) {
        Object.entries(a.creditScore.sectionGrades).forEach(([section, grade]) => {
          scoreData.push([{ text: section.toUpperCase(), options: { bold: true, fill: { color: "F3F4F6" } } }, { text: `${grade} Points` }]);
        });
    }

    slide3.addTable(
      [
        ...scoreData,
        [{ text: "TOTAL CUMULATIVE SCORE", options: { bold: true, color: "FFFFFF", fill: { color: "065F46" } } }, { text: `${a.creditScore.totalGrade.toFixed(1)} / 100`, options: { bold: true, color: "FFFFFF", fill: { color: "065F46" } } }],
        [{ text: "FINAL RISK SCORE", options: { bold: true, color: "FFFFFF", fill: { color: "EF4444" } } }, { text: `${(100 - a.creditScore.totalGrade).toFixed(1)}%`, options: { bold: true, color: "FFFFFF", fill: { color: "EF4444" } } }],
        [{ text: "CI RECOMMENDATION", options: { bold: true, fill: { color: "F3F4F6" } } }, { text: a.creditScore.recommendation }]
      ],
      { x: 0.5, y: 1.0, w: 9.0, fontSize: 12, border: { pt: 1, color: "E2E8F0" } }
    );
  }

  // Slide 4: Cashflow Overview
  if (a.cashflowReport) {
    const slide4 = pptx.addSlide();
    slide4.addText("CASHFLOW DIAGNOSTIC", { x: 0.5, y: 0.3, w: 9.0, h: 0.5, fontSize: 18, bold: true, color: "065F46" });
    
    const analysis = a.cashflowReport.analysis;
    const recommended = a.cashflowReport.ciRecommendation;

    slide4.addTable(
      [
        [{ text: "METRIC", options: { bold: true, fill: { color: "065F46" }, color: "FFFFFF" } }, { text: "VALUE", options: { bold: true, fill: { color: "065F46" }, color: "FFFFFF" } }],
        [{ text: "Gross Business Income" }, { text: `₱${analysis.grossBusinessIncome.toLocaleString()}` }],
        [{ text: "Business Expenses" }, { text: `(₱${analysis.businessExpenses.toLocaleString()})` }],
        [{ text: "Household Expenses" }, { text: `(₱${analysis.totalHouseholdExpenses.toLocaleString()})` }],
        [{ text: "Net Disposable Income (NDI)", options: { bold: true } }, { text: `₱${analysis.netIncome.toLocaleString()}` }],
        [{ text: "Policy Calibration" }, { text: `${analysis.ndiPercentage}% NDI Target` }],
        [{ text: "Monthly Paying Capacity", options: { bold: true, color: "059669" } }, { text: `₱${analysis.monthlyNdi.toLocaleString()}` }],
        [{ text: "Algorithm-Based Loan Amount", options: { bold: true, color: "065F46" } }, { text: `₱${analysis.recommendedLoan.toLocaleString(undefined, { maximumFractionDigits: 0 })}` }],
      ],
      { x: 0.5, y: 1.0, w: 9.0, fontSize: 12, border: { pt: 1, color: "E2E8F0" } }
    );

    // Slide 4.5: Outstanding Liabilities
    const slideLia = pptx.addSlide();
    slideLia.addText("CLIENT OUTSTANDING LIABILITIES", { x: 0.5, y: 0.3, w: 9.0, h: 0.5, fontSize: 18, bold: true, color: "065F46" });

    if (a.cashflowReport.liabilities && a.cashflowReport.liabilities.length > 0) {
      const tableHeader = [
        [
          { text: "CREDITOR/SOURCE", options: { bold: true, fill: { color: "065F46" }, color: "FFFFFF" } },
          { text: "LOAN TYPE", options: { bold: true, fill: { color: "065F46" }, color: "FFFFFF" } },
          { text: "LOAN AMOUNT", options: { bold: true, fill: { color: "065F46" }, color: "FFFFFF" } },
          { text: "PERIODICITY", options: { bold: true, fill: { color: "065F46" }, color: "FFFFFF" } },
          { text: "AMORTIZATION", options: { bold: true, fill: { color: "065F46" }, color: "FFFFFF" } },
          { text: "BALANCE", options: { bold: true, fill: { color: "065F46" }, color: "FFFFFF" } },
          { text: "STATUS", options: { bold: true, fill: { color: "065F46" }, color: "FFFFFF" } }
        ]
      ];

      const rows = [
        ...tableHeader,
        ...a.cashflowReport.liabilities.map((l: Liability) => [
          { text: l.source || "N/A" },
          { text: l.loanType || "N/A" },
          { text: l.loanAmount ? `₱${Number(l.loanAmount).toLocaleString()}` : "₱0" },
          { text: l.periodicity || "N/A" },
          { text: l.amortization ? `₱${Number(l.amortization).toLocaleString()}` : "₱0" },
          { text: l.balance ? `₱${Number(l.balance).toLocaleString()}` : "₱0" },
          { text: l.status || "N/A" }
        ])
      ];

      slideLia.addTable(rows, { x: 0.5, y: 1.0, w: 9.0, fontSize: 10, border: { pt: 1, color: "E2E8F0" } });
    } else {
      slideLia.addText("No external liabilities or outstanding loans declared for this borrower.", { x: 0.5, y: 1.5, w: 9.0, h: 0.5, fontSize: 13, italic: true });
    }

    const slide5 = pptx.addSlide();
    slide5.addText("CI RECOMMENDATION & JUSTIFICATION", { x: 0.5, y: 0.3, w: 9.0, h: 0.5, fontSize: 18, bold: true, color: "065F46" });
    slide5.addText("PROPOSED REPAYMENT TERMS:", { x: 0.5, y: 1.0, w: 9.0, h: 0.3, fontSize: 12, bold: true });
    
    slide5.addTable(
      [
        [{ text: "Loan Amount" }, { text: `₱${recommended.loanAmount.toLocaleString()}` }],
        [{ text: "Term" }, { text: `${recommended.term} Months` }],
        [{ text: "Monthly Int. Rate" }, { text: `${recommended.rate}%` }],
        [{ text: "Weekly Amortization" }, { text: `₱${recommended.weeklyAmort.toLocaleString()}` }],
        [{ text: "Monthly Amortization" }, { text: `₱${recommended.monthlyAmort.toLocaleString()}` }],
      ],
      { x: 0.5, y: 1.5, w: 9.0, fontSize: 12, border: { pt: 1, color: "E2E8F0" } }
    );

    slide5.addText("JUSTIFICATION:", { x: 0.5, y: 4.5, w: 9.0, h: 0.3, fontSize: 12, bold: true, color: "059669" });
    slide5.addShape(pptx.ShapeType.rect, { x: 0.5, y: 4.9, w: 9.0, h: 1.5, fill: { color: "F9FAFB" }, line: { color: "E2E8F0" } });
    slide5.addText(recommended.remarks || "No remarks provided.", { x: 0.7, y: 5.1, w: 8.6, h: 1.1, fontSize: 10, italic: true });
  }

  // Slide 6: Automated AI Assessment comments (if present)
  if (a.aiAnalysis) {
    const slideAI = pptx.addSlide();
    slideAI.addText("AUTOMATED RISK & CAPACITY ASSESSMENT", { x: 0.5, y: 0.3, w: 9.0, h: 0.5, fontSize: 18, bold: true, color: "065F46" });
    slideAI.addText("GEMINI CORE INTEGRATION REPORT SUMMARY", { x: 0.5, y: 0.8, w: 9.0, h: 0.3, fontSize: 10, bold: true, color: "10B981" });

    slideAI.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.2, w: 9.0, h: 5.2, fill: { color: "F9FAFB" }, line: { color: "10B981" } });
    
    // Strip rough markdown formatting marks
    const formattedAiText = a.aiAnalysis
      .replace(/###\s*(.*)/g, '$1\n')
      .replace(/\*\*/g, '')
      .replace(/-\s+/g, '• ')
      .trim();

    slideAI.addText(formattedAiText, { 
      x: 0.7, 
      y: 1.4, 
      w: 8.6, 
      h: 4.8, 
      fontSize: 9, 
      fontFace: "Arial", 
      color: "064E3B",
      align: "left",
      valign: "top"
    });
  }

  pptx.writeFile({ fileName: `CIBI_Report_${a.borrowerName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pptx` });
};

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// API Helpers (Migrated to Firebase)
const api = {
  get: async (path: string) => {
    try {
      if (path === '/api/assignments') {
        const q = query(collection(db, 'assignments'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      if (path === '/api/users') {
        const snapshot = await getDocs(collection(db, 'users'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      if (path === '/api/officers') {
        const snapshot = await getDocs(collection(db, 'users'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      if (path === '/api/admin-keys') {
        const snapshot = await getDocs(collection(db, 'admin_keys'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      throw new Error('Endpoint not implemented in Firebase migration');
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },
  post: async (path: string, data: Record<string, unknown>) => {
    try {
      if (path === '/api/assignments') {
        const docRef = doc(collection(db, 'assignments'));
        await setDoc(docRef, { ...data, createdAt: new Date().toISOString() });
        return { id: docRef.id };
      }
      if (path === '/api/admin-keys') {
        const key = data['key'] as string;
        const docRef = doc(db, 'admin_keys', key);
        await setDoc(docRef, { ...data, createdAt: new Date().toISOString(), used: false });
        return { success: true };
      }
      throw new Error('Endpoint not implemented in Firebase migration');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },
  patch: async (path: string, data: Record<string, unknown>) => {
    try {
      const parts = path.split('/');
      if (parts[1] === 'api' && parts[2] === 'assignments') {
        const id = parts[3];
        await updateDoc(doc(db, 'assignments', id), data as { [x: string]: any });
        return { success: true };
      }
      if (path === '/api/auth/profile') {
        const user = auth.currentUser;
        if (!user) throw new Error('Not authenticated');
        const updateData: Record<string, unknown> = {};
        if (data.fullName) updateData.fullName = data.fullName;
        if (data.mobileNumber) updateData.mobileNumber = data.mobileNumber;
        if (data.photoURL !== undefined) updateData.photoURL = data.photoURL;
        
        if (Object.keys(updateData).length > 0) {
          await updateDoc(doc(db, 'users', user.uid), updateData as { [x: string]: any });
        }
        
        if (data.password) {
          await updatePassword(user, data.password as string);
        }
        return { success: true };
      }
      if (parts[1] === 'api' && parts[2] === 'users') {
        const id = parts[3];
        await updateDoc(doc(db, 'users', id), data as { [x: string]: any });
        return { success: true };
      }
      throw new Error(`Endpoint not implemented: ${path}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },
  delete: async (path: string) => {
    console.log(`API DELETE: ${path}`);
    try {
      const parts = path.split('/');
      if (parts[1] === 'api') {
        if (parts[2] === 'users') {
          const id = parts[3];
          console.log(`Deleting user: ${id}`);
          await deleteDoc(doc(db, 'users', id));
          return { success: true };
        }
        if (parts[2] === 'assignments') {
          const id = parts[3];
          console.log(`Deleting assignment: ${id}`);
          await deleteDoc(doc(db, 'assignments', id));
          return { success: true };
        }
        if (parts[2] === 'admin-keys') {
          const id = parts[3];
          console.log(`Deleting admin key: ${id}`);
          await deleteDoc(doc(db, 'admin_keys', id));
          return { success: true };
        }
      }
      throw new Error(`Endpoint not implemented: ${path}`);
    } catch (error) {
      console.error('API DELETE ERROR:', error);
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

interface SmartphoneMockupProps {
  children: React.ReactNode;
  viewportMode: 'desktop' | 'tablet' | 'mobile';
  setViewportMode: (mode: 'desktop' | 'tablet' | 'mobile') => void;
  isPhysicalMobile: boolean;
}

function SmartphoneMockup({ children, viewportMode, setViewportMode, isPhysicalMobile }: SmartphoneMockupProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (isPhysicalMobile || viewportMode !== 'mobile') {
    return <>{children}</>;
  }

  const displayHourMin = format(time, 'h:mm');
  const displayAmPm = format(time, 'a');

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 md:p-8 relative select-none antialiased">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-slate-950 to-slate-950 z-0 pointer-events-none" />
      <div className="absolute top-10 left-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-20 mb-4 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">MOBILE PHONE FRAME</span>
        <div className="h-3 w-[1px] bg-white/15" />
        <button 
          onClick={() => setViewportMode('desktop')} 
          className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase text-slate-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1 cursor-pointer"
        >
          <Monitor size={11} /> DESKTOP VERSION
        </button>
      </div>

      <div className="relative z-10 w-full max-w-[390px] h-[844px] bg-slate-900 rounded-[54px] p-2.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),_0_0_0_1px_rgba(255,255,255,0.06),_inset_0_2px_4px_rgba(255,255,255,0.15)] flex flex-col overflow-hidden">
        <div className="absolute inset-2.5 rounded-[44px] border border-slate-950/40 pointer-events-none z-40" />

        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6.5 bg-slate-950 rounded-full z-50 flex items-center justify-between px-3.5 shadow-md">
          <div className="w-3.5 h-3.5 bg-slate-900 rounded-full border border-slate-800/60 flex items-center justify-center relative">
            <div className="absolute w-1.5 h-1.5 bg-blue-600/20 rounded-full blur-[0.5px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="w-1.5 h-1.5 bg-slate-900 rounded-full opacity-60" />
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
        </div>

        <div className="h-11 bg-white text-slate-800 px-6 pt-2.5 flex items-center justify-between text-[11px] font-black tracking-tight select-none z-40 relative flex-shrink-0">
          <div className="flex items-center gap-1 mt-0.5">
            <span>{displayHourMin}</span>
            <span className="text-[8px] opacity-70 tracking-tighter uppercase">{displayAmPm}</span>
          </div>

          <div className="w-24 h-4" />

          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="flex items-end gap-[1.5px] h-2.5">
              <div className="w-[2.5px] h-1.5 bg-slate-800 rounded-[0.5px]" />
              <div className="w-[2.5px] h-2 bg-slate-800 rounded-[0.5px]" />
              <div className="w-[2.5px] h-2.5 bg-slate-800 rounded-[0.5px]" />
              <div className="w-[2.5px] h-3 bg-slate-800 rounded-[0.5px]" />
            </div>
            <svg className="w-3.5 h-3.5 text-slate-800 fill-current" viewBox="0 0 24 24">
              <path d="M12 21l-12-11.6c6.6-6.4 17.4-6.4 24 0z"/>
            </svg>
            <div className="flex items-center gap-0.5 border border-slate-800/60 rounded-xs p-[1px] h-3 w-5.5 relative">
              <div className="bg-emerald-500 h-full w-[80%] rounded-2xs" />
              <div className="w-0.5 h-1 bg-slate-800/60 rounded-r-xs absolute -right-0.5" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative flex flex-col bg-gray-50 rounded-[34px] z-20">
          <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col h-full bg-gray-50 select-text">
            {children}
          </div>
        </div>

        <div className="h-5 bg-white z-40 relative flex items-center justify-center select-none pb-1 pointer-events-none flex-shrink-0">
          <div className="w-32 h-1 bg-slate-900/15 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'dashboard' | 'verify'>('login');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('mobile');
  const [isPhysicalMobile, setIsPhysicalMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsPhysicalMobile(window.innerWidth < 645);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    // Connectivity test as required by instructions
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'scoringConfigs', 'connectivity-check'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const superAdmins = ['1stmb.mj@gmail.com'];
          const isSuperAdmin = superAdmins.includes(firebaseUser.email || '');

          if (userDoc.exists()) {
            const data = userDoc.data();
            const role = isSuperAdmin ? 'admin' : data.role;
            const userData = { id: firebaseUser.uid, ...data, role } as UserProfile;
            setUser(userData);
            
            if (isSuperAdmin || userData.isVerified) {
              setCurrentView('dashboard');
            } else {
              setCurrentView('verify');
            }
          } else {
            // Handle first-time Google sign-in by creating a profile
            const userData = {
              fullName: firebaseUser.displayName || 'Unnamed User',
              mobileNumber: '',
              email: firebaseUser.email || '',
              role: isSuperAdmin ? 'admin' : 'user',
              isVerified: isSuperAdmin, // Super admins are auto-verified
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), userData);
            setUser({ id: firebaseUser.uid, ...userData } as UserProfile);
            
            if (isSuperAdmin) {
              setCurrentView('dashboard');
            } else {
              setCurrentView('verify');
            }
          }
        } catch (err) {
          console.error('Error fetching/creating user profile:', err);
          setUser(null);
          setCurrentView('login');
        }
      } else {
        setUser(null);
        setCurrentView('login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setCurrentView('login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-950 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')]"></div>
        <div className="flex flex-col items-center gap-6 relative z-10">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin shadow-[0_0_20px_rgba(16,185,129,0.3)]"></div>
          <div className="text-emerald-400 text-sm font-black uppercase tracking-[0.5em] animate-pulse">CIBI SYSTEM</div>
        </div>
      </div>
    );
  }

  return (
    <SmartphoneMockup 
      viewportMode={viewportMode} 
      setViewportMode={setViewportMode} 
      isPhysicalMobile={isPhysicalMobile}
    >
      <div className={cn(
        "min-h-screen font-sans flex flex-col relative overflow-hidden transition-colors duration-500",
        currentView === 'dashboard' ? "bg-slate-50 text-gray-900" : "bg-slate-950 text-white"
      )}>
        {/* Dynamic Liquid Glass Backdrop Blobs for non-dashboard pages */}
        {currentView !== 'dashboard' && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] min-w-[350px] min-h-[350px] rounded-full liquid-glow-1 animate-liquid-one" />
            <div className="absolute bottom-[-15%] right-[-5%] w-[60vw] h-[60vw] min-w-[400px] min-h-[400px] rounded-full liquid-glow-2 animate-liquid-two" />
            <div className="absolute top-[30%] right-[15%] w-[45vw] h-[45vw] min-w-[300px] min-h-[300px] rounded-full liquid-glow-3 animate-liquid-three" />
          </div>
        )}
        <AnimatePresence mode="wait">
          {currentView === 'login' && (
            <Login 
              onSwitch={() => setCurrentView('register')} 
            />
          )}
          {currentView === 'register' && (
            <Register 
              onSwitch={() => setCurrentView('login')} 
            />
          )}
          {currentView === 'dashboard' && user && (
            <Dashboard 
              user={user} 
              setUser={setUser}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              handleLogout={handleLogout}
              viewportMode={viewportMode}
              setViewportMode={setViewportMode}
            />
          )}
          {currentView === 'verify' && user && (
            <AdminKeyVerification 
              user={user} 
              setUser={setUser} 
              onSuccess={() => setCurrentView('dashboard')}
              onLogout={handleLogout}
            />
          )}
        </AnimatePresence>
        <ToastContainer position="bottom-right" theme="dark" aria-label="Notifications" />
      </div>
    </SmartphoneMockup>
  );
}

// --- LOGIN COMPONENT ---
function Login({ 
  onSwitch
}: { 
  onSwitch: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the rest
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle profile creation if needed
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Google sign-in failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="min-h-screen flex relative z-10"
    >
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-transparent">
        <div className="w-full max-w-md space-y-8 glass-card p-8 md:p-12 rounded-3xl shadow-xl border border-white/10 transition-all duration-300">
          <div className="text-center">
            <h2 className="text-3xl font-black text-white tracking-tight">WELCOME</h2>
            <p className="text-xs text-emerald-400 uppercase tracking-widest mt-1 font-extrabold">Sign in to CIBI System</p>
          </div>
          
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <input
                type="email"
                placeholder="Email Address"
                className="w-full px-4 py-3 glass-input text-white font-bold placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-3 glass-input text-white font-bold placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-400 text-xs text-center font-bold">{error}</p>}
            <button
               type="submit"
               disabled={loading}
               className="w-full py-4 bg-linear-to-r from-emerald-600 to-emerald-800 text-white font-black rounded-xl shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 uppercase tracking-widest text-xs"
            >
              {loading ? 'Authenticating...' : 'Secure Access'}
            </button>
          </form>
 
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="bg-transparent px-4 text-slate-300 font-black">Identity Providers</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 shadow-md uppercase tracking-widest text-xs"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            GOOGLE AUTH
          </button>
          
          <div className="text-center">
            <button 
              onClick={onSwitch}
              className="text-emerald-400 hover:text-emerald-300 text-xs font-black uppercase tracking-widest hover:underline transition-colors"
            >
              Create System Account
            </button>
          </div>
        </div>
      </div>
      <div className="hidden lg:flex flex-1 glass-sidebar items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')]"></div>
        <div className="text-center space-y-4 relative z-10">
          <div className="w-20 h-20 bg-white/10 rounded-3xl backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto mb-8 shadow-2xl animate-pulse">
            <ShieldCheck size={40} className="text-emerald-400" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase">CIBI Management System</h1>
          <p className="text-emerald-400 font-bold uppercase tracking-[0.5em] text-[10px]">Security • Efficiency • Power</p>
        </div>
      </div>
    </motion.div>
  );
}

// --- REGISTER COMPONENT ---
function Register({ 
  onSwitch
}: { 
  onSwitch: () => void; 
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const superAdmins = ['1stmb.mj@gmail.com'];
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Assign admin role if email matches a super admin
      const assignedRole = superAdmins.includes(email) ? 'admin' : role;

      // Create user profile in Firestore
      const userData = {
        fullName,
        mobileNumber: mobile,
        email,
        role: assignedRole,
        isVerified: assignedRole === 'admin' && superAdmins.includes(email),
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      
      // onAuthStateChanged will handle the rest
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle profile creation if needed
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="min-h-screen flex relative z-10"
    >
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-transparent overflow-y-auto relative z-10">
        <div className="w-full max-w-md space-y-6 py-6 glass-card p-8 md:p-12 rounded-3xl shadow-xl border border-white/10 transition-all duration-300">
          <div className="text-center">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">CREATE ACCOUNT</h2>
            <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-1">Join CIBI Management System</p>
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border-2 border-dashed border-white/20 shadow-inner group hover:border-emerald-400 transition-all">
              <Camera className="text-emerald-400 group-hover:text-emerald-300" />
            </div>
            <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Identity Badge</span>
          </div>

          <form className="space-y-3" onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Full Name"
              className="w-full px-4 py-3 glass-input text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-bold placeholder-slate-400"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email Address"
              className="w-full px-4 py-3 glass-input text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-bold placeholder-slate-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Mobile"
                className="flex-1 px-4 py-3 glass-input text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-bold placeholder-slate-400"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
              <select 
                className="px-4 py-3 glass-input rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-black text-emerald-400 text-xs bg-slate-900"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <option value="user">USER</option>
                <option value="admin">ADMIN</option>
              </select>
            </div>
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 glass-input text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-bold placeholder-slate-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirm"
              className="w-full px-4 py-3 glass-input text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-bold placeholder-slate-400"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {error && <p className="text-red-400 text-xs text-center font-bold">{error}</p>}
            <button
               type="submit"
               disabled={loading}
               className="w-full py-4 bg-linear-to-r from-emerald-600 to-emerald-800 text-white font-black rounded-xl shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 uppercase tracking-widest text-xs"
            >
              {loading ? 'Processing...' : 'Verify & Register'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="bg-transparent px-4 text-slate-300 font-bold">Fast Lane</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 bg-white/5 border border-white/10 text-white font-black rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 shadow-md text-xs tracking-widest"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            GOOGLE PASSPORT
          </button>
          
          <div className="text-center">
            <button 
              onClick={onSwitch}
              className="text-slate-300 text-[10px] uppercase tracking-widest hover:text-emerald-400 font-bold transition-colors"
            >
              Registered? <span className="font-black text-emerald-400 underline decoration-dashed">Access Key</span>
            </button>
          </div>
        </div>
      </div>
      <div className="hidden lg:flex flex-1 glass-sidebar items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')]"></div>
        <div className="text-center space-y-4 relative z-10">
          <div className="w-20 h-20 bg-white/10 rounded-3xl backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <ShieldCheck size={40} className="text-emerald-400" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">CIBI Management System</h1>
          <p className="text-emerald-400 font-bold uppercase tracking-[0.5em] text-[10px]">Cloud Repository • Secure Diagnostics</p>
        </div>
      </div>
    </motion.div>
  );
}

// --- ADMIN KEY VERIFICATION SCREEN ---
function AdminKeyVerification({ 
  user, 
  setUser, 
  onSuccess,
  onLogout
}: { 
  user: UserProfile; 
  setUser: (u: UserProfile) => void;
  onSuccess: () => void;
  onLogout: () => void;
}) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Find key in admin_keys collection
      const keysRef = collection(db, 'admin_keys');
      const q = query(keysRef, where('key', '==', key.toUpperCase()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error('This verification key does not exist.');
      }

      const keyDoc = snapshot.docs[0];
      const keyData = keyDoc.data();

      if (keyData.used) {
        throw new Error('This key has already been used by another account.');
      }

      // Mark key as used
      await updateDoc(doc(db, 'admin_keys', keyDoc.id), {
        used: true,
        usedBy: user.email,
        usedAt: new Date().toISOString()
      });

      // Update user profile
      const updatedUser = { ...user, isVerified: true };
      await updateDoc(doc(db, 'users', user.id), { isVerified: true });
      
      setUser(updatedUser);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-transparent relative z-10">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md glass-card rounded-[2.5rem] shadow-2xl p-10 space-y-8 border border-white/10 relative z-10"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-white/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Identity Check</h2>
          <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Enter Verification Key to Access CIBI System</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Authorization Key</label>
            <input 
              type="text"
              placeholder="E.G. XJ3K-9PR2"
              className="w-full p-4 glass-input rounded-2xl text-center text-xl font-mono font-black text-emerald-400 uppercase tracking-[0.3em] focus:ring-4 focus:ring-emerald-500/20 focus:outline-none transition-all shadow-inner"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-950/40 text-red-400 rounded-xl text-center text-[10px] font-black uppercase tracking-widest border border-red-500/20"
            >
              {error}
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-linear-to-r from-emerald-600 to-emerald-800 text-white font-black rounded-2xl shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 hover:-translate-y-0.5 transition-all uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? 'Verifying...' : (
              <>
                <CheckCircle size={18} />
                Validate Key
              </>
            )}
          </button>
        </form>

        <div className="pt-6 border-t border-white/10 text-center">
          <p className="text-[10px] text-slate-300 font-bold uppercase mb-4">Logged in as: <span className="text-emerald-400 font-extrabold">{user.email}</span></p>
          <button 
            onClick={onLogout}
            className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-red-400 transition-colors"
          >
            Use different account
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// --- DASHBOARD COMPONENT ---
function Dashboard({ 
  user, 
  setUser,
  activeTab, 
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
  handleLogout,
  viewportMode,
  setViewportMode
}: { 
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  handleLogout: () => void;
  viewportMode: 'desktop' | 'tablet' | 'mobile';
  setViewportMode: (mode: 'desktop' | 'tablet' | 'mobile') => void;
}) {
  const isAdmin = user.role === 'admin';
  const isCoordinator = user.role === 'coordinator';
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [paddingRequestsActive, setPendingRequestsActive] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['HR']);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = viewportMode === 'mobile' || windowWidth < 1024;

  const bottomTabs = useMemo(() => {
    if (isAdmin || isCoordinator) {
      return [
        { id: 'DASHBOARD', label: 'Home', icon: LayoutDashboard },
        { id: 'ATTENDANCE CALENDAR', label: 'Calendar', icon: CalendarDays },
        { id: 'ACCOUNT STATUS', label: 'Accounts', icon: ClipboardList },
        { id: 'CRECOM APPROVAL', label: 'Approvals', icon: CheckCircle2 },
        { id: 'PROFILE', label: 'Profile', icon: User }
      ];
    } else {
      return [
        { id: 'DASHBOARD', label: 'Home', icon: LayoutDashboard },
        { id: 'ATTENDANCE', label: 'Punch-In', icon: Fingerprint },
        { id: 'ACCOUNT STATUS', label: 'Accounts', icon: ClipboardList },
        { id: 'LEAVES', label: 'Leaves', icon: CalendarDays },
        { id: 'PROFILE', label: 'Profile', icon: User }
      ];
    }
  }, [isAdmin, isCoordinator]);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
    else setSidebarOpen(true);
  }, [isMobile, setSidebarOpen]);

  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AppNotification[];
      setNotifications(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50));
    }, (err) => {
      console.error('Firestore notification listener error:', err);
    });
    return () => unsubscribe();
  }, [user.id]);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'coordinator')) {
       setPendingRequestsActive(false);
       return;
    }

    const qLeaves = query(collection(db, 'leaves'), where('status', '==', 'Pending'));
    const qOT = query(collection(db, 'overtime'), where('status', '==', 'Pending'));
    const qOB = query(collection(db, 'ob_requests'), where('status', '==', 'Pending'));

    const counts = { leaves: 0, ot: 0, ob: 0 };
    const updateStatus = () => {
      setPendingRequestsActive(counts.leaves > 0 || counts.ot > 0 || counts.ob > 0);
    };

    const unsubLeaves = onSnapshot(qLeaves, (snap) => {
      counts.leaves = snap.size;
      updateStatus();
    });
    const unsubOT = onSnapshot(qOT, (snap) => {
      counts.ot = snap.size;
      updateStatus();
    });
    const unsubOB = onSnapshot(qOB, (snap) => {
      counts.ob = snap.size;
      updateStatus();
    });

    return () => {
      unsubLeaves();
      unsubOT();
      unsubOB();
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notifId), { read: true });
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      await updateDoc(doc(db, 'notifications', n.id), { read: true });
    }
    setShowNotifications(false);
  };

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
    );
  };

  const menuItems = isAdmin ? [
    { id: 'DASHBOARD', icon: LayoutDashboard },
    { 
      id: 'HR', 
      icon: Users,
      children: [
        { id: 'ATTENDANCE', icon: Fingerprint },
        { id: 'ATTENDANCE CALENDAR', icon: CalendarRange },
        { id: 'REVIEW REQUESTS', icon: ClipboardCheck },
        { id: 'HR REPORTS', icon: FileBarChart },
        { id: 'EVALUATION', icon: Star },
      ]
    },
    { id: 'REPORTS', icon: FileText },
    { id: 'USERS', icon: Users },
    { id: 'ASSIGN ACCOUNT', icon: UserPlus },
    { id: 'ACCOUNT STATUS', icon: ClipboardList },
    { id: 'CRECOM APPROVAL', icon: CheckCircle2 },
    { id: 'FOR VALIDATION & SURVEY', icon: CheckCircle2 },
    { id: 'VALIDATION & SURVEY', icon: Star },
    { id: 'DATA STORAGE', icon: Database },
    { id: 'SCORING CONFIG', icon: Settings2 },
    { id: 'ADMIN KEYS', icon: Key },
    { id: 'PROFILE', icon: User },
  ] : isCoordinator ? [
    { id: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'ATTENDANCE', icon: Fingerprint },
    { id: 'ATTENDANCE CALENDAR', icon: CalendarRange },
    { id: 'LEAVES', icon: CalendarDays },
    { id: 'OVERTIME', icon: Timer },
    { id: 'OB FILLING', icon: Briefcase },
    { id: 'REVIEW REQUESTS', icon: ClipboardCheck },
    { id: 'HR REPORTS', icon: FileBarChart },
    { id: 'ASSIGN ACCOUNT', icon: UserPlus },
    { id: 'ACCOUNT STATUS', icon: ClipboardList },
    { id: 'CRECOM APPROVAL', icon: CheckCircle2 },
    { id: 'FOR VALIDATION & SURVEY', icon: Star },
    { id: 'VALIDATION & SURVEY', icon: BarChart2 },
    { id: 'EVALUATION', icon: Star },
    { id: 'PROFILE', icon: User },
  ] : [
    { id: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'ATTENDANCE', icon: Fingerprint },
    { id: 'ATTENDANCE CALENDAR', icon: CalendarRange },
    { id: 'LEAVES', icon: CalendarDays },
    { id: 'OVERTIME', icon: Timer },
    { id: 'OB FILLING', icon: Briefcase },
    { id: 'ACCOUNT STATUS', icon: ClipboardList },
    { id: 'FOR VALIDATION & SURVEY', icon: CheckCircle2 },
    { id: 'EVALUATION', icon: Star },
    { id: 'REPORTS', icon: FileText },
    { id: 'PROFILE', icon: User },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 relative">
      {/* Liquid Glass Backdrop Blob Animations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] min-w-[500px] min-h-[500px] rounded-full liquid-glow-1 animate-liquid-one" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[60vw] h-[60vw] min-w-[550px] min-h-[550px] rounded-full liquid-glow-2 animate-liquid-two" />
        <div className="absolute top-[30%] right-[15%] w-[45vw] h-[45vw] min-w-[400px] min-h-[400px] rounded-full liquid-glow-3 animate-liquid-three" />
        <div className="absolute bottom-[20%] left-[10%] w-[50vw] h-[50vw] min-w-[450px] min-h-[450px] rounded-full liquid-glow-4 animate-liquid-one" />
      </div>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: sidebarOpen ? 280 : (isMobile ? 0 : 80),
          x: (isMobile && !sidebarOpen) ? -280 : 0
        }}
        className={cn(
          "glass-sidebar text-white flex-shrink-0 overflow-hidden relative z-40 transition-all duration-300 ease-in-out shadow-xl",
          isMobile ? "fixed h-full" : "relative"
        )}
      >
        <div className={cn(
          "flex flex-col h-full transition-all duration-300",
          sidebarOpen ? "w-[280px]" : "w-[80px]"
        )}>
          {/* Header/Profile Section */}
          <div className={cn(
            "p-6 flex items-center transition-all duration-300",
            sidebarOpen ? "space-x-4 mb-8" : "justify-center mb-10"
          )}>
            <div className={cn(
              "bg-white/20 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/40 transition-all",
              sidebarOpen ? "w-12 h-12" : "w-10 h-10"
            )}>
              {user.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="text-white" size={sidebarOpen ? 24 : 20} />
              )}
            </div>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="overflow-hidden"
              >
                <h3 className="font-black text-sm uppercase truncate w-32 leading-tight">{user.fullName}</h3>
                <p className="text-[10px] text-white/60 uppercase tracking-widest font-bold">{user.role}</p>
              </motion.div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar">
            {menuItems.map((item: any) => (
              <React.Fragment key={item.id}>
                {item.children ? (
                  <div className="space-y-1">
                    <button
                      onClick={() => toggleMenu(item.id)}
                      className={cn(
                        "w-full flex items-center transition-all duration-200 rounded-xl group",
                        sidebarOpen ? "px-4 py-3 space-x-3" : "py-4 justify-center",
                        expandedMenus.includes(item.id) ? "text-white" : "text-white/70 hover:text-white"
                      )}
                    >
                      <item.icon size={20} />
                      {sidebarOpen && (
                        <>
                          <span className="flex-1 text-[11px] font-black uppercase tracking-widest text-left">{item.id}</span>
                          <ChevronRight 
                            size={14} 
                            className={cn(
                              "transition-transform",
                              expandedMenus.includes(item.id) && "rotate-90"
                            )} 
                          />
                        </>
                      )}
                      {item.id === 'HR' && paddingRequestsActive && (!sidebarOpen || !expandedMenus.includes('HR')) && (
                        <div className={cn(
                          "bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]",
                          sidebarOpen ? "w-2 h-2 ml-2" : "absolute top-3 right-3 w-2 h-2 border-2 border-emerald-900"
                        )} />
                      )}
                    </button>
                    {sidebarOpen && expandedMenus.includes(item.id) && (
                      <div className="ml-4 space-y-1 border-l border-white/10 pl-2">
                        {item.children.map((child: any) => (
                          <button
                            key={child.id}
                            onClick={() => {
                              setActiveTab(child.id);
                              if (isMobile) setSidebarOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center px-4 py-2 space-x-3 transition-all duration-200 rounded-lg group",
                              activeTab === child.id 
                                ? "bg-white text-emerald-800" 
                                : "text-white/60 hover:text-white hover:bg-white/5"
                            )}
                          >
                            <child.icon size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-widest truncate">{child.id}</span>
                            {child.id === 'REVIEW REQUESTS' && paddingRequestsActive && (
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse ml-auto shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (isMobile) setSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center transition-all duration-200 rounded-xl group",
                      activeTab === item.id 
                        ? "bg-white/85 text-emerald-950 shadow-md scale-105 border border-white/25 backdrop-blur-md" 
                        : "hover:bg-white/10 text-white/70 hover:text-white",
                      sidebarOpen ? "px-4 py-3 space-x-3" : "py-4 justify-center"
                    )}
                    title={!sidebarOpen ? item.id : undefined}
                  >
                    <item.icon size={20} className={cn(
                      "transition-transform",
                      activeTab === item.id ? "scale-110" : "group-hover:scale-110"
                    )} />
                    {item.id === 'REVIEW REQUESTS' && paddingRequestsActive && (
                      <div className={cn(
                        "bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]",
                        sidebarOpen ? "w-2 h-2" : "absolute top-3 right-3 w-2 h-2 border-2 border-emerald-900"
                      )} />
                    )}
                    {sidebarOpen && (
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={cn("text-[11px] font-black uppercase tracking-widest truncate", item.id === 'REVIEW REQUESTS' && paddingRequestsActive ? "flex-1" : "")}
                      >
                        {item.id}
                      </motion.span>
                    )}
                  </button>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Footer/Logout */}
          <div className="p-4 border-t border-white/10">
            <button 
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center transition-all duration-200 rounded-xl hover:bg-white/10 text-white/70 hover:text-white group",
                sidebarOpen ? "px-4 py-3 space-x-3" : "py-4 justify-center"
              )}
              title={!sidebarOpen ? "Sign Out" : undefined}
            >
              <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
              {sidebarOpen && (
                <span className="text-[11px] font-black uppercase tracking-widest">Sign Out</span>
              )}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10 bg-transparent">
        <header className="h-16 glass-header flex items-center justify-between px-6 z-50 transition-all">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-emerald-600">
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h2 className="text-xs font-black text-emerald-800 uppercase tracking-[0.2em]">{activeTab}</h2>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center bg-gray-50 border border-gray-100 rounded-full px-4 py-1.5 w-64">
              <Search size={14} className="text-gray-400 mr-2" />
              <input 
                type="text" 
                placeholder="Global search..."
                className="bg-transparent border-none text-[10px] font-bold uppercase tracking-widest focus:outline-none w-full"
              />
            </div>
            
            <div className="flex items-center space-x-4 relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative text-gray-400 hover:text-emerald-700 transition-colors"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setShowNotifications(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-12 w-80 glass-card rounded-2xl shadow-2xl border border-white/10 z-40 overflow-hidden"
                    >
                      <div className="p-4 bg-linear-to-r from-slate-900 to-emerald-950 text-white flex justify-between items-center border-b border-white/10 shadow-lg">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">System Alerts</h3>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-[8px] font-black uppercase tracking-widest text-white hover:text-emerald-300 hover:underline transition-colors cursor-pointer"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto divide-y divide-white/10">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 bg-slate-950/50">
                            <Bell size={24} className="mx-auto mb-2 opacity-20" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div 
                              key={n.id} 
                              onClick={() => markAsRead(n.id)}
                              className={cn(
                                "p-4 cursor-pointer hover:bg-white/5 transition-colors text-left",
                                !n.read ? "bg-emerald-950/30 border-l-2 border-emerald-500" : "bg-slate-950/20"
                              )}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className={cn(
                                  "text-[10px] font-black uppercase tracking-tight",
                                  !n.read ? "text-emerald-300" : "text-slate-300"
                                )}>{n.title}</span>
                                <span className="text-[8px] font-mono text-slate-400">{format(new Date(n.createdAt), 'h:mm a')}</span>
                              </div>
                              <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">{n.message}</p>
                              {!n.read && <div className="mt-2 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />}
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              <div className="text-[10px] text-gray-400 font-medium">
                {format(new Date(), 'M/d/yyyy')}
              </div>

              <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100 ml-2">
                <button 
                  onClick={() => setViewportMode('desktop')}
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    viewportMode === 'desktop' ? "bg-white text-emerald-700 shadow-sm" : "text-gray-400 hover:bg-gray-100"
                  )}
                  title="Desktop View"
                >
                  <Monitor size={14} />
                </button>
                <button 
                  onClick={() => setViewportMode('tablet')}
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    viewportMode === 'tablet' ? "bg-white text-emerald-700 shadow-sm" : "text-gray-400 hover:bg-gray-100"
                  )}
                  title="Tablet View"
                >
                  <Tablet size={14} />
                </button>
                <button 
                  onClick={() => setViewportMode('mobile')}
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    viewportMode === 'mobile' ? "bg-white text-emerald-700 shadow-sm" : "text-gray-400 hover:bg-gray-100"
                  )}
                  title="Mobile View"
                >
                  <Smartphone size={14} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden overflow-y-auto w-full relative z-10">
          <div className={cn(
            "p-4 md:p-8 min-h-full",
            isMobile ? "pb-24 bg-white/65 backdrop-blur-md" : "bg-transparent"
          )}>
            <AnimatePresence mode="wait">
              {activeTab === 'DASHBOARD' && ((isAdmin || isCoordinator) ? <DashboardOverview user={user} /> : <CIDashboard user={user} />)}
              {activeTab === 'ATTENDANCE' && <AttendanceModule user={user} />}
              {activeTab === 'ATTENDANCE CALENDAR' && <AttendanceCalendar user={user} />}
              {activeTab === 'LEAVES' && <LeaveModule user={user} />}
              {activeTab === 'OVERTIME' && <OvertimeModule user={user} />}
              {activeTab === 'OB FILLING' && !isAdmin && <OBFillingModule user={user} />}
              {(activeTab === 'REVIEW REQUESTS' && (isAdmin || isCoordinator)) && <ReviewRequests user={user} />}
              {(activeTab === 'HR REPORTS' && (isAdmin || isCoordinator)) && <HRReportsModule user={user} />}
              {activeTab === 'EVALUATION' && <EvaluationModule user={user} />}
              {activeTab === 'USERS' && <UserManagement user={user} />}
              {(activeTab === 'ASSIGN ACCOUNT' && (isAdmin || isCoordinator)) && <AssignAccount user={user} />}
              {activeTab === 'ACCOUNT STATUS' && <AccountStatus user={user} />}
              {(activeTab === 'CRECOM APPROVAL' && (isAdmin || isCoordinator)) && <CrecomApproval user={user} />}
              {(activeTab === 'VALIDATION & SURVEY' && (isAdmin || isCoordinator)) && <ValidationSurveyResults user={user} />}
              {activeTab === 'REPORTS' && <ReportsView user={user} />}
              {activeTab === 'DATA STORAGE' && <DataStorage user={user} />}
              {activeTab === 'SCORING CONFIG' && <AdminScoringSettings />}
              {activeTab === 'ADMIN KEYS' && <AdminKeys user={user} />}
              {activeTab === 'FOR VALIDATION & SURVEY' && <ValidationSurvey user={user} />}
              {activeTab === 'PROFILE' && <ProfileSettings user={user} setUser={setUser} />}
            </AnimatePresence>
          </div>
        </div>

        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100/80 px-4 py-2.5 flex items-center justify-around z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] flex-shrink-0 animate-fade-in">
            {bottomTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSidebarOpen(false); // Auto-close sidebar panel on active selection
                  }}
                  className="flex flex-col items-center justify-center gap-1.5 py-1 px-3 relative select-none group focus:outline-none cursor-pointer"
                >
                  <div className={cn(
                    "p-2.5 rounded-2xl transition-all duration-300 relative overflow-hidden",
                    isActive 
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-115" 
                      : "text-gray-400 hover:text-emerald-700 hover:bg-emerald-50/50"
                  )}>
                    <TabIcon size={16} className="transition-transform duration-200 group-hover:scale-105" />
                  </div>
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-widest transition-all duration-200 select-none",
                    isActive ? "text-emerald-800 scale-100" : "text-gray-400 scale-95"
                  )}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

// --- SHARED UTILS ---
// Constants & Utilities

interface LeaderboardEntry {
  id: string;
  fullName: string;
  photoURL?: string;
  points: number;
  approvedCount: number;
  deniedCount: number;
  mclCount: number;
  madeCount: number;
}

function LeaderboardSection({ assignments, currentMonth, currentYear }: { assignments: Assignment[], currentMonth: number, currentYear: number }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const currentMonthAssignments = assignments.filter(a => {
        const date = new Date(a.createdAt);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const leaderData = usersList
        .filter((u: any) => u.role === 'user' || u.role === 'coordinator')
        .map((u: any) => {
          const personalMonthly = currentMonthAssignments.filter(a => a.ciOfficerId === u.id);
          const approved = personalMonthly.filter(a => a.status === 'Approved').length;
          const denied = personalMonthly.filter(a => a.status === 'Denied').length;
          const mcl = personalMonthly.filter(a => a.isMCLReferral).length;
          const made = personalMonthly.length;
          
          const points = (made * 1) + (mcl * 2);
          
          return {
            ...u,
            points,
            approvedCount: approved,
            deniedCount: denied,
            mclCount: mcl,
            madeCount: made
          };
        })
        .sort((a: any, b: any) => b.points - a.points)
        .slice(0, 10);
      
      setLeaderboard(leaderData);
    };

    fetchLeaderboard();
  }, [assignments, currentMonth, currentYear]);

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs font-black text-emerald-800 uppercase tracking-[0.2em]">CI Officer Leaderboard (Monthly)</h3>
        <div className="flex gap-2">
           <span className="text-[9px] font-black text-gray-400 uppercase bg-gray-50 px-2 py-1 rounded">Made: 1pt</span>
           <span className="text-[9px] font-black text-emerald-700 uppercase bg-emerald-50 px-2 py-1 rounded">MCL: 2pt</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
        {leaderboard.length > 0 ? leaderboard.map((u, i) => (
          <div key={u.id} className="flex items-center justify-between group p-3 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                  {u.photoURL ? (
                    <img src={u.photoURL} alt={u.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="text-gray-300" size={24} />
                  )}
                </div>
                <div className={cn(
                  "absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black border-2 border-white shadow-sm",
                  i === 0 ? "bg-yellow-400 text-white" : 
                  i === 1 ? "bg-gray-400 text-white" : 
                  i === 2 ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-400"
                )}>
                  {i + 1}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{u.fullName}</p>
                <div className="flex items-center gap-3">
                   <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded" title="Total Assignments Made">MADE: {u.madeCount}</span>
                   <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded" title="Approved">APP: {u.approvedCount}</span>
                   <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded" title="Denied">DEN: {u.deniedCount}</span>
                   <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded" title="MCL Referrals">MCL: {u.mclCount}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
               <div className="text-lg font-black text-emerald-700 leading-none">{u.points}</div>
               <div className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-1">Points</div>
            </div>
          </div>
        )) : (
          <div className="col-span-2 py-12 text-center text-gray-300">
            <TrendingUp size={32} className="mx-auto mb-2 opacity-20" />
            <p className="text-[10px] font-bold uppercase tracking-widest">No monthly ranking data</p>
          </div>
        )}
      </div>
    </div>
  );
}

const steps = [
  'Assigned',
  'Start to Perform Assignment',
  'Reviewing',
  'Field CIBI',
  'Cashflowing',
  'Report Submitted',
  'Pre-approved',
  'Approved',
  'Completed'
];

const createNotification = async (userId: string, title: string, message: string, type: string, assignmentId: string) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      type,
      assignmentId,
      read: false,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};

const notifyAdmins = async (title: string, message: string, type: string, assignmentId: string = '') => {
  try {
    const adminSnap = await getDocs(query(collection(db, 'users'), where('role', 'in', ['admin', 'coordinator'])));
    const notifications = adminSnap.docs.map(doc => createNotification(doc.id, title, message, type, assignmentId));
    await Promise.all(notifications);
  } catch (err) {
    console.error('Error notifying admins:', err);
  }
};

const calculateTAT = (timeline: TimelineStep[]) => {
  if (timeline.length < 2) return '0h 0m';
  const start = new Date(timeline[0].timestamp);
  const end = new Date(timeline[timeline.length - 1].timestamp);
  const isCompleted = timeline.some(t => t.step === 'Completed');
  const now = new Date();
  
  const diff = isCompleted 
    ? end.getTime() - start.getTime() 
    : now.getTime() - start.getTime();
    
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m${isCompleted ? '' : ' (ONGOING)'}`;
};

const calcAmort = (rec: { loanAmount: number; term: string | number; rate: number }) => {
  const months = Number(rec.term) || 1;
  const rate = (Number(rec.rate) || 0) / 100;
  const loan = Number(rec.loanAmount) || 0;

  const totalInterest = loan * rate * months;
  const totalPayable = loan + totalInterest;

  const semiCount = months * 2;
  const weeklyCount = months < 5 ? (months * 4 + 1) : (months * 4 + 2);
  const dailyCount = months * 26; // Standard 26 business days

  return {
    interest: totalInterest,
    monthlyAmort: totalPayable / months,
    semiMonthlyAmort: totalPayable / semiCount,
    weeklyAmort: totalPayable / weeklyCount,
    dailyAmort: totalPayable / dailyCount
  };
};

// --- SUB-COMPONENTS ---

function DashboardOverview({ user }: { user: UserProfile }) {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    approved: 0,
    denied: 0,
    monthlyAssigned: 0,
    avgSatisfaction: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [satisfactionData, setSatisfactionData] = useState<any[]>([]);
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [ciOfficers, setCiOfficers] = useState<UserProfile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    const qUsers = query(collection(db, 'users'), where('role', 'in', ['user', 'coordinator']));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      setCiOfficers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserProfile[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    const q = query(collection(db, 'assignments'), orderBy('createdAt', 'desc'));
    const unsubscribeReadings = onSnapshot(q, async (snapshot) => {
      const assignmentsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Assignment[];
      
      const surveys = assignmentsList.filter(a => a.survey).map(a => a.survey!);
      const avgSat = surveys.length > 0 
        ? surveys.reduce((acc, curr) => acc + curr.satisfaction, 0) / surveys.length 
        : 0;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthly = assignmentsList.filter(a => {
        const date = new Date(a.createdAt);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });

      setStats({
        total: assignmentsList.length,
        pending: assignmentsList.filter(a => !['Completed', 'Approved', 'Denied'].includes(a.status)).length,
        completed: assignmentsList.filter(a => a.status === 'Completed').length,
        approved: assignmentsList.filter(a => a.status === 'Approved').length,
        denied: assignmentsList.filter(a => a.status === 'Denied').length,
        monthlyAssigned: monthly.length,
        avgSatisfaction: Number(avgSat.toFixed(1))
      });

      const satDist = [1, 2, 3, 4, 5].map(rating => ({
        rating: rating,
        count: surveys.filter(s => s.satisfaction === rating).length
      }));
      setSatisfactionData(satDist);

      // 12-month Multi-line Points History Calculation
      const history: any[] = [];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const officersInAssignments = Array.from(new Set(assignmentsList.map(a => a.ciOfficerId))).filter(id => id);

      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const m = d.getMonth();
        const y = d.getFullYear();
        
        const monthAssignments = assignmentsList.filter(a => {
          const ad = new Date(a.createdAt);
          return ad.getMonth() === m && ad.getFullYear() === y;
        });
        
        const entry: any = {
          name: monthNames[m],
          fullDate: format(d, 'MMMM yyyy'),
        };

        officersInAssignments.forEach(officerId => {
          const pts = monthAssignments
            .filter(a => a.ciOfficerId === officerId)
            .reduce((acc, a) => acc + 1 + (a.isMCLReferral ? 2 : 0), 0);
          entry[officerId] = pts;
        });
        
        history.push(entry);
      }
      setPointsHistory(history);

      const statusData = [
        { name: 'Pending', value: assignmentsList.filter(a => !['Completed', 'Approved', 'Denied'].includes(a.status)).length },
        { name: 'Completed', value: assignmentsList.filter(a => a.status === 'Completed').length },
        { name: 'Approved', value: assignmentsList.filter(a => a.status === 'Approved').length },
        { name: 'Denied', value: assignmentsList.filter(a => a.status === 'Denied').length }
      ];
      setChartData(statusData);

      const activities = assignmentsList.flatMap(a => 
        a.timeline.map(t => ({
          ...t,
          borrowerName: a.borrowerName,
          id: a.id
        }))
      ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

      setRecentActivity(activities);
      setAssignments(assignmentsList);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'assignments');
    });

    return () => {
      unsubscribeReadings();
      unsubUsers();
    };
  }, []);

  const exportToCSV = () => {
    api.get('/api/assignments').then((data: Assignment[]) => {
      const headers = ['ID', 'Borrower', 'Mobile', 'Type', 'Status', 'Requested', 'Approved', 'Created At'];
      const rows = data.map(a => [
        a.id,
        a.borrowerName,
        a.mobileNumber,
        a.accountType,
        a.status,
        a.requestedAmount,
        a.approvedAmount || 0,
        a.createdAt
      ]);
      
      const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `assignments_${new Date().toISOString()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const COLORS_LIST = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
  const getOfficerName = (id: string) => ciOfficers.find(o => o.id === id)?.fullName || 'Unknown Officer';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center overflow-hidden border-2 border-emerald-100">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Admin" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="text-emerald-700" size={24} />
            )}
          </div>
          <div>
            <h2 className="text-xl font-black text-emerald-900 uppercase tracking-widest">Dashboard Overview</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">System Administrator Panel</p>
          </div>
        </div>
        <button 
          onClick={exportToCSV}
          className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
        <StatCard label="Total Volume" value={stats.total} icon={<ClipboardList className="text-blue-500" />} />
        <StatCard label="Monthly Assigned" value={stats.monthlyAssigned} icon={<Calendar className="text-indigo-500" />} />
        <StatCard label="In Progress" value={stats.pending} icon={<Clock className="text-amber-500" />} />
        <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2 className="text-green-500" />} />
        <StatCard label="Approved" value={stats.approved} icon={<Check className="text-emerald-500" />} />
        <StatCard label="Denied" value={stats.denied} icon={<X className="text-red-500" />} />
        <StatCard label="Customer Satisfaction" value={stats.avgSatisfaction} icon={<Star className="text-amber-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1">
          <h3 className="text-xs font-black text-emerald-800 uppercase tracking-[0.2em] mb-6">Satisfaction Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={satisfactionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="rating" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold' }} 
                  label={{ value: 'Stars', position: 'insideBottom', offset: -5, fontSize: 10, fontWeight: 'bold' }}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-between items-center px-2">
             <div className="flex items-center gap-1">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-black text-emerald-800">{stats.avgSatisfaction} / 5.0</span>
             </div>
             <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Aggregate Rating</p>
          </div>
        </div>
        
        <LeaderboardSection 
          assignments={assignments} 
          currentMonth={new Date().getMonth()} 
          currentYear={new Date().getFullYear()} 
        />

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 lg:col-span-3">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xs font-black text-emerald-800 uppercase tracking-[0.2em]">12-Month Performance Trend</h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Aggregate Leaderboard Points History</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">
              <TrendingUp size={12} />
              <span className="text-[10px] font-black uppercase tracking-widest">Growth Analytics</span>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pointsHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    fontSize: '10px', 
                    fontWeight: 'bold', 
                    textTransform: 'uppercase', 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                  itemStyle={{ fontSize: '10px', fontWeight: 'black' }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', paddingTop: '20px' }}
                  iconType="circle"
                />
                {/* Dynamically render lines for each officer ID present in the pointsHistory keys */}
                {Object.keys(pointsHistory[0] || {})
                  .filter(key => key !== 'name' && key !== 'fullDate')
                  .map((officerId, idx) => (
                    <Line 
                      key={officerId}
                      type="monotone" 
                      dataKey={officerId}
                      name={getOfficerName(officerId)}
                      stroke={COLORS_LIST[idx % COLORS_LIST.length]} 
                      strokeWidth={3} 
                      dot={{ r: 3, fill: COLORS_LIST[idx % COLORS_LIST.length], strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                      animationDuration={1500}
                    />
                  ))
                }
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1">
          <h3 className="text-xs font-black text-emerald-800 uppercase tracking-[0.2em] mb-6">Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_LIST[index % COLORS_LIST.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {chartData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS_LIST[index % COLORS_LIST.length] }} />
                <span className="text-[8px] font-bold uppercase text-gray-400">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xs font-black text-emerald-800 uppercase tracking-[0.2em] mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      activity.step === 'Approved' ? "bg-emerald-500" :
                      activity.step === 'Denied' ? "bg-red-500" :
                      activity.step === 'Completed' ? "bg-blue-500" : "bg-gray-300"
                    )} />
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        <span className="text-emerald-700">{activity.borrowerName}</span>
                        <span className="text-gray-400 font-normal ml-2">status changed to</span>
                        <span className="ml-2 uppercase tracking-widest text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-800 font-black rounded">{activity.step}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 font-bold uppercase">
                    {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 font-bold italic">No recent system activity.</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- SCORING CONFIGURATIONS ---
const DEFAULT_SME_SCORING_SHEET = {
  CHARACTER: {
    max: 15.0,
    items: [
      { id: 'neighbor1', label: 'Neighbor 1', options: [{ l: 'Good', p: 3 }, { l: 'Poor', p: 0 }] },
      { id: 'neighbor2', label: 'Neighbor 2', options: [{ l: 'Good', p: 3 }, { l: 'Poor', p: 0 }] },
      { id: 'barangayVerification', label: 'Barangay Verification', options: [{ l: 'No Bad Records', p: 3 }, { l: 'With Bad Records', p: 0 }] },
      { id: 'loanHistory', label: 'Loan History (Other Inst.)', options: [{ l: 'Yes', p: 1 }, { l: 'No', p: 0 }] },
      { id: 'goodCreditBackground', label: 'Good Credit Background', options: [{ l: 'Yes', p: 2 }, { l: 'No', p: 1 }, { l: 'None', p: 0 }] },
      { id: 'cooperationOfApplicant', label: 'Cooperation of Applicant', options: [{ l: 'Very Cooperative', p: 3 }, { l: 'Cooperative', p: 2 }, { l: 'Poor', p: 0 }] },
    ]
  },
  CAPITAL: {
    max: 20.0,
    items: [
      { id: 'totalAssetLiabilities', label: 'Total Asset > Liabilities', options: [{ l: 'Yes', p: 10 }, { l: 'No', p: 0 }] },
      { id: 'collateral', label: 'Collateral', options: [{ l: 'Yes', p: 10 }, { l: 'No', p: 0 }] },
    ]
  },
  STABILITY: {
    max: 15.0,
    items: [
      { id: 'houseOwnership', label: 'House Ownership', options: [{ l: 'Owned', p: 4 }, { l: 'Mortgage', p: 3 }, { l: 'Rented', p: 2 }, { l: 'Residing w/ Relatives', p: 1 }] },
      { id: 'childrenSchooling', label: 'With Children are schooling?', options: [{ l: 'Yes', p: 2 }, { l: 'No', p: 1 }] },
      { id: 'residingDuration', label: 'How long residing in address?', options: [{ l: 'More Than 5yrs.', p: 5 }, { l: '4yrs - 3yrs.', p: 3 }, { l: 'Less than 1yr.', p: 1 }] },
      { id: 'houseMaterials', label: 'House are made of?', options: [{ l: 'Concrete', p: 4 }, { l: 'Semi-Concrete', p: 3 }, { l: 'Light Materials', p: 1 }] },
    ]
  },
  BUSINESS_STATUS: {
    max: 23.0,
    items: [
      { id: 'businessLocation', label: 'Business location', options: [{ l: 'Commercial', p: 4 }, { l: 'Residential', p: 3 }, { l: 'Public Market', p: 3 }] },
      { id: 'floodProne', label: 'Flood prone area?', options: [{ l: 'No', p: 1 }, { l: 'Yes', p: 0 }] },
      { id: 'footTraffic', label: 'Volume of foot traffic', options: [{ l: 'Good', p: 2 }, { l: 'Poor', p: 1 }] },
      { id: 'businessSpace', label: 'Business space', options: [{ l: 'Owned', p: 2 }, { l: 'Rent Free', p: 2 }, { l: 'Rented', p: 1 }] },
      { id: 'permitType', label: 'Type of Permit', options: [{ l: "Mayor's Permit", p: 3 }, { l: 'Barangay / DTI', p: 2 }] },
      { id: 'businessDuration', label: 'How long business running?', options: [{ l: 'More than 10 yrs.', p: 6 }, { l: '5 yrs. - 10 yrs.', p: 4 }, { l: '1 yr. - 5 yrs.', p: 3 }] },
      { id: 'inventoryVsSales', label: 'Business Inventory Vs. Sales', options: [{ l: 'Good', p: 2 }, { l: 'Minimal', p: 1 }, { l: 'Poor', p: 0 }] },
      { id: 'watchBusiness', label: 'Often watch business?', options: [{ l: 'Full Time', p: 3 }, { l: 'Limited', p: 2 }] },
    ]
  },
  FINANCIAL_MATURITY: {
    max: 12.0,
    items: [
      { id: 'loanVsCashflow', label: 'Requested Amount > Cashflow', options: [{ l: 'No', p: 3 }, { l: 'Yes', p: 1 }] },
      { id: 'otherIncome', label: 'Other source of Income?', options: [{ l: 'Yes', p: 2 }, { l: 'No', p: 0 }] },
      { id: 'businessKnowledge', label: 'Business knowledge?', options: [{ l: 'Yes', p: 2 }, { l: 'No', p: 1 }] },
      { id: 'bankAccount', label: 'Bank Account Type', options: [{ l: 'CA & SA', p: 2 }, { l: 'CA or SA', p: 1.5 }, { l: 'None', p: 0 }] },
      { id: 'cicCmapFindings', label: 'CIC & CMAP Findings', options: [{ l: 'None', p: 3 }, { l: 'Current Status', p: 1.5 }, { l: 'With Past Due', p: 0 }] },
    ]
  },
  PERSONAL_STATUS: {
    max: 15.0,
    items: [
      { id: 'medicalCondition', label: 'Medical Condition (Family)', options: [{ l: 'No', p: 2 }, { l: 'Yes', p: 0 }] },
      { id: 'civilStatus', label: 'Civil Status', options: [{ l: 'Married', p: 2 }, { l: 'Live-in', p: 1.5 }, { l: 'Single', p: 1 }] },
      { id: 'ageGroup', label: 'Age Group', options: [{ l: '20-65', p: 2 }, { l: '<20 or >65', p: 1 }] },
      { id: 'educationalAttainment', label: 'Educational Attainment', options: [{ l: 'College Graduate', p: 4 }, { l: 'College Undergrad', p: 3 }, { l: 'HS Graduate', p: 2 }, { l: 'HS Undergrad', p: 1.5 }, { l: 'Elem. Graduate', p: 1 }, { l: 'Elem. Undergrad', p: 0.5 }] },
      { id: 'loanType', label: 'Type of Loan Application', options: [{ l: 'Renewal', p: 5 }, { l: 'Additional', p: 3 }] },
    ]
  }
};

const DEFAULT_MCL_SCORING_SHEET = {
  CHARACTER: {
    max: 20.0,
    items: [
      { id: 'reputation', label: 'Reputation in community', options: [{ l: 'Excellent', p: 5 }, { l: 'Good', p: 4 }, { l: 'Average', p: 3 }, { l: 'Poor', p: 1 }] },
      { id: 'repaymentHistory', label: 'Loan repayment history', options: [{ l: 'Excellent', p: 5 }, { l: 'Good', p: 4 }, { l: 'Average', p: 3 }, { l: 'Poor', p: 1 }] },
      { id: 'creditBackground', label: 'Credit background', options: [{ l: 'Excellent', p: 5 }, { l: 'Good', p: 4 }, { l: 'Average', p: 3 }, { l: 'Poor', p: 1 }] },
      { id: 'cooperation', label: 'Cooperation & honesty', options: [{ l: 'Excellent', p: 5 }, { l: 'Good', p: 4 }, { l: 'Average', p: 3 }, { l: 'Poor', p: 1 }] },
    ]
  },
  INCOME_CAPACITY: {
    max: 25.0,
    items: [
      { id: 'stability', label: 'Primary income stability', options: [{ l: 'Very Stable', p: 8 }, { l: 'Stable', p: 6 }, { l: 'Moderate', p: 4 }, { l: 'Unstable', p: 2 }] },
      { id: 'incomeVsAmort', label: 'Income vs amortization', options: [{ l: 'Excellent', p: 10 }, { l: 'Good', p: 8 }, { l: 'Average', p: 6 }, { l: 'Tight', p: 3 }] },
      { id: 'otherIncome', label: 'Other income sources', options: [{ l: 'Multiple', p: 4 }, { l: 'Single', p: 3 }, { l: 'Minimal', p: 2 }, { l: 'None', p: 1 }] },
      { id: 'bankAccount', label: 'Bank account / discipline', options: [{ l: 'Disciplined', p: 3 }, { l: 'Average', p: 2 }, { l: 'Poor', p: 1 }, { l: 'None', p: 0 }] },
    ]
  },
  EMPLOYMENT_BUSINESS: {
    max: 20.0,
    items: [
      { id: 'typeOfWork', label: 'Type of work', options: [{ l: 'Professional', p: 6 }, { l: 'Skilled', p: 5 }, { l: 'Unskilled', p: 3 }, { l: 'Informal', p: 2 }] },
      { id: 'lengthOfService', label: 'Length of employment/business', options: [{ l: '>10 Years', p: 7 }, { l: '5-10 Years', p: 5 }, { l: '1-5 Years', p: 3 }, { l: '<1 Year', p: 1 }] },
      { id: 'consistency', label: 'Income consistency', options: [{ l: 'Consistent', p: 7 }, { l: 'Moderate', p: 5 }, { l: 'Fluctuating', p: 3 }, { l: 'Irregular', p: 1 }] },
    ]
  },
  RESIDENCE: {
    max: 15.0,
    items: [
      { id: 'ownership', label: 'Home ownership', options: [{ l: 'Owned', p: 5 }, { l: 'Mortgage', p: 4 }, { l: 'Rented', p: 3 }, { l: 'Relatives', p: 2 }] },
      { id: 'lengthOfStay', label: 'Length of stay', options: [{ l: '>10 Years', p: 5 }, { l: '5-10 Years', p: 4 }, { l: '1-5 Years', p: 3 }, { l: '<1 Year', p: 1 }] },
      { id: 'condition', label: 'Living condition', options: [{ l: 'Excellent', p: 5 }, { l: 'Good', p: 4 }, { l: 'Fair', p: 3 }, { l: 'Poor', p: 1 }] },
    ]
  },
  LOAN_FACTORS: {
    max: 20.0,
    items: [
      { id: 'purpose', label: 'Purpose of motorcycle', options: [{ l: 'Business', p: 6 }, { l: 'Work', p: 5 }, { l: 'Personal', p: 4 }, { l: 'Other', p: 2 }] },
      { id: 'downpayment', label: 'Downpayment capability', options: [{ l: 'High', p: 5 }, { l: 'Average', p: 4 }, { l: 'Minimal', p: 2 }, { l: 'None', p: 0 }] },
      { id: 'existingDebts', label: 'Existing debts', options: [{ l: 'None', p: 5 }, { l: 'Minimal', p: 4 }, { l: 'Average', p: 2 }, { l: 'High', p: 0 }] },
      { id: 'cicCmap', label: 'CIC / CMAP result', options: [{ l: 'Clean', p: 4 }, { l: 'Minor', p: 3 }, { l: 'Major', p: 1 }, { l: 'Blacklisted', p: 0 }] },
    ]
  }
};

const DEFAULT_SEAMAN_SCORING_SHEET = { ...DEFAULT_MCL_SCORING_SHEET };

const DEFAULT_CLASSIFICATIONS = [
  { name: 'Strong Borrower', minScore: 70, recommendation: 'Approved', color: 'text-green-600', bg: 'bg-green-50' },
  { name: 'Moderate Risk', minScore: 50, recommendation: 'Approved with Conditions', color: 'text-amber-500', bg: 'bg-amber-50' },
  { name: 'High Risk', minScore: 30, recommendation: 'Denied', color: 'text-orange-500', bg: 'bg-orange-50' },
  { name: 'Very High Risk', minScore: 0, recommendation: 'Denied', color: 'text-red-500', bg: 'bg-red-50' }
];

function AdminScoringSettings() {
  const [configType, setConfigType] = useState<'SME' | 'MCL' | 'Seaman'>('SME');
  const [sections, setSections] = useState<any>(null);
  const [classifications, setClassifications] = useState<any[]>([]);
  const [sectionWeights, setSectionWeights] = useState<Record<string, number>>({});
  const [globalAdjustment, setGlobalAdjustment] = useState<number>(0);
  const [activeConfigTab, setActiveConfigTab] = useState<'QUESTIONS' | 'CLASSIFICATIONS' | 'ADJUSTMENTS'>('QUESTIONS');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'scoringConfigs'), where('type', '==', configType), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        setSections(docData.sections || {});
        setClassifications(docData.classifications || DEFAULT_CLASSIFICATIONS);
        setSectionWeights(docData.sectionWeights || {});
        setGlobalAdjustment(docData.globalAdjustment || 0);
      } else {
        const defaultSheet = configType === 'SME' ? DEFAULT_SME_SCORING_SHEET : 
                             configType === 'MCL' ? DEFAULT_MCL_SCORING_SHEET : 
                             DEFAULT_SEAMAN_SCORING_SHEET;
        setSections(defaultSheet);
        setClassifications(DEFAULT_CLASSIFICATIONS);
        setSectionWeights({});
        setGlobalAdjustment(0);
      }
      setIsLoading(false);
    }, (err) => {
      console.error(err);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [configType]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const q = query(collection(db, 'scoringConfigs'), where('type', '==', configType), limit(1));
      const snapshot = await getDocs(q);
      
      const configData = {
        type: configType,
        sections,
        classifications,
        sectionWeights,
        globalAdjustment,
        updatedAt: new Date().toISOString()
      };

      if (!snapshot.empty) {
        await updateDoc(doc(db, 'scoringConfigs', snapshot.docs[0].id), configData);
      } else {
        await addDoc(collection(db, 'scoringConfigs'), configData);
      }
      toast.success(`${configType} Scoring configuration saved successfully`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSectionMax = (sectionKey: string, max: number) => {
    setSections({
      ...sections,
      [sectionKey]: { ...sections[sectionKey], max }
    });
  };

  const updateItemLabel = (sectionKey: string, itemIdx: number, label: string) => {
    const newItems = [...sections[sectionKey].items];
    newItems[itemIdx] = { ...newItems[itemIdx], label };
    setSections({
      ...sections,
      [sectionKey]: { ...sections[sectionKey], items: newItems }
    });
  };

  const updateOption = (sectionKey: string, itemIdx: number, optIdx: number, field: 'l' | 'p', value: any) => {
    const newItems = [...sections[sectionKey].items];
    const newOptions = [...newItems[itemIdx].options];
    newOptions[optIdx] = { ...newOptions[optIdx], [field]: field === 'p' ? parseFloat(value) : value };
    newItems[itemIdx] = { ...newItems[itemIdx], options: newOptions };
    setSections({
      ...sections,
      [sectionKey]: { ...sections[sectionKey], items: newItems }
    });
  };

  const addItem = (sectionKey: string) => {
    const newItems = [
      ...sections[sectionKey].items,
      { id: `new_${Date.now()}`, label: 'New Question', options: [{ l: 'Yes', p: 1 }, { l: 'No', p: 0 }] }
    ];
    setSections({
      ...sections,
      [sectionKey]: { ...sections[sectionKey], items: newItems }
    });
  };

  const deleteItem = (sectionKey: string, itemIdx: number) => {
    const newItems = sections[sectionKey].items.filter((_: any, i: number) => i !== itemIdx);
    setSections({
      ...sections,
      [sectionKey]: { ...sections[sectionKey], items: newItems }
    });
  };

  const addOption = (sectionKey: string, itemIdx: number) => {
    const newItems = [...sections[sectionKey].items];
    newItems[itemIdx].options.push({ l: 'New Option', p: 0 });
    setSections({
      ...sections,
      [sectionKey]: { ...sections[sectionKey], items: newItems }
    });
  };

  const deleteOption = (sectionKey: string, itemIdx: number, optIdx: number) => {
    const newItems = [...sections[sectionKey].items];
    newItems[itemIdx].options = newItems[itemIdx].options.filter((_: any, i: number) => i !== optIdx);
    setSections({
      ...sections,
      [sectionKey]: { ...sections[sectionKey], items: newItems }
    });
  };

  const addClassification = () => {
    setClassifications([
      ...classifications,
      { name: 'New Tier', minScore: 50, recommendation: 'Approved with Conditions', color: 'text-amber-500', bg: 'bg-amber-50' }
    ]);
  };

  const deleteClassification = (idx: number) => {
    setClassifications(classifications.filter((_, i) => i !== idx));
  };

  const updateClassificationObj = (idx: number, field: string, value: any) => {
    const list = [...classifications];
    list[idx] = { 
      ...list[idx], 
      [field]: field === 'minScore' ? parseInt(value, 10) || 0 : value 
    };
    setClassifications(list);
  };

  const updateSectionWeight = (key: string, val: number) => {
    setSectionWeights({
      ...sectionWeights,
      [key]: val
    });
  };

  if (isLoading) return <div className="p-8 text-center text-xs font-bold uppercase tracking-widest text-gray-400">Loading Configuration...</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-black text-emerald-900 uppercase tracking-widest">Scoring Configuration</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Adjust points, grading parameters, and risk categories</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button 
              onClick={() => setConfigType('SME')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                configType === 'SME' ? "bg-white text-emerald-700 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              SME Sheet
            </button>
            <button 
              onClick={() => setConfigType('MCL')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                configType === 'MCL' ? "bg-white text-emerald-700 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              MCL Sheet
            </button>
            <button 
              onClick={() => setConfigType('Seaman')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                configType === 'Seaman' ? "bg-white text-emerald-700 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              Seaman Sheet
            </button>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-50"
          >
            <Save size={14} /> {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200/60 max-w-xl">
        <button
          onClick={() => setActiveConfigTab('QUESTIONS')}
          className={cn(
            "flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            activeConfigTab === 'QUESTIONS' ? "bg-white text-emerald-950 shadow-sm font-black border border-gray-200/40" : "text-gray-400 hover:text-gray-600"
          )}
        >
          📑 Questions
        </button>
        <button
          onClick={() => setActiveConfigTab('CLASSIFICATIONS')}
          className={cn(
            "flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            activeConfigTab === 'CLASSIFICATIONS' ? "bg-white text-emerald-950 shadow-sm font-black border border-gray-200/40" : "text-gray-400 hover:text-gray-600"
          )}
        >
          🛡️ Classifications
        </button>
        <button
          onClick={() => setActiveConfigTab('ADJUSTMENTS')}
          className={cn(
            "flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            activeConfigTab === 'ADJUSTMENTS' ? "bg-white text-emerald-950 shadow-sm font-black border border-gray-200/40" : "text-gray-400 hover:text-gray-600"
          )}
        >
          ⚙️ Grading Adjustments
        </button>
      </div>

      {activeConfigTab === 'QUESTIONS' && (
        <div className="space-y-8">
          {Object.keys(sections || {}).map((sectionKey) => (
            <div key={sectionKey} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
              <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest">{sectionKey.replace(/_/g, ' ')}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Max Points:</span>
                    <input 
                      type="number" 
                      value={sections[sectionKey].max}
                      onChange={(e) => updateSectionMax(sectionKey, parseFloat(e.target.value))}
                      className="w-16 h-6 text-[10px] font-black text-center bg-white border border-gray-200 rounded focus:border-emerald-500 focus:ring-0"
                    />
                  </div>
                </div>
                <button 
                  onClick={() => addItem(sectionKey)}
                  className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors border border-emerald-100"
                >
                  + Add Question
                </button>
              </div>
              <div className="p-6 space-y-6">
                {sections[sectionKey].items.map((item: any, itemIdx: number) => (
                  <div key={item.id} className="p-4 bg-gray-50/30 rounded-2xl border border-gray-100 space-y-4 animate-fade-in">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 mr-4">
                        <input 
                          type="text" 
                          value={item.label}
                          onChange={(e) => updateItemLabel(sectionKey, itemIdx, e.target.value)}
                          className="w-full text-xs font-bold text-gray-800 bg-transparent border-b border-dashed border-gray-300 focus:border-emerald-500 focus:outline-none pb-1"
                        />
                      </div>
                      <button 
                        onClick={() => deleteItem(sectionKey, itemIdx)}
                        className="text-red-400 hover:text-red-600 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {item.options.map((opt: any, optIdx: number) => (
                        <div key={optIdx} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                          <div className="flex-1 space-y-1">
                            <input 
                              type="text" 
                              value={opt.l}
                              onChange={(e) => updateOption(sectionKey, itemIdx, optIdx, 'l', e.target.value)}
                              className="w-full text-[10px] font-bold text-gray-600 border-none p-0 focus:ring-0"
                              placeholder="Option label"
                            />
                            <div className="flex items-center gap-1">
                               <span className="text-[8px] font-black text-gray-400 uppercase">Pts:</span>
                               <input 
                                type="number" 
                                value={opt.p}
                                step="0.1"
                                onChange={(e) => updateOption(sectionKey, itemIdx, optIdx, 'p', e.target.value)}
                                className="w-full text-[10px] font-black text-emerald-600 border-none p-0 focus:ring-0"
                              />
                            </div>
                          </div>
                          <button 
                            onClick={() => deleteOption(sectionKey, itemIdx, optIdx)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => addOption(sectionKey, itemIdx)}
                        className="border-2 border-dashed border-gray-200 rounded-xl p-3 flex items-center justify-center text-[9px] font-black text-gray-400 uppercase tracking-widest hover:border-emerald-200 hover:text-emerald-600 transition-all"
                      >
                        + Option
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeConfigTab === 'CLASSIFICATIONS' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
          <div>
            <h3 className="text-sm font-black text-emerald-950 uppercase tracking-widest">Risk Classifications & Auto Recommendations</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
              Configure borrower grading tiers based on their scoring achievement index (0% - 100%).
            </p>
          </div>

          <div className="space-y-4">
            {classifications.map((cls, idx) => (
              <div key={idx} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-3">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Tier Name</label>
                  <input
                    type="text"
                    value={cls.name}
                    onChange={(e) => updateClassificationObj(idx, 'name', e.target.value)}
                    className="w-full text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Min Score (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={cls.minScore}
                    onChange={(e) => updateClassificationObj(idx, 'minScore', e.target.value)}
                    className="w-full text-xs font-black text-emerald-800 bg-white border border-gray-200 rounded-xl px-3 py-2 focus:border-emerald-500 focus:outline-[#059669]"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Auto Recommendation</label>
                  <select
                    value={cls.recommendation}
                    onChange={(e) => updateClassificationObj(idx, 'recommendation', e.target.value)}
                    className="w-full text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-2 focus:border-emerald-500 focus:outline-[#059669] h-[38px]"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Approved with Conditions">Approved with Conditions</option>
                    <option value="Denied">Denied</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Visual Accent Tint</label>
                  <select
                    value={cls.color || 'text-emerald-600'}
                    onChange={(e) => {
                      const color = e.target.value;
                      let bg = 'bg-emerald-50';
                      if (color === 'text-green-600') bg = 'bg-green-50';
                      else if (color === 'text-amber-500') bg = 'bg-amber-50';
                      else if (color === 'text-orange-500') bg = 'bg-orange-50';
                      else if (color === 'text-red-500') bg = 'bg-red-50';
                      
                      const list = [...classifications];
                      list[idx] = { ...list[idx], color, bg };
                      setClassifications(list);
                    }}
                    className="w-full text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-2 focus:border-emerald-500 focus:outline-[#059669] h-[38px]"
                  >
                    <option value="text-green-600">Green Banner (Safe / Low Risk)</option>
                    <option value="text-amber-500">Amber Banner (Moderate Risk)</option>
                    <option value="text-orange-500">Orange Banner (High Risk)</option>
                    <option value="text-red-500">Red Banner (Critically High Risk)</option>
                  </select>
                </div>

                <div className="md:col-span-1 pt-4 md:pt-0 flex justify-end">
                  <button
                    onClick={() => deleteClassification(idx)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded-xl border border-transparent hover:border-red-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={addClassification}
              className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-4 flex items-center justify-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-emerald-200 hover:text-emerald-700 transition-all opacity-80"
            >
              <Plus size={14} /> Add Scoring Tier Class
            </button>
          </div>
        </div>
      )}

      {activeConfigTab === 'ADJUSTMENTS' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-8 animate-fade-in block">
          <div>
            <h3 className="text-sm font-black text-emerald-950 uppercase tracking-widest">Grading & Score Adjustments</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
              Apply active point offsets or section weight priorities to fine-tune the final diagnostics output.
            </p>
          </div>

          <div className="p-6 bg-emerald-50/40 rounded-3xl border border-emerald-100/50 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">Global Score Adjustment Offset</h4>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                  A flat percentage point adjustment added directly to the final computed risk index score.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 border border-gray-100 rounded-2xl shadow-sm">
                <span className="text-[10px] font-black text-gray-400 uppercase">OFFSET:</span>
                <input
                  type="number"
                  min="-50"
                  max="50"
                  value={globalAdjustment}
                  onChange={(e) => setGlobalAdjustment(parseFloat(e.target.value) || 0)}
                  className="w-16 h-8 text-center text-xs font-black text-emerald-700 bg-transparent border-none focus:outline-none p-0 focus:ring-0"
                />
                <span className="text-[10px] font-black text-emerald-700">%</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[9px] font-black text-red-500 uppercase">-50% Penalty</span>
              <input
                type="range"
                min="-50"
                max="50"
                value={globalAdjustment}
                onChange={(e) => setGlobalAdjustment(parseFloat(e.target.value) || 0)}
                className="flex-1 accent-emerald-600 cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
              />
              <span className="text-[9px] font-black text-green-600 uppercase">+50% Bonus</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">Scoring Sheet Section Weights</h4>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                Configure multipliers to prioritize or lower down the impact of specific assessment categories on the total calculation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.keys(sections || {}).map((sectionKey) => {
                const currentWeight = sectionWeights[sectionKey] !== undefined ? sectionWeights[sectionKey] : 1.0;
                return (
                  <div key={sectionKey} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">{sectionKey.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100/50 px-2 py-1 rounded-lg">
                        {currentWeight.toFixed(1)}x Priority
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[8px] font-black text-gray-300">0.1x</span>
                      <input
                        type="range"
                        min="0.1"
                        max="3.0"
                        step="0.1"
                        value={currentWeight}
                        onChange={(e) => updateSectionWeight(sectionKey, parseFloat(e.target.value))}
                        className="flex-1 accent-emerald-600 cursor-pointer h-1 bg-gray-250 rounded-lg appearance-none"
                      />
                      <span className="text-[8px] font-black text-gray-300">3.0x</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserManagement({ user }: { user: UserProfile }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [adminKeys, setAdminKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [actionConfirm, setActionConfirm] = useState<{ type: 'delete' | 'edit' | 'deleteKey', id: string, name?: string } | null>(null);

  const [viewingAssignments, setViewingAssignments] = useState<any | null>(null);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    const qKeys = query(collection(db, 'admin_keys'));
    const unsubKeys = onSnapshot(qKeys, (snapshot) => {
      setAdminKeys(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'admin_keys');
    });

    const qAssignments = query(collection(db, 'assignments'));
    const unsubAssignments = onSnapshot(qAssignments, (snapshot) => {
      setAllAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Assignment[]);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'assignments');
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubKeys();
      unsubAssignments();
    };
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (id === auth.currentUser?.uid) {
      alert('You cannot delete your own account.');
      return;
    }
    setActionConfirm({ type: 'delete', id, name });
  };

  const confirmDelete = async () => {
    if (!actionConfirm) return;
    try {
      await api.delete(`/api/users/${actionConfirm.id}`);
      alert('User deleted successfully.');
      setActionConfirm(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete user.');
    }
  };

  const handleEdit = (u: any) => {
    setEditingUser({ ...u });
  };

  const updateUserInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setLoading(true);
    try {
      await api.patch(`/api/users/${editingUser.id}`, {
        fullName: editingUser.fullName,
        mobileNumber: editingUser.mobileNumber,
        role: editingUser.role
      });
      alert('User updated successfully.');
      setEditingUser(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update user.');
    } finally {
      setLoading(false);
    }
  };

  const generateAdminKey = async () => {
    const key = Math.floor(1000 + Math.random() * 9000).toString();
    try {
      await api.post('/api/admin-keys', { key });
      alert(`Admin Key Generated: ${key}`);
    } catch (err) {
      console.error(err);
      alert('Failed to generate admin key');
    }
  };

  const handleDeleteKey = async (id: string) => {
    setActionConfirm({ type: 'deleteKey', id });
  };

  const confirmDeleteKey = async () => {
    if (!actionConfirm) return;
    try {
      await api.delete(`/api/admin-keys/${actionConfirm.id}`);
      alert('Admin key deleted successfully.');
      setActionConfirm(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete admin key.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-emerald-800 uppercase tracking-widest">User Management</h2>
        {user.email === '1stmb.mj@gmail.com' && (
          <button 
            onClick={generateAdminKey}
            className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10"
          >
            <Key size={14} /> Generate 4-Digit Admin Key
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Mobile Number</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Created At</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-black text-xs border border-emerald-100">
                      {u.fullName.charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-gray-900">{u.fullName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{u.mobileNumber}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "text-[8px] font-black uppercase px-2 py-1 rounded tracking-widest",
                    u.role === 'admin' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                  )}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-[10px] font-mono text-gray-400">
                  {u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : '---'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setViewingAssignments(u)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="View Assigned Accounts"
                    >
                      <ListChecks size={16} />
                    </button>
                    <button 
                      onClick={() => handleEdit(u)}
                      className="p-2 text-gray-400 hover:text-emerald-700 transition-colors"
                      title="Edit User"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(u.id, u.fullName)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete User"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditingUser(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10"
            >
              <div className="bg-linear-to-r from-emerald-800 to-emerald-900 p-8 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Modify System User</h3>
                  <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-1">Credentials Authority: System Admin</p>
                </div>
                <button onClick={() => setEditingUser(null)} className="hover:rotate-90 transition-transform bg-white/10 p-2 rounded-xl">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={updateUserInfo} className="p-8 space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Legal Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={editingUser.fullName}
                    onChange={e => setEditingUser({...editingUser, fullName: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mobile Protocol</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={editingUser.mobileNumber}
                    onChange={e => setEditingUser({...editingUser, mobileNumber: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Access Privilege Level</label>
                  <select 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={editingUser.role}
                    onChange={e => setEditingUser({...editingUser, role: e.target.value})}
                  >
                    <option value="user">CI Officer (Standard Access)</option>
                    <option value="coordinator">CI Coordinator (Limited Admin)</option>
                    <option value="admin">System Administrator (Full Authority)</option>
                  </select>
                </div>
                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 py-4 bg-gray-50 text-gray-400 font-black rounded-2xl hover:bg-gray-100 transition-all uppercase tracking-widest text-[10px]"
                  >
                    Abort
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-900/10 hover:bg-emerald-700 transition-all uppercase tracking-widest text-[10px] disabled:opacity-50"
                  >
                    {loading ? "Processing..." : "Update Identity"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {viewingAssignments && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setViewingAssignments(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10"
            >
              <div className="bg-linear-to-r from-emerald-800 to-emerald-900 p-8 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Active Portfolio: {viewingAssignments.fullName}</h3>
                  <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-1">Assigned Borrower Accounts</p>
                </div>
                <button onClick={() => setViewingAssignments(null)} className="hover:rotate-90 transition-transform bg-white/10 p-2 rounded-xl">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 max-h-[60vh] overflow-y-auto">
                <div className="space-y-4">
                  {allAssignments.filter(a => a.ciOfficerId === viewingAssignments.id).length > 0 ? (
                    allAssignments.filter(a => a.ciOfficerId === viewingAssignments.id).map(a => (
                      <div key={a.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center group hover:bg-white hover:border-emerald-100 transition-all">
                        <div className="space-y-1">
                          <p className="text-xs font-black text-gray-900 uppercase">{a.borrowerName}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{a.accountType} • {a.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-emerald-800">₱{a.requestedAmount.toLocaleString()}</p>
                          <p className="text-[9px] text-gray-400 font-mono">{format(new Date(a.createdAt), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <ClipboardList className="mx-auto text-gray-200 mb-4" size={48} />
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No assigned accounts found</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => setViewingAssignments(null)}
                  className="px-8 py-3 bg-white border border-gray-200 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-100 transition-all text-gray-600"
                >
                  Close Portfolio
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {actionConfirm?.type === 'delete' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setActionConfirm(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="text-red-500" size={32} />
              </div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-2">Delete Account?</h3>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                Are you sure you want to remove <span className="font-bold text-gray-900">{actionConfirm.name}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setActionConfirm(null)}
                  className="flex-1 py-3 border border-gray-100 text-gray-400 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-gray-50"
                >
                  No, Keep
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-500 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-red-200 hover:bg-red-600 active:scale-95 transition-all"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Key Confirmation Modal */}
        {actionConfirm?.type === 'deleteKey' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setActionConfirm(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="text-red-500" size={32} />
              </div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-2">Delete Admin Key?</h3>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                Are you sure you want to remove this key? <span className="font-mono font-bold text-emerald-800">{actionConfirm.id}</span>
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setActionConfirm(null)}
                  className="flex-1 py-3 border border-gray-100 text-gray-400 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteKey}
                  className="flex-1 py-3 bg-red-500 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-red-200 hover:bg-red-600 active:scale-95 transition-all"
                >
                  Yes, Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {user.role === 'admin' && (
        <div className="space-y-4">
          <h3 className="text-sm font-black text-emerald-800 uppercase tracking-widest px-1">Active Admin Keys</h3>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Key Code</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Created At</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {adminKeys.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-xs italic uppercase tracking-widest">
                      No admin keys available
                    </td>
                  </tr>
                ) : (
                  adminKeys.map(k => (
                    <tr key={k.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm font-bold tracking-widest text-emerald-700">
                        {k.id}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[8px] font-black uppercase px-2 py-1 rounded tracking-widest",
                          k.used ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                        )}>
                          {k.used ? 'Used' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-mono text-gray-400">
                        {k.createdAt ? format(new Date(k.createdAt), 'MMM d, h:mm a') : '---'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteKey(k.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function CIDashboard({ user }: { user: UserProfile }) {
  const [stats, setStats] = useState({
    total: 0,
    assigned: 0,
    completed: 0,
    approved: 0,
    denied: 0,
    monthlyAssigned: 0
  });
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'assignments'), where('ciOfficerId', '==', user.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const assignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Assignment[];
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthly = assignments.filter(a => {
        const date = new Date(a.createdAt);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });

      setStats({
        total: assignments.length,
        assigned: assignments.filter(a => a.status === 'Assigned').length,
        completed: assignments.filter(a => a.status === 'Completed').length,
        approved: assignments.filter(a => a.status === 'Approved').length,
        denied: assignments.filter(a => a.status === 'Denied').length,
        monthlyAssigned: monthly.length
      });

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return format(d, 'MMM d');
      }).reverse();

      const data = last7Days.map(day => {
        const count = assignments.filter(a => format(new Date(a.createdAt), 'MMM d') === day).length;
        return { name: day, tasks: count };
      });
      setPerformanceData(data);

      // 12-month Points History (Personal)
      const personalHistory: any[] = [];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const m = d.getMonth();
        const y = d.getFullYear();
        
        const monthAssignments = assignments.filter(a => {
          const ad = new Date(a.createdAt);
          return ad.getMonth() === m && ad.getFullYear() === y;
        });
        
        const pts = monthAssignments.reduce((acc, a) => acc + 1 + (a.isMCLReferral ? 2 : 0), 0);
        
        personalHistory.push({
          name: monthNames[m],
          points: pts
        });
      }
      setPointsHistory(personalHistory);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'assignments');
    });

    // Also fetch ALL assignments for the shared leaderboard only if privileged
    // Regular workers won't see are not allowed to list all assignments for security
    let unsubAll = () => {};
    if (user.role === 'admin' || user.role === 'coordinator') {
      const qAll = query(collection(db, 'assignments'), orderBy('createdAt', 'desc'), limit(500));
      unsubAll = onSnapshot(qAll, (snapshot) => {
        setAllAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Assignment[]);
      }, (err) => {
        console.error("Leaderboard query failed:", err);
      });
    }

    return () => {
      unsubscribe();
      unsubAll();
    };
  }, [user.id]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center overflow-hidden border-2 border-emerald-100">
            {user.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="text-emerald-700" size={24} />
            )}
          </div>
          <div>
            <h2 className="text-xl font-black text-emerald-900 uppercase tracking-widest">CI Officer Dashboard</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Personal Performance Overview</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard label="Total Tasks" value={stats.total} icon={<ClipboardList className="text-blue-500" />} />
        <StatCard label="Monthly Assigned" value={stats.monthlyAssigned} icon={<Calendar className="text-indigo-500" />} />
        <StatCard label="New Assigned" value={stats.assigned} icon={<Clock className="text-amber-500" />} />
        <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2 className="text-green-500" />} />
        <StatCard label="Approved" value={stats.approved} icon={<Check className="text-emerald-500" />} />
        <StatCard label="Denied" value={stats.denied} icon={<X className="text-red-500" />} />
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xs font-black text-emerald-800 uppercase tracking-[0.2em] mb-6">Task Assignment Trend (Last 7 Days)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#059669' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#059669' }}
              />
              <Tooltip 
                cursor={{ fill: '#F0FDF4' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
              />
              <Bar dataKey="tasks" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xs font-black text-emerald-800 uppercase tracking-[0.2em]">Personal Points History</h3>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">12-Month Performance Metric</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
            <TrendingUp size={12} />
            <span className="text-[10px] font-black uppercase tracking-widest">Growth Analytics</span>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pointsHistory}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
              />
              <Tooltip 
                contentStyle={{ 
                  fontSize: '10px', 
                  fontWeight: 'bold', 
                  textTransform: 'uppercase', 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '12px'
                }}
                itemStyle={{ color: '#1E40AF' }}
              />
              <Line 
                type="monotone" 
                dataKey="points" 
                stroke="#3B82F6" 
                strokeWidth={4} 
                dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <LeaderboardSection 
        assignments={allAssignments} 
        currentMonth={new Date().getMonth()} 
        currentYear={new Date().getFullYear()} 
      />
    </motion.div>
  );
}

function ProfileSettings({ user, setUser }: { user: UserProfile, setUser: (u: UserProfile) => void }) {
  const [formData, setFormData] = useState({
    fullName: user.fullName,
    mobileNumber: user.mobileNumber || '',
    photoURL: user.photoURL || '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        alert('Image size must be less than 500KB to ensure reliable storage');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoURL: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      await api.patch('/api/auth/profile', {
        fullName: formData.fullName,
        mobileNumber: formData.mobileNumber,
        photoURL: formData.photoURL,
        password: formData.password || undefined
      });
      setUser({ ...user, fullName: formData.fullName, mobileNumber: formData.mobileNumber, photoURL: formData.photoURL });
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setFormData({ ...formData, password: '', confirmPassword: '' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.error || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
      >
        <h2 className="text-xl font-black text-emerald-800 uppercase tracking-widest mb-8">Profile Settings</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center space-y-4 mb-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gray-50 overflow-hidden border-4 border-emerald-500/20 flex items-center justify-center shadow-inner">
                {formData.photoURL ? (
                  <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={40} className="text-gray-300" />
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
                <Camera size={20} />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Click to change picture</p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold"
              value={formData.fullName}
              onChange={e => setFormData({...formData, fullName: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mobile Number</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold"
              value={formData.mobileNumber}
              onChange={e => setFormData({...formData, mobileNumber: e.target.value})}
              placeholder="e.g. 09123456789"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">New Password (Optional)</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              placeholder="Leave blank to keep current"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Confirm New Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold"
              value={formData.confirmPassword}
              onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
            />
          </div>

          {message && (
            <p className={cn(
              "text-[10px] font-bold uppercase tracking-widest text-center",
              message.type === 'success' ? "text-green-500" : "text-red-500"
            )}>
              {message.text}
            </p>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg hover:bg-emerald-700 transition-all uppercase tracking-[0.2em] disabled:opacity-50 shadow-emerald-900/20"
          >
            {loading ? 'Updating...' : 'Save Changes'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// --- ATTENDANCE MODULE ---
function AttendanceModule({ user }: { user: UserProfile }) {
  const isAdmin = user.role === 'admin';
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [showTaskLog, setShowTaskLog] = useState(false);
  const [taskLog, setTaskLog] = useState('');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [coordRemarks, setCoordRemarks] = useState('');

  const [showTimeInModal, setShowTimeInModal] = useState(false);
  const [itineraryInput, setItineraryInput] = useState('');
  const [plannedTasksInput, setPlannedTasksInput] = useState('');

  const now = new Date();
  const isAfterCutoff = now.getHours() > 18 || (now.getHours() === 18 && now.getMinutes() >= 30);

  useEffect(() => {
    const isAdminOrCoordinator = user.role === 'admin' || user.role === 'coordinator';
    const q = isAdminOrCoordinator 
      ? query(collection(db, 'attendance'), orderBy('createdAt', 'desc'), limit(100))
      : query(collection(db, 'attendance'), where('userId', '==', user.id), orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AttendanceRecord[];
      setRecords(data);
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayRec = data.find(r => r.date === today && r.userId === user.id);
      setTodayRecord(todayRec || null);
      
      setIsLoading(false);
    }, (err) => {
       handleFirestoreError(err, OperationType.LIST, 'attendance');
       setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user.id, user.role]);

  const confirmTimeIn = async () => {
    if (!itineraryInput.trim() || !plannedTasksInput.trim()) {
      toast.error("Please fill in both daily itinerary and tasks");
      return;
    }
    setIsSubmittingAction(true);
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    const timeStr = format(now, 'HH:mm:ss');

    const hour = now.getHours();
    const minutes = now.getMinutes();
    const isSaturday = now.getDay() === 6;
    let status: 'LATE' | 'ON TIME' = 'ON TIME';
    
    if (isSaturday) {
      if (hour > 9 || (hour === 9 && minutes >= 1)) {
        status = 'LATE';
      }
    } else {
      if (hour >= 8) {
        status = 'LATE';
      }
    }

    try {
      await addDoc(collection(db, 'attendance'), {
        userId: user.id,
        userName: user.fullName,
        date: today,
        timeIn: timeStr,
        timeOut: null,
        status,
        tasks: '',
        itinerary: itineraryInput.trim(),
        plannedTasks: plannedTasksInput.trim(),
        createdAt: now.toISOString()
      });
      toast.success("Timed in successfully with itinerary!");
      setShowTimeInModal(false);
      setItineraryInput('');
      setPlannedTasksInput('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'attendance');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleTimeAction = async (type: 'in' | 'out') => {
    if (isSubmittingAction) return;
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    const timeStr = format(now, 'HH:mm:ss');
    
    try {
      if (type === 'in') {
        if (todayRecord) {
          toast.error("Already timed in for today");
          return;
        }

        // If the logged in user is a Field Officer, they must fill dynamic itinerary and tasks first
        if (user.role === 'user') {
          setShowTimeInModal(true);
          return;
        }

        setIsSubmittingAction(true);
        const hour = now.getHours();
        const minutes = now.getMinutes();
        const isSaturday = now.getDay() === 6;
        let status: 'LATE' | 'ON TIME' = 'ON TIME';
        
        if (isSaturday) {
          // Saturday: <= 9:00 AM is ON TIME, 9:01 AM onwards is LATE
          if (hour > 9 || (hour === 9 && minutes >= 1)) {
            status = 'LATE';
          }
        } else {
          // Monday - Friday: Lateness is recorded from 8:00 AM onwards
          if (hour >= 8) {
            status = 'LATE';
          }
        }
        
        try {
          await addDoc(collection(db, 'attendance'), {
            userId: user.id,
            userName: user.fullName,
            date: today,
            timeIn: timeStr,
            timeOut: null,
            status,
            tasks: '',
            createdAt: now.toISOString()
          });
          toast.success("Timed in successfully");
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'attendance');
        } finally {
          setIsSubmittingAction(false);
        }
      } else {
        if (!todayRecord) {
          toast.error("You must time in first");
          return;
        }
        if (todayRecord.timeOut) {
          toast.error("Already timed out for today");
          return;
        }
        
        const hour = now.getHours();
        const minutes = now.getMinutes();
        if (hour > 18 || (hour === 18 && minutes >= 30)) {
          toast.error("Time out is disabled after 6:30 PM");
          return;
        }
        
        setShowTaskLog(true);
      }
    } catch (err) {
      console.error(err);
      toast.error("Action failed");
    }
  };

  const confirmTimeOut = async () => {
    if (!taskLog.trim()) {
      toast.error("Please fill in your task log before timing out");
      return;
    }
    if (!todayRecord) return;

    setIsSubmittingTask(true);
    const now = new Date();
    const timeStr = format(now, 'HH:mm:ss');

    try {
      await updateDoc(doc(db, 'attendance', todayRecord.id), {
        timeOut: timeStr,
        tasks: taskLog
      });
      toast.success("Timed out successfully");
      setShowTaskLog(false);
      setTaskLog('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `attendance/${todayRecord.id}`);
      toast.error("Time out failed");
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleUpdateRemarks = async () => {
    if (!editingRecord) return;
    try {
      await updateDoc(doc(db, 'attendance', editingRecord.id), {
        coordinatorRemarks: coordRemarks
      });
      toast.success("Remarks updated");
      setEditingRecord(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `attendance/${editingRecord.id}`);
    }
  };

  if (isLoading) return <div className="p-12 text-center text-emerald-800 font-bold uppercase tracking-widest animate-pulse">Loading Records...</div>;

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-3xl border border-emerald-50 shadow-sm"
        >
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Presence</p>
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <CheckCircle size={20} />
              </div>
              <span className="text-4xl font-black text-emerald-900 tracking-tighter">{records.length}</span>
           </div>
           <p className="text-[9px] font-bold text-gray-400 uppercase mt-2">Active Duty Days</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-3xl border border-amber-50 shadow-sm"
        >
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 text-amber-600">Total Late</p>
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                <AlertCircle size={20} />
              </div>
              <span className="text-4xl font-black text-amber-600 tracking-tighter">{records.filter(r => r.status === 'LATE').length}</span>
           </div>
           <p className="text-[9px] font-bold text-gray-400 uppercase mt-2">Time-In Violations</p>
        </motion.div>
      </div>

      {!isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={cn(
              "h-48 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden transition-all shadow-xl",
              todayRecord ? "bg-emerald-900/10 border-2 border-emerald-500/20" : "bg-black text-white"
            )}
          >
             <div className="z-10">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Entry Activity</p>
                <h3 className={cn("text-4xl font-black uppercase tracking-tighter mt-1", todayRecord ? "text-emerald-900" : "text-white")}>
                    {todayRecord ? "Time In" : "Ready to Start"}
                </h3>
             </div>
             <div className="z-10 flex items-center justify-between">
                {todayRecord?.timeIn ? (
                  <span className="text-2xl font-mono text-emerald-600 font-black">{todayRecord.timeIn}</span>
                ) : (
                  <button 
                    onClick={() => handleTimeAction('in')}
                    disabled={isSubmittingAction}
                    className="bg-white text-black px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSubmittingAction ? "Processing..." : "Time In Now"}
                  </button>
                )}
                <TrendingUp size={32} className="opacity-20 translate-x-4" />
             </div>
             <Fingerprint className="absolute -right-8 -bottom-8 w-48 h-48 opacity-5" />
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className={cn(
              "h-48 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden transition-all shadow-xl",
              (todayRecord?.timeOut) ? "bg-indigo-900/10 border-2 border-indigo-500/20" : "bg-linear-to-br from-indigo-700 to-purple-800 text-white"
            )}
          >
             <div className="z-10">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Exit Activity</p>
                <h3 className={cn("text-4xl font-black uppercase tracking-tighter mt-1", todayRecord?.timeOut ? "text-indigo-900" : "text-white")}>
                    {todayRecord?.timeOut ? "Time Out" : "Duty in Progress"}
                </h3>
             </div>
             <div className="z-10 flex items-center justify-between">
                {todayRecord?.timeOut ? (
                  <span className="text-2xl font-mono text-indigo-600 font-black">{todayRecord.timeOut}</span>
                ) : (
                  <button 
                    onClick={() => handleTimeAction('out')}
                    disabled={!todayRecord || isAfterCutoff}
                    className="bg-white text-indigo-900 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isAfterCutoff ? "Cutoff Reached" : "Time Out Now"}
                  </button>
                )}
                <Clock size={32} className="opacity-20 translate-x-4" />
             </div>
             <Timer className="absolute -right-8 -bottom-8 w-48 h-48 opacity-5" />
          </motion.div>
        </div>
      )}

      {/* RECENT ACTIVITY */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xs font-black text-emerald-800 uppercase tracking-[0.2em]">
            {isAdmin ? "Summary of Attendance" : "Recent Activity"}
          </h3>
          <div className="flex items-center gap-4">
             <span className="text-[9px] text-gray-400 font-bold uppercase">{records.length} records found</span>
             <button className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-tighter hover:bg-emerald-100 transition-colors">
                Refresh
             </button>
          </div>
        </div>
        
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">
                <th className="p-4">Employee</th>
                <th className="p-4">Date</th>
                <th className="p-4">Action</th>
                <th className="p-4">Status</th>
                <th className="p-4">Day Plan / Itinerary</th>
                <th className="p-4">Log Out Tasks</th>
                {(isAdmin || user.role === 'coordinator') && <th className="p-4">Coord Remarks</th>}
                {(isAdmin || user.role === 'coordinator') && <th className="p-4 text-center">Manage</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map((r) => (
                <tr key={r.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <p className="text-[11px] font-black text-emerald-900 uppercase truncate max-w-[150px]">{r.userName}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-[11px] font-bold text-gray-600">{format(new Date(r.date), 'MMM dd, yyyy')}</p>
                    <p className="text-[9px] text-gray-400 uppercase font-mono mt-0.5">{r.timeIn || "--:--"} · {r.timeOut || "--:--"}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                       {r.timeIn && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase tracking-tighter">In</span>
                       )}
                       {r.timeOut && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[8px] font-black uppercase tracking-tighter">Out</span>
                       )}
                    </div>
                  </td>
                  <td className="p-4 font-black text-[9px] uppercase tracking-widest">
                    <span className={cn(
                      r.status === 'ON TIME' ? "text-emerald-500" : "text-amber-500"
                    )}>{r.status}</span>
                  </td>
                  <td className="p-4 text-[10px] text-gray-600">
                    <div className="space-y-1 max-w-[220px]">
                      {r.itinerary && (
                        <p className="text-[10px] leading-relaxed text-slate-700 font-bold" title={r.itinerary}>
                          <span className="text-emerald-700 font-black text-[8px] uppercase tracking-wider block">🗺️ Itinerary:</span>
                          {r.itinerary}
                        </p>
                      )}
                      {r.plannedTasks && (
                        <p className="text-[10px] leading-relaxed text-slate-500 font-bold" title={r.plannedTasks}>
                          <span className="text-indigo-700 font-black text-[8px] uppercase tracking-wider block">📋 Day Goals:</span>
                          {r.plannedTasks}
                        </p>
                      )}
                      {!r.itinerary && !r.plannedTasks && (
                        <span className="text-gray-300">---</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-[10px] text-gray-400 font-medium italic">
                    {r.tasks ? (
                      <p className="truncate max-w-[150px]" title={r.tasks}>{r.tasks}</p>
                    ) : "---"}
                  </td>
                  {(isAdmin || user.role === 'coordinator') && (
                    <td className="p-4 text-[10px] text-indigo-400 font-medium italic">
                      {r.coordinatorRemarks ? (
                        <p className="truncate max-w-[150px]" title={r.coordinatorRemarks}>{r.coordinatorRemarks}</p>
                      ) : "---"}
                    </td>
                  )}
                  {(isAdmin || user.role === 'coordinator') && (
                    <td className="p-4 text-center">
                       <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => {
                            setEditingRecord(r);
                            setCoordRemarks(r.coordinatorRemarks || '');
                          }}
                          className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                        >
                          <Pencil size={12} />
                        </button>
                        {isAdmin && (
                          <button 
                            onClick={async () => {
                              if (confirm('Are you sure you want to delete this attendance record?')) {
                                try {
                                  await deleteDoc(doc(db, 'attendance', r.id));
                                  toast.success("Attendance record deleted");
                                } catch (err) {
                                  handleFirestoreError(err, OperationType.DELETE, `attendance/${r.id}`);
                                }
                              }
                            }}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {records.length === 0 && (
            <div className="py-24 text-center text-gray-300">
               <Fingerprint className="mx-auto mb-2 opacity-20" size={48} />
               <p className="text-[10px] font-bold uppercase tracking-widest">No activity reported</p>
            </div>
          )}
        </div>
      </div>

       {/* Time-In Planner Modal */}
      <AnimatePresence>
        {showTimeInModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowTimeInModal(false);
                setItineraryInput('');
                setPlannedTasksInput('');
              }}
              className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative z-10 p-8"
            >
              <div className="text-center space-y-4 mb-6">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto border border-emerald-55">
                   <Calendar size={32} className="text-emerald-600" />
                </div>
                <h3 className="text-2xl font-black text-emerald-900 uppercase tracking-tighter">Officer Time-In Planner</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Provide your itinerary and tasks before recording time-in</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Daily Itinerary / Routing <span className="text-red-500 font-bold">*</span></label>
                  <textarea
                    value={itineraryInput}
                    onChange={(e) => setItineraryInput(e.target.value)}
                    placeholder="E.G., Field visit to Calamba, Laguna; Client verification at Brgy. Canlubang..."
                    className="w-full h-24 bg-gray-50 border-2 border-emerald-55 rounded-2xl p-3 text-xs font-bold text-gray-700 focus:border-emerald-500 focus:outline-none transition-all resize-none"
                    required
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Tasks / Day Goals <span className="text-red-500 font-bold">*</span></label>
                  <textarea
                    value={plannedTasksInput}
                    onChange={(e) => setPlannedTasksInput(e.target.value)}
                    placeholder="E.G., Complete 3 client credit assessments; Submit cashflow reports by 4 PM..."
                    className="w-full h-24 bg-gray-50 border-2 border-emerald-55 rounded-2xl p-3 text-xs font-bold text-gray-700 focus:border-emerald-500 focus:outline-none transition-all resize-none"
                    required
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => {
                      setShowTimeInModal(false);
                      setItineraryInput('');
                      setPlannedTasksInput('');
                    }}
                    className="flex-1 h-12 border-2 border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmTimeIn}
                    disabled={isSubmittingAction || !itineraryInput.trim() || !plannedTasksInput.trim()}
                    className="flex-1 h-12 bg-emerald-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-950/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSubmittingAction ? "Recording..." : "Verify & Time In"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Log Modal */}
      <AnimatePresence>
        {showTaskLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTaskLog(false)}
              className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 p-8"
            >
              <div className="text-center space-y-4 mb-8">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
                   <ClipboardList size={32} className="text-emerald-600" />
                </div>
                <h3 className="text-2xl font-black text-emerald-900 uppercase tracking-tighter">Task Log Required</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Please summarize your activities today before timing out</p>
              </div>

              <div className="space-y-4">
                <textarea
                  value={taskLog}
                  onChange={(e) => setTaskLog(e.target.value)}
                  placeholder="What have you accomplished today?..."
                  className="w-full h-40 bg-gray-50 border-2 border-emerald-50 rounded-2xl p-4 text-xs font-bold focus:border-emerald-500 focus:outline-none transition-all resize-none"
                  autoFocus
                />

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowTaskLog(false)}
                    className="flex-1 h-12 border-2 border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmTimeOut}
                    disabled={isSubmittingTask || !taskLog.trim()}
                    className="flex-1 h-12 bg-emerald-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-950/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSubmittingTask ? "Processing..." : "Complete & Time Out"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Coordinator Remarks Modal */}
      <AnimatePresence>
        {editingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingRecord(null)}
              className="absolute inset-0 bg-indigo-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 p-8"
            >
              <div className="text-center space-y-4 mb-8">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto">
                   <Settings2 size={32} className="text-indigo-600" />
                </div>
                <h3 className="text-2xl font-black text-indigo-900 uppercase tracking-tighter">Add Coordinator Remarks</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">For: {editingRecord.userName} on {editingRecord.date}</p>
              </div>

              <div className="space-y-4">
                <textarea
                  value={coordRemarks}
                  onChange={(e) => setCoordRemarks(e.target.value)}
                  placeholder="Official remarks from coordinator/admin..."
                  className="w-full h-40 bg-gray-50 border-2 border-indigo-50 rounded-2xl p-4 text-xs font-bold focus:border-indigo-500 focus:outline-none transition-all resize-none"
                  autoFocus
                />

                <div className="flex gap-4">
                  <button
                    onClick={() => setEditingRecord(null)}
                    className="flex-1 h-12 border-2 border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateRemarks}
                    className="flex-1 h-12 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-950/20 active:scale-95 transition-all"
                  >
                    Save Remarks
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- LEAVE MODULE ---
function LeaveModule({ user }: { user: UserProfile }) {
  const [formData, setFormData] = useState<Partial<LeaveRequest>>({
    leaveType: 'Sick Leave',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [history, setHistory] = useState<LeaveRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'leaves'), where('userId', '==', user.id), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LeaveRequest[]);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'leaves');
    });
    return () => unsubscribe();
  }, [user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      toast.error("Please provide all details");
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'leaves'), {
        ...formData,
        userId: user.id,
        userName: user.fullName,
        status: 'Pending',
        createdAt: new Date().toISOString()
      });
      await notifyAdmins(
        "New Leave Request",
        `${user.fullName} has filed for ${formData.leaveType}`,
        "LEAVE_REQUEST"
      );
      toast.success("Application submitted successfully");
      setFormData({ leaveType: 'Sick Leave', startDate: '', endDate: '', reason: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'leaves');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-black text-emerald-900 uppercase tracking-tight mb-8">Application Form</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Leave Category</label>
              <select 
                value={formData.leaveType}
                onChange={e => setFormData({...formData, leaveType: e.target.value as LeaveType})}
                className="w-full h-12 bg-gray-50 border-2 border-gray-100 rounded-xl px-4 text-xs font-bold focus:border-emerald-500 focus:outline-none transition-all"
              >
                <option>Sick Leave</option>
                <option>Vacation Leave</option>
                <option>Emergency Leave</option>
                <option>Maternity Leave</option>
                <option>Paternity Leave</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Start Date</label>
                 <input 
                   type="date"
                   value={formData.startDate}
                   onChange={e => setFormData({...formData, startDate: e.target.value})}
                   className="w-full h-12 bg-gray-50 border-2 border-gray-100 rounded-xl px-4 text-xs font-bold focus:border-emerald-500 focus:outline-none transition-all"
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">End Date</label>
                 <input 
                   type="date"
                   value={formData.endDate}
                   onChange={e => setFormData({...formData, endDate: e.target.value})}
                   className="w-full h-12 bg-gray-50 border-2 border-gray-100 rounded-xl px-4 text-xs font-bold focus:border-emerald-500 focus:outline-none transition-all"
                 />
               </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reason</label>
              <textarea 
                value={formData.reason}
                onChange={e => setFormData({...formData, reason: e.target.value})}
                placeholder="State your reason for leave..."
                className="w-full h-32 bg-gray-50 border-2 border-gray-100 rounded-xl p-4 text-xs font-bold focus:border-emerald-500 focus:outline-none transition-all resize-none"
              />
            </div>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 bg-emerald-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-lg shadow-emerald-950/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : "Submit Application"}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Leave History</h3>
        <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar pr-2">
          {history.map(item => (
            <div key={item.id} className="p-4 rounded-2xl border border-gray-50 bg-gray-50/50 flex justify-between items-center group hover:bg-white hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center font-black text-emerald-800 text-xl shadow-sm">
                   {item.leaveType[0]}
                </div>
                <div>
                  <p className="text-[11px] font-black text-emerald-900 uppercase">{item.leaveType}</p>
                  <p className="text-[9px] text-gray-400 font-bold mt-0.5 tracking-tighter">
                    {format(new Date(item.startDate), 'MMM dd')} - {format(new Date(item.endDate), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                item.status === 'Approved' ? "bg-emerald-100 text-emerald-600" :
                item.status === 'Rejected' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
              )}>
                {item.status}
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <div className="py-24 text-center text-gray-300">
               <CalendarDays className="mx-auto mb-2 opacity-20" size={48} />
               <p className="text-[10px] font-bold uppercase tracking-widest">No history recorded</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- OVERTIME MODULE ---
function OvertimeModule({ user }: { user: UserProfile }) {
  const [formData, setFormData] = useState<Partial<OvertimeRequest>>({
    date: '',
    hours: 0,
    minutes: 0,
    reason: ''
  });
  const [history, setHistory] = useState<OvertimeRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'overtime'), where('userId', '==', user.id), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OvertimeRequest[]);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'overtime');
    });
    return () => unsubscribe();
  }, [user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || (!formData.hours && !formData.minutes) || !formData.reason) {
      toast.error("Please fill all OT details");
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'overtime'), {
        ...formData,
        userId: user.id,
        userName: user.fullName,
        status: 'Pending',
        createdAt: new Date().toISOString()
      });
      await notifyAdmins(
        "New OT Request",
        `${user.fullName} has filed for ${formData.hours}h ${formData.minutes}m OT`,
        "OT_REQUEST"
      );
      toast.success("OT Application sent");
      setFormData({ date: '', hours: 0, minutes: 0, reason: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'overtime');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <h3 className="text-xl font-black text-emerald-900 uppercase tracking-tight mb-8">OT Application</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Overtime Date</label>
            <input 
              type="date"
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className="w-full h-12 bg-gray-50 border-2 border-gray-100 rounded-xl px-4 text-xs font-bold focus:border-emerald-500 focus:outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hours</label>
               <input 
                 type="number"
                 value={formData.hours}
                 onChange={e => setFormData({...formData, hours: parseInt(e.target.value) || 0})}
                 min="0"
                 className="w-full h-12 bg-gray-50 border-2 border-gray-100 rounded-xl px-4 text-xs font-bold focus:border-indigo-500 focus:outline-none transition-all"
               />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Minutes</label>
               <input 
                 type="number"
                 value={formData.minutes}
                 onChange={e => setFormData({...formData, minutes: parseInt(e.target.value) || 0})}
                 min="0"
                 max="59"
                 className="w-full h-12 bg-gray-50 border-2 border-gray-100 rounded-xl px-4 text-xs font-bold focus:border-indigo-500 focus:outline-none transition-all"
               />
             </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">OT Reason</label>
            <textarea 
              value={formData.reason}
              onChange={e => setFormData({...formData, reason: e.target.value})}
              placeholder="Justify your overtime claim..."
              className="w-full h-32 bg-gray-50 border-2 border-gray-100 rounded-xl p-4 text-xs font-bold focus:border-indigo-500 focus:outline-none transition-all resize-none"
            />
          </div>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 bg-indigo-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-lg shadow-indigo-950/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Sending..." : "Send OT Request"}
          </button>
        </form>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">OT History</h3>
        <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar pr-2">
          {history.map(item => (
            <div key={item.id} className="p-4 rounded-2xl border border-gray-50 bg-gray-50/50 flex justify-between items-center group hover:bg-white hover:shadow-xl transition-all">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-700 text-lg shadow-sm">
                    {item.hours}h
                 </div>
                 <div>
                   <p className="text-[11px] font-black text-indigo-900 uppercase">{item.hours}h {item.minutes}m Claim</p>
                   <p className="text-[9px] text-gray-400 font-bold mt-0.5 tracking-tighter">
                     {format(new Date(item.date), 'MMMM dd, yyyy')}
                   </p>
                 </div>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                item.status === 'Approved' ? "bg-emerald-100 text-emerald-600" :
                item.status === 'Rejected' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
              )}>
                {item.status}
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <div className="py-24 text-center text-gray-300">
               <Timer className="mx-auto mb-2 opacity-20" size={48} />
               <p className="text-[10px] font-bold uppercase tracking-widest">No overtime logs</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- REVIEW REQUESTS ---
function ReviewRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [rejectionData, setRejectionData] = useState<{ id: string, type: string } | null>(null);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    const unsubLeaves = onSnapshot(query(collection(db, 'leaves'), where('status', '==', 'Pending')), (snap) => {
      const leaves = snap.docs.map(doc => ({ id: doc.id, type: 'leave', ...doc.data() }));
      setRequests(prev => {
        const others = prev.filter(r => r.type !== 'leave');
        return [...others, ...leaves].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      });
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'leaves');
    });

    const unsubOT = onSnapshot(query(collection(db, 'overtime'), where('status', '==', 'Pending')), (snap) => {
      const ots = snap.docs.map(doc => ({ id: doc.id, type: 'ot', ...doc.data() }));
      setRequests(prev => {
        const others = prev.filter(r => r.type !== 'ot');
        return [...others, ...ots].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      });
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'overtime');
    });

    const unsubOB = onSnapshot(query(collection(db, 'ob_requests'), where('status', '==', 'Pending')), (snap) => {
      const obs = snap.docs.map(doc => ({ id: doc.id, type: 'ob', ...doc.data() }));
      setRequests(prev => {
        const others = prev.filter(r => r.type !== 'ob');
        return [...others, ...obs].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      });
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'ob_requests');
    });

    return () => {
      unsubLeaves();
      unsubOT();
      unsubOB();
    };
  }, []);

  const handleAction = async (requestId: string, type: string, action: 'Approved' | 'Rejected') => {
    if (action === 'Rejected') {
      setRejectionData({ id: requestId, type });
      return;
    }

    try {
      const coll = type === 'leave' ? 'leaves' : type === 'ot' ? 'overtime' : 'ob_requests';
      await updateDoc(doc(db, coll, requestId), { status: action });
      toast.success(`Request marked as ${action}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${type}/${requestId}`);
    }
  };

  const confirmRejection = async () => {
    if (!rejectionData || !remarks.trim()) {
      toast.error("Please provide remarks for rejection");
      return;
    }

    try {
      const coll = rejectionData.type === 'leave' ? 'leaves' : rejectionData.type === 'ot' ? 'overtime' : 'ob_requests';
      await updateDoc(doc(db, coll, rejectionData.id), { 
        status: 'Rejected',
        remarks: remarks.trim()
      });
      toast.success("Request rejected with remarks");
      setRejectionData(null);
      setRemarks('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${rejectionData.type}/${rejectionData.id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-black text-emerald-900 uppercase tracking-tight">Review Requests</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Pending Leave, OT & OB Applications</p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
           {requests.length} Pending
        </div>
      </div>
      
      <div className="space-y-4">
        {requests.map(req => (
          <motion.div 
            key={req.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:shadow-xl hover:border-emerald-500/20 transition-all duration-500"
          >
            <div className="flex gap-4 items-center">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner",
                req.type === 'leave' ? "bg-emerald-50 text-emerald-600" : 
                req.type === 'ot' ? "bg-indigo-50 text-indigo-600" : "bg-amber-50 text-amber-600"
              )}>
                {req.type === 'leave' ? req.leaveType[0] : req.type === 'ot' ? 'OT' : 'OB'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                   <h4 className="text-[13px] font-black uppercase text-gray-900 leading-none">{req.userName}</h4>
                   <span className={cn(
                     "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter",
                     req.type === 'leave' ? "bg-emerald-100 text-emerald-600" : 
                     req.type === 'ot' ? "bg-indigo-100 text-indigo-600" : "bg-amber-100 text-amber-600"
                   )}>{req.type.toUpperCase()}</span>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                  {req.type === 'leave' ? (
                    `${req.leaveType}: ${format(new Date(req.startDate), 'MMM dd')} - ${format(new Date(req.endDate), 'MMM dd, yyyy')}`
                  ) : req.type === 'ot' ? (
                    `Overtime Claim: ${format(new Date(req.date), 'MMMM dd, yyyy')} (${req.hours}h ${req.minutes}m)`
                  ) : (
                    `Official Business: ${format(new Date(req.startDate), 'MMM dd')} - ${format(new Date(req.endDate), 'MMM dd, yyyy')} (${req.hours || 0}h ${req.minutes || 0}m)`
                  )}
                </p>
                <div className="relative pt-3 mt-3 border-t border-gray-50 flex items-start gap-2">
                   <p className="text-[11px] text-gray-600 italic line-clamp-2 max-w-sm">"{req.reason}"</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto h-12">
              <button 
                onClick={() => handleAction(req.id, req.type, 'Approved')}
                className="flex-1 md:flex-none px-8 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-700/20 hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95"
              >
                Approve
              </button>
              <button 
                onClick={() => handleAction(req.id, req.type, 'Rejected')}
                className="flex-1 md:flex-none px-8 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-100 transition-all active:scale-95"
              >
                Reject
              </button>
            </div>
          </motion.div>
        ))}
        {requests.length === 0 && (
          <div className="py-32 text-center text-gray-300">
             <ClipboardCheck className="mx-auto mb-4 opacity-10" size={64} />
             <p className="text-[10px] font-black uppercase tracking-[0.3em]">All caught up!</p>
             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-2">No pending applications for review</p>
          </div>
        )}
      </div>

      {/* Rejection Remarks Modal */}
      <AnimatePresence>
        {rejectionData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRejectionData(null)}
              className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 p-8"
            >
              <div className="text-center space-y-4 mb-8">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
                   <XCircle size={32} className="text-red-500" />
                </div>
                <h3 className="text-2xl font-black text-red-900 uppercase tracking-tighter">Rejection Remarks</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Please indicate why this request is being rejected</p>
              </div>

              <div className="space-y-4">
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter rejection reason..."
                  className="w-full h-32 bg-gray-50 border-2 border-red-50 rounded-2xl p-4 text-xs font-bold focus:border-red-500 focus:outline-none transition-all resize-none"
                  autoFocus
                />

                <div className="flex gap-4">
                  <button
                    onClick={() => setRejectionData(null)}
                    className="flex-1 h-12 border-2 border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRejection}
                    disabled={!remarks.trim()}
                    className="flex-1 h-12 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-900/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    Confirm Reject
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string, value: number | string, icon: React.ReactNode }) {
  return (
    <div className="glass-card glass-card-hover p-6 rounded-2xl flex items-center space-x-4 transition-all duration-300">
      <div className="w-12 h-12 bg-white/40 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-xs">
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-extrabold text-emerald-950">{value}</p>
      </div>
    </div>
  );
}

function AssignAccount() {
  const [loading, setLoading] = useState(false);
  const [ciOfficers, setCiOfficers] = useState<UserProfile[]>([]);
  const [formData, setFormData] = useState({
    borrowerName: '',
    mobileNumber: '',
    accountType: 'New',
    location: '',
    tribe: 'NCR',
    businessPin: '',
    addressPin: '',
    requestedAmount: '',
    term: '',
    intRate: '',
    mop: 'Weekly',
    top: 'Collection',
    ciOfficerId: '',
    isMCLReferral: false,
    loanCategory: 'SME' as LoanCategory
  });

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const officers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserProfile[];
      setCiOfficers(officers);
    }, (err) => {
      console.error('Firestore AssignAccount listener error:', err);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const officer = ciOfficers.find(o => o.id === formData.ciOfficerId);
      const res = await api.post('/api/assignments', {
        ...formData,
        requestedAmount: Number(formData.requestedAmount),
        intRate: Number(formData.intRate),
        ciOfficerName: officer?.fullName || 'Unknown',
        status: 'Assigned',
        loanCategory: formData.loanCategory,
        timeline: [{
          status: 'Assigned',
          note: `Account assigned to ${officer?.fullName || 'Officer'}`,
          timestamp: new Date().toISOString()
        }]
      });
      
      if (res?.id) {
        await createNotification(
          formData.ciOfficerId,
          'New Assignment',
          `You have been assigned to evaluate ${formData.borrowerName}`,
          'assignment',
          res.id
        );
      }
      alert('Account assigned successfully!');
      setFormData({
        borrowerName: '',
        mobileNumber: '',
        accountType: 'New',
        location: '',
        tribe: 'NCR',
        businessPin: '',
        addressPin: '',
        requestedAmount: '',
        term: '',
        intRate: '',
        mop: 'Weekly',
        top: 'Collection',
        ciOfficerId: '',
        isMCLReferral: false,
        loanCategory: 'SME'
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Name of Borrower</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
              value={formData.borrowerName}
              onChange={e => setFormData({...formData, borrowerName: e.target.value})}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mobile Number</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
              value={formData.mobileNumber}
              onChange={e => setFormData({...formData, mobileNumber: e.target.value})}
              placeholder="e.g. 09123456789"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Business Pin.</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
              value={formData.businessPin}
              onChange={e => setFormData({...formData, businessPin: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Requested Loan Amount</label>
            <input 
              type="number" 
              className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
              value={formData.requestedAmount}
              onChange={e => setFormData({...formData, requestedAmount: e.target.value})}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Int. Rate (%)</label>
            <input 
              type="number" 
              step="0.01"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
              value={formData.intRate}
              onChange={e => setFormData({...formData, intRate: e.target.value})}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TOP</label>
            <select 
              className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
              value={formData.top}
              onChange={e => setFormData({...formData, top: e.target.value as any})}
            >
              <option value="Collection">Collection</option>
              <option value="PDC">PDC</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account Type</label>
            <select 
              className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
              value={formData.accountType}
              onChange={e => setFormData({...formData, accountType: e.target.value as any})}
            >
              <option value="New">New</option>
              <option value="Renewal">Renewal</option>
              <option value="Restructure">Restructure</option>
              <option value="Additional">Additional</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tribe</label>
            <select 
              className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
              value={formData.tribe}
              onChange={e => setFormData({...formData, tribe: e.target.value as any})}
            >
              <option value="NCR">NCR</option>
              <option value="Rizal">Rizal</option>
              <option value="Mindoro">Mindoro</option>
              <option value="Cavite">Cavite</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loan Category</label>
            <select 
              className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm font-black text-emerald-800"
              value={formData.loanCategory}
              onChange={e => setFormData({...formData, loanCategory: e.target.value as LoanCategory})}
            >
              <option value="SME">SME (Standard)</option>
              <option value="MCL">MCL (Motorcycle Loan)</option>
              <option value="Seaman">Seaman's Loan</option>
            </select>
          </div>
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border-2 border-emerald-100/50">
              <input 
                type="checkbox" 
                id="isMCLReferral"
                className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                checked={formData.isMCLReferral}
                onChange={e => setFormData({...formData, isMCLReferral: e.target.checked})}
              />
              <label htmlFor="isMCLReferral" className="text-[10px] font-black text-emerald-800 uppercase tracking-widest cursor-pointer select-none">
                MCL Referral (Points: 2)
              </label>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Address Pin.</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
              value={formData.addressPin}
              onChange={e => setFormData({...formData, addressPin: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Term</label>
            <input 
              type="text" 
              placeholder="e.g. 12 Months"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
              value={formData.term}
              onChange={e => setFormData({...formData, term: e.target.value})}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">MOP</label>
            <select 
              className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
              value={formData.mop}
              onChange={e => setFormData({...formData, mop: e.target.value as any})}
            >
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Semi-Monthly">Semi-Monthly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CI Officer</label>
            <select 
              className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
              value={formData.ciOfficerId}
              onChange={e => setFormData({...formData, ciOfficerId: e.target.value})}
              required
            >
              <option value="">Select Officer</option>
              {ciOfficers.map(o => (
                <option key={o.id} value={o.id}>{o.fullName} ({o.role})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="col-span-2 pt-4">
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 transition-all uppercase tracking-widest text-xs shadow-lg shadow-emerald-900/10"
          >
            {loading ? 'Assigning...' : 'Confirm Assignment'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function EditAssignmentModal({ assignment, ciOfficers, onClose }: { assignment: Assignment, ciOfficers: UserProfile[], onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    borrowerName: assignment.borrowerName,
    mobileNumber: assignment.mobileNumber,
    accountType: assignment.accountType,
    location: assignment.location,
    tribe: assignment.tribe,
    businessPin: assignment.businessPin || '',
    addressPin: assignment.addressPin || '',
    requestedAmount: String(assignment.requestedAmount),
    term: assignment.term,
    intRate: String(assignment.intRate),
    mop: assignment.mop,
    top: assignment.top,
    ciOfficerId: assignment.ciOfficerId
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const officer = ciOfficers.find(o => o.id === formData.ciOfficerId);
      await api.patch(`/api/assignments/${assignment.id}`, {
        ...formData,
        requestedAmount: Number(formData.requestedAmount),
        intRate: Number(formData.intRate),
        ciOfficerName: officer?.fullName || 'Unknown'
      });
      alert('Assignment updated successfully!');
      onClose();
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to update assignment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl p-8 overflow-y-auto max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xl font-black text-emerald-800 uppercase tracking-tight">Edit Assignment</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Modification Panel</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Name of Borrower</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold"
                value={formData.borrowerName}
                onChange={e => setFormData({...formData, borrowerName: e.target.value})}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mobile Number</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold"
                value={formData.mobileNumber}
                onChange={e => setFormData({...formData, mobileNumber: e.target.value})}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Requested Loan Amount</label>
              <input 
                type="number" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold"
                value={formData.requestedAmount}
                onChange={e => setFormData({...formData, requestedAmount: e.target.value})}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Int. Rate (%)</label>
              <input 
                type="number" 
                step="0.01"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold"
                value={formData.intRate}
                onChange={e => setFormData({...formData, intRate: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account Type</label>
              <select 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold"
                value={formData.accountType}
                onChange={e => setFormData({...formData, accountType: e.target.value as any})}
              >
                <option value="New">New</option>
                <option value="Renewal">Renewal</option>
                <option value="Restructure">Restructure</option>
                <option value="Additional">Additional</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Term</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold"
                value={formData.term}
                onChange={e => setFormData({...formData, term: e.target.value})}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">MOP</label>
              <select 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold"
                value={formData.mop}
                onChange={e => setFormData({...formData, mop: e.target.value as any})}
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Semi-Monthly">Semi-Monthly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TOP</label>
              <select 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold"
                value={formData.top}
                onChange={e => setFormData({...formData, top: e.target.value as any})}
              >
                <option value="Collection">Collection</option>
                <option value="PDC">PDC</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CI Officer</label>
              <select 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold"
                value={formData.ciOfficerId}
                onChange={e => setFormData({...formData, ciOfficerId: e.target.value})}
                required
              >
                {ciOfficers.map(o => (
                  <option key={o.id} value={o.id}>{o.fullName} ({o.role})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="md:col-span-2 pt-6">
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-emerald-900/20"
            >
              {loading ? 'MODIFICATION IN PROGRESS...' : 'COMMIT CHANGES'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function AccountStatus({ user }: { user: UserProfile }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [accountTypeFilter, setAccountTypeFilter] = useState('All');
  const [isEditing, setIsEditing] = useState(false);
  const [isViewingAccount, setIsViewingAccount] = useState(false);
  const [ciOfficers, setCiOfficers] = useState<UserProfile[]>([]);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [targetToArchive, setTargetToArchive] = useState<Assignment | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const officers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserProfile[];
      setCiOfficers(officers);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let q = query(collection(db, 'assignments'), orderBy('createdAt', 'desc'));
    
    if (user.role !== 'admin' && user.role !== 'coordinator') {
      q = query(
        collection(db, 'assignments'),
        where('ciOfficerId', '==', user.id),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Assignment[];
      setAssignments(data);
      setLoading(false);
    }, (err) => {
      console.error('Firestore AccountStatus listener error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.id, user.role]);

  useEffect(() => {
    if (selected) {
      const updated = assignments.find(a => a.id === selected.id);
      if (updated && (updated.status !== selected.status || JSON.stringify(updated.timeline) !== JSON.stringify(selected.timeline))) {
        setSelected(updated);
      }
    }
  }, [assignments, selected]);

  const handleDenyReportSubmitted = async (assignment: Assignment) => {
    if (!confirm(`Are you sure you want to deny ${assignment.borrowerName}?`)) return;
    const newTimeline = [...assignment.timeline, { step: 'Denied', timestamp: new Date().toISOString() }];
    try {
      await api.patch(`/api/assignments/${assignment.id}`, {
        status: 'Denied',
        timeline: newTimeline
      });

      await createNotification(
        assignment.ciOfficerId,
        'Account Denied',
        `The application for ${assignment.borrowerName} has been DENIED by the Admin instead of pre-approval.`,
        'status_change',
        assignment.id
      );
    } catch (err) {
      console.error(err);
      alert('Failed to deny application.');
    }
  };

  const handleNextStep = async (assignment: Assignment) => {
    const isMCL = assignment.loanCategory === 'MCL';
    if (assignment.status === 'Field CIBI' && ((isMCL && !assignment.mclCreditScore) || (!isMCL && !assignment.creditScore))) {
      alert('Please complete and save the Credit Scoring before proceeding to the next step.');
      return;
    }

    if (assignment.status === 'Cashflowing' && !assignment.cashflowReport) {
      alert('Please complete and save the Cashflow Report before proceeding to the next step.');
      return;
    }

    const currentIndex = steps.indexOf(assignment.status);
    if (currentIndex === -1 || currentIndex >= steps.length - 1) return;

    const nextStatus = steps[currentIndex + 1] as AssignmentStatus;
    const newTimeline = [...assignment.timeline, { step: nextStatus, timestamp: new Date().toISOString() }];
    
    try {
      await api.patch(`/api/assignments/${assignment.id}`, {
        status: nextStatus,
        timeline: newTimeline
      });

      // Notify relevant parties
      if (user.role === 'admin' || user.role === 'coordinator') {
        await createNotification(
          assignment.ciOfficerId,
          'Status Update',
          `${user.role === 'admin' ? 'Admin' : 'Coordinator'} updated ${assignment.borrowerName} to ${nextStatus}`,
          'status_change',
          assignment.id
        );
      } else {
        const adminsSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
        adminsSnapshot.forEach(adminDoc => {
          createNotification(
            adminDoc.id,
            'Status Update',
            `CI Officer ${user.fullName} updated ${assignment.borrowerName} to ${nextStatus}`,
            'status_change',
            assignment.id
          );
        });
      }
      // Refresh UI by letting Firestore onSnapshot update the state
      // window.location.reload(); 
    } catch (err) {
      console.error(err);
    }
  };

  const initiateArchive = (assignment: Assignment) => {
    setTargetToArchive(assignment);
    setArchiveReason('');
    setIsArchiving(true);
  };

  const handleArchiveConfirm = async () => {
    if (!targetToArchive) return;
    if (!archiveReason.trim()) {
      alert('Please enter a remark or reason for archiving the account.');
      return;
    }
    const newTimeline = [...targetToArchive.timeline, { step: 'Archived', timestamp: new Date().toISOString() }];
    try {
      await api.patch(`/api/assignments/${targetToArchive.id}`, {
        status: 'Archived',
        archiveReason: archiveReason.trim(),
        timeline: newTimeline
      });

      await createNotification(
        targetToArchive.ciOfficerId,
        'Account Archived',
        `The application for ${targetToArchive.borrowerName} has been archived. Reason: ${archiveReason.trim()}`,
        'status_change',
        targetToArchive.id
      );

      // Show alert & sync local state if selected
      alert('Client archived successfully.');
      if (selected?.id === targetToArchive.id) {
        setSelected({ ...targetToArchive, status: 'Archived', archiveReason: archiveReason.trim(), timeline: newTimeline });
      }
      setIsArchiving(false);
      setTargetToArchive(null);
    } catch (err) {
      console.error(err);
      alert('Failed to archive application.');
    }
  };

  const filtered = assignments.filter(a => {
    if (statusFilter === 'Archived') {
      const matchesSearch = a.borrowerName.toLowerCase().includes(search.toLowerCase()) ||
                           a.mobileNumber.includes(search);
      const matchesType = accountTypeFilter === 'All' || a.accountType === accountTypeFilter;
      return a.status === 'Archived' && matchesSearch && matchesType;
    }
    
    if (a.status === 'Completed' || a.status === 'Denied' || a.status === 'Archived') return false;
    const matchesSearch = a.borrowerName.toLowerCase().includes(search.toLowerCase()) ||
                         a.mobileNumber.includes(search);
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    const matchesType = accountTypeFilter === 'All' || a.accountType === accountTypeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await api.delete(`/api/assignments/${id}`);
      setSelected(null);
      alert('Assignment deleted successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to delete assignment.');
    }
  };

  const isMobileView = window.innerWidth < 1024;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[500px] lg:h-[calc(100vh-160px)]">
      {/* List */}
      {(!selected || !isMobileView) && (
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 space-y-4">
            <h3 className="text-xs font-black text-emerald-800 uppercase tracking-[0.2em]">Assigned Clients</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search borrower or mobile..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select 
                className="px-2 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold uppercase focus:outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                {steps.filter(s => s !== 'Completed' && s !== 'Denied').map(s => <option key={s} value={s}>{s}</option>)}
                {(user.role === 'admin' || user.role === 'coordinator') && (
                  <option value="Archived">Archived</option>
                )}
              </select>
              <select 
                className="px-2 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold uppercase focus:outline-none"
                value={accountTypeFilter}
                onChange={(e) => setAccountTypeFilter(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="New">New</option>
                <option value="Renewal">Renewal</option>
                <option value="Restructure">Restructure</option>
                <option value="Additional">Additional</option>
              </select>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map((a) => (
              <div
                key={a.id}
                onClick={() => setSelected(a)}
                className={cn(
                  "w-full p-6 text-left border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer",
                  selected?.id === a.id && "bg-emerald-50 border-l-4 border-l-emerald-600"
                )}
              >
                <h4 className="font-bold text-sm uppercase">{a.borrowerName}</h4>
                <p className="text-[10px] text-gray-500 font-bold mb-1 flex items-center gap-1">
                  <Phone size={10} /> {a.mobileNumber}
                </p>
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[8px] font-black uppercase px-2 py-1 rounded-full",
                      a.status === 'Completed' ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                    )}>
                      {a.status}
                    </span>
                    {user.role === 'admin' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(a.id);
                        }}
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">{a.accountType} • {a.ciOfficerName}</p>
              </div>
            ))}
            {filtered.length === 0 && !loading && (
              <div className="p-12 text-center text-gray-300">
                <AlertCircle className="mx-auto mb-2" size={32} />
                <p className="text-[10px] font-bold uppercase tracking-widest">No assignments found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Details */}
      {(selected || !isMobileView) && (
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-8 overflow-y-auto">
          {selected ? (
            <div className="space-y-12">
              {isMobileView && (
                <button 
                  onClick={() => setSelected(null)} 
                  className="flex items-center gap-2 mb-6 text-emerald-805 text-emerald-800 font-black uppercase text-[10px] bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-100/50 cursor-pointer"
                >
                  <ChevronRight className="rotate-180" size={14} /> Back to clients list
                </button>
              )}
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-emerald-800">{selected.borrowerName}</h2>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">CI OFFICER: {selected.ciOfficerName}</p>
                  <p className="text-xs text-emerald-600 uppercase tracking-widest font-black flex items-center gap-1">
                    <Phone size={12} /> {selected.mobileNumber}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsViewingAccount(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border border-emerald-100"
                >
                  <FileText size={14} /> View Account Information
                </button>
                <button 
                  onClick={() => generateAssignmentPPT(selected)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                  title="Generate PowerPoint Presentation"
                >
                  <Presentation size={14} /> PPT
                </button>
                {user.role === 'admin' && selected.status !== 'Archived' && (
                  <button 
                    onClick={() => initiateArchive(selected)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border border-amber-200"
                    title="Archive this client application"
                  >
                    <Archive size={14} /> Archive Client
                  </button>
                )}
                {(user.role === 'user' || (user.role === 'admin' && selected.ciOfficerId === user.id)) && selected.status !== 'Completed' && selected.status !== 'Approved' && selected.status !== 'Denied' && selected.status !== 'Report Submitted' && selected.status !== 'Pre-approved' && (
                <button 
                  onClick={() => handleNextStep(selected)}
                  className="px-6 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10"
                >
                  Mark Next Step as Done
                </button>
              )}
              {user.role === 'admin' && selected.status === 'Report Submitted' && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleDenyReportSubmitted(selected)}
                    className="px-6 py-2 bg-red-650 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
                  >
                    Deny Client
                  </button>
                  <button 
                    onClick={() => handleNextStep(selected)}
                    className="px-6 py-2 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
                  >
                    Confirm & Pre-approve
                  </button>
                </div>
              )}
              {user.role === 'admin' && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-gray-400 hover:text-emerald-700 transition-colors"
                  >
                    <Pencil size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(selected.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

            {/* Visual Stepper */}
            {selected.status === 'Archived' ? (
              <div className="mb-6 p-6 bg-amber-50/70 border border-amber-200/60 rounded-2xl text-amber-900 text-xs flex flex-col gap-3 shadow-xs">
                <div className="flex items-center gap-2.5 text-amber-700 font-extrabold uppercase tracking-widest text-[10px]">
                  <AlertCircle size={16} className="text-amber-600 animate-pulse" />
                  <span>Client Application Archived (Will Not Proceed)</span>
                </div>
                <div className="bg-white/90 p-4 rounded-xl border border-amber-100 shadow-3xs">
                  <p className="text-[8px] text-amber-600 font-black uppercase tracking-widest mb-1.5">Official Archive Remarks / Reason:</p>
                  <p className="text-xs font-semibold leading-relaxed text-slate-850 italic">
                    "{selected.archiveReason || 'No specific reason was logged.'}"
                  </p>
                </div>
              </div>
            ) : null}
            <div className="relative pt-12 pb-8">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2" />
              <div 
                className="absolute top-1/2 left-0 h-1 bg-green-500 -translate-y-1/2 transition-all duration-500" 
                style={{ width: `${selected.status === 'Archived' ? 0 : (steps.indexOf(selected.status) / (steps.length - 1)) * 100}%` }}
              />
              <div className="relative flex justify-between">
                {steps.map((step, idx) => {
                  const isCompleted = selected.status !== 'Archived' && steps.indexOf(selected.status) >= idx;
                  const isCurrent = selected.status === step;
                  return (
                    <div key={step} className="flex flex-col items-center space-y-4">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center border-4 transition-all duration-300 z-10",
                        isCompleted ? "bg-green-500 border-green-100" : "bg-white border-gray-100",
                        isCurrent && "ring-4 ring-green-100"
                      )}>
                        {isCompleted && <Check size={14} className="text-white" />}
                      </div>
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-tighter text-center w-16",
                        isCompleted ? "text-green-600" : "text-gray-300"
                      )}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline List */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Full History Log</h4>
              <div className="space-y-3">
                {[...selected.timeline].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map((entry, idx) => (
                  <div key={idx} className="flex flex-col space-y-1 p-3 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-black uppercase tracking-widest text-emerald-800">
                        {entry.step}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-gray-500">
                        {format(new Date(entry.timestamp), 'MMM d, yyyy | h:mm:ss a')}
                      </span>
                    </div>
                    {entry.note && (
                      <p className="text-[10px] text-gray-400 italic">
                        {entry.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Total Turn Around Time:</span>
                <span className="text-sm font-black text-gray-900">{calculateTAT(selected.timeline)}</span>
              </div>
            </div>

            {/* Performance History Graph */}
            {selected.cashflowHistory && selected.cashflowHistory.length > 0 && (
              <PerformanceGraph history={selected.cashflowHistory} />
            )}

            {/* Credit Scoring Module */}
            {(selected.status === 'Field CIBI' || selected.creditScore) && (
              <CreditScoringModule assignment={selected} user={user} />
            )}

            {/* Cashflow Module */}
            {(selected.status === 'Cashflowing' || selected.cashflowReport) && (
              <CashflowModule assignment={selected} user={user} />
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4">
            <ClipboardList size={64} strokeWidth={1} />
            <p className="text-xs font-bold uppercase tracking-widest">Select a client to view status</p>
          </div>
        )}
      </div>
      )}

      <AnimatePresence>
        {isEditing && selected && (
          <EditAssignmentModal 
            assignment={selected} 
            ciOfficers={ciOfficers} 
            onClose={() => setIsEditing(false)} 
          />
        )}
        {isViewingAccount && selected && (
          <AccountDossierModal 
            assignment={selected} 
            onClose={() => setIsViewingAccount(false)} 
          />
        )}
        {isArchiving && targetToArchive && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn select-text">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 flex flex-col space-y-6"
            >
              <div className="flex items-center gap-3 text-amber-600">
                <div className="p-3 bg-amber-50 rounded-2xl">
                  <Archive size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase">Archive Client Account</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Client: {targetToArchive.borrowerName}</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">
                Archiving this client marks their application as discontinued. To proceed, please specify the exact reason or remarks regarding why this application is discontinued.
              </p>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Reason / Remarks for Archiving</label>
                <textarea 
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  placeholder="e.g., Client decided not to proceed, duplicate application, unreachable contact details, etc..."
                  className="w-full h-28 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  required
                />
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => { setIsArchiving(false); setTargetToArchive(null); }}
                  className="w-1/2 py-3.5 bg-slate-100 text-slate-750 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleArchiveConfirm}
                  className="w-1/2 py-3.5 bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-700 transition-all cursor-pointer shadow-lg shadow-amber-900/10"
                >
                  Confirm Archive
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Custom parser to translate AI analysis markdown to beautiful styled React elements
function MarkdownViewer({ content }: { content: string }) {
  if (!content) return null;
  
  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-extrabold text-emerald-950">{part}</strong>;
      }
      return part;
    });
  };

  // Split into sections (paragraphs, headers, or lists)
  const sections = content.split('\n\n');
  
  return (
    <div className="space-y-5 text-xs text-gray-700 leading-relaxed font-sans select-text">
      {sections.map((section, idx) => {
        const trimmed = section.trim();
        if (!trimmed) return null;
        
        // Headers (e.g. ### 1. Financial Profile)
        if (trimmed.startsWith('###')) {
          const headerText = trimmed.replace(/^###\s*/, '');
          return (
            <h4 key={idx} className="text-sm font-black text-emerald-900 uppercase tracking-widest mt-8 first:mt-0 border-b border-emerald-100 pb-2">
              {headerText}
            </h4>
          );
        }
        
        // Bullet points
        if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const lines = trimmed.split('\n');
          return (
            <ul key={idx} className="space-y-2.5 pl-1 my-3 bg-gray-50/30 p-4 rounded-xl border border-gray-100">
              {lines.map((line, lIdx) => {
                const bulletText = line.replace(/^[-*]\s*/, '');
                return (
                  <li key={lIdx} className="flex items-start gap-2.5 text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-2" />
                    <span className="text-[11px] leading-relaxed font-medium">{parseBoldText(bulletText)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }
        
        // Regular Paragraphs
        return (
          <p key={idx} className="text-gray-600 leading-relaxed text-[11px] font-medium text-justify">
            {parseBoldText(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

// Executive dashboard summary metric parser for prompt comments
function AiSummaryHighlight({ content }: { content: string }) {
  if (!content) return null;

  let summarySection = '';
  const match = content.match(/(?:###?\s*.*[Ss]ummary\s*[Rr]eport|Summary Report|###\s*4\.\s*Summary\s*Report)[\s\S]*/i);
  if (match) {
    summarySection = match[0];
  } else {
    return null;
  }

  const bulletLines = summarySection
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('-') || l.startsWith('*') || /^\d+\./.test(l));

  if (bulletLines.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-5 mb-5 shadow-lg relative overflow-hidden text-left">
      <div className="absolute inset-0 bg-radial from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="flex items-center gap-2 mb-4 relative z-10">
        <span className="text-emerald-400 font-extrabold text-sm">✨</span>
        <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-400">Executive Diagnostics Summary</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 relative z-10">
        {bulletLines.map((line, idx) => {
          const cleanLine = line.replace(/^[-*\d.\s]+/, '').trim();
          let label = '';
          let value = '';
          
          if (cleanLine.includes('**')) {
            const parts = cleanLine.split('**');
            if (parts.length >= 3) {
              label = parts[1].replace(':', '').trim();
              value = parts.slice(2).join('').trim();
            }
          }
          
          if (!label && cleanLine.includes(':')) {
            const colonIndex = cleanLine.indexOf(':');
            label = cleanLine.substring(0, colonIndex).trim();
            value = cleanLine.substring(colonIndex + 1).trim();
          }

          if (label && value) {
            return (
              <div key={idx} className="bg-slate-950/60 p-3 rounded-xl border border-white/10 flex flex-col justify-between shadow-xs hover:border-emerald-500/30 transition-all duration-300">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</span>
                <span className="text-[11px] font-black text-emerald-300">{value}</span>
              </div>
            );
          }

          return (
            <div key={idx} className="bg-slate-950/60 p-3 rounded-xl border border-white/10 text-[10px] font-bold text-slate-200">
              {cleanLine}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// UI Copilot analysis Component using the server-side proxy
function AiAccountAnalysis({ assignment }: { assignment: Assignment }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(assignment.aiAnalysis || null);
  const [error, setError] = useState<string | null>(null);

  // Sync dynamic changes
  useEffect(() => {
    if (assignment.aiAnalysis) {
      setAnalysis(assignment.aiAnalysis);
    } else {
      setAnalysis(null);
    }
  }, [assignment.id, assignment.aiAnalysis]);

  const handleRunAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/gemini/analyze-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignment }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete AI report generation.');
      }
      
      setAnalysis(data.analysis);
      
      // Sells back dynamically to Firestore using standard client SDK helpers
      await api.patch(`/api/assignments/${assignment.id}`, { aiAnalysis: data.analysis });
      toast.success('AI Credit investigation successfully compiled and saved!');
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || 'An unexpected error occurred during processing.');
      toast.error('Unable to finalize AI generation.');
    } finally {
      setLoading(false);
    }
  };

  const hasScoring = !!assignment.creditScore || !!assignment.mclCreditScore;
  const hasCashflow = !!assignment.cashflowReport;
  const isReady = hasScoring && hasCashflow;

  return (
    <div className="bg-emerald-50/20 rounded-[2rem] p-6 lg:p-8 border border-emerald-100/50 shadow-xs relative overflow-hidden select-text text-left">
      <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-bl from-emerald-100/20 to-transparent rounded-full pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10 border-b border-emerald-100/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-emerald-700 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800">
              AI Credit Copilot
            </span>
            <span className="px-2 py-0.5 bg-emerald-600 text-[8px] font-black text-white uppercase rounded-md tracking-wider">
              Gemini Active
            </span>
          </div>
          <h4 className="text-lg font-black text-emerald-950 uppercase tracking-tight">
            Automated Risk & Capacity Review
          </h4>
          <div className="flex flex-wrap gap-2 text-[8px] font-black uppercase tracking-wider mt-1">
            <span className={hasScoring ? 'text-emerald-700' : 'text-amber-700'}>
              • Credit Score: {hasScoring ? 'Complete' : 'Missing'}
            </span>
            <span className={hasCashflow ? 'text-emerald-700' : 'text-amber-700'}>
              • Financial Cashflow: {hasCashflow ? 'Complete' : 'Missing'}
            </span>
          </div>
        </div>

        {!loading && (
          <button
            onClick={handleRunAnalysis}
            className="px-5 py-2.5 h-10 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-xs whitespace-nowrap active:scale-95 bg-emerald-800 text-white hover:bg-emerald-950 cursor-pointer"
          >
            <TrendingUp size={11} />
            {analysis ? 'Re-Run AI Intelligence' : 'Begin AI Assessment'}
          </button>
        )}
      </div>

      <div className="relative z-10 transition-all">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-100 animate-ping opacity-75" />
              <div className="absolute inset-0 rounded-full border-4 border-t-emerald-700 border-r-transparent border-l-transparent animate-spin" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-900 animate-pulse">
                Compiling Portfolio Metrics...
              </p>
              <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">
                Synthesizing risk grades, assets relative weight, and household disposable funds
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-[10px] font-black text-red-950 uppercase tracking-wide">
                Process Interrupted
               </h5>
               <p className="text-[10px] text-red-700">{error}</p>
               <button 
                 onClick={handleRunAnalysis}
                 className="text-[9px] font-black text-red-900 underline uppercase tracking-wider block mt-2 hover:text-red-950"
               >
                 Retry Analysis
               </button>
             </div>
           </div>
         ) : analysis ? (
           <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs/30 animate-fadeIn">
             <AiSummaryHighlight content={analysis} />
             <MarkdownViewer content={analysis} />
           </div>
         ) : (
           <div className="bg-gray-50/50 rounded-2xl p-8 border border-dashed border-gray-200 text-center space-y-4">
             <div className="max-w-md mx-auto space-y-2">
               <p className="text-xs font-bold text-gray-700 uppercase tracking-tight">
                 AI Advisor Unlocked
               </p>
               <p className="text-[10px] text-gray-400 font-semibold tracking-wider">
                 Synthesize details of liabilities, customer character scores, and net incomes to run a premium credit assessment report.
               </p>
             </div>

             {!isReady && (
               <div className="p-3 bg-amber-50/50 border border-amber-100/50 rounded-xl max-w-sm mx-auto text-[9px] font-bold text-amber-800 flex items-center gap-2 justify-center">
                 <AlertCircle size={10} className="shrink-0" />
                 <span>Note: This account is missing some scoring or cashflow reports. You can still run the AI diagnostic, but results might be limited.</span>
               </div>
             )}

             <button
               onClick={handleRunAnalysis}
               className="mt-2 px-6 py-2.5 bg-emerald-800 hover:bg-emerald-950 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-xs active:scale-95 inline-flex items-center gap-2 cursor-pointer"
             >
               <TrendingUp size={11} />
               Compile AI Credit Analysis
             </button>
           </div>
         )}
       </div>
     </div>
   );
 }

function AccountDossierModal({ assignment, onClose }: { assignment: Assignment, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-emerald-100 flex flex-col"
      >
        <div className="bg-linear-to-r from-emerald-800 to-emerald-900 p-8 text-white flex justify-between items-center shrink-0">
           <div>
             <h3 className="text-xl font-black uppercase tracking-tight">Main Account Repository</h3>
             <p className="text-[10px] text-white/50 font-bold uppercase tracking-[0.4em] mt-1">Classification: Confidential Dossier</p>
           </div>
           <button onClick={onClose} className="hover:rotate-90 transition-transform bg-white/10 p-2 rounded-xl">
             <X size={20} />
           </button>
        </div>
        
        <div className="p-8 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
            {/* Left Column */}
            <div className="space-y-5">
              {[
                { label: 'Name of Borrower', value: assignment.borrowerName },
                { label: 'Mobile Number', value: assignment.mobileNumber, placeholder: 'e.g. 09123456789' },
                { label: 'Location', value: assignment.location },
                { label: 'Business Pin.', value: assignment.businessPin || '-' },
                { label: 'Requested Loan Amount', value: `₱${assignment.requestedAmount.toLocaleString()}` },
                { label: 'Int. Rate (%)', value: `${assignment.intRate}%` },
                { label: 'TOP', value: assignment.top },
              ].map((field, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{field.label}</label>
                  <div className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-lg text-xs font-bold text-gray-800 uppercase">
                    {field.value || field.placeholder}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account Type</label>
                <div className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-lg text-xs font-bold text-gray-800 uppercase flex justify-between items-center">
                  <span>{assignment.accountType}</span>
                  <ChevronRight size={14} className="rotate-90 text-gray-400" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tribe</label>
                <div className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-lg text-xs font-bold text-gray-800 uppercase flex justify-between items-center">
                  <span>{assignment.tribe}</span>
                  <ChevronRight size={14} className="rotate-90 text-gray-400" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loan Category</label>
                <div className="w-full px-4 py-2.5 bg-emerald-50/30 border border-emerald-100 rounded-lg text-xs font-black text-emerald-800 uppercase flex justify-between items-center">
                  <span>{assignment.loanCategory}</span>
                  <ChevronRight size={14} className="rotate-90 text-emerald-600" />
                </div>
              </div>

              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center gap-3">
                <div className={cn(
                  "w-5 h-5 rounded border flex items-center justify-center transition-colors shadow-sm",
                  assignment.isMCLReferral ? "bg-emerald-600 border-emerald-600" : "bg-white border-gray-200"
                )}>
                  {assignment.isMCLReferral && <Check size={12} className="text-white" />}
                </div>
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">
                  MCL Referral (Points: 2)
                </span>
              </div>

              {[
                { label: 'Address Pin.', value: assignment.addressPin || '-' },
                { label: 'Term', value: `${assignment.term} Months`, placeholder: 'e.g. 12 Months' },
                { label: 'MOP', value: assignment.mop },
                { label: 'CI Officer', value: assignment.ciOfficerName },
              ].map((field, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{field.label}</label>
                  <div className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-lg text-xs font-bold text-gray-800 uppercase flex justify-between items-center">
                    <span>{field.value || field.placeholder}</span>
                    {field.label === 'MOP' || field.label === 'CI Officer' ? <ChevronRight size={14} className="rotate-90 text-gray-400" /> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Assessment Segment directly inside primary dossier repository view */}
          <div className="mt-8 border-t border-gray-100 pt-8">
            <AiAccountAnalysis assignment={assignment} />
          </div>
        </div>

        <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-white border border-gray-200 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-100 transition-all active:scale-95 text-gray-600"
          >
            Leave Dossier
          </button>
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-emerald-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-900 transition-all hover:shadow-xl hover:shadow-emerald-900/20 active:scale-95"
          >
            Close Full View
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function CreditScoringModule({ assignment, user, isReadOnly: forceReadOnly }: { assignment: Assignment, user: UserProfile, isReadOnly?: boolean }) {
  const isMCL = assignment.loanCategory === 'MCL';
  const isSeaman = assignment.loanCategory === 'Seaman';
  const [dynamicSheet, setDynamicSheet] = useState<any>(null);
  const [classifications, setClassifications] = useState<any[]>(DEFAULT_CLASSIFICATIONS);
  const [sectionWeights, setSectionWeights] = useState<Record<string, number>>({});
  const [globalAdjustment, setGlobalAdjustment] = useState<number>(0);
  const [isLoadingSheet, setIsLoadingSheet] = useState(true);
  const [formData, setFormData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isBusinessEnabled, setIsBusinessEnabled] = useState(true);
  const [isViewingAccount, setIsViewingAccount] = useState(false);

  // Load Scoring Configuration
  useEffect(() => {
    const configType = isSeaman ? 'Seaman' : (isMCL ? 'MCL' : 'SME');
    const q = query(collection(db, 'scoringConfigs'), where('type', '==', configType), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let sheet;
      let classes = DEFAULT_CLASSIFICATIONS;
      let weights = {};
      let adjustment = 0;
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        sheet = docData.sections;
        classes = docData.classifications || DEFAULT_CLASSIFICATIONS;
        weights = docData.sectionWeights || {};
        adjustment = docData.globalAdjustment || 0;
      } else {
        sheet = isSeaman ? DEFAULT_SEAMAN_SCORING_SHEET : (isMCL ? DEFAULT_MCL_SCORING_SHEET : DEFAULT_SME_SCORING_SHEET);
      }
      setDynamicSheet(sheet);
      setClassifications(classes);
      setSectionWeights(weights);
      setGlobalAdjustment(adjustment);
      setIsLoadingSheet(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'scoringConfigs');
      setDynamicSheet(isSeaman ? DEFAULT_SEAMAN_SCORING_SHEET : (isMCL ? DEFAULT_MCL_SCORING_SHEET : DEFAULT_SME_SCORING_SHEET));
      setClassifications(DEFAULT_CLASSIFICATIONS);
      setSectionWeights({});
      setGlobalAdjustment(0);
      setIsLoadingSheet(false);
    });
    return () => unsubscribe();
  }, [isMCL, isSeaman]);

  const CURRENT_SHEET = dynamicSheet || (isSeaman ? DEFAULT_SEAMAN_SCORING_SHEET : (isMCL ? DEFAULT_MCL_SCORING_SHEET : DEFAULT_SME_SCORING_SHEET));

  useEffect(() => {
    if (!CURRENT_SHEET) return;

    if (isMCL && assignment.mclCreditScore) {
      const s = assignment.mclCreditScore;
      const answers = s.answers || {};
      setFormData({
        ...answers,
        isBusinessEnabled: s.isBusinessEnabled ?? true,
        ciRemarks: s.ciRemarks || '',
        recommendation: s.riskClassification === 'High Risk' ? 'Denied' : 'Approved'
      });
      setIsBusinessEnabled(s.isBusinessEnabled ?? true);
    } else if (!isMCL && assignment.creditScore) {
      const s = assignment.creditScore;
      const answers = s.answers || {};
      setFormData({
        ...s,
        ...answers,
        isBusinessEnabled: s.isBusinessEnabled ?? true,
        ciRemarks: s.ciRemarks || '',
        recommendation: s.recommendation || 'Approved'
      });
      setIsBusinessEnabled(s.isBusinessEnabled ?? true);
    } else {
      const initialState: any = { ciRemarks: '', recommendation: 'Approved', isBusinessEnabled: true };
      Object.values(CURRENT_SHEET).forEach((section: any) => {
        section.items.forEach((item: any) => {
          initialState[item.id] = item.options[0].l;
        });
      });
      setFormData(initialState);
      setIsBusinessEnabled(true);
    }
  }, [assignment.id, assignment.creditScore, assignment.mclCreditScore, isMCL, CURRENT_SHEET]);

  const calculateGrades = () => {
    if (!formData || !CURRENT_SHEET) return null;

    const grades: any = {};
    const businessSectionKey = (isMCL || isSeaman) ? 'EMPLOYMENT_BUSINESS' : 'BUSINESS_STATUS';
    
    let activeTotalMax = 0;
    let activeTotalEarned = 0;

    Object.entries(CURRENT_SHEET).forEach(([sectionKey, section]: [string, any]) => {
      const isBusinessSection = sectionKey === businessSectionKey;
      if (isBusinessSection && !isBusinessEnabled) return;

      let sectionEarned = 0;
      section.items.forEach((item: any) => {
        const selectedLabel = formData[item.id];
        const option = item.options.find((o: any) => o.l === selectedLabel);
        if (option) {
          sectionEarned += option.p;
        }
      });

      // Apply section weight multiplier
      const weight = sectionWeights?.[sectionKey] !== undefined ? Number(sectionWeights[sectionKey]) : 1.0;
      const weightedMax = section.max * weight;
      const weightedEarned = sectionEarned * weight;

      grades[sectionKey] = sectionEarned; // Store actual unweighted grade
      activeTotalMax += weightedMax;
      activeTotalEarned += weightedEarned;
    });

    let riskScore = activeTotalMax > 0 ? (activeTotalEarned / activeTotalMax) * 100 : 0;
    
    // Apply global grading adjustment offset percentage
    const baseRiskScore = riskScore;
    riskScore = Math.max(0, Math.min(100, riskScore + Number(globalAdjustment || 0)));

    // Categorize dynamically using custom classifications sorted by threshold points
    const sortedClassifications = [...(classifications && classifications.length > 0 ? classifications : DEFAULT_CLASSIFICATIONS)]
      .sort((a, b) => Number(b.minScore) - Number(a.minScore));

    const classificationObj = sortedClassifications.find(c => riskScore >= Number(c.minScore)) 
      || sortedClassifications[sortedClassifications.length - 1];

    const riskClassification = classificationObj ? classificationObj.name : 'High Risk';
    const autoRecommendation = classificationObj ? classificationObj.recommendation : 'Denied';
    const classificationColor = classificationObj ? (classificationObj.color || 'text-red-600') : 'text-red-500';
    const classificationBg = classificationObj ? (classificationObj.bg || 'bg-red-50') : 'bg-red-50';

    return { 
      sectionGrades: grades, 
      totalGrade: activeTotalEarned, 
      baseRiskScore,
      riskScore, 
      riskClassification,
      classificationColor,
      classificationBg,
      activeTotalMax,
      autoRecommendation
    };
  };

  const results = calculateGrades();
  const isReadOnly = forceReadOnly || (
    user.role !== 'admin' && (
      user.role !== 'user' || assignment.status !== 'Field CIBI'
    )
  );

  // Automatically update recommendation in formData if it changes based on score
  useEffect(() => {
    if (results && results.autoRecommendation && !isReadOnly) {
      if (formData.recommendation !== results.autoRecommendation) {
        setFormData((prev: any) => ({ ...prev, recommendation: results.autoRecommendation }));
      }
    }
  }, [results?.autoRecommendation, isReadOnly]);

  const handleSave = async () => {
    if (!results) return;
    setIsSaving(true);
    try {
      const { sectionGrades, totalGrade, riskScore, riskClassification } = results;
      
      const answers: Record<string, string> = {};
      Object.values(CURRENT_SHEET).forEach((section: any) => {
        section.items.forEach((item: any) => {
          if (formData[item.id]) answers[item.id] = formData[item.id];
        });
      });

      if (isMCL) {
        const mclScore = {
          answers,
          totalScore: totalGrade,
          riskClassification,
          ciRemarks: formData.ciRemarks,
          isBusinessEnabled,
          // Legacy keys for safety (though mostly relying on answers now)
          character: {}, incomeCapacity: {}, employmentBusiness: {}, residence: {}, loanFactors: {}
        };
        await updateDoc(doc(db, 'assignments', assignment.id), { mclCreditScore: mclScore });
      } else {
        const scoreData = {
          answers,
          sectionGrades,
          totalGrade,
          riskScore,
          recommendation: formData.recommendation,
          ciRemarks: formData.ciRemarks,
          isBusinessEnabled
        };
        await updateDoc(doc(db, 'assignments', assignment.id), { creditScore: scoreData });
      }
      
      await addDoc(collection(db, 'notifications'), {
        userId: 'admin',
        title: 'Credit Score Updated',
        message: `Credit score for ${assignment.borrowerName} has been updated by ${user.fullName}.`,
        type: 'status_change',
        assignmentId: assignment.id,
        read: false,
        createdAt: new Date().toISOString()
      });

      toast.success('Credit score saved successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save credit score');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingSheet || !formData || !results) return <div className="p-12 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Initializing scoring module...</div>;

  const { riskScore, riskClassification, classificationColor, totalGrade, sectionGrades, baseRiskScore } = results;

  return (
    <div className="bg-white border-2 border-emerald-100 rounded-3xl p-8 space-y-12">
      <div className="flex justify-between items-center border-b-4 border-emerald-50/50 pb-6">
        <div>
          <h3 className="text-xl font-black text-emerald-800 uppercase tracking-tight">
            {isSeaman ? "Seaman's Diagnostic Module" : (isMCL ? 'MCL Diagnostic Module' : 'SME Diagnostic Module')}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">
              Technical Assessment Protocol {isSeaman ? 'vSEA.1' : (isMCL ? 'vMCL.1' : 'vSME.2')}
            </p>
            <span className="text-gray-200">|</span>
            <button 
              onClick={() => setIsViewingAccount(true)}
              className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-800 transition-colors flex items-center gap-1"
            >
              <FileText size={10} /> View Account Dossier
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
            <span className="text-[10px] font-black text-emerald-800 uppercase">Business Status</span>
            <button
               disabled={isReadOnly}
               onClick={() => {
                 const newValue = !isBusinessEnabled;
                 setIsBusinessEnabled(newValue);
                 setFormData((prev: any) => ({ ...prev, isBusinessEnabled: newValue }));
               }}
               className={cn(
                 "relative w-10 h-5 rounded-full transition-all duration-300",
                 isBusinessEnabled ? "bg-emerald-600" : "bg-gray-300"
               )}
            >
              <div className={cn(
                "absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 shadow-sm",
                isBusinessEnabled ? "left-6" : "left-1"
              )} />
            </button>
            <span className="text-[10px] font-black text-emerald-700 w-12">{isBusinessEnabled ? 'ENABLED' : 'DISABLED'}</span>
          </div>
          <div className="w-px h-6 bg-gray-100" />
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase">Score</p>
            <p className="text-2xl font-black text-emerald-800">{totalGrade.toFixed(1)}</p>
          </div>
          <div className="w-px h-10 bg-gray-100" />
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase">Classification</p>
            <p className={cn(
               "text-lg font-black uppercase tracking-tight",
               classificationColor
            )}>
              {riskClassification}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {Object.entries(CURRENT_SHEET).map(([sectionKey, section]: [string, any]) => {
          const businessSectionKey = (isMCL || isSeaman) ? 'EMPLOYMENT_BUSINESS' : 'BUSINESS_STATUS';
          const isDisabled = sectionKey === businessSectionKey && !isBusinessEnabled;

          return (
            <section key={sectionKey} className={cn("space-y-6 transition-all duration-300", isDisabled && "opacity-30 grayscale blur-[1px] pointer-events-none")}>
              <div className="flex items-center gap-4">
                <h4 className="text-xs font-black text-emerald-800 bg-emerald-50 px-4 py-2 rounded-lg uppercase tracking-widest whitespace-nowrap flex items-center gap-2">
                  {sectionKey.replace(/_/g, ' ')}
                  {isDisabled && <ShieldCheck size={12} className="text-gray-400" />}
                </h4>
                <div className="h-px w-full bg-gray-100" />
                <span className="text-[10px] font-black text-gray-300">MAX: {section.max.toFixed(1)}</span>
              </div>

              {!isDisabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  {section.items.map((item: any) => (
                    <div key={item.id} className="space-y-3">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide leading-tight">{item.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {item.options.map((opt: any) => {
                          const isSelected = formData[item.id] === opt.l;
                          return (
                            <button
                              key={opt.l}
                              disabled={isReadOnly}
                              onClick={() => setFormData({ ...formData, [item.id]: opt.l })}
                              className={cn(
                                "px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all border-2",
                                isSelected 
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-900/20 scale-105" 
                                  : "bg-gray-50 text-gray-400 border-transparent hover:border-gray-200"
                              )}
                            >
                              {opt.l}
                              <span className={cn(
                                "ml-2 opacity-50",
                                isSelected ? "text-white" : "text-gray-300"
                              )}>[{opt.p}]</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t-4 border-emerald-500/5">
        <div className="space-y-4">
          <label className="text-xs font-black text-emerald-800 uppercase tracking-widest">Summary Grading Table</label>
          <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
            <table className="w-full text-[10px]">
              <thead className="bg-emerald-800 text-white shadow-md">
                <tr>
                  <th className="p-3 text-left font-black uppercase tracking-widest">Section</th>
                  <th className="p-3 text-center font-black uppercase tracking-widest">Actual</th>
                  <th className="p-3 text-center font-black uppercase tracking-widest">Overall</th>
                  <th className="p-3 text-center font-black uppercase tracking-widest">Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(CURRENT_SHEET).map(([k, v]: [string, any]) => {
                  const actual = sectionGrades[k] || 0;
                  
                  const businessSectionKey = (isMCL || isSeaman) ? 'EMPLOYMENT_BUSINESS' : 'BUSINESS_STATUS';
                  const isDisabled = k === businessSectionKey && !isBusinessEnabled;

                  let activeTotalMaxVal = 0;
                  Object.entries(CURRENT_SHEET).forEach(([section, data]: [string, any]) => {
                    if (section === businessSectionKey && !isBusinessEnabled) return;
                    activeTotalMaxVal += data.max;
                  });
                  const scaleFactor = 100 / (activeTotalMaxVal || 1);
                  const displayMax = isDisabled ? 0 : v.max * scaleFactor;
                  const diff = displayMax - actual;

                  return (
                    <tr key={k} className={cn("hover:bg-gray-100/50 transition-colors", isDisabled && "opacity-30")}>
                      <td className="p-3 font-bold uppercase text-gray-500">{k.replace(/_/g, ' ')}</td>
                      <td className="p-3 text-center font-black text-emerald-700">{actual.toFixed(1)}</td>
                      <td className="p-3 text-center font-mono opacity-50">{displayMax.toFixed(1)}</td>
                      <td className={cn(
                        "p-3 text-center font-black",
                        diff > 5 ? "text-red-500" : "text-green-600"
                      )}>{isDisabled ? '-' : diff.toFixed(1)}</td>
                    </tr>
                  );
                })}
                <tr className="bg-emerald-50/50 font-black">
                  <td className="p-4 uppercase text-emerald-800">Final Weighted Score</td>
                  <td className="p-4 text-center text-lg text-emerald-800">{totalGrade.toFixed(1)}</td>
                  <td className="p-4 text-center text-gray-300">100.0</td>
                  <td className="p-4 text-center text-lg text-amber-600">
                    {riskScore.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-emerald-800 uppercase tracking-widest">Final Status Recommendation</label>
            <div className={cn(
               "w-full h-12 px-6 flex items-center border-2 rounded-xl text-sm font-black uppercase shadow-sm gap-3",
               formData.recommendation === 'Approved' ? "bg-green-50 border-green-200 text-green-600" : 
               formData.recommendation === 'Approved with Conditions' ? "bg-blue-50 border-blue-200 text-blue-600" :
               "bg-red-50 border-red-200 text-red-600"
            )}>
              {formData.recommendation === 'Approved' && <CheckCircle2 size={18} />}
              {formData.recommendation === 'Approved with Conditions' && <Clock size={18} />}
              {formData.recommendation === 'Denied' && <Trash2 size={18} />}
              {formData.recommendation}
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase px-2">
              Based on {riskScore.toFixed(1)}% Achievement Index
              {globalAdjustment !== 0 && (
                <span className="text-emerald-600 ml-1">
                  (Base: {baseRiskScore.toFixed(1)}% | Adj: {globalAdjustment > 0 ? `+${globalAdjustment}` : globalAdjustment}%)
                </span>
              )}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-emerald-800 uppercase tracking-widest">CI Diagnostic Remarks</label>
            <textarea 
              disabled={isReadOnly}
              className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm h-32 focus:border-emerald-500 focus:outline-none transition-all disabled:opacity-50"
              placeholder="Provide justification for the above scoring results..."
              value={formData.ciRemarks}
              onChange={e => setFormData({ ...formData, ciRemarks: e.target.value })}
            />
          </div>

          {!isReadOnly && (
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-4 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-emerald-700 hover:-translate-y-1 transition-all active:translate-y-0 shadow-lg shadow-emerald-900/20 disabled:opacity-50"
            >
              {isSaving ? 'Processing Diagnostic Data...' : 'Commit Assessment to Repository'}
            </button>
          )}
        </div>
      </div>
      
      {isViewingAccount && (
        <AccountDossierModal 
          assignment={assignment} 
          onClose={() => setIsViewingAccount(false)} 
        />
      )}
    </div>
  );
}

function PerformanceGraph({ history }: { history: CashflowReport[] }) {
  if (!history || history.length < 1) return null;

  return (
    <section className="space-y-6 bg-white rounded-3xl p-8 border border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
          <TrendingUp className="text-emerald-600" size={20} />
        </div>
        <div>
          <h4 className="text-sm font-black text-emerald-800 uppercase tracking-widest">Financial Performance History</h4>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Trend analysis across {history.length} assessment rounds</p>
        </div>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history.map((h, i) => ({
            index: i + 1,
            ndi: h.analysis.monthlyNdi,
            gross: h.businessIncome.gross,
            net: h.analysis.netIncome
          }))}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
            <XAxis 
              dataKey="index" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} 
              label={{ value: 'Submission Round', position: 'bottom', offset: -5, fontSize: 10, fontWeight: 'black', fill: '#065F46' }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
              tickFormatter={(val) => `₱${val.toLocaleString()}`}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
              formatter={(value: any) => [`₱${value.toLocaleString()}`]}
            />
            <Line 
              type="monotone" 
              dataKey="ndi" 
              stroke="#059669" 
              strokeWidth={4} 
              dot={{ r: 6, fill: '#059669', strokeWidth: 2, stroke: '#fff' }} 
              activeDot={{ r: 8, fill: '#059669' }} 
              name="Monthly NDI"
            />
            <Line 
              type="monotone" 
              dataKey="gross" 
              stroke="#10b981" 
              strokeWidth={2} 
              strokeDasharray="5 5" 
              dot={false}
              name="Gross Income"
            />
            <Line 
              type="monotone" 
              dataKey="net" 
              stroke="#3b82f6" 
              strokeWidth={2} 
              dot={false}
              name="Net Income"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex gap-6 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-600 rounded-full" />
          <span className="text-[10px] font-black text-gray-500 uppercase">Monthly NDI</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#10b981] rounded-full" />
          <span className="text-[10px] font-black text-gray-500 uppercase">Gross Income</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#3b82f6] rounded-full" />
          <span className="text-[10px] font-black text-gray-500 uppercase">Net Income</span>
        </div>
      </div>
    </section>
  );
}

function CashflowModule({ assignment, user, isReadOnly: forceReadOnly }: { assignment: Assignment, user: UserProfile, isReadOnly?: boolean }) {
  const safeNum = (val: number | string | null | undefined | unknown): number => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  };

  const safeParseTerm = (val: number | string | null | undefined | unknown): number => {
    if (val === undefined || val === null) return 0;
    const cleaned = String(val).replace(/[^0-9]/g, '');
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  const [liabilities, setLiabilities] = useState<Liability[]>(assignment.cashflowReport?.liabilities || []);
  const [businessIncome, setBusinessIncome] = useState(assignment.cashflowReport?.businessIncome || {
    gross: 0, expenses: 0, net: 0
  });
  const [otherIncome, setOtherIncome] = useState(assignment.cashflowReport?.otherIncome || 0);
  const [householdExpenses, setHouseholdExpenses] = useState(assignment.cashflowReport?.householdExpenses || {
    food: 0, rent: 0, electricity: 0, water: 0, insurance: 0, clothing: 0, lpg: 0, association: 0,
    loanPayments: 0, vehicle: 0, transportation: 0, internet: 0, education: 0, medical: 0, miscellaneous: 0, total: 0
  });
  const [ciRecommendation, setCiRecommendation] = useState(assignment.cashflowReport?.ciRecommendation || {
    loanAmount: assignment.requestedAmount, term: safeParseTerm(assignment.term) || 0, interest: 0, rate: 4,
    monthlyAmort: 0, semiMonthlyAmort: 0, weeklyAmort: 0, remarks: ''
  });
  const [opRecommendation, setOpRecommendation] = useState(assignment.cashflowReport?.operationRecommendation || {
    loanAmount: assignment.requestedAmount, term: safeParseTerm(assignment.term) || 0, interest: 0, rate: 4,
    monthlyAmort: 0, semiMonthlyAmort: 0, weeklyAmort: 0, remarks: ''
  });
  const [ndiPercentage, setNdiPercentage] = useState(30);
  const [isSaving, setIsSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReportText, setAiReportText] = useState<string | null>(assignment.aiAnalysis || null);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (assignment.cashflowReport) {
      setLiabilities(assignment.cashflowReport.liabilities || []);
      setBusinessIncome(assignment.cashflowReport.businessIncome || { gross: 0, expenses: 0, net: 0 });
      setOtherIncome(assignment.cashflowReport.otherIncome || 0);
      setHouseholdExpenses(assignment.cashflowReport.householdExpenses || {
        food: 0, rent: 0, electricity: 0, water: 0, insurance: 0, clothing: 0, lpg: 0, association: 0,
        loanPayments: 0, vehicle: 0, transportation: 0, internet: 0, education: 0, medical: 0, miscellaneous: 0, total: 0
      });
      setCiRecommendation(assignment.cashflowReport.ciRecommendation || {
        loanAmount: assignment.requestedAmount, term: safeParseTerm(assignment.term) || 0, interest: 0, rate: 4,
        monthlyAmort: 0, semiMonthlyAmort: 0, weeklyAmort: 0, remarks: ''
      });
      setOpRecommendation(assignment.cashflowReport.operationRecommendation || {
        loanAmount: assignment.requestedAmount, term: safeParseTerm(assignment.term) || 0, interest: 0, rate: 4,
        monthlyAmort: 0, semiMonthlyAmort: 0, weeklyAmort: 0, remarks: ''
      });
    } else {
      setLiabilities([]);
      setBusinessIncome({ gross: 0, expenses: 0, net: 0 });
      setOtherIncome(0);
      setHouseholdExpenses({
        food: 0, rent: 0, electricity: 0, water: 0, insurance: 0, clothing: 0, lpg: 0, association: 0,
        loanPayments: 0, vehicle: 0, transportation: 0, internet: 0, education: 0, medical: 0, miscellaneous: 0, total: 0
      });
      setCiRecommendation({
        loanAmount: assignment.requestedAmount, term: safeParseTerm(assignment.term) || 0, interest: 0, rate: 4,
        monthlyAmort: 0, semiMonthlyAmort: 0, weeklyAmort: 0, remarks: ''
      });
      setOpRecommendation({
        loanAmount: assignment.requestedAmount, term: safeParseTerm(assignment.term) || 0, interest: 0, rate: 4,
        monthlyAmort: 0, semiMonthlyAmort: 0, weeklyAmort: 0, remarks: ''
      });
    }
    setAiReportText(assignment.aiAnalysis || null);
  }, [assignment.id, assignment.cashflowReport, assignment.aiAnalysis]);

  // Auto-calculations
  useEffect(() => {
    setBusinessIncome(prev => ({
      ...prev,
      net: safeNum(prev.gross) - safeNum(prev.expenses)
    }));
  }, [businessIncome.gross, businessIncome.expenses]);

  useEffect(() => {
    const sumLiabilities = liabilities.reduce((acc, curr) => acc + safeNum(curr.amortization), 0);
    const baseSum = safeNum(householdExpenses.food) + 
                    safeNum(householdExpenses.rent) + 
                    safeNum(householdExpenses.electricity) + 
                    safeNum(householdExpenses.water) + 
                    safeNum(householdExpenses.insurance) + 
                    safeNum(householdExpenses.clothing) + 
                    safeNum(householdExpenses.lpg) + 
                    safeNum(householdExpenses.association) + 
                    safeNum(householdExpenses.vehicle) + 
                    safeNum(householdExpenses.transportation) + 
                    safeNum(householdExpenses.internet) + 
                    safeNum(householdExpenses.education) + 
                    safeNum(householdExpenses.medical);

    const loanPayments = sumLiabilities;
    const miscellaneous = (baseSum + loanPayments) * 0.10;
    const total = baseSum + loanPayments + miscellaneous;

    setHouseholdExpenses(prev => ({ 
      ...prev, 
      loanPayments,
      miscellaneous,
      total 
    }));
  }, [
    liabilities,
    householdExpenses.food, householdExpenses.rent, householdExpenses.electricity, householdExpenses.water,
    householdExpenses.insurance, householdExpenses.clothing, householdExpenses.lpg, householdExpenses.association,
    householdExpenses.vehicle, householdExpenses.transportation, householdExpenses.internet,
    householdExpenses.education, householdExpenses.medical
  ]);

  const analysis = {
    grossBusinessIncome: safeNum(businessIncome.gross),
    businessExpenses: safeNum(businessIncome.expenses),
    businessNetIncome: safeNum(businessIncome.net),
    additionalIncome: safeNum(otherIncome),
    totalHouseholdExpenses: safeNum(householdExpenses.total),
    netIncome: safeNum(businessIncome.net) + safeNum(otherIncome) - safeNum(householdExpenses.total),
    ndiPercentage: safeNum(ndiPercentage),
    get monthlyNdi() {
      return this.netIncome * (this.ndiPercentage / 100);
    },
    get recommendedLoan() {
      const termVal = safeNum(ciRecommendation.term);
      const rateVal = safeNum(ciRecommendation.rate);
      const denominator = 1 + (rateVal / 100) * termVal;
      return denominator === 0 ? 0 : (this.monthlyNdi * termVal) / denominator;
    },
    loanableAmount: 0,
    difference: 0
  };

  const handleAiAnalysis = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      // Create temporary assignment structure representing the current unsaved state
      const unsavedAssignment = {
        ...assignment,
        cashflowReport: {
          liabilities,
          businessIncome: {
            gross: safeNum(businessIncome.gross),
            expenses: safeNum(businessIncome.expenses),
            net: safeNum(businessIncome.net)
          },
          otherIncome: safeNum(otherIncome),
          householdExpenses: {
            food: safeNum(householdExpenses.food),
            rent: safeNum(householdExpenses.rent),
            electricity: safeNum(householdExpenses.electricity),
            water: safeNum(householdExpenses.water),
            insurance: safeNum(householdExpenses.insurance),
            clothing: safeNum(householdExpenses.clothing),
            lpg: safeNum(householdExpenses.lpg),
            association: safeNum(householdExpenses.association),
            loanPayments: safeNum(householdExpenses.loanPayments),
            vehicle: safeNum(householdExpenses.vehicle),
            transportation: safeNum(householdExpenses.transportation),
            internet: safeNum(householdExpenses.internet),
            education: safeNum(householdExpenses.education),
            medical: safeNum(householdExpenses.medical),
            miscellaneous: safeNum(householdExpenses.miscellaneous),
            total: safeNum(householdExpenses.total)
          },
          analysis: {
            grossBusinessIncome: safeNum(analysis.grossBusinessIncome),
            businessExpenses: safeNum(analysis.businessExpenses),
            businessNetIncome: safeNum(analysis.businessNetIncome),
            additionalIncome: safeNum(analysis.additionalIncome),
            totalHouseholdExpenses: safeNum(analysis.totalHouseholdExpenses),
            netIncome: safeNum(analysis.netIncome),
            ndiPercentage: safeNum(analysis.ndiPercentage),
            monthlyNdi: safeNum(analysis.monthlyNdi),
            recommendedLoan: safeNum(analysis.recommendedLoan)
          },
          ciRecommendation: {
            loanAmount: safeNum(ciRecommendation.loanAmount),
            term: safeNum(ciRecommendation.term),
            rate: safeNum(ciRecommendation.rate),
            remarks: ciRecommendation.remarks || ''
          }
        }
      };

      const response = await fetch('/api/gemini/analyze-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignment: unsavedAssignment }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete AI report generation.');
      }

      setAiReportText(data.analysis);
      
      // Update dynamically to the assignment so details are synchronizing and included in print reports
      await api.patch(`/api/assignments/${assignment.id}`, { aiAnalysis: data.analysis });
      toast.success('AI risk assessment has been successfully generated!');
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setAiError(errMsg);
      toast.error('AI Assessment failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const sanitizedAnalysis = {
        grossBusinessIncome: safeNum(analysis.grossBusinessIncome),
        businessExpenses: safeNum(analysis.businessExpenses),
        businessNetIncome: safeNum(analysis.businessNetIncome),
        additionalIncome: safeNum(analysis.additionalIncome),
        totalHouseholdExpenses: safeNum(analysis.totalHouseholdExpenses),
        netIncome: safeNum(analysis.netIncome),
        ndiPercentage: safeNum(analysis.ndiPercentage),
        monthlyNdi: safeNum(analysis.monthlyNdi),
        recommendedLoan: safeNum(analysis.recommendedLoan),
        loanableAmount: 0,
        difference: 0
      };

      const report: CashflowReport = {
        liabilities,
        businessIncome: {
          gross: safeNum(businessIncome.gross),
          expenses: safeNum(businessIncome.expenses),
          net: safeNum(businessIncome.net)
        },
        otherIncome: safeNum(otherIncome),
        householdExpenses: {
          food: safeNum(householdExpenses.food),
          rent: safeNum(householdExpenses.rent),
          electricity: safeNum(householdExpenses.electricity),
          water: safeNum(householdExpenses.water),
          insurance: safeNum(householdExpenses.insurance),
          clothing: safeNum(householdExpenses.clothing),
          lpg: safeNum(householdExpenses.lpg),
          association: safeNum(householdExpenses.association),
          loanPayments: safeNum(householdExpenses.loanPayments),
          vehicle: safeNum(householdExpenses.vehicle),
          transportation: safeNum(householdExpenses.transportation),
          internet: safeNum(householdExpenses.internet),
          education: safeNum(householdExpenses.education),
          medical: safeNum(householdExpenses.medical),
          miscellaneous: safeNum(householdExpenses.miscellaneous),
          total: safeNum(householdExpenses.total)
        },
        analysis: sanitizedAnalysis,
        ciRecommendation: { 
          loanAmount: safeNum(ciRecommendation.loanAmount),
          term: safeNum(ciRecommendation.term),
          rate: safeNum(ciRecommendation.rate),
          remarks: ciRecommendation.remarks || '',
          ...calcAmort({
            loanAmount: safeNum(ciRecommendation.loanAmount),
            term: safeNum(ciRecommendation.term),
            rate: safeNum(ciRecommendation.rate)
          })
        },
        operationRecommendation: { 
          loanAmount: safeNum(opRecommendation.loanAmount),
          term: safeNum(opRecommendation.term),
          rate: safeNum(opRecommendation.rate),
          remarks: opRecommendation.remarks || '',
          ...calcAmort({
            loanAmount: safeNum(opRecommendation.loanAmount),
            term: safeNum(opRecommendation.term),
            rate: safeNum(opRecommendation.rate)
          })
        }
      };

      const history = assignment.cashflowHistory || [];
      const newHistory = [...history, report];

      const updatePayload: any = { 
        cashflowReport: report,
        cashflowHistory: newHistory
      };
      
      // If committing during the Cashflowing phase, advance to the next step automatically
      if (assignment.status === 'Cashflowing') {
        const nextStatus = 'Report Submitted';
        updatePayload.status = nextStatus;
        updatePayload.timeline = [
          ...assignment.timeline, 
          { step: nextStatus, timestamp: new Date().toISOString() }
        ];
      }

      await api.patch(`/api/assignments/${assignment.id}`, updatePayload);
      alert('Financial Diagnostic Committed & Saved Successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save and commit Cashflow Report.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCiOnly = async () => {
    setIsSaving(true);
    try {
      const sanitizedAnalysis = {
        grossBusinessIncome: safeNum(analysis.grossBusinessIncome),
        businessExpenses: safeNum(analysis.businessExpenses),
        businessNetIncome: safeNum(analysis.businessNetIncome),
        additionalIncome: safeNum(analysis.additionalIncome),
        totalHouseholdExpenses: safeNum(analysis.totalHouseholdExpenses),
        netIncome: safeNum(analysis.netIncome),
        ndiPercentage: safeNum(analysis.ndiPercentage),
        monthlyNdi: safeNum(analysis.monthlyNdi),
        recommendedLoan: safeNum(analysis.recommendedLoan),
        loanableAmount: 0,
        difference: 0
      };

      const report: CashflowReport = {
        liabilities,
        businessIncome: {
          gross: safeNum(businessIncome.gross),
          expenses: safeNum(businessIncome.expenses),
          net: safeNum(businessIncome.net)
        },
        otherIncome: safeNum(otherIncome),
        householdExpenses: {
          food: safeNum(householdExpenses.food),
          rent: safeNum(householdExpenses.rent),
          electricity: safeNum(householdExpenses.electricity),
          water: safeNum(householdExpenses.water),
          insurance: safeNum(householdExpenses.insurance),
          clothing: safeNum(householdExpenses.clothing),
          lpg: safeNum(householdExpenses.lpg),
          association: safeNum(householdExpenses.association),
          loanPayments: safeNum(householdExpenses.loanPayments),
          vehicle: safeNum(householdExpenses.vehicle),
          transportation: safeNum(householdExpenses.transportation),
          internet: safeNum(householdExpenses.internet),
          education: safeNum(householdExpenses.education),
          medical: safeNum(householdExpenses.medical),
          miscellaneous: safeNum(householdExpenses.miscellaneous),
          total: safeNum(householdExpenses.total)
        },
        analysis: sanitizedAnalysis,
        ciRecommendation: { 
          loanAmount: safeNum(ciRecommendation.loanAmount),
          term: safeNum(ciRecommendation.term),
          rate: safeNum(ciRecommendation.rate),
          remarks: ciRecommendation.remarks || '',
          ...calcAmort({
            loanAmount: safeNum(ciRecommendation.loanAmount),
            term: safeNum(ciRecommendation.term),
            rate: safeNum(ciRecommendation.rate)
          })
        },
        operationRecommendation: { 
          loanAmount: safeNum(opRecommendation.loanAmount),
          term: safeNum(opRecommendation.term),
          rate: safeNum(opRecommendation.rate),
          remarks: opRecommendation.remarks || '',
          ...calcAmort({
            loanAmount: safeNum(opRecommendation.loanAmount),
            term: safeNum(opRecommendation.term),
            rate: safeNum(opRecommendation.rate)
          })
        }
      };

      const updatePayload: any = { 
        cashflowReport: report
      };

      await api.patch(`/api/assignments/${assignment.id}`, updatePayload);
      alert('CI Recommendation Updates Saved Successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save CI Recommendation.');
    } finally {
      setIsSaving(false);
    }
  };

  const addLiability = () => {
    setLiabilities([...liabilities, {
      source: '', loanType: '', loanAmount: 0, startDate: '', endDate: '',
      lastUpdate: '', periodicity: 'MONTHLY', amortization: 0, balance: 0, status: '', remarks: ''
    }]);
  };

  const removeLiability = (idx: number) => {
    setLiabilities(liabilities.filter((_, i) => i !== idx));
  };

  const isReadOnly = forceReadOnly || (
    user.role !== 'admin' && (
      user.role !== 'user' || (assignment.status !== 'Cashflowing' && assignment.status !== 'Report Submitted')
    )
  );

  const isCiRecommendationEditable = (
    user.role === 'admin' ||
    user.role === 'coordinator' ||
    assignment.ciOfficerId === user.id ||
    user.role === 'user'
  );

  return (
    <div className="bg-white border-2 border-emerald-500/10 rounded-3xl p-8 space-y-12 shadow-xl shadow-emerald-900/5">
      <div className="flex justify-between items-center border-b-4 border-emerald-500/5 pb-6">
        <div>
          <h3 className="text-xl font-black text-emerald-800 uppercase tracking-tight">Financial Cashflow Report</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">CASHFLOW ANALYSIS SYSTEM v3.0</p>
        </div>
      </div>

      {/* Liabilities Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-center bg-emerald-50 p-4 rounded-xl">
          <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest">Client Liabilities</h4>
          {!isReadOnly && (
            <button onClick={addLiability} className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:underline">+ Add Entry</button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50 text-[9px] font-black uppercase text-gray-400 border-b border-gray-100 italic">
                <th className="p-3">Source</th>
                <th className="p-3">Loan Type</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Start Date</th>
                <th className="p-3">End Date</th>
                <th className="p-3">Periodicity</th>
                <th className="p-3">Amortization</th>
                <th className="p-3">Balance</th>
                <th className="p-3">Status</th>
                {!isReadOnly && <th className="p-3">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {liabilities.map((l, idx) => (
                <tr key={idx} className="text-xs">
                  <td className="p-2"><input disabled={isReadOnly} className="w-full bg-transparent border-b border-gray-100 py-1" value={l.source} onChange={e => { const nl = [...liabilities]; nl[idx].source = e.target.value; setLiabilities(nl); }} /></td>
                  <td className="p-2"><input disabled={isReadOnly} className="w-full bg-transparent border-b border-gray-100 py-1" value={l.loanType} onChange={e => { const nl = [...liabilities]; nl[idx].loanType = e.target.value; setLiabilities(nl); }} /></td>
                  <td className="p-2"><input disabled={isReadOnly} type="number" className="w-full bg-transparent border-b border-gray-100 py-1" value={l.loanAmount === 0 ? '' : l.loanAmount} onChange={e => { const nl = [...liabilities]; nl[idx].loanAmount = e.target.value === '' ? 0 : Number(e.target.value); setLiabilities(nl); }} /></td>
                  <td className="p-2"><input disabled={isReadOnly} type="date" className="w-full bg-transparent border-b border-gray-100 py-1" value={l.startDate} onChange={e => { const nl = [...liabilities]; nl[idx].startDate = e.target.value; setLiabilities(nl); }} /></td>
                  <td className="p-2"><input disabled={isReadOnly} type="date" className="w-full bg-transparent border-b border-gray-100 py-1" value={l.endDate} onChange={e => { const nl = [...liabilities]; nl[idx].endDate = e.target.value; setLiabilities(nl); }} /></td>
                  <td className="p-2">
                    <select disabled={isReadOnly} className="w-full bg-transparent border-b border-gray-100 py-1" value={l.periodicity} onChange={e => { const nl = [...liabilities]; nl[idx].periodicity = e.target.value; setLiabilities(nl); }}>
                      <option value="MONTHLY">Monthly</option>
                      <option value="SEMI-MONTHLY">Semi-Monthly</option>
                      <option value="WEEKLY">Weekly</option>
                    </select>
                  </td>
                  <td className="p-2"><input disabled={isReadOnly} type="number" className="w-full bg-transparent border-b border-gray-100 py-1" value={l.amortization === 0 ? '' : l.amortization} onChange={e => { const nl = [...liabilities]; nl[idx].amortization = e.target.value === '' ? 0 : Number(e.target.value); setLiabilities(nl); }} /></td>
                  <td className="p-2"><input disabled={isReadOnly} type="number" className="w-full bg-transparent border-b border-gray-100 py-1" value={l.balance === 0 ? '' : l.balance} onChange={e => { const nl = [...liabilities]; nl[idx].balance = e.target.value === '' ? 0 : Number(e.target.value); setLiabilities(nl); }} /></td>
                  <td className="p-2"><input disabled={isReadOnly} className="w-full bg-transparent border-b border-gray-100 py-1" value={l.status} onChange={e => { const nl = [...liabilities]; nl[idx].status = e.target.value; setLiabilities(nl); }} /></td>
                  {!isReadOnly && <td className="p-2"><button onClick={() => removeLiability(idx)} className="text-red-500"><Trash2 size={14} /></button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Financial Data Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        {/* Business Income Section */}
        <section className="space-y-6">
          <h4 className="text-xs font-black text-emerald-800 bg-emerald-50 px-4 py-2 rounded-lg uppercase tracking-widest whitespace-nowrap">Business & Other Income</h4>
          <div className="grid grid-cols-1 gap-6 p-6 bg-gray-50 rounded-3xl border border-gray-100">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monthly Gross Sales</label>
                <input 
                  disabled={isReadOnly} 
                  type="number" 
                  className="w-full h-12 px-4 bg-white border-2 border-gray-100 rounded-xl text-sm font-black focus:border-emerald-500 focus:outline-none transition-all" 
                  value={businessIncome.gross === 0 ? '' : businessIncome.gross} 
                  onChange={e => setBusinessIncome({ ...businessIncome, gross: e.target.value === '' ? 0 : Number(e.target.value) })} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monthly Business Expenses</label>
                <input 
                  disabled={isReadOnly} 
                  type="number" 
                  className="w-full h-12 px-4 bg-white border-2 border-gray-100 rounded-xl text-sm font-black text-red-500 focus:border-emerald-500 focus:outline-none transition-all" 
                  value={businessIncome.expenses === 0 ? '' : businessIncome.expenses} 
                  onChange={e => setBusinessIncome({ ...businessIncome, expenses: e.target.value === '' ? 0 : Number(e.target.value) })} 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Other Source of Income (Monthly)</label>
              <input 
                disabled={isReadOnly} 
                type="number" 
                className="w-full h-12 px-4 bg-white border-2 border-gray-100 rounded-xl text-sm font-black text-green-600 focus:border-emerald-500 focus:outline-none transition-all" 
                value={otherIncome === 0 ? '' : otherIncome} 
                onChange={e => setOtherIncome(e.target.value === '' ? 0 : Number(e.target.value))} 
              />
            </div>

            <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-emerald-800">Total Business Net</span>
              <span className="text-xl font-black text-green-600">₱ {businessIncome.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </section>

        {/* Household Expenses Section */}
        <section className="space-y-6">
          <h4 className="text-xs font-black text-emerald-800 bg-emerald-50 px-4 py-2 rounded-lg uppercase tracking-widest whitespace-nowrap">Household Expenses Manifest</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
            {Object.entries(householdExpenses).filter(([k]) => k !== 'total').map(([key, val]) => {
              const autoFields = ['loanPayments', 'miscellaneous'];
              const isAuto = autoFields.includes(key);
              return (
                <div key={key} className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    {key.replace(/([A-Z])/g, ' $1')}
                    {isAuto && <span className="ml-1 text-[8px] text-emerald-600 opacity-50">(AUTO)</span>}
                  </label>
                  <input 
                    disabled={isReadOnly || isAuto} 
                    type="number" 
                    className={cn(
                      "w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:outline-none",
                      isAuto && "bg-emerald-50 text-emerald-700"
                    )} 
                    value={val === 0 ? '' : val} 
                    onChange={e => setHouseholdExpenses({ ...householdExpenses, [key]: e.target.value === '' ? 0 : Number(e.target.value) })} 
                  />
                </div>
              );
            })}
          </div>
          <div className="bg-red-500 text-white p-4 rounded-2xl flex justify-between items-center shadow-lg shadow-red-500/20">
            <span className="text-[10px] font-black uppercase tracking-widest">Total Monthly Household Expenses</span>
            <span className="text-xl font-black">₱ {householdExpenses.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </section>
      </div>

      {/* Analysis Summary */}
      <section className="bg-gray-50 p-8 rounded-[40px] border border-gray-100 shadow-inner">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          <div className="space-y-6">
            <h5 className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.3em]">Cashflow Integrity</h5>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-gray-500 uppercase">Business Net</span>
                <span className="text-sm font-black text-gray-700">₱ {businessIncome.net.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-gray-500 uppercase">Other Income</span>
                <span className="text-sm font-black text-green-600">+₱ {otherIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-gray-500 uppercase">Household Expenses</span>
                <span className="text-sm font-black text-red-500">(₱ {householdExpenses.total.toLocaleString()})</span>
              </div>
              <div className="h-px bg-gray-200" />
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-black text-emerald-800 uppercase">Residual Net Income</span>
                <span className="text-lg font-black text-emerald-800">₱ {analysis.netIncome.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:border-l border-gray-200 lg:pl-12">
            <h5 className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.3em]">NDI Calibration</h5>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target NDI Policy (%)</label>
                <div className="flex gap-2">
                  {[30, 40, 50].map(p => (
                    <button key={p} onClick={() => setNdiPercentage(p)} className={cn("flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all", ndiPercentage === p ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" : "bg-white text-gray-400 border border-gray-100")}>{p}%</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-gray-500 uppercase">Monthly Capacity (NDI @ {ndiPercentage}%)</p>
                <p className="text-2xl font-black text-green-600">₱ {analysis.monthlyNdi.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:border-l border-gray-200 lg:pl-12 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h5 className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.3em]">Loanability Algorithm</h5>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-gray-500 uppercase">Recommended Loan</span>
                <span className="text-xl font-black text-emerald-800">₱ {analysis.recommendedLoan.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <p className="text-[9px] text-gray-400 italic">Financial recommendation based on residual capacity and requested terms.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Action Block */}
      <div className="flex flex-col gap-8 pt-12 border-t-4 border-emerald-500/5">
        <div className="space-y-6">
          <label className="text-xs font-black text-emerald-800 uppercase tracking-widest">CI Assessment & Recommendation</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Recommended Amount</label>
              <input disabled={!isCiRecommendationEditable} type="number" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black" value={ciRecommendation.loanAmount === 0 ? '' : ciRecommendation.loanAmount} onChange={e => setCiRecommendation({ ...ciRecommendation, loanAmount: Number(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Term (Months)</label>
              <input disabled={!isCiRecommendationEditable} type="number" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black" value={ciRecommendation.term === 0 ? '' : ciRecommendation.term} onChange={e => setCiRecommendation({ ...ciRecommendation, term: Number(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Flat Int. Rate (% Monthly)</label>
              <input disabled={!isCiRecommendationEditable} type="number" step="0.1" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black" value={ciRecommendation.rate === 0 ? '' : ciRecommendation.rate} onChange={e => setCiRecommendation({ ...ciRecommendation, rate: Number(e.target.value) })} />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">CI Remarks & Justification</label>
            <textarea 
              disabled={!isCiRecommendationEditable}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm h-24 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              placeholder="Provide detailed breakdown and justification for this recommendation..."
              value={ciRecommendation.remarks}
              onChange={e => setCiRecommendation({ ...ciRecommendation, remarks: e.target.value })}
            />
          </div>

          <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <p className="text-[8px] font-black text-gray-400 uppercase">Total Interest</p>
              <p className="text-sm font-black text-emerald-800">₱ {calcAmort(ciRecommendation).interest.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-black text-gray-400 uppercase">Weekly Amort</p>
              <p className="text-sm font-black text-green-600">₱ {calcAmort(ciRecommendation).weeklyAmort.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-black text-gray-400 uppercase">Semi-Monthly Amort</p>
              <p className="text-sm font-black text-emerald-800">₱ {calcAmort(ciRecommendation).semiMonthlyAmort.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-black text-gray-400 uppercase">Monthly Amort</p>
              <p className="text-sm font-black text-emerald-800">₱ {calcAmort(ciRecommendation).monthlyAmort.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>

        {/* AI Copilot comments box before committing */}
        <div className="relative border-t border-dashed border-emerald-500/20 pt-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800">✨ AI Credit Diagnostic Comments</span>
                <span className="px-2 py-0.5 bg-emerald-600 text-[8px] font-black text-white uppercase rounded-md tracking-wider">Gemini Active</span>
              </div>
              <h5 className="text-[12px] font-black text-emerald-950 uppercase tracking-tight">Evaluate Scoring, Liabilities & Cashflow Metrics</h5>
            </div>
            <button
              type="button"
              onClick={handleAiAnalysis}
              disabled={aiLoading}
              className="px-5 py-2.5 h-10 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-xs whitespace-nowrap active:scale-95 bg-emerald-800 text-white hover:bg-emerald-950 cursor-pointer disabled:opacity-50"
            >
              {aiLoading ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent border-white animate-spin shrink-0" />
                  Generating...
                </>
              ) : (
                <>
                  <span>✨</span> {aiReportText ? 'Re-Analyze with Gemini AI' : 'Run AI Account Analysis'}
                </>
              )}
            </button>
          </div>

          {aiError && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[10px] text-red-700 font-bold">
              Failed to compile analysis: {aiError}
            </div>
          )}

          {aiReportText && (
            <div className="space-y-4">
              <div className="bg-emerald-50/10 rounded-2xl p-5 border border-emerald-100/50">
                <AiSummaryHighlight content={aiReportText} />
                <MarkdownViewer content={aiReportText} />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const cleanText = aiReportText
                      .replace(/###\s+/g, '')
                      .replace(/\*\*/g, '')
                      .trim();
                    setCiRecommendation(prev => ({ ...prev, remarks: cleanText }));
                    toast.success('AI Comments applied to CI Remarks!');
                  }}
                  className="px-3 py-1.5 bg-emerald-100 font-black text-emerald-800 rounded-lg text-[9px] uppercase tracking-wide hover:bg-emerald-200 transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                >
                  📝 Copy to CI Justification Remarks
                </button>
              </div>
            </div>
          )}
        </div>

        {!isReadOnly && (
          <div className="pb-4">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-5 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-700 hover:-translate-y-1 transition-all active:translate-y-0 shadow-xl shadow-emerald-900/20"
            >
              {isSaving ? 'Calculating...' : 'Commit Financial Diagnostic'}
            </button>
          </div>
        )}
        {isReadOnly && isCiRecommendationEditable && (
          <div className="pb-4">
            <button 
              onClick={handleSaveCiOnly}
              disabled={isSaving}
              className="w-full py-5 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-700 hover:-translate-y-1 transition-all active:translate-y-0 shadow-xl shadow-emerald-900/20"
            >
              {isSaving ? 'Saving...' : 'Save CI Recommendation'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CrecomApproval({ user }: { user: UserProfile }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [approvedList, setApprovedList] = useState<Assignment[]>([]);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [isViewingAccount, setIsViewingAccount] = useState(false);
  const [modalTab, setModalTab] = useState<'all' | 'scoring' | 'cashflow' | 'ai'>('all');
  const [search, setSearch] = useState('');
  const [processData, setProcessData] = useState({
    amount: '',
    term: '',
    intRate: '',
    mop: 'Weekly' as MOP,
    top: 'Collection' as TOP,
    comments: ''
  });

  useEffect(() => {
    if (selected) {
      setProcessData({
        amount: String(selected.cashflowReport?.ciRecommendation?.loanAmount || selected.requestedAmount),
        term: String(selected.cashflowReport?.ciRecommendation?.term || selected.term),
        intRate: String(selected.cashflowReport?.ciRecommendation?.rate || 4),
        mop: (selected.approvedMop || selected.mop) as MOP,
        top: (selected.approvedTop || selected.top) as TOP,
        comments: selected.crecomComments || ''
      });
    }
  }, [selected]);

  useEffect(() => {
    const qPending = query(collection(db, 'assignments'), where('status', '==', 'Pre-approved'));
    const qApproved = query(collection(db, 'assignments'), where('status', '==', 'Approved'));

    const unsubscribePending = onSnapshot(qPending, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Assignment[];
      setAssignments(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'assignments');
    });

    const unsubscribeApproved = onSnapshot(qApproved, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Assignment[];
      setApprovedList(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'assignments');
    });

    return () => {
      unsubscribePending();
      unsubscribeApproved();
    };
  }, []);

  const computedAmort = useMemo(() => {
    return calcAmort({
      loanAmount: Number(processData.amount),
      term: Number(processData.term.replace(/[^0-9]/g, '')),
      rate: Number(processData.intRate)
    });
  }, [processData.amount, processData.term, processData.intRate]);

  const handleApprove = async () => {
    if (!selected) return;
    try {
      await api.patch(`/api/assignments/${selected.id}`, {
        status: 'Approved',
        approvedAmount: Number(processData.amount),
        approvedTerm: processData.term,
        approvedIntRate: Number(processData.intRate),
        approvedMop: processData.mop,
        approvedTop: processData.top,
        crecomComments: processData.comments,
        timeline: [...selected.timeline, { step: 'Approved', timestamp: new Date().toISOString() }]
      });

      await createNotification(
        selected.ciOfficerId,
        'Final Approval - Ready for Survey',
        `Access Granted for ${selected.borrowerName}. Please perform validation survey.`,
        'status_change',
        selected.id
      );

      setSelected(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeny = async () => {
    if (!selected) return;
    try {
      await api.patch(`/api/assignments/${selected.id}`, {
        status: 'Denied',
        crecomComments: processData.comments,
        timeline: [...selected.timeline, { step: 'Denied', timestamp: new Date().toISOString() }]
      });

      await createNotification(
        selected.ciOfficerId,
        'Account Denied',
        `The application for ${selected.borrowerName} has been DENIED by Crecom.`,
        'status_change',
        selected.id
      );

      setSelected(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = assignments.filter(a => 
    a.borrowerName.toLowerCase().includes(search.toLowerCase()) ||
    a.ciOfficerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-emerald-800 uppercase tracking-tight">Crecom Approval Queue</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Final Review & Funding Decision</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search queue..."
            className="w-full pl-12 pr-6 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl text-sm focus:outline-none focus:border-emerald-500/20 font-medium transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(a => {
          const preApprovalStep = a.timeline.find(t => t.step === 'Pre-approved');
          const preApprovalDate = preApprovalStep ? format(new Date(preApprovalStep.timestamp), 'MMM d, yyyy h:mm a') : 'N/A';
          
          return (
            <motion.div 
              key={a.id} 
              layoutId={a.id}
              onClick={() => setSelected(a)}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group flex flex-col"
            >
              <div className="bg-emerald-800 p-5 flex justify-between items-center text-white">
                <div>
                  <h4 className="font-black text-lg uppercase tracking-tight">{a.borrowerName}</h4>
                  <p className="text-[9px] text-white/60 uppercase tracking-[0.2em] font-bold">Pre-approved: {preApprovalDate}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex flex-col items-end">
                     <span className="text-[8px] font-black uppercase tracking-widest text-white/50">Credit Score</span>
                     <span className={cn(
                       "px-3 py-1 rounded-full text-[10px] font-black uppercase ring-2 ring-white/20",
                       a.creditScore?.finalGrade === 'EXCELLENT' ? "bg-green-500 text-white" : "bg-amber-500 text-white"
                     )}>
                      {a.creditScore?.finalGrade || 'N/A'}
                     </span>
                  </div>
                  <div className="flex flex-col items-end">
                     <span className="text-[8px] font-black uppercase tracking-widest text-white/50">Rec. Status</span>
                     <span className={cn(
                       "px-3 py-1 rounded-full text-[10px] font-black uppercase ring-2 ring-white/20",
                       a.creditScore?.recommendation === 'Approved' ? "bg-white text-green-600" : "bg-white text-red-600"
                     )}>
                      {a.creditScore?.recommendation === 'Approved' ? 'Approve' : 'Denied'}
                     </span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">CI Recommendation</p>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-emerald-800">₱{a.cashflowReport?.ciRecommendation?.loanAmount.toLocaleString()}</p>
                      <p className="text-[9px] font-bold text-gray-500 uppercase">{a.cashflowReport?.ciRecommendation?.term} Mos @ {a.cashflowReport?.ciRecommendation?.rate}%</p>
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                    <p className="text-[9px] font-black text-green-600/60 uppercase tracking-widest mb-2">Cashflow NDI</p>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-green-700">₱{a.cashflowReport?.analysis?.monthlyNdi?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      <p className="text-[9px] font-bold text-green-600 uppercase">Monthly Capacity</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-gray-400" />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">TAT: {calculateTAT(a.timeline)}</span>
                  </div>
                  <div className="text-[9px] font-black text-emerald-700 uppercase tracking-[0.2em] group-hover:translate-x-2 transition-all">Review Details →</div>
                </div>
              </div>
            </motion.div>
          );
        })}
        {assignments.length === 0 && (
          <div className="col-span-full py-20 text-center bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
            <CheckCircle2 className="mx-auto text-gray-200 mb-4" size={64} />
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">Queue Empty</h3>
            <p className="text-xs font-bold text-gray-400 mt-2">No pre-approved accounts waiting for Crecom review.</p>
          </div>
        )}
      </div>

      <div className="pt-20 space-y-6">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-black text-emerald-800 uppercase tracking-[0.3em] whitespace-nowrap">Recently Approved Loans</h3>
          <div className="h-px w-full bg-gray-100" />
        </div>
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date Approve</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Borrower / Details</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Term</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Rate</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">MOD</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {approvedList.map(a => {
                const approvalStep = a.timeline.find(t => t.step === 'Approved');
                const approvalDate = approvalStep ? format(new Date(approvalStep.timestamp), 'MMM d, yyyy') : 'N/A';
                return (
                  <tr key={a.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setSelected(a)}>
                    <td className="px-6 py-4 text-[10px] font-bold text-gray-400">{approvalDate}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-emerald-800 uppercase">{a.borrowerName}</p>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest">CI: {a.ciOfficerName}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-sm font-black text-gray-900">₱{a.approvedAmount?.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black text-gray-600">{a.approvedTerm} Mos</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-black text-emerald-700">{a.approvedIntRate}%</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase">{a.approvedMop}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase">{a.approvedTop}</span>
                    </td>
                  </tr>
                );
              })}
              {approvedList.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-300 font-bold uppercase text-[10px] tracking-widest">No recently approved accounts found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-0"
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white w-screen h-screen max-w-none max-h-none rounded-none p-0 shadow-none flex flex-col xl:flex-row overflow-hidden"
            >
              <div className="flex-1 p-6 lg:p-10 overflow-y-auto border-r border-gray-100 xl:h-full flex flex-col">
                <div className="flex justify-between items-start mb-6 shrink-0">
                  <div>
                    <h3 className="text-3xl lg:text-4xl font-black text-emerald-900 uppercase tracking-tighter leading-none mb-2">{selected.borrowerName}</h3>
                    <div className="flex items-center flex-wrap gap-4">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase rounded-full tracking-widest">Step: Discrepancy & Final Approval</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">CI Officer: {selected.ciOfficerName}</span>
                      <button 
                        onClick={() => setIsViewingAccount(true)}
                        className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-800 transition-colors flex items-center gap-1 border-l border-emerald-100 pl-4"
                      >
                        <FileText size={10} /> View Account Information
                      </button>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><X /></button>
                </div>

                {/* Sub-section tab select to allow perfect side by side or unified screen fit */}
                <div className="flex items-center gap-4 lg:gap-6 border-b border-gray-200 pb-3 mb-6 shrink-0 flex-wrap">
                  <button
                    onClick={() => setModalTab('all')}
                    className={cn(
                      "text-[10px] font-black uppercase tracking-[0.15em] pb-2 transition-all border-b-2",
                      modalTab === 'all' 
                        ? "border-emerald-600 text-emerald-800" 
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    )}
                  >
                    All Details (Stacked)
                  </button>
                  <button
                    onClick={() => setModalTab('scoring')}
                    className={cn(
                      "text-[10px] font-black uppercase tracking-[0.15em] pb-2 transition-all border-b-2",
                      modalTab === 'scoring' 
                        ? "border-emerald-600 text-emerald-800" 
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    )}
                  >
                    Credit Scorer Diagnostic
                  </button>
                  <button
                    onClick={() => setModalTab('cashflow')}
                    className={cn(
                      "text-[10px] font-black uppercase tracking-[0.15em] pb-2 transition-all border-b-2",
                      modalTab === 'cashflow' 
                        ? "border-emerald-600 text-emerald-800" 
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    )}
                  >
                    Financial Cashflow Report
                  </button>
                  <button
                    onClick={() => setModalTab('ai')}
                    className={cn(
                      "text-[10px] font-black uppercase tracking-[0.15em] pb-2 transition-all border-b-2 flex items-center gap-1.5",
                      modalTab === 'ai' 
                        ? "border-emerald-600 text-emerald-800" 
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    )}
                  >
                    ✨ AI Risk Report
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-12 pr-2">
                  {/* Performance History Section */}
                  {selected.cashflowHistory && selected.cashflowHistory.length > 0 && (
                    <PerformanceGraph history={selected.cashflowHistory} />
                  )}

                  {modalTab === 'all' && (
                    <div className="space-y-12">
                      {/* AI Assessment segment placed at top of Crecom all stacks */}
                      <section className="space-y-6">
                        <AiAccountAnalysis assignment={selected} />
                      </section>

                      <section className="space-y-6">
                        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                          <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Credit Scorer Insight</h4>
                          <span className="text-[10px] font-black text-green-600 bg-white px-3 py-1 rounded-full shadow-sm badge">GRADE: {selected.creditScore?.finalGrade || 'N/A'}</span>
                        </div>
                        <CreditScoringModule assignment={selected} user={user} isReadOnly={true} />
                      </section>

                      <section className="space-y-6">
                        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                          <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Financial Diagnostic Summary</h4>
                          <span className="text-[10px] font-black text-emerald-600 bg-white px-3 py-1 rounded-full shadow-sm badge">NDI: ₱{selected.cashflowReport?.analysis?.monthlyNdi?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <CashflowModule assignment={selected} user={user} isReadOnly={true} />
                      </section>
                    </div>
                  )}

                  {modalTab === 'scoring' && (
                    <section className="space-y-6">
                      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                        <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Credit Scorer Insight</h4>
                        <span className="text-[10px] font-black text-green-600 bg-white px-3 py-1 rounded-full shadow-sm badge">GRADE: {selected.creditScore?.finalGrade || 'N/A'}</span>
                      </div>
                      <CreditScoringModule assignment={selected} user={user} isReadOnly={true} />
                    </section>
                  )}

                  {modalTab === 'cashflow' && (
                    <section className="space-y-6">
                      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                        <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Financial Diagnostic Summary</h4>
                        <span className="text-[10px] font-black text-emerald-600 bg-white px-3 py-1 rounded-full shadow-sm badge">NDI: ₱{selected.cashflowReport?.analysis?.monthlyNdi?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                      <CashflowModule assignment={selected} user={user} isReadOnly={true} />
                    </section>
                  )}

                  {modalTab === 'ai' && (
                    <section className="space-y-6">
                      <AiAccountAnalysis assignment={selected} />
                    </section>
                  )}
                </div>
              </div>

              <div className="w-full xl:w-[400px] bg-gray-50 p-8 lg:p-12 border-l border-gray-100 flex flex-col xl:overflow-y-auto xl:h-full">
                <div className="flex-1 space-y-8">
                  <div className="pb-6 border-b border-gray-200">
                    <h4 className="text-[11px] font-black text-emerald-800 uppercase tracking-[0.2em]">Final Determination Payload</h4>
                    <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold">Input final credit committee decisions below</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Final Amount</label>
                        <input 
                          type="number" 
                          className="w-full h-14 px-6 bg-white border-2 border-gray-200 rounded-2xl text-lg font-black focus:border-emerald-500 focus:outline-none transition-all placeholder:text-gray-300"
                          value={processData.amount}
                          onChange={e => setProcessData({...processData, amount: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Term (Mos)</label>
                        <input 
                          type="text" 
                          className="w-full h-14 px-6 bg-white border-2 border-gray-200 rounded-2xl text-lg font-black focus:border-emerald-500 focus:outline-none transition-all"
                          value={processData.term}
                          onChange={e => setProcessData({...processData, term: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Yield / Int. Rate (%)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        className="w-full h-14 px-6 bg-white border-2 border-gray-200 rounded-2xl text-lg font-black focus:border-emerald-500 focus:outline-none transition-all"
                        value={processData.intRate}
                        onChange={e => setProcessData({...processData, intRate: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">MOP</label>
                        <select 
                          className="w-full h-14 px-4 bg-white border-2 border-gray-200 rounded-2xl text-[10px] font-black uppercase focus:border-emerald-500 focus:outline-none transition-all"
                          value={processData.mop}
                          onChange={e => setProcessData({...processData, mop: e.target.value as any})}
                        >
                          <option value="Daily">Daily</option>
                          <option value="Weekly">Weekly</option>
                          <option value="Semi-Monthly">Semi-Monthly</option>
                          <option value="Monthly">Monthly</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TOP</label>
                        <select 
                          className="w-full h-14 px-4 bg-white border-2 border-gray-200 rounded-2xl text-[10px] font-black uppercase focus:border-emerald-500 focus:outline-none transition-all"
                          value={processData.top}
                          onChange={e => setProcessData({...processData, top: e.target.value as any})}
                        >
                          <option value="Collection">Collection</option>
                          <option value="PDC">PDC</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-emerald-800 p-6 rounded-3xl text-white shadow-xl shadow-emerald-900/40 space-y-4">
                      <div className="flex justify-between items-center border-b border-white/20 pb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Est. Total Interest</span>
                        <span className="text-sm font-black">₱ {computedAmort.interest.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Weekly</span>
                          <span className="text-lg font-black">₱ {computedAmort.weeklyAmort.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between items-center opacity-60">
                          <span className="text-[8px] font-black uppercase tracking-widest">Monthly</span>
                          <span className="text-xs font-bold">₱ {computedAmort.monthlyAmort.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Crecom Comments / Remarks</label>
                      <textarea 
                        className="w-full px-6 py-4 bg-white border-2 border-gray-200 rounded-3xl text-[11px] font-bold h-32 focus:border-emerald-500 focus:outline-none transition-all"
                        placeholder="Provide final justification for the approval or denial..."
                        value={processData.comments}
                        onChange={e => setProcessData({...processData, comments: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                  <div className="pt-8 flex flex-col gap-4 mt-auto">
                    {user.role === 'admin' ? (
                      <>
                        <button 
                          onClick={handleDeny}
                          className="w-full py-5 bg-red-50 text-red-600 text-[10px] font-black rounded-2xl hover:bg-red-500 hover:text-white transition-all uppercase tracking-[0.3em] active:scale-95"
                        >
                          Deny Application
                        </button>
                        <button 
                          onClick={handleApprove}
                          className="w-full py-6 bg-emerald-600 text-white text-[11px] font-black rounded-3xl hover:bg-emerald-700 hover:-translate-y-1 active:translate-y-0 transition-all uppercase tracking-[0.4em] shadow-2xl shadow-emerald-900/40"
                        >
                          Confirm Funding & Grant Approval
                        </button>
                      </>
                    ) : (
                      <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 italic text-[10px] text-amber-700 font-bold text-center">
                        Viewing as Coordinator. Final approval authority is restricted to System Administrators.
                      </div>
                    )}
                  </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        {isViewingAccount && selected && (
          <AccountDossierModal 
            assignment={selected} 
            onClose={() => setIsViewingAccount(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminKeys({ user }: { user: UserProfile }) {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'admin_keys'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setKeys(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'admin_keys');
    });

    return () => unsubscribe();
  }, []);

  const generateKey = async () => {
    setLoading(true);
    try {
      const key = Math.random().toString(36).substring(2, 10).toUpperCase();
      await api.post('/api/admin-keys', { key, createdBy: user.fullName });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <button 
        onClick={generateKey}
        disabled={loading}
        className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg hover:shadow-xl transition-all uppercase tracking-[0.2em] shadow-emerald-900/20"
      >
        {loading ? 'Generating...' : 'Generate Admin Key'}
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Keys</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {keys.map(k => (
            <div key={k.id} className="p-5 flex justify-between items-start transition-all hover:bg-gray-50/50">
              <div className="space-y-1">
                <span className="font-mono text-base font-black text-emerald-800 tracking-widest">{k.key}</span>
                {k.used && (
                  <p className="text-[9px] text-gray-400 font-bold uppercase">
                    Used by: <span className="text-gray-600 underline">{k.usedBy}</span>
                  </p>
                )}
              </div>
              <div className="text-right space-y-1">
                <span className={cn(
                  "text-[8px] font-black uppercase px-2 py-0.5 rounded-full inline-block",
                  k.used ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                )}>
                  {k.used ? 'Redeemed' : 'Vigorous'}
                </span>
                <p className="text-[8px] text-gray-300 font-mono">
                  {k.usedAt ? format(new Date(k.usedAt), 'MMM d, h:mm a') : format(new Date(k.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ValidationSurvey({ user }: { user: UserProfile }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [isViewingAccount, setIsViewingAccount] = useState(false);
  const [step, setStep] = useState(1);
  const [validation, setValidation] = useState({
    didAnswerCalls: false,
    didReceiveProceeds: false,
    didExplainPN: false,
    didExplainDeductions: false
  });
  const [survey, setSurvey] = useState({
    satisfaction: 5,
    speed: 5,
    clarity: 5,
    affordability: 5,
    customerService: 5,
    recommend: 'Yes' as 'Yes' | 'No',
    recommendExplanation: '',
    comments: ''
  });

  useEffect(() => {
    let q = query(collection(db, 'assignments'), where('status', '==', 'Approved'));
    if (user.role !== 'admin' && user.role !== 'coordinator') {
      q = query(
        collection(db, 'assignments'),
        where('status', '==', 'Approved'),
        where('ciOfficerId', '==', user.id)
      );
    }
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Assignment[];
      setAssignments(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'assignments');
    });

    return () => unsubscribe();
  }, []);

  const handleNext = () => {
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!selected) return;
    try {
      await api.patch(`/api/assignments/${selected.id}`, {
        validationResults: {
          didAnswerCalls: validation.didAnswerCalls,
          didReceiveProceeds: validation.didReceiveProceeds,
          didExplainPN: validation.didExplainPN,
          didExplainDeductions: validation.didExplainDeductions
        },
        survey: {
          ...survey,
          createdAt: new Date().toISOString()
        },
        status: 'Completed',
        timeline: [...selected.timeline, { 
          step: 'Completed', 
          timestamp: new Date().toISOString(),
          note: 'CI Officer submitted validation and satisfaction survey results'
        }]
      });

      // Notify Admins
      const adminsSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
      adminsSnapshot.forEach(adminDoc => {
        createNotification(
          adminDoc.id,
          'Validation & Survey Completed',
          `CI Officer ${user.fullName} completed validation and survey for ${selected.borrowerName}`,
          'status_change',
          selected.id
        );
      });

      setSelected(null);
      setStep(1);
      setValidation({
        didAnswerCalls: false,
        didReceiveProceeds: false,
        didExplainPN: false,
        didExplainDeductions: false
      });
      setSurvey({
        satisfaction: 5,
        speed: 5,
        clarity: 5,
        affordability: 5,
        customerService: 5,
        recommend: 'Yes',
        recommendExplanation: '',
        comments: ''
      });
    } catch (err) {
      console.error(err);
    }
  };

  const ratings = [
    { label: 'How satisfied are you with the loan application process?', key: 'satisfaction', options: ['Very unsatisfied', 'Unsatisfied', 'Neutral', 'Satisfied', 'Very satisfied'] },
    { label: 'How would you rate the speed of loan approval and release?', key: 'speed', options: ['Very slow', 'Slow', 'Average', 'Fast', 'Very fast'] },
    { label: 'How clear and understandable were the loan terms and conditions?', key: 'clarity', options: ['Very unclear', 'Unclear', 'Neutral', 'Clear', 'Very clear'] },
    { label: 'How affordable do you find the interest rates and fees?', key: 'affordability', options: ['Very expensive', 'Expensive', 'Neutral', 'Affordable', 'Very affordable'] },
    { label: 'How would you rate the customer service support during your loan experience?', key: 'customerService', options: ['Very poor', 'Poor', 'Fair', 'Good', 'Excellent'] },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-black text-emerald-800 uppercase tracking-widest mb-2">Pending Validation & Survey</h2>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Select a client to record their post-release feedback</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map(a => (
          <div 
            key={a.id} 
            onClick={() => {
              setSelected(a);
              setStep(1);
            }}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer relative group"
          >
            <div className="absolute top-4 right-4 text-amber-500 animate-pulse group-hover:scale-110 transition-transform">
              <ClipboardList size={18} />
            </div>
            <h4 className="font-black text-sm uppercase text-emerald-800">{a.borrowerName}</h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
               <Phone size={10} /> {a.mobileNumber}
            </p>
            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
              <div className="text-[10px] space-y-1">
                <p className="text-gray-400 uppercase tracking-widest">Released Amount</p>
                <p className="font-bold">₱{a.approvedAmount?.toLocaleString()}</p>
              </div>
              <ChevronRight className="text-gray-300 group-hover:translate-x-1 transition-transform" size={16} />
            </div>
          </div>
        ))}
        {assignments.length === 0 && (
          <div className="col-span-full py-20 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
             <CheckCircle2 className="mx-auto text-gray-200 mb-4" size={48} />
             <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No pending validations found</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative my-8"
            >
              <div className="p-8 md:p-10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-3xl font-black text-emerald-800 uppercase tracking-tight">{selected.borrowerName}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Validation & Survey</p>
                      <div className="h-1 w-1 bg-gray-300 rounded-full" />
                      <p className="text-xs text-emerald-700 font-black uppercase tracking-widest">Step {step} of 2</p>
                      <button 
                        onClick={() => setIsViewingAccount(true)}
                        className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-800 transition-colors flex items-center gap-1 border-l border-emerald-100 pl-4 ml-4"
                      >
                        <FileText size={10} /> View Account Information
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelected(null)} 
                    className="p-2 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                {step === 1 ? (
                  <div className="space-y-6">
                    <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                      <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-6">Internal Validation Checkpoints</h4>
                      <div className="space-y-3">
                        {[
                          { id: 'didAnswerCalls', label: 'Did client answer all verification calls?' },
                          { id: 'didReceiveProceeds', label: 'Did the client receive full loan proceeds?' },
                          { id: 'didExplainPN', label: 'Did you explain the Promissory Note properly?' },
                          { id: 'didExplainDeductions', label: 'Were all deductions clearly explained?' }
                        ].map(q => (
                          <label key={q.id} className="flex items-center justify-between p-4 bg-white rounded-2xl cursor-pointer hover:shadow-md transition-all border border-gray-50 group">
                            <span className="text-[11px] font-bold text-gray-600 uppercase tracking-tight group-hover:text-emerald-700 transition-colors">{q.label}</span>
                            <div className={cn(
                              "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                              (validation as any)[q.id] ? "bg-emerald-600 text-white" : "bg-gray-100 text-transparent"
                            )}>
                              <Check size={14} strokeWidth={4} />
                              <input 
                                type="checkbox" 
                                className="hidden"
                                checked={(validation as any)[q.id]}
                                onChange={e => setValidation({...validation, [q.id]: e.target.checked})}
                              />
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={handleNext}
                      className="w-full py-6 bg-emerald-600 text-white font-black rounded-3xl shadow-xl shadow-emerald-900/40 hover:bg-emerald-700 hover:-translate-y-1 transition-all uppercase tracking-[0.3em] text-[11px]"
                    >
                      Continue to Client Survey
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="space-y-6">
                      {ratings.map((r, i) => (
                        <div key={r.key} className="space-y-3">
                          <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex gap-2">
                             <span className="text-emerald-700">0{i + 1}.</span> {r.label}
                          </label>
                          <div className="grid grid-cols-5 gap-2">
                            {r.options.map((opt, idx) => (
                              <button
                                key={opt}
                                onClick={() => setSurvey({...survey, [r.key]: idx + 1})}
                                className={cn(
                                  "py-3 rounded-xl text-[8px] font-black uppercase tracking-tighter transition-all border-2",
                                  (survey as any)[r.key] === idx + 1 
                                    ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-900/20" 
                                    : "bg-gray-50 border-gray-50 text-gray-400 hover:border-gray-200"
                                )}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}

                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex gap-2">
                          <span className="text-emerald-700">06.</span> Would you recommend our loan service to others?
                        </label>
                        <div className="flex gap-4">
                          {['Yes', 'No'].map(v => (
                            <button
                              key={v}
                              onClick={() => setSurvey({...survey, recommend: v as 'Yes' | 'No'})}
                              className={cn(
                                "flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                                survey.recommend === v 
                                  ? (v === 'Yes' ? "bg-emerald-500 border-emerald-500 text-white shadow-lg" : "bg-red-500 border-red-500 text-white shadow-lg")
                                  : "bg-gray-50 border-gray-50 text-gray-400 hover:border-gray-200"
                              )}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                        <input 
                          type="text"
                          placeholder="Quick reason for your answer..."
                          className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-[11px] font-bold focus:bg-white focus:border-emerald-500/20 focus:outline-none transition-all"
                          value={survey.recommendExplanation}
                          onChange={e => setSurvey({...survey, recommendExplanation: e.target.value})}
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">07. Comments or Suggestions</label>
                        <textarea 
                          className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-3xl text-[11px] font-bold h-32 focus:bg-white focus:border-emerald-500/20 focus:outline-none transition-all"
                          placeholder="Tell us how we can improve your experience..."
                          value={survey.comments}
                          onChange={e => setSurvey({...survey, comments: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                       <button 
                        onClick={() => setStep(1)}
                        className="px-8 py-6 bg-gray-100 text-gray-400 font-black rounded-3xl hover:bg-gray-200 transition-all uppercase tracking-[0.2em] text-[10px]"
                      >
                        Back
                      </button>
                      <button 
                        onClick={handleSubmit}
                        className="flex-1 py-6 bg-green-500 text-white font-black rounded-3xl shadow-xl shadow-green-500/20 hover:bg-green-600 hover:-translate-y-1 transition-all uppercase tracking-[0.3em] text-[11px]"
                      >
                        Submit Overall Satisfaction
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
        {isViewingAccount && selected && (
          <AccountDossierModal 
            assignment={selected} 
            onClose={() => setIsViewingAccount(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ValidationSurveyResults({ user }: { user: UserProfile }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [isViewingAccount, setIsViewingAccount] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'assignments'), where('status', '==', 'Completed'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Assignment[];
      setAssignments(data.filter(a => a.survey));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'assignments');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDeleteResponse = async () => {
    if (!selected) return;
    if (!window.confirm('WARNING: Are you sure you want to delete this response? This will clear all client feedback and validation data, and move the account back to "Approved" status for re-submission.')) return;
    
    setIsDeleting(true);
    try {
      await updateDoc(doc(db, 'assignments', selected.id), {
        validationResults: deleteField(),
        survey: deleteField(),
        status: 'Approved', // Move back to pending survey
        timeline: [...selected.timeline, {
          step: 'Response Deleted',
          timestamp: new Date().toISOString(),
          note: `Admin ${user.fullName} deleted the previous validation & survey response.`
        }]
      });
      setSelected(null);
      alert('Response deleted successfully. The account is now pending for a new survey.');
    } catch (err) {
      console.error('Failed to delete response:', err);
      alert('Failed to delete response. Please check permissions.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
    </div>
  );

  const getRatingLabel = (score: number, options: string[]) => {
    return options[score - 1];
  };

  const surveyMetrics = [
    { label: 'Overall Satisfaction', key: 'satisfaction', options: ['Very unsatisfied', 'Unsatisfied', 'Neutral', 'Satisfied', 'Very satisfied'] },
    { label: 'Approval Speed', key: 'speed', options: ['Very slow', 'Slow', 'Average', 'Fast', 'Very fast'] },
    { label: 'Term Clarity', key: 'clarity', options: ['Very unclear', 'Unclear', 'Neutral', 'Clear', 'Very clear'] },
    { label: 'Rate Affordability', key: 'affordability', options: ['Very expensive', 'Expensive', 'Neutral', 'Affordable', 'Very affordable'] },
    { label: 'Support Quality', key: 'customerService', options: ['Very poor', 'Poor', 'Fair', 'Good', 'Excellent'] },
  ];

  const filtered = assignments.filter(a => 
    a.borrowerName.toLowerCase().includes(search.toLowerCase()) ||
    a.ciOfficerName.toLowerCase().includes(search.toLowerCase())
  );

  const isMobileView = window.innerWidth < 1024;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-emerald-800 uppercase tracking-tight">Validation & Survey Results</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Analyzing client feedback and service performance</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search feedback..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 px-6 py-3 bg-green-50 text-green-600 rounded-2xl border border-green-100 w-full md:w-auto justify-center">
             <Star size={18} fill="currentColor" />
             <span className="text-[11px] font-black uppercase tracking-widest">Live Feedback</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {(!selected || !isMobileView) && (
          <div className="lg:col-span-1 space-y-4 font-sans">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-4">Submitted Responses</h3>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden divide-y divide-gray-50">
              {filtered.map(a => (
                <button
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className={cn(
                    "w-full p-6 text-left hover:bg-gray-50 transition-all group border-l-4 cursor-pointer",
                    selected?.id === a.id ? "bg-gray-50 border-l-emerald-600 shadow-sm" : "border-l-transparent"
                  )}
                >
                  <h4 className="font-black text-xs uppercase text-gray-700 group-hover:text-emerald-700">{a.borrowerName}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          size={10} 
                          className={star <= (a.survey?.satisfaction || 0) ? "text-amber-400 fill-amber-400" : "text-gray-200"} 
                        />
                      ))}
                    </div>
                    <span className="text-[8px] text-gray-400 font-bold uppercase">{format(new Date(a.survey?.createdAt || ''), 'MMM d')}</span>
                  </div>
                </button>
              ))}
              {assignments.length === 0 && (
                <div className="p-12 text-center opacity-40">
                  <ClipboardList className="mx-auto mb-2" size={32} />
                  <p className="text-[10px] font-black uppercase tracking-widest">No surveys yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {(selected || !isMobileView) && (
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 md:p-10 space-y-12"
                >
                  {isMobileView && (
                    <button 
                      onClick={() => setSelected(null)} 
                      className="flex items-center gap-2 mb-6 text-emerald-800 font-black uppercase text-[10px] bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-100/50 cursor-pointer w-fit"
                    >
                      <ChevronRight className="rotate-180" size={14} /> Back to responses
                    </button>
                  )}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-3xl font-black text-emerald-800 uppercase tracking-tight">{selected.borrowerName}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">Survey received on {format(new Date(selected.survey?.createdAt || ''), 'MMMM d, yyyy | h:mm a')}</p>
                      <button 
                        onClick={() => setIsViewingAccount(true)}
                        className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-800 transition-colors flex items-center gap-1 border-l border-emerald-100 pl-4 ml-4"
                      >
                        <FileText size={10} /> View Account Information
                      </button>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    {user.role === 'admin' && (
                      <button
                        onClick={handleDeleteResponse}
                        disabled={isDeleting}
                        className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all border border-red-100 flex items-center gap-2 shadow-sm"
                        title="Delete Response"
                      >
                        <Trash2 size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Delete Response</span>
                      </button>
                    )}
                    <div className="text-right border-l border-gray-100 pl-4">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">CI Officer</p>
                      <p className="text-xs font-black text-emerald-800 uppercase">{selected.ciOfficerName}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-8">
                     <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">Performance Metrics</h4>
                     <div className="space-y-6">
                        {surveyMetrics.map(m => (
                          <div key={m.key} className="space-y-2">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-gray-500 uppercase tracking-tight">{m.label}</span>
                              <span className="font-black text-[#4C1D95] uppercase">{getRatingLabel((selected.survey as any)[m.key], m.options)}</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
                               {[1, 2, 3, 4, 5].map((level) => (
                                 <div 
                                  key={level}
                                  className={cn(
                                    "flex-1 border-r border-white last:border-0",
                                    level <= (selected.survey as any)[m.key] ? "bg-amber-400" : "bg-transparent"
                                  )}
                                 />
                               ))}
                            </div>
                          </div>
                        ))}
                     </div>
                   </div>

                   <div className="space-y-8">
                     <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">Additional Feedback</h4>
                     <div className="space-y-8">
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Service Recommendation</p>
                          <div className="flex items-center gap-3">
                             <div className={cn(
                               "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white",
                               selected.survey?.recommend === 'Yes' ? "bg-green-500" : "bg-red-500"
                             )}>
                               {selected.survey?.recommend}
                             </div>
                             <p className="text-xs italic text-gray-600">"{selected.survey?.recommendExplanation}"</p>
                          </div>
                        </div>

                        <div className="space-y-2 bg-gray-50 p-6 rounded-2xl relative">
                          <div className="absolute top-0 right-6 -translate-y-1/2 bg-white px-4 py-1 rounded-full border border-gray-100 shadow-sm">
                             <p className="text-[9px] font-black uppercase text-gray-400">Comments / Suggestions</p>
                          </div>
                          <p className="text-xs text-gray-700 font-medium leading-relaxed">
                            {selected.survey?.comments || "No comments provided by the client."}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-gray-50">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Internal Validation Checkpoints</p>
                          <div className="grid grid-cols-2 gap-3">
                             {[
                               { label: 'Answered Calls', val: selected.validationResults?.didAnswerCalls },
                               { label: 'Received Proceeds', val: selected.validationResults?.didReceiveProceeds },
                               { label: 'PN Explained', val: selected.validationResults?.didExplainPN },
                               { label: 'Deductions Explained', val: selected.validationResults?.didExplainDeductions },
                             ].map(check => (
                               <div key={check.label} className="flex items-center gap-2">
                                 <div className={cn(
                                   "w-4 h-4 rounded-md flex items-center justify-center",
                                   check.val ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                                 )}>
                                   {check.val ? <Check size={10} strokeWidth={4} /> : <X size={10} strokeWidth={4} />}
                                 </div>
                                 <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">{check.label}</span>
                               </div>
                             ))}
                          </div>
                        </div>
                     </div>
                   </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100 text-center p-12">
                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl mb-6">
                    <Database size={32} className="text-gray-200" />
                 </div>
                 <h4 className="text-xl font-black text-gray-300 uppercase tracking-widest">Select Repository Data</h4>
                 <p className="text-xs text-gray-400 mt-2 font-medium">Click on a client name to review their full validation & survey dossier</p>
              </div>
            )}
          </AnimatePresence>
          {isViewingAccount && selected && (
            <AccountDossierModal 
              assignment={selected} 
              onClose={() => setIsViewingAccount(false)} 
            />
          )}
        </div>
      )}
    </div>
    </div>
  );
}

function DataStorage({ user }: { user: UserProfile }) {
  console.log("Accessing Data Storage repository for user authenticated email:", user.email);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [accountTypeFilter, setAccountTypeFilter] = useState('All');
  const [ciOfficerFilter, setCiOfficerFilter] = useState('All');
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [ciOfficers, setCiOfficers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(q, (snapshot) => {
      setCiOfficers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserProfile[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    const qAss = query(collection(db, 'assignments'), orderBy('createdAt', 'desc'));
    const unsubAss = onSnapshot(qAss, (snapshot) => {
      setAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Assignment[]);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'assignments');
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubAss();
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this client data?')) return;
    try {
      await api.delete(`/api/assignments/${id}`);
      alert('Data deleted successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to delete data.');
    }
  };

  const filtered = assignments.filter(a => {
    const matchesSearch = a.borrowerName.toLowerCase().includes(search.toLowerCase()) ||
                         a.ciOfficerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    const matchesType = accountTypeFilter === 'All' || a.accountType === accountTypeFilter;
    const matchesCI = ciOfficerFilter === 'All' || a.ciOfficerId === ciOfficerFilter;
    return matchesSearch && matchesStatus && matchesType && matchesCI;
  });

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-emerald-800 uppercase tracking-tight">Main Data Storage</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Comprehensive Archive
            </p>
          </div>
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search all records..."
              className="w-full pl-12 pr-6 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl text-sm focus:outline-none focus:border-emerald-500/20 font-medium transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-50">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Filter by Status</label>
            <select 
              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold uppercase focus:outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              {steps.map(s => <option key={s} value={s}>{s}</option>)}
              <option value="Archived">Archived</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Account Type</label>
            <select 
              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold uppercase focus:outline-none"
              value={accountTypeFilter}
              onChange={(e) => setAccountTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="New">New</option>
              <option value="Renewal">Renewal</option>
              <option value="Restructure">Restructure</option>
              <option value="Additional">Additional</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">CI Officer</label>
            <select 
              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold uppercase focus:outline-none"
              value={ciOfficerFilter}
              onChange={(e) => setCiOfficerFilter(e.target.value)}
            >
              <option value="All">All Officers</option>
              {ciOfficers.map(o => <option key={o.id} value={o.id}>{o.fullName}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-5">Client Identifier</th>
                <th className="px-6 py-5">Account Spec</th>
                <th className="px-6 py-5">Financials</th>
                <th className="px-6 py-5">Geography</th>
                <th className="px-6 py-5">Field Staff</th>
                <th className="px-6 py-5">Lifecycle</th>
                <th className="px-6 py-5">Turn Around Time</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 group transition-colors">
                  <td className="px-6 py-5">
                    <div 
                      className="cursor-pointer group/name" 
                      onClick={() => {
                        setSelected(a);
                        setIsViewing(true);
                      }}
                    >
                      <p className="font-bold text-gray-900 uppercase text-sm group-hover/name:text-emerald-600 transition-colors">{a.borrowerName}</p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                        <Phone size={10} /> {a.mobileNumber}
                      </p>
                      {a.status === 'Archived' && (
                        <div className="mt-2 text-[10px] bg-amber-50 border border-amber-200/50 rounded-lg p-2 text-amber-800 max-w-xs font-semibold leading-relaxed">
                          <span className="font-extrabold uppercase text-[8px] tracking-widest text-amber-600 block mb-0.5">Archive Reason:</span>
                          "{a.archiveReason || 'No specific reason logged.'}"
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-black uppercase px-2 py-1 bg-blue-50 text-blue-600 rounded">
                      {a.accountType}
                    </span>
                    <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-tighter">
                      CID: {a.id.slice(0, 8)}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <div>
                      <p className="text-xs font-black text-emerald-800">₱{a.requestedAmount.toLocaleString()}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">{a.term} Mos @ {a.intRate}%</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div>
                      <p className="text-xs font-bold text-gray-700">{a.location}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-black">{a.tribe}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-black">
                         {a.ciOfficerName.charAt(0)}
                       </div>
                       <span className="text-xs font-bold text-gray-600">{a.ciOfficerName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "text-[9px] font-black uppercase px-3 py-1 rounded-full",
                      a.status === 'Approved' ? "bg-green-100 text-green-600" :
                      a.status === 'Denied' ? "bg-red-100 text-red-600" :
                      a.status === 'Archived' ? "bg-amber-100 text-amber-700 border border-amber-200" :
                      a.status === 'Completed' ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"
                    )}>
                      {a.status}
                    </span>
                    <p className="text-[8px] text-gray-300 mt-2 font-mono">
                      {format(new Date(a.createdAt), 'MMM d, yyyy')}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <p className="text-[10px] font-black text-emerald-800 uppercase tracking-tighter">
                        {(() => {
                          try {
                            const assignedStep = a.timeline.find(s => s.step === 'Assigned');
                            const preApprovedStep = a.timeline.find(s => s.step === 'Pre-approved');
                            
                            const start = assignedStep ? parseISO(assignedStep.timestamp) : parseISO(a.createdAt);
                            let end = new Date();
                            
                            if (preApprovedStep) {
                              end = parseISO(preApprovedStep.timestamp);
                            } else {
                              // If already beyond pre-approved, use the first step that reached that level
                              const targetStatuses = ['Pre-approved', 'Approved', 'Denied', 'Completed'];
                              const completedStep = a.timeline.find(s => targetStatuses.includes(s.step));
                              if (completedStep) {
                                end = parseISO(completedStep.timestamp);
                              }
                            }
                            
                            const diffMs = Math.max(0, end.getTime() - start.getTime());
                            const diffMins = Math.floor(diffMs / (1000 * 60));
                            
                            const d = Math.floor(diffMins / (24 * 60));
                            const h = Math.floor((diffMins % (24 * 60)) / 60);
                            const m = diffMins % 60;
                            
                            return `${d}D(Days), ${h}H(Hours), ${m}M(minutes)`;
                          } catch {
                            return "--";
                          }
                        })()}
                      </p>
                      {['Pre-approved', 'Approved', 'Denied', 'Completed'].includes(a.status) ? (
                        <p className="text-[8px] text-emerald-600 font-bold uppercase mt-1">Final TAT (Pre-app)</p>
                      ) : (
                        <p className="text-[8px] text-amber-500 font-bold uppercase mt-1 animate-pulse">In Progress</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => {
                          setSelected(a);
                          setIsEditing(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => generateAssignmentPPT(a)}
                        className="p-2 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all"
                        title="Export PPT"
                      >
                        <Presentation size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(a.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-20 text-center">
              <Database className="mx-auto text-gray-200 mb-4" size={48} />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No matching records found in storage</p>
            </div>
          )}
        </div>
      </div>

      {isEditing && selected && (
        <EditAssignmentModal 
          assignment={selected} 
          ciOfficers={ciOfficers} 
          onClose={() => {
            setIsEditing(false);
            setSelected(null);
          }} 
        />
      )}

      {isViewing && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-emerald-100"
          >
            <div className="bg-linear-to-r from-emerald-800 to-emerald-900 p-8 text-white flex justify-between items-center">
               <div>
                 <h3 className="text-xl font-black uppercase tracking-tight">Client Account Dossier</h3>
                 <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mt-1">Repository Registry ID: {selected.id.slice(0, 16)}</p>
               </div>
               <button onClick={() => { setIsViewing(false); setSelected(null); }} className="hover:rotate-90 transition-transform bg-white/10 p-2 rounded-xl">
                 <X size={20} />
               </button>
            </div>
            
            <div className="p-8 grid grid-cols-2 gap-8">
               <div className="space-y-6">
                 <div className="space-y-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Full Legal Name</p>
                    <p className="text-sm font-black text-emerald-800 uppercase">{selected.borrowerName}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Contact Protocol</p>
                    <p className="text-sm font-bold text-gray-700">{selected.mobileNumber || 'N/A'}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Geographic Deployment</p>
                    <p className="text-sm font-bold text-gray-700">{selected.location} <span className="text-[10px] text-gray-400">({selected.tribe})</span></p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Registration Metadata</p>
                    <p className="text-xs font-mono text-gray-500 italic">{format(new Date(selected.createdAt), 'MMMM dd, yyyy | hh:mm a')}</p>
                 </div>
               </div>

               <div className="space-y-6">
                 <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest mb-3">Financial Specifications</p>
                    <div className="space-y-3">
                       <div className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-emerald-100">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Requirement</span>
                          <span className="text-xs font-black text-emerald-900 border-b-2 border-emerald-500/20 px-1">₱{selected.requestedAmount.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-emerald-100">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Configuration</span>
                          <span className="text-[10px] font-black text-emerald-900 uppercase tracking-tighter bg-emerald-50/50 px-2 rounded-md">{selected.accountType}</span>
                       </div>
                       <div className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-emerald-100">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Duration</span>
                          <span className="text-[10px] font-black text-emerald-900">{selected.term} STAGES</span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-1 px-2">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Assigned Personnel</p>
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-black text-emerald-700">
                          {selected.ciOfficerName.charAt(0)}
                       </div>
                       <div>
                         <p className="text-xs font-black text-gray-700 uppercase leading-none">{selected.ciOfficerName}</p>
                         <p className="text-[8px] text-emerald-600 font-bold uppercase tracking-widest mt-1">Field CI Officer</p>
                       </div>
                    </div>
                 </div>
               </div>
            </div>
            
            {selected.status === 'Archived' && (
              <div className="mx-8 mb-6 p-4 bg-amber-50 border border-amber-200/50 rounded-2xl flex items-start gap-3 select-text text-left">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black text-amber-950 uppercase tracking-widest">Archived Account Specification</h4>
                  <p className="text-[9px] text-amber-600 font-extrabold uppercase tracking-wider">Reason / Remarks for Discontinuation:</p>
                  <p className="text-xs text-slate-800 font-semibold italic">"{selected.archiveReason || 'No specific remarks were entered during archive.'}"</p>
                </div>
              </div>
            )}

            <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
               <button 
                 onClick={() => { setIsViewing(false); setSelected(null); }}
                 className="px-6 py-2.5 bg-emerald-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-900 transition-all shadow-lg shadow-emerald-900/20"
               >
                 Acknowledge Repository Entry
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function getLeaveDays(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 0;
  try {
    const d1 = new Date(startDateStr);
    const d2 = new Date(endDateStr);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  } catch {
    return 1;
  }
}

function ReportsView({ user }: { user: UserProfile }) {
  const [activeReportTab, setActiveReportTab] = useState<'assignments' | 'attendance' | 'leaves' | 'overtime' | 'leave_summary'>('assignments');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [overtime, setOvertime] = useState<OvertimeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSummaryMonth, setSelectedSummaryMonth] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    const unsubscribes: (() => void)[] = [];
    const isAdminOrCoordinator = user.role === 'admin' || user.role === 'coordinator';

    // Assignments
    const qAssign = isAdminOrCoordinator 
      ? query(collection(db, 'assignments'), limit(1000))
      : query(collection(db, 'assignments'), where('ciOfficerId', '==', user.id));
    
    unsubscribes.push(onSnapshot(qAssign, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Assignment[];
      setAssignments(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'assignments');
    }));

    // Attendance
    const qAtt = isAdminOrCoordinator
      ? query(collection(db, 'attendance'), limit(1000))
      : query(collection(db, 'attendance'), where('userId', '==', user.id));
    
    unsubscribes.push(onSnapshot(qAtt, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as AttendanceRecord[];
      setAttendance(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'attendance');
    }));

    // Leaves
    const qLeave = isAdminOrCoordinator
      ? query(collection(db, 'leaves'), limit(1000))
      : query(collection(db, 'leaves'), where('userId', '==', user.id));
    
    unsubscribes.push(onSnapshot(qLeave, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as LeaveRequest[];
      setLeaves(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'leaves');
    }));

    // Overtime
    const qOt = isAdminOrCoordinator
      ? query(collection(db, 'overtime'), limit(1000))
      : query(collection(db, 'overtime'), where('userId', '==', user.id));
    
    unsubscribes.push(onSnapshot(qOt, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as OvertimeRequest[];
      setOvertime(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'overtime');
      setLoading(false);
    }));

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user.id, user.role]);

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = a.borrowerName.toLowerCase().includes(search.toLowerCase()) || a.ciOfficerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    const date = new Date(a.createdAt);
    const matchesDate = (!startDate || date >= new Date(startDate)) && (!endDate || date <= new Date(endDate + 'T23:59:59'));
    return matchesSearch && matchesStatus && matchesDate;
  });

  const filteredAttendance = attendance.filter(a => {
    const matchesSearch = a.userName.toLowerCase().includes(search.toLowerCase());
    const date = new Date(a.date);
    const matchesDate = (!startDate || date >= new Date(startDate)) && (!endDate || date <= new Date(endDate + 'T23:59:59'));
    return matchesSearch && matchesDate;
  });

  const filteredLeaves = leaves.filter(l => {
    const matchesSearch = l.userName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    const date = new Date(l.startDate);
    const matchesDate = (!startDate || date >= new Date(startDate)) && (!endDate || date <= new Date(endDate + 'T23:59:59'));
    return matchesSearch && matchesStatus && matchesDate;
  });

  const filteredOvertime = overtime.filter(o => {
    const matchesSearch = o.userName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    const date = new Date(o.date);
    const matchesDate = (!startDate || date >= new Date(startDate)) && (!endDate || date <= new Date(endDate + 'T23:59:59'));
    return matchesSearch && matchesStatus && matchesDate;
  });

  const summaryMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    leaves.forEach(l => {
      const dateStr = l.startDate || l.createdAt;
      if (dateStr) {
        try {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            const yyyymm = format(date, 'yyyy-MM');
            monthsSet.add(yyyymm);
          }
        } catch {
          // ignore
        }
      }
    });
    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
  }, [leaves]);

  const filteredSummaryLeaves = useMemo(() => {
    return leaves.filter(l => {
      const matchesSearch = l.userName.toLowerCase().includes(search.toLowerCase()) || l.leaveType.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
      
      let matchesMonth = true;
      if (selectedSummaryMonth !== 'all') {
        const dateStr = l.startDate || l.createdAt;
        if (dateStr) {
          try {
            const d = new Date(dateStr);
            matchesMonth = !isNaN(d.getTime()) && format(d, 'yyyy-MM') === selectedSummaryMonth;
          } catch {
            matchesMonth = false;
          }
        } else {
          matchesMonth = false;
        }
      }

      const date = new Date(l.startDate);
      const matchesDate = (!startDate || date >= new Date(startDate)) && (!endDate || date <= new Date(endDate + 'T23:59:59'));
      
      return matchesSearch && matchesStatus && matchesMonth && matchesDate;
    });
  }, [leaves, search, statusFilter, selectedSummaryMonth, startDate, endDate]);

  const getExportData = () => {
    switch(activeReportTab) {
      case 'assignments': return filteredAssignments;
      case 'attendance': return filteredAttendance;
      case 'leaves': return filteredLeaves;
      case 'overtime': return filteredOvertime;
      case 'leave_summary': return filteredSummaryLeaves;
    }
  };

  const exportCSV = () => {
    const data = getExportData();
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (activeReportTab === 'assignments') {
      headers = ['Borrower', 'Account Type', 'Officer', 'Status', 'Date'];
      rows = (data as Assignment[]).map(a => [a.borrowerName, a.accountType, a.ciOfficerName, a.status, a.createdAt]);
    } else if (activeReportTab === 'attendance') {
      headers = ['Employee', 'Date', 'Time In', 'Time Out', 'Status'];
      rows = (data as AttendanceRecord[]).map(a => [a.userName, a.date, a.timeIn, a.timeOut, a.status]);
    } else if (activeReportTab === 'leaves') {
      headers = ['Employee', 'Type', 'Start', 'End', 'Status'];
      rows = (data as LeaveRequest[]).map(l => [l.userName, l.leaveType, l.startDate, l.endDate, l.status]);
    } else if (activeReportTab === 'overtime') {
      headers = ['Employee', 'Date', 'Hours', 'Minutes', 'Status'];
      rows = (data as OvertimeRequest[]).map(o => [o.userName, o.date, o.hours, o.minutes, o.status]);
    } else if (activeReportTab === 'leave_summary') {
      headers = ['Employee', 'Type of Leave', 'Start Date', 'End Date', 'No. of Days', 'Status'];
      rows = (data as LeaveRequest[]).map(l => [
        l.userName,
        l.leaveType,
        l.startDate,
        l.endDate,
        getLeaveDays(l.startDate, l.endDate),
        l.status === 'Approved' ? 'Approved' : l.status === 'Rejected' ? 'Denied' : 'Pending'
      ]);
    }

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CIBI_${activeReportTab}_Report.csv`;
    a.click();
  };

  const statusOptions = [
    'All', 'Assigned', 'Start to Perform Assignment', 'Reviewing', 'Field CIBI', 'Cashflowing', 'Report Submitted', 'Completed', 'Approved', 'Denied'
  ];

  if (loading) return <div className="p-20 text-center animate-pulse uppercase font-black text-emerald-800">Compiling Report Data...</div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-32">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="space-y-1 z-10">
          <h2 className="text-3xl font-black text-emerald-900 uppercase tracking-tighter">Reporting Hub</h2>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {(['assignments', 'attendance', 'leaves', 'overtime', 'leave_summary'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveReportTab(tab); setSearch(''); setStatusFilter('All'); }}
                className={cn(
                  "px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
                  activeReportTab === tab ? "bg-emerald-800 text-white shadow-xl shadow-emerald-950/20" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                )}
              >
                {tab === 'leave_summary' ? 'Leave Filed Summary' : tab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 z-10 w-full lg:w-auto">
          <button 
            onClick={exportCSV}
            className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-10 py-4 bg-linear-to-br from-emerald-600 to-emerald-800 text-white rounded-[1.25rem] text-[11px] font-black uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-emerald-900/40 transition-all active:scale-95 group"
          >
            <Download size={18} className="group-hover:translate-y-0.5 transition-transform" /> 
            Export Records
          </button>
        </div>
        <BarChart3 className="absolute -right-12 -bottom-12 w-64 h-64 text-emerald-800/5 rotate-12" />
      </div>

      {/* SEARCH & FILTERS */}
      <div className={cn(
        "bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm grid gap-6",
        activeReportTab === 'leave_summary' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5" : "grid-cols-1 md:grid-cols-4"
      )}>
        <div className="relative group">
          <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search Intelligence..."
            className="w-full h-14 pl-14 pr-6 bg-gray-50 border-2 border-transparent rounded-2xl text-xs font-bold focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        {activeReportTab === 'leave_summary' && (
          <div className="relative">
             <select 
               className="w-full h-14 px-6 bg-gray-50 border-2 border-transparent rounded-2xl text-xs font-bold focus:border-teal-500 focus:bg-white focus:outline-none appearance-none cursor-pointer uppercase tracking-wider text-emerald-800"
               value={selectedSummaryMonth}
               onChange={e => setSelectedSummaryMonth(e.target.value)}
             >
               <option value="all">📅 All Months</option>
               {summaryMonths.map(m => {
                 let label = m;
                 try {
                   const [year, colMonth] = m.split('-');
                   const d = new Date(parseInt(year), parseInt(colMonth) - 1, 1);
                   label = format(d, 'MMMM yyyy');
                 } catch {
                   // ignore
                 }
                 return <option key={m} value={m}>{label}</option>;
               })}
             </select>
             <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" size={16} />
             <p className="absolute -top-2.5 left-5 bg-white px-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">Select Month</p>
          </div>
        )}

        {activeReportTab !== 'attendance' && (
          <div className="relative">
             <select 
               className="w-full h-14 px-6 bg-gray-50 border-2 border-transparent rounded-2xl text-xs font-bold focus:border-emerald-500 focus:bg-white focus:outline-none appearance-none cursor-pointer capitalize"
               value={statusFilter}
               onChange={e => setStatusFilter(e.target.value)}
             >
               <option value="All">All Status Manifests</option>
               {activeReportTab === 'assignments' && statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
               {(activeReportTab === 'leaves' || activeReportTab === 'overtime' || activeReportTab === 'leave_summary') && ['Pending', 'Approved', 'Rejected'].map(opt => (
                 <option key={opt} value={opt}>{opt === 'Rejected' ? 'Denied' : opt}</option>
               ))}
             </select>
             <Filter className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={16} />
          </div>
        )}

        <div className="relative">
          <input 
            type="date"
            className="w-full h-14 px-6 bg-gray-50 border-2 border-transparent rounded-2xl text-xs font-bold focus:border-emerald-500 focus:bg-white focus:outline-none uppercase"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
          <p className="absolute -top-2.5 left-5 bg-white px-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">From Date</p>
        </div>

        <div className="relative">
          <input 
            type="date"
            className="w-full h-14 px-6 bg-gray-50 border-2 border-transparent rounded-2xl text-xs font-bold focus:border-emerald-500 focus:bg-white focus:outline-none uppercase"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
          <p className="absolute -top-2.5 left-5 bg-white px-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">To Date</p>
        </div>
      </div>

      {/* DATA VIEWPORT */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {activeReportTab === 'leave_summary' ? (
                  <>
                    <th className="p-8 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Employee Name</th>
                    <th className="p-8 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Type of Leave</th>
                    <th className="p-8 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Date of Leave</th>
                    <th className="p-8 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">No. of Days</th>
                    <th className="p-8 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                  </>
                ) : (
                  <>
                    <th className="p-8 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Primary Entity</th>
                    <th className="p-8 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Operational Data</th>
                    <th className="p-8 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Temporal Stamp</th>
                    <th className="p-8 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">System Status</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50/50">
              {activeReportTab === 'assignments' && filteredAssignments.map(a => (
                <tr key={a.id} className="group hover:bg-emerald-50/30 transition-all duration-300">
                  <td className="p-8">
                    <p className="text-sm font-black text-emerald-950 uppercase">{a.borrowerName}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{a.accountType}</p>
                  </td>
                  <td className="p-8">
                    <p className="text-xs font-black text-emerald-800">₱{a.requestedAmount.toLocaleString()}</p>
                    <p className="text-[9px] text-gray-400 font-medium italic mt-0.5">{a.term} Duration</p>
                  </td>
                  <td className="p-8">
                    <p className="text-xs font-mono text-gray-500 font-bold">{format(new Date(a.createdAt), 'MMM dd, yyyy')}</p>
                  </td>
                  <td className="p-8">
                    <span className="px-5 py-1.5 bg-emerald-100/50 text-emerald-700 text-[9px] font-black uppercase rounded-full tracking-widest border border-emerald-200/50">{a.status}</span>
                  </td>
                </tr>
              ))}
              
              {activeReportTab === 'attendance' && filteredAttendance.map(a => (
                <tr key={a.id} className="group hover:bg-emerald-50/30 transition-all duration-300">
                  <td className="p-8">
                    <p className="text-sm font-black text-emerald-950 uppercase">{a.userName}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Staff Resource</p>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-3">
                       <span className="px-3 py-1 bg-white border border-gray-100 rounded-lg text-[10px] font-mono text-emerald-600 font-black">{a.timeIn}</span>
                       <ArrowRight size={12} className="text-gray-300" />
                       <span className="px-3 py-1 bg-white border border-gray-100 rounded-lg text-[10px] font-mono text-indigo-600 font-black">{a.timeOut || 'ACTIVE'}</span>
                    </div>
                  </td>
                  <td className="p-8">
                    <p className="text-xs font-mono text-gray-500 font-bold">{format(new Date(a.date), 'MMM dd, yyyy')}</p>
                  </td>
                  <td className="p-8">
                    <span className={cn(
                      "px-5 py-1.5 text-[9px] font-black uppercase rounded-full tracking-widest border",
                      a.status === 'ON TIME' ? "bg-emerald-100/50 text-emerald-700 border-emerald-200/50" : "bg-amber-100/50 text-amber-700 border-amber-200/50"
                    )}>{a.status}</span>
                  </td>
                </tr>
              ))}

              {activeReportTab === 'leaves' && filteredLeaves.map(l => (
                <tr key={l.id} className="group hover:bg-blue-50/30 transition-all duration-300">
                  <td className="p-8">
                    <p className="text-sm font-black text-gray-900 uppercase">{l.userName}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Exemption Request</p>
                  </td>
                  <td className="p-8">
                    <p className="text-xs font-black text-blue-800 uppercase tracking-tighter">{l.leaveType}</p>
                    <p className="text-[9px] text-gray-400 font-medium italic mt-0.5 line-clamp-1 max-w-[200px]">"{l.reason}"</p>
                  </td>
                  <td className="p-8">
                    <p className="text-xs font-mono text-gray-500 font-bold">{format(new Date(l.startDate), 'MMM dd')} - {format(new Date(l.endDate), 'MMM dd, yyyy')}</p>
                  </td>
                  <td className="p-8">
                    <span className={cn(
                      "px-5 py-1.5 text-[9px] font-black uppercase rounded-full tracking-widest border",
                      l.status === 'Approved' ? "bg-emerald-100/50 text-emerald-700 border-emerald-200/50" :
                      l.status === 'Rejected' ? "bg-red-100/50 text-red-700 border-red-200/50" : "bg-blue-100/50 text-blue-700 border-blue-200/50"
                    )}>{l.status}</span>
                  </td>
                </tr>
              ))}

              {activeReportTab === 'overtime' && filteredOvertime.map(o => (
                <tr key={o.id} className="group hover:bg-indigo-50/30 transition-all duration-300">
                  <td className="p-8">
                    <p className="text-sm font-black text-indigo-950 uppercase">{o.userName}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Extended Protocol</p>
                  </td>
                  <td className="p-8">
                    <p className="text-xs font-black text-indigo-700 uppercase">{o.hours}h {o.minutes}m Claim</p>
                    <p className="text-[9px] text-gray-400 font-medium italic mt-0.5 line-clamp-1 max-w-[200px]">"{o.reason}"</p>
                  </td>
                  <td className="p-8">
                    <p className="text-xs font-mono text-gray-500 font-bold">{format(new Date(o.date), 'MMM dd, yyyy')}</p>
                  </td>
                  <td className="p-8">
                    <span className={cn(
                      "px-5 py-1.5 text-[9px] font-black uppercase rounded-full tracking-widest border",
                      o.status === 'Approved' ? "bg-emerald-100/50 text-emerald-700 border-emerald-200/50" :
                      o.status === 'Rejected' ? "bg-red-100/50 text-red-700 border-red-200/50" : "bg-indigo-100/50 text-indigo-700 border-indigo-200/50"
                    )}>{o.status}</span>
                  </td>
                </tr>
              ))}

              {activeReportTab === 'leave_summary' && filteredSummaryLeaves.map(l => (
                <tr key={l.id} className="group hover:bg-teal-55/30 transition-all duration-300">
                  <td className="p-8">
                    <p className="text-sm font-black text-slate-900 uppercase">{l.userName}</p>
                    <p className="text-[9px] text-teal-600 font-bold uppercase tracking-widest mt-0.5">Active Exemption Duty</p>
                  </td>
                  <td className="p-8">
                    <p className="text-xs font-black text-teal-800 uppercase tracking-tighter">{l.leaveType}</p>
                    <p className="text-[9px] text-gray-400 font-medium italic mt-0.5 line-clamp-1 max-w-[200px]">"{l.reason || 'No specific reason given'}"</p>
                  </td>
                  <td className="p-8">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-tight">
                      {format(new Date(l.startDate), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                      to {format(new Date(l.endDate), 'MMM dd, yyyy')}
                    </p>
                  </td>
                  <td className="p-8">
                    <span className="px-3.5 py-1.5 bg-slate-100/80 text-slate-800 text-[10px] font-black uppercase rounded-lg tracking-wider border border-slate-200/40">
                      {getLeaveDays(l.startDate, l.endDate)} {getLeaveDays(l.startDate, l.endDate) === 1 ? 'Day' : 'Days'}
                    </span>
                  </td>
                  <td className="p-8">
                    <span className={cn(
                      "px-5 py-1.5 text-[9px] font-black uppercase rounded-full tracking-widest border shadow-xs transition-colors",
                      l.status === 'Approved' ? "bg-emerald-100/50 text-emerald-700 border-emerald-200/50" :
                      l.status === 'Rejected' ? "bg-red-100/50 text-red-700 border-red-200/50" : "bg-blue-100/50 text-blue-700 border-blue-200/50"
                    )}>
                      {l.status === 'Approved' ? 'Approved' : l.status === 'Rejected' ? 'Denied' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {(
            activeReportTab === 'assignments' ? filteredAssignments : 
            activeReportTab === 'attendance' ? filteredAttendance : 
            activeReportTab === 'leaves' ? filteredLeaves : 
            activeReportTab === 'leave_summary' ? filteredSummaryLeaves :
            filteredOvertime
          ).length === 0 && (
            <div className="py-32 text-center">
              <div className="relative inline-block">
                <ClipboardList className="mx-auto text-gray-100 mb-6" size={80} />
                <AlertCircle className="absolute -right-2 -bottom-2 text-emerald-900/10" size={32} />
              </div>
              <p className="text-xs font-black text-gray-300 uppercase tracking-[0.4em]">Zero Results Detected</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Adjust search parameters or status filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- OB FILLING MODULE ---
function OBFillingModule({ user }: { user: UserProfile }) {
  const isAdmin = user.role === 'admin';
  const [obRequests, setObRequests] = useState<OBRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    hours: format(new Date(), 'i') === '6' ? '7' : '8',
    minutes: '0',
    reason: ''
  });

  const updateDefaultHours = async (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      const isSaturday = date.getDay() === 6;
      let suggestedHours = isSaturday ? '7' : '8';
      let suggestedMinutes = '0';

      // Check if user has attendance for this day to suggest lateness correction
      const q = query(
        collection(db, 'attendance'), 
        where('userId', '==', user.id),
        where('date', '==', dateStr)
      );
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const record = snap.docs[0].data() as AttendanceRecord;
        if (record.timeIn) {
          const [h, m] = record.timeIn.split(':').map(Number);
          const startHour = isSaturday ? 9 : 8;
          if (h > startHour || (h === startHour && m > 0)) {
            const diff = (h * 60 + m) - (startHour * 60);
            if (diff > 0) {
              suggestedHours = Math.floor(diff / 60).toString();
              suggestedMinutes = (diff % 60).toString();
            }
          }
        }
      }

      setFormData(prev => ({ ...prev, hours: suggestedHours, minutes: suggestedMinutes }));
    } catch (e) {
      console.error("Error parsing date:", e);
    }
  };

  useEffect(() => {
    // We remove the orderby server-side to avoid needing a composite index
    // which often causes permission denied or failed queries in development
    const q = query(collection(db, 'ob_requests'), where('userId', '==', user.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OBRequest[];
      // Sort client-side instead
      setObRequests(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'ob_requests');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'ob_requests'), {
        userId: user.id,
        userName: user.fullName,
        startDate: formData.startDate,
        endDate: formData.endDate,
        hours: Number(formData.hours),
        minutes: Number(formData.minutes),
        reason: formData.reason.trim(),
        status: 'Pending',
        createdAt: new Date().toISOString()
      });
      await notifyAdmins(
        "New OB Request",
        `${user.fullName} has filed an OB request for ${formData.startDate}`,
        "OB_REQUEST"
      );
      toast.success("OB request submitted successfully");
      setFormData({
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        hours: '0',
        minutes: '0',
        reason: ''
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'ob_requests');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-emerald-800 font-bold uppercase tracking-widest animate-pulse">Loading OB Requests...</div>;
  if (isAdmin) return <div className="p-12 text-center text-red-800 font-bold uppercase tracking-widest">OB Filing is disabled for Admins.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-900/5 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-5">
            <Briefcase size={120} className="text-emerald-900" />
         </div>
         <div className="relative z-10">
           <h3 className="text-2xl font-black text-emerald-900 uppercase tracking-tighter mb-2">OB Application</h3>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-8">Official Business Authorization Form</p>
           
           <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-1">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Start Date</label>
               <div className="relative">
                 <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={16} />
                 <input 
                   type="date"
                   required
                   className="w-full pl-12 pr-4 py-4 bg-emerald-50/30 border-2 border-emerald-50 rounded-2xl text-xs font-black focus:border-emerald-500 focus:outline-none transition-all"
                   value={formData.startDate}
                   onChange={e => {
                     setFormData({...formData, startDate: e.target.value});
                     updateDefaultHours(e.target.value);
                   }}
                 />
               </div>
             </div>
             
             <div className="space-y-1">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">End Date</label>
               <div className="relative">
                 <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={16} />
                 <input 
                   type="date"
                   required
                   className="w-full pl-12 pr-4 py-4 bg-emerald-50/30 border-2 border-emerald-50 rounded-2xl text-xs font-black focus:border-emerald-500 focus:outline-none transition-all"
                   value={formData.endDate}
                   onChange={e => setFormData({...formData, endDate: e.target.value})}
                 />
               </div>
             </div>

             <div className="space-y-1">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Hours</label>
               <div className="relative">
                 <Timer className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={16} />
                 <input 
                   type="number"
                   required
                   min="0"
                   className="w-full pl-12 pr-4 py-4 bg-emerald-50/30 border-2 border-emerald-50 rounded-2xl text-xs font-black focus:border-emerald-500 focus:outline-none transition-all"
                   value={formData.hours}
                   onChange={e => setFormData({...formData, hours: e.target.value})}
                 />
               </div>
             </div>

             <div className="space-y-1">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Minutes</label>
               <div className="relative">
                 <Timer className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={16} />
                 <input 
                   type="number"
                   required
                   min="0"
                   max="59"
                   className="w-full pl-12 pr-4 py-4 bg-emerald-50/30 border-2 border-emerald-50 rounded-2xl text-xs font-black focus:border-emerald-500 focus:outline-none transition-all"
                   value={formData.minutes}
                   onChange={e => setFormData({...formData, minutes: e.target.value})}
                 />
               </div>
             </div>
             
             <div className="md:col-span-2 space-y-1">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Purpose / Reason</label>
               <textarea 
                 required
                 placeholder="Please specify the official business details..."
                 className="w-full h-32 p-4 bg-emerald-50/30 border-2 border-emerald-50 rounded-2xl text-xs font-bold focus:border-emerald-500 focus:outline-none transition-all resize-none"
                 value={formData.reason}
                 onChange={e => setFormData({...formData, reason: e.target.value})}
               />
             </div>
             
             <div className="md:col-span-2">
               <button 
                 type="submit"
                 disabled={isSubmitting}
                 className="w-full h-16 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-xl shadow-emerald-700/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
               >
                 {isSubmitting ? "Submitting Application..." : "Submit OB Application"}
               </button>
             </div>
           </form>
         </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
           <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Your OB History</h4>
        </div>
        <div className="overflow-x-auto no-scrollbar">
           <table className="w-full">
             <thead>
               <tr className="border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">
                 <th className="p-8">Inclusive Dates</th>
                 <th className="p-8 text-center text-emerald-600">Duration</th>
                 <th className="p-8">Reason</th>
                 <th className="p-8">Status</th>
                 <th className="p-8">Remarks</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
               {obRequests.map(req => (
                 <tr key={req.id} className="group hover:bg-emerald-50/30 transition-all duration-300">
                   <td className="p-8">
                      <p className="text-sm font-black text-emerald-950 uppercase">{format(new Date(req.startDate), 'MMM dd')} - {format(new Date(req.endDate), 'MMM dd, yyyy')}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Inclusive Days</p>
                   </td>
                   <td className="p-8 text-center">
                      <p className="text-xs font-black text-emerald-600 uppercase">{(req.hours || 0)}h {(req.minutes || 0)}m</p>
                   </td>
                   <td className="p-8">
                      <p className="text-xs text-gray-600 font-bold italic line-clamp-2 max-w-[300px]">"{req.reason}"</p>
                   </td>
                   <td className="p-8">
                     <span className={cn(
                       "px-5 py-1.5 text-[9px] font-black uppercase rounded-full tracking-widest border",
                       req.status === 'Approved' ? "bg-emerald-100/50 text-emerald-700 border-emerald-200/50" :
                       req.status === 'Rejected' ? "bg-red-100/50 text-red-700 border-red-200/50" : "bg-blue-100/50 text-blue-700 border-blue-200/50"
                     )}>{req.status}</span>
                   </td>
                   <td className="p-8">
                      <p className="text-[10px] text-gray-400 font-medium italic">{req.remarks || "---"}</p>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
           {obRequests.length === 0 && (
             <div className="py-24 text-center text-gray-300">
                <Briefcase className="mx-auto mb-4 opacity-10" size={48} />
                <p className="text-[10px] font-bold uppercase tracking-widest">No previous OB applications</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

// --- ATTENDANCE CALENDAR ---
function AttendanceCalendar({ user }: { user: UserProfile }) {
  const isAdmin = user.role === 'admin';
  const isCoordinator = user.role === 'coordinator';
  const canManage = isAdmin || isCoordinator;
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [obRequests, setObRequests] = useState<OBRequest[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [overtime, setOvertime] = useState<OvertimeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>(canManage ? '' : user.id);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  // OB from calendar
  const [filingDate, setFilingDate] = useState<Date | null>(null);
  const [obReason, setObReason] = useState('');
  const [obHours, setObHours] = useState('0');
  const [obMinutes, setObMinutes] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let unsubUsers = () => {};
    if (canManage) {
      unsubUsers = onSnapshot(query(collection(db, 'users'), where('role', 'in', ['user', 'coordinator'])), (snap) => {
          setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })) as UserProfile[]);
      });
    }

    const qAtt = canManage 
      ? query(collection(db, 'attendance'), limit(1000))
      : query(collection(db, 'attendance'), where('userId', '==', user.id));

    const unsubAtt = onSnapshot(qAtt, (snap) => {
        setAttendance(snap.docs.map(d => ({ id: d.id, ...d.data() })) as AttendanceRecord[]);
    }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'attendance');
    });

    const qOB = canManage
      ? query(collection(db, 'ob_requests'), limit(500))
      : query(collection(db, 'ob_requests'), where('userId', '==', user.id));

    const unsubOB = onSnapshot(qOB, (snap) => {
        setObRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })) as OBRequest[]);
    }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'ob_requests');
    });

    const qLeaves = canManage
      ? query(collection(db, 'leaves'), limit(500))
      : query(collection(db, 'leaves'), where('userId', '==', user.id));

    const unsubLeaves = onSnapshot(qLeaves, (snap) => {
        setLeaves(snap.docs.map(d => ({ id: d.id, ...d.data() })) as LeaveRequest[]);
    }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'leaves');
    });

    const qOT = canManage
      ? query(collection(db, 'overtime'), limit(500))
      : query(collection(db, 'overtime'), where('userId', '==', user.id));

    const unsubOT = onSnapshot(qOT, (snap) => {
        setOvertime(snap.docs.map(d => ({ id: d.id, ...d.data() })) as OvertimeRequest[]);
    }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'overtime');
    });

    setLoading(false);
    return () => { unsubUsers(); unsubAtt(); unsubOB(); unsubLeaves(); unsubOT(); };
  }, [canManage]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const getDayStatus = (date: Date) => {
    if (!selectedUser) return null;
    const dateStr = format(date, 'yyyy-MM-dd');
    const record = attendance.find(a => a.userId === selectedUser && a.date === dateStr);
    const obActive = obRequests.find(ob => 
      ob.userId === selectedUser && 
      ob.status === 'Approved' && 
      isWithinInterval(date, { start: parseISO(ob.startDate), end: parseISO(ob.endDate) })
    );

    const leaveActive = leaves.find(l => 
      l.userId === selectedUser && 
      l.status === 'Approved' && 
      isWithinInterval(date, { start: parseISO(l.startDate), end: parseISO(l.endDate) })
    );

    const otActive = overtime.find(ot => 
      ot.userId === selectedUser && 
      ot.status === 'Approved' && 
      ot.date === dateStr
    );

    // Calculate total minutes including approved OBs
    let totalWorkMinutes = 0;
    if (record && record.timeIn && record.timeOut) {
      const [hIn, mIn] = record.timeIn.split(':').map(Number);
      const [hOut, mOut] = record.timeOut.split(':').map(Number);
      totalWorkMinutes = (hOut * 60 + mOut) - (hIn * 60 + mIn);
    }

    if (obActive) {
      totalWorkMinutes += (Number(obActive.hours || 0) * 60 + Number(obActive.minutes || 0));
    }

    const isSaturday = date.getDay() === 6;
    const requiredMinutes = isSaturday ? 7 * 60 : 8 * 60;

    if (leaveActive) return 'LEAVE';
    if (obActive) return 'OB';
    if (totalWorkMinutes >= requiredMinutes) return 'PRESENT';
    if (otActive) return 'OT';
    if (!record) return 'ABSENT';
    
    return 'INCOMPLETE';
  };

  const handleDayClick = (day: Date) => {
    if (isAdmin) return; // Admins cannot file OB
    setFilingDate(day);
    const dateStr = format(day, 'yyyy-MM-dd');
    const isSaturday = day.getDay() === 6;
    const record = attendance.find(r => r.userId === selectedUser && r.date === dateStr);
    
    let suggestedHours = isSaturday ? '7' : '8';
    let suggestedMinutes = '0';

    if (record && record.timeIn) {
      const [h, m] = record.timeIn.split(':').map(Number);
      const startHour = isSaturday ? 9 : 8;
      
      // Calculate diff from expected start time
      if (h > startHour || (h === startHour && m > 0)) {
        const totalMinutesActual = h * 60 + m;
        const totalMinutesExpected = startHour * 60;
        const diffTotal = totalMinutesActual - totalMinutesExpected;
        
        if (diffTotal > 0) {
          suggestedHours = Math.floor(diffTotal / 60).toString();
          suggestedMinutes = (diffTotal % 60).toString();
        }
      }
    }

    setObHours(suggestedHours);
    setObMinutes(suggestedMinutes);
  };

  const handleFileOB = async () => {
    if (!selectedUser || !filingDate || !obReason.trim()) return;
    setIsSubmitting(true);
    try {
      const userObj = users.find(u => u.id === selectedUser);
      const dateStr = format(filingDate, 'yyyy-MM-dd');
      await addDoc(collection(db, 'ob_requests'), {
        userId: selectedUser,
        userName: userObj?.fullName || 'Unknown',
        startDate: dateStr,
        endDate: dateStr,
        hours: Number(obHours),
        minutes: Number(obMinutes),
        reason: obReason.trim(),
        status: 'Pending', 
        createdAt: new Date().toISOString()
      });
      await notifyAdmins(
        "New OB Recorded",
        `OB recorded for ${userObj?.fullName || 'Staff'} on ${dateStr}`,
        "OB_REQUEST"
      );
      toast.success("OB recorded for selected date");
      setFilingDate(null);
      setObReason('');
      setObHours('0');
      setObMinutes('0');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'ob_requests');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-emerald-800 font-bold uppercase tracking-widest animate-pulse">Initializing Calendar...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
             <CalendarRange className="text-emerald-600" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-emerald-900 uppercase tracking-tight">Attendance Calendar</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Visualize staff activity & filed sessions</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          {canManage && (
            <select 
               className="bg-gray-50 border-2 border-emerald-50 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest focus:border-emerald-500 outline-none transition-all"
               value={selectedUser}
               onChange={e => setSelectedUser(e.target.value)}
            >
               <option value="">Select Staff Member</option>
               {users.map(u => (
                 <option key={u.id} value={u.id}>{u.fullName}</option>
               ))}
            </select>
          )}
          
          <div className="flex items-center gap-2">
             <button 
               onClick={() => setCurrentMonth(startOfMonth(new Date()))}
               className="px-3 py-2 bg-gray-50 hover:bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-50 transition-all"
             >
               Today
             </button>
             <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-emerald-50">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white rounded-lg transition-all text-emerald-800"><ChevronRight className="rotate-180" size={16} /></button>
                <div className="w-32 text-center">
                  <span className="px-2 text-[10px] font-black uppercase tracking-widest text-emerald-900">{format(currentMonth, 'MMM yyyy')}</span>
                </div>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white rounded-lg transition-all text-emerald-800"><ChevronRight size={16} /></button>
             </div>
          </div>
        </div>
      </div>

      {selectedUser ? (
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl">
           <div className="grid grid-cols-7 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] py-2">{d}</div>
              ))}
           </div>
           <div className="grid grid-cols-7 gap-3">
              {/* Empty slots for alignment */}
              {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const status = getDayStatus(day);
                
                // Track active filings specifically for indicators
                const obActive = obRequests.find(ob => 
                  ob.userId === selectedUser && 
                  ob.status === 'Approved' && 
                  isWithinInterval(day, { start: parseISO(ob.startDate), end: parseISO(ob.endDate) })
                );

                const leaveActive = leaves.find(l => 
                  l.userId === selectedUser && 
                  l.status === 'Approved' && 
                  isWithinInterval(day, { start: parseISO(l.startDate), end: parseISO(l.endDate) })
                );

                const otActive = overtime.find(ot => 
                  ot.userId === selectedUser && 
                  ot.status === 'Approved' && 
                  ot.date === dateStr
                );

                return (
                  <motion.button
                    key={day.toString()}
                    whileHover={!isAdmin ? { scale: 1.05 } : {}}
                    onClick={() => handleDayClick(day)}
                    className={cn(
                      "aspect-square rounded-2xl flex flex-col items-center justify-center relative border-2 transition-all p-2 overflow-hidden",
                      !isAdmin && "cursor-pointer",
                      (status === 'PRESENT' || status === 'OB' || status === 'LEAVE') ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                      status === 'INCOMPLETE' ? "bg-amber-50 border-amber-100 text-amber-600" :
                      status === 'ABSENT' ? "bg-red-50 border-red-100 text-red-400" :
                      status === 'OT' ? "bg-blue-50 border-blue-100 text-blue-600" :
                      "bg-gray-50 border-transparent text-gray-300"
                    )}
                  >
                    <span className="text-xs font-black mb-1">{format(day, 'd')}</span>
                    {status === 'PRESENT' && <Check size={14} className="stroke-[4px]" />}
                    {status === 'INCOMPLETE' && <X size={14} className="stroke-[4px]" />}
                    {status === 'ABSENT' && <X size={14} className="stroke-[4px]" strokeOpacity={0.3} />}
                    {status === 'OB' && <Briefcase size={14} />}
                    {status === 'LEAVE' && <div className="text-[8px] font-black uppercase">LV</div>}
                    {status === 'OT' && <div className="text-[8px] font-black uppercase">OT</div>}

                    {/* Small Corner Indicators */}
                    <div className="absolute bottom-1 right-1 flex gap-0.5">
                      {obActive && (
                        <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full flex items-center justify-center shadow-sm">
                          <Briefcase size={4} className="text-white" />
                        </div>
                      )}
                      {leaveActive && (
                        <div className="w-2.5 h-2.5 bg-purple-500 rounded-full flex items-center justify-center shadow-sm">
                          <span className="text-[4px] text-white font-black leading-none">LV</span>
                        </div>
                      )}
                      {otActive && (
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                          <span className="text-[4px] text-white font-black leading-none">OT</span>
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
           </div>
           
           <div className="mt-8 flex flex-wrap gap-6 justify-center border-t border-gray-50 pt-8">
              {[
                { label: 'Present', color: 'bg-emerald-500', icon: Check },
                { label: 'Incomplete', color: 'bg-amber-500', icon: X },
                { label: 'Absent', color: 'bg-red-300', icon: X },
                { label: 'OB', color: 'bg-indigo-500', icon: Briefcase },
                { label: 'Leave', color: 'bg-purple-500', char: 'LV' },
                { label: 'Overtime', color: 'bg-blue-500', char: 'OT' }
              ].map(tag => (
                <div key={tag.label} className="flex items-center gap-2">
                   <div className={cn("w-3 h-3 rounded-full flex items-center justify-center", tag.color)}>
                     {tag.icon ? <tag.icon className="text-white" size={8} /> : <span className="text-[5px] text-white font-black">{tag.char}</span>}
                   </div>
                   <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{tag.label}</span>
                </div>
              ))}
           </div>
        </div>
      ) : (
        <div className="bg-white p-24 rounded-3xl border border-gray-100 shadow-sm text-center">
           <Users className="mx-auto mb-4 opacity-10 text-emerald-950" size={64} />
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Select a Staff Member to View Calendar</p>
        </div>
      )}

      {/* File OB Modal from Calendar */}
      <AnimatePresence>
        {filingDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFilingDate(null)}
              className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 p-8"
            >
              <div className="text-center space-y-4 mb-8">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto">
                   <Briefcase size={32} className="text-indigo-600" />
                </div>
                <h3 className="text-2xl font-black text-indigo-900 uppercase tracking-tighter">Record OB</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Recording Official Business for {format(filingDate, 'MMMM dd, yyyy')}</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Hours</label>
                    <input 
                      type="number"
                      min="0"
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-indigo-50 rounded-2xl text-xs font-black focus:border-indigo-500 focus:outline-none transition-all"
                      value={obHours}
                      onChange={e => setObHours(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Minutes</label>
                    <input 
                      type="number"
                      min="0"
                      max="59"
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-indigo-50 rounded-2xl text-xs font-black focus:border-indigo-500 focus:outline-none transition-all"
                      value={obMinutes}
                      onChange={e => setObMinutes(e.target.value)}
                    />
                  </div>
                </div>

                <textarea
                  value={obReason}
                  onChange={(e) => setObReason(e.target.value)}
                  placeholder="Reason for OB..."
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-indigo-50 rounded-2xl text-xs font-black focus:border-indigo-500 focus:outline-none transition-all min-h-[100px]"
                />
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setFilingDate(null)}
                    className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFileOB}
                    disabled={isSubmitting || !obReason.trim()}
                    className="flex-1 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Confirming...' : 'Record OB'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- HR REPORTS MODULE ---
function HRReportsModule({ user }: { user: UserProfile }) {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState<{
    name: string;
    role: string;
    attendance: number;
    late: number;
    leavesApproved: number;
    leavesDenied: number;
    otApproved: number;
    otDenied: number;
    obApproved: number;
    obDenied: number;
  }[]>([]);
  const [combinedLogs, setCombinedLogs] = useState<{
    id: string;
    type: 'ATTENDANCE' | 'LEAVE' | 'OT' | 'OB';
    userName: string;
    date: string;
    timeRangeOrDesc: string;
    status: string;
    remarksOrReason: string;
    rawDate: string;
  }[]>([]);
  const [reportTab, setReportTab] = useState<'SUMMARY' | 'DETAILED'>('SUMMARY');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Keep user in scope if needed, or just log
    console.log("HR Report accessed by:", user.fullName);
  }, [user.fullName]);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const usersSnap = await getDocs(query(collection(db, 'users'), where('role', 'in', ['user', 'coordinator'])));
      const staff = usersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as UserProfile[];
      
      const start = parseISO(startDate);
      const end = parseISO(endDate);

      const [attSnap, leaveSnap, otSnap, obSnap] = await Promise.all([
        getDocs(query(collection(db, 'attendance'), where('date', '>=', startDate), where('date', '<=', endDate))),
        getDocs(query(collection(db, 'leaves'), where('status', 'in', ['Approved', 'Rejected']))),
        getDocs(query(collection(db, 'overtime'), where('status', 'in', ['Approved', 'Rejected']), where('date', '>=', startDate), where('date', '<=', endDate))),
        getDocs(query(collection(db, 'ob_requests'), where('status', 'in', ['Approved', 'Rejected'])))
      ]);

      const allAttendance = attSnap.docs.map(d => ({ id: d.id, ...d.data() })) as AttendanceRecord[];
      const leavesData = leaveSnap.docs.map(d => ({ id: d.id, ...d.data() })) as LeaveRequest[];
      const otData = otSnap.docs.map(d => ({ id: d.id, ...d.data() })) as OvertimeRequest[];
      const obData = obSnap.docs.map(d => ({ id: d.id, ...d.data() })) as OBRequest[];

      const tempLogs: {
        id: string;
        type: 'ATTENDANCE' | 'LEAVE' | 'OT' | 'OB';
        userName: string;
        date: string;
        timeRangeOrDesc: string;
        status: string;
        remarksOrReason: string;
        rawDate: string;
      }[] = [];
      
      // 1. Add all attendance record logs
      allAttendance.forEach(a => {
        tempLogs.push({
          id: a.id,
          type: 'ATTENDANCE',
          userName: a.userName,
          date: a.date,
          timeRangeOrDesc: `${a.timeIn || 'NA'} - ${a.timeOut || 'NA'}`,
          status: a.status,
          remarksOrReason: a.tasks || a.coordinatorRemarks 
            ? `Tasks: ${a.tasks || '--'} | Coord: ${a.coordinatorRemarks || '--'}`
            : '--',
          rawDate: a.date
        });
      });

      const combined = staff.map(s => {
        const staffAtt = allAttendance.filter(a => a.userId === s.id);
        
        const staffLeaves = leavesData.filter(l => l.userId === s.id && 
          ((parseISO(l.startDate) >= start && parseISO(l.startDate) <= end) || 
           (parseISO(l.endDate) >= start && parseISO(l.endDate) <= end))
        );
        const staffOT = otData.filter(o => o.userId === s.id);
        const staffOB = obData.filter(ob => ob.userId === s.id && 
          ((parseISO(ob.startDate) >= start && parseISO(ob.startDate) <= end) || 
           (parseISO(ob.endDate) >= start && parseISO(ob.endDate) <= end))
        );

        // Add leaves to tempLogs
        staffLeaves.forEach(l => {
          tempLogs.push({
            id: l.id,
            type: 'LEAVE',
            userName: s.fullName,
            date: `${l.startDate} to ${l.endDate}`,
            timeRangeOrDesc: l.leaveType,
            status: l.status,
            remarksOrReason: l.reason,
            rawDate: l.startDate
          });
        });

        // Add OT to tempLogs
        staffOT.forEach(o => {
          tempLogs.push({
            id: o.id,
            type: 'OT',
            userName: s.fullName,
            date: o.date,
            timeRangeOrDesc: `${o.hours}h ${o.minutes}m`,
            status: o.status,
            remarksOrReason: o.reason,
            rawDate: o.date
          });
        });

        // Add OB to tempLogs
        staffOB.forEach(ob => {
          tempLogs.push({
            id: ob.id,
            type: 'OB',
            userName: s.fullName,
            date: `${ob.startDate} to ${ob.endDate}`,
            timeRangeOrDesc: `OB request`,
            status: ob.status,
            remarksOrReason: ob.reason,
            rawDate: ob.startDate
          });
        });

        const totalLate = staffAtt.filter(a => a.status === 'LATE').length;
        const totalDays = staffAtt.length;

        return {
          name: s.fullName,
          role: s.role,
          attendance: totalDays,
          late: totalLate,
          leavesApproved: staffLeaves.filter(l => l.status === 'Approved').length,
          leavesDenied: staffLeaves.filter(l => l.status === 'Rejected').length,
          otApproved: staffOT.filter(o => o.status === 'Approved').length,
          otDenied: staffOT.filter(o => o.status === 'Rejected').length,
          obApproved: staffOB.filter(ob => ob.status === 'Approved').length,
          obDenied: staffOB.filter(ob => ob.status === 'Rejected').length
        };
      });

      // Sort combined logs by rawDate descending
      const sortedLogs = tempLogs.sort((a, b) => b.rawDate.localeCompare(a.rawDate));

      setReportData(combined);
      setCombinedLogs(sortedLogs);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate report");
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = () => {
    if (reportTab === 'SUMMARY') {
      if (reportData.length === 0) return;
      const headers = ['Name', 'Role', 'Attendance Days', 'Total Late', 'Approved Leaves', 'Denied Leaves', 'Approved OT', 'Denied OT', 'Approved OB', 'Denied OB'];
      const rows = reportData.map(r => [r.name, r.role, r.attendance, r.late, r.leavesApproved, r.leavesDenied, r.otApproved, r.otDenied, r.obApproved, r.obDenied]);
      const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n"
        + rows.map(e => e.join(",")).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `HR_Summary_Report_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (reportTab === 'DETAILED') {
      if (combinedLogs.length === 0) return;
      const headers = ['Type', 'Staff Name', 'Date/Range', 'Time/Description', 'Status', 'Tasks/Reason/Remarks'];
      const rows = combinedLogs.map(r => [
        r.type,
        r.userName,
        r.date,
        r.timeRangeOrDesc.replace(/,/g, ';'),
        r.status,
        (r.remarksOrReason || '').replace(/,/g, ';')
      ]);
      const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n"
        + rows.map(e => e.join(",")).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `HR_Attendance_And_Requests_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
       <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
             <FileBarChart className="text-indigo-600" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-indigo-900 uppercase tracking-tight">HR Consolidated Reports</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Download activity & performance metrics</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
             <input 
               type="date"
               className="bg-gray-50 border-2 border-indigo-50 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest outline-none transition-all"
               value={startDate}
               onChange={e => setStartDate(e.target.value)}
             />
             <span className="text-[10px] font-black text-gray-400">TO</span>
             <input 
               type="date"
               className="bg-gray-50 border-2 border-indigo-50 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest outline-none transition-all"
               value={endDate}
               onChange={e => setEndDate(e.target.value)}
             />
          </div>
          <button 
            onClick={generateReport}
            className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all font-mono"
          >
            {isLoading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
         <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex bg-gray-100 p-1 rounded-2xl w-full md:w-auto">
               <button 
                 onClick={() => setReportTab('SUMMARY')}
                 className={cn(
                   "flex-1 md:w-40 py-2 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                   reportTab === 'SUMMARY' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400"
                 )}
               >
                 Summary
               </button>
               <button 
                 onClick={() => setReportTab('DETAILED')}
                 className={cn(
                   "flex-1 md:w-56 py-2 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                   reportTab === 'DETAILED' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400"
                 )}
               >
                 Attendance & Requests
               </button>
            </div>
            {((reportTab === 'SUMMARY' && reportData.length > 0) || (reportTab === 'DETAILED' && combinedLogs.length > 0)) && (
              <button 
                onClick={exportCSV}
                className="flex items-center gap-2 text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-xl transition-all"
              >
                <Download size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Export {reportTab === 'SUMMARY' ? 'Summary' : 'Logs'} CSV</span>
              </button>
            )}
         </div>
         <div className="overflow-x-auto no-scrollbar">
            {reportTab === 'SUMMARY' ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">
                    <th className="p-8">Staff Name</th>
                    <th className="p-8 text-center border-x border-gray-50">Attendance</th>
                    <th className="p-8 text-center text-indigo-600 border-x border-gray-50">Leaves (App/Den)</th>
                    <th className="p-8 text-center text-emerald-600 border-x border-gray-50">Overtime (App/Den)</th>
                    <th className="p-8 text-center text-blue-600 border-l border-gray-50">OB (App/Den)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reportData.map((r, i) => (
                    <tr key={i} className="group hover:bg-indigo-50/20 transition-all duration-300">
                      <td className="p-8">
                         <p className="text-sm font-black text-indigo-950 uppercase">{r.name}</p>
                         <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">{r.role}</p>
                      </td>
                      <td className="p-8 text-center border-x border-gray-50">
                         <p className="text-sm font-black text-gray-700">{r.attendance}</p>
                         <p className="text-[9px] font-bold text-amber-600 uppercase mt-1">{r.late} Late</p>
                      </td>
                      <td className="p-8 text-center border-x border-gray-50">
                         <span className="text-sm font-black text-indigo-600">{r.leavesApproved}</span>
                         <span className="text-sm font-black text-gray-300 px-1">/</span>
                         <span className="text-sm font-black text-red-400">{r.leavesDenied}</span>
                      </td>
                      <td className="p-8 text-center border-x border-gray-50">
                         <span className="text-sm font-black text-emerald-600">{r.otApproved}</span>
                         <span className="text-sm font-black text-gray-300 px-1">/</span>
                         <span className="text-sm font-black text-red-400">{r.otDenied}</span>
                      </td>
                      <td className="p-8 text-center border-l border-gray-50">
                         <span className="text-sm font-black text-blue-600">{r.obApproved}</span>
                         <span className="text-sm font-black text-gray-300 px-1">/</span>
                         <span className="text-sm font-black text-red-400">{r.obDenied}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">
                    <th className="p-8">Type/Log</th>
                    <th className="p-8">Staff Name</th>
                    <th className="p-8">Date / Range</th>
                    <th className="p-8">Time / Description</th>
                    <th className="p-8 text-center">Status</th>
                    <th className="p-8">Tasks / Reasons / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {combinedLogs.map((r, i) => (
                    <tr key={i} className="group hover:bg-indigo-50/20 transition-all duration-300">
                      <td className="p-8">
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm border",
                          r.type === 'ATTENDANCE' ? "bg-teal-50 text-teal-700 border-teal-200/50" :
                          r.type === 'LEAVE' ? "bg-indigo-50 text-indigo-700 border-indigo-200/50" :
                          r.type === 'OT' ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" :
                          "bg-blue-50 text-blue-700 border-blue-200/50"
                        )}>{r.type}</span>
                      </td>
                      <td className="p-8">
                         <p className="text-xs font-black text-indigo-950 uppercase">{r.userName}</p>
                      </td>
                      <td className="p-8 text-xs font-bold text-gray-500">
                         {r.date}
                      </td>
                      <td className="p-8 text-xs font-semibold text-gray-700 uppercase">
                         {r.timeRangeOrDesc}
                      </td>
                      <td className="p-8 text-center">
                         <span className={cn(
                           "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                           (r.status === 'Approved' || r.status === 'ON TIME') ? "bg-emerald-100 text-emerald-600" :
                           r.status === 'LATE' ? "bg-amber-100 text-amber-600" :
                           "bg-red-100 text-red-600"
                         )}>{r.status}</span>
                      </td>
                      <td className="p-8 max-w-[300px]">
                         <p className="text-[10px] text-gray-400 font-medium italic line-clamp-2" title={r.remarksOrReason}>{r.remarksOrReason || '--'}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {((reportTab === 'SUMMARY' && reportData.length === 0) || (reportTab === 'DETAILED' && combinedLogs.length === 0)) && (
              <div className="py-24 text-center text-gray-300">
                 <FileBarChart className="mx-auto mb-4 opacity-10 text-indigo-950" size={64} />
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Set date range and click generate</p>
              </div>
            )}
         </div>
      </div>
    </div>
  );
}
