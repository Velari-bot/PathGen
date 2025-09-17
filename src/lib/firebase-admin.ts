import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let firebaseAdminInitialized = false;
let firestoreInstance: any = null;

// Initialize Firebase Admin if not already initialized
function initializeFirebaseAdmin() {
  if (firebaseAdminInitialized) {
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
        console.log('✅ Firebase Admin initialized successfully');
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
  
  // During CI build time or when Firebase env vars are missing, return a mock object to prevent initialization errors
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  const isBuildTime = typeof window === 'undefined' && !process.env.FIREBASE_CLIENT_EMAIL;
  
  if (isCI || isBuildTime) {
    console.log('🔧 CI/Build time detected - returning mock Firestore instance');
    return {
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
  }

  if (!firestoreInstance) {
    initializeFirebaseAdmin();
    if (firebaseAdminInitialized) {
      firestoreInstance = getFirestore();
      console.log('🔍 Firebase Admin instance:', { getDb: !!getDb, getAuth: !!getApps });
      console.log('🔍 Firestore instance:', firestoreInstance);
    } else {
      throw new Error('Firebase Admin could not be initialized');
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
