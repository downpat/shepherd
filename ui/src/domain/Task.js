/**
 * Task - Simple, disposable activities within Plans
 * Uses integer IDs, minimal fields, easy to create and repeat
 */

// Simple counter for integer IDs (would be managed by service layer in practice)
let nextTaskId = 1;

const generateTaskSlug = (title, id) => {
  const baseSlug = title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
  return `task-${id}-${baseSlug}`;
};

export const createTask = ({
  title = '',
  scheduledDate = null,
  scheduledTime = null,
  planId = null
}) => {
  const id = nextTaskId++;
  
  return {
    id,                      // Simple integer ID
    slug: generateTaskSlug(title, id),
    
    // Task essentials
    title,                   // Simple task name
    
    // Scheduling
    scheduledDate,           // Date in YYYY-MM-DD format
    scheduledTime,           // Time in HH:MM format (24-hour)
    scheduledDateTime: scheduledDate && scheduledTime ? 
      new Date(`${scheduledDate}T${scheduledTime}:00`) : null,
    
    // Simple status tracking
    status: 'scheduled',     // scheduled, completed, skipped
    
    // Relationships
    planId,                  // Parent plan
    
    // Metadata
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const updateTask = (task, updates) => {
  const updatedTask = {
    ...task,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  // Regenerate slug if title was updated
  if (updates.title !== undefined) {
    updatedTask.slug = generateTaskSlug(updates.title, task.id);
  }

  // Update scheduledDateTime if date or time changed
  if (updates.scheduledDate !== undefined || updates.scheduledTime !== undefined) {
    const date = updates.scheduledDate || task.scheduledDate;
    const time = updates.scheduledTime || task.scheduledTime;
    updatedTask.scheduledDateTime = date && time ? 
      new Date(`${date}T${time}:00`) : null;
  }

  return updatedTask;
};

export const completeTask = (task) => {
  return {
    ...task,
    status: 'completed',
    updatedAt: new Date().toISOString()
  };
};

export const skipTask = (task) => {
  return {
    ...task,
    status: 'skipped',
    updatedAt: new Date().toISOString()
  };
};

export const cloneTask = (task, newScheduledDate = null, newScheduledTime = null) => {
  return createTask({
    title: task.title,
    scheduledDate: newScheduledDate || task.scheduledDate,
    scheduledTime: newScheduledTime || task.scheduledTime,
    planId: task.planId
  });
};

export const validateTask = (task) => {
  const errors = [];

  if (!task.title || task.title.trim().length === 0) {
    errors.push('Task must have a title');
  }

  if (task.title && task.title.length > 100) {
    errors.push('Task title must be 100 characters or less');
  }

  if (!task.scheduledDate) {
    errors.push('Task must have a scheduled date');
  }

  if (!task.scheduledTime) {
    errors.push('Task must have a scheduled time');
  }

  if (!task.planId) {
    errors.push('Task must be associated with a Plan');
  }

  // Validate date format
  if (task.scheduledDate && !/^\d{4}-\d{2}-\d{2}$/.test(task.scheduledDate)) {
    errors.push('Scheduled date must be in YYYY-MM-DD format');
  }

  // Validate time format  
  if (task.scheduledTime && !/^\d{2}:\d{2}$/.test(task.scheduledTime)) {
    errors.push('Scheduled time must be in HH:MM format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const isTaskPopulated = (task) => {
  return task.title.trim().length > 0 &&
         task.scheduledDate !== null &&
         task.scheduledTime !== null;
};

export const isTaskOverdue = (task) => {
  if (!task.scheduledDateTime || task.status === 'completed') {
    return false;
  }
  
  return new Date() > task.scheduledDateTime;
};

export const isTaskToday = (task) => {
  if (!task.scheduledDate) return false;
  
  const today = new Date().toISOString().split('T')[0];
  return task.scheduledDate === today;
};

export const getTasksByTitle = (tasks, title) => {
  return tasks.filter(task => 
    task.title.toLowerCase() === title.toLowerCase()
  );
};

export const getCompletedTasksByTitle = (tasks, title, days = 60) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return tasks
    .filter(task => 
      task.title.toLowerCase() === title.toLowerCase() &&
      task.status === 'completed' &&
      new Date(task.updatedAt) >= cutoffDate
    );
};

// Helper to get unique task titles for autocomplete
export const getUniqueTaskTitles = (tasks) => {
  const titles = tasks.map(task => task.title);
  return [...new Set(titles)].sort();
};

// Helper to get the most recent task with a given title (for cloning)
export const getMostRecentTaskByTitle = (tasks, title) => {
  const matchingTasks = getTasksByTitle(tasks, title);
  if (matchingTasks.length === 0) return null;
  
  return matchingTasks.reduce((latest, current) => 
    new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
  );
};

// Reset the ID counter (useful for testing or service layer management)
export const resetTaskIdCounter = (startId = 1) => {
  nextTaskId = startId;
};

// Get current ID counter value
export const getCurrentTaskId = () => nextTaskId;