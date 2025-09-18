import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let firebaseAdminInitialized = false;
let firestoreInstance: any = null;

// Conservative environment detection - default to mock unless absolutely safe
const getEnvironmentFlags = () => {
  // Only use real Firebase if ALL credentials are present AND we're not in CI
  const hasAllCredentials = !!(
    process.env.FIREBASE_PROJECT_ID && 
    process.env.FIREBASE_CLIENT_EMAIL && 
    process.env.FIREBASE_PRIVATE_KEY
  );
  
  const shouldUseMock = !hasAllCredentials || 
    process.env.CI === 'true' || 
    process.env.GITHUB_ACTIONS === 'true' ||
    (typeof window === 'undefined' && !hasAllCredentials);
    
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

// Initialize Firebase Admin if not already initialized
function initializeFirebaseAdmin() {
  if (firebaseAdminInitialized) {
    return;
  }

  // Check if we should use mock (conservative approach)
  const { shouldUseMock } = getEnvironmentFlags();
  
  if (shouldUseMock) {
    console.log('🔧 Using mock Firebase - CI/build/missing credentials detected');
    firebaseAdminInitialized = true; // Mark as initialized to prevent further attempts
    return;
  }
  
  if (getApps().length === 0) {
    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PROJECT_ID) {
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
        } else {
          console.log('✅ Firebase Admin already initialized (duplicate app)');
          firebaseAdminInitialized = true;
        }
      }
    } else {
      console.warn('⚠️ Missing Firebase Admin environment variables - build time or missing config');
      // Don't throw error during build time - mark as initialized to prevent loops
      firebaseAdminInitialized = true;
      return; // Exit early to prevent any further initialization attempts
    }
  } else {
    firebaseAdminInitialized = true;
  }
}

/**
 * Get Firestore database instance
 * Returns a mock instance during CI builds to prevent initialization errors
 */
export function getDb() {
  console.log('🔍 getDb() called');
  
  // Check if we should use mock (always check fresh)
  const { shouldUseMock } = getEnvironmentFlags();
  if (shouldUseMock) {
    console.log('🔧 Using mock Firestore instance (safe default)');
    return mockFirestore;
  }

  if (!firestoreInstance) {
    initializeFirebaseAdmin();
    
    if (firebaseAdminInitialized && getApps().length > 0) {
      firestoreInstance = getFirestore();
      console.log('🔍 Firebase Admin instance:', { getDb: !!getDb, getAuth: !!getApps });
      console.log('🔍 Firestore instance:', firestoreInstance);
    } else {
      console.warn('⚠️ Firebase Admin not initialized - returning mock instance');
      return mockFirestore;
    }
  }
  return firestoreInstance;
}

// For backward compatibility, export db as a getter that only initializes when accessed
export const db = new Proxy({} as any, {
  get(target, prop) {
    const actualDb = getDb();
    if (typeof actualDb[prop] === 'function') {
      return actualDb[prop].bind(actualDb);
    }
    return actualDb[prop];
  }
});
