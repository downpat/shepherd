/**
 * Authentication Middleware
 * JWT token verification for protected routes
 */

const jwt = require('jsonwebtoken');
const Dreamer = require('../models/Dreamer');
const config = require('../conf/default');

/**
 * Middleware to authenticate JWT access tokens
 * Attaches authenticated dreamer to req.dreamer
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    // Verify token
    let payload;
    try {
      payload = jwt.verify(token, config.jwt_access_secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Access token expired',
          code: 'TOKEN_EXPIRED'
        });
      }

      return res.status(403).json({
        success: false,
        error: 'Invalid access token'
      });
    }

    // Verify token type
    if (payload.type !== 'access') {
      return res.status(403).json({
        success: false,
        error: 'Invalid token type'
      });
    }

    // Find dreamer
    const dreamer = await Dreamer.findById(payload.dreamerId);

    if (!dreamer) {
      return res.status(403).json({
        success: false,
        error: 'Invalid token - dreamer not found'
      });
    }

    // Check token version (for token revocation)
    if (dreamer.tokenVersion !== payload.tokenVersion) {
      return res.status(403).json({
        success: false,
        error: 'Token has been revoked'
      });
    }

    // Update last active time
    dreamer.lastActiveAt = new Date();
    await dreamer.save();

    // Attach dreamer to request
    req.dreamer = dreamer;
    req.dreamerId = dreamer._id;

    next();

  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      details: error.message
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches dreamer if token is valid, but doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // No token, continue without authentication
    }

    // Try to verify token
    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

      if (payload.type === 'access') {
        const dreamer = await Dreamer.findById(payload.dreamerId);

        if (dreamer && dreamer.tokenVersion === payload.tokenVersion) {
          req.dreamer = dreamer;
          req.dreamerId = dreamer._id;

          // Update last active time
          dreamer.lastActiveAt = new Date();
          await dreamer.save();
        }
      }
    } catch (error) {
      // Invalid token, but we don't fail - just continue without auth
      console.log('Optional auth - invalid token:', error.message);
    }

    next();

  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if there's an error
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};
