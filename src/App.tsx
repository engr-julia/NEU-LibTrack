import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Search, 
  ArrowLeft,
  CheckCircle2,
  Library,
  ChevronRight,
  Clock,
  School,
  BookOpen,
  X,
  Info,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  Ban,
  Mail,
  User,
  Building,
  Briefcase,
  Save,
  Edit2,
  Download,
  Filter,
  Calendar,
  TrendingUp,
  Activity,
  FileText,
  MoreVertical,
  ChevronLeft,
  Trash2,
  Database,
  RefreshCw,
  History,
  AlertTriangle,
  Lock
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { format, subDays, isToday, isThisWeek } from 'date-fns';
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
  Cell,
  LineChart,
  Line
} from 'recharts';

import { cn } from './lib/utils';
import { College, VisitReason, VisitorLog, KioskState, UserRole, UserCategory, AppUser } from './types';
import { 
  addVisitorLog, 
  subscribeToLogs, 
  subscribeToBlockedUsers, 
  toggleBlockUser,
  getAppUser,
  createAppUser,
  updateAppUser,
  subscribeToAppUser,
  subscribeToAllUsers,
  logAdminAction,
  softDeleteVisitorLog,
  softDeleteLog,
  restoreLog,
  permanentDeleteLog,
  clearAllLogs,
  softDeleteAllLogs,
  bulkDeleteLogs,
  createBackup,
  subscribeToBackups,
  promoteUserToAdmin,
  restoreBackup,
  updateUserRole
} from './services/firestoreService';

import { auth, googleProvider } from './firebase';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';

// --- Constants ---
const NEU_LOGO_URL = "NEU logo.JPG";

// --- Components ---

const Logo = ({ className = "w-24 h-24" }: { className?: string }) => {
  const [error, setError] = useState(false);
  
  if (error) {
    return (
      <div className={cn("flex items-center justify-center bg-neu-green/10 rounded-full", className)}>
        <Library className="text-neu-green w-1/2 h-1/2" />
      </div>
    );
  }

  return (
    <img 
      src={NEU_LOGO_URL} 
      alt="NEU Logo" 
      className={cn("object-contain", className)}
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
    />
  );
};

const Button = ({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button 
    className={cn(
      "px-6 py-3 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
      className
    )} 
    {...props} 
  />
);

const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    className={cn(
      "w-full px-6 py-4 rounded-xl border-2 border-slate-200 focus:border-neu-green focus:outline-none text-xl transition-all bg-white/80 backdrop-blur-sm",
      className
    )}
    {...props}
  />
);

const RulesModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-overlay"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="modal-content"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
            <div className="flex items-center gap-3 text-neu-green">
              <Info size={24} />
              <h3 className="text-2xl font-bold">Library House Rules</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>
          <div className="p-8 overflow-y-auto space-y-6 text-slate-700">
            <section className="space-y-3">
              <h4 className="font-bold text-lg text-slate-900">General Conduct</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li>Maintain silence at all times. Group discussions should be held in designated areas.</li>
                <li>Eating and drinking (except water in spill-proof containers) are strictly prohibited inside the library.</li>
                <li>Handle all library materials and equipment with care.</li>
                <li>Personal belongings should not be left unattended. The library is not responsible for any loss.</li>
              </ul>
            </section>
            <section className="space-y-3">
              <h4 className="font-bold text-lg text-slate-900">Visitor Logging</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li>All visitors must log their entry using the LibTrack kiosk.</li>
                <li>Provide accurate information (Name, College, and Purpose of Visit).</li>
                <li>Logging in for another person is strictly prohibited.</li>
              </ul>
            </section>
            <section className="space-y-3">
              <h4 className="font-bold text-lg text-slate-900">Computer & Facility Use</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li>Computers are for academic and research purposes only.</li>
                <li>Respect the time limits set for computer usage during peak hours.</li>
                <li>Return chairs and materials to their proper places before leaving.</li>
              </ul>
            </section>
          </div>
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
            <Button onClick={onClose} className="bg-neu-green text-white px-8">
              I Understand
            </Button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// --- Kiosk Pages ---

