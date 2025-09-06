/**
 * Credit System API Endpoints
 * RESTful API for credit operations
 */

import { Request, Response } from 'express';
import { creditService } from '../lib/credit-backend-service';

/**
 * GET /api/user/:userId
 * Get user's current credit balance and account type
 */
export async function getUserCredits(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'User ID is required' 
      });
    }

    const userData = await creditService.getUserCredits(userId);
    
    if (!userData) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: {
        userId: userData.userId,
        name: userData.name,
        email: userData.email,
        accountType: userData.accountType,
        credits: userData.credits,
        subscriptionId: userData.subscriptionId,
        stripeCustomerId: userData.stripeCustomerId,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      }
    });

  } catch (error) {
    console.error('Error getting user credits:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}

/**
 * POST /api/user/:userId/deduct
 * Deduct credits from user account
 */
export async function deductCredits(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { amount, feature, metadata } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'User ID is required' 
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        error: 'Valid amount is required' 
      });
    }

    if (!feature) {
      return res.status(400).json({ 
        error: 'Feature name is required' 
      });
    }

    const result = await creditService.deductCredits(
      userId,
      amount,
      feature,
      metadata
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message,
        creditsRemaining: result.creditsRemaining
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        creditsRemaining: result.creditsRemaining,
        creditsChanged: result.creditsChanged,
        transactionId: result.transactionId
      }
    });

  } catch (error) {
    console.error('Error deducting credits:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}

/**
 * POST /api/user/:userId/add
 * Add credits to user account
 */
export async function addCredits(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { amount, action, metadata } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'User ID is required' 
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        error: 'Valid amount is required' 
      });
    }

    const result = await creditService.addCredits(
      userId,
      amount,
      action || 'addition',
      metadata
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message,
        creditsRemaining: result.creditsRemaining
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        creditsRemaining: result.creditsRemaining,
        creditsChanged: result.creditsChanged,
        transactionId: result.transactionId
      }
    });

  } catch (error) {
    console.error('Error adding credits:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}

/**
 * GET /api/user/:userId/history
 * Get user's transaction history
 */
export async function getTransactionHistory(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'User ID is required' 
      });
    }

    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum <= 0 || limitNum > 1000) {
      return res.status(400).json({ 
        error: 'Invalid limit parameter (1-1000)' 
      });
    }

    const history = await creditService.getTransactionHistory(userId, limitNum);

    res.status(200).json({
      success: true,
      data: {
        userId,
        transactionCount: history.length,
        transactions: history
      }
    });

  } catch (error) {
    console.error('Error getting transaction history:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}

/**
 * POST /api/user/:userId/check-credits
 * Check if user has enough credits for an action
 */
export async function checkCredits(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { requiredAmount } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'User ID is required' 
      });
    }

    if (!requiredAmount || requiredAmount <= 0) {
      return res.status(400).json({ 
        error: 'Valid required amount is needed' 
      });
    }

    const hasEnough = await creditService.hasEnoughCredits(userId, requiredAmount);
    const userData = await creditService.getUserCredits(userId);

    res.status(200).json({
      success: true,
      data: {
        hasEnoughCredits: hasEnough,
        currentCredits: userData?.credits || 0,
        requiredAmount,
        canPerformAction: hasEnough
      }
    });

  } catch (error) {
    console.error('Error checking credits:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}

/**
 * POST /api/user/:userId/upgrade-to-pro
 * Manually upgrade user to Pro (for testing/admin use)
 */
export async function upgradeToPro(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { subscriptionId, stripeCustomerId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'User ID is required' 
      });
    }

    if (!subscriptionId || !stripeCustomerId) {
      return res.status(400).json({ 
        error: 'Subscription ID and Stripe Customer ID are required' 
      });
    }

    const result = await creditService.upgradeToPro(
      userId,
      subscriptionId,
      stripeCustomerId
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message,
        creditsRemaining: result.creditsRemaining
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        creditsRemaining: result.creditsRemaining,
        creditsChanged: result.creditsChanged,
        transactionId: result.transactionId
      }
    });

  } catch (error) {
    console.error('Error upgrading user to Pro:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}

/**
 * POST /api/user/:userId/initialize
 * Initialize a new user with appropriate credits
 */
export async function initializeUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { name, email, accountType, subscriptionId, stripeCustomerId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'User ID is required' 
      });
    }

    if (!name || !email || !accountType) {
      return res.status(400).json({ 
        error: 'Name, email, and account type are required' 
      });
    }

    if (!['free', 'pro'].includes(accountType)) {
      return res.status(400).json({ 
        error: 'Account type must be "free" or "pro"' 
      });
    }

    const result = await creditService.initializeUser(
      userId,
      name,
      email,
      accountType,
      subscriptionId,
      stripeCustomerId
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message,
        creditsRemaining: result.creditsRemaining
      });
    }

    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        userId,
        creditsRemaining: result.creditsRemaining,
        creditsChanged: result.creditsChanged,
        transactionId: result.transactionId
      }
    });

  } catch (error) {
    console.error('Error initializing user:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}

/**
 * GET /api/health
 * Health check endpoint
 */
export async function healthCheck(req: Request, res: Response) {
  res.status(200).json({
    success: true,
    message: 'Credit system API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}
