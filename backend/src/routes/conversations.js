const express = require('express');

function createConversationRoutes(db) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const userId = req.user.id;

      const conversations = await db.all(
        `SELECT pc.*, u1.username as participant1_username, u1.avatar_url as participant1_avatar,
                u1.email as participant1_email, u1.status as participant1_status,
                u2.username as participant2_username, u2.avatar_url as participant2_avatar,
                u2.email as participant2_email, u2.status as participant2_status
         FROM private_conversations pc
         LEFT JOIN users u1 ON pc.participant1_id = u1.id
         LEFT JOIN users u2 ON pc.participant2_id = u2.id
         WHERE pc.participant1_id = ? OR pc.participant2_id = ?
         ORDER BY pc.updated_at DESC`,
        [userId, userId]
      );

      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  });

  router.post('/with/:userId', async (req, res) => {
    try {
      const currentUserId = req.user.id;
      const targetUserId = parseInt(req.params.userId, 10);

      if (targetUserId === currentUserId) {
        return res.status(400).json({ error: 'Cannot create conversation with yourself' });
      }

      const targetUser = await db.get(
        'SELECT id, username, avatar_url, email, status FROM users WHERE id = ?',
        [targetUserId]
      );

      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      let conversation = await db.get(
        `SELECT pc.*, u1.username as participant1_username, u1.avatar_url as participant1_avatar,
                u1.email as participant1_email, u1.status as participant1_status,
                u2.username as participant2_username, u2.avatar_url as participant2_avatar,
                u2.email as participant2_email, u2.status as participant2_status
         FROM private_conversations pc
         LEFT JOIN users u1 ON pc.participant1_id = u1.id
         LEFT JOIN users u2 ON pc.participant2_id = u2.id
         WHERE (pc.participant1_id = ? AND pc.participant2_id = ?)
            OR (pc.participant1_id = ? AND pc.participant2_id = ?)`,
        [currentUserId, targetUserId, targetUserId, currentUserId]
      );

      if (!conversation) {
        const participant1Id = Math.min(currentUserId, targetUserId);
        const participant2Id = Math.max(currentUserId, targetUserId);

        const result = await db.run(
          'INSERT INTO private_conversations (participant1_id, participant2_id) VALUES (?, ?)',
          [participant1Id, participant2Id]
        );

        conversation = await db.get(
          `SELECT pc.*, u1.username as participant1_username, u1.avatar_url as participant1_avatar,
                  u1.email as participant1_email, u1.status as participant1_status,
                  u2.username as participant2_username, u2.avatar_url as participant2_avatar,
                  u2.email as participant2_email, u2.status as participant2_status
           FROM private_conversations pc
           LEFT JOIN users u1 ON pc.participant1_id = u1.id
           LEFT JOIN users u2 ON pc.participant2_id = u2.id
           WHERE pc.id = ?`,
          [result.id]
        );
      }

      res.json(conversation);
    } catch (error) {
      console.error('Error getting conversation:', error);
      res.status(500).json({ error: 'Failed to get conversation' });
    }
  });

  return router;
}

module.exports = createConversationRoutes;
