import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth as getFirebaseAuth } from 'firebase-admin/auth';

let firebaseAdminInitialized = false;
let firestoreInstance: any = null;
let authInstance: any = null;

// Ultra-aggressive environment detection - always default to mock unless explicitly safe
const getEnvironmentFlags = () => {
  // Check if we're in a webpack/build context
  const isBuildContext = (
    typeof process !== 'undefined' && 
    process.env && 
    (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) &&
    typeof window === 'undefined'
  );
  
  // Only use real Firebase if ALL credentials are present AND we're explicitly in production
  const hasAllCredentials = !!(
    process.env.FIREBASE_PROJECT_ID && 
    process.env.FIREBASE_CLIENT_EMAIL && 
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL.length > 10 && // Sanity check
    process.env.FIREBASE_PRIVATE_KEY.length > 100    // Sanity check
  );
  
  // VERY conservative - only use real Firebase in very specific conditions
  const shouldUseMock = (
    !hasAllCredentials ||
    process.env.CI === 'true' || 
    process.env.GITHUB_ACTIONS === 'true' ||
    isBuildContext ||
    typeof window === 'undefined' && process.env.NODE_ENV !== 'production'
  );
  
  console.log('🔍 Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    CI: process.env.CI,
    GITHUB_ACTIONS: process.env.GITHUB_ACTIONS,
    hasAllCredentials,
    isBuildContext,
    shouldUseMock,
    emailLength: process.env.FIREBASE_CLIENT_EMAIL?.length || 0,
    keyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0
  });
  
  return { shouldUseMock, hasAllCredentials };
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
    // Check if we should use mock (default to mock unless definitely safe)
    const { shouldUseMock } = getEnvironmentFlags();
    
    if (shouldUseMock) {
      console.log('🔧 Using mock Firebase instance (CI/build/missing credentials)');
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

// Convenience exports - always check environment fresh to catch runtime changes
export const getDb = () => {
  console.log('🔍 getDb() called');
  
  // Always check environment fresh (don't cache at module level)
  const { shouldUseMock } = getEnvironmentFlags();
  
  // Return mock immediately if we should use mock
  if (shouldUseMock) {
    console.log('🔧 Using mock Firestore instance (safe default)');
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
