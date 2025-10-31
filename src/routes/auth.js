const express = require('express');
const jwt = require('jsonwebtoken');
const { User, OTP } = require('../models');
const emailService = require('../services/emailService');
const { authenticateToken } = require('../middleware/auth');
const AuditService = require('../services/auditService');
const router = express.Router();

// Generate JWT tokens
const generateTokens = (userId) => {
  const payload = { userId };
  
  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
  
  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  
  return { accessToken, refreshToken };
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, walletAddress } = req.body;
    
    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, first name, and last name are required'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Create user (not verified yet)
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      walletAddress,
      isVerified: false
    });
    
    // Log registration
    await AuditService.logRegistration(user.id, { email, firstName, lastName, role: user.role }, req);
    
    // Generate and send OTP
    const { code } = await OTP.createOTP(email, 'registration');
    const emailResult = await emailService.sendOTP(email, code, 'registration');
    
    if (!emailResult.success) {
      console.warn('Failed to send OTP email, but user was created');
    }
    
    res.status(201).json({
      success: true,
      message: 'Registration initiated. Please check your email for verification code.',
      data: {
        maskedEmail: emailService.maskEmail(email),
        preview: emailResult.preview // Only in development
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }
    
    // Verify OTP
    const otpResult = await OTP.verifyOTP(email, code, 'registration');
    if (!otpResult.valid) {
      return res.status(400).json({
        success: false,
        message: otpResult.message
      });
    }
    
    // Find and verify user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Mark user as verified
    await user.update({ isVerified: true });
    
    // Log OTP verification
    await AuditService.logOTPVerification(user.id, 'registration', true, req);
    
    // Generate tokens
    const tokens = generateTokens(user.id);
    
    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: user.toPrivateJSON(),
        tokens
      }
    });
    
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed'
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Find user
    const user = await User.findActiveByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      // Log failed login attempt
      await AuditService.logLogin(user.id, false, req, 'Invalid password');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in'
      });
    }
    
    // Generate and send login OTP
    const { code } = await OTP.createOTP(email, 'login');
    const emailResult = await emailService.sendOTP(email, code, 'login');
    
    if (!emailResult.success) {
      console.warn('Failed to send login OTP email');
    }
    
    res.json({
      success: true,
      message: 'Login OTP sent to your email',
      data: {
        maskedEmail: emailService.maskEmail(email),
        preview: emailResult.preview // Only in development
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// POST /api/auth/verify-login
router.post('/verify-login', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }
    
    // Verify OTP
    const otpResult = await OTP.verifyOTP(email, code, 'login');
    if (!otpResult.valid) {
      return res.status(400).json({
        success: false,
        message: otpResult.message
      });
    }
    
    // Find user
    const user = await User.findActiveByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update last login
    await user.update({ lastLogin: new Date() });
    
    // Log successful login
    await AuditService.logLogin(user.id, true, req);
    await AuditService.logOTPVerification(user.id, 'login', true, req);
    
    // Generate tokens
    const tokens = generateTokens(user.id);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toPrivateJSON(),
        tokens
      }
    });
    
  } catch (error) {
    console.error('Login verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Login verification failed'
    });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Check if user exists (don't reveal if user doesn't exist)
    const user = await User.findActiveByEmail(email);
    
    // Always return success to prevent email enumeration
    let otpSent = false;
    if (user) {
      // Generate and send password reset OTP
      const { code } = await OTP.createOTP(email, 'password_reset');
      const emailResult = await emailService.sendOTP(email, code, 'password_reset');
      otpSent = emailResult.success;
    }
    
    res.json({
      success: true,
      message: 'If an account with this email exists, a password reset code has been sent.',
      data: {
        maskedEmail: emailService.maskEmail(email)
      }
    });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request'
    });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    
    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, code, and new password are required'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    
    // Verify OTP
    const otpResult = await OTP.verifyOTP(email, code, 'password_reset');
    if (!otpResult.valid) {
      return res.status(400).json({
        success: false,
        message: otpResult.message
      });
    }
    
    // Find user
    const user = await User.findActiveByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update password
    await user.update({ password: newPassword });
    
    // Log password change
    await AuditService.logPasswordChange(user.id, req);
    
    res.json({
      success: true,
      message: 'Password reset successful'
    });
    
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed'
    });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Log logout
    await AuditService.logLogout(req.user.userId, req);
    
    // In a real implementation, you might want to blacklist the token
    // For now, we'll just return success as the client will remove the token
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
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
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information'
    });
  }
});

module.exports = router;