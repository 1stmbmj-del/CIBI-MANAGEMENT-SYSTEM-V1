import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, UserRole, Assignment, AssignmentStatus, TimelineStep, AuthResponse, Liability, CashflowMonth, CashflowReport, MOP, TOP } from './types';
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
  Cell
} from 'recharts';
import { 
  TrendingUp,
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
  Database,
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
  Pencil,
  Download,
  Settings as UserSettings,
  FileText,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInMinutes } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
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
  Timestamp,
  getDocFromServer,
  addDoc
} from 'firebase/firestore';

import { AppNotification } from './types';

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

const createNotification = async (userId: string, title: string, message: string, type: string, assignmentId?: string) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      type,
      assignmentId: assignmentId || null,
      read: false,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};

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
        const updateData: any = {};
        if (data.fullName) updateData.fullName = data.fullName;
        if (data.mobileNumber) updateData.mobileNumber = data.mobileNumber;
        if (data.photoURL !== undefined) updateData.photoURL = data.photoURL;
        
        if (Object.keys(updateData).length > 0) {
          await updateDoc(doc(db, 'users', user.uid), updateData);
        }
        
        if (data.password) {
          await updatePassword(user, data.password);
        }
        return { success: true };
      }
      if (parts[1] === 'api' && parts[2] === 'users') {
        const id = parts[3];
        await updateDoc(doc(db, 'users', id), data);
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
          const superAdmins = ['1stmb.mj@gmail.com'];
          const isSuperAdmin = superAdmins.includes(firebaseUser.email || '');

          if (userDoc.exists()) {
            const data = userDoc.data();
            const role = isSuperAdmin ? 'admin' : data.role;
            setUser({ id: firebaseUser.uid, ...data, role } as UserProfile);
            setCurrentView('dashboard');
          } else {
            // Handle first-time Google sign-in by creating a profile
            const userData = {
              fullName: firebaseUser.displayName || 'Unnamed User',
              mobileNumber: '',
              email: firebaseUser.email || '',
              role: isSuperAdmin ? 'admin' : 'user',
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), userData);
            setUser({ id: firebaseUser.uid, ...userData } as UserProfile);
            setCurrentView('dashboard');
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
    } catch (err: any) {
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
                type="email"
                placeholder="Email Address"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C1D95]/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="bg-white px-4 text-gray-400">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 bg-white border border-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
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
            GOOGLE
          </button>
          
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
  const [email, setEmail] = useState('');
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
    const superAdmins = ['1stmb.mj@gmail.com'];
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Admin key validation
      if (role === 'admin' && !superAdmins.includes(email)) {
        const keyDoc = await getDoc(doc(db, 'admin_keys', adminKey));
        if (!keyDoc.exists() || keyDoc.data().used) {
          throw new Error('Invalid or used admin key');
        }
        await updateDoc(doc(db, 'admin_keys', adminKey), { used: true });
      }

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
            <input
              type="email"
              placeholder="Email Address"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C1D95]/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {role === 'admin' && !['1stmb.mj@gmail.com'].includes(email) && (
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="bg-white px-4 text-gray-400">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 bg-white border border-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
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
            GOOGLE
          </button>
          
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
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AppNotification[];
      setNotifications(data);
    }, (err) => {
      console.error('Firestore notification listener error:', err);
    });
    return () => unsubscribe();
  }, [user.id]);

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

  const menuItems = isAdmin ? [
    { id: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'USERS', icon: Users },
    { id: 'ASSIGN ACCOUNT', icon: UserPlus },
    { id: 'ACCOUNT STATUS', icon: ClipboardList },
    { id: 'CRECOM APPROVAL', icon: CheckCircle2 },
    { id: 'REPORTS', icon: FileText },
    { id: 'DATA STORAGE', icon: Database },
    { id: 'ADMIN KEYS', icon: Key },
    { id: 'PROFILE', icon: UserSettings },
  ] : [
    { id: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'ACCOUNT STATUS', icon: ClipboardList },
    { id: 'FOR VALIDATION & SURVEY', icon: CheckCircle2 },
    { id: 'REPORTS', icon: FileText },
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
              {user.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="text-white" />
              )}
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
            
            <div className="flex items-center space-x-4 relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative text-gray-400 hover:text-[#4C1D95] transition-colors"
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
                      className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-40 overflow-hidden"
                    >
                      <div className="p-4 bg-[#4C1D95] text-white flex justify-between items-center">
                        <h3 className="text-[10px] font-black uppercase tracking-widest">Notifications</h3>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-[8px] font-bold uppercase tracking-widest hover:underline"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-gray-400">
                            <Bell size={24} className="mx-auto mb-2 opacity-20" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div 
                              key={n.id} 
                              onClick={() => markAsRead(n.id)}
                              className={cn(
                                "p-4 cursor-pointer hover:bg-gray-50 transition-colors",
                                !n.read && "bg-blue-50/30"
                              )}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-black text-[#4C1D95] uppercase tracking-tight">{n.title}</span>
                                <span className="text-[8px] font-mono text-gray-400">{format(new Date(n.createdAt), 'h:mm a')}</span>
                              </div>
                              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{n.message}</p>
                              {!n.read && <div className="mt-2 w-1.5 h-1.5 bg-blue-500 rounded-full" />}
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
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'DASHBOARD' && (isAdmin ? <DashboardOverview user={user} /> : <CIDashboard user={user} />)}
            {activeTab === 'USERS' && <UserManagement user={user} />}
            {activeTab === 'ASSIGN ACCOUNT' && <AssignAccount user={user} />}
            {activeTab === 'ACCOUNT STATUS' && <AccountStatus user={user} />}
            {activeTab === 'CRECOM APPROVAL' && <CrecomApproval user={user} />}
            {activeTab === 'REPORTS' && <ReportsView user={user} />}
            {activeTab === 'DATA STORAGE' && <DataStorage user={user} />}
            {activeTab === 'ADMIN KEYS' && <AdminKeys user={user} />}
            {activeTab === 'FOR VALIDATION & SURVEY' && <ValidationSurvey user={user} />}
            {activeTab === 'PROFILE' && <ProfileSettings user={user} setUser={setUser} />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// --- SHARED UTILS ---
// Constants & Utilities
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
    monthlyAssigned: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'assignments'), orderBy('createdAt', 'desc'));
    const unsubscribeReadings = onSnapshot(q, async (snapshot) => {
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
        pending: assignments.filter(a => !['Completed', 'Approved', 'Denied'].includes(a.status)).length,
        completed: assignments.filter(a => a.status === 'Completed').length,
        approved: assignments.filter(a => a.status === 'Approved').length,
        denied: assignments.filter(a => a.status === 'Denied').length,
        monthlyAssigned: monthly.length
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

      // Leaderboard logic
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const leaderData = usersList
        .filter((u: any) => u.role === 'user')
        .map((u: any) => ({
          ...u,
          assignedCount: assignments.filter(a => a.ciOfficerId === u.id).length
        }))
        .sort((a: any, b: any) => b.assignedCount - a.assignedCount)
        .slice(0, 5);
      
      setLeaderboard(leaderData);
    }, (err) => {
      console.error('Firestore error in DashboardOverview:', err);
    });

    return () => unsubscribeReadings();
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#4C1D95]/10 flex items-center justify-center overflow-hidden border-2 border-[#4C1D95]/20">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Admin" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="text-[#4C1D95]" size={24} />
            )}
          </div>
          <div>
            <h2 className="text-xl font-black text-[#4C1D95] uppercase tracking-widest">Dashboard Overview</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">System Administrator Panel</p>
          </div>
        </div>
        <button 
          onClick={exportToCSV}
          className="px-4 py-2 bg-[#4C1D95] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-2 hover:bg-[#5B21B6] transition-all"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <StatCard label="Total Volume" value={stats.total} icon={<ClipboardList className="text-blue-500" />} />
        <StatCard label="Monthly Assigned" value={stats.monthlyAssigned} icon={<Calendar className="text-indigo-500" />} />
        <StatCard label="In Progress" value={stats.pending} icon={<Clock className="text-amber-500" />} />
        <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2 className="text-green-500" />} />
        <StatCard label="Approved" value={stats.approved} icon={<Check className="text-emerald-500" />} />
        <StatCard label="Denied" value={stats.denied} icon={<X className="text-red-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1">
          <h3 className="text-xs font-black text-[#4C1D95] uppercase tracking-[0.2em] mb-6">CI Officer Leaderboard</h3>
          <div className="space-y-6">
            {leaderboard.length > 0 ? leaderboard.map((u, i) => (
              <div key={u.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt={u.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="text-gray-300" size={20} />
                      )}
                    </div>
                    <div className={cn(
                      "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white",
                      i === 0 ? "bg-yellow-400 text-white" : 
                      i === 1 ? "bg-gray-300 text-white" : 
                      i === 2 ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-500"
                    )}>
                      {i + 1}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">{u.fullName}</p>
                    <p className="text-[8px] text-gray-400 uppercase font-black">{u.assignedCount} Accounts</p>
                  </div>
                </div>
                <div className="text-right">
                   <TrendingUp className="text-green-500 ml-auto" size={14} />
                </div>
              </div>
            )) : (
              <p className="text-xs text-gray-400 italic">No ranking data available</p>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1">
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

function UserManagement({ user }: { user: UserProfile }) {
  const [users, setUsers] = useState<any[]>([]);
  const [adminKeys, setAdminKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [actionConfirm, setActionConfirm] = useState<{ type: 'delete' | 'edit' | 'deleteKey', id: string, name?: string } | null>(null);

  useEffect(() => {
    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qKeys = query(collection(db, 'admin_keys'));
    const unsubKeys = onSnapshot(qKeys, (snapshot) => {
      setAdminKeys(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.error('Firestore error in UserManagement (Keys):', err);
    });

    setLoading(false);
    return () => {
      unsubUsers();
      unsubKeys();
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
        <h2 className="text-xl font-black text-[#4C1D95] uppercase tracking-widest">User Management</h2>
        {user.email === '1stmb.mj@gmail.com' && (
          <button 
            onClick={generateAdminKey}
            className="px-4 py-2 bg-[#4C1D95] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-2 hover:bg-[#5B21B6] transition-all"
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
                  {u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : '---'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleEdit(u)}
                      className="p-2 text-gray-400 hover:text-[#4C1D95] transition-colors"
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
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setEditingUser(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-[#4C1D95] p-6 text-white text-center">
                <h3 className="text-lg font-black uppercase tracking-widest">Edit User Profile</h3>
                <p className="text-[10px] text-white/60 uppercase tracking-widest mt-1">Update Member Information</p>
              </div>
              <form onSubmit={updateUserInfo} className="p-8 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Full Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold"
                    value={editingUser.fullName}
                    onChange={e => setEditingUser({...editingUser, fullName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Mobile Number</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold"
                    value={editingUser.mobileNumber}
                    onChange={e => setEditingUser({...editingUser, mobileNumber: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">User Role</label>
                  <select 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold"
                    value={editingUser.role}
                    onChange={e => setEditingUser({...editingUser, role: e.target.value})}
                  >
                    <option value="user">User / CI Officer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 py-3 border border-gray-100 text-gray-400 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-[#4C1D95] text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
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
                Are you sure you want to remove this key? <span className="font-mono font-bold text-[#4C1D95]">{actionConfirm.id}</span>
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
          <h3 className="text-sm font-black text-[#4C1D95] uppercase tracking-widest px-1">Active Admin Keys</h3>
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
                      <td className="px-6 py-4 font-mono text-sm font-bold tracking-widest text-[#4C1D95]">
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#4C1D95]/10 flex items-center justify-center overflow-hidden border-2 border-[#4C1D95]/20">
            {user.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="text-[#4C1D95]" size={24} />
            )}
          </div>
          <div>
            <h2 className="text-xl font-black text-[#4C1D95] uppercase tracking-widest">CI Officer Dashboard</h2>
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
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size must be less than 2MB');
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
        <h2 className="text-xl font-black text-[#4C1D95] uppercase tracking-widest mb-8">Profile Settings</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center space-y-4 mb-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden border-4 border-[#4C1D95]/10 flex items-center justify-center">
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
            className="w-full py-3 bg-[#4C1D95] text-white font-bold rounded-lg hover:bg-[#3B1575] transition-colors uppercase tracking-widest text-xs"
          >
            {loading ? 'Assigning...' : 'Save Assignment'}
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
            <h3 className="text-xl font-black text-[#4C1D95] uppercase tracking-tight">Edit Assignment</h3>
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
              className="w-full py-4 bg-[#4C1D95] text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-[#3B1575] transition-all disabled:opacity-50"
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
  const [isEditing, setIsEditing] = useState(false);
  const [ciOfficers, setCiOfficers] = useState<UserProfile[]>([]);

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
    
    if (user.role !== 'admin') {
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
  }, []);

  const handleNextStep = async (assignment: Assignment) => {
    if (assignment.status === 'Field CIBI' && !assignment.creditScore) {
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
      if (user.role === 'admin') {
        await createNotification(
          assignment.ciOfficerId,
          'Status Update',
          `Admin updated ${assignment.borrowerName} to ${nextStatus}`,
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
      
      // Refresh page as requested
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = assignments.filter(a => 
    a.borrowerName.toLowerCase().includes(search.toLowerCase()) ||
    a.mobileNumber.includes(search)
  );

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
            <div
              key={a.id}
              onClick={() => setSelected(a)}
              className={cn(
                "w-full p-6 text-left border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer",
                selected?.id === a.id && "bg-gray-50 border-l-4 border-l-[#4C1D95]"
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-sm uppercase">{a.borrowerName}</h4>
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

      {/* Details */}
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 overflow-y-auto">
        {selected ? (
          <div className="space-y-12">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-[#4C1D95]">{selected.borrowerName}</h2>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">CI OFFICER: {selected.ciOfficerName}</p>
              </div>
              {user.role === 'user' && selected.status !== 'Completed' && selected.status !== 'Approved' && selected.status !== 'Denied' && selected.status !== 'Report Submitted' && selected.status !== 'Pre-approved' && (
                <button 
                  onClick={() => handleNextStep(selected)}
                  className="px-6 py-2 bg-[#4C1D95] text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[#3B1575] transition-colors"
                >
                  Mark Next Step as Done
                </button>
              )}
              {user.role === 'admin' && selected.status === 'Report Submitted' && (
                <button 
                  onClick={() => handleNextStep(selected)}
                  className="px-6 py-2 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
                >
                  Confirm & Pre-approve
                </button>
              )}
              {user.role === 'admin' && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-gray-400 hover:text-[#4C1D95] transition-colors"
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
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Full History Log</h4>
              <div className="space-y-3">
                {[...selected.timeline].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map((entry, idx) => (
                  <div key={idx} className="flex flex-col space-y-1 p-3 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-black uppercase tracking-widest text-[#4C1D95]">
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
                <span className="text-[10px] font-black text-[#4C1D95] uppercase tracking-widest">Total Turn Around Time:</span>
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

      <AnimatePresence>
        {isEditing && selected && (
          <EditAssignmentModal 
            assignment={selected} 
            ciOfficers={ciOfficers} 
            onClose={() => setIsEditing(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CreditScoringModule({ assignment, user, isReadOnly: forceReadOnly }: { assignment: Assignment, user: UserProfile, isReadOnly?: boolean }) {
  const SCORING_SHEET = {
    CHARACTER: {
      max: 20.5,
      items: [
        { id: 'neighbor1', label: 'Neighbor 1', options: [{ l: 'Good', p: 3 }, { l: 'Poor', p: 0 }] },
        { id: 'neighbor2', label: 'Neighbor 2', options: [{ l: 'Good', p: 3 }, { l: 'Poor', p: 0 }] },
        { id: 'barangayVerification', label: 'Barangay Verification', options: [{ l: 'No Bad Records', p: 3 }, { l: 'With Bad Records', p: 0 }] },
        { id: 'loanHistory', label: 'Loan History (Other Inst.)', options: [{ l: 'Yes', p: 1 }, { l: 'No', p: 0 }] },
        { id: 'goodCreditBackground', label: 'Good Credit Background', options: [{ l: 'Yes', p: 1 }, { l: 'No', p: 0.5 }, { l: 'None', p: 0 }] },
        { id: 'cooperationOfApplicant', label: 'Cooperation of Applicant', options: [{ l: 'Very Cooperative', p: 3.5 }, { l: 'Cooperative', p: 2 }, { l: 'Poor', p: 0 }] },
      ]
    },
    CAPITAL: {
      max: 10.0,
      items: [
        { id: 'totalAssetLiabilities', label: 'Total Asset > Liabilities', options: [{ l: 'Yes', p: 10 }, { l: 'No', p: 0 }] },
      ]
    },
    STABILITY: {
      max: 18.0,
      items: [
        { id: 'houseOwnership', label: 'House Ownership', options: [{ l: 'Owned', p: 5 }, { l: 'Mortgage', p: 3 }, { l: 'Rented', p: 2 }, { l: 'Residing w/ Relatives', p: 1 }] },
        { id: 'childrenSchooling', label: 'With Children are schooling?', options: [{ l: 'Yes', p: 3 }, { l: 'No', p: 1.5 }] },
        { id: 'residingDuration', label: 'How long residing in address?', options: [{ l: 'More Than 5yrs.', p: 5 }, { l: '4yrs - 3yrs.', p: 3 }, { l: 'Less than 1yr.', p: 1 }] },
        { id: 'houseMaterials', label: 'House are made of?', options: [{ l: 'Concrete', p: 5 }, { l: 'Semi-Concrete', p: 3 }, { l: 'Light Materials', p: 1 }] },
      ]
    },
    BUSINESS_STATUS: {
      max: 24.0,
      items: [
        { id: 'businessLocation', label: 'Business location', options: [{ l: 'Commercial', p: 5 }, { l: 'Residential', p: 3 }, { l: 'Public Market', p: 3 }] },
        { id: 'floodProne', label: 'Flood prone area?', options: [{ l: 'No', p: 1 }, { l: 'Yes', p: 0 }] },
        { id: 'footTraffic', label: 'Volume of foot traffic', options: [{ l: 'Good', p: 3 }, { l: 'Poor', p: 1 }] },
        { id: 'businessSpace', label: 'Business space', options: [{ l: 'Owned', p: 3 }, { l: 'Rent Free', p: 2 }, { l: 'Rented', p: 1 }] },
        { id: 'permitType', label: 'Type of Permit', options: [{ l: "Mayor's Permit", p: 3 }, { l: 'Barangay / DTI', p: 2 }] },
        { id: 'businessDuration', label: 'How long business running?', options: [{ l: 'More than 10 yrs.', p: 5 }, { l: '5 yrs. - 10 yrs.', p: 4 }, { l: '1 yr. - 5 yrs.', p: 3 }] },
        { id: 'inventoryVsSales', label: 'Business Inventory Vs. Sales', options: [{ l: 'Good', p: 2 }, { l: 'Minimal', p: 1 }, { l: 'Poor', p: 0 }] },
      ]
    },
    FINANCIAL_MATURITY: {
      max: 13.5,
      items: [
        { id: 'loanVsCashflow', label: 'Requested Amount > Cashflow', options: [{ l: 'No', p: 3 }, { l: 'Yes', p: 1 }] },
        { id: 'otherIncome', label: 'Other source of Income?', options: [{ l: 'Yes', p: 3 }, { l: 'No', p: 0 }] },
        { id: 'businessKnowledge', label: 'Business knowledge?', options: [{ l: 'Yes', p: 3 }, { l: 'No', p: 1 }] },
        { id: 'watchBusiness', label: 'Often watch business?', options: [{ l: 'Full Time', p: 4 }, { l: 'Limited', p: 2 }] },
        { id: 'bankAccount', label: 'Bank Account Type', options: [{ l: 'CA & SA', p: 3 }, { l: 'CA or SA', p: 1.5 }, { l: 'None', p: 0 }] },
        { id: 'cicCmapFindings', label: 'CIC & CMAP Findings', options: [{ l: 'None', p: 3 }, { l: 'Current Status', p: 1.5 }, { l: 'With Past Due', p: 0 }] },
      ]
    },
    PERSONAL_STATUS: {
      max: 14.0,
      items: [
        { id: 'medicalCondition', label: 'Medical Condition (Family)', options: [{ l: 'No', p: 2 }, { l: 'Yes', p: 0 }] },
        { id: 'civilStatus', label: 'Civil Status', options: [{ l: 'Married', p: 3 }, { l: 'Live-in', p: 2 }, { l: 'Single', p: 1 }] },
        { id: 'ageGroup', label: 'Age Group', options: [{ l: '20-65', p: 2 }, { l: '<20 or >65', p: 1 }] },
        { id: 'educationalAttainment', label: 'Educational Attainment', options: [{ l: 'College Graduate', p: 3 }, { l: 'College Undergrad', p: 2.3 }, { l: 'HS Graduate', p: 2 }, { l: 'HS Undergrad', p: 1.5 }, { l: 'Elem. Graduate', p: 1 }, { l: 'Elem. Undergrad', p: 0.5 }] },
        { id: 'loanType', label: 'Type of Loan Application', options: [{ l: 'Renewal', p: 5 }, { l: 'New', p: 3 }, { l: 'New - APL', p: 2 }] },
      ]
    }
  };

  const getInitialState = () => ({
    neighbor1: 'Good', neighbor2: 'Good', barangayVerification: 'No Bad Records', loanHistory: 'No', goodCreditBackground: 'None', cooperationOfApplicant: 'Cooperative',
    totalAssetLiabilities: 'Yes',
    houseOwnership: 'Rented', childrenSchooling: 'No', residingDuration: 'More Than 5yrs.', houseMaterials: 'Concrete',
    businessLocation: 'Residential', floodProne: 'No', footTraffic: 'Good', businessSpace: 'Rented', permitType: 'Barangay / DTI', businessDuration: '1 yr. - 5 yrs.', inventoryVsSales: 'Good',
    loanVsCashflow: 'No', otherIncome: 'No', businessKnowledge: 'Yes', watchBusiness: 'Full Time', bankAccount: 'None', cicCmapFindings: 'None',
    medicalCondition: 'No', civilStatus: 'Single', ageGroup: '20-65', educationalAttainment: 'HS Graduate', loanType: 'New',
    ciRemarks: '', recommendation: 'Approved'
  });

  const [formData, setFormData] = useState<any>(getInitialState());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (assignment.creditScore) {
      setFormData(assignment.creditScore);
    } else {
      setFormData(getInitialState());
    }
  }, [assignment.id, assignment.creditScore]);

  const calculateGrades = () => {
    const grades: any = {};
    Object.entries(SCORING_SHEET).forEach(([section, data]) => {
      let sum = 0;
      data.items.forEach(item => {
        const selected = item.options.find(o => o.l === formData[item.id]);
        sum += selected ? selected.p : 0;
      });
      grades[section.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase())] = sum;
    });
    return grades;
  };

  const sectionGrades = calculateGrades();
  const totalGrade = Object.values(sectionGrades).reduce((a: any, b: any) => a + b, 0) as number;
  const riskScore = 100 - totalGrade;

  const isReadOnly = forceReadOnly || assignment.status !== 'Field CIBI' || (user.role !== 'user' && !assignment.creditScore);

  // Auto-recommendation logic
  useEffect(() => {
    if (!isReadOnly) {
      const rec = totalGrade <= 30 ? 'Approved' : 'Denied';
      if (formData.recommendation !== rec) {
        setFormData(prev => ({ ...prev, recommendation: rec }));
      }
    }
  }, [totalGrade, isReadOnly]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const scoringData = {
        ...formData,
        sectionGrades,
        totalGrade,
        riskScore
      };
      await api.patch(`/api/assignments/${assignment.id}`, {
        creditScore: scoringData
      });
      alert('Detailed credit scoring saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save credit scoring.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border-2 border-[#4C1D95]/10 rounded-3xl p-8 space-y-12">
      <div className="flex justify-between items-center border-b-4 border-[#4C1D95]/5 pb-6">
        <div>
          <h3 className="text-xl font-black text-[#4C1D95] uppercase tracking-tight">Credit Scoring Interface</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">Technical Assessment Module v2.0</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase">Controlled</p>
            <p className="text-2xl font-black text-green-600">{totalGrade.toFixed(1)}</p>
          </div>
          <div className="w-px h-10 bg-gray-100" />
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase">Risk</p>
            <p className="text-2xl font-black text-red-600">{riskScore.toFixed(1)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {Object.entries(SCORING_SHEET).map(([sectionKey, section]) => (
          <section key={sectionKey} className="space-y-6">
            <div className="flex items-center gap-4">
              <h4 className="text-xs font-black text-[#4C1D95] bg-[#4C1D95]/5 px-4 py-2 rounded-lg uppercase tracking-widest whitespace-nowrap">
                {sectionKey.replace(/_/g, ' ')}
              </h4>
              <div className="h-px w-full bg-gray-100" />
              <span className="text-[10px] font-black text-gray-300">MAX: {section.max.toFixed(1)}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {section.items.map((item) => (
                <div key={item.id} className="space-y-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide leading-tight">{item.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.options.map((opt) => {
                      const isSelected = formData[item.id] === opt.l;
                      return (
                        <button
                          key={opt.l}
                          disabled={isReadOnly}
                          onClick={() => setFormData({ ...formData, [item.id]: opt.l })}
                          className={cn(
                            "px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all border-2",
                            isSelected 
                              ? "bg-[#4C1D95] text-white border-[#4C1D95] shadow-lg shadow-[#4C1D95]/20 scale-105" 
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
          </section>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t-4 border-[#4C1D95]/5">
        <div className="space-y-4">
          <label className="text-xs font-black text-[#4C1D95] uppercase tracking-widest">Summary Grading Table</label>
          <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
            <table className="w-full text-[10px]">
              <thead className="bg-[#4C1D95]">
                <tr className="text-white">
                  <th className="p-3 text-left font-black uppercase tracking-widest">Section</th>
                  <th className="p-3 text-center font-black uppercase tracking-widest">Actual</th>
                  <th className="p-3 text-center font-black uppercase tracking-widest">Overall</th>
                  <th className="p-3 text-center font-black uppercase tracking-widest">Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(SCORING_SHEET).map(([k, v]) => {
                  const camelKey = k.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
                  const actual = sectionGrades[camelKey] || 0;
                  const diff = v.max - actual;
                  return (
                    <tr key={k} className="hover:bg-gray-100/50 transition-colors">
                      <td className="p-3 font-bold uppercase text-gray-500">{k.replace(/_/g, ' ')}</td>
                      <td className="p-3 text-center font-black text-[#4C1D95]">{actual.toFixed(1)}</td>
                      <td className="p-3 text-center font-mono opacity-50">{v.max.toFixed(1)}</td>
                      <td className={cn(
                        "p-3 text-center font-black",
                        diff > 0 ? "text-red-500" : "text-green-600"
                      )}>{diff.toFixed(1)}</td>
                    </tr>
                  );
                })}
                <tr className="bg-[#4C1D95]/5 font-black">
                  <td className="p-4 uppercase text-[#4C1D95]">Total Cumulative</td>
                  <td className="p-4 text-center text-lg text-[#4C1D95]">{totalGrade.toFixed(1)}</td>
                  <td className="p-4 text-center text-gray-300">100.0</td>
                  <td className="p-4 text-center text-lg text-red-500">{riskScore.toFixed(1)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-[#4C1D95] uppercase tracking-widest">Final Status Recommendation</label>
            <div className={cn(
              "w-full h-12 px-6 flex items-center bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-black uppercase",
              totalGrade <= 30 ? "text-green-600" : "text-red-600"
            )}>
              {totalGrade <= 30 ? 'Approve' : 'Denied'}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-[#4C1D95] uppercase tracking-widest">CI Diagnostic Remarks</label>
            <textarea 
              disabled={isReadOnly}
              className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm h-32 focus:border-[#4C1D95] focus:outline-none transition-all disabled:opacity-50"
              placeholder="Provide justification for the above scoring results..."
              value={formData.ciRemarks}
              onChange={e => setFormData({ ...formData, ciRemarks: e.target.value })}
            />
          </div>

          {!isReadOnly && (
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-4 bg-[#4C1D95] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-[#3B1575] hover:-translate-y-1 transition-all active:translate-y-0 shadow-lg shadow-[#4C1D95]/20 disabled:opacity-50"
            >
              {isSaving ? 'Processing Diagnostic Data...' : 'Commit Assessment to Repository'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PerformanceGraph({ history }: { history: CashflowReport[] }) {
  if (!history || history.length < 1) return null;

  return (
    <section className="space-y-6 bg-white rounded-3xl p-8 border border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#4C1D95]/5 rounded-xl flex items-center justify-center">
          <TrendingUp className="text-[#4C1D95]" size={20} />
        </div>
        <div>
          <h4 className="text-sm font-black text-[#4C1D95] uppercase tracking-widest">Financial Performance History</h4>
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
              label={{ value: 'Submission Round', position: 'bottom', offset: -5, fontSize: 10, fontWeight: 'black', fill: '#4C1D95' }}
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
              stroke="#4C1D95" 
              strokeWidth={4} 
              dot={{ r: 6, fill: '#4C1D95', strokeWidth: 2, stroke: '#fff' }} 
              activeDot={{ r: 8, fill: '#4C1D95' }} 
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
          <div className="w-3 h-3 bg-[#4C1D95] rounded-full" />
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
    loanAmount: assignment.requestedAmount, term: Number(assignment.term) || 0, interest: 0, rate: 4,
    monthlyAmort: 0, semiMonthlyAmort: 0, weeklyAmort: 0, remarks: ''
  });
  const [opRecommendation, setOpRecommendation] = useState(assignment.cashflowReport?.operationRecommendation || {
    loanAmount: assignment.requestedAmount, term: Number(assignment.term) || 0, interest: 0, rate: 4,
    monthlyAmort: 0, semiMonthlyAmort: 0, weeklyAmort: 0, remarks: ''
  });
  const [ndiPercentage, setNdiPercentage] = useState(30);
  const [isSaving, setIsSaving] = useState(false);

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
        loanAmount: assignment.requestedAmount, term: Number(assignment.term) || 0, interest: 0, rate: 4,
        monthlyAmort: 0, semiMonthlyAmort: 0, weeklyAmort: 0, remarks: ''
      });
      setOpRecommendation(assignment.cashflowReport.operationRecommendation || {
        loanAmount: assignment.requestedAmount, term: Number(assignment.term) || 0, interest: 0, rate: 4,
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
        loanAmount: assignment.requestedAmount, term: Number(assignment.term) || 0, interest: 0, rate: 4,
        monthlyAmort: 0, semiMonthlyAmort: 0, weeklyAmort: 0, remarks: ''
      });
      setOpRecommendation({
        loanAmount: assignment.requestedAmount, term: Number(assignment.term) || 0, interest: 0, rate: 4,
        monthlyAmort: 0, semiMonthlyAmort: 0, weeklyAmort: 0, remarks: ''
      });
    }
  }, [assignment.id, assignment.cashflowReport]);

  // Auto-calculations
  useEffect(() => {
    setBusinessIncome(prev => ({
      ...prev,
      net: Number(prev.gross) - Number(prev.expenses)
    }));
  }, [businessIncome.gross, businessIncome.expenses]);

  useEffect(() => {
    const sumLiabilities = liabilities.reduce((acc, curr) => acc + Number(curr.amortization), 0);
    const baseSum = Number(householdExpenses.food) + 
                    Number(householdExpenses.rent) + 
                    Number(householdExpenses.electricity) + 
                    Number(householdExpenses.water) + 
                    Number(householdExpenses.insurance) + 
                    Number(householdExpenses.clothing) + 
                    Number(householdExpenses.lpg) + 
                    Number(householdExpenses.association) + 
                    Number(householdExpenses.vehicle) + 
                    Number(householdExpenses.transportation) + 
                    Number(householdExpenses.internet) + 
                    Number(householdExpenses.education) + 
                    Number(householdExpenses.medical);

    const loanPayments = sumLiabilities;
    const miscellaneous = (baseSum + loanPayments) * 0.05;
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
    grossBusinessIncome: businessIncome.gross,
    businessExpenses: businessIncome.expenses,
    businessNetIncome: businessIncome.net,
    additionalIncome: Number(otherIncome),
    totalHouseholdExpenses: householdExpenses.total,
    netIncome: Number(businessIncome.net) + Number(otherIncome) - householdExpenses.total,
    ndiPercentage,
    monthlyNdi: (Number(businessIncome.net) + Number(otherIncome) - householdExpenses.total) * (ndiPercentage / 100),
    recommendedLoan: ((Number(businessIncome.net) + Number(otherIncome) - householdExpenses.total) * (ndiPercentage / 100) * Number(ciRecommendation.term)) / (1 + (Number(ciRecommendation.rate) / 100) * Number(ciRecommendation.term)),
    loanableAmount: 0, // Simplified for now
    difference: 0
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const report: CashflowReport = {
        liabilities,
        businessIncome,
        otherIncome: Number(otherIncome),
        householdExpenses,
        analysis: { ...analysis, loanableAmount: 0, difference: 0 },
        ciRecommendation: { ...ciRecommendation, ...calcAmort(ciRecommendation) },
        operationRecommendation: { ...opRecommendation, ...calcAmort(opRecommendation) }
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

  const addLiability = () => {
    setLiabilities([...liabilities, {
      source: '', loanType: '', loanAmount: 0, startDate: '', endDate: '',
      lastUpdate: '', periodicity: 'MONTHLY', amortization: 0, balance: 0, status: '', remarks: ''
    }]);
  };

  const removeLiability = (idx: number) => {
    setLiabilities(liabilities.filter((_, i) => i !== idx));
  };

  const isReadOnly = forceReadOnly || (assignment.status !== 'Cashflowing' && assignment.status !== 'Report Submitted');

  return (
    <div className="bg-white border-2 border-[#4C1D95]/10 rounded-3xl p-8 space-y-12 shadow-xl shadow-[#4C1D95]/5">
      <div className="flex justify-between items-center border-b-4 border-[#4C1D95]/5 pb-6">
        <div>
          <h3 className="text-xl font-black text-[#4C1D95] uppercase tracking-tight">Financial Cashflow Report</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">CASHFLOW ANALYSIS SYSTEM v3.0</p>
        </div>
      </div>

      {/* Liabilities Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-center bg-[#4C1D95]/5 p-4 rounded-xl">
          <h4 className="text-xs font-black text-[#4C1D95] uppercase tracking-widest">Client Liabilities</h4>
          {!isReadOnly && (
            <button onClick={addLiability} className="text-[10px] font-black uppercase tracking-widest text-[#4C1D95] hover:underline">+ Add Entry</button>
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
          <h4 className="text-xs font-black text-[#4C1D95] bg-[#4C1D95]/5 px-4 py-2 rounded-lg uppercase tracking-widest whitespace-nowrap">Business & Other Income</h4>
          <div className="grid grid-cols-1 gap-6 p-6 bg-gray-50 rounded-3xl border border-gray-100">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monthly Gross Sales</label>
                <input 
                  disabled={isReadOnly} 
                  type="number" 
                  className="w-full h-12 px-4 bg-white border-2 border-gray-100 rounded-xl text-sm font-black focus:border-[#4C1D95] focus:outline-none transition-all" 
                  value={businessIncome.gross === 0 ? '' : businessIncome.gross} 
                  onChange={e => setBusinessIncome({ ...businessIncome, gross: e.target.value === '' ? 0 : Number(e.target.value) })} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monthly Business Expenses</label>
                <input 
                  disabled={isReadOnly} 
                  type="number" 
                  className="w-full h-12 px-4 bg-white border-2 border-gray-100 rounded-xl text-sm font-black text-red-500 focus:border-[#4C1D95] focus:outline-none transition-all" 
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
                className="w-full h-12 px-4 bg-white border-2 border-gray-100 rounded-xl text-sm font-black text-green-600 focus:border-[#4C1D95] focus:outline-none transition-all" 
                value={otherIncome === 0 ? '' : otherIncome} 
                onChange={e => setOtherIncome(e.target.value === '' ? 0 : Number(e.target.value))} 
              />
            </div>

            <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-[#4C1D95]">Total Business Net</span>
              <span className="text-xl font-black text-green-600">₱ {businessIncome.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </section>

        {/* Household Expenses Section */}
        <section className="space-y-6">
          <h4 className="text-xs font-black text-[#4C1D95] bg-[#4C1D95]/5 px-4 py-2 rounded-lg uppercase tracking-widest whitespace-nowrap">Household Expenses Manifest</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
            {Object.entries(householdExpenses).filter(([k]) => k !== 'total').map(([key, val]) => {
              const autoFields = ['loanPayments', 'miscellaneous'];
              const isAuto = autoFields.includes(key);
              return (
                <div key={key} className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    {key.replace(/([A-Z])/g, ' $1')}
                    {isAuto && <span className="ml-1 text-[8px] text-[#4C1D95] opacity-50">(AUTO)</span>}
                  </label>
                  <input 
                    disabled={isReadOnly || isAuto} 
                    type="number" 
                    className={cn(
                      "w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#4C1D95]/20 focus:outline-none",
                      isAuto && "bg-[#4C1D95]/5 text-[#4C1D95]"
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
            <h5 className="text-[10px] font-black text-[#4C1D95] uppercase tracking-[0.3em]">Cashflow Integrity</h5>
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
                <span className="text-[11px] font-black text-[#4C1D95] uppercase">Residual Net Income</span>
                <span className="text-lg font-black text-[#4C1D95]">₱ {analysis.netIncome.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:border-l border-gray-200 lg:pl-12">
            <h5 className="text-[10px] font-black text-[#4C1D95] uppercase tracking-[0.3em]">NDI Calibration</h5>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target NDI Policy (%)</label>
                <div className="flex gap-2">
                  {[30, 40, 50].map(p => (
                    <button key={p} onClick={() => setNdiPercentage(p)} className={cn("flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all", ndiPercentage === p ? "bg-[#4C1D95] text-white" : "bg-white text-gray-400 border border-gray-100")}>{p}%</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-gray-500 uppercase">Monthly Capacity (NDI @ {ndiPercentage}%)</p>
                <p className="text-2xl font-black text-green-600">₱ {analysis.monthlyNdi.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:border-l border-gray-200 lg:pl-12 bg-white/50 p-6 rounded-3xl">
            <h5 className="text-[10px] font-black text-[#4C1D95] uppercase tracking-[0.3em]">Loanability Algorithm</h5>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-gray-500 uppercase">Recommended Loan</span>
                <span className="text-xl font-black text-[#4C1D95]">₱ {analysis.recommendedLoan.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <p className="text-[9px] text-gray-400 italic">Financial recommendation based on residual capacity and requested terms.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Action Block */}
      <div className="flex flex-col gap-8 pt-12 border-t-4 border-[#4C1D95]/5">
        <div className="space-y-6">
          <label className="text-xs font-black text-[#4C1D95] uppercase tracking-widest">CI Assessment & Recommendation</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Recommended Amount</label>
              <input disabled={isReadOnly} type="number" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black" value={ciRecommendation.loanAmount === 0 ? '' : ciRecommendation.loanAmount} onChange={e => setCiRecommendation({ ...ciRecommendation, loanAmount: Number(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Term (Months)</label>
              <input disabled={isReadOnly} type="number" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black" value={ciRecommendation.term === 0 ? '' : ciRecommendation.term} onChange={e => setCiRecommendation({ ...ciRecommendation, term: Number(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Flat Int. Rate (% Monthly)</label>
              <input disabled={isReadOnly} type="number" step="0.1" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black" value={ciRecommendation.rate === 0 ? '' : ciRecommendation.rate} onChange={e => setCiRecommendation({ ...ciRecommendation, rate: Number(e.target.value) })} />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">CI Remarks & Justification</label>
            <textarea 
              disabled={isReadOnly}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm h-24 focus:ring-2 focus:ring-[#4C1D95]/20 focus:outline-none"
              placeholder="Provide detailed breakdown and justification for this recommendation..."
              value={ciRecommendation.remarks}
              onChange={e => setCiRecommendation({ ...ciRecommendation, remarks: e.target.value })}
            />
          </div>

          <div className="p-6 bg-[#4C1D95]/5 rounded-3xl border border-[#4C1D95]/10 grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <p className="text-[8px] font-black text-gray-400 uppercase">Total Interest</p>
              <p className="text-sm font-black text-[#4C1D95]">₱ {calcAmort(ciRecommendation).interest.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-black text-gray-400 uppercase">Weekly Amort</p>
              <p className="text-sm font-black text-green-600">₱ {calcAmort(ciRecommendation).weeklyAmort.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-black text-gray-400 uppercase">Semi-Monthly Amort</p>
              <p className="text-sm font-black text-[#4C1D95]">₱ {calcAmort(ciRecommendation).semiMonthlyAmort.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-black text-gray-400 uppercase">Monthly Amort</p>
              <p className="text-sm font-black text-[#4C1D95]">₱ {calcAmort(ciRecommendation).monthlyAmort.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>

        {!isReadOnly && (
          <div className="pb-4">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-5 bg-[#4C1D95] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#3B1575] hover:-translate-y-1 transition-all active:translate-y-0 shadow-xl shadow-[#4C1D95]/20"
            >
              {isSaving ? 'Calculating...' : 'Commit Financial Diagnostic'}
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
  const [loading, setLoading] = useState(true);
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
    const qApproved = query(collection(db, 'assignments'), where('status', '==', 'Approved'), orderBy('createdAt', 'desc'), limit(10));

    const unsubscribePending = onSnapshot(qPending, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Assignment[];
      setAssignments(data);
      setLoading(false);
    });

    const unsubscribeApproved = onSnapshot(qApproved, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Assignment[];
      setApprovedList(data);
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

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assignments.map(a => {
          const preApprovalStep = a.timeline.find(t => t.step === 'Pre-approved');
          const preApprovalDate = preApprovalStep ? format(new Date(preApprovalStep.timestamp), 'MMM d, yyyy h:mm a') : 'N/A';
          
          return (
            <motion.div 
              key={a.id} 
              layoutId={a.id}
              onClick={() => setSelected(a)}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group flex flex-col"
            >
              <div className="bg-[#4C1D95] p-5 flex justify-between items-center text-white">
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
                      <p className="text-sm font-black text-[#4C1D95]">₱{a.cashflowReport?.ciRecommendation?.loanAmount.toLocaleString()}</p>
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
                  <div className="text-[9px] font-black text-[#4C1D95] uppercase tracking-[0.2em] group-hover:translate-x-2 transition-all">Review Details →</div>
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
          <h3 className="text-sm font-black text-[#4C1D95] uppercase tracking-[0.3em] whitespace-nowrap">Recently Approved Loans</h3>
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
                      <p className="text-sm font-black text-[#4C1D95] uppercase">{a.borrowerName}</p>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest">CI: {a.ciOfficerName}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-sm font-black text-gray-900">₱{a.approvedAmount?.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black text-gray-600">{a.approvedTerm} Mos</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-black text-[#4C1D95]">{a.approvedIntRate}%</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase">{a.approvedMop}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-black uppercase">{a.approvedTop}</span>
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
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white w-full max-w-7xl max-h-[95vh] overflow-y-auto rounded-[40px] p-0 shadow-2xl flex flex-col xl:flex-row"
            >
              <div className="flex-1 p-8 lg:p-12 overflow-y-auto border-r border-gray-100">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-4xl font-black text-[#4C1D95] uppercase tracking-tighter leading-none mb-2">{selected.borrowerName}</h3>
                    <div className="flex items-center gap-4">
                      <span className="px-3 py-1 bg-[#4C1D95]/5 text-[#4C1D95] text-[10px] font-black uppercase rounded-full tracking-widest">Step: Discrepancy & Final Approval</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">CI Officer: {selected.ciOfficerName}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><X /></button>
                </div>

                <div className="space-y-12">
                  {/* Performance History Section */}
                  {selected.cashflowHistory && selected.cashflowHistory.length > 0 && (
                    <PerformanceGraph history={selected.cashflowHistory} />
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <section className="space-y-6">
                      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                        <h4 className="text-[10px] font-black text-[#4C1D95] uppercase tracking-widest">Credit Scorer Insight</h4>
                        <span className="text-[10px] font-black text-green-600 bg-white px-3 py-1 rounded-full shadow-sm badge">GRADE: {selected.creditScore?.finalGrade || 'N/A'}</span>
                      </div>
                      <CreditScoringModule assignment={selected} user={user} isReadOnly={true} />
                    </section>

                    <section className="space-y-6">
                      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                        <h4 className="text-[10px] font-black text-[#4C1D95] uppercase tracking-widest">Financial Diagnostic Summary</h4>
                        <span className="text-[10px] font-black text-[#4C1D95] bg-white px-3 py-1 rounded-full shadow-sm badge">NDI: ₱{selected.cashflowReport?.analysis?.monthlyNdi?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                      <CashflowModule assignment={selected} user={user} isReadOnly={true} />
                    </section>
                  </div>
                </div>
              </div>

              <div className="w-full xl:w-[400px] bg-gray-50 p-8 lg:p-12 border-l border-gray-100 flex flex-col">
                <div className="flex-1 space-y-8">
                  <div className="pb-6 border-b border-gray-200">
                    <h4 className="text-[11px] font-black text-[#4C1D95] uppercase tracking-[0.2em]">Final Determination Payload</h4>
                    <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold">Input final credit committee decisions below</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Final Amount</label>
                        <input 
                          type="number" 
                          className="w-full h-14 px-6 bg-white border-2 border-gray-200 rounded-2xl text-lg font-black focus:border-[#4C1D95] focus:outline-none transition-all placeholder:text-gray-300"
                          value={processData.amount}
                          onChange={e => setProcessData({...processData, amount: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Term (Mos)</label>
                        <input 
                          type="text" 
                          className="w-full h-14 px-6 bg-white border-2 border-gray-200 rounded-2xl text-lg font-black focus:border-[#4C1D95] focus:outline-none transition-all"
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
                        className="w-full h-14 px-6 bg-white border-2 border-gray-200 rounded-2xl text-lg font-black focus:border-[#4C1D95] focus:outline-none transition-all"
                        value={processData.intRate}
                        onChange={e => setProcessData({...processData, intRate: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">MOP</label>
                        <select 
                          className="w-full h-14 px-4 bg-white border-2 border-gray-200 rounded-2xl text-[10px] font-black uppercase focus:border-[#4C1D95] focus:outline-none transition-all"
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
                          className="w-full h-14 px-4 bg-white border-2 border-gray-200 rounded-2xl text-[10px] font-black uppercase focus:border-[#4C1D95] focus:outline-none transition-all"
                          value={processData.top}
                          onChange={e => setProcessData({...processData, top: e.target.value as any})}
                        >
                          <option value="Collection">Collection</option>
                          <option value="PDC">PDC</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-[#4C1D95] p-6 rounded-3xl text-white shadow-xl shadow-[#4C1D95]/20 space-y-4">
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
                        className="w-full px-6 py-4 bg-white border-2 border-gray-200 rounded-3xl text-[11px] font-bold h-32 focus:border-[#4C1D95] focus:outline-none transition-all"
                        placeholder="Provide final justification for the approval or denial..."
                        value={processData.comments}
                        onChange={e => setProcessData({...processData, comments: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex flex-col gap-4 mt-auto">
                  <button 
                    onClick={handleDeny}
                    className="w-full py-5 bg-red-50 text-red-600 text-[10px] font-black rounded-2xl hover:bg-red-500 hover:text-white transition-all uppercase tracking-[0.3em] active:scale-95"
                  >
                    Deny Application
                  </button>
                  <button 
                    onClick={handleApprove}
                    className="w-full py-6 bg-[#4C1D95] text-white text-[11px] font-black rounded-3xl hover:bg-[#3B1575] hover:-translate-y-1 active:translate-y-0 transition-all uppercase tracking-[0.4em] shadow-2xl shadow-[#4C1D95]/40"
                  >
                    Grant Final Approval
                  </button>
                </div>
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
      console.error('Firestore AdminKeys listener error:', err);
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
    let q = query(collection(db, 'assignments'), where('status', '==', 'Approved'));
    if (user.role !== 'admin') {
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
      console.error('Firestore ValidationSurvey listener error:', err);
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
        status: 'Completed',
        timeline: [...selected.timeline, { 
          step: 'Completed', 
          timestamp: new Date().toISOString(),
          note: 'CI Officer submitted validation and survey results'
        }]
      });

      // Notify Admins
      const adminsSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
      adminsSnapshot.forEach(adminDoc => {
        createNotification(
          adminDoc.id,
          'Validation Completed',
          `CI Officer ${user.fullName} completed validation for ${selected.borrowerName}`,
          'status_change',
          selected.id
        );
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

function DataStorage({ user }: { user: UserProfile }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [ciOfficers, setCiOfficers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(q, (snapshot) => {
      setCiOfficers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserProfile[]);
    });

    const qAss = query(collection(db, 'assignments'), orderBy('createdAt', 'desc'));
    const unsubAss = onSnapshot(qAss, (snapshot) => {
      setAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Assignment[]);
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

  const filtered = assignments.filter(a => 
    a.borrowerName.toLowerCase().includes(search.toLowerCase()) ||
    a.ciOfficerName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4C1D95]" />
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-[#4C1D95] uppercase tracking-tight">Main Data Storage</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" /> Comprehensive Archive
          </p>
        </div>
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search all records..."
            className="w-full pl-12 pr-6 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl text-sm focus:outline-none focus:border-[#4C1D95]/20 font-medium transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 group transition-colors">
                  <td className="px-6 py-5">
                    <div>
                      <p className="font-bold text-gray-900 uppercase text-sm">{a.borrowerName}</p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                        <Phone size={10} /> {a.mobileNumber}
                      </p>
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
                      <p className="text-xs font-black text-[#4C1D95]">₱{a.requestedAmount.toLocaleString()}</p>
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
                      a.status === 'Completed' ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"
                    )}>
                      {a.status}
                    </span>
                    <p className="text-[8px] text-gray-300 mt-2 font-mono">
                      {format(new Date(a.createdAt), 'MMM d, yyyy')}
                    </p>
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
    </div>
  );
}

function ReportsView({ user }: { user: UserProfile }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    let q = query(collection(db, 'assignments'), orderBy('createdAt', 'desc'));
    
    if (user.role !== 'admin') {
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
      console.error('Firestore Reports listener error:', err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filtered = assignments.filter(a => {
    const matchesSearch = 
      a.borrowerName.toLowerCase().includes(search.toLowerCase()) ||
      a.ciOfficerName.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    
    const assignmentDate = new Date(a.createdAt);
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && assignmentDate >= new Date(startDate);
    }
    if (endDate) {
      // Set end date to end of day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && assignmentDate <= end;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const exportToCSV = () => {
    const fields = ['Borrower Name', 'Mobile Number', 'Account Type', 'Location', 'Tribe', 'Requested Amount', 'Term', 'CI Officer', 'Status', 'Created At'];
    const csvContent = [
      fields.join(','),
      ...filtered.map(a => [
        `"${a.borrowerName}"`,
        `"${a.mobileNumber}"`,
        `"${a.accountType}"`,
        `"${a.location}"`,
        `"${a.tribe}"`,
        a.requestedAmount,
        `"${a.term}"`,
        `"${a.ciOfficerName}"`,
        `"${a.status}"`,
        `"${format(new Date(a.createdAt), 'MMM d, yyyy | h:mm a')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `AMS_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filtered.map(a => ({
      'Borrower Name': a.borrowerName,
      'Mobile Number': a.mobileNumber,
      'Account Type': a.accountType,
      'Location': a.location,
      'Tribe': a.tribe,
      'Requested Amount': a.requestedAmount,
      'Term': a.term,
      'CI Officer': a.ciOfficerName,
      'Status': a.status,
      'Created At': format(new Date(a.createdAt), 'MMM d, yyyy | h:mm a')
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Assignments");
    XLSX.writeFile(workbook, `AMS_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("AMS - Assignment Report", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated by: ${user.fullName} | ${format(new Date(), 'MMM d, yyyy h:mm a')}`, 14, 30);
    if (statusFilter !== 'All') doc.text(`Status: ${statusFilter}`, 14, 35);
    if (startDate || endDate) doc.text(`Range: ${startDate || 'Start'} to ${endDate || 'End'}`, 14, 40);
    
    const tableColumn = ["Borrower", "Type", "CI Officer", "Status", "Created At"];
    const tableRows = filtered.map(a => [
      a.borrowerName,
      a.accountType,
      a.ciOfficerName,
      a.status,
      format(new Date(a.createdAt), 'MMM d, yyyy')
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: (statusFilter !== 'All' || startDate || endDate) ? 45 : 35,
      theme: 'grid',
      headStyles: { fillColor: [76, 29, 149], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 }
    });
    
    doc.save(`AMS_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
  };

  const statusOptions = [
    'All',
    'Assigned',
    'Start to Perform Assignment',
    'Reviewing',
    'Field CIBI',
    'Cashflowing',
    'Report Submitted',
    'Completed',
    'Approved',
    'Denied'
  ];

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4C1D95]" />
    </div>
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-[#4C1D95] uppercase tracking-tight">Reporting Command</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Live Repository Data
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={exportToCSV}
            className="group flex items-center gap-3 px-8 py-3.5 bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/10 active:scale-95"
          >
            <Download size={16} className="group-hover:translate-y-0.5 transition-transform" /> Export CSV
          </button>
          <button 
            onClick={exportToExcel}
            className="group flex items-center gap-3 px-8 py-3.5 bg-[#1D6F42] text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#155231] transition-all shadow-xl shadow-green-900/10 active:scale-95"
          >
            <Download size={16} className="group-hover:translate-y-0.5 transition-transform" /> Export Master Ledger (.xlsx)
          </button>
          <button 
            onClick={exportToPDF}
            className="group flex items-center gap-3 px-8 py-3.5 bg-[#E11D48] text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#BE123C] transition-all shadow-xl shadow-red-900/10 active:scale-95"
          >
            <Download size={16} className="group-hover:translate-y-0.5 transition-transform" /> Generate PDF Manifest
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-gray-50/30 space-y-6">
          <div className="flex flex-col xl:flex-row gap-6">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Search Identifier</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Filter by borrower or CI officer name..."
                  className="w-full pl-12 pr-6 py-3.5 bg-white border-2 border-gray-50 rounded-2xl text-sm focus:outline-none focus:border-[#4C1D95]/20 font-medium transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 xl:w-2/3">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lifecycle Status</label>
                <select 
                  className="w-full px-5 py-3.5 bg-white border-2 border-gray-50 rounded-2xl text-sm font-bold appearance-none cursor-pointer focus:border-[#4C1D95]/20 focus:outline-none transition-all"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Commencement Date</label>
                <input 
                  type="date" 
                  className="w-full px-5 py-3.5 bg-white border-2 border-gray-50 rounded-2xl text-sm font-bold focus:border-[#4C1D95]/20 focus:outline-none transition-all"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Termination Date</label>
                <input 
                  type="date" 
                  className="w-full px-5 py-3.5 bg-white border-2 border-gray-50 rounded-2xl text-sm font-bold focus:border-[#4C1D95]/20 focus:outline-none transition-all"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {(statusFilter !== 'All' || startDate || endDate || search) && (
            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100">
              <div className="flex gap-2">
                {statusFilter !== 'All' && <span className="px-3 py-1 bg-[#4C1D95]/5 text-[#4C1D95] text-[10px] font-black rounded-lg uppercase tracking-tight">Status: {statusFilter}</span>}
                {startDate && <span className="px-3 py-1 bg-[#4C1D95]/5 text-[#4C1D95] text-[10px] font-black rounded-lg uppercase tracking-tight">From: {startDate}</span>}
                {endDate && <span className="px-3 py-1 bg-[#4C1D95]/5 text-[#4C1D95] text-[10px] font-black rounded-lg uppercase tracking-tight">To: {endDate}</span>}
              </div>
              <button 
                onClick={() => {
                  setSearch('');
                  setStatusFilter('All');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline"
              >
                Reset System Filters
              </button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Borrower Name</th>
                <th className="px-6 py-4">Account Type</th>
                <th className="px-6 py-4">CI Officer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-tight">{a.borrowerName}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold text-gray-500 uppercase px-2 py-1 bg-gray-100 rounded-md">
                      {a.accountType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600 font-medium italic">{a.ciOfficerName}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-tight px-2.5 py-1 rounded-full",
                      a.status === 'Completed' ? "bg-green-100 text-green-700" :
                      a.status === 'Approved' ? "bg-blue-100 text-blue-700" :
                      a.status === 'Denied' ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[10px] font-mono text-gray-400 font-bold">
                    {format(new Date(a.createdAt), 'MMM d, yyyy | h:mm a')}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-300 space-y-2">
                      <FileText size={48} strokeWidth={1} />
                      <p className="text-[10px] font-black uppercase tracking-widest">No matching records found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
