/**
 * Authentication Routes
 * Handles IntroDreamer and full Dreamer authentication
 * JWT-based authentication with access/refresh tokens
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const IntroDreamer = require('../models/IntroDreamer');
const Dreamer = require('../models/Dreamer');
const UpgradeService = require('../services/UpgradeService');
const { authenticateToken } = require('../middleware/auth');
const config = require('../conf/default');
const router = express.Router();


// === RATE LIMITING ===

// General auth rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
    retryAfter: 15 * 60 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for registration
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500, // 5 registrations per hour
  message: {
    success: false,
    error: 'Too many registration attempts, please try again later',
    retryAfter: 60 * 60 // 1 hour in seconds
  }
});

// === INTRO DREAMER ROUTES ===

// POST /auth/intro - Create IntroDreamer session
router.post('/intro', registrationLimiter, async (req, res) => {
  try {
    const { email, dreamTitle, dreamVision, reminderDateTime } = req.body;

    // Validation
    if (!dreamTitle) {
      return res.status(400).json({
        success: false,
        error: 'Dream title is required'
      });
    }

    let introDreamer = null;

    // Only check for existing accounts if email is provided
    if (email) {
      // Check if email already exists as full Dreamer
      const existingDreamer = await Dreamer.findOne({ email: email.toLowerCase() });
      if (existingDreamer) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email already exists. Please log in instead.',
          shouldRedirect: '/login'
        });
      }

      // Check if IntroDreamer already exists with this email
      introDreamer = await IntroDreamer.findByEmail(email);
    }

    if (introDreamer) {
      // Update existing IntroDreamer session
      introDreamer.dreamTitle = dreamTitle;
      introDreamer.dreamVision = dreamVision || '';
      introDreamer.reminderDateTime = reminderDateTime;
      introDreamer.reminderSent = false; // Reset if they change reminder
      introDreamer.extendExpiration(); // Extend expiration

      await introDreamer.save();
    } else {
      // Create new IntroDreamer session
      const reminderDate = reminderDateTime || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // Default: 2 days

      let finalVision;
      if(typeof dreamVision === 'object') {
        finalVision = JSON.stringify(dreamVision);
      }

      const createData = {
        dreamTitle,
        dreamVision: finalVision || '',
        reminderDateTime: reminderDate
      };

      // Only add email if provided
      if (email) {
        createData.email = email.toLowerCase();
      }

      introDreamer = new IntroDreamer(createData);

      introDreamer.generateNewTempToken();

      await introDreamer.save();
    }

    res.status(201).json({
      success: true,
      data: introDreamer.toSafeObject(),
      message: 'Intro session created successfully'
    });

  } catch (error) {
    console.error('Create intro session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create intro session',
      details: error.message
    });
  }
});

// GET /auth/intro/:token - Get IntroDreamer session by token
router.get('/intro/:token', async (req, res) => {
  try {
    const introDreamer = await IntroDreamer.findByTempToken(req.params.token);

    if (!introDreamer) {
      return res.status(404).json({
        success: false,
        error: 'Intro session not found or expired'
      });
    }

    if (introDreamer.isExpired()) {
      return res.status(410).json({
        success: false,
        error: 'Intro session has expired'
      });
    }

    // Update last active
    introDreamer.lastActiveAt = new Date();
    await introDreamer.save();

    res.json({
      success: true,
      data: introDreamer.toSafeObject()
    });

  } catch (error) {
    console.error('Get intro session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve intro session',
      details: error.message
    });
  }
});

// PUT /auth/intro/:token - Update IntroDreamer session
router.put('/intro/:token', async (req, res) => {
  try {
    const { dreamTitle, dreamVision, reminderDateTime } = req.body;

    const introDreamer = await IntroDreamer.findByTempToken(req.params.token);

    if (!introDreamer) {
      return res.status(404).json({
        success: false,
        error: 'Intro session not found or expired'
      });
    }

    if (introDreamer.isExpired()) {
      return res.status(410).json({
        success: false,
        error: 'Intro session has expired'
      });
    }

    // Update fields
    if (dreamTitle !== undefined) introDreamer.dreamTitle = dreamTitle;
    if (dreamVision !== undefined) introDreamer.dreamVision = dreamVision;
    if (reminderDateTime !== undefined) {
      introDreamer.reminderDateTime = reminderDateTime;
      introDreamer.reminderSent = false; // Reset reminder status
    }

    await introDreamer.save();

    res.json({
      success: true,
      data: introDreamer.toSafeObject(),
      message: 'Intro session updated successfully'
    });

  } catch (error) {
    console.error('Update intro session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update intro session',
      details: error.message
    });
  }
});

// === FULL DREAMER AUTHENTICATION ===

// POST /auth/register - Register full Dreamer (upgrade from IntroDreamer OR direct registration)
router.post('/register', registrationLimiter, async (req, res) => {
  try {
    const { tempToken, email, password } = req.body;

    // Validation - require password
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    if (!tempToken && !email) {
      return res.status(400).json({
        success: false,
        error: 'Either tempToken (for upgrade) or email (for direct registration) is required'
      });
    }

    let result;

    // If tempToken provided (with or without email), use upgrade path
    if (tempToken) {
      // === UPGRADE FROM INTRO DREAMER ===
      const registrationData = { password };
      result = await UpgradeService.upgradeToFullAccount(tempToken, registrationData);

    } else {
      // === DIRECT REGISTRATION ===

      // Check if email already exists
      const existingDreamer = await Dreamer.findOne({ email: email.toLowerCase() });
      if (existingDreamer) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email already exists'
        });
      }

      // Create new Dreamer directly
      const dreamer = new Dreamer({
        email: email.toLowerCase(),
        password,
        profile: {
          onboardingCompleted: false, // They'll need to complete profile later
          journeyStartedAt: new Date()
        }
      });

      await dreamer.save();

      // Generate tokens
      const accessToken = dreamer.generateAccessToken();
      const refreshToken = dreamer.generateRefreshToken();

      result = {
        dreamer: dreamer.toSafeObject(),
        dream: null, // No dream for direct registration
        tokens: {
          accessToken: dreamer.generateAccessToken(),
          refreshToken: dreamer.generateRefreshToken()
        }
      };
    }

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const responseData = {
      dreamer: result.dreamer,
      accessToken: result.tokens.accessToken
    };

    // Include dream data if upgrading from IntroDreamer
    if (result.dream) {
      responseData.dream = result.dream;
    }

    res.status(201).json({
      success: true,
      data: responseData,
      message: tempToken ? 'Account upgraded successfully' : 'Account created successfully'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /auth/login - Full Dreamer login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find dreamer with password
    const dreamer = await Dreamer.findByEmail(email);

    if (!dreamer) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (dreamer.isLocked()) {
      return res.status(423).json({
        success: false,
        error: 'Account is temporarily locked due to too many failed login attempts'
      });
    }

    // Verify password
    const isPasswordValid = await dreamer.comparePassword(password);

    if (!isPasswordValid) {
      await dreamer.incLoginAttempts();
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Reset login attempts on successful login
    await dreamer.resetLoginAttempts();

    // Update last login
    dreamer.lastLogin = new Date();
    dreamer.lastActiveAt = new Date();
    await dreamer.save();

    // Generate tokens
    const accessToken = dreamer.generateAccessToken();
    const refreshToken = dreamer.generateRefreshToken();

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      data: {
        dreamer: dreamer.toSafeObject(),
        accessToken
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      details: error.message
    });
  }
});

// POST /auth/refresh - Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required'
      });
    }

    // Verify refresh token
    const jwt = require('jsonwebtoken');
    let payload;

    try {
      payload = jwt.verify(refreshToken, config.jwt_refresh_secret);
    } catch (error) {
      return res.status(403).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    // Find dreamer
    const dreamer = await Dreamer.findById(payload.dreamerId);

    if (!dreamer || dreamer.tokenVersion !== payload.tokenVersion) {
      return res.status(403).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newAccessToken = dreamer.generateAccessToken();
    const newRefreshToken = dreamer.generateRefreshToken();

    // Set new refresh token as httpOnly cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        dreamer: dreamer.toSafeObject()
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      details: error.message
    });
  }
});

// POST /auth/logout - Logout and invalidate tokens
router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Decode token to get dreamer ID
      const jwt = require('jsonwebtoken');
      try {
        const payload = jwt.verify(refreshToken, config.jwt_refresh_secret);
        const dreamer = await Dreamer.findById(payload.dreamerId);

        if (dreamer) {
          // Revoke all tokens by incrementing version
          await dreamer.revokeAllTokens();
        }
      } catch (error) {
        // Token invalid, but we still want to clear the cookie
        console.log('Invalid refresh token during logout:', error.message);
      }
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      details: error.message
    });
  }
});

// GET /auth/me - Get current dreamer info (requires authentication)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // This route will be protected by auth middleware
    const dreamer = req.dreamer; // Set by auth middleware

    res.json({
      success: true,
      data: dreamer.toSafeObject()
    });

  } catch (error) {
    console.error('Get current dreamer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dreamer info',
      details: error.message
    });
  }
});

module.exports = router;
