'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  subscriptionStatus: 'active' | 'inactive';
  subscriptionTier: string | null;
  createdAt: any;
  lastLogin: any;
}

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<FirebaseUser>;
  signIn: (email: string, password: string) => Promise<FirebaseUser>;
  signInWithGoogle: () => Promise<FirebaseUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string): Promise<FirebaseUser> => {
    if (!auth || !db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName || email.split('@')[0], // Use email prefix if no display name
        createdAt: serverTimestamp(),
        subscriptionStatus: 'inactive',
        subscriptionTier: null,
        lastLogin: serverTimestamp(),
      });

      return user;
    } catch (error: any) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string): Promise<FirebaseUser> => {
    if (!auth) {
      throw new Error('Firebase not initialized');
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update last login in Firestore
      if (db) {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            lastLogin: serverTimestamp(),
          });
        } catch (error) {
          console.error('Error updating last login:', error);
        }
      }

      return user;
    } catch (error: any) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signInWithGoogle = async (): Promise<FirebaseUser> => {
    if (!auth || !db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document exists, if not create it
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create new user document for Google sign-in
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          createdAt: serverTimestamp(),
          subscriptionStatus: 'inactive',
          subscriptionTier: null,
          lastLogin: serverTimestamp(),
        });
      } else {
        // Update last login for existing user
        await updateDoc(userDocRef, {
          lastLogin: serverTimestamp(),
        });
      }

      return user;
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    if (!auth) {
      throw new Error('Firebase not initialized');
    }

    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
