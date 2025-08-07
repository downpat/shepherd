/**
 * ICS Calendar Generation Utility
 * Creates calendar files for dream reminders with embedded return URLs
 * No personal data required - leverages existing calendar habits
 */

/**
 * Inspirational quotes for calendar reminders
 * Provides gentle encouragement and maintains sacred dream context
 */
const INSPIRATIONAL_QUOTES = [
  "Your dreams are the whispers of your soul. It's time to listen.",
  "A dream without a plan is just a wish. Let's make yours real.",
  "The journey of a thousand miles begins with a single step.",
  "Your future self is counting on the decisions you make today.",
  "Dreams don't work unless you do. But you don't have to work alone.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "Every expert was once a beginner. Every pro was once an amateur.",
  "The only impossible journey is the one you never begin.",
  "Your dreams are valid, and so is your ability to achieve them.",
  "Small steps daily lead to big changes yearly."
];

/**
 * Generate a random inspirational quote
 * @returns {string} Inspirational quote
 */
const getRandomQuote = () => {
  const randomIndex = Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length);
  return INSPIRATIONAL_QUOTES[randomIndex];
};

/**
 * Format date for ICS format (YYYYMMDDTHHMMSSZ)
 * @param {Date} date - JavaScript Date object
 * @returns {string} ICS formatted date string
 */
const formatICSDate = (date) => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

/**
 * Generate a unique ID for the calendar event
 * @param {string} tempToken - Temporary token for uniqueness
 * @returns {string} Unique event ID
 */
const generateEventUID = (tempToken) => {
  const timestamp = Date.now();
  return `dream-reminder-${timestamp}-${tempToken.substring(0, 8)}@dreamshepherd.app`;
};

/**
 * Escape special characters for ICS format
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
const escapeICSText = (text) => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
};

/**
 * Generate return URL with embedded tempToken
 * @param {string} tempToken - Temporary token for authentication
 * @param {string} baseUrl - Base URL (optional, defaults to current origin)
 * @returns {string} Return URL with embedded token
 */
const generateReturnUrl = (tempToken, baseUrl = window.location.origin) => {
  return `${baseUrl}/dream/continue?token=${tempToken}`;
};

/**
 * Create ICS calendar content for dream reminder
 * @param {Object} options - Calendar event options
 * @param {string} options.dreamTitle - Title of the dream
 * @param {string} options.tempToken - Temporary authentication token
 * @param {Date} options.reminderDate - When to remind the dreamer
 * @param {string} options.dreamerEmail - Optional email for calendar apps that use it
 * @param {string} options.baseUrl - Optional base URL for return links
 * @returns {string} Complete ICS calendar content
 */
export const generateDreamReminderICS = ({
  dreamTitle,
  tempToken,
  reminderDate,
  dreamerEmail = null,
  baseUrl = null
}) => {
  const now = new Date();
  const eventUID = generateEventUID(tempToken);
  const returnUrl = generateReturnUrl(tempToken, baseUrl);
  const inspirationalQuote = getRandomQuote();
  
  // Format dates for ICS
  const startTime = formatICSDate(reminderDate);
  const endTime = formatICSDate(new Date(reminderDate.getTime() + (30 * 60 * 1000))); // 30 min duration
  const createdTime = formatICSDate(now);
  
  // Create event title and description
  const eventTitle = `✨ Dream Reminder: ${dreamTitle}`;
  const eventDescription = [
    inspirationalQuote,
    '',
    'It\'s time to revisit and refine your dream.',
    '',
    `Return to your dream: ${returnUrl}`,
    '',
    '🌟 DreamShepherd - Your companion for life transformation'
  ].join('\\n');
  
  // Calculate if we should add the day-before reminder (only if more than 36 hours away)
  const hoursUntilReminder = (reminderDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const shouldAddDayBeforeReminder = hoursUntilReminder > 36;
  
  // Build ICS content
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DreamShepherd//Dream Reminder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    '',
    'BEGIN:VEVENT',
    `UID:${eventUID}`,
    `DTSTAMP:${createdTime}`,
    `DTSTART:${startTime}`,
    `DTEND:${endTime}`,
    `SUMMARY:${escapeICSText(eventTitle)}`,
    `DESCRIPTION:${escapeICSText(eventDescription)}`,
    `URL:${returnUrl}`,
    'STATUS:CONFIRMED',
    'TRANSP:TRANSPARENT',
    'SEQUENCE:0',
    ''
  ];
  
  // Add day-before reminder if applicable
  if (shouldAddDayBeforeReminder) {
    icsLines.push(
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeICSText(`Tomorrow: Dream reminder for ${dreamTitle}`)}`,
      'END:VALARM',
      ''
    );
  }
  
  // Add hour-before reminder (always included)
  icsLines.push(
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICSText(`In 1 hour: Dream reminder for ${dreamTitle}`)}`,
    'END:VALARM',
    ''
  );
  
  // Close the event
  icsLines.push(
    'END:VEVENT',
    'END:VCALENDAR'
  );
  
  return icsLines.join('\r\n');
};

/**
 * Download ICS file to user's device
 * @param {string} icsContent - ICS calendar content
 * @param {string} filename - Name for the downloaded file
 */
export const downloadICSFile = (icsContent, filename = 'dream-reminder.ics') => {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  window.URL.revokeObjectURL(url);
};

/**
 * Generate platform-specific calendar URLs for web integration
 * @param {string} icsContent - ICS content to encode
 * @returns {Object} URLs for different calendar platforms
 */
export const generateCalendarPlatformUrls = (icsContent) => {
  const encodedICS = encodeURIComponent(icsContent);
  const dataUri = `data:text/calendar;charset=utf-8,${encodedICS}`;
  
  return {
    // Direct download link
    download: dataUri,
    
    // Google Calendar (uses data URI)
    google: `https://calendar.google.com/calendar/render?action=TEMPLATE&cid=${encodedICS}`,
    
    // Outlook.com
    outlook: dataUri,
    
    // Apple Calendar (iOS/macOS will handle .ics files)
    apple: dataUri,
    
    // Generic fallback
    generic: dataUri
  };
};

/**
 * Create a comprehensive reminder package
 * Generates ICS file and provides multiple integration options
 * @param {Object} reminderData - Same as generateDreamReminderICS options
 * @returns {Object} Complete reminder package with multiple options
 */
export const createDreamReminderPackage = (reminderData) => {
  const icsContent = generateDreamReminderICS(reminderData);
  const platformUrls = generateCalendarPlatformUrls(icsContent);
  const filename = `dream-reminder-${reminderData.dreamTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`;
  
  return {
    icsContent,
    filename,
    platformUrls,
    // Helper method to trigger download
    download: () => downloadICSFile(icsContent, filename),
    // Return URL for direct navigation
    returnUrl: generateReturnUrl(reminderData.tempToken, reminderData.baseUrl)
  };
};

/**
 * Validate reminder date
 * @param {Date|string} date - Date to validate
 * @returns {Object} Validation result with isValid and error message
 */
export const validateReminderDate = (date) => {
  const reminderDate = new Date(date);
  const now = new Date();
  
  if (isNaN(reminderDate.getTime())) {
    return {
      isValid: false,
      error: 'Invalid date format'
    };
  }
  
  if (reminderDate <= now) {
    return {
      isValid: false,
      error: 'Reminder date must be in the future'
    };
  }
  
  // Don't allow reminders more than 1 year in the future
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  
  if (reminderDate > oneYearFromNow) {
    return {
      isValid: false,
      error: 'Reminder date cannot be more than one year in the future'
    };
  }
  
  return {
    isValid: true,
    error: null
  };
};