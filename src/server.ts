/**
 * Express.js Server Setup for Credit System API
 * Main server file with middleware and route configuration
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { handleStripeWebhook } from './lib/stripe-webhook-handler';
import {
  getUserCredits,
  deductCredits,
  addCredits,
  getTransactionHistory,
  checkCredits,
  upgradeToPro,
  initializeUser,
  healthCheck
} from './lib/credit-api-endpoints';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Stripe webhook endpoint (needs raw body)
app.post('/webhook/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

// API Routes
app.get('/api/health', healthCheck);

// User credit routes
app.get('/api/user/:userId', getUserCredits);
app.post('/api/user/:userId/initialize', initializeUser);
app.post('/api/user/:userId/deduct', deductCredits);
app.post('/api/user/:userId/add', addCredits);
app.post('/api/user/:userId/check-credits', checkCredits);
app.post('/api/user/:userId/upgrade-to-pro', upgradeToPro);
app.get('/api/user/:userId/history', getTransactionHistory);

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Credit System API Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔗 Stripe webhook: http://localhost:${PORT}/webhook/stripe`);
  });
}

export default app;
