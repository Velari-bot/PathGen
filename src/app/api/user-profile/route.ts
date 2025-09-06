import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user profile from Firestore
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userSnap.data();
    
    return NextResponse.json({
      success: true,
      profile: {
        uid: userData?.uid,
        email: userData?.email,
        displayName: userData?.displayName,
        epicId: userData?.epicId,
        skillLevel: userData?.skillLevel,
        playstyle: userData?.playstyle,
        subscription: userData?.subscription,
        createdAt: userData?.createdAt,
        lastLogin: userData?.lastLogin
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
