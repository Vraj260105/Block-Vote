const express = require('express');
const { body, param, validationResult } = require('express-validator');
const walletService = require('../services/walletService');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * GET /api/wallet/status
 * Get current user's wallet status
 */
router.get('/status', 
  authenticateToken,
  async (req, res, next) => {
    try {
      const walletStatus = await walletService.getUserWalletStatus(req.user.userId);
      
      res.json({
        success: true,
        data: {
          hasWallet: walletStatus.hasWallet,
          isWalletValid: walletStatus.isWalletValid,
          // Don't return actual wallet address in status endpoint
          walletPreview: walletStatus.walletAddress ? 
            `${walletStatus.walletAddress.slice(0, 6)}...${walletStatus.walletAddress.slice(-4)}` : 
            null
        },
        message: 'Wallet status retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/wallet/verify
 * Verify if current wallet matches registered wallet
 */
router.post('/verify',
  authenticateToken,
  [
    body('walletAddress')
      .isEthereumAddress()
      .withMessage('Valid Ethereum wallet address is required')
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { walletAddress } = req.body;
      
      const verification = await walletService.verifyUserWallet(req.user.userId, walletAddress);
      
      res.json({
        success: true,
        data: {
          isValid: verification.isValid,
          isMatching: verification.isMatching,
          needsRegistration: verification.needsRegistration,
          message: verification.message,
          // Provide masked version of registered wallet if available
          registeredWalletPreview: verification.registeredWallet ? 
            `${verification.registeredWallet.slice(0, 6)}...${verification.registeredWallet.slice(-4)}` : 
            null
        },
        message: 'Wallet verification completed'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/wallet/register
 * Register or update user's wallet address
 */
router.post('/register',
  authenticateToken,
  [
    body('walletAddress')
      .isEthereumAddress()
      .withMessage('Valid Ethereum wallet address is required')
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { walletAddress } = req.body;
      
      const result = await walletService.registerUserWallet(req.user.userId, walletAddress);
      
      res.json({
        success: true,
        data: {
          walletPreview: `${result.walletAddress.slice(0, 6)}...${result.walletAddress.slice(-4)}`
        },
        message: result.message
      });
    } catch (error) {
      if (error.message.includes('already registered')) {
        return res.status(409).json({
          success: false,
          message: error.message,
          code: 'WALLET_ALREADY_REGISTERED'
        });
      }
      next(error);
    }
  }
);

/**
 * POST /api/wallet/check-transaction-capability
 * Check if wallet can perform transactions
 */
router.post('/check-transaction-capability',
  authenticateToken,
  [
    body('walletAddress')
      .isEthereumAddress()
      .withMessage('Valid Ethereum wallet address is required')
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { walletAddress } = req.body;
      
      const canTransact = await walletService.canWalletTransact(walletAddress);
      
      res.json({
        success: true,
        data: {
          canTransact,
          message: canTransact ? 
            'Wallet can perform transactions' : 
            'Wallet cannot perform transactions - insufficient balance or network issues'
        },
        message: 'Transaction capability check completed'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/wallet/challenge
 * Generate wallet connection challenge for signature verification
 */
router.get('/challenge',
  authenticateToken,
  async (req, res, next) => {
    try {
      const challenge = walletService.generateWalletChallenge(req.user.userId);
      
      res.json({
        success: true,
        data: challenge,
        message: 'Challenge generated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/wallet/verify-signature
 * Verify wallet signature for enhanced security
 */
router.post('/verify-signature',
  authenticateToken,
  [
    body('walletAddress')
      .isEthereumAddress()
      .withMessage('Valid Ethereum wallet address is required'),
    body('signature')
      .notEmpty()
      .withMessage('Signature is required'),
    body('message')
      .notEmpty()
      .withMessage('Message is required')
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { walletAddress, signature, message } = req.body;
      
      const isValidSignature = await walletService.verifyWalletSignature(walletAddress, signature, message);
      
      res.json({
        success: true,
        data: {
          isValidSignature,
          message: isValidSignature ? 
            'Signature verification successful' : 
            'Signature verification failed'
        },
        message: 'Signature verification completed'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/wallet/unregister
 * Remove wallet address from user account
 */
router.delete('/unregister',
  authenticateToken,
  async (req, res, next) => {
    try {
      const { User } = require('../models');
      
      const user = await User.findByPk(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      user.walletAddress = null;
      await user.save();
      
      res.json({
        success: true,
        data: {},
        message: 'Wallet address removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;