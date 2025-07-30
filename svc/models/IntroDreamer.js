/**
 * IntroDreamer Mongoose Model
 * Lightweight model for Dreamers who haven't fully registered yet
 * Stores intro session data and supports scheduled contemplative reminders
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const introDreamerSchema = new mongoose.Schema({
  // === MINIMAL IDENTITY ===
  email: {
    type: String,
    required: [true, 'Email is required for reminders'],
    lowercase: true,
    trim: true,
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email']
  },

  // Session token for returning without password
  tempToken: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // === INTRO SESSION DATA ===
  dreamTitle: {
    type: String,
    required: [true, 'Dream title is required'],
    trim: true,
    maxlength: [200, 'Dream title cannot exceed 200 characters']
  },

  dreamVision: {
    type: String, // Store Tiptap JSON as string
    default: '',
    maxlength: [10000, 'Vision cannot exceed 10,000 characters'] // Generous limit
  },

  // === CONTEMPLATIVE SCHEDULING ===
  reminderDateTime: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value > new Date();
      },
      message: 'Reminder must be set for a future date and time'
    }
  },

  reminderSent: {
    type: Boolean,
    default: false
  },

  reminderEmailSentAt: Date,

  // === SESSION CONTEXT ===
  introCompletedAt: {
    type: Date,
    default: Date.now
  },

  lastActiveAt: {
    type: Date,
    default: Date.now
  },

  // Track if they've seen the upgrade prompt
  upgradePromptShown: {
    type: Boolean,
    default: false
  },

  // === AUTOMATIC LIFECYCLE ===
  createdAt: {
    type: Date,
    default: Date.now
  },

  expiresAt: {
    type: Date,
    default: function() {
      // Auto-cleanup after 30 days
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    },
    index: { expireAfterSeconds: 0 } // MongoDB TTL index
  }
});

// === INDEXES ===
introDreamerSchema.index({ email: 1 });
introDreamerSchema.index({ tempToken: 1 }, { unique: true });
introDreamerSchema.index({ reminderDateTime: 1 });
introDreamerSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// === PRE-SAVE MIDDLEWARE ===
introDreamerSchema.pre('save', function(next) {
  // Generate tempToken if not exists
  if (!this.tempToken) {
    this.tempToken = crypto.randomBytes(32).toString('hex');
  }

  // Update lastActiveAt on save
  this.lastActiveAt = new Date();

  next();
});

// === INSTANCE METHODS ===

// Generate new temp token (for security)
introDreamerSchema.methods.generateNewTempToken = function() {
  this.tempToken = crypto.randomBytes(32).toString('hex');
  return this.tempToken;
};

// Check if reminder is due
introDreamerSchema.methods.isReminderDue = function() {
  return this.reminderDateTime &&
         new Date() >= this.reminderDateTime &&
         !this.reminderSent;
};

// Mark reminder as sent
introDreamerSchema.methods.markReminderSent = function() {
  this.reminderSent = true;
  this.reminderEmailSentAt = new Date();
  return this.save();
};

// Extend expiration (if they're actively using it)
introDreamerSchema.methods.extendExpiration = function(days = 30) {
  this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return this.save();
};

// Check if session has expired
introDreamerSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

// Generate return URL with temp token
introDreamerSchema.methods.getReturnUrl = function(baseUrl = process.env.CLIENT_BASE_URL) {
  return `${baseUrl}/dream/continue?token=${this.tempToken}`;
};

// Convert to safe frontend format
introDreamerSchema.methods.toSafeObject = function() {
  return {
    id: this._id,
    email: this.email,
    dreamTitle: this.dreamTitle,
    dreamVision: this.dreamVision,
    reminderDateTime: this.reminderDateTime,
    reminderSent: this.reminderSent,
    introCompletedAt: this.introCompletedAt,
    lastActiveAt: this.lastActiveAt,
    upgradePromptShown: this.upgradePromptShown,
    expiresAt: this.expiresAt,
    returnUrl: this.getReturnUrl(),
    isExpired: this.isExpired()
  };
};

// Prepare data for Dreamer upgrade
introDreamerSchema.methods.prepareForUpgrade = function() {
  return {
    email: this.email,
    dreamTitle: this.dreamTitle,
    dreamVision: this.dreamVision,
    introCompletedAt: this.introCompletedAt,
    upgradeData: {
      introDreamerId: this._id,
      tempToken: this.tempToken,
      originalCreatedAt: this.createdAt
    }
  };
};

// === STATIC METHODS ===

// Find by temp token
introDreamerSchema.statics.findByTempToken = function(token) {
  return this.findOne({
    tempToken: token,
    expiresAt: { $gt: new Date() } // Ensure not expired
  });
};

// Find by email (case-insensitive)
introDreamerSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Find due reminders
introDreamerSchema.statics.findDueReminders = function() {
  return this.find({
    reminderDateTime: {
      $exists: true,
      $lte: new Date()
    },
    reminderSent: false,
    expiresAt: { $gt: new Date() } // Not expired
  });
};

// Cleanup expired reminders that were never sent
introDreamerSchema.statics.cleanupMissedReminders = function() {
  return this.updateMany(
    {
      reminderDateTime: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // 24 hours past
      reminderSent: false
    },
    {
      $set: { reminderSent: true } // Mark as sent so they don't clog up queries
    }
  );
};

// Get upgrade candidates (active but old sessions)
introDreamerSchema.statics.findUpgradeCandidates = function(daysOld = 3) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

  return this.find({
    createdAt: { $lt: cutoffDate },
    lastActiveAt: { $gt: cutoffDate }, // Still active
    upgradePromptShown: false,
    expiresAt: { $gt: new Date() } // Not expired
  });
};

module.exports = mongoose.model('IntroDreamer', introDreamerSchema);
