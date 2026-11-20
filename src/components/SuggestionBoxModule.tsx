import React, { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc
} from 'firebase/firestore';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock,
  Download,
  Inbox,
  Lightbulb,
  Lock,
  MessageSquare,
  MessageSquarePlus,
  RotateCcw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  UserCheck
} from 'lucide-react';
import { auth, db } from '../firebase';
import { HRSuggestion, SuggestionCategory, SuggestionStatus, UserProfile } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
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
  };
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
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface SuggestionBoxModuleProps {
  user: UserProfile;
}

const CATEGORIES: {
  value: SuggestionCategory;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badgeClass: string;
  activeClass: string;
}[] = [
  {
    value: 'Idea',
    label: 'Idea',
    description: 'Process improvement or workplace initiative',
    icon: Lightbulb,
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    activeClass: 'bg-amber-500 text-white border-amber-600 shadow-md'
  },
  {
    value: 'Comment',
    label: 'Comment',
    description: 'General feedback, appreciation, or remarks',
    icon: MessageSquare,
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    activeClass: 'bg-blue-600 text-white border-blue-700 shadow-md'
  },
  {
    value: 'Office Problem',
    label: 'Office Problem',
    description: 'Equipment, facility, workflow, or team issue',
    icon: AlertTriangle,
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    activeClass: 'bg-rose-600 text-white border-rose-700 shadow-md'
  }
];

