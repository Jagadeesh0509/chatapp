const express = require('express');
const { validationResult, body } = require('express-validator');
const TokenManager = require('../utils/tokenManager');
const PasswordManager = require('../utils/passwordManager');
const { sendSuccess, sendError, sendValidationError } = require('../utils/apiResponse');
const { validateRegistration, validateLogin } = require('../utils/validation');

function createAuthRoutes(db) {
  const router = express.Router();

  // Register endpoint
  router.post(
    '/register',
    [
      body('username').trim().isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters'),
      body('email').isEmail().withMessage('Invalid email'),
      body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return sendValidationError(res, errors.array());
        }

        const { username, email, password } = req.body;

        // Additional custom validation
        try {
          validateRegistration(username, email, password);
        } catch (validationError) {
          return sendValidationError(res, validationError.errors);
        }

        // Check if user already exists
        const existingUser = await db.get(
          'SELECT id FROM users WHERE username = ? OR email = ?',
          [username, email]
        );

        if (existingUser) {
          return sendError(res, 'User already exists with this username or email', 409);
        }

        // Hash password and create user
        const passwordHash = await PasswordManager.hashPassword(password);
        const result = await db.run(
          'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
          [username, email, passwordHash]
        );

        const token = TokenManager.generateToken({
          id: result.id,
          username,
          email
        });

        sendSuccess(res, {
          token,
          user: { id: result.id, username, email }
        }, 'User registered successfully', 201);
      } catch (error) {
        console.error('Registration error:', error);
        sendError(res, 'Registration failed', 500);
      }
    }
  );

  // Login endpoint
  router.post(
    '/login',
    [
      body('email').isEmail().withMessage('Invalid email'),
      body('password').exists().withMessage('Password required')
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return sendValidationError(res, errors.array());
        }

        const { email, password } = req.body;

        // Additional custom validation
        try {
          validateLogin(email, password);
        } catch (validationError) {
          return sendValidationError(res, validationError.errors);
        }

        const user = await db.get(
          'SELECT id, username, email, password_hash FROM users WHERE email = ?',
          [email]
        );

        if (!user) {
          return sendError(res, 'Invalid email or password', 401);
        }

        const isPasswordValid = await PasswordManager.verifyPassword(password, user.password_hash);
        if (!isPasswordValid) {
          return sendError(res, 'Invalid email or password', 401);
        }

        // Update user status to online
        await db.run('UPDATE users SET status = ? WHERE id = ?', ['online', user.id]);

        const token = TokenManager.generateToken({
          id: user.id,
          username: user.username,
          email: user.email
        });

        sendSuccess(res, {
          token,
          user: { id: user.id, username: user.username, email: user.email }
        }, 'Login successful');
      } catch (error) {
        console.error('Login error:', error);
        sendError(res, 'Login failed', 500);
      }
    }
  );

  // Logout endpoint
  router.post('/logout', async (req, res) => {
    try {
      const userId = req.user?.id;
      if (userId) {
        await db.run('UPDATE users SET status = ? WHERE id = ?', ['offline', userId]);
      }
      sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      sendError(res, 'Logout failed', 500);
    }
  });

  return router;
}

module.exports = createAuthRoutes;
