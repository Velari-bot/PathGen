import { onRequest } from 'firebase-functions/v2/https';

export const testFunction = onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Test function working',
    timestamp: new Date().toISOString(),
    method: req.method,
    body: req.body
  });
});
