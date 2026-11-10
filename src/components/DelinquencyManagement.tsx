import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserProfile, 
  DelinquencyAccount, 
  DelinquencyCommunication, 
  CommunicationType, 
  DelinquencyStatus 
} from '../types';
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
  History, 
  Activity, 
  Trash2, 
  Check, 
  ChevronRight, 
  MessageCircle, 
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Info
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

export default function DelinquencyManagement({ user }: DelinquencyManagementProps) {
  const [accounts, setAccounts] = useState<DelinquencyAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  // Selected account for dossier/details modal
  const [selectedAccount, setSelectedAccount] = useState<DelinquencyAccount | null>(null);
  
  // Create / Entry Modal State (Allowed for Admin, Supervisor, Manager, Coordinator)
  const canEnterData = useMemo(() => {
    return ['admin', 'supervisor', 'manager', 'coordinator'].includes(user.role);
  }, [user.role]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formEntryDate, setFormEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formName, setFormName] = useState('');
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

  // Communication entry state (Allowed for ALL users in every account)
  const [commType, setCommType] = useState<CommunicationType>('Phone Call');
  const [commRemarks, setCommRemarks] = useState('');
  const [commPromiseToPay, setCommPromiseToPay] = useState('');
  const [isSubmittingComm, setIsSubmittingComm] = useState(false);

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

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const matchSearch = 
        acc.name.toLowerCase().includes(search.toLowerCase()) ||
        acc.address.toLowerCase().includes(search.toLowerCase()) ||
        (acc.contactNumber && acc.contactNumber.includes(search));
      const matchStatus = statusFilter === 'All' || acc.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [accounts, search, statusFilter]);

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
      const newAcc: Omit<DelinquencyAccount, 'id'> = {
        entryDate: formEntryDate,
        name: formName.trim(),
        address: formAddress.trim(),
        contactNumber: formContact.trim() || undefined,
        loanAmount: parseFloat(formLoanAmount) || 0,
        principalBalance: parseFloat(formPrincipal) || 0,
        interestBalance: parseFloat(formInterest) || 0,
        penalty: parseFloat(formPenalty) || 0,
        pdi: parseFloat(formPdi) || 0,
        totalBalance: computedTotal,
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
        promiseToPay: commPromiseToPay.trim() || undefined,
        timestamp: now,
        userId: user.id,
        userName: user.fullName,
        userRole: user.role
      };

      const updatedComms = [newComm, ...(selectedAccount.communications || [])];

      // Auto update status if Field Visit was logged and not yet visited
      let updateFields: any = {
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

        <div className="flex items-center gap-3 z-10 w-full lg:w-auto">
          {canEnterData ? (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95 cursor-pointer w-full lg:w-auto"
            >
              <Plus size={18} />
              <span>Enter Delinquency Data</span>
            </button>
          ) : (
            <div className="px-4 py-2 bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-emerald-200 border border-white/10">
              Viewing as CI Officer • All users can log communications
            </div>
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

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 shrink-0">Filter Status:</span>
          {['All', ...STATUS_OPTIONS].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                statusFilter === st
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {st}
            </button>
          ))}
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
                  <th className="p-3.5">Address</th>
                  <th className="p-3.5 text-right">Loan Amount</th>
                  <th className="p-3.5 text-right">Principal Bal.</th>
                  <th className="p-3.5 text-right">Interest Bal.</th>
                  <th className="p-3.5 text-right">Penalty</th>
                  <th className="p-3.5 text-right">PDI</th>
                  <th className="p-3.5 text-right">Total Balance</th>
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

                      {/* Action */}
                      <td className="p-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedAccount(acc)}
                            className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Open Dossier & Add Communication"
                          >
                            <ChevronRight size={16} />
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
                  <td className="p-3.5 uppercase tracking-wider text-[10px] text-gray-500" colSpan={3}>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <h3 className="text-2xl font-black uppercase tracking-tight mt-1.5">{selectedAccount.name}</h3>
                <p className="text-xs text-emerald-200 font-medium flex items-center gap-1.5 mt-0.5">
                  <MapPin size={13} /> {selectedAccount.address}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedAccount(null)}
                  className="hover:rotate-90 transition-transform bg-white/10 p-2 rounded-xl text-white cursor-pointer"
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

              {/* SECTION B: FINANCIAL BALANCES SNAPSHOT */}
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">
                  Account Balances Breakdown
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
                  <div className="bg-white p-3 rounded-xl border border-gray-200/60">
                    <span className="text-[8px] font-black uppercase text-gray-400 block">Loan Amount</span>
                    <span className="text-xs font-black text-gray-900 mt-1 block">₱{selectedAccount.loanAmount?.toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-gray-200/60">
                    <span className="text-[8px] font-black uppercase text-gray-400 block">Principal</span>
                    <span className="text-xs font-black text-gray-900 mt-1 block">₱{selectedAccount.principalBalance?.toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-gray-200/60">
                    <span className="text-[8px] font-black uppercase text-gray-400 block">Interest</span>
                    <span className="text-xs font-black text-gray-900 mt-1 block">₱{selectedAccount.interestBalance?.toLocaleString()}</span>
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
    </div>
  );
}
