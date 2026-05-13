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

function getSocketByUserId(io, targetUserId) {
  return Array.from(io.sockets.sockets.values()).find(
    (socket) => Number(socket.userId) === Number(targetUserId)
  );
}

function parseMentions(rawMentions) {
  try {
    return rawMentions ? JSON.parse(rawMentions) : [];
  } catch (error) {
    return [];
  }
}

function extractMentionUsernames(content) {
  const matches = content.match(/@(\w+)/g) || [];
  return [...new Set(matches.map((match) => match.slice(1)))];
}

async function hydrateMessage(db, messageId) {
  const message = await db.get(
    `SELECT m.*, u.username, u.avatar_url
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.id = ?`,
    [messageId]
  );

  if (!message) {
    return null;
  }

  const receipts = await db.all(
    `SELECT mrr.user_id, mrr.read_at, u.username
     FROM message_read_receipts mrr
     JOIN users u ON u.id = mrr.user_id
     WHERE mrr.message_id = ?
     ORDER BY mrr.read_at ASC`,
    [messageId]
  );

  return {
    ...message,
    mentions: parseMentions(message.mentions),
    readBy: receipts.map((receipt) => ({
      userId: receipt.user_id,
      username: receipt.username,
      readAt: receipt.read_at
    }))
  };
}

