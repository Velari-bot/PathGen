import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { epicAccount, userId } = await request.json();
    
    if (!epicAccount || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For now, we'll just return success without Firebase storage
    // TODO: Implement actual Firebase Firestore storage when ready for production
    
    const linkedAccount = {
      epicId: epicAccount.epicId,
      displayName: epicAccount.displayName,
      platform: epicAccount.platform || 'pc',
      linkedAt: new Date().toISOString(),
      userId: userId,
      isReal: epicAccount.isReal || false
    };

    console.log('Epic account linked successfully:', linkedAccount);

    // TODO: Store in Firebase Firestore or Realtime Database
    // Example Firestore implementation:
    // const db = getFirestore();
    // await db.collection('users').doc(userId).collection('epicAccounts').doc(epicAccount.epicId).set(linkedAccount);

    return NextResponse.json({
      success: true,
      message: 'Epic account linked successfully',
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
