"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuth = exports.getDb = void 0;
exports.getFirebaseAdmin = getFirebaseAdmin;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("firebase-admin/auth");
let firebaseAdminInitialized = false;
let firestoreInstance = null;
let authInstance = null;
// Lazy initialization function for API routes
function getFirebaseAdmin() {
    var _a;
    if (!firebaseAdminInitialized) {
        if ((0, app_1.getApps)().length === 0) {
            if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
                try {
                    (0, app_1.initializeApp)({
                        credential: (0, app_1.cert)({
                            projectId: process.env.FIREBASE_PROJECT_ID,
                            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                            privateKey: (_a = process.env.FIREBASE_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, '\n'),
                        }),
                    });
                    console.log('✅ Firebase Admin initialized successfully for API route');
                    firebaseAdminInitialized = true;
                }
                catch (error) {
                    if (error.code !== 'app/duplicate-app') {
                        console.error('❌ Firebase Admin initialization error:', error);
                        throw error;
                    }
                    else {
                        console.log('✅ Firebase Admin already initialized (duplicate app)');
                        firebaseAdminInitialized = true;
                    }
                }
            }
            else {
                console.error('❌ Missing Firebase Admin environment variables');
                throw new Error('Firebase Admin environment variables not configured');
            }
        }
        else {
            firebaseAdminInitialized = true;
        }
    }
    return {
        getDb: () => {
            if (!firestoreInstance) {
                firestoreInstance = (0, firestore_1.getFirestore)();
            }
            return firestoreInstance;
        },
        getAuth: () => {
            if (!authInstance) {
                authInstance = (0, auth_1.getAuth)();
            }
            return authInstance;
        }
    };
}
// Convenience exports
const getDb = () => {
    console.log('🔍 getDb() called');
    const admin = getFirebaseAdmin();
    console.log('🔍 Firebase Admin instance:', admin);
    const db = admin.getDb();
    console.log('🔍 Firestore instance:', db);
    return db;
};
exports.getDb = getDb;
const getAuth = () => getFirebaseAdmin().getAuth();
exports.getAuth = getAuth;
//# sourceMappingURL=firebase-admin-api.js.map