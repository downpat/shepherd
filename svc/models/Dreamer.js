/**
 * Dreamer Mongoose Model
 * Full authentication and profile entity for registered DreamShepherd users
 * Uses JWT authentication with Argon2id password hashing
 */

const mongoose = require('mongoose');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const config = require('../conf/default');

const dreamerSchema = new mongoose.Schema({
  // === CORE AUTHENTICATION ===
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email']
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Exclude from queries by default
  },

  // === ACCOUNT MANAGEMENT ===
  isEmailVerified: {
    type: Boolean,
    default: false
  },

  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,

  // === SECURITY ===
  loginAttempts: {
    type: Number,
    default: 0
  },

  lockUntil: Date,
  lastLogin: Date,

  // JWT token versioning for revocation
  tokenVersion: {
    type: Number,
    default: 0
  },

  // === DREAMER PROFILE (Sacred Context) ===
  profile: {
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },

    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },

    displayName: {
      type: String,
      trim: true,
      maxlength: [100, 'Display name cannot exceed 100 characters']
    },

    avatar: String, // Future: profile image URL

    // Personal Development Context
    onboardingCompleted: {
      type: Boolean,
      default: false
    },

    introCompletedAt: Date,
    journeyStartedAt: Date,

    // Contemplative UX Preferences
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'light'
      },

      animationSpeed: {
        type: String,
        enum: ['slow', 'normal', 'fast'],
        default: 'slow' // For contemplative gravitas
      },

      shepherdPersonality: {
        type: String,
        enum: ['gentle', 'encouraging', 'wise'],
        default: 'gentle'
      },

      notifications: {
        type: Boolean,
        default: true
      }
    }
  },

  // === UPGRADE CONTEXT (for IntroDreamer migrations) ===
  upgradedFrom: {
    introDreamerId: String, // Reference to original IntroDreamer
    tempToken: String, // Original temp token for audit trail
    originalCreatedAt: Date, // When they first started their journey
    upgradedAt: {
      type: Date,
      default: Date.now
    }
  },

  // === DATA RELATIONSHIPS (Denormalized for Performance) ===
  dreamCount: {
    type: Number,
    default: 0
  },

  goalCount: {
    type: Number,
    default: 0
  },

  activeHabits: {
    type: Number,
    default: 0
  },

  // === AUDIT ===
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },

  lastActiveAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: false, updatedAt: true } // Automatic updatedAt
});

// === INDEXES ===
dreamerSchema.index({ email: 1 }, { unique: true });
dreamerSchema.index({ emailVerificationToken: 1 });
dreamerSchema.index({ passwordResetToken: 1 });
dreamerSchema.index({ lastActiveAt: -1 });
dreamerSchema.index({ 'upgradedFrom.introDreamerId': 1 });

// === PASSWORD HASHING MIDDLEWARE ===
dreamerSchema.pre('save', async function(next) {
  // Only hash password if it's been modified
  if (!this.isModified('password')) return next();

  try {
    // Argon2id hashing with OWASP recommended parameters
    this.password = await argon2.hash(this.password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    });
    next();
  } catch (error) {
    next(error);
  }
});

// === INSTANCE METHODS ===

// Password verification
dreamerSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await argon2.verify(this.password, candidatePassword);
  } catch (error) {
    return false;
  }
};

// Generate JWT Access Token (15 minutes)
dreamerSchema.methods.generateAccessToken = function() {
  return jwt.sign(
    {
      dreamerId: this._id,
      email: this.email,
      tokenVersion: this.tokenVersion,
      type: 'access'
    },
    config.jwt_access_secret,
    {
      expiresIn: '15m',
      issuer: 'dreamshepherd',
      audience: 'dreamshepherd-api'
    }
  );
};

// Generate JWT Refresh Token (7 days)
dreamerSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    {
      dreamerId: this._id,
      tokenVersion: this.tokenVersion,
      type: 'refresh'
    },
    config.jwt_refresh_secret,
    {
      expiresIn: '7d',
      issuer: 'dreamshepherd',
      audience: 'dreamshepherd-api'
    }
  );
};

// Create password reset token
dreamerSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Create email verification token
dreamerSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

// Check if account is locked
dreamerSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
dreamerSchema.methods.incLoginAttempts = function() {
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours

  // Already locked
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account after max attempts
  if (this.loginAttempts + 1 >= maxAttempts) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }

  return this.updateOne(updates);
};

// Reset login attempts (on successful login)
dreamerSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Revoke all tokens (increment tokenVersion)
dreamerSchema.methods.revokeAllTokens = function() {
  this.tokenVersion += 1;
  return this.save();
};

// Convert to safe frontend format
dreamerSchema.methods.toSafeObject = function() {
  const obj = {
    id: this._id,
    email: this.email,
    isEmailVerified: this.isEmailVerified,
    profile: this.profile,
    dreamCount: this.dreamCount,
    goalCount: this.goalCount,
    activeHabits: this.activeHabits,
    createdAt: this.createdAt,
    lastActiveAt: this.lastActiveAt
  };

  // Include upgrade context if available
  if (this.upgradedFrom) {
    obj.upgradedFrom = {
      originalCreatedAt: this.upgradedFrom.originalCreatedAt,
      upgradedAt: this.upgradedFrom.upgradedAt
    };
  }

  return obj;
};

// === STATIC METHODS ===

// Find dreamer by email with password
dreamerSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

// Find by password reset token
dreamerSchema.statics.findByPasswordResetToken = function(token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  return this.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
};

// Find by email verification token
dreamerSchema.statics.findByEmailVerificationToken = function(token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  return this.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });
};

// Create from IntroDreamer upgrade
dreamerSchema.statics.createFromIntroDreamer = function(introDreamerData, registrationData) {
  return new this({
    email: introDreamerData.email,
    password: registrationData.password,
    profile: {
      firstName: registrationData.firstName,
      lastName: registrationData.lastName,
      displayName: registrationData.displayName || registrationData.firstName,
      onboardingCompleted: true,
      introCompletedAt: introDreamerData.introCompletedAt,
      journeyStartedAt: new Date(),
      preferences: registrationData.preferences || {}
    },
    upgradedFrom: introDreamerData.upgradeData,
    dreamCount: 1 // They'll have their first dream
  });
};

module.exports = mongoose.model('Dreamer', dreamerSchema);
