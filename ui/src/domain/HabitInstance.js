/**
 * HabitInstance - Pairing of a HabitIdentity with a Task
 * Represents a scheduled occurrence of an earned habit
 */

export const createHabitInstance = ({
  habitIdentityId = null,
  taskId = null
}) => {
  return {
    habitIdentityId,    // UUID of the HabitIdentity
    taskId,             // Integer ID of the Task
    
    // Metadata
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const updateHabitInstance = (habitInstance, updates) => {
  return {
    ...habitInstance,
    ...updates,
    updatedAt: new Date().toISOString()
  };
};

export const validateHabitInstance = (habitInstance) => {
  const errors = [];

  if (!habitInstance.habitIdentityId) {
    errors.push('Habit instance must have a habitIdentityId');
  }

  if (!habitInstance.taskId) {
    errors.push('Habit instance must have a taskId');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const isHabitInstancePopulated = (habitInstance) => {
  return habitInstance.habitIdentityId !== null &&
         habitInstance.taskId !== null;
};

// Helper to get instances for a specific habit identity
export const getInstancesForIdentity = (habitInstances, habitIdentityId) => {
  return habitInstances.filter(instance => 
    instance.habitIdentityId === habitIdentityId
  );
};

// Helper to get instances for a specific task
export const getInstancesForTask = (habitInstances, taskId) => {
  return habitInstances.filter(instance => 
    instance.taskId === taskId
  );
};