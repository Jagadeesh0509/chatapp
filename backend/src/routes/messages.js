const express = require('express');

function parseMentions(rawMentions) {
  try {
    return rawMentions ? JSON.parse(rawMentions) : [];
  } catch (error) {
    return [];
  }
}

async function isRoomMember(db, roomId, userId) {
  const membership = await db.get(
    'SELECT id FROM room_members WHERE room_id = ? AND user_id = ?',
    [roomId, userId]
  );
  return Boolean(membership);
}

async function isConversationParticipant(db, conversationId, userId) {
  const conversation = await db.get(
    `SELECT id
     FROM private_conversations
     WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)`,
    [conversationId, userId, userId]
  );
  return Boolean(conversation);
}

async function attachReadReceipts(db, messages) {
  if (messages.length === 0) {
    return [];
  }

  const messageIds = messages.map((message) => message.id);
  const placeholders = messageIds.map(() => '?').join(', ');

  const receipts = await db.all(
    `SELECT mrr.message_id, mrr.user_id, mrr.read_at, u.username
     FROM message_read_receipts mrr
     JOIN users u ON u.id = mrr.user_id
     WHERE mrr.message_id IN (${placeholders})
     ORDER BY mrr.read_at ASC`,
    messageIds
  );

  const receiptsByMessageId = receipts.reduce((accumulator, receipt) => {
    if (!accumulator[receipt.message_id]) {
      accumulator[receipt.message_id] = [];
    }

    accumulator[receipt.message_id].push({
      userId: receipt.user_id,
      username: receipt.username,
      readAt: receipt.read_at
    });

    return accumulator;
  }, {});

  return messages.map((message) => ({
    ...message,
    mentions: parseMentions(message.mentions),
    readBy: receiptsByMessageId[message.id] || []
  }));
}

function createMessageRoutes(db) {
  const router = express.Router();

  router.get('/room/:roomId', async (req, res) => {
    try {
      const { roomId } = req.params;
      const userId = req.user.id;
      const page = Math.max(parseInt(req.query.page || '1', 10), 1);
      const limit = Math.min(
        Math.max(parseInt(req.query.limit || '50', 10), 1),
        100
      );
      const offset = (page - 1) * limit;

      const member = await isRoomMember(db, roomId, userId);
      if (!member) {
        return res.status(403).json({ error: 'Join the room before viewing messages' });
      }

      const messages = await db.all(
        `SELECT m.*, u.username, u.avatar_url
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.room_id = ? AND m.is_deleted = 0
         ORDER BY m.created_at ASC
         LIMIT ? OFFSET ?`,
        [roomId, limit, offset]
      );

      const countResult = await db.get(
        'SELECT COUNT(*) as total FROM messages WHERE room_id = ? AND is_deleted = 0',
        [roomId]
      );

      res.json({
        messages: await attachReadReceipts(db, messages),
        total: countResult.total,
        page,
        limit
      });
    } catch (error) {
      console.error('Error fetching room messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  router.get('/conversation/:conversationId', async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;
      const page = Math.max(parseInt(req.query.page || '1', 10), 1);
      const limit = Math.min(
        Math.max(parseInt(req.query.limit || '50', 10), 1),
        100
      );
      const offset = (page - 1) * limit;

      const participant = await isConversationParticipant(
        db,
        conversationId,
        userId
      );
      if (!participant) {
        return res.status(403).json({ error: 'Unauthorized conversation access' });
      }

      const messages = await db.all(
        `SELECT m.*, u.username, u.avatar_url
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.conversation_id = ? AND m.is_deleted = 0
         ORDER BY m.created_at ASC
         LIMIT ? OFFSET ?`,
        [conversationId, limit, offset]
      );

      const countResult = await db.get(
        'SELECT COUNT(*) as total FROM messages WHERE conversation_id = ? AND is_deleted = 0',
        [conversationId]
      );

      res.json({
        messages: await attachReadReceipts(db, messages),
        total: countResult.total,
        page,
        limit
      });
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  router.post('/mark-read', async (req, res) => {
    try {
      const { messageIds } = req.body;
      const userId = req.user.id;

      if (!Array.isArray(messageIds) || messageIds.length === 0) {
        return res.status(400).json({ error: 'Invalid message IDs' });
      }

      const placeholders = messageIds.map(() => '?').join(', ');
      const validMessages = await db.all(
        `SELECT m.id
         FROM messages m
         JOIN private_conversations pc ON pc.id = m.conversation_id
         WHERE m.id IN (${placeholders})
           AND (pc.participant1_id = ? OR pc.participant2_id = ?)`,
        [...messageIds, userId, userId]
      );

      if (validMessages.length === 0) {
        return res.status(403).json({ error: 'No accessible messages to update' });
      }

      for (const validMessage of validMessages) {
        await db.run(
          'INSERT OR IGNORE INTO message_read_receipts (message_id, user_id) VALUES (?, ?)',
          [validMessage.id, userId]
        );
      }

      res.json({ message: 'Messages marked as read' });
    } catch (error) {
      console.error('Error marking messages read:', error);
      res.status(500).json({ error: 'Failed to mark messages as read' });
    }
  });

  return router;
}

module.exports = createMessageRoutes;
