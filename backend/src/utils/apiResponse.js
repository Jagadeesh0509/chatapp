/**
 * Standardized API Response Utilities
 * Ensures consistent response format across all endpoints
 */

class ApiResponse {
  constructor(status, data = null, message = null, errors = null) {
    this.success = status >= 200 && status < 300;
    this.status = status;
    this.data = data;
    this.message = message;
    this.errors = errors;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      success: this.success,
      status: this.status,
      message: this.message,
      data: this.data,
      ...(this.errors && { errors: this.errors }),
      timestamp: this.timestamp
    };
  }
}

/**
 * Send success response
 */
function sendSuccess(res, data = null, message = 'Success', status = 200) {
  const response = new ApiResponse(status, data, message);
  return res.status(status).json(response.toJSON());
}

/**
 * Send error response
 */
function sendError(res, message = 'Error', status = 400, errors = null) {
  const response = new ApiResponse(status, null, message, errors);
  return res.status(status).json(response.toJSON());
}

/**
 * Send validation error response
 */
function sendValidationError(res, errors) {
  const response = new ApiResponse(400, null, 'Validation Error', errors);
  return res.status(400).json(response.toJSON());
}

/**
 * Send unauthorized response
 */
function sendUnauthorized(res, message = 'Unauthorized') {
  const response = new ApiResponse(401, null, message);
  return res.status(401).json(response.toJSON());
}

/**
 * Send forbidden response
 */
function sendForbidden(res, message = 'Forbidden') {
  const response = new ApiResponse(403, null, message);
  return res.status(403).json(response.toJSON());
}

/**
 * Send not found response
 */
function sendNotFound(res, message = 'Not Found') {
  const response = new ApiResponse(404, null, message);
  return res.status(404).json(response.toJSON());
}

module.exports = {
  ApiResponse,
  sendSuccess,
  sendError,
  sendValidationError,
  sendUnauthorized,
  sendForbidden,
  sendNotFound
};
