import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'

interface VideoInfo {
  title: string
  duration: number
  transcript?: string
  thumbnailUrl?: string
}

interface FortniteAnalysis {
  isFortnite: boolean
  confidence: number
  keywords: string[]
  summary: string
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
}

// Mock function to simulate video transcript extraction
// In production, this would use YouTube API for captions or Whisper for transcription
async function extractTranscript(videoUrl: string, platform: 'youtube' | 'tiktok'): Promise<VideoInfo> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Mock video info and transcript based on platform
  if (platform === 'youtube') {
    return {
      title: "Epic Victory Royale with 15 Eliminations",
      duration: 180,
      transcript: "Hey guys, today I'm gonna show you how to get a Victory Royale. So I'm landing at Tilted Towers, gonna grab a pump shotgun and some shields. I need to find some good loot quick before the storm comes. Oh nice, I got a legendary assault rifle and some big pots. Now I'm gonna rotate to the safe zone and look for some eliminations. There's a guy building up high, I'm gonna try to take him down with my AR. Got him! That's elimination number 5. The zone is moving again, I need to use my launch pad to rotate safely. I see two teams fighting over there, perfect time for some third partying. Boom, knocked two more players! Now it's final circle, only 3 players left including me. I need to play smart here and not get caught in the open. Building up for height advantage, placing my walls carefully. Final fight time! Using my pump shotgun for close range combat. Victory Royale! 15 eliminations total, that was an amazing game!"
    }
  } else {
    return {
      title: "Insane 200 Pump Clip",
      duration: 30,
      transcript: "Bro watch this clip, I'm about to hit the nastiest 200 pump shot ever. Look at this guy, he has no idea I'm behind this wall. I'm gonna edit the window, peek out and... BOOM! 200 to the head! That was so clean, did you see that flick? My aim is cracked right now. This pump shotgun is so good for one-shots when you hit your headshots. Practice your aim guys, that's how you get clips like this!"
    }
  }
}

// Fortnite keyword detection and semantic analysis
function analyzeFortniteContent(transcript: string): FortniteAnalysis {
  const fortniteKeywords = [
    'fortnite', 'victory royale', 'elimination', 'storm', 'zone', 'build', 'edit', 'pump', 
    'shotgun', 'assault rifle', 'ar', 'shields', 'big pot', 'mini shield', 'launch pad',
    'tilted towers', 'loot', 'rotate', 'third party', 'height advantage', 'final circle',
    'pickaxe', 'materials', 'mats', 'wood', 'brick', 'metal', 'cranking', 'box fight',
    'piece control', 'wall replace', 'cone', 'ramp', 'floor', 'blueprint', 'lobby',
    'drop spot', 'landing', 'chest', 'floor loot', 'rng', 'bloom', 'damage', 'hp',
    'knocked', 'downed', 'revive', 'reboot', 'squad', 'duo', 'solo', 'team'
  ]
  
  const transcriptLower = transcript.toLowerCase()
  const foundKeywords = fortniteKeywords.filter(keyword => transcriptLower.includes(keyword))
  
  // Calculate confidence based on keyword density and context
  const keywordDensity = foundKeywords.length / transcript.split(' ').length
  const hasGameplayContext = foundKeywords.some(kw => 
    ['victory royale', 'elimination', 'storm', 'zone', 'build', 'edit'].includes(kw)
  )
  
  const confidence = Math.min(100, (foundKeywords.length * 10) + (keywordDensity * 1000) + (hasGameplayContext ? 20 : 0))
  const isFortnite = confidence > 25
  
  if (!isFortnite) {
    return {
      isFortnite: false,
      confidence,
      keywords: foundKeywords,
      summary: '',
      strengths: [],
      weaknesses: [],
      recommendations: []
    }
  }
  
  // Generate AI analysis based on transcript content
  const analysis = generateGameplayAnalysis(transcript, foundKeywords)
  
  return {
    isFortnite: true,
    confidence,
    keywords: foundKeywords,
    ...analysis
  }
}