export default function SuggestionBoxModule({ user }: SuggestionBoxModuleProps) {
  const canReview = user.role === 'admin' || user.role === 'manager';

  // Submission Form State (Available to ALL authenticated users)
  const [category, setCategory] = useState<SuggestionCategory>('Idea');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Admin & Manager Database Review State
  const [suggestions, setSuggestions] = useState<HRSuggestion[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(canReview);
  const [statusFilter, setStatusFilter] = useState<'All' | SuggestionStatus>('Pending');
  const [categoryFilter, setCategoryFilter] = useState<'All' | SuggestionCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Real-time listener ONLY attached for Admin & Manager
  useEffect(() => {
    if (!canReview) {
      setSuggestions([]);
      setLoadingList(false);
      return;
    }

    setLoadingList(true);
    const q = query(collection(db, 'suggestions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        })) as HRSuggestion[];
        setSuggestions(list);
        setNoteDrafts((prev) => {
          const next = { ...prev };
          list.forEach((item) => {
            if (next[item.id] === undefined) {
              next[item.id] = item.reviewNote || '';
            }
          });
          return next;
        });
        setLoadingList(false);
      },
      (error) => {
        setLoadingList(false);
        try {
          handleFirestoreError(error, OperationType.LIST, 'suggestions');
        } catch (err) {
          console.error(err);
          toast.error('Unable to load HR Suggestion Box records.');
        }
      }
    );

    return () => unsubscribe();
  }, [canReview]);

  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSubject = subject.trim().slice(0, 200);
    const trimmedMessage = message.trim().slice(0, 5000);

    if (!trimmedSubject || !trimmedMessage) {
      toast.error('Please enter both a subject and your idea, comment, or concern.');
      return;
    }

    setIsSubmitting(true);
    setSubmittedSuccess(false);

    try {
      const now = new Date().toISOString();
      const payload = {
        category,
        subject: trimmedSubject,
        message: trimmedMessage,
        isAnonymous,
        submittedBy: auth.currentUser?.uid || user.id,
        submittedByName: isAnonymous ? 'Anonymous' : (user.fullName || 'Staff Member').slice(0, 150),
        submittedByRole: isAnonymous ? 'anonymous' : (user.role || 'user').slice(0, 50),
        status: 'Pending' as SuggestionStatus,
        reviewNote: '',
        resolvedBy: null,
        resolvedByName: null,
        resolvedAt: null,
        archivedBy: null,
        archivedByName: null,
        archivedAt: null,
        createdAt: now,
        updatedAt: now
      };

      await addDoc(collection(db, 'suggestions'), payload);

      setSubject('');
      setMessage('');
      setIsAnonymous(false);
      setSubmittedSuccess(true);
      toast.success('Dropped to HR Suggestion Box for Admin & Manager review.');
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, 'suggestions');
      } catch (err) {
        console.error(err);
        toast.error('Failed to submit suggestion. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (item: HRSuggestion, newStatus: SuggestionStatus) => {
    if (!canReview) return;
    setUpdatingId(item.id);
    try {
      const now = new Date().toISOString();
      const draftNote = (noteDrafts[item.id] ?? item.reviewNote ?? '').trim().slice(0, 3000);

      const updatePayload: Record<string, any> = {
        status: newStatus,
        reviewNote: draftNote,
        updatedAt: now
      };

      if (newStatus === 'Resolved') {
        updatePayload.resolvedBy = auth.currentUser?.uid || user.id;
        updatePayload.resolvedByName = (user.fullName || 'Reviewer').slice(0, 150);
        updatePayload.resolvedAt = now;
      } else if (newStatus === 'Archived') {
        updatePayload.archivedBy = auth.currentUser?.uid || user.id;
        updatePayload.archivedByName = (user.fullName || 'Reviewer').slice(0, 150);
        updatePayload.archivedAt = now;
      } else {
        updatePayload.resolvedBy = item.resolvedBy ?? null;
        updatePayload.resolvedByName = item.resolvedByName ?? null;
        updatePayload.resolvedAt = item.resolvedAt ?? null;
        updatePayload.archivedBy = item.archivedBy ?? null;
        updatePayload.archivedByName = item.archivedByName ?? null;
        updatePayload.archivedAt = item.archivedAt ?? null;
      }

      await updateDoc(doc(db, 'suggestions', item.id), updatePayload);
      toast.success(
        newStatus === 'Resolved'
          ? 'Suggestion marked as Resolved.'
          : newStatus === 'Archived'
          ? 'Suggestion moved to Archive for future review.'
          : 'Suggestion reopened for review.'
      );
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.UPDATE, `suggestions/${item.id}`);
      } catch (err) {
        console.error(err);
        toast.error('Failed to update suggestion status.');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveReviewNote = async (item: HRSuggestion) => {
    if (!canReview) return;
    setUpdatingId(item.id);
    try {
      const now = new Date().toISOString();
      const draftNote = (noteDrafts[item.id] ?? '').trim().slice(0, 3000);
      await updateDoc(doc(db, 'suggestions', item.id), {
        reviewNote: draftNote,
        updatedAt: now
      });
      toast.success('HR review note saved for future review.');
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.UPDATE, `suggestions/${item.id}`);
      } catch (err) {
        console.error(err);
        toast.error('Failed to save review note.');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteSuggestion = async (item: HRSuggestion) => {
    if (user.role !== 'admin') return;
    if (!window.confirm(`Permanently delete suggestion "${item.subject}"?`)) return;

    setUpdatingId(item.id);
    try {
      await deleteDoc(doc(db, 'suggestions', item.id));
      toast.success('Suggestion entry deleted.');
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.DELETE, `suggestions/${item.id}`);
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete suggestion entry.');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const metrics = useMemo(() => {
    const total = suggestions.length;
    const pending = suggestions.filter((s) => s.status === 'Pending').length;
    const resolved = suggestions.filter((s) => s.status === 'Resolved').length;
    const archived = suggestions.filter((s) => s.status === 'Archived').length;
    return { total, pending, resolved, archived };
  }, [suggestions]);

  const filteredSuggestions = useMemo(() => {
    const qLower = searchQuery.trim().toLowerCase();
    return suggestions.filter((item) => {
      const matchStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchCategory = categoryFilter === 'All' || item.category === categoryFilter;
      const matchSearch =
        !qLower ||
        item.subject.toLowerCase().includes(qLower) ||
        item.message.toLowerCase().includes(qLower) ||
        item.submittedByName.toLowerCase().includes(qLower) ||
        (item.reviewNote && item.reviewNote.toLowerCase().includes(qLower));
      return matchStatus && matchCategory && matchSearch;
    });
  }, [suggestions, statusFilter, categoryFilter, searchQuery]);

  const handleExportCSV = () => {
    if (!canReview || filteredSuggestions.length === 0) return;

    const escapeCell = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;
    const headers = [
      'Date Submitted',
      'Category',
      'Subject',
      'Message',
      'Submitted By',
      'Role',
      'Status',
      'Review Note',
      'Resolved By',
      'Resolved At',
      'Archived By',
      'Archived At'
    ];

    const rows = filteredSuggestions.map((s) => [
      s.createdAt ? format(new Date(s.createdAt), 'yyyy-MM-dd HH:mm') : '',
      s.category,
      s.subject,
      s.message,
      s.isAnonymous ? 'Anonymous' : s.submittedByName,
      s.isAnonymous ? 'anonymous' : s.submittedByRole,
      s.status,
      s.reviewNote || '',
      s.resolvedByName || '',
      s.resolvedAt ? format(new Date(s.resolvedAt), 'yyyy-MM-dd HH:mm') : '',
      s.archivedByName || '',
      s.archivedAt ? format(new Date(s.archivedAt), 'yyyy-MM-dd HH:mm') : ''
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => escapeCell(String(cell))).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HR_Suggestion_Box_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-24">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-emerald-900 via-emerald-800 to-teal-900 p-6 md:p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
              <MessageSquarePlus className="text-emerald-300" size={26} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">
                Human Resources • Open Feedback Channel
              </span>
              <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tight">
                HR Suggestion Box
              </h1>
            </div>
          </div>
          <p className="text-xs text-white/80 max-w-2xl font-medium">
            Drop ideas, workplace comments, or office-related problems anytime. All submissions are saved securely in the HR database and are strictly restricted so only Admin and Manager can read and review them.
          </p>
        </div>

        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white/10 border border-white/20 rounded-2xl backdrop-blur-md z-10 shrink-0">
          <Lock size={15} className="text-emerald-300" />
          <div className="text-left">
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-200 block">
              Privacy Access Control
            </span>
            <span className="text-[11px] font-bold text-white">
              Admin & Manager Read-Only Access
            </span>
          </div>
        </div>

        <div className="absolute right-[-40px] top-[-40px] w-72 h-72 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
      </div>

      {/* Drop Suggestion Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Inbox size={18} className="text-emerald-700" />
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
              Drop an Idea, Comment, or Office Problem
            </h2>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full w-fit">
            Logged as: {isAnonymous ? 'Anonymous' : `${user.fullName} (${user.role.toUpperCase()})`}
          </span>
        </div>

        <form onSubmit={handleSubmitSuggestion} className="p-6 space-y-5">
          {submittedSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>
                Thank you! Your entry has been saved in the HR Suggestion Box database. Admin and Manager will review it.
              </span>
            </div>
          )}

          {/* Category Selector */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">
              Select Entry Type *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? cat.activeClass
                        : 'bg-gray-50/70 border-gray-200 text-gray-700 hover:bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-white/20' : 'bg-white border border-gray-200'}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider block">
                        {cat.label}
                      </span>
                      <span className={`text-[10px] font-medium block mt-0.5 ${isSelected ? 'text-white/90' : 'text-gray-500'}`}>
                        {cat.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">
              Subject / Title *
            </label>
            <input
              type="text"
              required
              maxLength={200}
              placeholder={
                category === 'Idea'
                  ? 'e.g. Streamlining daily task submission workflow'
                  : category === 'Comment'
                  ? 'e.g. Feedback on monthly evaluation schedule'
                  : 'e.g. Office internet / printer issue at 2nd floor'
              }
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white"
            />
          </div>

          {/* Message */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">
              Details / Message *
            </label>
            <textarea
              required
              rows={4}
              maxLength={5000}
              placeholder="Write your full idea, comment, or details of the office-related problem here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white"
            />
          </div>

          {/* Anonymous Checkbox + Submit */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-gray-100">
            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 border-gray-300 cursor-pointer accent-emerald-700"
              />
              <span className="text-xs font-bold text-gray-700">
                Submit Anonymously (hide my name and role from reviewers)
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
            >
              <Send size={14} />
              <span>{isSubmitting ? 'Submitting...' : 'Drop to Suggestion Box'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Confidentiality Notice for non-Admin/non-Manager OR Full Review Database for Admin & Manager */}
      {!canReview ? (
        <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-emerald-500/15 rounded-2xl border border-emerald-400/20 shrink-0">
            <ShieldCheck size={22} className="text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-emerald-300">
              Restricted Review Database
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              To safeguard employee confidentiality and workplace trust, submitted suggestions, comments, and office problems are encrypted and stored in the HR Suggestion Box database where <span className="text-white font-bold">only Admin and Manager</span> can read, resolve, and archive entries.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Summary Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Total Entries
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-gray-900">{metrics.total}</span>
                <span className="text-[10px] font-bold text-gray-400">All Time</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-1">
                <Clock size={13} /> Pending Review
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-amber-700">{metrics.pending}</span>
                <span className="text-[10px] font-bold text-amber-600">Needs Action</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={13} /> Resolved
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-700">{metrics.resolved}</span>
                <span className="text-[10px] font-bold text-emerald-600">Addressed</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <Archive size={13} /> Archived
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-700">{metrics.archived}</span>
                <span className="text-[10px] font-bold text-slate-500">Future Review</span>
              </div>
            </div>
          </div>

          {/* Review Database Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="relative w-full xl:w-80 shrink-0">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search subject, details, sender, review note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-900"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Status Tabs */}
              <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-2xl border border-gray-200/70">
                {(['Pending', 'Resolved', 'Archived', 'All'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      statusFilter === st
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-2xl border border-gray-200/70">
                {(['All', 'Idea', 'Comment', 'Office Problem'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      categoryFilter === cat
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Export CSV */}
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={filteredSuggestions.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
              >
                <Download size={13} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Review Records List */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                  Suggestion Box Database (Admin & Manager Review)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {filteredSuggestions.length} {filteredSuggestions.length === 1 ? 'Record' : 'Records'}
                </span>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Stored permanently for future HR review
              </span>
            </div>

            {loadingList ? (
              <div className="p-12 text-center text-xs font-black uppercase tracking-widest text-gray-400 animate-pulse">
                Loading HR Suggestion Box Database...
              </div>
            ) : filteredSuggestions.length === 0 ? (
              <div className="p-14 text-center space-y-2">
                <Inbox size={28} className="mx-auto text-gray-300" />
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                  No suggestions found in "{statusFilter}" view
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredSuggestions.map((item) => {
                  const catConfig = CATEGORIES.find((c) => c.value === item.category) || CATEGORIES[0];
                  const CatIcon = catConfig.icon;
                  const isBusy = updatingId === item.id;

                  return (
                    <div key={item.id} className="p-6 hover:bg-gray-50/40 transition-colors space-y-4">
                      {/* Top Metadata Row */}
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${catConfig.badgeClass}`}>
                              <CatIcon size={11} />
                              {item.category}
                            </span>

                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                                item.status === 'Resolved'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : item.status === 'Archived'
                                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {item.status}
                            </span>

                            <span className="text-[11px] font-mono text-gray-400">
                              {item.createdAt ? format(new Date(item.createdAt), 'MMM dd, yyyy • hh:mm a') : ''}
                            </span>
                          </div>

                          <h3 className="text-base font-black text-gray-900">
                            {item.subject}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-600 shrink-0">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-100 border border-gray-200 text-[11px] font-bold text-gray-700">
                            <UserCheck size={13} className="text-emerald-700" />
                            {item.isAnonymous
                              ? 'Anonymous Staff'
                              : `${item.submittedByName} (${String(item.submittedByRole).toUpperCase()})`}
                          </span>
                        </div>
                      </div>

                      {/* Suggestion Message Body */}
                      <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200/70 text-xs text-gray-800 font-medium whitespace-pre-wrap leading-relaxed">
                        {item.message}
                      </div>

                      {/* Resolution / Archive Trail */}
                      {(item.resolvedAt || item.archivedAt) && (
                        <div className="flex flex-wrap gap-3 text-[10px] font-bold">
                          {item.resolvedAt && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 size={12} />
                              Resolved by {item.resolvedByName || 'Reviewer'} on{' '}
                              {format(new Date(item.resolvedAt), 'MMM dd, yyyy • hh:mm a')}
                            </span>
                          )}
                          {item.archivedAt && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                              <Archive size={12} />
                              Archived by {item.archivedByName || 'Reviewer'} on{' '}
                              {format(new Date(item.archivedAt), 'MMM dd, yyyy • hh:mm a')}
                            </span>
                          )}
                        </div>
                      )}

                      {/* HR Review Note + Action Buttons */}
                      <div className="pt-2 flex flex-col lg:flex-row lg:items-center gap-3">
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            maxLength={3000}
                            placeholder="Add HR review / resolution notes for future review..."
                            value={noteDrafts[item.id] ?? item.reviewNote ?? ''}
                            onChange={(e) =>
                              setNoteDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleSaveReviewNote(item)}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                            title="Save Review Note"
                          >
                            <Save size={13} />
                            <span>Save Note</span>
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {item.status !== 'Resolved' && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleUpdateStatus(item, 'Resolved')}
                              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 size={13} />
                              <span>Mark Resolved</span>
                            </button>
                          )}

                          {item.status !== 'Archived' && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleUpdateStatus(item, 'Archived')}
                              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              <Archive size={13} />
                              <span>Archive</span>
                            </button>
                          )}

                          {item.status !== 'Pending' && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleUpdateStatus(item, 'Pending')}
                              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                            >
                              <RotateCcw size={13} />
                              <span>Reopen</span>
                            </button>
                          )}

                          {user.role === 'admin' && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleDeleteSuggestion(item)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                              title="Delete Entry"
                            >
                              <Trash2 size={15} />
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
    </div>
  );
}
