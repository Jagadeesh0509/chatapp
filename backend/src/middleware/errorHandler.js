// Error handling middleware
function errorHandler(err, req, res, next) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Log error
  console.error('[ERROR]', {
    message: err.message,
    stack: isDevelopment ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Customize error response
  const errorResponse = {
    error: err.name || 'Error',
    message: message,
    ...(isDevelopment && { stack: err.stack })
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    errorResponse.message = 'Validation Error';
    errorResponse.details = err.errors || [];
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    errorResponse.message = 'Unauthorized';
  } else if (err.name === 'ForbiddenError') {
    status = 403;
    errorResponse.message = 'Forbidden';
  } else if (err.name === 'NotFoundError') {
    status = 404;
    errorResponse.message = 'Not Found';
  }

  res.status(status).json(errorResponse);
}

module.exports = errorHandler;
