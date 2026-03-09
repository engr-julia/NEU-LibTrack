import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { getAppUser, createAppUser, subscribeToAppUser } from '../services/firestoreService';
import { UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  logout: () => Promise<void>;
  isVerified: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUser = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const ADMIN_EMAILS = ['admin@neu.edu.ph', 'engr.julia.rt@gmail.com'];

        // Initial role based on email list to avoid permission errors while waiting for Firestore
        const isHardcodedAdmin = currentUser.email && ADMIN_EMAILS.includes(currentUser.email.toLowerCase());
        if (isHardcodedAdmin) {
          setRole('admin');
        }

        // First check if user exists, if not create them
        try {
          const userData = await getAppUser(currentUser.uid);
          if (!userData) {
            const initialRole = isHardcodedAdmin ? 'admin' : 'student';
            await createAppUser(currentUser.uid, currentUser.email || '', initialRole);
          } else if (isHardcodedAdmin && userData.role !== 'admin') {
            // Auto-promote to admin if in the list but not yet admin in Firestore
            const { updateUserRole } = await import('../services/firestoreService');
            await updateUserRole(currentUser.uid, 'admin', 'system-auto-promote');
          }
        } catch (err) {
          console.warn("Initial user setup check failed (likely permissions):", err);
        }

        // Then subscribe to real-time updates
        unsubscribeUser = subscribeToAppUser(currentUser.uid, (updatedUser) => {
          let userRole: UserRole = isHardcodedAdmin ? 'admin' : 'student';
          if (updatedUser) {
            userRole = updatedUser.role;
          }
          
          // Hardcoded admin override again to be safe
          if (isHardcodedAdmin) {
            userRole = 'admin';
          }
          
          setRole(userRole);
          setLoading(false);
        });
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUser();
    };
  }, []);

  const logout = () => signOut(auth);

  const isVerified = user ? user.emailVerified : false;

  return (
    <AuthContext.Provider value={{ user, role, loading, logout, isVerified }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
