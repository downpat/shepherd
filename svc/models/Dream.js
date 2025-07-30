/**
 * Dream Mongoose Model
 * Backend ODM representation of Dream entity
 * Belongs to Dreamer, no knowledge of IntroDreamer model
 */

const mongoose = require('mongoose');

const dreamSchema = new mongoose.Schema({
  // Use custom ID matching frontend UUID generation
  _id: {
    type: String,
    required: true
  },

  // === OWNERSHIP ===
  dreamerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Dreamer',
    index: true // Index for fast owner lookups
  },

  // === DREAM DATA ===
  slug: {
    type: String,
    required: true,
    index: true // Index for lookups (scoped per dreamer, not globally unique)
  },

  title: {
    type: String,
    required: true,
    maxLength: 200 // Match frontend validation
  },

  vision: {
    type: String, // Store Tiptap JSON as string
    default: ''
  },

  goals: [{
    type: String, // Array of Goal IDs
    ref: 'Goal'
  }],

  roleModels: [{
    type: String, // Array of RoleModel IDs
    ref: 'RoleModel'
  }],

  // === AUDIT ===
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  // Disable automatic _id generation since we provide custom IDs
  _id: false,
  // Enable automatic updatedAt timestamp
  timestamps: { createdAt: false, updatedAt: true }
});

// === INDEXES ===
dreamSchema.index({ dreamerId: 1, slug: 1 }, { unique: true }); // Slug unique per dreamer
dreamSchema.index({ dreamerId: 1, updatedAt: -1 }); // Latest dreams per dreamer
dreamSchema.index({ dreamerId: 1, createdAt: -1 }); // Oldest dreams per dreamer

// === MIDDLEWARE ===

// Pre-save middleware to generate slug from title
dreamSchema.pre('validate', function(next) {
  if (this.isNew || this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  }
  next();
});

// === INSTANCE METHODS ===

// Convert to frontend format
dreamSchema.methods.toFrontend = function() {
  return {
    id: this._id,
    slug: this.slug,
    title: this.title,
    vision: this.vision,
    goals: this.goals,
    roleModels: this.roleModels,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString()
  };
};

// Check if dreamer owns this dream
dreamSchema.methods.isOwnedBy = function(dreamerId) {
  return this.dreamerId.toString() === dreamerId.toString();
};

// === STATIC METHODS ===

// Create from frontend format with dreamerId
dreamSchema.statics.createForDreamer = function(dreamData, dreamerId) {
  return new this({
    _id: dreamData.id,
    dreamerId: dreamerId,
    slug: dreamData.slug,
    title: dreamData.title,
    vision: dreamData.vision,
    goals: dreamData.goals || [],
    roleModels: dreamData.roleModels || []
  });
};

// Find dreams by dreamer ID
dreamSchema.statics.findByDreamer = function(dreamerId, options = {}) {
  const query = this.find({ dreamerId });

  if (options.sort) {
    query.sort(options.sort);
  } else {
    query.sort({ updatedAt: -1 }); // Default: most recently updated first
  }

  if (options.limit) {
    query.limit(options.limit);
  }

  return query;
};

// Find dream by dreamer and slug
dreamSchema.statics.findByDreamerAndSlug = function(dreamerId, slug) {
  return this.findOne({ dreamerId, slug });
};

// Count dreams for a dreamer
dreamSchema.statics.countByDreamer = function(dreamerId) {
  return this.countDocuments({ dreamerId });
};

module.exports = mongoose.model('Dream', dreamSchema);
