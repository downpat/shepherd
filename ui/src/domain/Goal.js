/**
 * Goal - SMART framework implementation for Dreams
 * Goals are structured breakdowns of Dreams with specific measurable outcomes
 * Loosely coupled to Dreams to support future many-to-many relationships
 */

const TIME_HORIZONS = {
  SHORT_TERM: 'short-term',    // Achieved by specific day (within 1 year)
  MID_TERM: 'mid-term',        // Achieved by specific month (within 3 years)
  LONG_TERM: 'long-term'       // Achieved by specific year (5+ years out)
};

const CONFIDENCE_SCALE = {
  MIN: 1,
  MAX: 10
};

const GOAL_CATEGORIES = {
  HEALTH: 'Health',
  FITNESS: 'Fitness',
  EDUCATION: 'Education',
  PROFESSIONAL: 'Professional',
  SOCIAL: 'Social',
  FAMILY: 'Family',
  MONEY: 'Money',
  SPIRITUAL: 'Spiritual'
};

const generateGoalSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
};

const validateTimeLimit = (timeHorizon, timeLimit) => {
  const now = new Date();
  const limitDate = new Date(timeLimit);
  
  if (isNaN(limitDate.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }

  switch (timeHorizon) {
    case TIME_HORIZONS.SHORT_TERM:
      // Should be a specific day within 1 year
      const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      if (limitDate > oneYearFromNow) {
        return { isValid: false, error: 'Short-term goals should be within 1 year' };
      }
      break;
    
    case TIME_HORIZONS.MID_TERM:
      // Should be a specific month within 3 years
      const threeYearsFromNow = new Date(now.getFullYear() + 3, now.getMonth(), 1);
      if (limitDate > threeYearsFromNow) {
        return { isValid: false, error: 'Mid-term goals should be within 3 years' };
      }
      break;
    
    case TIME_HORIZONS.LONG_TERM:
      // Should be a specific year, preferably 5+ years out
      const fiveYearsFromNow = new Date(now.getFullYear() + 5, 0, 1);
      if (limitDate < fiveYearsFromNow) {
        return { isValid: false, error: 'Long-term goals should be at least 5 years in the future' };
      }
      break;
  }

  return { isValid: true };
};

export const createGoal = ({
  title = '',
  description = '',
  target = '',
  magnitude = '',
  confidence = 5,
  relevance = '',
  category = GOAL_CATEGORIES.HEALTH,
  timeHorizon = TIME_HORIZONS.SHORT_TERM,
  timeLimit = null,
  dreamIds = []  // Array to support future many-to-many relationship
}) => {
  return {
    id: crypto.randomUUID(),
    slug: generateGoalSlug(title),
    
    // SMART Framework Implementation
    title,           // S - Specific: Clear title
    description,     // S - Specific: Detailed description
    target,          // M - Measurable: What to achieve
    magnitude,       // M - Measurable: How much/many
    confidence,      // A - Attainable: Confidence score 1-10
    relevance,       // R - Relevant: Connection to Dream(s)
    timeHorizon,     // T - Time-bound: short/mid/long term
    timeLimit,       // T - Time-bound: Specific deadline
    
    // Organization and Classification
    category,        // Goal category for organization and filtering
    
    // Relationships (loosely coupled for future flexibility)
    dreamIds,        // Array of Dream IDs this Goal relates to
    
    // Status and metadata
    status: 'active',  // active, completed, paused, abandoned
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const updateGoal = (goal, updates) => {
  const updatedGoal = {
    ...goal,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  // Regenerate slug if title was updated
  if (updates.title !== undefined) {
    updatedGoal.slug = generateGoalSlug(updates.title);
  }

  return updatedGoal;
};

export const addDreamToGoal = (goal, dreamId) => {
  if (goal.dreamIds.includes(dreamId)) {
    return goal; // Already associated
  }
  
  return {
    ...goal,
    dreamIds: [...goal.dreamIds, dreamId],
    updatedAt: new Date().toISOString()
  };
};

export const removeDreamFromGoal = (goal, dreamId) => {
  return {
    ...goal,
    dreamIds: goal.dreamIds.filter(id => id !== dreamId),
    updatedAt: new Date().toISOString()
  };
};

export const completeGoal = (goal) => {
  return {
    ...goal,
    status: 'completed',
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const pauseGoal = (goal, reason = '') => {
  return {
    ...goal,
    status: 'paused',
    pauseReason: reason,
    pausedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const resumeGoal = (goal) => {
  const resumed = {
    ...goal,
    status: 'active',
    resumedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Remove pause-specific fields
  delete resumed.pauseReason;
  delete resumed.pausedAt;
  
  return resumed;
};

export const abandonGoal = (goal, reason = '') => {
  return {
    ...goal,
    status: 'abandoned',
    abandonReason: reason,
    abandonedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const validateGoal = (goal) => {
  const errors = [];

  // SMART validation
  if (!goal.title || goal.title.trim().length === 0) {
    errors.push('Goal must have a title (Specific)');
  }

  if (goal.title && goal.title.length > 200) {
    errors.push('Goal title must be 200 characters or less');
  }

  if (!goal.description || goal.description.trim().length === 0) {
    errors.push('Goal must have a description (Specific)');
  }

  if (!goal.target || goal.target.trim().length === 0) {
    errors.push('Goal must have a target (Measurable)');
  }

  if (!goal.magnitude || goal.magnitude.trim().length === 0) {
    errors.push('Goal must have a magnitude (Measurable)');
  }

  if (!Number.isInteger(goal.confidence) || 
      goal.confidence < CONFIDENCE_SCALE.MIN || 
      goal.confidence > CONFIDENCE_SCALE.MAX) {
    errors.push(`Confidence must be an integer between ${CONFIDENCE_SCALE.MIN} and ${CONFIDENCE_SCALE.MAX} (Attainable)`);
  }

  if (!goal.relevance || goal.relevance.trim().length === 0) {
    errors.push('Goal must explain its relevance to the Dream(s) (Relevant)');
  }

  if (!Object.values(GOAL_CATEGORIES).includes(goal.category)) {
    errors.push('Goal must have a valid category');
  }

  if (!Object.values(TIME_HORIZONS).includes(goal.timeHorizon)) {
    errors.push('Goal must have a valid time horizon (Time-bound)');
  }

  if (!goal.timeLimit) {
    errors.push('Goal must have a specific time limit (Time-bound)');
  } else {
    const timeLimitValidation = validateTimeLimit(goal.timeHorizon, goal.timeLimit);
    if (!timeLimitValidation.isValid) {
      errors.push(`Time limit error: ${timeLimitValidation.error}`);
    }
  }

  if (!Array.isArray(goal.dreamIds)) {
    errors.push('Goal dreamIds must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const isGoalPopulated = (goal) => {
  return goal.title.trim().length > 0 &&
         goal.description.trim().length > 0 &&
         goal.target.trim().length > 0 &&
         goal.magnitude.trim().length > 0 &&
         goal.relevance.trim().length > 0 &&
         goal.timeLimit !== null &&
         goal.category;
};

export const getGoalUrgency = (goal) => {
  if (!goal.timeLimit) return 0;
  
  const now = new Date();
  const deadline = new Date(goal.timeLimit);
  const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
  
  if (daysUntilDeadline < 0) return 100; // Overdue
  if (daysUntilDeadline <= 7) return 90;  // Very urgent
  if (daysUntilDeadline <= 30) return 70; // Urgent
  if (daysUntilDeadline <= 90) return 50; // Moderate
  return 20; // Low urgency
};

export const getGoalProgress = (goal) => {
  // This will be enhanced when we add Plans and Tasks
  // For now, it's either 0% (active) or 100% (completed)
  return goal.status === 'completed' ? 100 : 0;
};

// Helper function to get appropriate date format based on time horizon
export const getTimeLimitFormat = (timeHorizon) => {
  switch (timeHorizon) {
    case TIME_HORIZONS.SHORT_TERM:
      return 'YYYY-MM-DD'; // Specific day
    case TIME_HORIZONS.MID_TERM:
      return 'YYYY-MM';    // Specific month
    case TIME_HORIZONS.LONG_TERM:
      return 'YYYY';       // Specific year
    default:
      return 'YYYY-MM-DD';
  }
};

// Helper function to filter goals by category
export const getGoalsByCategory = (goals, category) => {
  return goals.filter(goal => goal.category === category);
};

// Helper function to get goals by time horizon
export const getGoalsByTimeHorizon = (goals, timeHorizon) => {
  return goals.filter(goal => goal.timeHorizon === timeHorizon);
};

export { TIME_HORIZONS, CONFIDENCE_SCALE, GOAL_CATEGORIES };