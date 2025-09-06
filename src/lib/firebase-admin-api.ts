import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth as getFirebaseAuth } from 'firebase-admin/auth';

let firebaseAdminInitialized = false;
let firestoreInstance: any = null;
let authInstance: any = null;

// Lazy initialization function for API routes
export function getFirebaseAdmin() {
  if (!firebaseAdminInitialized) {
    if (getApps().length === 0) {
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        try {
          initializeApp({
            credential: cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
          });
          console.log('✅ Firebase Admin initialized successfully for API route');
          firebaseAdminInitialized = true;
        } catch (error: any) {
          if (error.code !== 'app/duplicate-app') {
            console.error('❌ Firebase Admin initialization error:', error);
            throw error;
          } else {
            console.log('✅ Firebase Admin already initialized (duplicate app)');
            firebaseAdminInitialized = true;
          }
        }
      } else {
        console.error('❌ Missing Firebase Admin environment variables');
        throw new Error('Firebase Admin environment variables not configured');
      }
    } else {
      firebaseAdminInitialized = true;
    }
  }
  
  return {
    getDb: () => {
      if (!firestoreInstance) {
        firestoreInstance = getFirestore();
      }
      return firestoreInstance;
    },
    getAuth: () => {
      if (!authInstance) {
        authInstance = getFirebaseAuth();
      }
      return authInstance;
    }
  };
}

// Convenience exports
export const getDb = () => {
  // Only initialize Firebase Admin at runtime, not during build
  if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production' || process.env.NODE_ENV === 'production') {
    console.log('🔍 getDb() called');
    const admin = getFirebaseAdmin();
    console.log('🔍 Firebase Admin instance:', admin);
    const db = admin.getDb();
    console.log('🔍 Firestore instance:', db);
    return db;
  }
  
  // During build time, return a mock or throw an error
  throw new Error('Firebase Admin should only be initialized at runtime');
};

export const getAuth = () => {
  if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production' || process.env.NODE_ENV === 'production') {
    return getFirebaseAdmin().getAuth();
  }
  throw new Error('Firebase Admin should only be initialized at runtime');
};
