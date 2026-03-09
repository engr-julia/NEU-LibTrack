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
// Ensure this file is placed in your /public folder
const NEU_LOGO_URL = "/NEU logo.JPG"; 

// --- Components ---

/**
 * Updated Logo Component
 * Handles the circular branding of New Era University
 */
const Logo = ({ className = "w-24 h-24" }: { className?: string }) => {
  const [error, setError] = useState(false);
  
  if (error) {
    return (
      <div className={cn("flex items-center justify-center bg-neu-green/10 rounded-full border-2 border-neu-green/20", className)}>
        <Library className="text-neu-green w-1/2 h-1/2" />
      </div>
    );
  }

  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden rounded-full bg-white shadow-sm", className)}>
        <img 
          src={NEU_LOGO_URL} 
          alt="NEU Logo" 
          className="w-full h-full object-contain p-1"
          referrerPolicy="no-referrer"
          onError={() => {
            console.error("Logo failed to load. Ensure 'NEU logo.JPG' is in the public folder.");
            setError(true);
          }}
        />
    </div>
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
        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
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
          <div className="p-8 overflow-y-auto max-h-[60vh] space-y-6 text-slate-700">
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
          {/* Main Logo Placement */}
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
              <p className="text-slate-500">Administrators are restricted from logging library visits.</p>
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

      {/* Profile Button Top-Right */}
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

// --- Note ---
// ProfileSection, CategorySelection, ReasonSelection and others follow below...
