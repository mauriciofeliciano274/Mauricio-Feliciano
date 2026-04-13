import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, onAuthStateChanged, doc, getDoc, setDoc, User, serverTimestamp } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  updateRole: (role: 'passenger' | 'driver') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          // Create default profile
          const newProfile = {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            role: 'passenger', // Default
            createdAt: serverTimestamp(),
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    const { signInWithPopup, googleProvider } = await import('../lib/firebase');
    await signInWithPopup(auth, googleProvider);
  };

  const signOut = async () => {
    const { signOut: firebaseSignOut } = await import('../lib/firebase');
    await firebaseSignOut(auth);
  };

  const updateRole = async (role: 'passenger' | 'driver') => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid);
    await setDoc(docRef, { role }, { merge: true });
    setProfile((prev: any) => ({ ...prev, role }));
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, updateRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
