const express = require('express');
const { body, validationResult } = require('express-validator');

function createRoomRoutes(db) {
  const router = express.Router();

  // Create a new public room
  router.post(
    '/create',
    [
      body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Room name required'),
      body('description').optional().trim().isLength({ max: 500 }),
      body('is_public').optional().isBoolean()
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const { name, description, is_public = true } = req.body;
        const userId = req.user.id;

        // Check if room name exists
        const existingRoom = await db.get('SELECT id FROM chat_rooms WHERE name = ?', [name]);
        if (existingRoom) {
          return res.status(409).json({ error: 'Room name already exists' });
        }

        // Create room
        const result = await db.run(
          'INSERT INTO chat_rooms (name, description, creator_id, is_public) VALUES (?, ?, ?, ?)',
          [name, description || null, userId, is_public ? 1 : 0]
        );

        // Add creator as member
        await db.run(
          'INSERT INTO room_members (room_id, user_id) VALUES (?, ?)',
          [result.id, userId]
        );

        const room = await db.get('SELECT * FROM chat_rooms WHERE id = ?', [result.id]);
        res.status(201).json({ message: 'Room created successfully', room });
      } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ error: 'Failed to create room' });
      }
    }
  );

  // Get all public rooms
  router.get('/all', async (req, res) => {
    try {
      const rooms = await db.all(
        `SELECT r.*, u.username as creator_name, COUNT(DISTINCT rm.user_id) as member_count
         FROM chat_rooms r
         LEFT JOIN users u ON r.creator_id = u.id
         LEFT JOIN room_members rm ON r.id = rm.room_id
         WHERE r.is_public = 1
         GROUP BY r.id
         ORDER BY r.created_at DESC`
      );

      res.json(rooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      res.status(500).json({ error: 'Failed to fetch rooms' });
    }
  });

  // Get room details
  router.get('/:roomId', async (req, res) => {
    try {
      const { roomId } = req.params;

      const room = await db.get(
        `SELECT r.*, u.username as creator_name, COUNT(DISTINCT rm.user_id) as member_count
         FROM chat_rooms r
         LEFT JOIN users u ON r.creator_id = u.id
         LEFT JOIN room_members rm ON r.id = rm.room_id
         WHERE r.id = ?
         GROUP BY r.id`,
        [roomId]
      );

      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      res.json(room);
    } catch (error) {
      console.error('Error fetching room:', error);
      res.status(500).json({ error: 'Failed to fetch room' });
    }
  });

  // Get room members
  router.get('/:roomId/members', async (req, res) => {
    try {
      const { roomId } = req.params;

      const members = await db.all(
        `SELECT u.id, u.username, u.status, u.avatar_url
         FROM users u
         INNER JOIN room_members rm ON u.id = rm.user_id
         WHERE rm.room_id = ?`,
        [roomId]
      );

      res.json(members);
    } catch (error) {
      console.error('Error fetching room members:', error);
      res.status(500).json({ error: 'Failed to fetch room members' });
    }
  });

  // Join room
  router.post('/:roomId/join', async (req, res) => {
    try {
      const { roomId } = req.params;
      const userId = req.user.id;

      // Check if user already member
      const isMember = await db.get(
        'SELECT id FROM room_members WHERE room_id = ? AND user_id = ?',
        [roomId, userId]
      );

      if (isMember) {
        return res.status(409).json({ error: 'User already member of this room' });
      }

      // Add user to room
      await db.run(
        'INSERT INTO room_members (room_id, user_id) VALUES (?, ?)',
        [roomId, userId]
      );

      res.json({ message: 'Joined room successfully' });
    } catch (error) {
      console.error('Error joining room:', error);
      res.status(500).json({ error: 'Failed to join room' });
    }
  });

  // Leave room
  router.post('/:roomId/leave', async (req, res) => {
    try {
      const { roomId } = req.params;
      const userId = req.user.id;

      await db.run(
        'DELETE FROM room_members WHERE room_id = ? AND user_id = ?',
        [roomId, userId]
      );

      res.json({ message: 'Left room successfully' });
    } catch (error) {
      console.error('Error leaving room:', error);
      res.status(500).json({ error: 'Failed to leave room' });
    }
  });

  // Invite user to room
  router.post('/:roomId/invite', async (req, res) => {
    try {
      const { roomId } = req.params;
      const { userId } = req.body;
      const inviterId = req.user.id;

      // Check if invoker is room member
      const inviterMembership = await db.get(
        'SELECT id FROM room_members WHERE room_id = ? AND user_id = ?',
        [roomId, inviterId]
      );

      if (!inviterMembership) {
        return res.status(403).json({ error: 'You must be a room member to invite' });
      }

      // Check if user already member
      const targetMembership = await db.get(
        'SELECT id FROM room_members WHERE room_id = ? AND user_id = ?',
        [roomId, userId]
      );

      if (targetMembership) {
        return res.status(409).json({ error: 'User is already a member of this room' });
      }

      // Check for existing invitation
      const existingInvite = await db.get(
        'SELECT id FROM notifications WHERE type = ? AND related_room_id = ? AND user_id = ? AND related_user_id = ?',
        ['room_invite', roomId, userId, inviterId]
      );

      if (existingInvite) {
        return res.status(409).json({ error: 'User already has a pending invite' });
      }

      // Get room details
      const room = await db.get('SELECT name FROM chat_rooms WHERE id = ?', [roomId]);

      // Create notification
      await db.run(
        `INSERT INTO notifications (user_id, type, related_user_id, related_room_id)
         VALUES (?, ?, ?, ?)`,
        [userId, 'room_invite', inviterId, roomId]
      );

      res.json({ message: 'Invitation sent successfully' });
    } catch (error) {
      console.error('Error inviting user to room:', error);
      res.status(500).json({ error: 'Failed to invite user' });
    }
  });

  // Accept room invite
  router.post('/:roomId/invite/accept', async (req, res) => {
    try {
      const { roomId } = req.params;
      const userId = req.user.id;

      // Verify invitation exists
      const invite = await db.get(
        'SELECT id FROM notifications WHERE type = ? AND related_room_id = ? AND user_id = ?',
        ['room_invite', roomId, userId]
      );

      if (!invite) {
        return res.status(404).json({ error: 'Invite not found' });
      }

      // Check if already member (just in case)
      const isMember = await db.get(
        'SELECT id FROM room_members WHERE room_id = ? AND user_id = ?',
        [roomId, userId]
      );

      if (isMember) {
        // Delete invite anyway
        await db.run('DELETE FROM notifications WHERE id = ?', [invite.id]);
        return res.status(409).json({ error: 'You are already a member of this room' });
      }

      // Add to room
      await db.run(
        'INSERT INTO room_members (room_id, user_id) VALUES (?, ?)',
        [roomId, userId]
      );

      // Delete invite
      await db.run('DELETE FROM notifications WHERE id = ?', [invite.id]);

      res.json({ message: 'Joined room successfully' });
    } catch (error) {
      console.error('Error accepting room invite:', error);
      res.status(500).json({ error: 'Failed to accept invite' });
    }
  });

  // Decline room invite
  router.post('/:roomId/invite/decline', async (req, res) => {
    try {
      const { roomId } = req.params;
      const userId = req.user.id;

      await db.run(
        'DELETE FROM notifications WHERE type = ? AND related_room_id = ? AND user_id = ?',
        ['room_invite', roomId, userId]
      );

      res.json({ message: 'Invite declined' });
    } catch (error) {
      console.error('Error declining room invite:', error);
      res.status(500).json({ error: 'Failed to decline invite' });
    }
  });

  return router;
}

module.exports = createRoomRoutes;
