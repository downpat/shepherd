/**
 * HabitIdentity - The earned identity badge representing a habit
 * Created when Tasks/Sessions complete 30+ times in 60 days
 * Represents who the Dreamer has become through perseverance
 */

const generateHabitIdentitySlug = (name) => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
};

export const createHabitIdentity = ({
  name = '',
  sourceType = 'task', // 'task' or 'session' - what this habit evolved from
  sourceTitle = '',    // Original task/session title that became this habit
  planId = null,
  promotedAt = new Date().toISOString() // When this became a habit identity
}) => {
  return {
    id: crypto.randomUUID(),    // Complex UUID for identity
    slug: generateHabitIdentitySlug(name),
    
    // Habit Identity (Badge of Honor)
    name,                       // What the Dreamer calls this habit (their chosen name)
    sourceType,                 // Whether it evolved from a task or session
    sourceTitle,                // Original task/session title
    promotedAt,                 // When this earned habit status
    
    // Status
    status: 'active',           // active, paused, retired
    
    // Relationships
    planId,                     // Parent plan
    instanceIds: [],            // Array of HabitInstance IDs using this identity
    
    // Metadata
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const updateHabitIdentity = (habitIdentity, updates) => {
  const updated = {
    ...habitIdentity,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  // Regenerate slug if name was updated
  if (updates.name !== undefined) {
    updated.slug = generateHabitIdentitySlug(updates.name);
  }

  return updated;
};

export const addInstanceToIdentity = (habitIdentity, instanceId) => {
  if (habitIdentity.instanceIds.includes(instanceId)) {
    return habitIdentity; // Already added
  }
  
  return {
    ...habitIdentity,
    instanceIds: [...habitIdentity.instanceIds, instanceId],
    updatedAt: new Date().toISOString()
  };
};

export const removeInstanceFromIdentity = (habitIdentity, instanceId) => {
  return {
    ...habitIdentity,
    instanceIds: habitIdentity.instanceIds.filter(id => id !== instanceId),
    updatedAt: new Date().toISOString()
  };
};

export const pauseHabitIdentity = (habitIdentity, reason = '') => {
  return {
    ...habitIdentity,
    status: 'paused',
    pauseReason: reason,
    pausedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const resumeHabitIdentity = (habitIdentity) => {
  const resumed = {
    ...habitIdentity,
    status: 'active',
    resumedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Remove pause-specific fields
  delete resumed.pauseReason;
  delete resumed.pausedAt;
  
  return resumed;
};

export const retireHabitIdentity = (habitIdentity, reason = '') => {
  return {
    ...habitIdentity,
    status: 'retired',
    retireReason: reason,
    retiredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const validateHabitIdentity = (habitIdentity) => {
  const errors = [];

  if (!habitIdentity.name || habitIdentity.name.trim().length === 0) {
    errors.push('Habit identity must have a name');
  }

  if (habitIdentity.name && habitIdentity.name.length > 100) {
    errors.push('Habit identity name must be 100 characters or less');
  }

  if (!['task', 'session'].includes(habitIdentity.sourceType)) {
    errors.push('Habit identity sourceType must be either "task" or "session"');
  }

  if (!habitIdentity.sourceTitle || habitIdentity.sourceTitle.trim().length === 0) {
    errors.push('Habit identity must have a sourceTitle (original task/session name)');
  }

  if (!Array.isArray(habitIdentity.instanceIds)) {
    errors.push('Habit identity instanceIds must be an array');
  }

  if (!habitIdentity.planId) {
    errors.push('Habit identity must be associated with a Plan');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const isHabitIdentityPopulated = (habitIdentity) => {
  return habitIdentity.name.trim().length > 0 &&
         habitIdentity.sourceTitle.trim().length > 0;
};