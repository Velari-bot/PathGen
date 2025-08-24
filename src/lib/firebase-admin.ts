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
      console.error('❌ Missing Firebase Admin environment variables');
    }
  } else {
    firebaseAdminInitialized = true;
  }
}

// Lazy initialization function
export function getDb() {
  if (!firestoreInstance) {
    initializeFirebaseAdmin();
    firestoreInstance = getFirestore();
  }
  return firestoreInstance;
}

// For backward compatibility, export db as a function that returns the instance
export const db = getDb();
