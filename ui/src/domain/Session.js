/**
 * Session - Time and energy set aside for discovery and practice
 * Has prerequisites and duration, focused on process over concrete outcomes
 */

// Simple counter for integer IDs (would be managed by service layer in practice)
let nextSessionId = 1;

const generateSessionSlug = (title, id) => {
  const baseSlug = title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
  return `session-${id}-${baseSlug}`;
};

export const createSession = ({
  title = '',
  description = '',
  missionConnection = '',
  scheduledDate = null,
  scheduledTime = null,
  duration = 60, // Duration in minutes
  prerequisites = [], // Array of prerequisite strings
  planId = null
}) => {
  const id = nextSessionId++;
  
  return {
    id,                      // Simple integer ID
    slug: generateSessionSlug(title, id),
    
    // Session definition
    title,                   // Session name
    description,             // What this session involves
    missionConnection,       // How this relates to plan's mission statement
    
    // Scheduling
    scheduledDate,           // Date in YYYY-MM-DD format
    scheduledTime,           // Time in HH:MM format (24-hour)
    duration,                // Length in minutes
    scheduledDateTime: scheduledDate && scheduledTime ? 
      new Date(`${scheduledDate}T${scheduledTime}:00`) : null,
    
    // Prerequisites
    prerequisites,           // Array of conditions like ["quiet workspace", "not too tired", "guitar available"]
    
    // Status tracking
    status: 'scheduled',     // scheduled, completed, skipped
    
    // Post-session reflection (only populated after completion)
    sessionNotes: '',        // What they learned/accomplished/experienced
    sessionMood: '',         // How they felt about the session
    
    // Relationships
    planId,                  // Parent plan
    
    // Metadata
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const updateSession = (session, updates) => {
  const updatedSession = {
    ...session,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  // Regenerate slug if title was updated
  if (updates.title !== undefined) {
    updatedSession.slug = generateSessionSlug(updates.title, session.id);
  }

  // Update scheduledDateTime if date or time changed
  if (updates.scheduledDate !== undefined || updates.scheduledTime !== undefined) {
    const date = updates.scheduledDate || session.scheduledDate;
    const time = updates.scheduledTime || session.scheduledTime;
    updatedSession.scheduledDateTime = date && time ? 
      new Date(`${date}T${time}:00`) : null;
  }

  return updatedSession;
};

export const completeSession = (session, sessionNotes = '', sessionMood = '') => {
  return {
    ...session,
    status: 'completed',
    sessionNotes,
    sessionMood,
    updatedAt: new Date().toISOString()
  };
};

export const skipSession = (session) => {
  return {
    ...session,
    status: 'skipped',
    updatedAt: new Date().toISOString()
  };
};

export const addPrerequisite = (session, prerequisite) => {
  if (session.prerequisites.includes(prerequisite)) {
    return session; // Already exists
  }
  
  return {
    ...session,
    prerequisites: [...session.prerequisites, prerequisite],
    updatedAt: new Date().toISOString()
  };
};

export const removePrerequisite = (session, prerequisite) => {
  return {
    ...session,
    prerequisites: session.prerequisites.filter(p => p !== prerequisite),
    updatedAt: new Date().toISOString()
  };
};

export const cloneSession = (session, newScheduledDate = null, newScheduledTime = null) => {
  return createSession({
    title: session.title,
    description: session.description,
    missionConnection: session.missionConnection,
    scheduledDate: newScheduledDate || session.scheduledDate,
    scheduledTime: newScheduledTime || session.scheduledTime,
    duration: session.duration,
    prerequisites: [...session.prerequisites],
    planId: session.planId
  });
};

export const validateSession = (session) => {
  const errors = [];

  if (!session.title || session.title.trim().length === 0) {
    errors.push('Session must have a title');
  }

  if (session.title && session.title.length > 100) {
    errors.push('Session title must be 100 characters or less');
  }

  if (!session.description || session.description.trim().length === 0) {
    errors.push('Session must have a description');
  }

  if (!session.missionConnection || session.missionConnection.trim().length === 0) {
    errors.push('Session must explain how it relates to the mission statement');
  }

  if (!session.scheduledDate) {
    errors.push('Session must have a scheduled date');
  }

  if (!session.scheduledTime) {
    errors.push('Session must have a scheduled time');
  }

  if (!Number.isInteger(session.duration) || session.duration <= 0) {
    errors.push('Session duration must be a positive integer (minutes)');
  }

  if (!Array.isArray(session.prerequisites)) {
    errors.push('Session prerequisites must be an array');
  }

  if (!session.planId) {
    errors.push('Session must be associated with a Plan');
  }

  // Validate date format
  if (session.scheduledDate && !/^\d{4}-\d{2}-\d{2}$/.test(session.scheduledDate)) {
    errors.push('Scheduled date must be in YYYY-MM-DD format');
  }

  // Validate time format  
  if (session.scheduledTime && !/^\d{2}:\d{2}$/.test(session.scheduledTime)) {
    errors.push('Scheduled time must be in HH:MM format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const isSessionPopulated = (session) => {
  return session.title.trim().length > 0 &&
         session.description.trim().length > 0 &&
         session.missionConnection.trim().length > 0 &&
         session.scheduledDate !== null &&
         session.scheduledTime !== null &&
         session.duration > 0;
};

export const isSessionOverdue = (session) => {
  if (!session.scheduledDateTime || session.status === 'completed') {
    return false;
  }
  
  return new Date() > session.scheduledDateTime;
};

export const isSessionToday = (session) => {
  if (!session.scheduledDate) return false;
  
  const today = new Date().toISOString().split('T')[0];
  return session.scheduledDate === today;
};

export const getSessionsByTitle = (sessions, title) => {
  return sessions.filter(session => 
    session.title.toLowerCase() === title.toLowerCase()
  );
};

export const getCompletedSessionsByTitle = (sessions, title, days = 60) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return sessions
    .filter(session => 
      session.title.toLowerCase() === title.toLowerCase() &&
      session.status === 'completed' &&
      new Date(session.updatedAt) >= cutoffDate
    );
};

// Helper to get unique session titles for autocomplete
export const getUniqueSessionTitles = (sessions) => {
  const titles = sessions.map(session => session.title);
  return [...new Set(titles)].sort();
};

// Helper to get the most recent session with a given title (for cloning)
export const getMostRecentSessionByTitle = (sessions, title) => {
  const matchingSessions = getSessionsByTitle(sessions, title);
  if (matchingSessions.length === 0) return null;
  
  return matchingSessions.reduce((latest, current) => 
    new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
  );
};

// Helper to get common prerequisites for autocomplete
export const getCommonPrerequisites = (sessions) => {
  const allPrerequisites = sessions.flatMap(session => session.prerequisites);
  const prerequisiteCounts = {};
  
  allPrerequisites.forEach(prereq => {
    prerequisiteCounts[prereq] = (prerequisiteCounts[prereq] || 0) + 1;
  });
  
  return Object.entries(prerequisiteCounts)
    .sort(([,a], [,b]) => b - a)
    .map(([prereq]) => prereq);
};

// Get session end time
export const getSessionEndTime = (session) => {
  if (!session.scheduledDateTime) return null;
  
  const endTime = new Date(session.scheduledDateTime);
  endTime.setMinutes(endTime.getMinutes() + session.duration);
  return endTime;
};

// Reset the ID counter (useful for testing or service layer management)
export const resetSessionIdCounter = (startId = 1) => {
  nextSessionId = startId;
};

// Get current ID counter value
export const getCurrentSessionId = () => nextSessionId;