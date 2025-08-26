import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const { epicAccount, userId } = await request.json();
    
    if (!epicAccount || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Initialize Firebase Admin if not already initialized
    if (getApps().length === 0) {
      if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        try {
          initializeApp({
            credential: cert({
              projectId: process.env.FIREBASE_PROJECT_ID || 'pathgen-a771b',
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
          });
        } catch (error: any) {
          if (error.code !== 'app/duplicate-app') {
            console.error('❌ Firebase Admin initialization error:', error);
            return NextResponse.json({
              success: false,
              error: 'Firebase initialization failed',
              details: error.message
            }, { status: 500 });
          }
        }
      } else {
        console.error('❌ Firebase Admin credentials not configured');
        return NextResponse.json({
          success: false,
          error: 'Firebase Admin credentials not configured',
          details: 'Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY'
        }, { status: 500 });
      }
    }

    const db = getFirestore();
    
    const linkedAccount = {
      epicId: epicAccount.epicId,
      displayName: epicAccount.displayName,
      platform: epicAccount.platform || 'pc',
      linkedAt: new Date().toISOString(),
      userId: userId,
      isReal: epicAccount.isReal || false,
      // Additional Epic account fields
      accountId: epicAccount.accountId,
      country: epicAccount.country,
      preferredLanguage: epicAccount.preferredLanguage,
      email: epicAccount.email,
      lastLogin: new Date().toISOString(),
      status: 'active' as const,
      verificationStatus: 'verified' as const
    };

    console.log('Epic account linking to Firebase:', linkedAccount);

    // Store in Firebase Firestore
    try {
      const docRef = db.collection('epicAccounts').doc(epicAccount.epicId);
      await docRef.set({
        ...linkedAccount,
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Epic account saved to Firebase successfully');
    } catch (firebaseError) {
      console.error('❌ Error saving Epic account to Firebase:', firebaseError);
      return NextResponse.json({
        success: false,
        error: 'Failed to save Epic account to Firebase',
        details: firebaseError instanceof Error ? firebaseError.message : 'Unknown error'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Epic account linked and saved to Firebase successfully',
      epicAccount: linkedAccount
    });

  } catch (error) {
    console.error('Error linking Epic account:', error);
    return NextResponse.json(
      { error: 'Failed to link Epic account' },
      { status: 500 }
    );
  }
}
