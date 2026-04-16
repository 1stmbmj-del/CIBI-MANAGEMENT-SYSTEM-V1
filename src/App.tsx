import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { auth, db, storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UserProfile, UserRole, Assignment, AssignmentStatus, TimelineStep } from './types';
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
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInMinutes } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'dashboard'>('login');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('ASSIGN ACCOUNT');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ uid: firebaseUser.uid, ...userDoc.data() } as UserProfile);
          setCurrentView('dashboard');
        } else {
          // Handle case where user exists in Auth but not in Firestore
          await signOut(auth);
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
          <Login onSwitch={() => setCurrentView('register')} />
        )}
        {currentView === 'register' && (
          <Register onSwitch={() => setCurrentView('login')} />
        )}
        {currentView === 'dashboard' && user && (
          <Dashboard 
            user={user} 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- LOGIN COMPONENT ---
function Login({ onSwitch }: { onSwitch: () => void }) {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Since Firebase Auth uses email, we'll use mobile@ams.com as a dummy email
      const email = `${mobile}@ams.com`;
      await signInWithEmailAndPassword(auth, email, password);
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
function Register({ onSwitch }: { onSwitch: () => void }) {
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!photo) {
      setError('Profile picture is required');
      return;
    }

    setLoading(true);
    try {
      // Check admin key if role is admin and not super admin
      if (role === 'admin' && mobile !== '09327481042') {
        const keyDoc = await getDoc(doc(db, 'adminKeys', adminKey));
        if (!keyDoc.exists() || keyDoc.data().used) {
          setError('Invalid or already used admin key');
          setLoading(false);
          return;
        }
        // Mark key as used
        await updateDoc(doc(db, 'adminKeys', adminKey), { used: true });
      }

      const email = `${mobile}@ams.com`;
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      let photoURL = '';
      if (photo) {
        const storageRef = ref(storage, `profiles/${user.uid}`);
        await uploadBytes(storageRef, photo);
        photoURL = await getDownloadURL(storageRef);
      }

      await setDoc(doc(db, 'users', user.uid), {
        fullName,
        mobileNumber: mobile,
        role,
        photoURL,
        createdAt: new Date().toISOString()
      });

      await updateProfile(user, { photoURL });

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
            <label className="relative cursor-pointer group">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="text-gray-400" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-opacity">
                <Camera className="text-white" size={16} />
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
            </label>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest">Profile Picture Required</span>
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
                <option value="coordinator">Coordinator</option>
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
  activeTab, 
  setActiveTab,
  sidebarOpen,
  setSidebarOpen
}: { 
  user: UserProfile;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) {
  const isAdmin = user.role === 'admin';

  const menuItems = isAdmin ? [
    { id: 'ASSIGN ACCOUNT', icon: UserPlus },
    { id: 'ACCOUNT STATUS', icon: ClipboardList },
    { id: 'PROCESS ACCOUNTS', icon: CheckCircle2 },
    { id: 'ADMIN KEYS', icon: Key },
    { id: 'MY PROFILE', icon: User },
  ] : [
    { id: 'ACCOUNT STATUS', icon: ClipboardList },
    { id: 'FOR VALIDATION & SURVEY', icon: CheckCircle2 },
    { id: 'MY PROFILE', icon: User },
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
                <img src={user.photoURL} alt={user.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
            onClick={() => signOut(auth)}
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
          <div className="text-[10px] text-gray-400 font-medium">
            {format(new Date(), 'M/d/yyyy')}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'ASSIGN ACCOUNT' && <AssignAccount user={user} />}
            {activeTab === 'ACCOUNT STATUS' && <AccountStatus user={user} />}
            {activeTab === 'PROCESS ACCOUNTS' && <ProcessAccounts user={user} />}
            {activeTab === 'ADMIN KEYS' && <AdminKeys user={user} />}
            {activeTab === 'FOR VALIDATION & SURVEY' && <ValidationSurvey user={user} />}
            {activeTab === 'MY PROFILE' && <MyProfile user={user} />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function MyProfile({ user }: { user: UserProfile }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center space-y-8"
    >
      <div className="relative inline-block">
        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-[#4C1D95]/10 mx-auto">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <User size={48} className="text-gray-300" />
          )}
        </div>
        <div className="absolute bottom-0 right-0 bg-[#4C1D95] text-white p-2 rounded-full shadow-lg">
          <Camera size={16} />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-black text-[#4C1D95] uppercase">{user.fullName}</h2>
        <p className="text-sm text-gray-400 uppercase tracking-[0.3em] font-bold">{user.role}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-8">
        <div className="p-6 bg-gray-50 rounded-2xl text-left space-y-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mobile Number</p>
          <p className="font-bold text-[#4C1D95]">{user.mobileNumber}</p>
        </div>
        <div className="p-6 bg-gray-50 rounded-2xl text-left space-y-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Joined Date</p>
          <p className="font-bold text-[#4C1D95]">{format(new Date(user.createdAt), 'MMMM d, yyyy')}</p>
        </div>
      </div>

      <div className="pt-8">
        <button className="w-full py-4 border-2 border-[#4C1D95] text-[#4C1D95] font-black rounded-2xl hover:bg-[#4C1D95] hover:text-white transition-all uppercase tracking-[0.2em] text-xs">
          Edit Profile Information
        </button>
      </div>
    </motion.div>
  );
}

// --- SUB-COMPONENTS ---

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
    const fetchOfficers = async () => {
      const q = query(collection(db, 'users'), where('role', 'in', ['user', 'coordinator']));
      const snap = await getDocs(q);
      setCiOfficers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
    };
    fetchOfficers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const officer = ciOfficers.find(o => o.uid === formData.ciOfficerId);
      await addDoc(collection(db, 'assignments'), {
        ...formData,
        requestedAmount: Number(formData.requestedAmount),
        intRate: Number(formData.intRate),
        ciOfficerName: officer?.fullName || 'Unknown',
        status: 'Assigned',
        timeline: [{ step: 'Assigned', timestamp: new Date().toISOString() }],
        createdAt: new Date().toISOString()
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
                <option key={o.uid} value={o.uid}>{o.fullName}</option>
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

  useEffect(() => {
    const q = user.role === 'admin' 
      ? query(collection(db, 'assignments'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'assignments'), where('ciOfficerId', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snap) => {
      setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Assignment)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const steps = [
    'Start to Perform Assignment',
    'Reviewing',
    'Field CIBI',
    'Cashflowing',
    'Report Submitted',
    'Completed'
  ];

  const handleNextStep = async (assignment: Assignment) => {
    const currentIndex = steps.indexOf(assignment.status);
    let nextStatus: AssignmentStatus;
    
    if (assignment.status === 'Assigned') {
      nextStatus = 'Start to Perform Assignment';
    } else if (currentIndex < steps.length - 1) {
      nextStatus = steps[currentIndex + 1] as AssignmentStatus;
    } else {
      return;
    }

    const newTimeline = [...assignment.timeline, { step: nextStatus, timestamp: new Date().toISOString() }];
    await updateDoc(doc(db, 'assignments', assignment.id), {
      status: nextStatus,
      timeline: newTimeline
    });
  };

  const calculateTAT = (timeline: TimelineStep[]) => {
    if (timeline.length < 2) return '0h 0m';
    const start = new Date(timeline[0].timestamp);
    const end = new Date(timeline[timeline.length - 1].timestamp);
    const diff = differenceInMinutes(end, start);
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="flex gap-8 h-full">
      <div className="w-1/3 space-y-4">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assigned Clients</h3>
        <div className="space-y-2">
          {assignments.map(a => (
            <button
              key={a.id}
              onClick={() => setSelected(a)}
              className={cn(
                "w-full text-left p-4 rounded-xl border transition-all",
                selected?.id === a.id ? "bg-white border-[#4C1D95] shadow-md" : "bg-white border-gray-100 hover:border-gray-200"
              )}
            >
              <h4 className="font-bold text-sm uppercase">{a.borrowerName}</h4>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">{a.accountType} • {a.status}</p>
            </button>
          ))}
          {assignments.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-400 text-xs">No active assignments</div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-8 overflow-y-auto">
        {selected ? (
          <div className="space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-[#4C1D95] uppercase">{selected.borrowerName}</h2>
                <p className="text-xs text-gray-400 uppercase tracking-widest">CI Officer: {selected.ciOfficerName}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Total Turnaround Time</p>
                <p className="text-lg font-black text-[#4C1D95]">{calculateTAT(selected.timeline)}</p>
              </div>
            </div>

            {/* Timeline Visualization */}
            <div className="relative pt-8 pb-12">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2"></div>
              <div className="flex justify-between relative z-10">
                {['Assigned', ...steps].map((step, i) => {
                  const stepData = selected.timeline.find(t => t.step === step);
                  const isCompleted = !!stepData;
                  return (
                    <div key={step} className="flex flex-col items-center space-y-2 w-24">
                      <div className={cn(
                        "w-6 h-6 rounded-full border-4 flex items-center justify-center transition-all",
                        isCompleted ? "bg-green-500 border-green-100" : "bg-white border-gray-100"
                      )}>
                        {isCompleted && <Check size={12} className="text-white" />}
                      </div>
                      <span className={cn(
                        "text-[8px] font-bold text-center uppercase tracking-tighter",
                        isCompleted ? "text-gray-900" : "text-gray-300"
                      )}>{step}</span>
                      {stepData && (
                        <span className="text-[8px] text-gray-400">{format(new Date(stepData.timestamp), 'h:mm a')}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Timeline */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Timeline</h3>
              <div className="space-y-3">
                {selected.timeline.map((t, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="font-bold uppercase text-gray-600">{t.step}</span>
                    <span className="text-gray-400">{format(new Date(t.timestamp), 'M/d/yyyy, h:mm:ss a')}</span>
                  </div>
                ))}
                {selected.status !== 'Completed' && selected.status !== 'Approved' && selected.status !== 'Denied' && user.role === 'user' && (
                  <button 
                    onClick={() => handleNextStep(selected)}
                    className="w-full py-3 bg-[#4C1D95] text-white font-bold rounded-lg hover:bg-[#3B1575] transition-colors uppercase tracking-widest text-xs mt-4"
                  >
                    Mark Next Step as Done
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4">
            <Search size={48} />
            <p className="text-xs uppercase tracking-[0.2em]">Select a client to view status</p>
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
    const q = query(collection(db, 'assignments'), where('status', '==', 'Completed'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Assignment)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleApprove = async () => {
    if (!selected) return;
    await updateDoc(doc(db, 'assignments', selected.id), {
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
  };

  const handleDeny = async () => {
    if (!selected) return;
    await updateDoc(doc(db, 'assignments', selected.id), {
      status: 'Denied',
      crecomComments: processData.comments,
      timeline: [...selected.timeline, { step: 'Denied', timestamp: new Date().toISOString() }]
    });
    setSelected(null);
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
    const q = query(collection(db, 'adminKeys'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setKeys(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  const generateKey = async () => {
    setLoading(true);
    const newKey = Math.floor(1000 + Math.random() * 9000).toString();
    await setDoc(doc(db, 'adminKeys', newKey), {
      key: newKey,
      used: false,
      createdBy: user.uid,
      createdAt: new Date().toISOString()
    });
    setLoading(false);
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
    didExplainDeductions: false,
    netIncome: '',
    ndiPercentage: 30
  });

  useEffect(() => {
    const q = query(collection(db, 'assignments'), where('status', '==', 'Approved'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Assignment)));
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async () => {
    if (!selected) return;
    const ndiValue = (Number(survey.netIncome) * survey.ndiPercentage) / 100;
    await updateDoc(doc(db, 'assignments', selected.id), {
      netIncome: Number(survey.netIncome),
      ndiPercentage: survey.ndiPercentage,
      ndiValue,
      validationResults: {
        didAnswerCalls: survey.didAnswerCalls,
        didReceiveProceeds: survey.didReceiveProceeds,
        didExplainPN: survey.didExplainPN,
        didExplainDeductions: survey.didExplainDeductions
      },
      status: 'Completed' // Move back to completed or a final state
    });
    setSelected(null);
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Net Income</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
                      value={survey.netIncome}
                      onChange={e => setSurvey({...survey, netIncome: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">NDI %</label>
                    <select 
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
                      value={survey.ndiPercentage}
                      onChange={e => setSurvey({...survey, ndiPercentage: Number(e.target.value) as any})}
                    >
                      <option value={30}>30%</option>
                      <option value={40}>40%</option>
                      <option value={50}>50%</option>
                    </select>
                  </div>
                </div>

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