const KioskHome = ({ onNext, savedName, userData }: { onNext: (data: { name: string; email: string }) => void; savedName?: string; userData?: AppUser | null }) => {
  const [input, setInput] = useState(savedName || '');
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const { logout, user, role } = useAuth();
  const navigate = useNavigate();
  
  const isAdmin = role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin');
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (savedName) {
      setInput(savedName);
    }
  }, [savedName]);

  const handleProceed = () => {
    if (isAdmin) {
      alert("Admins cannot log visits as users.");
      navigate('/admin');
      return;
    }
    if (!input) return;
    const isEmail = input.includes('@');
    onNext({
      name: savedName || (isEmail ? input.split('@')[0] : input),
      email: user?.email || (isEmail ? input : `${input.toLowerCase().replace(' ', '.')}@neu.edu.ph`)
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto text-center space-y-12 py-12"
    >
      <div className="space-y-6">
        <motion.div 
          initial={{ scale: 0.8, rotate: -5 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 15 }}
          className="relative inline-block"
        >
          <div className="absolute -inset-4 bg-neu-green/10 rounded-full blur-2xl animate-pulse" />
          <Logo className="w-40 h-40 relative z-10 drop-shadow-2xl" />
        </motion.div>
        <div className="space-y-2">
          <h1 className="text-6xl font-black tracking-tight text-slate-900">
            NEU <span className="text-neu-green">LibTrack</span>
          </h1>
          <p className="text-xl text-slate-500 font-medium">New Era University Library Visitor System</p>
        </div>
      </div>

      <div className="space-y-8 bg-white/40 p-10 rounded-[2.5rem] border border-white/60 backdrop-blur-md shadow-xl">
        {isAdmin ? (
          <div className="space-y-6 py-4">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Admin Mode Active</h3>
              <p className="text-slate-500">Administrators are restricted from logging library visits. Please use the dashboard to manage the system.</p>
            </div>
            <Button 
              onClick={() => navigate('/admin')}
              className="w-full bg-slate-900 text-white py-4"
            >
              Go to Admin Dashboard
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Input 
              placeholder={savedName ? "Your Registered Name" : "Enter Full Name or Student ID"} 
              value={input}
              onChange={(e) => !savedName && setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleProceed()}
              autoFocus={!savedName}
              disabled={!!savedName}
              className={cn(
                "text-center h-20 text-2xl",
                savedName && "bg-slate-50 border-slate-100 text-slate-500 cursor-not-allowed"
              )}
            />
            <Button 
              onClick={handleProceed}
              disabled={!input}
              className="w-full bg-neu-green text-white text-2xl py-6 shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-emerald-300 transition-all"
            >
              {savedName ? "Proceed to Log Visit" : "Register Name & Proceed"}
            </Button>
            
            {savedName && (
              <button 
                onClick={() => navigate('/profile')}
                className="w-full py-2 text-slate-400 hover:text-neu-green transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <User size={16} /> Update Profile Information
              </button>
            )}
          </div>
        )}

        {!isAdmin && (
          <p className="text-slate-500 text-sm">
            By clicking proceed, you agree to follow the{' '}
            <button 
              onClick={() => setIsRulesOpen(true)}
              className="text-neu-green font-bold hover:underline underline-offset-4"
            >
              Library Rules and Regulations
            </button>
          </p>
        )}
      </div>

      <button 
        onClick={handleLogout}
        className="flex items-center gap-2 mx-auto text-slate-400 hover:text-red-500 transition-colors font-medium"
      >
        <LogOut size={20} />
        Sign Out from LibTrack
      </button>

      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* User Profile Overlay (Kiosk) */}
      {user && (
        <button 
          onClick={() => navigate('/profile')}
          className="fixed top-6 right-6 flex items-center gap-3 bg-white/80 backdrop-blur-md p-2 pr-4 rounded-full border border-white shadow-lg hover:bg-white transition-all group"
        >
          {user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border-2 border-neu-green/20 group-hover:border-neu-green transition-colors" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-10 h-10 bg-neu-green text-white rounded-full flex items-center justify-center font-bold">
              {user.email?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">{userData?.name || user.email?.split('@')[0]}</p>
            <p className="text-[10px] text-slate-500 flex items-center gap-1">
              View Profile <ChevronRight size={8} />
            </p>
          </div>
        </button>
      )}
    </motion.div>
  );
};

const ProfileSection = ({ user, userData, onBack }: { user: any; userData: AppUser | null; onBack: () => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: userData?.name || '',
    category: userData?.category || 'Student' as UserCategory,
    college: userData?.college || 'Other' as College
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        category: userData.category || 'Student',
        college: userData.college || 'Other'
      });
    }
  }, [userData]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateAppUser(user.uid, formData);
      setIsEditing(false);
    } catch (error) {
      alert("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const categories: UserCategory[] = ['Student', 'Faculty', 'Staff', 'Employee'];
  const colleges: College[] = [
    'College of Engineering',
    'College of Computer Studies',
    'College of Business Administration',
    'College of Education',
    'Library',
    'Administration',
    'Accounting Office',
    'HR Office',
    'Registrar',
    'Other'
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-8 py-8"
    >
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={32} />
        </button>
        <h2 className="text-4xl font-bold">My Profile</h2>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="bg-neu-green/5 p-10 flex flex-col items-center text-center space-y-4 border-b border-slate-100">
          <div className="relative">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-32 h-32 rounded-full border-4 border-white shadow-lg" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-32 h-32 bg-neu-green text-white rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white shadow-lg">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
            )}
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="absolute bottom-0 right-0 p-3 bg-white rounded-full shadow-md border border-slate-100 text-neu-green hover:bg-neu-green hover:text-white transition-all"
            >
              {isEditing ? <X size={20} /> : <Edit2 size={20} />}
            </button>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">{userData?.name || 'No Name Set'}</h3>
            <p className="text-slate-500 font-medium">{user?.email}</p>
          </div>
        </div>

        <div className="p-10 space-y-8">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <User size={14} /> Full Name
              </label>
              {isEditing ? (
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                  className="h-14 text-lg"
                />
              ) : (
                <p className="text-xl font-medium text-slate-700 h-14 flex items-center px-4 bg-slate-50 rounded-xl border border-slate-100">
                  {userData?.name || 'Not provided'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Briefcase size={14} /> User Category
              </label>
              {isEditing ? (
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as UserCategory })}
                  className="w-full h-14 px-4 rounded-xl border-2 border-slate-100 focus:border-neu-green focus:outline-none text-lg bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              ) : (
                <p className="text-xl font-medium text-slate-700 h-14 flex items-center px-4 bg-slate-50 rounded-xl border border-slate-100">
                  {userData?.category || 'Not provided'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Building size={14} /> College / Office
              </label>
              {isEditing ? (
                <select 
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value as College })}
                  className="w-full h-14 px-4 rounded-xl border-2 border-slate-100 focus:border-neu-green focus:outline-none text-lg bg-white"
                >
                  {colleges.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              ) : (
                <p className="text-xl font-medium text-slate-700 h-14 flex items-center px-4 bg-slate-50 rounded-xl border border-slate-100">
                  {userData?.college || 'Not provided'}
                </p>
              )}
            </div>
          </div>

          {isEditing && (
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-neu-green text-white py-4 text-lg shadow-lg shadow-emerald-100"
            >
              {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const CategorySelection = ({ onSelect, onBack }: { onSelect: (category: UserCategory) => void; onBack: () => void }) => {
  const categories: UserCategory[] = ['Student', 'Faculty', 'Staff', 'Employee'];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-4xl mx-auto space-y-8 py-8"
    >
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={32} />
        </button>
        <h2 className="text-4xl font-bold">Select your Category</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className="group relative bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-neu-green hover:shadow-2xl hover:shadow-emerald-100 transition-all text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="text-neu-green" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{cat}</h3>
            <p className="text-slate-500">Official {cat} of New Era University</p>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

const CollegeSelection = ({ onSelect, onBack }: { onSelect: (college: College) => void; onBack: () => void }) => {
  const colleges: College[] = [
    'College of Engineering',
    'College of Computer Studies',
    'College of Business Administration',
    'College of Education',
    'Library',
    'Administration',
    'Accounting Office',
    'HR Office',
    'Registrar',
    'Other'
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-4xl mx-auto space-y-8 py-8"
    >
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={32} />
        </button>
        <h2 className="text-4xl font-bold">Select your College / Office</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {colleges.map((college) => (
          <button
            key={college}
            onClick={() => onSelect(college)}
            className="kiosk-button group"
          >
            <School size={40} className="mb-4 text-slate-400 group-hover:text-neu-blue transition-colors" />
            <span className="text-xl font-semibold">{college}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

const ReasonSelection = ({ onSelect, onBack, isSubmitting }: { onSelect: (reason: VisitReason, otherReason?: string) => void; onBack: () => void; isSubmitting?: boolean }) => {
  const [selectedReason, setSelectedReason] = useState<VisitReason | null>(null);
  const [otherReason, setOtherReason] = useState('');

  const reasons: VisitReason[] = [
    'Reading',
    'Research',
    'Computer Use',
    'Studying',
    'Printing',
    'Borrowing Book',
    'Other'
  ];

  const handleSelect = (reason: VisitReason) => {
    if (isSubmitting) return;
    if (reason === 'Other') {
      setSelectedReason('Other');
    } else {
      onSelect(reason);
    }
  };

  const handleSubmitOther = () => {
    if (isSubmitting) return;
    if (otherReason.trim()) {
      onSelect('Other', otherReason.trim());
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-4xl mx-auto space-y-8 py-8"
    >
      <div className="flex items-center gap-4">
        <button onClick={onBack} disabled={isSubmitting} className="p-2 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50">
          <ArrowLeft size={32} />
        </button>
        <h2 className="text-4xl font-bold">What is your reason for visiting?</h2>
      </div>

      {isSubmitting && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-neu-green border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 font-medium">Recording your visit...</p>
          </div>
        </div>
      )}

      {!isSubmitting && (
        <>
          {selectedReason === 'Other' ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-10 rounded-[2.5rem] border-2 border-neu-green shadow-2xl space-y-6"
            >
              <div className="space-y-2">
                <label className="text-xl font-bold text-slate-900">Please specify your reason:</label>
                <Input 
                  placeholder="Type your reason here..." 
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  autoFocus
                  className="h-16 text-xl"
                />
              </div>
              <div className="flex gap-4">
                <Button 
                  onClick={() => setSelectedReason(null)}
                  className="flex-1 bg-slate-100 text-slate-600 py-4"
                >
                  Back to List
                </Button>
                <Button 
                  onClick={handleSubmitOther}
                  disabled={!otherReason.trim()}
                  className="flex-2 bg-neu-green text-white py-4"
                >
                  Confirm Reason
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reasons.map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleSelect(reason)}
                  className="kiosk-button group"
                >
                  <BookOpen size={40} className="mb-4 text-slate-400 group-hover:text-neu-blue transition-colors" />
                  <span className="text-xl font-semibold">{reason}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

const SuccessScreen = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto text-center space-y-8 py-24"
    >
      <div className="flex justify-center">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200 }}
          className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-100"
        >
          <CheckCircle2 size={64} />
        </motion.div>
      </div>
      <div className="space-y-4">
        <h1 className="text-5xl font-bold text-slate-900">Welcome to NEU Library!</h1>
        <p className="text-2xl text-slate-500">Your visit has been successfully recorded.</p>
      </div>
      <p className="text-slate-400">Resetting in a few seconds...</p>
    </motion.div>
  );
};

const VerificationPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = user?.email || location.state?.email || "your email";

  const handleLoginRedirect = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50/30 p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl border border-emerald-100 text-center"
      >
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4">Verify Your Email</h2>
        <p className="text-slate-600 mb-8 text-lg">
          We have sent you a verification email to <span className="font-bold text-slate-900">{email}</span>. Please verify it and log in.
        </p>
        <Button 
          onClick={handleLoginRedirect}
          className="w-full bg-neu-green text-white py-4 text-lg shadow-lg shadow-emerald-100 hover:bg-emerald-700"
        >
          Login
        </Button>
      </motion.div>
    </div>
  );
};

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!email.toLowerCase().endsWith('@neu.edu.ph')) {
        setError("Please use your official @neu.edu.ph account to access the system.");
        setLoading(false);
        return;
      }
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      await signOut(auth); // Do not sign them in automatically
      navigate('/verify', { state: { email } });
    } catch (err: any) {
      let message = 'Registration failed';
      if (err.code === 'auth/email-already-in-use') message = 'Email already in use';
      if (err.code === 'auth/weak-password') message = 'Password is too weak';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50/30 p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl border border-emerald-100"
      >
        <div className="text-center mb-10">
          <Logo className="w-24 h-24 mx-auto mb-4" />
          <h2 className="text-3xl font-black text-slate-900">NEU LibTrack</h2>
          <p className="text-slate-500">Create your account</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
            <Input 
              type="email" 
              placeholder="your@email.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="text-base h-14"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="text-base h-14"
            />
          </div>
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-neu-green text-white py-4 text-lg shadow-lg shadow-emerald-100 hover:bg-emerald-700"
          >
            {loading ? 'Creating account...' : 'Register'}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm font-medium">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="text-neu-green font-bold hover:underline">
              Sign In
            </button>
          </p>
        </div>

        <button 
          onClick={() => navigate('/')}
          className="w-full mt-6 text-slate-400 hover:text-slate-600 text-sm font-medium flex items-center justify-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Kiosk
        </button>
      </motion.div>
    </div>
  );
};

// --- Admin Components ---

// --- Admin Components ---

const PasswordReauthModal = ({ isOpen, onClose, onConfirm, title, message }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: (password: string) => Promise<void>;
  title: string;
  message: string;
}) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!password) return;
    setLoading(true);
    setError('');
    try {
      await onConfirm(password);
      setPassword('');
      onClose();
    } catch (err: any) {
      setError('Incorrect password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-overlay"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="modal-content max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-red-50/50">
              <div className="flex items-center gap-3 text-red-600">
                <Lock size={24} />
                <h3 className="text-xl font-bold">{title}</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-slate-600">{message}</p>
              
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Admin Password</label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password to confirm"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-500 focus:outline-none transition-all"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              <Button onClick={onClose} className="flex-1 bg-white text-slate-600 border border-slate-200">
                Cancel
              </Button>
              <Button 
                onClick={handleConfirm} 
                disabled={loading || !password}
                className="flex-1 bg-red-600 text-white shadow-lg shadow-red-100"
              >
                {loading ? 'Verifying...' : 'Confirm Action'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const RecycleBin = ({ logs }: { logs: VisitorLog[] }) => {
  const { user: adminUser } = useAuth();
  const [isReauthOpen, setIsReauthOpen] = useState(false);
  const [reauthAction, setReauthAction] = useState<{ type: 'restore' | 'delete', logId: string } | null>(null);

  const handleActionClick = async (type: 'restore' | 'delete', logId: string) => {
    if (type === 'restore') {
      if (!adminUser?.email) return;
      const loadingToast = toast.loading("Restoring log...");
      try {
        await restoreLog(logId, adminUser.email);
        toast.success("Log restored successfully.", { id: loadingToast });
      } catch (error) {
        console.error("Restore error:", error);
        toast.error("Failed to restore log.", { id: loadingToast });
      }
    } else {
      setReauthAction({ type, logId });
      setIsReauthOpen(true);
    }
  };

  const handleConfirmAction = async (password: string) => {
    if (!reauthAction || !adminUser?.email) return;

    const loadingToast = toast.loading(reauthAction.type === 'delete' ? "Permanently deleting..." : "Restoring...");
    try {
      // Check if user is Google user
      const isGoogleUser = auth.currentUser?.providerData.some(p => p.providerId === 'google.com');
      
      if (!isGoogleUser) {
        // Re-authenticate for email/password users
        const credential = EmailAuthProvider.credential(adminUser.email, password);
        await reauthenticateWithCredential(auth.currentUser!, credential);
      }

      if (reauthAction.type === 'delete') {
        await permanentDeleteLog(reauthAction.logId, adminUser.email);
        toast.success("Log permanently deleted.", { id: loadingToast });
      }
      setIsReauthOpen(false);
    } catch (error) {
      console.error("Re-auth action error:", error);
      toast.error("Action failed. Please check your password.", { id: loadingToast });
    }
  };

  return (
    <div className="space-y-8">
      <div className="overflow-x-auto admin-card">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="pb-4 font-bold text-slate-500 text-sm uppercase tracking-wider">Visitor</th>
              <th className="pb-4 font-bold text-slate-500 text-sm uppercase tracking-wider">College</th>
              <th className="pb-4 font-bold text-slate-500 text-sm uppercase tracking-wider">Reason</th>
              <th className="pb-4 font-bold text-slate-500 text-sm uppercase tracking-wider">Original Date</th>
              <th className="pb-4 font-bold text-slate-500 text-sm uppercase tracking-wider">Deleted Info</th>
              <th className="pb-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center text-slate-400 font-medium">
                  Recycle bin is empty.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      {log.photoURL ? (
                        <img src={log.photoURL} alt="" className="w-10 h-10 rounded-full border border-slate-100" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center font-bold text-xs">
                          {log.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900">{log.name}</p>
                        <p className="text-xs text-slate-500">{log.email}</p>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase">{log.category}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="text-sm text-slate-600">{log.college}</span>
                  </td>
                  <td className="py-4">
                    <span className="text-sm text-slate-600">{log.reason}</span>
                  </td>
                  <td className="py-4">
                    <p className="text-sm text-slate-900">{format(log.timestamp, 'MMM dd, yyyy')}</p>
                  </td>
                  <td className="py-4">
                    <div className="text-xs">
                      <p className="text-red-600 font-bold">Deleted: {log.deletedAt ? format(log.deletedAt, 'MMM dd, HH:mm') : 'N/A'}</p>
                      <p className="text-slate-400">By: {log.deletedBy || 'Unknown'}</p>
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleActionClick('restore', log.id)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Restore Log"
                      >
                        <RefreshCw size={20} />
                      </button>
                      <button 
                        onClick={() => handleActionClick('delete', log.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Permanently Delete"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PasswordReauthModal 
        isOpen={isReauthOpen}
        onClose={() => setIsReauthOpen(false)}
        onConfirm={handleConfirmAction}
        title={reauthAction?.type === 'restore' ? "Restore Record" : "Permanent Deletion"}
        message={reauthAction?.type === 'restore' 
          ? "Please enter your password to restore this record to the active logs." 
          : "This will permanently delete the record from Firestore. This action cannot be undone."}
      />
    </div>
  );
};

const BackupManagement = ({ logs }: { logs: VisitorLog[] }) => {
  const { user: adminUser, role } = useAuth();
  const [backups, setBackups] = useState<any[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isReauthOpen, setIsReauthOpen] = useState(false);
  const [selectedBackupId, setSelectedBackupId] = useState<string | null>(null);

  useEffect(() => {
    if (adminUser && role === 'admin') {
      const unsubscribe = subscribeToBackups(setBackups);
      return () => unsubscribe();
    }
  }, [adminUser, role]);

  const handleManualBackup = async () => {
    if (!adminUser?.email) return;
    setIsBackingUp(true);
    const loadingToast = toast.loading("Creating system backup...");
    try {
      await createBackup(logs, adminUser.email, 'manual');
      toast.success("Backup created successfully!", { id: loadingToast });
    } catch (error) {
      console.error("Backup error:", error);
      toast.error("Failed to create backup.", { id: loadingToast });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreClick = (backupId: string) => {
    setSelectedBackupId(backupId);
    setIsReauthOpen(true);
  };

  const handleConfirmRestore = async (password: string) => {
    if (!adminUser?.email || !selectedBackupId) return;
    
    const loadingToast = toast.loading("Verifying and restoring backup...");
    try {
      // Re-authenticate
      const isGoogleUser = auth.currentUser?.providerData.some(p => p.providerId === 'google.com');
      if (!isGoogleUser) {
        const credential = EmailAuthProvider.credential(adminUser.email, password);
        await reauthenticateWithCredential(auth.currentUser!, credential);
      }

      setIsBackingUp(true);
      await restoreBackup(selectedBackupId, adminUser.email);
      toast.success("Backup restored successfully!", { id: loadingToast });
      setIsReauthOpen(false);
    } catch (error) {
      console.error("Restore error:", error);
      toast.error("Action failed. Please check your password.", { id: loadingToast });
    } finally {
      setIsBackingUp(false);
      setSelectedBackupId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">System Backups</h2>
          <p className="text-slate-500">Manage and view historical data snapshots.</p>
        </div>
        <Button 
          onClick={handleManualBackup}
          disabled={isBackingUp}
          className="bg-neu-green text-white flex items-center gap-2 shadow-lg shadow-emerald-100"
        >
          <Database size={20} />
          {isBackingUp ? 'Creating Backup...' : 'Create Manual Backup'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {backups.map((backup) => (
          <div key={backup.id} className="admin-card space-y-4">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-emerald-50 text-neu-green rounded-xl">
                <History size={24} />
              </div>
              <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-lg uppercase">
                {backup.recordCount} Records
              </span>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Backup Date</p>
              <h4 className="text-lg font-bold text-slate-900">
                {backup.backupDate ? format(backup.backupDate, 'MMMM dd, yyyy') : 'Processing...'}
              </h4>
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm text-slate-400">
                  {backup.backupDate ? format(backup.backupDate, 'HH:mm:ss') : ''}
                </p>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                  backup.type === 'auto' ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                )}>
                  {backup.type || 'manual'}
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <User size={12} />
              <span>By: {backup.triggeredBy || 'System'}</span>
            </div>
            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <button className="flex-1 py-2 text-xs font-bold text-slate-500 hover:text-neu-green transition-colors">
                View Details
              </button>
              <button 
                onClick={() => handleRestoreClick(backup.id)}
                disabled={isBackingUp}
                className="flex-1 py-2 text-xs font-bold text-neu-green hover:underline disabled:opacity-50"
              >
                {isBackingUp && selectedBackupId === backup.id ? 'Restoring...' : 'Restore Snapshot'}
              </button>
            </div>
          </div>
        ))}
        {backups.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-slate-100">
            <Database size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">No backups found.</p>
          </div>
        )}
      </div>

      <PasswordReauthModal 
        isOpen={isReauthOpen}
        onClose={() => setIsReauthOpen(false)}
        onConfirm={handleConfirmRestore}
        title="Restore Backup Confirmation"
        message="This will overwrite or add records to the current logs from this backup snapshot. Please verify your admin password."
      />
    </div>
  );
};

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const links = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Visitor Logs', path: '/admin/logs', icon: Users },
    { name: 'User Search', path: '/admin/users', icon: Search },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Recycle Bin', path: '/admin/recycle-bin', icon: Trash2 },
    { name: 'Backups', path: '/admin/backups', icon: Database },
    { name: 'Admin Management', path: '/admin/promote', icon: ShieldCheck },
    { name: 'User Guide', path: '/admin/guide', icon: Info },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-bottom border-slate-100 flex items-center gap-3">
        <Logo className="w-8 h-8" />
        <span className="font-bold text-xl tracking-tight">LibTrack</span>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors",
              location.pathname === link.path 
                ? "bg-emerald-50 text-neu-green" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <link.icon size={20} />
            {link.name}
          </button>
        ))}
      </nav>
      
      {/* Profile Section */}
      <div className="p-4 mx-4 mb-2 bg-slate-50 rounded-2xl flex items-center gap-3 border border-slate-100">
        {user?.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-10 h-10 bg-neu-green/10 text-neu-green rounded-full flex items-center justify-center font-bold">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-900 truncate">{user?.email?.split('@')[0]}</p>
          <p className="text-[10px] text-slate-500 truncate">Administrator</p>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 space-y-2">
        <button 
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={20} />
          Exit Admin
        </button>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <X size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, trend, color = "emerald" }: { title: string; value: string | number; icon: any; trend?: string; color?: string }) => (
  <div className="admin-card">
    <div className="flex justify-between items-start mb-4">
      <div className={cn(
        "p-3 rounded-xl",
        color === "emerald" ? "bg-emerald-50 text-neu-green" : 
        color === "blue" ? "bg-blue-50 text-blue-600" :
        color === "amber" ? "bg-amber-50 text-amber-600" :
        "bg-slate-50 text-slate-600"
      )}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className="text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg">
          {trend}
        </span>
      )}
    </div>
    <p className="text-slate-500 text-sm font-medium">{title}</p>
    <h3 className="text-3xl font-bold mt-1">{value}</h3>
  </div>
);

const ExportButton = ({ data, filename }: { data: any[], filename: string }) => {
  const { user } = useAuth();
  
  const handleExport = async () => {
    if (!data.length) return;
    
    // Log admin action
    if (user?.email) {
      await logAdminAction(user.email, 'EXPORT_DATA', { filename, recordCount: data.length });
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => 
      Object.values(obj).map(val => 
        typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
      ).join(',')
    );
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button onClick={handleExport} className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50">
      <Download size={18} />
      Export CSV
    </Button>
  );
};

const AdminUserSearch = ({ users }: { users: AppUser[] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const { user: adminUser } = useAuth();
  const navigate = useNavigate();

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCollege = collegeFilter === 'All' || u.college === collegeFilter;
    const matchesCategory = categoryFilter === 'All' || u.category === categoryFilter;
    return matchesSearch && matchesCollege && matchesCategory;
  });

  useEffect(() => {
    if (searchTerm || collegeFilter !== 'All' || categoryFilter !== 'All') {
      const timer = setTimeout(() => {
        if (adminUser?.email) {
          logAdminAction(adminUser.email, 'USER_SEARCH', { searchTerm, collegeFilter, categoryFilter });
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, collegeFilter, categoryFilter, adminUser]);

  const exportData = filteredUsers.map(u => ({
    Name: u.name || 'N/A',
    Email: u.email,
    Category: u.category || 'N/A',
    College: u.college || 'N/A',
    JoinedDate: format(u.createdAt, 'yyyy-MM-dd')
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search users by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-neu-green focus:outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={collegeFilter}
            onChange={(e) => setCollegeFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none text-sm"
          >
            <option value="All">All Colleges</option>
            <option value="College of Engineering">Engineering</option>
            <option value="College of Computer Studies">Computer Studies</option>
            <option value="College of Business Administration">Business</option>
            <option value="College of Education">Education</option>
            <option value="Library">Library</option>
            <option value="Administration">Administration</option>
          </select>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none text-sm"
          >
            <option value="All">All Categories</option>
            <option value="Student">Student</option>
            <option value="Faculty">Faculty</option>
            <option value="Staff">Staff</option>
            <option value="Employee">Employee</option>
          </select>
          <ExportButton data={exportData} filename="UserRecords" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(u => (
          <div key={u.uid} className="admin-card flex items-center gap-4 hover:border-neu-green transition-colors cursor-pointer group">
            {u.photoURL ? (
              <img src={u.photoURL} alt="" className="w-12 h-12 rounded-full border border-slate-100" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-12 h-12 bg-emerald-100 text-neu-green rounded-full flex items-center justify-center font-bold text-xl group-hover:bg-neu-green group-hover:text-white transition-colors">
                {u.name?.charAt(0) || u.email.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-900 truncate">{u.name || 'No Name'}</h4>
              <p className="text-xs text-slate-500 truncate">{u.email}</p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">{u.category || 'N/A'}</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-neu-green rounded text-[10px] font-bold uppercase truncate max-w-[100px]">{u.college || 'N/A'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filteredUsers.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100">
          <p className="text-slate-400 font-medium">No users found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

const AdminLogTable = ({ logs, blockedEmails, onToggleBlock, showDelete = true, loading }: { logs: VisitorLog[], blockedEmails: string[], onToggleBlock: (email: string) => void, showDelete?: boolean, loading?: boolean }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [dateRange, setDateRange] = useState<{ start: string, end: string }>({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { user: adminUser } = useAuth();

  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isReauthOpen, setIsReauthOpen] = useState(false);
  const [reauthAction, setReauthAction] = useState<'clear' | 'bulk'>('clear');

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse p-8">
        <div className="h-12 bg-slate-100 rounded-xl" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-slate-50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const filteredLogs = logs
    .filter(log => {
      const matchesSearch = log.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCollege = collegeFilter === 'All' || log.college === collegeFilter;
      const matchesCategory = categoryFilter === 'All' || log.category === categoryFilter;
      
      let matchesDate = true;
      if (dateRange.start) {
        matchesDate = matchesDate && log.timestamp >= new Date(dateRange.start);
      }
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && log.timestamp <= endDate;
      }
      
      return matchesSearch && matchesCollege && matchesCategory && matchesDate;
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') return b.timestamp.getTime() - a.timestamp.getTime();
      return a.timestamp.getTime() - b.timestamp.getTime();
    });

  const handleSoftDelete = async (logId: string) => {
    if (!adminUser?.email) return;
    if (window.confirm("Move this log to Recycle Bin?")) {
      const loadingToast = toast.loading("Moving to Recycle Bin...");
      try {
        await softDeleteVisitorLog(logId, adminUser.email);
        toast.success("Log moved to Recycle Bin.", { id: loadingToast });
      } catch (error) {
        console.error("Soft delete error:", error);
        toast.error("Failed to delete log.", { id: loadingToast });
      }
    }
  };

  const handleClearAllClick = () => {
    if (!adminUser?.email || filteredLogs.length === 0) return;
    setReauthAction('clear');
    setIsReauthOpen(true);
  };

  const handleBulkDeleteClick = () => {
    if (!adminUser?.email || selectedLogIds.length === 0) return;
    setReauthAction('bulk');
    setIsReauthOpen(true);
  };

  const handleConfirmReauth = async (password: string) => {
    if (reauthAction === 'clear') {
      await handleConfirmClearAll(password);
    } else {
      await handleConfirmBulkDelete(password);
    }
  };

  const handleConfirmClearAll = async (password: string) => {
    if (!adminUser?.email) return;
    
    const loadingToast = toast.loading("Verifying and clearing logs...");
    try {
      // Re-authenticate
      const isGoogleUser = auth.currentUser?.providerData.some(p => p.providerId === 'google.com');
      if (!isGoogleUser) {
        const credential = EmailAuthProvider.credential(adminUser.email, password);
        await reauthenticateWithCredential(auth.currentUser!, credential);
      }

      setIsDeletingAll(true);
      await clearAllLogs(adminUser.email, filteredLogs);
      toast.success("Visit logs successfully cleared", { id: loadingToast });
      setIsReauthOpen(false);
    } catch (error) {
      console.error("Clear all error:", error);
      toast.error("Action failed. Please check your password.", { id: loadingToast });
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleConfirmBulkDelete = async (password: string) => {
    if (!adminUser?.email) return;
    
    const loadingToast = toast.loading("Verifying and deleting selected logs...");
    try {
      // Re-authenticate
      const isGoogleUser = auth.currentUser?.providerData.some(p => p.providerId === 'google.com');
      if (!isGoogleUser) {
        const credential = EmailAuthProvider.credential(adminUser.email, password);
        await reauthenticateWithCredential(auth.currentUser!, credential);
      }

      setIsBulkDeleting(true);
      const logsToDelete = logs.filter(l => selectedLogIds.includes(l.id));
      await bulkDeleteLogs(adminUser.email, logsToDelete);
      toast.success(`${selectedLogIds.length} logs moved to Recycle Bin`, { id: loadingToast });
      setSelectedLogIds([]);
      setIsReauthOpen(false);
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error("Action failed. Please check your password.", { id: loadingToast });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const toggleSelectLog = (id: string) => {
    setSelectedLogIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLogIds.length === filteredLogs.length) {
      setSelectedLogIds([]);
    } else {
      setSelectedLogIds(filteredLogs.map(l => l.id));
    }
  };

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    if (searchTerm || collegeFilter !== 'All' || categoryFilter !== 'All' || dateRange.start || dateRange.end) {
      const timer = setTimeout(() => {
        if (adminUser?.email) {
          logAdminAction(adminUser.email, 'LOGS_FILTER', { searchTerm, collegeFilter, categoryFilter, dateRange });
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, collegeFilter, categoryFilter, dateRange, adminUser]);

  const exportData = filteredLogs.map(l => ({
    Name: l.name,
    Email: l.email,
    Category: l.category,
    College: l.college,
    Reason: l.reason,
    OtherReason: l.otherReason || '',
    Date: format(l.timestamp, 'yyyy-MM-dd'),
    Time: format(l.timestamp, 'HH:mm')
  }));

  return (
    <>
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-neu-green focus:outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <ExportButton data={exportData} filename="VisitorLogs" />
            {showDelete && (
              <>
                <Button 
                  onClick={handleBulkDeleteClick}
                  disabled={isBulkDeleting || selectedLogIds.length === 0}
                  className="bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100 px-4 py-3 text-sm"
                >
                  <Trash2 size={18} className="mr-2" />
                  {isBulkDeleting ? 'Deleting...' : `Delete Selected (${selectedLogIds.length})`}
                </Button>
                <Button 
                  onClick={handleClearAllClick}
                  disabled={isDeletingAll || filteredLogs.length === 0}
                  className="bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 px-4 py-3 text-sm"
                >
                  <Trash2 size={18} className="mr-2" />
                  {isDeletingAll ? 'Clearing...' : (dateRange.start || dateRange.end ? 'Clear Filtered' : 'Clear All')}
                </Button>
              </>
            )}
            <select 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">College</label>
            <select 
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none text-sm"
            >
              <option value="All">All Colleges</option>
              <option value="College of Engineering">Engineering</option>
              <option value="College of Computer Studies">Computer Studies</option>
              <option value="College of Business Administration">Business</option>
              <option value="College of Education">Education</option>
              <option value="Library">Library</option>
              <option value="Administration">Administration</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Category</label>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none text-sm"
            >
              <option value="All">All Categories</option>
              <option value="Student">Student</option>
              <option value="Faculty">Faculty</option>
              <option value="Staff">Staff</option>
              <option value="Employee">Employee</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Start Date</label>
            <input 
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">End Date</label>
            <input 
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none text-sm"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="pb-4 w-10">
                <input 
                  type="checkbox" 
                  checked={filteredLogs.length > 0 && selectedLogIds.length === filteredLogs.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-neu-green focus:ring-neu-green"
                />
              </th>
              <th className="pb-4 font-bold text-slate-500 text-sm uppercase tracking-wider">Visitor</th>
              <th className="pb-4 font-bold text-slate-500 text-sm uppercase tracking-wider">Category</th>
              <th className="pb-4 font-bold text-slate-500 text-sm uppercase tracking-wider">College</th>
              <th className="pb-4 font-bold text-slate-500 text-sm uppercase tracking-wider">Reason</th>
              <th className="pb-4 font-bold text-slate-500 text-sm uppercase tracking-wider">Date & Time</th>
              <th className="pb-4 font-bold text-slate-500 text-sm uppercase tracking-wider">Status</th>
              <th className="pb-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedLogs.map((log) => {
              const isBlocked = blockedEmails.includes(log.email);
              const isSelected = selectedLogIds.includes(log.id);
              return (
                <tr key={log.id} className={cn("group hover:bg-slate-50/50 transition-colors", isBlocked && "bg-red-50/30", isSelected && "bg-emerald-50/30")}>
                  <td className="py-4">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => toggleSelectLog(log.id)}
                      className="w-4 h-4 rounded border-slate-300 text-neu-green focus:ring-neu-green"
                    />
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      {log.photoURL ? (
                        <img src={log.photoURL} alt="" className="w-10 h-10 rounded-full border border-slate-100" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-10 h-10 bg-emerald-100 text-neu-green rounded-full flex items-center justify-center font-bold text-xs">
                          {log.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900">{log.name}</p>
                        <p className="text-xs text-slate-500">{log.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="px-2 py-1 bg-emerald-50 text-neu-green rounded-lg text-[10px] font-black uppercase tracking-wider">
                      {log.category}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="text-sm text-slate-600">{log.college}</span>
                  </td>
                  <td className="py-4">
                    <div className="flex flex-col gap-1">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold w-fit">
                        {log.reason}
                      </span>
                      {log.otherReason && (
                        <span className="text-[10px] text-slate-400 italic">"{log.otherReason}"</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="text-sm">
                      <p className="text-slate-900">{format(log.timestamp, 'MMM dd, yyyy')}</p>
                      <p className="text-slate-400">{format(log.timestamp, 'HH:mm')}</p>
                    </div>
                  </td>
                  <td className="py-4">
                    {isBlocked ? (
                      <span className="flex items-center gap-1 text-red-600 text-xs font-bold">
                        <Ban size={14} />
                        Blocked
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                        <CheckCircle2 size={14} />
                        Active
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onToggleBlock(log.email)}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          isBlocked 
                            ? "text-emerald-600 hover:bg-emerald-50" 
                            : "text-red-400 hover:text-red-600 hover:bg-red-50"
                        )}
                        title={isBlocked ? "Unblock User" : "Block User"}
                      >
                        {isBlocked ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                      </button>
                      <button 
                        onClick={() => navigate(`/admin/user/${log.id}`)}
                        className="p-2 text-slate-400 hover:text-neu-green hover:bg-emerald-50 rounded-lg transition-all"
                        title="View Details"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex justify-between items-center">
        <p className="text-sm text-slate-500">Showing {paginatedLogs.length} of {filteredLogs.length} entries</p>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50" 
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <div className="flex items-center px-4 font-bold text-neu-green">
            {currentPage} / {totalPages || 1}
          </div>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50" 
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next
          </button>
        </div>
      </div>

      <PasswordReauthModal 
        isOpen={isReauthOpen}
        onClose={() => setIsReauthOpen(false)}
        onConfirm={handleConfirmReauth}
        title={reauthAction === 'clear' ? "Clear Logs Confirmation" : "Bulk Delete Confirmation"}
        message={reauthAction === 'clear' 
          ? `This will move ${filteredLogs.length} records to the Recycle Bin. Please verify your admin password to proceed.`
          : `This will move ${selectedLogIds.length} selected records to the Recycle Bin. Please verify your admin password to proceed.`
        }
      />
    </>
  );
};

// --- Role Detection ---
// This is now handled by AuthContext and Firestore

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      if (!user.emailVerified) {
        navigate('/verify');
        return;
      }
      // Redirection is now handled by AppContent based on role
    }
  }, [user, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Domain restriction check
      if (userCredential.user.email && !userCredential.user.email.toLowerCase().endsWith('@neu.edu.ph')) {
        await signOut(auth);
        alert("Please use your official @neu.edu.ph account to access the system.");
        setError("Unauthorized domain. Use @neu.edu.ph");
        setLoading(false);
        return;
      }

      if (!userCredential.user.emailVerified) {
        navigate('/verify');
        return;
      }
      // Redirection is now handled by AppContent based on role
    } catch (err: any) {
      setError('Email or password is incorrect');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      
      // Domain restriction check
      if (userCredential.user.email && !userCredential.user.email.toLowerCase().endsWith('@neu.edu.ph')) {
        await signOut(auth);
        alert("Please use your official @neu.edu.ph account to access the system.");
        setError("Unauthorized domain. Use @neu.edu.ph");
        setLoading(false);
        return;
      }

      if (!userCredential.user.emailVerified) {
        navigate('/verify');
        return;
      }
      // Redirection is now handled by AppContent based on role
    } catch (err: any) {
      setError('Google Sign-In failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50/30 p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl border border-emerald-100"
      >
        <div className="text-center mb-10">
          <Logo className="w-24 h-24 mx-auto mb-4" />
          <h2 className="text-3xl font-black text-slate-900">NEU LibTrack</h2>
          <p className="text-slate-500">Access the Library System</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
            <Input 
              type="email" 
              placeholder="admin@neu.edu.ph" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="text-base h-14"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="text-base h-14"
            />
          </div>
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-neu-green text-white py-4 text-lg shadow-lg shadow-emerald-100 hover:bg-emerald-700"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm font-medium">
            Don't have an account?{' '}
            <button onClick={() => navigate('/register')} className="text-neu-green font-bold hover:underline">
              Register
            </button>
          </p>
        </div>
        
        <div className="mt-6 flex flex-col gap-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Or continue with</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl border-2 border-slate-200 font-semibold hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" referrerPolicy="no-referrer" />
            Sign in with Google
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm font-medium">
            Login using your NEU credentials
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole?: UserRole }) => {
  const { user, loading, isVerified, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
      } else if (!isVerified) {
        navigate('/verify');
      } else if (allowedRole && role && role !== allowedRole) {
        // Redirect if role doesn't match
        if (role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    }
  }, [user, loading, isVerified, role, allowedRole, navigate]);

  if (loading || (user && isVerified && !role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50/10">
        <div className="w-12 h-12 border-4 border-neu-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If role is required but not yet loaded, or doesn't match, don't show children
  if (allowedRole && role !== allowedRole) return null;

  return (user && isVerified) ? <>{children}</> : null;
};

const DashboardAnalytics = ({ logs, loading }: { logs: VisitorLog[], loading?: boolean }) => {
  const [timeFilter, setTimeFilter] = useState<'today' | 'weekly' | 'monthly' | 'custom'>('today');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const { user: adminUser } = useAuth();

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-10 w-64 bg-slate-200 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded-[2rem]" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-96 bg-slate-200 rounded-[2rem]" />
          <div className="h-96 bg-slate-200 rounded-[2rem]" />
        </div>
      </div>
    );
  }

  const filteredLogs = logs.filter(log => {
    if (timeFilter === 'today') {
      return isToday(log.timestamp);
    } else if (timeFilter === 'weekly') {
      return isThisWeek(log.timestamp);
    } else if (timeFilter === 'monthly') {
      return log.timestamp >= subDays(new Date(), 30);
    } else if (timeFilter === 'custom') {
      let matches = true;
      if (customRange.start) matches = matches && log.timestamp >= new Date(customRange.start);
      if (customRange.end) {
        const end = new Date(customRange.end);
        end.setHours(23, 59, 59, 999);
        matches = matches && log.timestamp <= end;
      }
      return matches;
    }
    return true;
  });

  useEffect(() => {
    if (adminUser?.email) {
      logAdminAction(adminUser.email, 'DASHBOARD_FILTER', { timeFilter, customRange });
    }
  }, [timeFilter, customRange, adminUser]);

  // Calculations
  const totalVisits = filteredLogs.length;
  const uniqueVisitors = new Set(filteredLogs.map(l => l.email)).size;
  const visitorCounts = filteredLogs.reduce((acc, l) => {
    acc[l.email] = (acc[l.email] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const returningVisitors = Object.values(visitorCounts).filter(count => count > 1).length;
  const firstTimeVisitors = uniqueVisitors - returningVisitors;

  const collegeCounts = filteredLogs.reduce((acc, l) => {
    acc[l.college] = (acc[l.college] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mostActiveCollege = Object.entries(collegeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const reasonCounts = filteredLogs.reduce((acc, l) => {
    acc[l.reason] = (acc[l.reason] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mostFrequentReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const dayCounts = filteredLogs.reduce((acc, l) => {
    const day = format(l.timestamp, 'EEEE');
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mostActiveDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const hourCounts = filteredLogs.reduce((acc, l) => {
    const hour = format(l.timestamp, 'ha');
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Chart Data
  const visitsByCollege = Object.entries(collegeCounts).map(([name, value]) => ({ name, value }));
  const visitsByCategory = Object.entries(
    filteredLogs.reduce((acc, l) => {
      acc[l.category] = (acc[l.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), i);
    return format(d, 'EEE');
  }).reverse();

  const visitsByDay = last7Days.map(dayName => {
    const count = filteredLogs.filter(l => format(l.timestamp, 'EEE') === dayName).length;
    return { day: dayName, count };
  });

  const COLORS = ['#008C45', '#059669', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setTimeFilter('today')}
            className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", timeFilter === 'today' ? "bg-neu-green text-white" : "text-slate-500 hover:bg-slate-50")}
          >
            Today
          </button>
          <button 
            onClick={() => setTimeFilter('weekly')}
            className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", timeFilter === 'weekly' ? "bg-neu-green text-white" : "text-slate-500 hover:bg-slate-50")}
          >
            Weekly
          </button>
          <button 
            onClick={() => setTimeFilter('monthly')}
            className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", timeFilter === 'monthly' ? "bg-neu-green text-white" : "text-slate-500 hover:bg-slate-50")}
          >
            Monthly
          </button>
          <button 
            onClick={() => setTimeFilter('custom')}
            className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", timeFilter === 'custom' ? "bg-neu-green text-white" : "text-slate-500 hover:bg-slate-50")}
          >
            Custom
          </button>
        </div>

        {timeFilter === 'custom' && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
            <input type="date" value={customRange.start} onChange={e => setCustomRange({ ...customRange, start: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-neu-green focus:outline-none" />
            <span className="text-slate-400">to</span>
            <input type="date" value={customRange.end} onChange={e => setCustomRange({ ...customRange, end: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-neu-green focus:outline-none" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Visits" value={totalVisits} icon={Users} color="emerald" />
        <StatCard title="Unique Visitors" value={uniqueVisitors} icon={User} color="blue" />
        <StatCard title="Returning Visitors" value={returningVisitors} icon={TrendingUp} color="amber" />
        <StatCard title="First-Time Visitors" value={firstTimeVisitors} icon={Activity} color="emerald" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="admin-card">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Most Active College</p>
          <h4 className="text-lg font-bold text-slate-900 truncate">{mostActiveCollege}</h4>
        </div>
        <div className="admin-card">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Top Visit Reason</p>
          <h4 className="text-lg font-bold text-slate-900 truncate">{mostFrequentReason}</h4>
        </div>
        <div className="admin-card">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Busiest Day</p>
          <h4 className="text-lg font-bold text-slate-900 truncate">{mostActiveDay}</h4>
        </div>
        <div className="admin-card">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Peak Visiting Hour</p>
          <h4 className="text-lg font-bold text-slate-900 truncate">{peakHour}</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="admin-card">
          <h3 className="text-lg font-bold mb-6">Visits per Day</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visitsByDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#008C45" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card">
          <h3 className="text-lg font-bold mb-6">Visits by College</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={visitsByCollege} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {visitsByCollege.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card">
          <h3 className="text-lg font-bold mb-6">Visits by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={visitsByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {visitsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card">
          <h3 className="text-lg font-bold mb-6">Visitor Tracking Insights</h3>
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-xs font-bold text-neu-green uppercase mb-2">Top Visiting College</p>
              <p className="text-xl font-bold text-slate-900">{mostActiveCollege}</p>
              <p className="text-sm text-slate-500 mt-1">{collegeCounts[mostActiveCollege] || 0} total visits in this period.</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs font-bold text-blue-600 uppercase mb-2">Most Common Reason</p>
              <p className="text-xl font-bold text-slate-900">{mostFrequentReason}</p>
              <p className="text-sm text-slate-500 mt-1">{reasonCounts[mostFrequentReason] || 0} users visited for this reason.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminRolePromotion = ({ users }: { users: AppUser[] }) => {
  const { user: adminUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handlePromote = async (uid: string, email: string) => {
    if (!adminUser?.email) return;
    if (window.confirm(`Are you sure you want to promote ${email} to Admin?`)) {
      setIsUpdating(true);
      const loadingToast = toast.loading(`Promoting ${email} to Admin...`);
      try {
        await promoteUserToAdmin(uid, adminUser.email);
        toast.success(`${email} is now an Admin.`, { id: loadingToast });
      } catch (error) {
        console.error("Promotion error:", error);
        toast.error("Failed to promote user.", { id: loadingToast });
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleRoleChange = async (uid: string, email: string, newRole: UserRole) => {
    if (!adminUser?.email) return;
    if (window.confirm(`Change role for ${email} to ${newRole}?`)) {
      setIsUpdating(true);
      const loadingToast = toast.loading(`Updating role for ${email}...`);
      try {
        await updateUserRole(uid, newRole, adminUser.email);
        toast.success(`Role updated to ${newRole}.`, { id: loadingToast });
      } catch (error) {
        console.error("Role update error:", error);
        toast.error("Failed to update role.", { id: loadingToast });
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="admin-card">
        <h3 className="text-lg font-bold mb-6">Admin Management & Role Control</h3>
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search users by email or name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-neu-green focus:outline-none transition-all"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-4 font-bold text-slate-500 text-sm uppercase tracking-wider">User</th>
                <th className="pb-4 font-bold text-slate-500 text-sm uppercase tracking-wider">Current Role</th>
                <th className="pb-4 font-bold text-slate-500 text-sm uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-4">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt="" className="w-10 h-10 rounded-full border border-slate-100" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center font-bold">
                            {u.email.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900">{u.name || 'No Name'}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold uppercase",
                        u.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"
                      )}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <select 
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.uid, u.email, e.target.value as UserRole)}
                          disabled={isUpdating || u.email === adminUser?.email}
                          className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-neu-green"
                        >
                          <option value="student">Student</option>
                          <option value="admin">Admin</option>
                        </select>
                        {u.role !== 'admin' && (
                          <button 
                            onClick={() => handlePromote(u.uid, u.email)}
                            disabled={isUpdating}
                            className="px-3 py-2 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold hover:bg-purple-100 transition-all disabled:opacity-50"
                          >
                            Promote
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminUserGuide = () => {
  const sections = [
    {
      title: "Recycle Bin",
      icon: Trash2,
      content: "The Recycle Bin stores logs that have been removed from the main dashboard. Instead of permanent deletion, logs are 'soft-deleted' first to prevent accidental data loss.",
      steps: [
        "Go to Visitor Logs and click the Trash icon on a record.",
        "The record moves to the Recycle Bin with details on who deleted it and when.",
        "In the Recycle Bin, you can either Restore the record or Permanently Delete it.",
        "Both Restore and Permanent Delete require admin password re-authentication."
      ]
    },
    {
      title: "Backups",
      icon: Database,
      content: "The system automatically creates backups after every delete operation. You can also trigger manual backups to ensure data safety.",
      steps: [
        "Automatic backups occur after soft deletes and permanent deletes.",
        "Go to the Backups page to see a history of all snapshots.",
        "Click 'Create Manual Backup' to capture the current state of active logs.",
        "Backups include the total record count and a timestamp of the snapshot."
      ]
    },
    {
      title: "Analytics",
      icon: BarChart3,
      content: "Analytics provide real-time insights into library usage patterns, including peak hours, most active colleges, and common visit reasons.",
      steps: [
        "The Dashboard Overview shows high-level stats and recent activity.",
        "The Detailed Analytics page provides deeper charts and filtering options.",
        "Use the time filters (Today, Weekly, Monthly, Custom) to narrow down the data.",
        "Charts are interactive and update automatically as new logs arrive."
      ]
    },
    {
      title: "Log Management",
      icon: Users,
      content: "Manage all library visit records efficiently with advanced filtering and search capabilities.",
      steps: [
        "Search by name or email using the search bar.",
        "Filter by College, Category, or Date Range.",
        "Export filtered data to CSV for external reporting.",
        "Click on a user's name to view their individual visit history and block/unblock status."
      ]
    }
  ];

  const faqs = [
    {
      q: "How do I promote a user to Admin?",
      a: "Go to the 'Admin Management' section (accessible from the sidebar), search for the user's email, and click 'Promote to Admin'. Note that the user must already have a registered account."
    },
    {
      q: "Why do I need to re-authenticate for some actions?",
      a: "For security reasons, destructive actions like permanent deletion or restoring logs require you to re-verify your identity using your admin password."
    },
    {
      q: "Can I undo a permanent deletion?",
      a: "No. Once a record is permanently deleted from the Recycle Bin, it is removed from Firestore. However, you might find the data in a previous backup snapshot."
    }
  ];

  return (
    <div className="space-y-12 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sections.map((section) => (
          <div key={section.title} className="admin-card">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-emerald-50 text-neu-green rounded-xl">
                <section.icon size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{section.title}</h3>
            </div>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">{section.content}</p>
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">How to use:</p>
              <ul className="space-y-2">
                {section.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-500">
                    <span className="flex-shrink-0 w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-card bg-slate-900 text-white border-none">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-white/10 text-emerald-400 rounded-xl">
            <Info size={24} />
          </div>
          <h3 className="text-xl font-bold">Frequently Asked Questions</h3>
        </div>
        <div className="space-y-8">
          {faqs.map((faq, i) => (
            <div key={i} className="space-y-2">
              <p className="font-bold text-emerald-400">Q: {faq.q}</p>
              <p className="text-slate-400 text-sm leading-relaxed">A: {faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
const AdminUserDetail = ({ 
  logs, 
  blockedEmails, 
  onToggleBlock,
  onDeleteLog
}: { 
  logs: VisitorLog[], 
  blockedEmails: string[], 
  onToggleBlock: (email: string) => void,
  onDeleteLog: (logId: string) => void
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const log = logs.find(l => l.id === id);
  
  if (!log) return <div>User log not found</div>;
  
  const userLogs = logs.filter(l => l.email === log.email);
  const isBlocked = blockedEmails.includes(log.email);

  return (
    <div className="space-y-8">
      <button onClick={() => navigate('/admin/logs')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium">
        <ArrowLeft size={20} />
        Back to Logs
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/3 space-y-6">
          <div className="admin-card text-center relative overflow-hidden">
            {isBlocked && (
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
            )}
            {log.photoURL ? (
              <img src={log.photoURL} alt="" className="w-24 h-24 rounded-full border-2 border-white shadow-sm mx-auto mb-4" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-24 h-24 bg-emerald-100 text-neu-green rounded-full flex items-center justify-center font-bold text-3xl mx-auto mb-4">
                {log.name.charAt(0)}
              </div>
            )}
            <h2 className="text-2xl font-bold">{log.name}</h2>
            <p className="text-slate-500">{log.email}</p>
            
            <div className="mt-4">
              {isBlocked ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                  <Ban size={14} />
                  Blocked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                  <CheckCircle2 size={14} />
                  Active
                </span>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 text-left space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">College</p>
                <p className="font-medium">{log.college}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Total Visits</p>
                <p className="font-medium">{userLogs.length} Visits</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Last Visit</p>
                <p className="font-medium">{format(userLogs[0].timestamp, 'MMM dd, yyyy HH:mm')}</p>
              </div>
            </div>

            <Button 
              onClick={() => onToggleBlock(log.email)}
              className={cn(
                "w-full mt-8",
                isBlocked 
                  ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                  : "bg-red-50 text-red-600 hover:bg-red-100"
              )}
            >
              {isBlocked ? "Unblock User" : "Block User"}
            </Button>
          </div>
        </div>

        <div className="lg:flex-1">
          <div className="admin-card">
            <h3 className="text-lg font-bold mb-6">Visit History</h3>
            <div className="space-y-4">
              {userLogs.map((ul) => (
                <div key={ul.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{ul.reason}</p>
                      <p className="text-xs text-slate-500">{ul.college}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">{format(ul.timestamp, 'MMM dd, yyyy')}</p>
                    <p className="text-xs text-slate-400">{format(ul.timestamp, 'HH:mm')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, isVerified } = useAuth();
  const [userRoleData, setUserRoleData] = useState<AppUser | null>(null);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [blockedEmails, setBlockedEmails] = useState<string[]>([]);
  const [kioskState, setKioskState] = useState<KioskState>({ name: '', email: '' });
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  const handleSoftDelete = async (logId: string) => {
    if (!user?.email) return;
    if (window.confirm("Move this log to Recycle Bin?")) {
      const loadingToast = toast.loading("Moving to Recycle Bin...");
      try {
        await softDeleteVisitorLog(logId, user.email);
        toast.success("Log moved to Recycle Bin.", { id: loadingToast });
      } catch (error) {
        console.error("Soft delete error:", error);
        toast.error("Failed to delete log.", { id: loadingToast });
      }
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isAdmin = role === 'admin';

  const activeLogs = logs.filter(l => (l.status || 'active') === 'active');
  const deletedLogs = logs.filter(l => l.status === 'deleted');

  // Handle initial redirection after login
  useEffect(() => {
    if (user && role && (location.pathname === '/login' || location.pathname === '/register')) {
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [user, role, location.pathname, navigate]);

  // Real-time Firestore listeners
  useEffect(() => {
    if (!user) {
      setIsInitialLoading(false);
      return;
    }

    let unsubscribeLogs = () => {};
    // Only admins should listen to all logs
    if (isAdmin) {
      unsubscribeLogs = subscribeToLogs((updatedLogs) => {
        setLogs(updatedLogs);
        setLastUpdated(new Date());
        setIsInitialLoading(false);
      });
    } else {
      // For students, we don't need to load all logs
      setIsInitialLoading(false);
    }

    let unsubscribeBlocked = () => {};
    if (isAdmin) {
      unsubscribeBlocked = subscribeToBlockedUsers((updatedBlocked) => {
        setBlockedEmails(updatedBlocked);
      });
    }

    let unsubscribeUser = () => {};
    let unsubscribeAllUsers = () => {};

    if (user) {
      console.log("AppContent subscribing to user profile:", user.uid);
      unsubscribeUser = subscribeToAppUser(user.uid, (data) => {
        setUserRoleData(data);
      });

      if (isAdmin) {
        unsubscribeAllUsers = subscribeToAllUsers((users) => {
          setAllUsers(users);
        });
      }
    }

    return () => {
      unsubscribeLogs();
      unsubscribeBlocked();
      unsubscribeUser();
      unsubscribeAllUsers();
    };
  }, [user, isAdmin]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleKioskSubmit = async (reason: VisitReason, otherReason?: string) => {
    if (isAdmin) {
      alert("Admins cannot log visits as users.");
      navigate('/admin');
      return;
    }

    // Check if user is blocked
    if (blockedEmails.includes(kioskState.email)) {
      alert("Access Denied: Your account has been restricted from using the library facilities. Please contact the administrator.");
      navigate('/');
      setKioskState({ name: '', email: '' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Update user profile if needed
      if (user && (!userRoleData?.college || !userRoleData?.category || !userRoleData?.name || !userRoleData?.photoURL)) {
        await updateAppUser(user.uid, {
          college: kioskState.college,
          category: kioskState.category,
          name: kioskState.name,
          photoURL: user.photoURL || undefined
        });
      }

      await addVisitorLog({
        name: kioskState.name,
        email: kioskState.email,
        college: kioskState.college!,
        category: kioskState.category!,
        reason: reason,
        otherReason: otherReason,
        photoURL: user?.photoURL || undefined
      });
      
      navigate('/success');
      setTimeout(() => {
        setKioskState({ name: '', email: '' });
        navigate('/');
      }, 3000);
    } catch (error) {
      alert("Failed to log visit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleBlock = async (email: string) => {
    if (email.toLowerCase() === 'admin@neu.edu.ph') {
      alert("Cannot block an administrator.");
      return;
    }
    
    const isCurrentlyBlocked = blockedEmails.includes(email);
    try {
      await toggleBlockUser(email, isCurrentlyBlocked);
    } catch (error) {
      alert("Failed to update block status.");
    }
  };

  // Analytics Data
  const visitorsByCollege = Object.entries(
    logs.reduce((acc, log) => {
      acc[log.college] = (acc[log.college] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const visitorsByReason = Object.entries(
    logs.reduce((acc, log) => {
      acc[log.reason] = (acc[log.reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // Dynamic visitors by day calculation
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), i);
    return format(d, 'EEE');
  }).reverse();

  const visitorsByDay = last7Days.map(dayName => {
    const count = logs.filter(log => {
      const isSameDayName = format(log.timestamp, 'EEE') === dayName;
      const isWithinLast7Days = log.timestamp.getTime() > subDays(new Date(), 7).getTime();
      return isSameDayName && isWithinLast7Days;
    }).length;
    return { day: dayName, count };
  });

  // Real-time Dashboard Stats
  const todayCount = logs.filter(l => isToday(l.timestamp)).length;
  const weekCount = logs.filter(l => isThisWeek(l.timestamp)).length;
  
  const hourCounts = logs.reduce((acc, log) => {
    const hour = format(log.timestamp, 'ha'); // e.g., 10AM
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const peakHour = Object.entries(hourCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || 'N/A';
  const mostActiveCollege = visitorsByCollege.sort((a, b) => Number(b.value) - Number(a.value))[0]?.name || 'N/A';

  const COLORS = ['#008C45', '#059669', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'];

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50/10">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-neu-green border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-medium">Connecting to NEU LibTrack...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Routes>
        {/* Kiosk Routes */}
        <Route path="/" element={
          <ProtectedRoute allowedRole="student">
            <div className="flex-1 flex items-center justify-center p-6 bg-emerald-50/30">
              <KioskHome 
                savedName={userRoleData?.name}
                userData={userRoleData}
                onNext={(data) => {
                  setKioskState(prev => ({ ...prev, ...data }));
                  
                  if (userRoleData?.category) {
                  setKioskState(prev => ({ ...prev, category: userRoleData.category }));
                  if (userRoleData?.college) {
                    setKioskState(prev => ({ ...prev, college: userRoleData.college }));
                    navigate('/reason');
                  } else {
                    navigate('/college');
                  }
                } else {
                  navigate('/category');
                }
              }} />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify" element={<VerificationPage />} />
        <Route path="/profile" element={
          <ProtectedRoute allowedRole="student">
            <div className="flex-1 p-6 bg-emerald-50/30">
              <ProfileSection 
                user={user}
                userData={userRoleData}
                onBack={() => navigate('/')}
              />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/category" element={
          <ProtectedRoute allowedRole="student">
            <div className="flex-1 p-6 bg-emerald-50/30">
              <CategorySelection 
                onBack={() => navigate('/')}
                onSelect={(category) => {
                  setKioskState(prev => ({ ...prev, category }));
                  if (userRoleData?.college) {
                    setKioskState(prev => ({ ...prev, college: userRoleData.college }));
                    navigate('/reason');
                  } else {
                    navigate('/college');
                  }
                }} 
              />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/college" element={
          <ProtectedRoute allowedRole="student">
            <div className="flex-1 p-6 bg-emerald-50/30">
              <CollegeSelection 
                onBack={() => {
                  if (userRoleData?.category) {
                    navigate('/');
                  } else {
                    navigate('/category');
                  }
                }}
                onSelect={(college) => {
                  setKioskState(prev => ({ ...prev, college }));
                  navigate('/reason');
                }} 
              />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/reason" element={
          <ProtectedRoute allowedRole="student">
            <div className="flex-1 p-6 bg-emerald-50/30">
              <ReasonSelection 
                onBack={() => {
                  if (userRoleData?.college) {
                    if (userRoleData?.category) {
                      navigate('/');
                    } else {
                      navigate('/category');
                    }
                  } else {
                    navigate('/college');
                  }
                }}
                onSelect={handleKioskSubmit} 
                isSubmitting={isSubmitting}
              />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/success" element={
          <ProtectedRoute allowedRole="student">
            <div className="flex-1 flex items-center justify-center p-6 bg-emerald-50/30">
              <SuccessScreen />
            </div>
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRole="admin">
            <div className="flex min-h-screen bg-emerald-50/10">
              <AdminSidebar />
              <main className="flex-1 p-8 overflow-auto">
                <Routes>
                  <Route path="/" element={
                    <div className="space-y-8">
                      <div className="flex justify-between items-center">
                        <div>
                          <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
                          <p className="text-slate-500">Real-time analytics and visitor insights.</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          <Clock size={16} />
                          Live: {format(currentTime, 'HH:mm:ss')}
                        </div>
                      </div>

                      <DashboardAnalytics logs={activeLogs} loading={isInitialLoading} />

                      <div className="admin-card">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-lg font-bold">Recent Activity</h3>
                          <button onClick={() => navigate('/admin/logs')} className="text-neu-green text-sm font-bold hover:underline">View All</button>
                        </div>
                        <div className="space-y-4">
                          {activeLogs.slice(0, 5).map((log) => (
                            <div key={log.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-4">
                                {log.photoURL ? (
                                  <img src={log.photoURL} alt="" className="w-10 h-10 rounded-full border border-slate-100" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-10 h-10 bg-emerald-100 text-neu-green rounded-full flex items-center justify-center font-bold">
                                    {log.name.charAt(0)}
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-slate-900">{log.name}</p>
                                  <p className="text-xs text-slate-500">{log.college}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-slate-700">{log.reason}</p>
                                <p className="text-xs text-slate-400">{format(log.timestamp, 'HH:mm')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  } />

                  <Route path="/logs" element={
                    <div className="space-y-8">
                      <div>
                        <h1 className="text-3xl font-bold text-slate-900">Visitor Logs</h1>
                        <p className="text-slate-500">View and manage all library visit records.</p>
                      </div>

                      <div className="admin-card">
                        <AdminLogTable logs={activeLogs} blockedEmails={blockedEmails} onToggleBlock={toggleBlock} loading={isInitialLoading} />
                      </div>
                    </div>
                  } />

                  <Route path="/recycle-bin" element={
                    <div className="space-y-8">
                      <div>
                        <h1 className="text-3xl font-bold text-slate-900">Recycle Bin</h1>
                        <p className="text-slate-500">Restore or permanently delete removed records.</p>
                      </div>

                      <RecycleBin logs={deletedLogs} />
                    </div>
                  } />

                  <Route path="/backups" element={
                    <div className="space-y-8">
                      <BackupManagement logs={activeLogs} />
                    </div>
                  } />

                  <Route path="/users" element={
                    <div className="space-y-8">
                      <div>
                        <h1 className="text-3xl font-bold text-slate-900">User Search</h1>
                        <p className="text-slate-500">Advanced search and filtering for all registered users.</p>
                      </div>

                      <AdminUserSearch users={allUsers} />
                    </div>
                  } />

                  <Route path="/analytics" element={
                    <div className="space-y-8">
                      <div>
                        <h1 className="text-3xl font-bold text-slate-900">Detailed Analytics</h1>
                        <p className="text-slate-500">In-depth usage patterns and historical data.</p>
                      </div>

                      <DashboardAnalytics logs={activeLogs} loading={isInitialLoading} />
                    </div>
                  } />

                  <Route path="/promote" element={
                    <div className="space-y-8">
                      <div>
                        <h1 className="text-3xl font-bold text-slate-900">Admin Management</h1>
                        <p className="text-slate-500">Manage user roles and administrative access.</p>
                      </div>
                      <AdminRolePromotion users={allUsers} />
                    </div>
                  } />

                  <Route path="/guide" element={
                    <div className="space-y-8">
                      <div>
                        <h1 className="text-3xl font-bold text-slate-900">Administrator Guide</h1>
                        <p className="text-slate-500">Learn how to use the LibTrack system features.</p>
                      </div>
                      <AdminUserGuide />
                    </div>
                  } />

                <Route path="/user/:id" element={
                  <AdminUserDetail 
                    logs={activeLogs} 
                    blockedEmails={blockedEmails} 
                    onToggleBlock={toggleBlock} 
                    onDeleteLog={handleSoftDelete}
                  />
                } />
              </Routes>
            </main>
          </div>
        </ProtectedRoute>
      } />
      </Routes>

      {/* Footer / Branding */}
      <footer className="p-6 text-center text-slate-400 text-sm">
        <p>© 2026 NEU LibTrack • Library Visitor Management System</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <AppContent />
    </AuthProvider>
  );
}
