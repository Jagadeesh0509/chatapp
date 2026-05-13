const express = require('express');
const { validationResult, body } = require('express-validator');
const TokenManager = require('../utils/tokenManager');
const PasswordManager = require('../utils/passwordManager');

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
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await db.get(
          'SELECT id FROM users WHERE username = ? OR email = ?',
          [username, email]
        );

        if (existingUser) {
          return res.status(409).json({ error: 'User already exists' });
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

        res.status(201).json({
          message: 'User registered successfully',
          token,
          user: { id: result.id, username, email }
        });
      } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
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
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const { email, password } = req.body;

        const user = await db.get(
          'SELECT id, username, email, password_hash FROM users WHERE email = ?',
          [email]
        );

        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isPasswordValid = await PasswordManager.verifyPassword(password, user.password_hash);
        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update user status to online
        await db.run('UPDATE users SET status = ? WHERE id = ?', ['online', user.id]);

        const token = TokenManager.generateToken({
          id: user.id,
          username: user.username,
          email: user.email
        });

        res.json({
          message: 'Login successful',
          token,
          user: { id: user.id, username: user.username, email: user.email }
        });
      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
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
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Logout failed' });
    }
  });

  return router;
}

module.exports = createAuthRoutes;
