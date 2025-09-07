"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.getDb = getDb;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
let firebaseAdminInitialized = false;
let firestoreInstance = null;
// Initialize Firebase Admin if not already initialized
function initializeFirebaseAdmin() {
    var _a;
    if (firebaseAdminInitialized) {
        return;
    }
    if ((0, app_1.getApps)().length === 0) {
        if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PROJECT_ID) {
            try {
                (0, app_1.initializeApp)({
                    credential: (0, app_1.cert)({
                        projectId: process.env.FIREBASE_PROJECT_ID,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        privateKey: (_a = process.env.FIREBASE_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, '\n'),
                    }),
                });
                console.log('✅ Firebase Admin initialized successfully');
                firebaseAdminInitialized = true;
            }
            catch (error) {
                if (error.code !== 'app/duplicate-app') {
                    console.error('❌ Firebase Admin initialization error:', error);
                }
                else {
                    console.log('✅ Firebase Admin already initialized (duplicate app)');
                    firebaseAdminInitialized = true;
                }
            }
        }
        else {
            console.error('❌ Missing Firebase Admin environment variables');
        }
    }
    else {
        firebaseAdminInitialized = true;
    }
}
// Lazy initialization function
function getDb() {
    if (!firestoreInstance) {
        initializeFirebaseAdmin();
        firestoreInstance = (0, firestore_1.getFirestore)();
    }
    return firestoreInstance;
}
// For backward compatibility, export db as a getter that only initializes when accessed
exports.db = new Proxy({}, {
    get(target, prop) {
        const actualDb = getDb();
        if (typeof actualDb[prop] === 'function') {
            return actualDb[prop].bind(actualDb);
        }
        return actualDb[prop];
    }
});
//# sourceMappingURL=firebase-admin.js.map