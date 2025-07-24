/**
 * Plan - Daily workspace for achieving Goals
 * One-to-one relationship with Goals, contains Tasks, Sessions, and Habits
 * Mission statement tracks evolving approach with versioning
 */

const generatePlanSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
};

export const createPlan = ({
  title = '',
  goalId = null,
  missionStatement = '',
  missionVersion = 1
}) => {
  return {
    id: crypto.randomUUID(),
    slug: generatePlanSlug(title),
    
    // Basic Plan Information
    title,
    
    // Relationship to Goal (one-to-one)
    goalId,
    
    // Mission Statement with Versioning
    missionStatement,        // Current mission statement
    missionVersion,          // Current version number
    missionHistory: [        // Historical versions
      {
        version: 1,
        statement: missionStatement,
        createdAt: new Date().toISOString(),
        reason: 'Initial mission statement'
      }
    ],
    
    // Collections of work items
    taskIds: [],             // Array of Task IDs
    sessionIds: [],          // Array of Session IDs  
    habitIds: [],            // Array of Habit IDs
    
    // Plan Statistics (calculated)
    stats: {
      totalTasks: 0,
      completedTasks: 0,
      skippedTasks: 0,
      totalSessions: 0,
      completedSessions: 0,
      activeHabits: 0,
      completedHabits: 0
    },
    
    // Status and metadata
    status: 'active',        // active, completed, paused, archived
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const updatePlan = (plan, updates) => {
  const updatedPlan = {
    ...plan,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  // Regenerate slug if title was updated
  if (updates.title !== undefined) {
    updatedPlan.slug = generatePlanSlug(updates.title);
  }

  return updatedPlan;
};

export const updateMissionStatement = (plan, newStatement, reason = '') => {
  const newVersion = plan.missionVersion + 1;
  
  return {
    ...plan,
    missionStatement: newStatement,
    missionVersion: newVersion,
    missionHistory: [
      ...plan.missionHistory,
      {
        version: newVersion,
        statement: newStatement,
        createdAt: new Date().toISOString(),
        reason: reason || `Mission statement update v${newVersion}`
      }
    ],
    updatedAt: new Date().toISOString()
  };
};

export const addTaskToPlan = (plan, taskId) => {
  if (plan.taskIds.includes(taskId)) {
    return plan; // Already added
  }
  
  return {
    ...plan,
    taskIds: [...plan.taskIds, taskId],
    stats: {
      ...plan.stats,
      totalTasks: plan.stats.totalTasks + 1
    },
    updatedAt: new Date().toISOString()
  };
};

export const removeTaskFromPlan = (plan, taskId) => {
  return {
    ...plan,
    taskIds: plan.taskIds.filter(id => id !== taskId),
    stats: {
      ...plan.stats,
      totalTasks: Math.max(0, plan.stats.totalTasks - 1)
    },
    updatedAt: new Date().toISOString()
  };
};

export const addSessionToPlan = (plan, sessionId) => {
  if (plan.sessionIds.includes(sessionId)) {
    return plan; // Already added
  }
  
  return {
    ...plan,
    sessionIds: [...plan.sessionIds, sessionId],
    stats: {
      ...plan.stats,
      totalSessions: plan.stats.totalSessions + 1
    },
    updatedAt: new Date().toISOString()
  };
};

export const removeSessionFromPlan = (plan, sessionId) => {
  return {
    ...plan,
    sessionIds: plan.sessionIds.filter(id => id !== sessionId),
    stats: {
      ...plan.stats,
      totalSessions: Math.max(0, plan.stats.totalSessions - 1)
    },
    updatedAt: new Date().toISOString()
  };
};

export const addHabitToPlan = (plan, habitId) => {
  if (plan.habitIds.includes(habitId)) {
    return plan; // Already added
  }
  
  return {
    ...plan,
    habitIds: [...plan.habitIds, habitId],
    stats: {
      ...plan.stats,
      activeHabits: plan.stats.activeHabits + 1
    },
    updatedAt: new Date().toISOString()
  };
};

export const removeHabitFromPlan = (plan, habitId) => {
  return {
    ...plan,
    habitIds: plan.habitIds.filter(id => id !== habitId),
    stats: {
      ...plan.stats,
      activeHabits: Math.max(0, plan.stats.activeHabits - 1)
    },
    updatedAt: new Date().toISOString()
  };
};

export const updatePlanStats = (plan, stats) => {
  return {
    ...plan,
    stats: {
      ...plan.stats,
      ...stats
    },
    updatedAt: new Date().toISOString()
  };
};

export const completePlan = (plan) => {
  return {
    ...plan,
    status: 'completed',
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const pausePlan = (plan, reason = '') => {
  return {
    ...plan,
    status: 'paused',
    pauseReason: reason,
    pausedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const resumePlan = (plan) => {
  const resumed = {
    ...plan,
    status: 'active',
    resumedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Remove pause-specific fields
  delete resumed.pauseReason;
  delete resumed.pausedAt;
  
  return resumed;
};

export const archivePlan = (plan, reason = '') => {
  return {
    ...plan,
    status: 'archived',
    archiveReason: reason,
    archivedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const validatePlan = (plan) => {
  const errors = [];

  if (!plan.title || plan.title.trim().length === 0) {
    errors.push('Plan must have a title');
  }

  if (plan.title && plan.title.length > 200) {
    errors.push('Plan title must be 200 characters or less');
  }

  if (!plan.goalId) {
    errors.push('Plan must be associated with a Goal (one-to-one relationship)');
  }

  if (!plan.missionStatement || plan.missionStatement.trim().length === 0) {
    errors.push('Plan must have a mission statement');
  }

  if (!Array.isArray(plan.taskIds)) {
    errors.push('Plan taskIds must be an array');
  }

  if (!Array.isArray(plan.sessionIds)) {
    errors.push('Plan sessionIds must be an array');
  }

  if (!Array.isArray(plan.habitIds)) {
    errors.push('Plan habitIds must be an array');
  }

  if (!Array.isArray(plan.missionHistory)) {
    errors.push('Plan missionHistory must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const isPlanPopulated = (plan) => {
  return plan.title.trim().length > 0 &&
         plan.missionStatement.trim().length > 0 &&
         plan.goalId !== null;
};

export const getPlanProgress = (plan) => {
  const { totalTasks, completedTasks, totalSessions, completedSessions } = plan.stats;
  const totalWork = totalTasks + totalSessions;
  const completedWork = completedTasks + completedSessions;
  
  if (totalWork === 0) return 0;
  return Math.round((completedWork / totalWork) * 100);
};

export const getPlanActivityLevel = (plan) => {
  const recentDays = 7;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - (recentDays * 24 * 60 * 60 * 1000));
  
  // This would need to be enhanced with actual task/session completion data
  // For now, return activity level based on total work items
  const totalWork = plan.stats.totalTasks + plan.stats.totalSessions + plan.stats.activeHabits;
  
  if (totalWork === 0) return 'inactive';
  if (totalWork >= 20) return 'very-active';
  if (totalWork >= 10) return 'active';
  if (totalWork >= 5) return 'moderate';
  return 'light';
};

// Helper to get mission statement by version
export const getMissionByVersion = (plan, version) => {
  return plan.missionHistory.find(entry => entry.version === version);
};

// Helper to get all mission statements chronologically
export const getMissionHistory = (plan) => {
  return [...plan.missionHistory].sort((a, b) => a.version - b.version);
};