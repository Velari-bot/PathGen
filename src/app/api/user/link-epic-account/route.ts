import { NextRequest, NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function POST(request: NextRequest) {
  try {
    const { userId, epicAccount } = await request.json();

    if (!userId || !epicAccount) {
      return NextResponse.json(
        { error: 'User ID and Epic account are required' },
        { status: 400 }
      );
    }

    // Update user document with Epic account information
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      epicAccount: {
        id: epicAccount.id,
        displayName: epicAccount.displayName,
        platform: epicAccount.platform,
        linkedAt: new Date().toISOString(),
      },
      lastUpdated: new Date().toISOString(),
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Epic account linked successfully' 
    });
  } catch (error: any) {
    console.error('Error linking Epic account:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to link Epic account' },
      { status: 500 }
    );
  }
}
