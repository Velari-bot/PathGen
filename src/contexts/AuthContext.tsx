'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { trackSignup } from '@/components/TwitterPixel';

interface User extends FirebaseUser {
  epicId?: string;
  discordId?: string;
  persona?: string;
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
  resendEmailVerification: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateUserProfile: (profile: { displayName: string; epicId: string; discordId: string; persona: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            // Check if user document exists in Firestore
            if (!db) {
              console.error('❌ Firebase not initialized in AuthContext');
              return;
            }
            
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (!userDoc.exists()) {
              // Create new user document with comprehensive data
              const newUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email?.split('@')[0] || 'User',
                photoURL: user.photoURL || null,
                epicId: null,
                discordId: null,
                persona: 'casual' as const,
                subscriptionStatus: 'active' as const,
                subscriptionTier: 'free' as const,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                // Additional user profile fields
                profile: {
                  avatar: user.photoURL || null,
                  bio: null,
                  location: null,
                  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                  language: navigator.language || 'en',
                  dateOfBirth: null,
                  gender: null
                },
                gaming: {
                  favoriteGame: null, // Will be filled during onboarding
                  skillLevel: null, // Will be filled during onboarding
                  playStyle: null, // Will be filled during onboarding
                  preferredModes: [], // Will be filled during onboarding
                  teamSize: null, // Will be filled during onboarding
                  goals: [] // Will be filled during onboarding
                },
                subscription: {
                  status: 'free' as const,
                  tier: 'free',
                  startDate: serverTimestamp(),
                  endDate: null,
                  autoRenew: false,
                  paymentMethod: null,
                  stripeCustomerId: null,
                  stripeSubscriptionId: null
                },
                settings: {
                  notifications: {
                    email: true,
                    push: false,
                    sms: false,
                    discord: false
                  },
                  privacy: {
                    profilePublic: false,
                    statsPublic: false,
                    allowFriendRequests: true,
                    showOnlineStatus: true
                  },
                  preferences: {
                    theme: 'dark' as const,
                    language: navigator.language || 'en',
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    dateFormat: 'MM/DD/YYYY',
                    timeFormat: '12h' as const
                  }
                },
                statistics: {
                  totalSessions: 0,
                  totalTime: 0,
                  lastActivity: serverTimestamp(),
                  favoriteFeatures: [],
                  mostUsedTools: [],
                  improvementAreas: []
                }
              };
              
              await setDoc(userDocRef, newUser);
              console.log('✅ New comprehensive user document created in Firestore');
              
              // Also create initial usage document
              try {
                const { UsageTracker } = await import('@/lib/usage-tracker');
                await UsageTracker.getUserUsage(user.uid, 'free');
                console.log('✅ Initial usage document created in Firestore');
              } catch (error) {
                console.warn('⚠️ Could not create usage document:', error);
              }
            } else {
              // Update last login and ensure subscription status is correct
              const userData = userDoc.data();
              const updates: any = {
                lastLogin: serverTimestamp(),
              };
              
              // Ensure subscription status is set correctly for existing users
              if (!userData.subscriptionStatus || userData.subscriptionStatus === 'inactive') {
                updates.subscriptionStatus = 'active';
                updates.subscriptionTier = 'free';
                console.log('✅ Updated existing user subscription status to active/free');
              }
              
              await updateDoc(userDocRef, updates);
              console.log('✅ User document updated in Firestore');
            }
            
            setUser(user);
          } catch (error) {
            console.error('❌ Error setting up user document:', error);
            // Still set the user even if Firestore setup fails
            setUser(user);
          }
        } else {
          setUser(null);
        }
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

      // Create comprehensive user document in Firestore
      const newUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || email.split('@')[0], // Use email prefix if no display name
        photoURL: null,
        epicId: null,
        discordId: null,
        persona: 'casual' as const,
        subscriptionStatus: 'active' as const,
        subscriptionTier: 'free' as const,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        // Additional user profile fields
        profile: {
          avatar: null,
          bio: null,
          location: null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language || 'en',
          dateOfBirth: null,
          gender: null
        },
        gaming: {
          favoriteGame: null, // Will be filled during onboarding
          skillLevel: null, // Will be filled during onboarding
          playStyle: null, // Will be filled during onboarding
          preferredModes: [], // Will be filled during onboarding
          teamSize: null, // Will be filled during onboarding
          goals: [] // Will be filled during onboarding
        },
        subscription: {
          status: 'free' as const,
          tier: 'free',
          startDate: serverTimestamp(),
          endDate: null,
          autoRenew: false,
          paymentMethod: null,
          stripeCustomerId: null,
          stripeSubscriptionId: null
        },
        settings: {
          notifications: {
            email: true,
            push: false,
            sms: false,
            discord: false
          },
          privacy: {
            profilePublic: false,
            statsPublic: false,
            allowFriendRequests: true,
            showOnlineStatus: true
          },
          preferences: {
            theme: 'dark' as const,
            language: navigator.language || 'en',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            dateFormat: 'MM/DD/YYYY',
            timeFormat: '12h' as const
          }
        },
        statistics: {
          totalSessions: 0,
          totalTime: 0,
          lastActivity: serverTimestamp(),
          favoriteFeatures: [],
          mostUsedTools: [],
          improvementAreas: []
        }
      };
      
      await setDoc(doc(db, 'users', user.uid), newUser);
      console.log('✅ New comprehensive user document created in Firestore during signup');
      
      // Track signup event for link tracking
      try {
        const { trackSignup } = await import('@/components/SimpleTracker');
        await trackSignup(user.uid);
        console.log('✅ Signup tracked for link tracking system');
      } catch (error) {
        console.warn('⚠️ Could not track signup event:', error);
      }

      // Track signup for Twitter/X advertising
      try {
        trackSignup(email);
        console.log('🐦 Signup tracked for Twitter/X campaigns');
      } catch (error) {
        console.warn('⚠️ Could not track Twitter signup event:', error);
      }
      
      // Send email verification
      try {
        await sendEmailVerification(user);
        console.log('✅ Email verification sent to new user');
      } catch (error) {
        console.warn('⚠️ Could not send email verification:', error);
      }
      
      // Also create initial usage document
      try {
        const { UsageTracker } = await import('@/lib/usage-tracker');
        await UsageTracker.getUserUsage(user.uid, 'free');
        console.log('✅ Initial usage document created in Firestore during signup');
      } catch (error) {
        console.warn('⚠️ Could not create usage document during signup:', error);
      }

      // Redirect to verification page for new users
      if (!user.emailVerified) {
        window.location.href = '/verify-email';
      }
      
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

      // Update last login and ensure subscription status in Firestore
      if (db) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const updates: any = {
              lastLogin: serverTimestamp(),
            };
            
            // Ensure subscription status is set correctly
            if (!userData.subscriptionStatus || userData.subscriptionStatus === 'inactive') {
              updates.subscriptionStatus = 'active';
              updates.subscriptionTier = 'free';
              console.log('✅ Updated user subscription status to active/free during signin');
            }
            
            await updateDoc(userDocRef, updates);
            console.log('✅ User document updated in Firestore during signin');
          }
        } catch (error) {
          console.error('Error updating user document during signin:', error);
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
        // Create comprehensive user document for Google sign-in
        const newUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL || null,
          epicId: null,
          discordId: null,
          persona: 'casual' as const,
          subscriptionStatus: 'active' as const,
          subscriptionTier: 'free' as const,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          // Additional user profile fields
          profile: {
            avatar: user.photoURL || null,
            bio: null,
            location: null,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language || 'en',
            dateOfBirth: null,
            gender: null
          },
          gaming: {
            favoriteGame: null, // Will be filled during onboarding
            skillLevel: null, // Will be filled during onboarding
            playStyle: null, // Will be filled during onboarding
            preferredModes: [], // Will be filled during onboarding
            teamSize: null, // Will be filled during onboarding
            goals: [] // Will be filled during onboarding
          },
          subscription: {
            status: 'free' as const,
            tier: 'free',
            startDate: serverTimestamp(),
            endDate: null,
            autoRenew: false,
            paymentMethod: null,
            stripeCustomerId: null,
            stripeSubscriptionId: null
          },
          settings: {
            notifications: {
              email: true,
              push: false,
              sms: false,
              discord: false
            },
            privacy: {
              profilePublic: false,
              statsPublic: false,
              allowFriendRequests: true,
              showOnlineStatus: true
            },
            preferences: {
              theme: 'dark' as const,
              language: navigator.language || 'en',
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              dateFormat: 'MM/DD/YYYY',
              timeFormat: '12h' as const
            }
          },
          statistics: {
            totalSessions: 0,
            totalTime: 0,
            lastActivity: serverTimestamp(),
            favoriteFeatures: [],
            mostUsedTools: [],
            improvementAreas: []
          }
        };
        
        await setDoc(userDocRef, newUser);
        console.log('✅ New comprehensive user document created in Firestore during Google signin');
        
        // Track signup event for link tracking
        try {
          const { trackSignup } = await import('@/components/SimpleTracker');
          await trackSignup(user.uid);
          console.log('✅ Google signup tracked for link tracking system');
        } catch (error) {
          console.warn('⚠️ Could not track Google signup event:', error);
        }

        // Track signup for Twitter/X advertising
        try {
          trackSignup(user.email || undefined);
          console.log('🐦 Google signup tracked for Twitter/X campaigns');
        } catch (error) {
          console.warn('⚠️ Could not track Twitter Google signup event:', error);
        }
        
        // Also create initial usage document
        try {
          const { UsageTracker } = await import('@/lib/usage-tracker');
          await UsageTracker.getUserUsage(user.uid, 'free');
          console.log('✅ Initial usage document created in Firestore during Google signin');
        } catch (error) {
          console.warn('⚠️ Could not create usage document during Google signin:', error);
        }
      } else {
        // Update last login and ensure subscription status for existing user
        const userData = userDoc.data();
        const updates: any = {
          lastLogin: serverTimestamp(),
        };
        
        // Ensure subscription status is set correctly
        if (!userData.subscriptionStatus || userData.subscriptionStatus === 'inactive') {
          updates.subscriptionStatus = 'active';
          updates.subscriptionTier = 'free';
          console.log('✅ Updated existing user subscription status to active/free during Google signin');
        }
        
        await updateDoc(userDocRef, updates);
        console.log('✅ User document updated in Firestore during Google signin');
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

  const resendEmailVerification = async (): Promise<void> => {
    if (!auth || !auth.currentUser) {
      throw new Error('No user logged in');
    }

    try {
      await sendEmailVerification(auth.currentUser);
      console.log('✅ Email verification sent successfully');
    } catch (error: any) {
      console.error('Error sending email verification:', error);
      throw error;
    }
  };

  const sendPasswordReset = async (email: string): Promise<void> => {
    if (!auth) {
      throw new Error('Firebase not initialized');
    }

    try {
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Password reset email sent successfully');
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  };

  const updateUserProfile = async (profile: { displayName: string; epicId: string; discordId: string; persona: string }): Promise<void> => {
    if (!auth || !db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const userDocRef = doc(db, 'users', auth.currentUser!.uid);
      await updateDoc(userDocRef, {
        displayName: profile.displayName,
        epicId: profile.epicId,
        discordId: profile.discordId,
        persona: profile.persona,
      });
    } catch (error: any) {
      console.error('Error updating user profile:', error);
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
    resendEmailVerification,
    sendPasswordReset,
    updateUserProfile,
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
