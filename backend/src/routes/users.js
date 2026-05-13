const express = require('express');
const { body, validationResult } = require('express-validator');

function createUserRoutes(db) {
  const router = express.Router();

  router.get('/all', async (req, res) => {
    try {
      const users = await db.all(
        'SELECT id, username, email, status, avatar_url FROM users'
      );
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  router.get('/online', async (req, res) => {
    try {
      const users = await db.all(
        "SELECT id, username, status, avatar_url FROM users WHERE status = 'online'"
      );
      res.json(users);
    } catch (error) {
      console.error('Error fetching online users:', error);
      res.status(500).json({ error: 'Failed to fetch online users' });
    }
  });

  router.get('/profile/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await db.get(
        'SELECT id, username, email, status, avatar_url, created_at FROM users WHERE id = ?',
        [userId]
      );

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  });

  router.put(
    '/profile/:userId',
    [
      body('username').optional().trim().isLength({ min: 3, max: 20 }),
      body('avatar_url').optional({ nullable: true, checkFalsy: true }).isURL()
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const { userId } = req.params;
        const { username, avatar_url } = req.body;

        if (req.user.id !== parseInt(userId, 10)) {
          return res.status(403).json({ error: 'Unauthorized' });
        }

        if (username) {
          const existingUser = await db.get(
            'SELECT id FROM users WHERE username = ? AND id != ?',
            [username, userId]
          );

          if (existingUser) {
            return res.status(409).json({ error: 'Username already in use' });
          }
        }

        const updates = [];
        const values = [];

        if (username) {
          updates.push('username = ?');
          values.push(username);
        }

        if (Object.prototype.hasOwnProperty.call(req.body, 'avatar_url')) {
          updates.push('avatar_url = ?');
          values.push(avatar_url || null);
        }

        if (updates.length === 0) {
          return res.status(400).json({ error: 'No updates provided' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(userId);

        await db.run(
          `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
          values
        );

        const updatedUser = await db.get(
          'SELECT id, username, email, status, avatar_url FROM users WHERE id = ?',
          [userId]
        );

        res.json({ message: 'Profile updated successfully', user: updatedUser });
      } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
      }
    }
  );

  router.get('/search', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || q.length < 2) {
        return res.status(400).json({ error: 'Query must be at least 2 characters' });
      }

      const users = await db.all(
        'SELECT id, username, email, status, avatar_url FROM users WHERE username LIKE ? LIMIT 10',
        [`%${q}%`]
      );

      res.json(users);
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({ error: 'Failed to search users' });
    }
  });

  router.get('/notifications', async (req, res) => {
    try {
      const notifications = await db.all(
        `SELECT n.*, u.username as related_username
         FROM notifications n
         LEFT JOIN users u ON u.id = n.related_user_id
         WHERE n.user_id = ?
         ORDER BY n.created_at DESC
         LIMIT 25`,
        [req.user.id]
      );

      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  router.post('/notifications/read-all', async (req, res) => {
    try {
      await db.run(
        'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
        [req.user.id]
      );

      res.json({ message: 'Notifications marked as read' });
    } catch (error) {
      console.error('Error updating notifications:', error);
      res.status(500).json({ error: 'Failed to update notifications' });
    }
  });

  return router;
}

module.exports = createUserRoutes;
