import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile, UserRole } from '../types';
import { DEMO_USER_PROFILES } from '../data/demoData';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loginAsRoleDemo: (roleKey: keyof typeof DEMO_USER_PROFILES) => Promise<void>;
  loginWithCredentials: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  simulateRoleSwitch: (role: UserRole) => void;
  hasRole: (requiredRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const cached = localStorage.getItem('lalpari_user_profile');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const profile = snap.data() as UserProfile;
            setUserProfile(profile);
            localStorage.setItem('lalpari_user_profile', JSON.stringify(profile));
          }
        } catch (err) {
          console.warn('Error reading user role from firestore:', err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginAsRoleDemo = async (roleKey: keyof typeof DEMO_USER_PROFILES) => {
    setLoading(true);
    try {
      const demoProfile = DEMO_USER_PROFILES[roleKey];
      if (demoProfile) {
        startTransition(() => {
          setUserProfile(demoProfile);
        });
        localStorage.setItem('lalpari_user_profile', JSON.stringify(demoProfile));
        try {
          await setDoc(doc(db, 'users', demoProfile.userId), demoProfile, { merge: true });
        } catch (e) {
          console.info('Persisted demo profile locally.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithCredentials = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      const userDocRef = doc(db, 'users', res.user.uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const profile = snap.data() as UserProfile;
        setUserProfile(profile);
        localStorage.setItem('lalpari_user_profile', JSON.stringify(profile));
        return { success: true };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Authentication failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      // Ignored
    }
    setUserProfile(null);
    localStorage.removeItem('lalpari_user_profile');
  };

  const simulateRoleSwitch = (role: UserRole) => {
    if (!userProfile) return;
    const updated = { ...userProfile, role };
    setUserProfile(updated);
    localStorage.setItem('lalpari_user_profile', JSON.stringify(updated));
  };

  const hasRole = (requiredRoles: UserRole[]): boolean => {
    if (!userProfile) return false;
    if (userProfile.role === 'SUPER_ADMIN') return true;
    return requiredRoles.includes(userProfile.role);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        loginAsRoleDemo,
        loginWithCredentials,
        logout,
        simulateRoleSwitch,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
