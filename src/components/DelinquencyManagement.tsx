import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserProfile, 
  DelinquencyAccount, 
  DelinquencyCommunication, 
  CommunicationType, 
  DelinquencyStatus,
  DelinquencyPayment,
  BalanceSnapshot,
  Tribe
} from '../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import {
  generateSummaryPDF,
  generateSummaryExcel,
  generateIndividualPDF,
  generateIndividualExcel
} from '../utils/delinquencyReports';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Search, 
  Plus, 
  Phone, 
  MessageSquare, 
  Send, 
  MapPin, 
  Clock, 
  Calendar, 
  User, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  Filter, 
  X, 
  FileText, 
  FileSpreadsheet, 
  Download, 
  Printer, 
  History, 
  Activity, 
  Trash2, 
  Check, 
  ChevronRight, 
  MessageCircle, 
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Info,
  CreditCard,
  Receipt,
  ArrowDownRight,
  Wallet,
  Sparkles,
  ArrowLeftRight
} from 'lucide-react';
import { format } from 'date-fns';

interface DelinquencyManagementProps {
  user: UserProfile;
}

const COMMUNICATION_TYPES: { type: CommunicationType; label: string; icon: any; color: string }[] = [
  { type: 'Phone Call', label: 'Phone Call', icon: Phone, color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { type: 'FB messenger', label: 'FB Messenger', icon: MessageSquare, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  { type: 'Viber', label: 'Viber', icon: MessageCircle, color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { type: 'Field Visit', label: 'Field Visit', icon: MapPin, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { type: 'Other', label: 'Other', icon: FileText, color: 'bg-gray-50 text-gray-600 border-gray-200' },
];

const STATUS_OPTIONS: DelinquencyStatus[] = [
  'Delinquent',
  'Field Visited',
  'Under Follow-up',
  'Promise to Pay',
  'Settled',
  'Legal / Escalated'
];

const TRIBE_OPTIONS: (Tribe | string)[] = ['NCR', 'Cavite', 'Mindoro', 'Rizal'];

export default function DelinquencyManagement({ user }: DelinquencyManagementProps) {
  const [accounts, setAccounts] = useState<DelinquencyAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [tribeFilter, setTribeFilter] = useState<string>('All');
  
  // Selected account for dossier/details modal
  const [selectedAccount, setSelectedAccount] = useState<DelinquencyAccount | null>(null);
  
  // Create / Entry Modal State (Allowed for Admin, Supervisor, Manager, Coordinator)
  const canEnterData = useMemo(() => {
    return ['admin', 'supervisor', 'manager', 'coordinator'].includes(user.role);
  }, [user.role]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formEntryDate, setFormEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formName, setFormName] = useState('');
  const [formTribe, setFormTribe] = useState<string>('NCR');
  const [formAddress, setFormAddress] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formLoanAmount, setFormLoanAmount] = useState<string>('');
  const [formPrincipal, setFormPrincipal] = useState<string>('');
  const [formInterest, setFormInterest] = useState<string>('');
  const [formPenalty, setFormPenalty] = useState<string>('');
  const [formPdi, setFormPdi] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Auto-calculated total balance in create form
  const computedTotal = useMemo(() => {
    const p = parseFloat(formPrincipal) || 0;
    const i = parseFloat(formInterest) || 0;
    const pen = parseFloat(formPenalty) || 0;
    const pdiVal = parseFloat(formPdi) || 0;
    return p + i + pen + pdiVal;
  }, [formPrincipal, formInterest, formPenalty, formPdi]);


  // Payment Recording Modal State (All users can record payments & collection reductions)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payDate, setPayDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [payPrincipal, setPayPrincipal] = useState<string>('');
  const [payInterest, setPayInterest] = useState<string>('');
  const [payPenalty, setPayPenalty] = useState<string>('');
  const [payPdi, setPayPdi] = useState<string>('');
  const [payOrNumber, setPayOrNumber] = useState('');
  const [payMethod, setPayMethod] = useState<'Cash' | 'GCash' | 'Bank Transfer' | 'PDC' | 'Other'>('Cash');
  const [payRemarks, setPayRemarks] = useState('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);
  const [payError, setPayError] = useState('');

  // Auto total payment
  const computedPaymentAmount = useMemo(() => {
    const p = parseFloat(payPrincipal) || 0;
    const i = parseFloat(payInterest) || 0;
    const pen = parseFloat(payPenalty) || 0;
    const pdi = parseFloat(payPdi) || 0;
    return p + i + pen + pdi;
  }, [payPrincipal, payInterest, payPenalty, payPdi]);

  // Communication entry state (Allowed for ALL users in every account)
  const [commType, setCommType] = useState<CommunicationType>('Phone Call');
  const [commRemarks, setCommRemarks] = useState('');
  const [commPromiseToPay, setCommPromiseToPay] = useState('');
  const [isSubmittingComm, setIsSubmittingComm] = useState(false);

  // Transfer Tribe modal state
  const [transferTarget, setTransferTarget] = useState<DelinquencyAccount | null>(null);
  const [targetTribe, setTargetTribe] = useState<string>('NCR');
  const [transferRemarks, setTransferRemarks] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState('');

  // Real-time Firestore sync
  useEffect(() => {
    const q = query(collection(db, 'delinquencies'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DelinquencyAccount[];
        setAccounts(list);
        setLoading(false);
        // Sync selected account if currently open
        if (selectedAccount) {
          const updated = list.find(a => a.id === selectedAccount.id);
          if (updated) setSelectedAccount(updated);
        }
      },
      (error) => {
        console.error('Error listening to delinquencies:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [selectedAccount?.id]);

  // Filter accounts by search, status, and tribe (NCR, CAVITE, MINDORO)
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const matchSearch = 
        acc.name.toLowerCase().includes(search.toLowerCase()) ||
        acc.address.toLowerCase().includes(search.toLowerCase()) ||
        (acc.tribe && acc.tribe.toLowerCase().includes(search.toLowerCase())) ||
        (acc.contactNumber && acc.contactNumber.includes(search));
      const matchStatus = statusFilter === 'All' || acc.status === statusFilter;
      
      const accTribe = (acc.tribe || 'NCR').toUpperCase();
      const matchTribe = 
        tribeFilter === 'All' || 
        accTribe === tribeFilter.toUpperCase();

      return matchSearch && matchStatus && matchTribe;
    });
  }, [accounts, search, statusFilter, tribeFilter]);

  // Totals for metrics
  const aggregateMetrics = useMemo(() => {
    const totalExposure = accounts.reduce((sum, a) => sum + (a.totalBalance || 0), 0);
    const totalPrincipal = accounts.reduce((sum, a) => sum + (a.principalBalance || 0), 0);
    const fieldVisitedCount = accounts.filter(a => a.fieldVisited).length;
    const completedCount = accounts.filter(a => a.taskCompleted).length;
    return { totalExposure, totalPrincipal, fieldVisitedCount, completedCount };
  }, [accounts]);

  // Handle Create Account (Admin, Supervisor, Manager, Coordinator)
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEnterData) {
      alert('Only Admin, Supervisor, Manager, and Coordinator can enter delinquency data.');
      return;
    }
    if (!formName.trim() || !formAddress.trim()) {
      setFormError('Please enter Borrower Name and Address.');
      return;
    }
    setFormError('');
    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      const pVal = parseFloat(formPrincipal) || 0;
      const iVal = parseFloat(formInterest) || 0;
      const penVal = parseFloat(formPenalty) || 0;
      const pdiVal = parseFloat(formPdi) || 0;
      const totVal = computedTotal;

      const initialSnapshot: BalanceSnapshot = {
        date: formEntryDate,
        timestamp: now,
        label: 'Initial Entry',
        principalBalance: pVal,
        interestBalance: iVal,
        penalty: penVal,
        pdi: pdiVal,
        totalBalance: totVal,
        actionNote: 'Account logged into delinquency registry'
      };

      const newAcc: Omit<DelinquencyAccount, 'id'> = {
        entryDate: formEntryDate,
        name: formName.trim(),
        tribe: formTribe,
        address: formAddress.trim(),
        contactNumber: formContact.trim() || '',
        loanAmount: parseFloat(formLoanAmount) || 0,
        principalBalance: pVal,
        interestBalance: iVal,
        penalty: penVal,
        pdi: pdiVal,
        totalBalance: totVal,
        initialPrincipal: pVal,
        initialInterest: iVal,
        initialTotal: totVal,
        totalPrincipalPaid: 0,
        totalInterestPaid: 0,
        totalPaid: 0,
        payments: [],
        balanceSnapshots: [initialSnapshot],
        fieldVisited: false,
        fieldVisitDate: null,
        taskCompleted: false,
        taskCompletedDate: null,
        status: 'Delinquent',
        communications: [],
        createdBy: user.id,
        createdByName: user.fullName,
        createdByRole: user.role,
        createdAt: now,
        updatedAt: now
      };

      await addDoc(collection(db, 'delinquencies'), newAcc);

      // Reset Form
      setFormName('');
      setFormTribe('NCR');
      setFormAddress('');
      setFormContact('');
      setFormLoanAmount('');
      setFormPrincipal('');
      setFormInterest('');
      setFormPenalty('');
      setFormPdi('');
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error('Failed to create delinquency record:', err);
      setFormError(err.message || 'Failed to save delinquency account.');
    } finally {
      setIsSubmitting(false);
    }
  };


  // Handle Record Payment / Balance Reduction
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    const pPaid = parseFloat(payPrincipal) || 0;
    const iPaid = parseFloat(payInterest) || 0;
    const penPaid = parseFloat(payPenalty) || 0;
    const pdiPaid = parseFloat(payPdi) || 0;
    const totalPaid = pPaid + iPaid + penPaid + pdiPaid;

    if (totalPaid <= 0) {
      setPayError('Please enter at least one payment amount (Principal, Interest, Penalty, or PDI).');
      return;
    }

    setPayError('');
    setIsSubmittingPay(true);

    try {
      const now = new Date().toISOString();
      
      // Calculate remaining balances (cannot go below 0)
      const currentP = selectedAccount.principalBalance || 0;
      const currentI = selectedAccount.interestBalance || 0;
      const currentPen = selectedAccount.penalty || 0;
      const currentPdi = selectedAccount.pdi || 0;

      const newPrincipal = Math.max(0, currentP - pPaid);
      const newInterest = Math.max(0, currentI - iPaid);
      const newPenalty = Math.max(0, currentPen - penPaid);
      const newPdi = Math.max(0, currentPdi - pdiPaid);
      const newTotal = newPrincipal + newInterest + newPenalty + newPdi;

      const newPayment: DelinquencyPayment = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        paymentDate: payDate,
        amount: totalPaid,
        principalPaid: pPaid,
        interestPaid: iPaid,
        penaltyPaid: penPaid,
        pdiPaid: pdiPaid,
        orNumber: payOrNumber.trim() || undefined,
        paymentMethod: payMethod,
        remarks: payRemarks.trim() || undefined,
        recordedBy: user.id,
        recordedByName: user.fullName,
        recordedByRole: user.role,
        timestamp: now
      };

      // Create snapshot point for line graph
      const newSnapshot: BalanceSnapshot = {
        date: payDate,
        timestamp: now,
        label: `Payment: ₱${totalPaid.toLocaleString()}`,
        principalBalance: newPrincipal,
        interestBalance: newInterest,
        penalty: newPenalty,
        pdi: newPdi,
        totalBalance: newTotal,
        actionNote: `Paid ₱${totalPaid.toLocaleString()} (P: ₱${pPaid.toLocaleString()}, I: ₱${iPaid.toLocaleString()}) by ${user.fullName}`
      };

      // Existing snapshots or baseline
      const existingSnapshots = selectedAccount.balanceSnapshots || [
        {
          date: selectedAccount.entryDate,
          timestamp: selectedAccount.createdAt,
          label: 'Initial Entry',
          principalBalance: selectedAccount.initialPrincipal || selectedAccount.principalBalance,
          interestBalance: selectedAccount.initialInterest || selectedAccount.interestBalance,
          penalty: selectedAccount.penalty,
          pdi: selectedAccount.pdi,
          totalBalance: selectedAccount.initialTotal || selectedAccount.totalBalance,
          actionNote: 'Initial logged balance'
        }
      ];

      const updatedPayments = [newPayment, ...(selectedAccount.payments || [])];
      const updatedSnapshots = [...existingSnapshots, newSnapshot];

      // Auto update status if fully settled
      let newStatus = selectedAccount.status;
      let isTaskDone = !!selectedAccount.taskCompleted;
      let taskDoneDate = selectedAccount.taskCompletedDate || null;
      let taskDoneBy = selectedAccount.taskCompletedByName || null;

      if (newTotal === 0) {
        newStatus = 'Settled';
        isTaskDone = true;
        taskDoneDate = now;
        taskDoneBy = user.fullName;
      }

      // Sanitize payment object to prevent undefined fields
      const sanitizedPayment: DelinquencyPayment = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        paymentDate: payDate,
        amount: totalPaid,
        principalPaid: pPaid,
        interestPaid: iPaid,
        penaltyPaid: penPaid,
        pdiPaid: pdiPaid,
        orNumber: payOrNumber.trim() || '',
        paymentMethod: payMethod,
        remarks: payRemarks.trim() || '',
        recordedBy: user.id,
        recordedByName: user.fullName,
        recordedByRole: user.role,
        timestamp: now
      };

      const sanitizedPayments = [sanitizedPayment, ...(selectedAccount.payments || [])];

      await updateDoc(doc(db, 'delinquencies', selectedAccount.id), {
        principalBalance: newPrincipal,
        interestBalance: newInterest,
        penalty: newPenalty,
        pdi: newPdi,
        totalBalance: newTotal,
        initialPrincipal: selectedAccount.initialPrincipal !== undefined ? selectedAccount.initialPrincipal : selectedAccount.principalBalance,
        initialInterest: selectedAccount.initialInterest !== undefined ? selectedAccount.initialInterest : selectedAccount.interestBalance,
        initialTotal: selectedAccount.initialTotal !== undefined ? selectedAccount.initialTotal : selectedAccount.totalBalance,
        totalPrincipalPaid: (selectedAccount.totalPrincipalPaid || 0) + pPaid,
        totalInterestPaid: (selectedAccount.totalInterestPaid || 0) + iPaid,
        totalPaid: (selectedAccount.totalPaid || 0) + totalPaid,
        payments: sanitizedPayments,
        balanceSnapshots: updatedSnapshots,
        status: newStatus,
        taskCompleted: isTaskDone,
        taskCompletedDate: taskDoneDate,
        taskCompletedByName: taskDoneBy,
        updatedAt: now
      });

      // Also automatically record a communication log of the payment
      const paymentComm: DelinquencyCommunication = {
        id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: payMethod === 'Cash' ? 'Other' : (payMethod === 'GCash' ? 'Other' : 'Other'),
        remarks: `[PAYMENT COLLECTION] Received ₱${totalPaid.toLocaleString()} payment via ${payMethod}. Reduced Principal by ₱${pPaid.toLocaleString()}, Interest by ₱${iPaid.toLocaleString()}${penPaid ? `, Penalty by ₱${penPaid.toLocaleString()}` : ''}${pdiPaid ? `, PDI by ₱${pdiPaid.toLocaleString()}` : ''}. Remaining Total Balance: ₱${newTotal.toLocaleString()}.${payOrNumber ? ` Ref/OR: ${payOrNumber}.` : ''}${payRemarks ? ` Notes: ${payRemarks}` : ''}`,
        timestamp: now,
        userId: user.id,
        userName: user.fullName,
        userRole: user.role
      };

      const existingComms = selectedAccount.communications || [];
      await updateDoc(doc(db, 'delinquencies', selectedAccount.id), {
        communications: [paymentComm, ...existingComms]
      });

      // Reset form
      setPayPrincipal('');
      setPayInterest('');
      setPayPenalty('');
      setPayPdi('');
      setPayOrNumber('');
      setPayRemarks('');
      setIsPaymentModalOpen(false);
    } catch (err: any) {
      console.error('Error recording payment:', err);
      setPayError(err.message || 'Failed to record payment reduction.');
    } finally {
      setIsSubmittingPay(false);
    }
  };

  // Handle Add Communication (All users can enter remarks & communications)
  const handleAddCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    if (!commRemarks.trim()) {
      alert('Please enter remarks or notes regarding this communication.');
      return;
    }

    setIsSubmittingComm(true);
    try {
      const now = new Date().toISOString();
      const newComm: DelinquencyCommunication = {
        id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: commType,
        remarks: commRemarks.trim(),
        promiseToPay: commPromiseToPay.trim() || '',
        timestamp: now,
        userId: user.id,
        userName: user.fullName,
        userRole: user.role
      };

      const updatedComms = [newComm, ...(selectedAccount.communications || [])];

      // Auto update status if Field Visit was logged and not yet visited
      const updateFields: any = {
        communications: updatedComms,
        updatedAt: now
      };

      if (commType === 'Field Visit' && !selectedAccount.fieldVisited) {
        updateFields.fieldVisited = true;
        updateFields.fieldVisitDate = now;
        updateFields.fieldVisitOfficerName = user.fullName;
        if (selectedAccount.status === 'Delinquent') {
          updateFields.status = 'Field Visited';
        }
      }

      if (commPromiseToPay.trim() && selectedAccount.status !== 'Settled') {
        updateFields.status = 'Promise to Pay';
      }

      await updateDoc(doc(db, 'delinquencies', selectedAccount.id), updateFields);

      // Reset communication form
      setCommRemarks('');
      setCommPromiseToPay('');
      setCommType('Phone Call');
    } catch (err) {
      console.error('Error adding communication:', err);
      alert('Failed to log communication.');
    } finally {
      setIsSubmittingComm(false);
    }
  };

  // Toggle Field Visit milestone in Progress Line
  const handleToggleFieldVisit = async (account: DelinquencyAccount) => {
    try {
      const now = new Date().toISOString();
      const nextVisited = !account.fieldVisited;
      const updateData: any = {
        fieldVisited: nextVisited,
        fieldVisitDate: nextVisited ? now : null,
        fieldVisitOfficerName: nextVisited ? user.fullName : null,
        updatedAt: now
      };
      if (nextVisited && account.status === 'Delinquent') {
        updateData.status = 'Field Visited';
      }
      await updateDoc(doc(db, 'delinquencies', account.id), updateData);
    } catch (err) {
      console.error('Failed to update field visit:', err);
    }
  };

  // Toggle Task Completed milestone in Progress Line
  const handleToggleTaskCompleted = async (account: DelinquencyAccount) => {
    try {
      const now = new Date().toISOString();
      const nextCompleted = !account.taskCompleted;
      const updateData: any = {
        taskCompleted: nextCompleted,
        taskCompletedDate: nextCompleted ? now : null,
        taskCompletedByName: nextCompleted ? user.fullName : null,
        updatedAt: now
      };
      if (nextCompleted && account.status !== 'Settled') {
        updateData.status = 'Settled';
      }
      await updateDoc(doc(db, 'delinquencies', account.id), updateData);
    } catch (err) {
      console.error('Failed to update task completion:', err);
    }
  };

  // Change Account Status
  const handleStatusChange = async (account: DelinquencyAccount, newStatus: DelinquencyStatus) => {
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, 'delinquencies', account.id), {
        status: newStatus,
        updatedAt: now
      });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Delete account (Admin only)
  const handleDeleteAccount = async (id: string, name: string) => {
    if (user.role !== 'admin') {
      alert('Only administrators can remove delinquency accounts.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete the delinquency record for "${name}"?`)) {
      try {
        await deleteDoc(doc(db, 'delinquencies', id));
        if (selectedAccount?.id === id) setSelectedAccount(null);
      } catch (err) {
        console.error('Error deleting delinquency record:', err);
      }
    }
  };

  // Open Transfer Tribe modal
  const handleOpenTransferModal = (account: DelinquencyAccount) => {
    const currentTribe = account.tribe || 'NCR';
    const nextDefault = TRIBE_OPTIONS.find(t => t.toUpperCase() !== currentTribe.toUpperCase()) || 'NCR';
    setTransferTarget(account);
    setTargetTribe(nextDefault);
    setTransferRemarks('');
    setTransferError('');
  };

  // Submit Tribe Transfer
  const handleTransferTribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTarget) return;

    const currentTribe = transferTarget.tribe || 'NCR';
    if (!targetTribe) {
      setTransferError('Please select a destination tribe.');
      return;
    }
    if (targetTribe.toUpperCase() === currentTribe.toUpperCase()) {
      setTransferError(`Account is already assigned to ${currentTribe}. Please select a different tribe.`);
      return;
    }

    setIsTransferring(true);
    setTransferError('');

    try {
      const now = new Date().toISOString();
      const noteSuffix = transferRemarks.trim() ? `: ${transferRemarks.trim()}` : '';
      const transferAuditComm: DelinquencyCommunication = {
        id: 'comm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        type: 'Other',
        promiseToPay: '',
        remarks: `[TRIBE TRANSFER] Account transferred from ${currentTribe} to ${targetTribe}${noteSuffix}`,
        timestamp: now,
        userId: user.id || '',
        userName: user.fullName || 'Unknown User',
        userRole: user.role || 'coordinator'
      };

      await updateDoc(doc(db, 'delinquencies', transferTarget.id), {
        tribe: targetTribe,
        communications: [transferAuditComm, ...(transferTarget.communications || [])],
        updatedAt: now
      });

      setTransferTarget(null);
      setTransferRemarks('');
    } catch (err: any) {
      console.error('Error transferring account tribe:', err);
      setTransferError(err?.message || 'Failed to transfer account to selected tribe.');
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-linear-to-r from-emerald-900 via-emerald-800 to-teal-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
              <ShieldAlert className="text-emerald-300" size={26} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">
                Remedial & Recovery Operations
              </span>
              <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tight">
                Delinquency Management
              </h1>
            </div>
          </div>
          <p className="text-xs text-white/80 max-w-xl font-medium">
            Centralized registry for past-due portfolio tracking, comprehensive communication logs, promise-to-pay pledges, and real-time field progress timelines.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 z-10 w-full lg:w-auto">
          {/* Summary Report Generators (Available to ALL USERS) */}
          <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/15">
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-200 px-2 hidden sm:inline">
              Summary Report:
            </span>
            <button
              onClick={() => {
                const filterDesc = [
                  tribeFilter !== 'All' ? `Tribe: ${tribeFilter.toUpperCase()}` : null,
                  statusFilter !== 'All' ? `Status: ${statusFilter}` : null
                ].filter(Boolean).join(' • ') || 'All Accounts';
                generateSummaryPDF(filteredAccounts, filterDesc);
              }}
              disabled={filteredAccounts.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-sm hover:scale-102"
              title="Download Portfolio Summary in PDF format"
            >
              <Download size={13} />
              <span>PDF Summary</span>
            </button>
            <button
              onClick={() => generateSummaryExcel(filteredAccounts)}
              disabled={filteredAccounts.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-sm hover:scale-102"
              title="Download Portfolio Summary in Excel (.xlsx) format"
            >
              <FileSpreadsheet size={13} />
              <span>Excel Summary</span>
            </button>
          </div>

          {canEnterData && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95 cursor-pointer shrink-0"
            >
              <Plus size={18} />
              <span>Enter Data</span>
            </button>
          )}
        </div>

        {/* Decorative ambient elements */}
        <div className="absolute right-[-40px] top-[-40px] w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Accounts</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-gray-900">{accounts.length}</span>
            <span className="text-[10px] font-bold text-gray-400">Delinquent Ledger</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-red-500 flex items-center gap-1">
            <TrendingDown size={14} /> Total Portfolio Exposure
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-xl font-black text-red-600">₱{aggregateMetrics.totalExposure.toLocaleString()}</span>
            <span className="text-[9px] font-bold text-gray-400">P+I+Pen+PDI</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1">
            <MapPin size={14} /> Field Visited
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700">{aggregateMetrics.fieldVisitedCount}</span>
            <span className="text-[10px] font-bold text-emerald-600">
              {accounts.length > 0 ? Math.round((aggregateMetrics.fieldVisitedCount / accounts.length) * 100) : 0}% of portfolio
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-1">
            <CheckCircle2 size={14} /> Task Completed
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-700">{aggregateMetrics.completedCount}</span>
            <span className="text-[10px] font-bold text-blue-600">Resolved / Settled</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search borrower name, address, contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-900"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          {/* Tribe Filter Buttons: NCR, CAVITE, MINDORO */}
          <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-2xl border border-gray-200/70 overflow-x-auto max-w-full">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 px-2 shrink-0 flex items-center gap-1">
              <MapPin size={11} className="text-emerald-700" /> Tribe:
            </span>
            {['All', 'NCR', 'Cavite', 'Mindoro', 'Rizal'].map((tr) => (
              <button
                key={tr}
                type="button"
                onClick={() => setTribeFilter(tr)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                  tribeFilter.toUpperCase() === tr.toUpperCase()
                    ? 'bg-emerald-700 text-white shadow-sm scale-102'
                    : 'text-gray-600 hover:text-emerald-800 hover:bg-white/80'
                }`}
              >
                {tr.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 shrink-0 px-1">Status:</span>
            {['All', ...STATUS_OPTIONS].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                  statusFilter === st
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accounts Table Ledger */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">
              Delinquent Accounts Ledger
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
              {filteredAccounts.length} {filteredAccounts.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Click an account to view Progress Line & Communication Ledger
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-xs font-black uppercase text-gray-400 animate-pulse">
            Loading Delinquency Database...
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto text-gray-300">
              <ShieldAlert size={24} />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">
              No delinquency records found matching filters
            </p>
            {canEnterData && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                <Plus size={14} /> Enter First Account
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                  <th className="p-3.5">Entry Date & Time</th>
                  <th className="p-3.5">Borrower Name</th>
                  <th className="p-3.5 text-center">Tribe</th>
                  <th className="p-3.5">Address</th>
                  <th className="p-3.5 text-right">Loan Amount</th>
                  <th className="p-3.5 text-right">Principal Bal.</th>
                  <th className="p-3.5 text-right">Interest Bal.</th>
                  <th className="p-3.5 text-right">Penalty</th>
                  <th className="p-3.5 text-right">PDI</th>
                  <th className="p-3.5 text-right">Total Balance</th>
                  <th className="p-3.5 text-center">Bawas / Paid</th>
                  <th className="p-3.5 text-center">Progress Line</th>
                  <th className="p-3.5 text-center">Comms</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredAccounts.map((acc) => {
                  const commCount = acc.communications?.length || 0;
                  return (
                    <tr 
                      key={acc.id}
                      onClick={() => setSelectedAccount(acc)}
                      className="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="p-3.5 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                        <div className="font-bold text-gray-800">{acc.entryDate}</div>
                        <div className="text-[9px] text-gray-400 flex items-center gap-1">
                          <Clock size={10} /> {format(new Date(acc.createdAt), 'hh:mm a')}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-black text-gray-900 uppercase text-xs group-hover:text-emerald-800 transition-colors">
                          {acc.name}
                        </div>
                        {acc.contactNumber && (
                          <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1 mt-0.5">
                            <Phone size={10} /> {acc.contactNumber}
                          </div>
                        )}
                      </td>

                      {/* Tribe Badge */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                          (acc.tribe || '').toUpperCase() === 'CAVITE'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : (acc.tribe || '').toUpperCase() === 'MINDORO'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : (acc.tribe || '').toUpperCase() === 'RIZAL'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {acc.tribe || 'NCR'}
                        </span>
                      </td>

                      <td className="p-3.5 max-w-[180px] truncate text-gray-600 font-medium text-[11px]" title={acc.address}>
                        {acc.address}
                      </td>

                      <td className="p-3.5 text-right font-bold text-gray-900 whitespace-nowrap">
                        ₱{acc.loanAmount?.toLocaleString()}
                      </td>

                      <td className="p-3.5 text-right font-bold text-gray-700 whitespace-nowrap">
                        ₱{acc.principalBalance?.toLocaleString()}
                      </td>

                      <td className="p-3.5 text-right font-bold text-gray-700 whitespace-nowrap">
                        ₱{acc.interestBalance?.toLocaleString()}
                      </td>

                      <td className="p-3.5 text-right font-bold text-amber-700 whitespace-nowrap">
                        ₱{acc.penalty?.toLocaleString()}
                      </td>

                      <td className="p-3.5 text-right font-bold text-purple-700 whitespace-nowrap">
                        ₱{acc.pdi?.toLocaleString()}
                      </td>

                      <td className="p-3.5 text-right font-black text-red-600 whitespace-nowrap">
                        ₱{acc.totalBalance?.toLocaleString()}
                      </td>

                      {/* Bawas / Reduction Indicator */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        {(() => {
                          const totalPaid = acc.totalPaid || (acc.payments?.reduce((s, p) => s + (p.amount || 0), 0) || 0);
                          const initTot = acc.initialTotal || (acc.totalBalance + totalPaid);
                          const pct = initTot > 0 && totalPaid > 0 ? Math.round((totalPaid / initTot) * 100) : 0;
                          if (totalPaid > 0) {
                            return (
                              <div className="flex flex-col items-center">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <ArrowDownRight size={10} />
                                  -₱{totalPaid.toLocaleString()}
                                </span>
                                <span className="text-[8px] font-bold text-emerald-700 mt-0.5">
                                  {pct}% nabawas
                                </span>
                              </div>
                            );
                          }
                          return (
                            <span className="text-[10px] text-gray-400 font-bold">
                              No bawas yet
                            </span>
                          );
                        })()}
                      </td>

                      {/* Mini Progress Line Indicator */}
                      <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <span 
                            title={`Date of Entry: ${acc.entryDate} ${format(new Date(acc.createdAt), 'hh:mm a')}`}
                            className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-2 ring-emerald-200" 
                          />
                          <span className={`w-3 h-0.5 ${acc.fieldVisited ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                          <button
                            type="button"
                            onClick={() => handleToggleFieldVisit(acc)}
                            title={acc.fieldVisited ? `Field Visited on ${acc.fieldVisitDate ? format(new Date(acc.fieldVisitDate), 'MMM d, yyyy h:mm a') : 'Yes'}` : 'Click to mark Field Visited'}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${
                              acc.fieldVisited ? 'bg-emerald-600 ring-2 ring-emerald-200' : 'bg-gray-300 hover:bg-emerald-400'
                            }`}
                          />
                          <span className={`w-3 h-0.5 ${acc.taskCompleted ? 'bg-blue-500' : 'bg-gray-200'}`} />
                          <button
                            type="button"
                            onClick={() => handleToggleTaskCompleted(acc)}
                            title={acc.taskCompleted ? `Task Completed on ${acc.taskCompletedDate ? format(new Date(acc.taskCompletedDate), 'MMM d, yyyy h:mm a') : 'Yes'}` : 'Click to mark Task Completed'}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${
                              acc.taskCompleted ? 'bg-blue-600 ring-2 ring-blue-200' : 'bg-gray-300 hover:bg-blue-400'
                            }`}
                          />
                        </div>
                      </td>

                      {/* Communication Count Badge */}
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          commCount > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-gray-50 text-gray-400'
                        }`}>
                          <MessageSquare size={10} />
                          {commCount}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-1 text-[8px] font-black uppercase rounded-md tracking-wider inline-block ${
                          acc.status === 'Settled'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : acc.status === 'Promise to Pay'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : acc.status === 'Field Visited'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : acc.status === 'Legal / Escalated'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {acc.status}
                        </span>
                      </td>

                      {/* Action & Individual Report Generator */}
                      <td className="p-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => generateIndividualPDF(acc)}
                            className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Generate Individual Client Report (PDF)"
                          >
                            <FileText size={15} />
                          </button>
                          <button
                            onClick={() => generateIndividualExcel(acc)}
                            className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Generate Individual Client Report (Excel)"
                          >
                            <FileSpreadsheet size={15} />
                          </button>
                          <button
                            onClick={() => setSelectedAccount(acc)}
                            className="p-1.5 text-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors font-bold text-xs"
                            title="Open Dossier, Progress Line & Communication Ledger"
                          >
                            <ChevronRight size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenTransferModal(acc)}
                            className="p-1.5 text-gray-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Transfer Account to Selected Tribe"
                          >
                            <ArrowLeftRight size={15} />
                          </button>
                          {user.role === 'admin' && (
                            <button
                              onClick={() => handleDeleteAccount(acc.id, acc.name)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Account"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-gray-100 bg-gray-50/80 font-black text-gray-900 text-xs">
                <tr>
                  <td className="p-3.5 uppercase tracking-wider text-[10px] text-gray-500" colSpan={4}>
                    Portfolio Total ({filteredAccounts.length} Accounts)
                  </td>
                  <td className="p-3.5 text-right">
                    ₱{filteredAccounts.reduce((sum, a) => sum + (a.loanAmount || 0), 0).toLocaleString()}
                  </td>
                  <td className="p-3.5 text-right">
                    ₱{filteredAccounts.reduce((sum, a) => sum + (a.principalBalance || 0), 0).toLocaleString()}
                  </td>
                  <td className="p-3.5 text-right">
                    ₱{filteredAccounts.reduce((sum, a) => sum + (a.interestBalance || 0), 0).toLocaleString()}
                  </td>
                  <td className="p-3.5 text-right text-amber-700">
                    ₱{filteredAccounts.reduce((sum, a) => sum + (a.penalty || 0), 0).toLocaleString()}
                  </td>
                  <td className="p-3.5 text-right text-purple-700">
                    ₱{filteredAccounts.reduce((sum, a) => sum + (a.pdi || 0), 0).toLocaleString()}
                  </td>
                  <td className="p-3.5 text-right text-red-600 font-black">
                    ₱{filteredAccounts.reduce((sum, a) => sum + (a.totalBalance || 0), 0).toLocaleString()}
                  </td>
                  <td className="p-3.5 text-center font-black text-emerald-800">
                    ₱{filteredAccounts.reduce((sum, a) => sum + (a.totalPaid || (a.payments?.reduce((s, p) => s + (p.amount || 0), 0) || 0)), 0).toLocaleString()}
                  </td>
                  <td className="p-3.5" colSpan={4}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD DELINQUENCY ENTRY (Admin, Supervisor, Manager, Coordinator) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-emerald-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-linear-to-r from-emerald-800 to-emerald-900 p-6 text-white flex justify-between items-center">
              <div>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-300">
                  New Delinquency Record
                </span>
                <h3 className="text-xl font-black uppercase tracking-tight">Enter Account Details</h3>
                <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider mt-0.5">
                  Authorized Role: {user.role.toUpperCase()} • {user.fullName}
                </p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="hover:rotate-90 transition-transform bg-white/10 p-2 rounded-xl text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateAccount} className="p-6 md:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                  Borrower & Entry Coordinates
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">
                      Entry Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formEntryDate}
                      onChange={(e) => setFormEntryDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block mb-1">
                      Tribe / Region *
                    </label>
                    <select
                      value={formTribe}
                      onChange={(e) => setFormTribe(e.target.value)}
                      className="w-full px-4 py-2.5 bg-emerald-50/60 border border-emerald-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-emerald-950 font-black"
                    >
                      <option value="NCR">NCR</option>
                      <option value="Cavite">CAVITE</option>
                      <option value="Mindoro">MINDORO</option>
                      <option value="Rizal">RIZAL</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">
                      Borrower Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Juan Dela Cruz"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">
                      Borrower Address *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Complete physical / business address"
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">
                      Contact / Mobile No.
                    </label>
                    <input
                      type="text"
                      placeholder="0917-000-0000"
                      value={formContact}
                      onChange={(e) => setFormContact(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Balances Breakdown */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                    Obligation & Balance Ledger (PHP)
                  </h4>
                  <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Auto-Computed Total
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">
                      Original Loan Amount
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={formLoanAmount}
                      onChange={(e) => setFormLoanAmount(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">
                      Principal Balance *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="0.00"
                      value={formPrincipal}
                      onChange={(e) => setFormPrincipal(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">
                      Interest Balance *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="0.00"
                      value={formInterest}
                      onChange={(e) => setFormInterest(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-amber-700 block mb-1">
                      Penalty
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={formPenalty}
                      onChange={(e) => setFormPenalty(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-purple-700 block mb-1">
                      PDI (Past Due Interest)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={formPdi}
                      onChange={(e) => setFormPdi(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200 flex flex-col justify-center">
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800">
                      Total Balance (P+I+Pen+PDI)
                    </span>
                    <span className="text-base font-black text-red-600 mt-0.5">
                      ₱{computedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving Account...' : 'Save Delinquency Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ACCOUNT DOSSIER, PROGRESS LINE & COMMUNICATION LOGS */}
      {selectedAccount && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-emerald-100 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-linear-to-r from-emerald-800 to-teal-900 p-6 text-white flex justify-between items-start shrink-0">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-white/20 rounded-md text-[9px] font-black uppercase tracking-widest">
                    ID: {selectedAccount.id.slice(0, 8)}
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-600/80 rounded-md text-[9px] font-black uppercase tracking-wider">
                    {selectedAccount.status}
                  </span>
                  <span className="text-[10px] text-white/70 font-mono">
                    Entry: {selectedAccount.entryDate} at {format(new Date(selectedAccount.createdAt), 'hh:mm a')}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <h3 className="text-2xl font-black uppercase tracking-tight">{selectedAccount.name}</h3>
                  <span className="px-2.5 py-0.5 bg-emerald-700 text-white rounded-md text-[9px] font-black uppercase tracking-wider border border-emerald-500/30">
                    Tribe: {selectedAccount.tribe || 'NCR'}
                  </span>
                </div>
                <p className="text-xs text-emerald-200 font-medium flex items-center gap-1.5 mt-0.5">
                  <MapPin size={13} /> {selectedAccount.address}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Individual Report Buttons inside Dossier Modal */}
                <button
                  onClick={() => generateIndividualPDF(selectedAccount)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-white/20 cursor-pointer shadow-sm hover:scale-102"
                  title="Generate & Download Full Individual Client Report in PDF format"
                >
                  <FileText size={14} />
                  <span>PDF Client Report</span>
                </button>

                <button
                  onClick={() => generateIndividualExcel(selectedAccount)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:scale-102"
                  title="Generate & Download Full Individual Client Report in Excel format"
                >
                  <FileSpreadsheet size={14} />
                  <span>Excel Client Report</span>
                </button>

                <button
                  onClick={() => setSelectedAccount(null)}
                  className="hover:rotate-90 transition-transform bg-white/10 p-2 rounded-xl text-white cursor-pointer ml-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable Modal Content */}
            <div className="p-6 md:p-8 space-y-8 overflow-y-auto flex-1">
              {/* SECTION A: PROGRESS LINE (Date of Entry with time, Field Visited, Task Completed) */}
              <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity size={18} className="text-emerald-800" />
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-950">
                      Account Progress Line
                    </h4>
                  </div>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                    Interactive Milestones
                  </span>
                </div>

                <div className="relative pt-3 pb-2">
                  {/* Connector Line */}
                  <div className="absolute top-[38px] left-8 right-8 h-1 bg-gray-200 -z-0">
                    <div 
                      className="h-full bg-emerald-600 transition-all duration-500" 
                      style={{ 
                        width: selectedAccount.taskCompleted ? '100%' : selectedAccount.fieldVisited ? '50%' : '0%' 
                      }} 
                    />
                  </div>

                  {/* 3 Milestones */}
                  <div className="grid grid-cols-3 gap-2 relative z-10">
                    {/* Step 1: Date of Entry with Time */}
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black shadow-md ring-4 ring-white">
                        <Check size={18} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-800 mt-2">
                        Date of Entry
                      </span>
                      <span className="text-[9px] font-mono text-emerald-800 font-bold mt-0.5">
                        {selectedAccount.entryDate}
                      </span>
                      <span className="text-[8px] font-mono text-gray-400">
                        {format(new Date(selectedAccount.createdAt), 'hh:mm:ss a')}
                      </span>
                      <span className="text-[8px] text-gray-400 mt-0.5">
                        By: {selectedAccount.createdByName} ({selectedAccount.createdByRole})
                      </span>
                    </div>

                    {/* Step 2: Field Visited */}
                    <div className="flex flex-col items-center text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleFieldVisit(selectedAccount)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-black shadow-md ring-4 ring-white transition-all cursor-pointer ${
                          selectedAccount.fieldVisited
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-white text-gray-400 border-2 border-dashed border-gray-300 hover:border-emerald-500 hover:text-emerald-600'
                        }`}
                        title={selectedAccount.fieldVisited ? 'Click to unmark' : 'Click to mark Field Visited'}
                      >
                        {selectedAccount.fieldVisited ? <Check size={18} /> : <MapPin size={18} />}
                      </button>
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-800 mt-2">
                        Field Visited
                      </span>
                      {selectedAccount.fieldVisited ? (
                        <>
                          <span className="text-[9px] font-mono text-emerald-800 font-bold mt-0.5">
                            {selectedAccount.fieldVisitDate ? format(new Date(selectedAccount.fieldVisitDate), 'MMM d, yyyy') : 'Logged'}
                          </span>
                          <span className="text-[8px] font-mono text-gray-400">
                            {selectedAccount.fieldVisitDate ? format(new Date(selectedAccount.fieldVisitDate), 'hh:mm:ss a') : ''}
                          </span>
                          {selectedAccount.fieldVisitOfficerName && (
                            <span className="text-[8px] text-emerald-700 font-bold">
                              By: {selectedAccount.fieldVisitOfficerName}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[8px] font-bold text-amber-600 uppercase mt-0.5">
                          Pending Visit
                        </span>
                      )}
                    </div>

                    {/* Step 3: Task Completed */}
                    <div className="flex flex-col items-center text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleTaskCompleted(selectedAccount)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-black shadow-md ring-4 ring-white transition-all cursor-pointer ${
                          selectedAccount.taskCompleted
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-white text-gray-400 border-2 border-dashed border-gray-300 hover:border-blue-500 hover:text-blue-600'
                        }`}
                        title={selectedAccount.taskCompleted ? 'Click to unmark' : 'Click to mark Task Completed'}
                      >
                        {selectedAccount.taskCompleted ? <Check size={18} /> : <CheckCircle2 size={18} />}
                      </button>
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-800 mt-2">
                        Task Completed
                      </span>
                      {selectedAccount.taskCompleted ? (
                        <>
                          <span className="text-[9px] font-mono text-blue-800 font-bold mt-0.5">
                            {selectedAccount.taskCompletedDate ? format(new Date(selectedAccount.taskCompletedDate), 'MMM d, yyyy') : 'Completed'}
                          </span>
                          <span className="text-[8px] font-mono text-gray-400">
                            {selectedAccount.taskCompletedDate ? format(new Date(selectedAccount.taskCompletedDate), 'hh:mm:ss a') : ''}
                          </span>
                          {selectedAccount.taskCompletedByName && (
                            <span className="text-[8px] text-blue-700 font-bold">
                              By: {selectedAccount.taskCompletedByName}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION B: FINANCIAL BALANCES & PAYMENT REDUCTION PROGRESS */}
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Balance Recovery Tracking
                    </span>
                    <h4 className="text-sm font-black uppercase tracking-wider text-gray-900 mt-1">
                      Account Balances & Reduction Progress
                    </h4>
                  </div>

                  {/* Record Payment Button (Available to ALL users) */}
                  <button
                    type="button"
                    onClick={() => {
                      setPayError('');
                      setIsPaymentModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                    title="Record payment to reduce principal, interest, penalty, or PDI"
                  >
                    <CreditCard size={15} />
                    <span>Record Payment / Bawas</span>
                  </button>
                </div>

                {/* Reduction Progress Metric Banners */}
                {(() => {
                  const initP = selectedAccount.initialPrincipal !== undefined ? selectedAccount.initialPrincipal : selectedAccount.principalBalance;
                  const curP = selectedAccount.principalBalance || 0;
                  const pReduction = Math.max(0, initP - curP);
                  const pPercent = initP > 0 ? Math.min(100, Math.round((pReduction / initP) * 100)) : (curP === 0 ? 100 : 0);

                  const initI = selectedAccount.initialInterest !== undefined ? selectedAccount.initialInterest : selectedAccount.interestBalance;
                  const curI = selectedAccount.interestBalance || 0;
                  const iReduction = Math.max(0, initI - curI);
                  const iPercent = initI > 0 ? Math.min(100, Math.round((iReduction / initI) * 100)) : (curI === 0 ? 100 : 0);

                  const initT = selectedAccount.initialTotal !== undefined ? selectedAccount.initialTotal : selectedAccount.totalBalance;
                  const curT = selectedAccount.totalBalance || 0;
                  const tReduction = Math.max(0, initT - curT);
                  const tPercent = initT > 0 ? Math.min(100, Math.round((tReduction / initT) * 100)) : (curT === 0 ? 100 : 0);

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Principal Progress */}
                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-gray-500">
                          <span>Principal Reduced</span>
                          <span className="text-emerald-700 font-extrabold">{pPercent}% paid</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-base font-black text-gray-900">₱{curP.toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-gray-400 line-through">₱{initP.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-emerald-600 h-2 rounded-full transition-all duration-500" style={{ width: `${pPercent}%` }} />
                        </div>
                        <div className="text-[9px] font-bold text-emerald-800 flex items-center justify-between">
                          <span>Bawas: ₱{pReduction.toLocaleString()}</span>
                          <span>Remaining: ₱{curP.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Interest Progress */}
                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-gray-500">
                          <span>Interest Reduced</span>
                          <span className="text-teal-700 font-extrabold">{iPercent}% paid</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-base font-black text-gray-900">₱{curI.toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-gray-400 line-through">₱{initI.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-teal-600 h-2 rounded-full transition-all duration-500" style={{ width: `${iPercent}%` }} />
                        </div>
                        <div className="text-[9px] font-bold text-teal-800 flex items-center justify-between">
                          <span>Bawas: ₱{iReduction.toLocaleString()}</span>
                          <span>Remaining: ₱{curI.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Total Exposure Progress */}
                      <div className="bg-red-50/60 p-4 rounded-xl border border-red-200/80 shadow-2xs space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-red-700">
                          <span>Total Balance Progress</span>
                          <span className="text-red-800 font-extrabold">{tPercent}% settled</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-base font-black text-red-600">₱{curT.toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-gray-400 line-through">₱{initT.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-red-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-red-600 h-2 rounded-full transition-all duration-500" style={{ width: `${tPercent}%` }} />
                        </div>
                        <div className="text-[9px] font-bold text-red-800 flex items-center justify-between">
                          <span>Total Bawas: ₱{tReduction.toLocaleString()}</span>
                          <span>Outstanding: ₱{curT.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 6 Balances Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
                  <div className="bg-white p-3 rounded-xl border border-gray-200/60">
                    <span className="text-[8px] font-black uppercase text-gray-400 block">Loan Amount</span>
                    <span className="text-xs font-black text-gray-900 mt-1 block">₱{selectedAccount.loanAmount?.toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-200/60">
                    <span className="text-[8px] font-black uppercase text-emerald-800 block">Principal Bal.</span>
                    <span className="text-xs font-black text-emerald-900 mt-1 block">₱{selectedAccount.principalBalance?.toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-teal-200/60">
                    <span className="text-[8px] font-black uppercase text-teal-800 block">Interest Bal.</span>
                    <span className="text-xs font-black text-teal-900 mt-1 block">₱{selectedAccount.interestBalance?.toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-amber-200/60">
                    <span className="text-[8px] font-black uppercase text-amber-700 block">Penalty</span>
                    <span className="text-xs font-black text-amber-800 mt-1 block">₱{selectedAccount.penalty?.toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-purple-200/60">
                    <span className="text-[8px] font-black uppercase text-purple-700 block">PDI</span>
                    <span className="text-xs font-black text-purple-800 mt-1 block">₱{selectedAccount.pdi?.toLocaleString()}</span>
                  </div>
                  <div className="bg-red-50 p-3 rounded-xl border border-red-200">
                    <span className="text-[8px] font-black uppercase text-red-700 block">Total Balance</span>
                    <span className="text-xs font-black text-red-600 mt-1 block">₱{selectedAccount.totalBalance?.toLocaleString()}</span>
                  </div>
                </div>

                {/* LINE GRAPH: VISUAL BALANCE REDUCTION TREND (PAG-GALAW NG ACCOUNT) */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <TrendingDown size={16} className="text-emerald-700" />
                        <h5 className="text-xs font-black uppercase tracking-wider text-gray-900">
                          Balance Reduction Line Graph (Pag-galaw ng Principal & Interest)
                        </h5>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium">
                        Real-time trajectory curve showing balance reduction as payments are applied
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                        <span className="text-gray-700">Principal</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-teal-500 inline-block" />
                        <span className="text-gray-700">Interest</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                        <span className="text-gray-700">Total Balance</span>
                      </div>
                    </div>
                  </div>

                  {/* Prepare Chart Data Points */}
                  {(() => {
                    const snapshots = selectedAccount.balanceSnapshots && selectedAccount.balanceSnapshots.length > 0
                      ? selectedAccount.balanceSnapshots
                      : [
                          {
                            date: selectedAccount.entryDate,
                            timestamp: selectedAccount.createdAt,
                            label: 'Initial Entry',
                            principalBalance: selectedAccount.initialPrincipal || selectedAccount.principalBalance,
                            interestBalance: selectedAccount.initialInterest || selectedAccount.interestBalance,
                            penalty: selectedAccount.penalty,
                            pdi: selectedAccount.pdi,
                            totalBalance: selectedAccount.initialTotal || selectedAccount.totalBalance,
                            actionNote: 'Initial registration'
                          }
                        ];

                    const chartData = snapshots.map((s, idx) => ({
                      name: s.date ? format(new Date(s.date), 'MMM d') : `Step ${idx + 1}`,
                      fullDate: s.date,
                      label: s.label || `Point ${idx + 1}`,
                      Principal: s.principalBalance,
                      Interest: s.interestBalance,
                      Penalty: s.penalty,
                      PDI: s.pdi,
                      Total: s.totalBalance,
                      note: s.actionNote
                    }));

                    return (
                      <div className="w-full h-64 pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                            <defs>
                              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                              </linearGradient>
                              <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#059669" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#059669" stopOpacity={0.0}/>
                              </linearGradient>
                              <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="name" 
                              tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                              axisLine={{ stroke: '#cbd5e1' }}
                            />
                            <YAxis 
                              tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                              axisLine={{ stroke: '#cbd5e1' }}
                              tickFormatter={(val) => `₱${(val / 1000).toFixed(0)}k`}
                            />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-200 text-xs space-y-1.5 z-50">
                                      <div className="font-black text-gray-900 border-b border-gray-100 pb-1 flex justify-between gap-4">
                                        <span>{data.label}</span>
                                        <span className="text-gray-400 font-mono text-[10px]">{data.fullDate}</span>
                                      </div>
                                      <div className="space-y-1 pt-1 font-semibold">
                                        <div className="flex justify-between gap-4 text-emerald-700">
                                          <span>Principal:</span>
                                          <span className="font-black">₱{data.Principal?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between gap-4 text-teal-700">
                                          <span>Interest:</span>
                                          <span className="font-black">₱{data.Interest?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between gap-4 text-amber-700">
                                          <span>Penalty:</span>
                                          <span className="font-black">₱{data.Penalty?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between gap-4 text-purple-700">
                                          <span>PDI:</span>
                                          <span className="font-black">₱{data.PDI?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between gap-4 text-red-600 font-black border-t border-gray-100 pt-1">
                                          <span>Total Balance:</span>
                                          <span>₱{data.Total?.toLocaleString()}</span>
                                        </div>
                                      </div>
                                      {data.note && (
                                        <p className="text-[9px] text-gray-400 italic pt-1 border-t border-gray-100">
                                          {data.note}
                                        </p>
                                      )}
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="Total" 
                              stroke="#ef4444" 
                              strokeWidth={3} 
                              fillOpacity={1} 
                              fill="url(#colorTotal)" 
                            />
                            <Line 
                              type="monotone" 
                              dataKey="Principal" 
                              stroke="#059669" 
                              strokeWidth={2.5} 
                              dot={{ r: 4, fill: '#059669' }} 
                              activeDot={{ r: 6 }} 
                            />
                            <Line 
                              type="monotone" 
                              dataKey="Interest" 
                              stroke="#0d9488" 
                              strokeWidth={2} 
                              strokeDasharray="4 4"
                              dot={{ r: 3, fill: '#0d9488' }} 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })()}

                  {/* Payment History Table (if payments logged) */}
                  {selectedAccount.payments && selectedAccount.payments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                          Recorded Payment Receipts ({selectedAccount.payments.length})
                        </span>
                        <span className="text-[10px] font-black text-emerald-800">
                          Total Paid: ₱{selectedAccount.payments.reduce((s, p) => s + (p.amount || 0), 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="overflow-x-auto max-h-40 overflow-y-auto rounded-xl border border-gray-100">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-gray-50 text-[9px] font-black uppercase text-gray-400 italic border-b border-gray-100">
                              <th className="p-2">Date</th>
                              <th className="p-2">OR / Ref</th>
                              <th className="p-2">Method</th>
                              <th className="p-2 text-right">Total Paid</th>
                              <th className="p-2 text-right">Principal</th>
                              <th className="p-2 text-right">Interest</th>
                              <th className="p-2">Received By</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 font-semibold text-gray-700">
                            {selectedAccount.payments.map((p) => (
                              <tr key={p.id} className="hover:bg-gray-50/50 text-[11px]">
                                <td className="p-2 font-mono text-gray-500">{p.paymentDate}</td>
                                <td className="p-2 font-mono text-gray-700">{p.orNumber || '-'}</td>
                                <td className="p-2 font-bold text-gray-800">{p.paymentMethod}</td>
                                <td className="p-2 text-right font-black text-emerald-700">₱{p.amount.toLocaleString()}</td>
                                <td className="p-2 text-right text-gray-700">₱{p.principalPaid.toLocaleString()}</td>
                                <td className="p-2 text-right text-gray-700">₱{p.interestPaid.toLocaleString()}</td>
                                <td className="p-2 text-gray-500 text-[10px]">{p.recordedByName}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Switcher */}
                <div className="mt-4 pt-4 border-t border-gray-200/60 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                    Account Classification Status:
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    {STATUS_OPTIONS.map((st) => (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(selectedAccount, st)}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          selectedAccount.status === st
                            ? 'bg-emerald-800 text-white shadow-sm'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION C: ADD COMMUNICATION FORM (ALL USERS CAN LOG) */}
              <div className="bg-white p-6 rounded-2xl border-2 border-emerald-500/20 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-emerald-700" />
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900">
                      Record New Communication & Remarks
                    </h4>
                  </div>
                  <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Logging as: {user.fullName} ({user.role.toUpperCase()})
                  </span>
                </div>

                <form onSubmit={handleAddCommunication} className="space-y-4">
                  {/* Communication Type Selector */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-2">
                      Type of Communication Made *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {COMMUNICATION_TYPES.map(({ type, label, icon: Icon, color }) => {
                        const isSelected = commType === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setCommType(type)}
                            className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-800 text-white border-emerald-800 shadow-md scale-102'
                                : `${color} hover:opacity-80`
                            }`}
                          >
                            <Icon size={16} />
                            <span className="text-[10px] uppercase font-black">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Promise to Pay Field */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">
                      Promise to Pay (PTP) / Target Commitment Date & Amount
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Promised ₱15,000 on November 15, 2026 or Next Payday"
                      value={commPromiseToPay}
                      onChange={(e) => setCommPromiseToPay(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-900"
                    />
                  </div>

                  {/* Remarks Field */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">
                      Communication Notes & Conversation Remarks *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Write comprehensive remarks on borrower conversation, reasons for delay, agreed actions, or field visit findings..."
                      value={commRemarks}
                      onChange={(e) => setCommRemarks(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-900"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingComm}
                      className="flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <Send size={14} />
                      <span>{isSubmittingComm ? 'Recording...' : 'Save Communication Log'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* SECTION D: HISTORICAL COMMUNICATION AUDIT TRAIL */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History size={16} className="text-gray-500" />
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-700">
                      Communication History & Interaction Trail
                    </h4>
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {selectedAccount.communications?.length || 0} Recorded Log{(selectedAccount.communications?.length || 0) === 1 ? '' : 's'}
                  </span>
                </div>

                {!selectedAccount.communications || selectedAccount.communications.length === 0 ? (
                  <div className="p-8 border border-dashed border-gray-200 rounded-2xl text-center text-xs font-bold text-gray-400">
                    No communication logs recorded yet. Use the form above to record calls, messages, or field visits.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedAccount.communications.map((c) => {
                      const commConfig = COMMUNICATION_TYPES.find(ct => ct.type === c.type) || COMMUNICATION_TYPES[4];
                      const Icon = commConfig.icon;
                      return (
                        <div key={c.id} className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 hover:bg-gray-50 transition-colors space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <span className={`p-1.5 rounded-lg border text-xs ${commConfig.color}`}>
                                <Icon size={14} />
                              </span>
                              <div>
                                <span className="text-xs font-black text-gray-900 uppercase">
                                  {c.type}
                                </span>
                                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                                  Logged by: <span className="text-emerald-800 font-black">{c.userName}</span> ({c.userRole})
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-[10px] font-mono text-gray-600 font-bold">
                                {format(new Date(c.timestamp), 'MMM d, yyyy')}
                              </div>
                              <div className="text-[9px] font-mono text-gray-400 flex items-center justify-end gap-1">
                                <Clock size={10} /> {format(new Date(c.timestamp), 'hh:mm:ss a')}
                              </div>
                            </div>
                          </div>

                          {c.promiseToPay && (
                            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-900 text-xs flex items-start gap-2">
                              <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-wider text-amber-800 block">
                                  Promise to Pay:
                                </span>
                                <span className="font-bold">{c.promiseToPay}</span>
                              </div>
                            </div>
                          )}

                          <p className="text-xs text-gray-700 font-medium whitespace-pre-wrap leading-relaxed pl-1">
                            {c.remarks}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RECORD PAYMENT / BAWAS (Principal, Interest, Penalty, PDI Reduction) */}
      {isPaymentModalOpen && selectedAccount && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md z-60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-emerald-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-linear-to-r from-emerald-800 to-teal-900 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <CreditCard size={22} className="text-emerald-300" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-300">
                    Payment Collection Entry
                  </span>
                  <h3 className="text-lg font-black uppercase tracking-tight">Record Bawas / Payment</h3>
                  <p className="text-[10px] text-white/70 font-bold uppercase truncate max-w-[260px]">
                    Borrower: {selectedAccount.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="hover:rotate-90 transition-transform bg-white/10 p-2 rounded-xl text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRecordPayment} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {payError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span>{payError}</span>
                </div>
              )}

              {/* Current Balances Alert */}
              <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/80 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-emerald-900">
                  <span>Current Outstanding Balances</span>
                  <span className="text-red-600 font-extrabold">Total: ₱{selectedAccount.totalBalance?.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-lg border border-emerald-100">
                    <span className="text-[8px] text-gray-400 font-black block">Principal</span>
                    <span className="font-black text-gray-800">₱{selectedAccount.principalBalance?.toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-100">
                    <span className="text-[8px] text-gray-400 font-black block">Interest</span>
                    <span className="font-black text-gray-800">₱{selectedAccount.interestBalance?.toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-100">
                    <span className="text-[8px] text-gray-400 font-black block">Penalty</span>
                    <span className="font-black text-amber-700">₱{selectedAccount.penalty?.toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-100">
                    <span className="text-[8px] text-gray-400 font-black block">PDI</span>
                    <span className="font-black text-purple-700">₱{selectedAccount.pdi?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">
                    Payment Method
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e: any) => setPayMethod(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="Cash">Cash Collection</option>
                    <option value="GCash">GCash Transfer</option>
                    <option value="Bank Transfer">Bank Deposit / Transfer</option>
                    <option value="PDC">PDC / Cheque</option>
                    <option value="Other">Other Mode</option>
                  </select>
                </div>
              </div>

              {/* Deductions Breakdown */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 block">
                  Payment Allocation / Magkano ang Nabawas:
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block mb-1">
                      Bawas sa Principal (PHP)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      max={selectedAccount.principalBalance || undefined}
                      value={payPrincipal}
                      onChange={(e) => setPayPrincipal(e.target.value)}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-emerald-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-teal-800 block mb-1">
                      Bawas sa Interest (PHP)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      max={selectedAccount.interestBalance || undefined}
                      value={payInterest}
                      onChange={(e) => setPayInterest(e.target.value)}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-teal-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-amber-700 block mb-1">
                      Bawas sa Penalty (PHP)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      max={selectedAccount.penalty || undefined}
                      value={payPenalty}
                      onChange={(e) => setPayPenalty(e.target.value)}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-amber-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-purple-700 block mb-1">
                      Bawas sa PDI (PHP)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      max={selectedAccount.pdi || undefined}
                      value={payPdi}
                      onChange={(e) => setPayPdi(e.target.value)}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-purple-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                </div>

                {/* Computed Total Payment Banner */}
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900">
                    Total Amount Received / Bawas:
                  </span>
                  <span className="text-base font-black text-emerald-800">
                    ₱{computedPaymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Reference & Remarks */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">
                    Official Receipt (OR) / Ref No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. OR-84920 or Ref #109283"
                    value={payOrNumber}
                    onChange={(e) => setPayOrNumber(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">
                    Payment Notes / Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Partial cash payment handed during morning field collection"
                    value={payRemarks}
                    onChange={(e) => setPayRemarks(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingPay ? 'Processing Bawas...' : 'Apply Payment & Update Chart'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 4: TRANSFER ACCOUNT TO TRIBE
          ========================================================= */}
      {transferTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
            <div className="bg-amber-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/15 rounded-xl">
                  <ArrowLeftRight size={20} />
                </div>
                <div>
                  <h2 className="text-base font-black uppercase tracking-tight">Transfer Account Tribe</h2>
                  <p className="text-[10px] text-amber-100 font-medium">
                    Reassign {transferTarget.name} to another branch/tribe
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTransferTarget(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleTransferTribe} className="p-6 space-y-5">
              {transferError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{transferError}</span>
                </div>
              )}

              {/* Account Summary & Current Tribe */}
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Client Account</p>
                  <p className="text-sm font-black text-gray-900 truncate">{transferTarget.name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{transferTarget.address}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Current Tribe</p>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <MapPin size={10} />
                    {transferTarget.tribe || 'NCR'}
                  </span>
                </div>
              </div>

              {/* Select Destination Tribe */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-2">
                  Select Destination Tribe *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {TRIBE_OPTIONS.map((tribe) => {
                    const isCurrent = (transferTarget.tribe || 'NCR').toUpperCase() === tribe.toUpperCase();
                    const isSelected = targetTribe.toUpperCase() === tribe.toUpperCase();
                    return (
                      <button
                        key={tribe}
                        type="button"
                        disabled={isCurrent}
                        onClick={() => {
                          setTargetTribe(tribe);
                          setTransferError('');
                        }}
                        className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                          isCurrent
                            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20 cursor-pointer'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-amber-300 hover:bg-amber-50/40 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className={isSelected && !isCurrent ? 'text-amber-600' : 'text-gray-400'} />
                          <span className="text-xs font-black uppercase tracking-wider">{tribe}</span>
                        </div>
                        {isCurrent ? (
                          <span className="text-[9px] font-black uppercase bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">
                            Current
                          </span>
                        ) : isSelected ? (
                          <Check size={14} className="text-amber-600" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Transfer Reason / Notes */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">
                  Transfer Reason / Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Client relocated or reassigned to Cavite remedial team..."
                  value={transferRemarks}
                  onChange={(e) => setTransferRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setTransferTarget(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTransferring}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeftRight size={14} />
                  {isTransferring ? 'Transferring...' : `Transfer to ${targetTribe}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