function createSocketHandlers(io, db) {
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    const userId = socket.userId;
    const username = socket.username;

    console.log(`User connected: ${username} (${userId})`);
    connectedUsers.set(userId, { socketId: socket.id, username });

    (async () => {
      try {
        await db.run('UPDATE users SET status = ? WHERE id = ?', ['online', userId]);
        io.emit('user:status-changed', { userId, status: 'online', username });
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    })();

    socket.on('room:join', async ({ roomId }) => {
      try {
        const member = await isRoomMember(db, roomId, userId);
        if (!member) {
          socket.emit('error', { message: 'Join the room before using it' });
          return;
        }

        socket.join(`room:${roomId}`);
        socket.to(`room:${roomId}`).emit('room:user-joined', {
          userId,
          username,
          message: `${username} has joined the room`
        });
        socket.emit('room:joined', { roomId, status: 'success' });
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    socket.on('room:leave', async ({ roomId }) => {
      socket.leave(`room:${roomId}`);

      try {
        io.to(`room:${roomId}`).emit('room:user-left', {
          userId,
          username,
          message: `${username} has left the room`
        });
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    });

    socket.on('message:send', async (data) => {
      const {
        content,
        roomId,
        conversationId,
        messageType = 'text',
        mentions = []
      } = data;

      try {
        if (!content || content.trim().length === 0) {
          socket.emit('error', { message: 'Message content cannot be empty' });
          return;
        }

        if (roomId) {
          const member = await isRoomMember(db, roomId, userId);
          if (!member) {
            socket.emit('error', { message: 'Join the room before sending messages' });
            return;
          }
        }

        if (conversationId) {
          const participant = await isConversationParticipant(
            db,
            conversationId,
            userId
          );
          if (!participant) {
            socket.emit('error', { message: 'Unauthorized conversation access' });
            return;
          }
        }

        let resolvedMentions = [];
        const requestedMentions =
          Array.isArray(mentions) && mentions.length > 0
            ? [...new Set(mentions)]
            : extractMentionUsernames(content);

        if (requestedMentions.length > 0) {
          const uniqueMentions = [...new Set(requestedMentions)];
          const placeholders = uniqueMentions.map(() => '?').join(', ');
          const mentionedUsers = await db.all(
            `SELECT id, username FROM users WHERE username IN (${placeholders})`,
            uniqueMentions
          );
          resolvedMentions = mentionedUsers.filter(
            (mentionedUser) => Number(mentionedUser.id) !== Number(userId)
          );
        }

        const result = await db.run(
          `INSERT INTO messages (content, sender_id, room_id, conversation_id, message_type, mentions, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            content,
            userId,
            roomId || null,
            conversationId || null,
            messageType,
            JSON.stringify(resolvedMentions.map((mentionedUser) => mentionedUser.username)),
            new Date().toISOString()
          ]
        );

        if (conversationId) {
          await db.run(
            'UPDATE private_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [conversationId]
          );
        }

        const message = await hydrateMessage(db, result.id);

        if (roomId) {
          io.to(`room:${roomId}`).emit('message:received', message);
        } else if (conversationId) {
          io.to(`conversation:${conversationId}`).emit('message:received', message);
        }

        for (const mentionedUser of resolvedMentions) {
          await db.run(
            `INSERT INTO notifications (user_id, type, related_user_id, related_message_id, related_room_id)
             VALUES (?, ?, ?, ?, ?)`,
            [mentionedUser.id, 'mention', userId, result.id, roomId || null]
          );

          const userSocket = getSocketByUserId(io, mentionedUser.id);
          if (userSocket) {
            userSocket.emit('notification:received', {
              type: 'mention',
              is_read: 0,
              message: `${username} mentioned you in a message`,
              related_username: username,
              related_message_id: result.id,
              related_room_id: roomId || null,
              created_at: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('message:edit', async ({ messageId, newContent }) => {
      try {
        const message = await db.get('SELECT * FROM messages WHERE id = ?', [messageId]);

        if (!message || Number(message.sender_id) !== Number(userId)) {
          socket.emit('error', { message: 'Unauthorized or message not found' });
          return;
        }

        await db.run(
          `INSERT INTO message_edit_history (message_id, previous_content, edited_by)
           VALUES (?, ?, ?)`,
          [messageId, message.content, userId]
        );

        const mentionUsernames = extractMentionUsernames(newContent);
        await db.run(
          'UPDATE messages SET content = ?, mentions = ?, is_edited = 1, edited_at = CURRENT_TIMESTAMP WHERE id = ?',
          [newContent, JSON.stringify(mentionUsernames), messageId]
        );

        const updatedMessage = await hydrateMessage(db, messageId);

        if (message.room_id) {
          io.to(`room:${message.room_id}`).emit('message:edited', updatedMessage);
        } else if (message.conversation_id) {
          io.to(`conversation:${message.conversation_id}`).emit('message:edited', updatedMessage);
        }
      } catch (error) {
        console.error('Error editing message:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    socket.on('message:delete', async ({ messageId }) => {
      try {
        const message = await db.get('SELECT * FROM messages WHERE id = ?', [messageId]);

        if (!message || Number(message.sender_id) !== Number(userId)) {
          socket.emit('error', { message: 'Unauthorized or message not found' });
          return;
        }

        await db.run(
          'UPDATE messages SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
          [messageId]
        );

        if (message.room_id) {
          io.to(`room:${message.room_id}`).emit('message:deleted', { messageId });
        } else if (message.conversation_id) {
          io.to(`conversation:${message.conversation_id}`).emit('message:deleted', { messageId });
        }
      } catch (error) {
        console.error('Error deleting message:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    socket.on('typing:start', ({ roomId, conversationId }) => {
      if (roomId) {
        socket.to(`room:${roomId}`).emit('user:typing', { userId, username });
      } else if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit('user:typing', {
          userId,
          username
        });
      }
    });

    socket.on('typing:stop', ({ roomId, conversationId }) => {
      if (roomId) {
        socket.to(`room:${roomId}`).emit('user:stopped-typing', {
          userId,
          username
        });
      } else if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit('user:stopped-typing', {
          userId,
          username
        });
      }
    });

    socket.on('message:read', async ({ messageId, conversationId }) => {
      try {
        const participant = await isConversationParticipant(
          db,
          conversationId,
          userId
        );
        if (!participant) {
          return;
        }

        await db.run(
          'INSERT OR IGNORE INTO message_read_receipts (message_id, user_id) VALUES (?, ?)',
          [messageId, userId]
        );

        io.to(`conversation:${conversationId}`).emit('message:read-receipt', {
          messageId,
          userId,
          username,
          readAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error processing read receipt:', error);
      }
    });

    socket.on('conversation:join', async ({ conversationId }) => {
      try {
        const participant = await isConversationParticipant(
          db,
          conversationId,
          userId
        );
        if (!participant) {
          socket.emit('error', { message: 'Unauthorized conversation access' });
          return;
        }

        socket.join(`conversation:${conversationId}`);
        socket.emit('conversation:joined', {
          conversationId,
          status: 'success'
        });
      } catch (error) {
        console.error('Error joining conversation:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    socket.on('conversation:leave', ({ conversationId }) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('disconnect', () => {
      connectedUsers.delete(userId);
      console.log(`User disconnected: ${username} (${userId})`);

      (async () => {
        try {
          await db.run('UPDATE users SET status = ? WHERE id = ?', ['offline', userId]);
          io.emit('user:status-changed', { userId, status: 'offline', username });
        } catch (error) {
          console.error('Error updating user status on disconnect:', error);
        }
      })();
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return {
    io,
    getConnectedUsers: () => Array.from(connectedUsers.values())
  };
}

module.exports = createSocketHandlers;
