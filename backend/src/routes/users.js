const express = require('express');
const { User } = require('../models');
const { authenticateToken, requireVerified } = require('../middleware/auth');
const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

// GET /api/users/profile - Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        user: user.toPrivateJSON()
      }
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

// PUT /api/users/profile - Update current user profile
router.put('/profile', requireVerified, async (req, res) => {
  try {
    const { firstName, lastName, walletAddress } = req.body;
    
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prepare update data
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (walletAddress !== undefined) updateData.walletAddress = walletAddress;
    
    // Validate wallet address format if provided
    if (walletAddress && walletAddress.length > 0) {
      // Basic Ethereum address validation
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid wallet address format'
        });
      }
    }
    
    // Update user
    await user.update(updateData);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.toPrivateJSON()
      }
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    
    // Handle unique constraint errors (like wallet address already exists)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Wallet address is already associated with another account'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// PUT /api/users/wallet - Update wallet address specifically
router.put('/wallet', requireVerified, async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address is required'
      });
    }
    
    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address format'
      });
    }
    
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update wallet address
    await user.update({ walletAddress });
    
    res.json({
      success: true,
      message: 'Wallet address updated successfully',
      data: {
        user: user.toPrivateJSON()
      }
    });
    
  } catch (error) {
    console.error('Update wallet error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'This wallet address is already associated with another account'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update wallet address'
    });
  }
});

// DELETE /api/users/account - Delete current user account (soft delete)
router.delete('/account', requireVerified, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Soft delete by marking as inactive
    await user.update({ isActive: false });
    
    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
    
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate account'
    });
  }
});

module.exports = router;