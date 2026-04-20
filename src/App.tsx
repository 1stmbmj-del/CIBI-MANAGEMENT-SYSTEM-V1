import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, Assignment, AssignmentStatus, TimelineStep, AuthResponse } from './types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  LayoutDashboard, 
  UserPlus, 
  ClipboardList, 
  CheckCircle2, 
  Key, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight, 
  Check, 
  AlertCircle,
  Camera,
  User,
  Phone,
  Lock,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Percent,
  Clock,
  Search,
  Users,
  Trash2,
  Download,
  Settings as UserSettings,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInMinutes } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  updatePassword
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
  Timestamp,
  getDocFromServer
} from 'firebase/firestore';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
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
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
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
  post: async (path: string, data: any) => {
    try {
      if (path === '/api/assignments') {
        const docRef = doc(collection(db, 'assignments'));
        await setDoc(docRef, { ...data, createdAt: new Date().toISOString() });
        return { id: docRef.id };
      }
      if (path === '/api/admin-keys') {
        const docRef = doc(db, 'admin_keys', data.key);
        await setDoc(docRef, { ...data, createdAt: new Date().toISOString(), used: false });
        return { success: true };
      }
      throw new Error('Endpoint not implemented in Firebase migration');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },
  patch: async (path: string, data: any) => {
    try {
      const parts = path.split('/');
      if (parts[1] === 'api' && parts[2] === 'assignments') {
        const id = parts[3];
        await updateDoc(doc(db, 'assignments', id), data);
        return { success: true };
      }
      if (path === '/api/auth/profile') {
        const user = auth.currentUser;
        if (!user) throw new Error('Not authenticated');
        if (data.fullName) {
          await updateDoc(doc(db, 'users', user.uid), { fullName: data.fullName });
        }
        if (data.password) {
          await updatePassword(user, data.password);
        }
        return { success: true };
      }
      throw new Error('Endpoint not implemented in Firebase migration');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },
  delete: async (path: string) => {
    try {
      const parts = path.split('/');
      if (parts[1] === 'api' && parts[2] === 'users') {
        const id = parts[3];
        await deleteDoc(doc(db, 'users', id));
        return { success: true };
      }
      throw new Error('Endpoint not implemented in Firebase migration');
    } catch (error) {
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

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'dashboard'>('login');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('DASHBOARD');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({ id: firebaseUser.uid, ...userDoc.data() } as UserProfile);
            setCurrentView('dashboard');
          } else {
            await signOut(auth);
            setUser(null);
            setCurrentView('login');
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
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
      <div className="min-h-screen bg-[#4C1D95] flex items-center justify-center">
        <div className="text-white text-2xl font-bold animate-pulse">AMS PORTAL</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <AnimatePresence mode="wait">
        {currentView === 'login' && (
          <Login 
            onSwitch={() => setCurrentView('register')} 
            setUser={setUser} 
            setCurrentView={setCurrentView} 
          />
        )}
        {currentView === 'register' && (
          <Register 
            onSwitch={() => setCurrentView('login')} 
            setUser={setUser} 
            setCurrentView={setCurrentView} 
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
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- LOGIN COMPONENT ---
function Login({ 
  onSwitch, 
  setUser, 
  setCurrentView 
}: { 
  onSwitch: () => void; 
  setUser: (u: UserProfile) => void; 
  setCurrentView: (v: any) => void; 
}) {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const email = `${mobile}@ams.com`;
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the rest
    } catch (err: any) {
      setError('Invalid mobile number or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="min-h-screen flex"
    >
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-black text-[#4C1D95]">WELCOME</h2>
            <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Sign in to your account</p>
          </div>
          
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <input
                type="text"
                placeholder="Mobile Number"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C1D95]/20"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C1D95]/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#4C1D95] text-white font-bold rounded-lg hover:bg-[#3B1575] transition-colors disabled:opacity-50"
            >
              {loading ? 'SECURE LOGGING IN...' : 'SECURE LOG IN'}
            </button>
          </form>
          
          <div className="text-center">
            <button 
              onClick={onSwitch}
              className="text-[#4C1D95] text-xs font-bold uppercase tracking-widest hover:underline"
            >
              Create New Account
            </button>
          </div>
        </div>
      </div>
      <div className="hidden lg:flex flex-1 bg-[#4C1D95] items-center justify-center p-12">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-black text-white tracking-tighter">SECURE ACCESS</h1>
          <p className="text-white/60 text-sm uppercase tracking-[0.3em]">Employee Portal</p>
        </div>
      </div>
    </motion.div>
  );
}

// --- REGISTER COMPONENT ---
function Register({ 
  onSwitch, 
  setUser, 
  setCurrentView 
}: { 
  onSwitch: () => void; 
  setUser: (u: UserProfile) => void; 
  setCurrentView: (v: any) => void; 
}) {
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Admin key validation
      if (role === 'admin' && mobile !== '09327481042') {
        const keyDoc = await getDoc(doc(db, 'admin_keys', adminKey));
        if (!keyDoc.exists() || keyDoc.data().used) {
          throw new Error('Invalid or used admin key');
        }
        await updateDoc(doc(db, 'admin_keys', adminKey), { used: true });
      }

      const email = `${mobile}@ams.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Create user profile in Firestore
      const userData = {
        fullName,
        mobileNumber: mobile,
        role,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      
      // onAuthStateChanged will handle the rest
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="min-h-screen flex"
    >
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-sm space-y-6 py-8">
          <div className="text-center">
            <h2 className="text-3xl font-black text-[#4C1D95]">CREATE ACCOUNT</h2>
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
              <Camera className="text-gray-400" />
            </div>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest">Avatar</span>
          </div>

          <form className="space-y-3" onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Full Name"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C1D95]/20"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Mobile"
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C1D95]/20"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
              <select 
                className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C1D95]/20"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {role === 'admin' && mobile !== '09327481042' && (
              <input
                type="text"
                placeholder="Admin Key (4 digits)"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C1D95]/20"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                required
              />
            )}
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C1D95]/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirm"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C1D95]/20"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#4C1D95] text-white font-bold rounded-lg hover:bg-[#3B1575] transition-colors disabled:opacity-50"
            >
              {loading ? 'SIGNING UP...' : 'SIGN UP'}
            </button>
          </form>
          
          <div className="text-center">
            <button 
              onClick={onSwitch}
              className="text-gray-400 text-[10px] uppercase tracking-widest hover:text-[#4C1D95]"
            >
              Registered? <span className="font-bold text-[#4C1D95]">Log in</span>
            </button>
          </div>
        </div>
      </div>
      <div className="hidden lg:flex flex-1 bg-[#4C1D95] items-center justify-center p-12">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-black text-white tracking-tighter">AMS PORTAL</h1>
          <p className="text-white/60 text-sm uppercase tracking-[0.3em]">Modern Attendance</p>
        </div>
      </div>
    </motion.div>
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
  handleLogout
}: { 
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  handleLogout: () => void;
}) {
  const isAdmin = user.role === 'admin';

  const menuItems = isAdmin ? [
    { id: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'USERS', icon: Users },
    { id: 'ASSIGN ACCOUNT', icon: UserPlus },
    { id: 'ACCOUNT STATUS', icon: ClipboardList },
    { id: 'PROCESS ACCOUNTS', icon: CheckCircle2 },
    { id: 'ADMIN KEYS', icon: Key },
    { id: 'PROFILE', icon: UserSettings },
  ] : [
    { id: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'ACCOUNT STATUS', icon: ClipboardList },
    { id: 'FOR VALIDATION & SURVEY', icon: CheckCircle2 },
    { id: 'PROFILE', icon: UserSettings },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 0 }}
        className="bg-[#4C1D95] text-white flex-shrink-0 overflow-hidden relative z-20"
      >
        <div className="p-6 flex flex-col h-full w-[280px]">
          <div className="flex items-center space-x-4 mb-12">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/40">
              <User className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase truncate w-32">{user.fullName}</h3>
              <p className="text-[10px] text-white/60 uppercase tracking-widest">{user.role}</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                  activeTab === item.id ? "bg-white text-[#4C1D95]" : "hover:bg-white/10"
                )}
              >
                <item.icon size={18} />
                <span>{item.id}</span>
              </button>
            ))}
          </nav>

          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-white/10 rounded-lg mt-auto"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-[#4C1D95]">
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h2 className="text-xs font-black text-[#4C1D95] uppercase tracking-[0.2em]">{activeTab}</h2>
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
            
            <div className="flex items-center space-x-4">
              <button className="relative text-gray-400 hover:text-[#4C1D95]">
                <AlertCircle size={20} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <div className="text-[10px] text-gray-400 font-medium">
                {format(new Date(), 'M/d/yyyy')}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'DASHBOARD' && (isAdmin ? <DashboardOverview /> : <CIDashboard user={user} />)}
            {activeTab === 'USERS' && <UserManagement />}
            {activeTab === 'ASSIGN ACCOUNT' && <AssignAccount user={user} />}
            {activeTab === 'ACCOUNT STATUS' && <AccountStatus user={user} />}
            {activeTab === 'PROCESS ACCOUNTS' && <ProcessAccounts user={user} />}
            {activeTab === 'ADMIN KEYS' && <AdminKeys user={user} />}
            {activeTab === 'FOR VALIDATION & SURVEY' && <ValidationSurvey user={user} />}
            {activeTab === 'PROFILE' && <ProfileSettings user={user} setUser={setUser} />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function DashboardOverview() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    approved: 0,
    denied: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'assignments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const assignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Assignment[];
      
      setStats({
        total: assignments.length,
        pending: assignments.filter(a => !['Completed', 'Approved', 'Denied'].includes(a.status)).length,
        completed: assignments.filter(a => a.status === 'Completed').length,
        approved: assignments.filter(a => a.status === 'Approved').length,
        denied: assignments.filter(a => a.status === 'Denied').length
      });

      const statusData = [
        { name: 'Pending', value: assignments.filter(a => !['Completed', 'Approved', 'Denied'].includes(a.status)).length },
        { name: 'Completed', value: assignments.filter(a => a.status === 'Completed').length },
        { name: 'Approved', value: assignments.filter(a => a.status === 'Approved').length },
        { name: 'Denied', value: assignments.filter(a => a.status === 'Denied').length }
      ];
      setChartData(statusData);

      const activities = assignments.flatMap(a => 
        a.timeline.map(t => ({
          ...t,
          borrowerName: a.borrowerName,
          id: a.id
        }))
      ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

      setRecentActivity(activities);
    }, (err) => {
      console.error('Firestore error in DashboardOverview:', err);
    });

    return () => unsubscribe();
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

  const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-[#4C1D95] uppercase tracking-widest">Dashboard Overview</h2>
        <button 
          onClick={exportToCSV}
          className="px-4 py-2 bg-[#4C1D95] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-2 hover:bg-[#5B21B6] transition-all"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard label="Total Assignments" value={stats.total} icon={<ClipboardList className="text-blue-500" />} />
        <StatCard label="In Progress" value={stats.pending} icon={<Clock className="text-amber-500" />} />
        <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2 className="text-green-500" />} />
        <StatCard label="Approved" value={stats.approved} icon={<Check className="text-emerald-500" />} />
        <StatCard label="Denied" value={stats.denied} icon={<X className="text-red-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xs font-black text-[#4C1D95] uppercase tracking-[0.2em] mb-6">Status Distribution</h3>
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
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className="text-[8px] font-bold uppercase text-gray-400">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xs font-black text-[#4C1D95] uppercase tracking-[0.2em] mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      activity.step === 'Approved' ? "bg-green-500" :
                      activity.step === 'Denied' ? "bg-red-500" :
                      activity.step === 'Completed' ? "bg-blue-500" : "bg-gray-300"
                    )} />
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        <span className="text-[#4C1D95]">{activity.borrowerName}</span>
                        <span className="text-gray-400 font-normal ml-2">status changed to</span>
                        <span className="ml-2 uppercase tracking-widest text-[10px] px-2 py-0.5 bg-gray-100 rounded">{activity.step}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">
                    {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 italic">No recent activity found.</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(data);
      setLoading(false);
    }, (err) => {
      console.error('Firestore error in UserManagement:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/api/users/${id}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-[#4C1D95] uppercase tracking-widest">User Management</h2>
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
                    <div className="w-8 h-8 rounded-full bg-[#4C1D95]/10 flex items-center justify-center text-[#4C1D95] font-black text-xs">
                      {u.fullName.charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-gray-900">{u.fullName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{u.mobileNumber}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "text-[8px] font-black uppercase px-2 py-1 rounded tracking-widest",
                    u.role === 'admin' ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
                  )}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-[10px] font-mono text-gray-400">
                  {format(new Date(u.createdAt), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleDelete(u.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CIDashboard({ user }: { user: UserProfile }) {
  const [stats, setStats] = useState({
    total: 0,
    assigned: 0,
    completed: 0,
    approved: 0
  });
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'assignments'), where('ciOfficerId', '==', user.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const assignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Assignment[];
      
      setStats({
        total: assignments.length,
        assigned: assignments.filter(a => a.status === 'Assigned').length,
        completed: assignments.filter(a => a.status === 'Completed').length,
        approved: assignments.filter(a => a.status === 'Approved').length
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
    }, (err) => {
      console.error('Firestore error in CIDashboard:', err);
    });

    return () => unsubscribe();
  }, [user.id]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-[#4C1D95] uppercase tracking-widest">CI Officer Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Tasks" value={stats.total} icon={<ClipboardList className="text-blue-500" />} />
        <StatCard label="New Assigned" value={stats.assigned} icon={<Clock className="text-amber-500" />} />
        <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2 className="text-green-500" />} />
        <StatCard label="Final Approved" value={stats.approved} icon={<Check className="text-emerald-500" />} />
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xs font-black text-[#4C1D95] uppercase tracking-[0.2em] mb-6">Task Assignment Trend (Last 7 Days)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF' }}
              />
              <Tooltip 
                cursor={{ fill: '#F9FAFB' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
              />
              <Bar dataKey="tasks" fill="#4C1D95" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}

function ProfileSettings({ user, setUser }: { user: UserProfile, setUser: (u: UserProfile) => void }) {
  const [formData, setFormData] = useState({
    fullName: user.fullName,
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
        password: formData.password || undefined
      });
      setUser({ ...user, fullName: formData.fullName });
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
        <h2 className="text-xl font-black text-[#4C1D95] uppercase tracking-widest mb-8">Profile Settings</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
            className="w-full py-4 bg-[#4C1D95] text-white font-black rounded-2xl shadow-lg hover:shadow-xl transition-all uppercase tracking-[0.2em] disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Save Changes'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function AssignAccount({ user }: { user: UserProfile }) {
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
    ciOfficerId: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const officers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserProfile[];
      setCiOfficers(officers);
    }, (err) => {
      console.error('Firestore error in AssignAccount:', err);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const officer = ciOfficers.find(o => o.id === formData.ciOfficerId);
      await api.post('/api/assignments', {
        ...formData,
        requestedAmount: Number(formData.requestedAmount),
        intRate: Number(formData.intRate),
        ciOfficerName: officer?.fullName || 'Unknown'
      });
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
        ciOfficerId: ''
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
            className="w-full py-3 bg-[#4C1D95] text-white font-bold rounded-lg hover:bg-[#3B1575] transition-colors uppercase tracking-widest text-xs"
          >
            {loading ? 'Assigning...' : 'Save Assignment'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function AccountStatus({ user }: { user: UserProfile }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'assignments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Assignment[];
      setAssignments(data);
      setLoading(false);
    }, (err) => {
      console.error('Firestore error in AccountStatus:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const steps = [
    'Assigned',
    'Start to Perform Assignment',
    'Reviewing',
    'Field CIBI',
    'Cashflowing',
    'Report Submitted',
    'Completed'
  ];

  const handleNextStep = async (assignment: Assignment) => {
    const currentIndex = steps.indexOf(assignment.status);
    if (currentIndex === -1 || currentIndex >= steps.length - 1) return;

    const nextStatus = steps[currentIndex + 1] as AssignmentStatus;
    const newTimeline = [...assignment.timeline, { step: nextStatus, timestamp: new Date().toISOString() }];
    
    try {
      await api.patch(`/api/assignments/${assignment.id}`, {
        status: nextStatus,
        timeline: newTimeline
      });
    } catch (err) {
      console.error(err);
    }
  };

  const calculateTAT = (timeline: TimelineStep[]) => {
    if (timeline.length < 2) return '0h 0m (ONGOING)';
    const start = new Date(timeline[0].timestamp);
    const end = new Date(timeline[timeline.length - 1].timestamp);
    const diff = differenceInMinutes(end, start);
    
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    
    const isCompleted = timeline.some(t => t.step === 'Completed');
    return `${hours}h ${minutes}m${isCompleted ? '' : ' (ONGOING)'}`;
  };

  const filtered = assignments.filter(a => 
    a.borrowerName.toLowerCase().includes(search.toLowerCase()) ||
    a.mobileNumber.includes(search)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-160px)]">
      {/* List */}
      <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xs font-black text-[#4C1D95] uppercase tracking-[0.2em] mb-4">Assigned Clients</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search borrower..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4C1D95]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelected(a)}
              className={cn(
                "w-full p-6 text-left border-b border-gray-50 hover:bg-gray-50 transition-colors",
                selected?.id === a.id && "bg-gray-50 border-l-4 border-l-[#4C1D95]"
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-sm uppercase">{a.borrowerName}</h4>
                <span className={cn(
                  "text-[8px] font-black uppercase px-2 py-1 rounded-full",
                  a.status === 'Completed' ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                )}>
                  {a.status}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">{a.accountType} • {a.ciOfficerName}</p>
            </button>
          ))}
          {filtered.length === 0 && !loading && (
            <div className="p-12 text-center text-gray-300">
              <AlertCircle className="mx-auto mb-2" size={32} />
              <p className="text-[10px] font-bold uppercase tracking-widest">No assignments found</p>
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 overflow-y-auto">
        {selected ? (
          <div className="space-y-12">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-[#4C1D95]">{selected.borrowerName}</h2>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">CI OFFICER: {selected.ciOfficerName}</p>
              </div>
              {user.role === 'user' && selected.status !== 'Completed' && selected.status !== 'Approved' && selected.status !== 'Denied' && (
                <button 
                  onClick={() => handleNextStep(selected)}
                  className="px-6 py-2 bg-[#4C1D95] text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[#3B1575] transition-colors"
                >
                  Mark Next Step as Done
                </button>
              )}
            </div>

            {/* Visual Stepper */}
            <div className="relative pt-12 pb-8">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2" />
              <div 
                className="absolute top-1/2 left-0 h-1 bg-green-500 -translate-y-1/2 transition-all duration-500" 
                style={{ width: `${(steps.indexOf(selected.status) / (steps.length - 1)) * 100}%` }}
              />
              <div className="relative flex justify-between">
                {steps.map((step, idx) => {
                  const isCompleted = steps.indexOf(selected.status) >= idx;
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
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Timeline</h4>
              <div className="space-y-4">
                {steps.map((step) => {
                  const entry = selected.timeline.find(t => t.step === step);
                  return (
                    <div key={step} className="flex justify-between items-center text-xs">
                      <span className={cn(
                        "font-bold uppercase tracking-widest",
                        entry ? "text-gray-900" : "text-gray-300"
                      )}>
                        {step}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        {entry ? format(new Date(entry.timestamp), 'M/d/yyyy, h:mm:ss a') : 'PENDING'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                <span className="text-[10px] font-black text-[#4C1D95] uppercase tracking-widest">Total Turn Around Time:</span>
                <span className="text-sm font-black text-gray-900">{calculateTAT(selected.timeline)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4">
            <ClipboardList size={64} strokeWidth={1} />
            <p className="text-xs font-bold uppercase tracking-widest">Select a client to view status</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProcessAccounts({ user }: { user: UserProfile }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [processData, setProcessData] = useState({
    amount: '',
    term: '',
    intRate: '',
    mop: 'Weekly',
    top: 'Collection',
    comments: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'assignments'), where('status', '==', 'Completed'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Assignment[];
      setAssignments(data);
      setLoading(false);
    }, (err) => {
      console.error('Firestore error in ProcessAccounts:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
      setSelected(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-6">
        {assignments.map(a => (
          <motion.div 
            key={a.id} 
            layoutId={a.id}
            onClick={() => setSelected(a)}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-black text-sm uppercase text-[#4C1D95]">{a.borrowerName}</h4>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">{a.accountType}</p>
              </div>
              <span className="px-2 py-1 bg-green-50 text-green-600 text-[8px] font-bold uppercase rounded">Completed</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-[10px]">
              <div>
                <p className="text-gray-400 uppercase tracking-widest">Requested</p>
                <p className="font-bold">₱{a.requestedAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400 uppercase tracking-widest">Term</p>
                <p className="font-bold">{a.term}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-[#4C1D95] uppercase">{selected.borrowerName}</h3>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Process Account Approval</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-red-500"><X /></button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Approved Amount</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
                    value={processData.amount}
                    onChange={e => setProcessData({...processData, amount: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Term</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
                    value={processData.term}
                    onChange={e => setProcessData({...processData, term: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Int. Rate (%)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
                    value={processData.intRate}
                    onChange={e => setProcessData({...processData, intRate: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">MOP</label>
                  <select 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
                    value={processData.mop}
                    onChange={e => setProcessData({...processData, mop: e.target.value as any})}
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Semi-Monthly">Semi-Monthly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TOP</label>
                  <select 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
                    value={processData.top}
                    onChange={e => setProcessData({...processData, top: e.target.value as any})}
                  >
                    <option value="Collection">Collection</option>
                    <option value="PDC">PDC</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Crecom Comments</label>
                <textarea 
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm h-24"
                  value={processData.comments}
                  onChange={e => setProcessData({...processData, comments: e.target.value})}
                ></textarea>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleApprove}
                  className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors uppercase tracking-widest text-xs"
                >
                  Approve Account
                </button>
                <button 
                  onClick={handleDeny}
                  className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors uppercase tracking-widest text-xs"
                >
                  Deny Account
                </button>
              </div>
            </motion.div>
          </motion.div>
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
      console.error('Firestore error in AdminKeys:', err);
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
        className="w-full py-4 bg-[#4C1D95] text-white font-black rounded-2xl shadow-lg hover:shadow-xl transition-all uppercase tracking-[0.2em]"
      >
        {loading ? 'Generating...' : 'Generate Admin Key'}
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Keys</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {keys.map(k => (
            <div key={k.id} className="p-4 flex justify-between items-center">
              <span className="font-mono text-lg font-bold text-[#4C1D95] tracking-widest">{k.key}</span>
              <span className={cn(
                "text-[8px] font-bold uppercase px-2 py-1 rounded",
                k.used ? "bg-red-50 text-red-500" : "bg-green-50 text-green-500"
              )}>
                {k.used ? 'Used' : 'Available'}
              </span>
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
  const [survey, setSurvey] = useState({
    didAnswerCalls: false,
    didReceiveProceeds: false,
    didExplainPN: false,
    didExplainDeductions: false
  });

  useEffect(() => {
    const q = query(collection(db, 'assignments'), where('status', '==', 'Approved'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Assignment[];
      setAssignments(data);
    }, (err) => {
      console.error('Firestore error in ValidationSurvey:', err);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async () => {
    if (!selected) return;
    try {
      await api.patch(`/api/assignments/${selected.id}`, {
        validationResults: {
          didAnswerCalls: survey.didAnswerCalls,
          didReceiveProceeds: survey.didReceiveProceeds,
          didExplainPN: survey.didExplainPN,
          didExplainDeductions: survey.didExplainDeductions
        },
        status: 'Completed'
      });
      setSelected(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-6">
        {assignments.map(a => (
          <div 
            key={a.id} 
            onClick={() => setSelected(a)}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer relative"
          >
            <div className="absolute top-4 right-4 text-red-500 animate-pulse">
              <AlertCircle size={16} />
            </div>
            <h4 className="font-black text-sm uppercase text-[#4C1D95]">{a.borrowerName}</h4>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-4">Pending Validation</p>
            <div className="text-[10px] space-y-1">
              <p className="text-gray-400 uppercase tracking-widest">Approved Amount</p>
              <p className="font-bold">₱{a.approvedAmount?.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white w-full max-w-xl rounded-3xl p-8 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-[#4C1D95] uppercase">{selected.borrowerName}</h3>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Validation & Survey</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-red-500"><X /></button>
              </div>

              <div className="space-y-4">
                <div className="space-y-3 pt-4">
                  {[
                    { id: 'didAnswerCalls', label: 'Did client answer calls?' },
                    { id: 'didReceiveProceeds', label: 'Did you receive your loan proceeds?' },
                    { id: 'didExplainPN', label: 'Did our officer explain the PN?' },
                    { id: 'didExplainDeductions', label: 'Releasing officer explained deductions?' }
                  ].map(q => (
                    <label key={q.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-tight">{q.label}</span>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-[#4C1D95]"
                        checked={(survey as any)[q.id]}
                        onChange={e => setSurvey({...survey, [q.id]: e.target.checked})}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleSubmit}
                className="w-full py-4 bg-[#4C1D95] text-white font-black rounded-2xl shadow-lg hover:shadow-xl transition-all uppercase tracking-[0.2em] text-xs"
              >
                Submit Validation Results
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
