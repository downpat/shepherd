/**
 * UpgradeService
 * Handles migration from IntroDreamer to full Dreamer account
 * Preserves dream data and contemplative context during upgrade
 */

const IntroDreamer = require('../models/IntroDreamer');
const Dreamer = require('../models/Dreamer');
const Dream = require('../models/Dream');

class UpgradeService {
  /**
   * Upgrade IntroDreamer to full Dreamer account
   * @param {string} tempToken - IntroDreamer's temp token
   * @param {Object} registrationData - Full registration data
   * @returns {Object} - { dreamer, dream, tokens }
   */
  static async upgradeToFullAccount(tempToken, registrationData) {

    try {
      // Find the IntroDreamer
      const introDreamer = await IntroDreamer.findByTempToken(tempToken);
      if (!introDreamer) {
        throw new Error('Invalid or expired intro session');
      }

      if (introDreamer.isExpired()) {
        throw new Error('Intro session has expired');
      }

      // Check if email already exists as full Dreamer
      const existingDreamer = await Dreamer.findOne({
        email: introDreamer.email
      });
      if (existingDreamer) {
        throw new Error('An account with this email already exists');
      }

      // Validate registration data
      this.validateRegistrationData(registrationData);

      // Prepare upgrade data
      const introDreamerData = introDreamer.prepareForUpgrade();

      // Create full Dreamer account
      const dreamer = Dreamer.createFromIntroDreamer(
        introDreamerData,
        registrationData
      );

      await dreamer.save();

      // Create their first Dream with preserved data
      const dream = new Dream({
        _id: registrationData.dreamId || this.generateDreamId(),
        dreamerId: dreamer._id,
        title: introDreamer.dreamTitle,
        vision: introDreamer.dreamVision,
        // Preserve original creation context
        createdAt: introDreamer.createdAt,
        updatedAt: new Date()
      });

      await dream.save();

      // Update dreamer's dream count
      dreamer.dreamCount = 1;
      await dreamer.save();

      // Delete the IntroDreamer record
      await IntroDreamer.findByIdAndDelete(introDreamer._id);

      // Generate authentication tokens
      const finalDreamer = await Dreamer.findById(dreamer._id);

      return {
        dreamer: finalDreamer.toSafeObject(),
        dream: dream.toFrontend(),
        tokens: {
          accessToken: finalDreamer.generateAccessToken(),
          refreshToken: finalDreamer.generateRefreshToken()
        }
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Get IntroDreamer by temp token for upgrade preview
   * @param {string} tempToken
   * @returns {Object} - IntroDreamer data for upgrade form
   */
  static async getUpgradePreview(tempToken) {
    const introDreamer = await IntroDreamer.findByTempToken(tempToken);

    if (!introDreamer) {
      throw new Error('Invalid or expired intro session');
    }

    if (introDreamer.isExpired()) {
      throw new Error('Intro session has expired');
    }

    // Check if email already registered
    const existingDreamer = await Dreamer.findOne({
      email: introDreamer.email
    });

    return {
      introDreamer: introDreamer.toSafeObject(),
      emailAlreadyRegistered: !!existingDreamer,
      canUpgrade: !existingDreamer && !introDreamer.isExpired()
    };
  }

  /**
   * Mark IntroDreamer as having seen upgrade prompt
   * @param {string} tempToken
   */
  static async markUpgradePromptShown(tempToken) {
    const introDreamer = await IntroDreamer.findByTempToken(tempToken);

    if (introDreamer && !introDreamer.isExpired()) {
      introDreamer.upgradePromptShown = true;
      await introDreamer.save();
    }
  }

  /**
   * Get upgrade candidates for proactive outreach
   * @param {number} daysOld - How old the session should be
   * @returns {Array} - Array of IntroDreamers ready for upgrade
   */
  static async getUpgradeCandidates(daysOld = 3) {
    return await IntroDreamer.findUpgradeCandidates(daysOld);
  }

  /**
   * Validate registration data
   * @param {Object} data
   */
  static validateRegistrationData(data) {
    const errors = [];

    if (!data.password || data.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    if (data.firstName && data.firstName.length > 50) {
      errors.push('First name cannot exceed 50 characters');
    }

    if (data.lastName && data.lastName.length > 50) {
      errors.push('Last name cannot exceed 50 characters');
    }

    if (data.displayName && data.displayName.length > 100) {
      errors.push('Display name cannot exceed 100 characters');
    }

    // Validate preferences if provided
    if (data.preferences) {
      const { theme, animationSpeed, shepherdPersonality } = data.preferences;

      if (theme && !['light', 'dark', 'auto'].includes(theme)) {
        errors.push('Invalid theme preference');
      }

      if (animationSpeed && !['slow', 'normal', 'fast'].includes(animationSpeed)) {
        errors.push('Invalid animation speed preference');
      }

      if (shepherdPersonality && !['gentle', 'encouraging', 'wise'].includes(shepherdPersonality)) {
        errors.push('Invalid shepherd personality preference');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Generate unique Dream ID
   * @returns {string}
   */
  static generateDreamId() {
    const crypto = require('crypto');
    return crypto.randomUUID();
  }

  /**
   * Get statistics about IntroDreamer to Dreamer conversions
   * @param {number} days - Number of days to look back
   * @returns {Object} - Conversion statistics
   */
  static async getConversionStats(days = 30) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [introCount, upgradeCount] = await Promise.all([
      IntroDreamer.countDocuments({
        createdAt: { $gte: cutoffDate }
      }),
      Dreamer.countDocuments({
        'upgradedFrom.upgradedAt': { $gte: cutoffDate }
      })
    ]);

    const conversionRate = introCount > 0 ? (upgradeCount / introCount) * 100 : 0;

    return {
      period: `${days} days`,
      introDreamersCreated: introCount,
      upgradesCompleted: upgradeCount,
      conversionRate: Math.round(conversionRate * 100) / 100,
      pendingUpgrades: await IntroDreamer.countDocuments({
        createdAt: { $gte: cutoffDate },
        upgradePromptShown: false
      })
    };
  }
}

module.exports = UpgradeService;
