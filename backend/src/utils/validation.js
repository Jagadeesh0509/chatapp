/**
 * Input Validation Utilities
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Username validation (simple)
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
      message: 'Username must be 3-30 characters'
    };
  }

  return { valid: true };
}

/**
 * SIMPLE PASSWORD VALIDATION
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      message: 'Password is required'
    };
  }

  // only minimum 3 chars
  if (password.length < 3) {
    return {
      valid: false,
      message: 'Password must be at least 3 characters'
    };
  }

  // accept everything else
  return {
    valid: true
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
    throw new ValidationError('Validation Error', errors);
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
    errors.name = 'Room name is required';
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
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Invalid message input', errors);
  }
}

/**
 * Validate user ID
 */
function validateUserId(userId) {
  if (!userId) {
    return {
      valid: false,
      message: 'User ID is required'
    };
  }

  return { valid: true };
}

/**
 * Validate room ID
 */
function validateRoomId(roomId) {
  if (!roomId) {
    return {
      valid: false,
      message: 'Room ID is required'
    };
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