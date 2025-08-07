// Simple email validation using regex
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const createDreamer = ({
  type, //normal, intro, anonymous
  email = '', // Required for normal, optional for intro, empty for anonymous
  createdAt,
  updatedAt,
}) => {
  return {
    type,
    email: email ? email.trim().toLowerCase() : '',
    createdAt: createdAt || new Date().toISOString(),
    updatedAt: updatedAt || new Date().toISOString()
  }
}

export const updateDreamer = (dreamer, updates) => {
  const updatedDreamer = {
    ...dreamer,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  // Normalize email if it was updated
  if (updates.email !== undefined) {
    updatedDreamer.email = updates.email ? updates.email.trim().toLowerCase() : '';
  }

  return updatedDreamer;
};

export const validateDreamer = (dreamer) => {
  const errors = [];

  // Email validation based on dreamer type
  if (dreamer.type === 'normal') {
    // Email is required for normal dreamers
    if (!dreamer.email || dreamer.email.trim().length === 0) {
      errors.push('Email address is required');
    }
  }

  // For intro dreamers, email is optional
  if (dreamer.type === 'intro' || dreamer.type === 'normal') {
    // If email is provided, validate its format and length
    if (dreamer.email && !isValidEmail(dreamer.email)) {
      errors.push('Please enter a valid email address');
    }

    if (dreamer.email && dreamer.email.length > 254) {
      errors.push('Email address is too long');
    }
  }

  // Anonymous dreamers should not have email
  if (dreamer.type === 'anonymous' && dreamer.email && dreamer.email.trim().length > 0) {
    errors.push('Anonymous dreamers should not have an email address');
  }

  // Type validation
  if (!['anonymous', 'intro', 'normal'].includes(dreamer.type)) {
    errors.push('Dreamer type must be anonymous, intro, or normal');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const isDreamerComplete = (dreamer) => {
  if (dreamer.type === 'anonymous') {
    return true; // Anonymous dreamers are always complete
  }
  
  return dreamer.email.trim().length > 0 && isValidEmail(dreamer.email);
};
