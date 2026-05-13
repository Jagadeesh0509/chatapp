/**
 * Input Validation Utilities
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Username validation (alphanumeric, underscore, hyphen, 3-30 chars)
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

class ValidationError extends Error {
  constructor(message, errors = {}) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Validate email format
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'Email is required' };
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return { valid: false, message: 'Invalid email format' };
  }
  return { valid: true };
}

/**
 * Validate username format
 */
function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { valid: false, message: 'Username is required' };
  }
  if (!USERNAME_REGEX.test(username)) {
    return { 
      valid: false, 
      message: 'Username must be 3-30 characters (alphanumeric, underscore, hyphen only)' 
    };
  }
  return { valid: true };
}

/**
 * Validate password strength
 */
function validatePassword(password) {
  const errors = [];
  
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    message: errors.length > 0 ? errors.join('; ') : undefined,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Validate registration input
 */
function validateRegistration(username, email, password) {
  const errors = {};
  
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    errors.username = usernameValidation.message;
  }
  
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    errors.email = emailValidation.message;
  }
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.message;
  }
  
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Invalid registration input', errors);
  }
}

/**
 * Validate login input
 */
function validateLogin(email, password) {
  const errors = {};
  
  if (!email) {
    errors.email = 'Email is required';
  }
  
  if (!password) {
    errors.password = 'Password is required';
  }
  
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Invalid login input', errors);
  }
}

/**
 * Validate room creation
 */
function validateRoomCreation(name, description, is_public) {
  const errors = {};
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.name = 'Room name is required and must be a non-empty string';
  } else if (name.length > 100) {
    errors.name = 'Room name must be less than 100 characters';
  }
  
  if (description && typeof description !== 'string') {
    errors.description = 'Description must be a string';
  } else if (description && description.length > 500) {
    errors.description = 'Description must be less than 500 characters';
  }
  
  if (typeof is_public !== 'boolean' && is_public !== undefined) {
    errors.is_public = 'is_public must be a boolean';
  }
  
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Invalid room creation input', errors);
  }
}

/**
 * Validate message content
 */
function validateMessage(content) {
  const errors = {};
  
  if (!content || typeof content !== 'string') {
    errors.content = 'Message content is required';
  } else if (content.trim().length === 0) {
    errors.content = 'Message cannot be empty';
  } else if (content.length > 5000) {
    errors.content = 'Message is too long (max 5000 characters)';
  }
  
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Invalid message input', errors);
  }
}

/**
 * Validate user ID
 */
function validateUserId(userId) {
  if (!userId || (typeof userId !== 'string' && typeof userId !== 'number')) {
    return { valid: false, message: 'User ID is required' };
  }
  if (isNaN(parseInt(userId))) {
    return { valid: false, message: 'User ID must be a valid number' };
  }
  return { valid: true };
}

/**
 * Validate room ID
 */
function validateRoomId(roomId) {
  if (!roomId || (typeof roomId !== 'string' && typeof roomId !== 'number')) {
    return { valid: false, message: 'Room ID is required' };
  }
  if (isNaN(parseInt(roomId))) {
    return { valid: false, message: 'Room ID must be a valid number' };
  }
  return { valid: true };
}

module.exports = {
  ValidationError,
  validateEmail,
  validateUsername,
  validatePassword,
  validateRegistration,
  validateLogin,
  validateRoomCreation,
  validateMessage,
  validateUserId,
  validateRoomId
};
