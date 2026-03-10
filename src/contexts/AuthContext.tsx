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
        // First check if user exists, if not create them
        try {
          const userData = await getAppUser(currentUser.uid);
          if (!userData) {
            await createAppUser(currentUser.uid, currentUser.email || '', 'student');
          }
        } catch (err) {
          console.warn("Initial user setup check failed:", err);
        }

        // Then subscribe to real-time updates
        unsubscribeUser = subscribeToAppUser(currentUser.uid, (updatedUser) => {
          setRole(updatedUser?.role || 'student');
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

  return (
    <AuthContext.Provider value={{ user, role, loading, logout }}>
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