function generateGameplayAnalysis(transcript: string, keywords: string[]): {
  summary: string
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
} {
  const transcriptLower = transcript.toLowerCase()
  
  // Analyze different aspects of gameplay
  const hasGoodAim = transcriptLower.includes('headshot') || transcriptLower.includes('200') || transcriptLower.includes('flick')
  const hasBuildingSkills = keywords.some(kw => ['build', 'edit', 'wall', 'ramp', 'cone'].includes(kw))
  const hasRotationAwareness = keywords.some(kw => ['rotate', 'zone', 'storm', 'launch pad'].includes(kw))
  const hasThirdPartySkills = transcriptLower.includes('third party')
  const hasPositioning = transcriptLower.includes('height') || transcriptLower.includes('position')
  const hasLootManagement = keywords.some(kw => ['loot', 'shields', 'big pot', 'weapons'].includes(kw))
  
  // Generate dynamic analysis
  let summary = "Gameplay analysis shows "
  const strengths: string[] = []
  const weaknesses: string[] = []
  const recommendations: string[] = []
  
  if (transcriptLower.includes('victory royale')) {
    summary += "a successful Victory Royale with solid overall performance. "
  } else if (transcriptLower.includes('elimination')) {
    summary += "aggressive gameplay focused on eliminations. "
  } else {
    summary += "mixed gameplay with various tactical elements. "
  }
  
  // Strengths analysis
  if (hasGoodAim) {
    strengths.push("Excellent aim and precision with headshot accuracy")
  }
  if (hasBuildingSkills) {
    strengths.push("Good building fundamentals and edit timing")
  }
  if (hasRotationAwareness) {
    strengths.push("Smart rotation timing and zone awareness")
  }
  if (hasThirdPartySkills) {
    strengths.push("Effective third-party opportunities and timing")
  }
  if (hasPositioning) {
    strengths.push("Strong positioning and height advantage utilization")
  }
  if (hasLootManagement) {
    strengths.push("Efficient loot prioritization and inventory management")
  }
  
  // Weaknesses analysis (inverse of strengths + common issues)
  if (!hasRotationAwareness && transcriptLower.includes('storm')) {
    weaknesses.push("Late rotation leading to storm damage and pressure")
  }
  if (!hasBuildingSkills && transcriptLower.includes('fight')) {
    weaknesses.push("Limited building techniques during combat situations")
  }
  if (transcriptLower.includes('open') || transcriptLower.includes('caught')) {
    weaknesses.push("Poor positioning leading to exposure in open areas")
  }
  if (!hasLootManagement) {
    weaknesses.push("Suboptimal inventory management and item prioritization")
  }
  
  // Recommendations based on analysis
  if (!hasRotationAwareness) {
    recommendations.push("Practice early rotation timing - move 10-15 seconds before storm closes to avoid pressure")
  }
  if (!hasBuildingSkills) {
    recommendations.push("Work on basic building patterns in Creative mode - focus on 90s, wall-ramp-floor sequences")
  }
  if (!hasGoodAim) {
    recommendations.push("Spend 10-15 minutes daily in aim trainers focusing on tracking and flick shots")
  }
  if (!hasPositioning) {
    recommendations.push("Study end-game positioning guides and practice taking height early in final circles")
  }
  
  // Ensure we have at least some content
  if (strengths.length === 0) {
    strengths.push("Maintained game awareness throughout the match")
  }
  if (weaknesses.length === 0) {
    weaknesses.push("Consider working on more aggressive positioning for better engagement opportunities")
  }
  if (recommendations.length === 0) {
    recommendations.push("Continue practicing current playstyle while experimenting with more advanced techniques")
  }
  
  return { summary, strengths, weaknesses, recommendations }
}

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, platform } = await request.json()
    const userEmail = request.headers.get('user-email')
    
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    if (!videoUrl || !platform) {
      return NextResponse.json(
        { error: 'Video URL and platform are required' },
        { status: 400 }
      )
    }
    
    if (!['youtube', 'tiktok'].includes(platform)) {
      return NextResponse.json(
        { error: 'Platform must be youtube or tiktok' },
        { status: 400 }
      )
    }
    
    const startTime = Date.now()
    
    // Extract transcript from video
    console.log(`🎥 Extracting transcript from ${platform} video: ${videoUrl}`)
    const videoInfo = await extractTranscript(videoUrl, platform)
    
    if (!videoInfo.transcript) {
      return NextResponse.json(
        { error: 'Could not extract transcript from video' },
        { status: 400 }
      )
    }
    
    // Analyze for Fortnite content
    console.log('🎮 Analyzing video content for Fortnite gameplay...')
    const analysis = analyzeFortniteContent(videoInfo.transcript)
    
    if (!analysis.isFortnite) {
      return NextResponse.json({
        isFortnite: false,
        confidence: analysis.confidence,
        error: 'Video does not appear to contain Fortnite gameplay'
      })
    }
    
    const processingTime = Math.round((Date.now() - startTime) / 1000)
    
    // Create analysis record
    const analysisRecord = {
      id: `analysis_${Date.now()}`,
      videoUrl,
      platform,
      title: videoInfo.title,
      summary: analysis.summary,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      recommendations: analysis.recommendations,
      timestamp: new Date(),
      processingTime,
      userEmail,
      confidence: analysis.confidence,
      keywords: analysis.keywords,
      transcript: videoInfo.transcript,
      duration: videoInfo.duration
    }
    
    // Save to Firestore
    try {
      await db.collection('video_analyses').doc(analysisRecord.id).set(analysisRecord)
      console.log(`✅ Video analysis saved for user: ${userEmail}`)
    } catch (error) {
      console.error('Failed to save analysis to Firestore:', error)
      // Continue anyway - don't fail the request
    }
    
    // Return successful analysis
    return NextResponse.json({
      isFortnite: true,
      confidence: analysis.confidence,
      analysis: analysisRecord
    })
    
  } catch (error) {
    console.error('Video analysis error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Analysis failed',
        isFortnite: false,
        confidence: 0
      },
      { status: 500 }
    )
  }
}
