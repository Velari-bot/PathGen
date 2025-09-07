import { onRequest } from 'firebase-functions/v2/https';

export const osirionStats = onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { epicId, platform = 'pc', lookupType = 'recent', userId } = req.body;

    if (!epicId || !userId) {
      res.status(400).json({ error: 'Epic ID and User ID are required' });
      return;
    }

    console.log(`🔍 Processing ${lookupType} stats lookup for Epic ID: ${epicId}, User: ${userId}`);

    // For now, just return a success response to test the function
    res.status(200).json({
      success: true,
      message: 'Function is working',
      data: {
        epicId,
        userId,
        platform,
        lookupType
      }
    });

  } catch (error) {
    console.error('❌ Error in osirionStats function:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
