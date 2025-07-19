/**
 * Dream - The highest entity in DreamShepherd
 * Represents a vision that the user wants to see come true in the world
 */

const generateSlugFromTitle = (title) => {
  // TODO: Implement proper slug generation logic
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
};

export const createDream = ({
  title = '',
  vision = '',
  goals = [],
  roleModels = []
}) => {
  return {
    id: crypto.randomUUID(),
    slug: generateSlugFromTitle(title),
    title,
    vision, // Stored as Markdown for WYSIWYG editing
    goals,
    roleModels,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const updateDream = (dream, updates) => {
  const updatedDream = {
    ...dream,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  // Regenerate slug if title was updated
  if (updates.title !== undefined) {
    updatedDream.slug = generateSlugFromTitle(updates.title);
  }

  return updatedDream;
};

export const addGoalToDream = (dream, goal) => {
  return {
    ...dream,
    goals: [...dream.goals, goal],
    updatedAt: new Date().toISOString()
  };
};

export const removeGoalFromDream = (dream, goalId) => {
  return {
    ...dream,
    goals: dream.goals.filter(goal => goal.id !== goalId),
    updatedAt: new Date().toISOString()
  };
};

export const addRoleModelToDream = (dream, roleModel) => {
  return {
    ...dream,
    roleModels: [...dream.roleModels, roleModel],
    updatedAt: new Date().toISOString()
  };
};

export const removeRoleModelFromDream = (dream, roleModelId) => {
  return {
    ...dream,
    roleModels: dream.roleModels.filter(rm => rm.id !== roleModelId),
    updatedAt: new Date().toISOString()
  };
};

export const validateDream = (dream) => {
  const errors = [];

  if (!dream.title || dream.title.trim().length === 0) {
    errors.push('Dream must have a title');
  }

  if (dream.title && dream.title.length > 200) {
    errors.push('Dream title must be 200 characters or less');
  }

  if (!dream.vision || dream.vision.trim().length === 0) {
    errors.push('Dream must have a vision');
  }

  if (!Array.isArray(dream.goals)) {
    errors.push('Dream goals must be an array');
  }

  if (!Array.isArray(dream.roleModels)) {
    errors.push('Dream role models must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const isDreamPopulated = (dream) => {
  return dream.title.trim().length > 0 && 
         dream.vision.trim().length > 0;
};

export const getDreamProgress = (dream) => {
  if (!Array.isArray(dream.goals) || dream.goals.length === 0) {
    return 0;
  }

  const completedGoals = dream.goals
    .filter(goal => goal.status === 'completed')
    .length;
  return Math.round((completedGoals / dream.goals.length) * 100);
};
