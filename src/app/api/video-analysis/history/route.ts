import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    const userEmail = request.headers.get('user-email')
    
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Get recent video analyses for this user
    let analysesSnapshot
    try {
      analysesSnapshot = await db
        .collection('video_analyses')
        .where('userEmail', '==', userEmail)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get()
    } catch (indexError) {
      // Fallback: Get without orderBy if index doesn't exist
      console.warn('Firestore index missing for video_analyses, falling back to simple query:', indexError)
      analysesSnapshot = await db
        .collection('video_analyses')
        .where('userEmail', '==', userEmail)
        .limit(10)
        .get()
    }
    
    const analyses = analysesSnapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        videoUrl: data.videoUrl,
        platform: data.platform,
        title: data.title,
        summary: data.summary,
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        recommendations: data.recommendations || [],
        timestamp: data.timestamp?.toDate?.() || data.timestamp || new Date(),
        processingTime: data.processingTime || 0,
        confidence: data.confidence || 0
      }
    })
    
    return NextResponse.json({
      analyses,
      count: analyses.length
    })
    
  } catch (error) {
    console.error('Failed to fetch video analysis history:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch analysis history',
        analyses: [],
        count: 0
      },
      { status: 500 }
    )
  }
}
