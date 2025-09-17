import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth as getFirebaseAuth } from 'firebase-admin/auth';

let firebaseAdminInitialized = false;
let firestoreInstance: any = null;
let authInstance: any = null;

// Dynamic check for CI/build environment
const getEnvironmentFlags = () => {
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  const isBuildTime = typeof window === 'undefined' && !process.env.FIREBASE_CLIENT_EMAIL;
  
  console.log('🔍 Environment check:', {
    CI: process.env.CI,
    GITHUB_ACTIONS: process.env.GITHUB_ACTIONS,
    hasFirebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    isCI,
    isBuildTime,
    window: typeof window
  });
  
  return { isCI, isBuildTime };
};

// Create mock Firestore instance for build/CI environments
const mockFirestore = {
  collection: () => ({
    doc: () => ({
      get: () => Promise.resolve({ exists: false, data: () => null }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
      delete: () => Promise.resolve()
    }),
    add: () => Promise.resolve({ id: 'mock-doc-id' }),
    get: () => Promise.resolve({ docs: [], empty: true }),
    where: () => ({
      get: () => Promise.resolve({ docs: [], empty: true }),
      where: function() { return this; },
      orderBy: function() { return this; },
      limit: function() { return this; }
    })
  })
};

// Lazy initialization function for API routes
export function getFirebaseAdmin() {
  if (!firebaseAdminInitialized) {
    // Check if we're in CI/build environment first
    const { isCI, isBuildTime } = getEnvironmentFlags();
    
    if (isCI || isBuildTime) {
      console.log('🔧 CI/Build time detected - skipping Firebase Admin initialization (API)');
      firebaseAdminInitialized = true; // Mark as initialized to prevent further attempts
      return {
        getDb: () => mockFirestore,
        getAuth: () => ({ /* mock auth */ })
      };
    }
    
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
        console.warn('⚠️ Missing Firebase Admin environment variables - build time or missing config');
        firebaseAdminInitialized = true;
        return {
          getDb: () => mockFirestore,
          getAuth: () => ({ /* mock auth */ })
        };
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
// Check environment at module level to prevent initialization issues
const environmentFlags = getEnvironmentFlags();

export const getDb = () => {
  console.log('🔍 getDb() called');
  
  // Return mock immediately if in CI/build environment
  if (environmentFlags.isCI || environmentFlags.isBuildTime) {
    console.log('🔧 CI/Build time detected - returning mock Firestore instance (API)');
    return mockFirestore;
  }
  
  try {
    const admin = getFirebaseAdmin();
    console.log('🔍 Firebase Admin instance:', admin);
    const db = admin.getDb();
    console.log('🔍 Firestore instance:', db);
    return db;
  } catch (error) {
    console.warn('⚠️ Firebase initialization failed, returning mock instance:', error);
    return mockFirestore;
  }
};
export const getAuth = () => getFirebaseAdmin().getAuth();
