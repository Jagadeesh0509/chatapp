import React, { useEffect, useState } from 'react';
import { roomService } from '../services/api';
import '../styles/roomInvitations.css';

export default function RoomInvitations({ notifications, onInviteHandled }) {
  const [roomInvites, setRoomInvites] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState({});

  useEffect(() => {
    // Filter room invite notifications
    const invites = notifications.filter((notif) => notif.type === 'room_invite');
    setRoomInvites(invites);
  }, [notifications]);

  const handleAccept = async (notification) => {
    const roomId = notification.related_room_id;
    setLoadingRooms({ ...loadingRooms, [roomId]: true });

    try {
      await roomService.acceptInvite(roomId);
      setRoomInvites((prev) =>
        prev.filter((inv) => inv.related_room_id !== roomId)
      );
      onInviteHandled?.();
    } catch (error) {
      console.error('Error accepting invite:', error);
    } finally {
      setLoadingRooms({ ...loadingRooms, [roomId]: false });
    }
  };

  const handleDecline = async (notification) => {
    const roomId = notification.related_room_id;
    setLoadingRooms({ ...loadingRooms, [roomId]: true });

    try {
      await roomService.declineInvite(roomId);
      setRoomInvites((prev) =>
        prev.filter((inv) => inv.related_room_id !== roomId)
      );
    } catch (error) {
      console.error('Error declining invite:', error);
    } finally {
      setLoadingRooms({ ...loadingRooms, [roomId]: false });
    }
  };

  if (roomInvites.length === 0) {
    return null;
  }

  return (
    <div className="room-invitations">
      <div className="invitations-header">
        <h3>Room Invitations ({roomInvites.length})</h3>
      </div>
      <div className="invitations-list">
        {roomInvites.map((invite) => (
          <div key={invite.id} className="invitation-item">
            <div className="invitation-info">
              <p className="invitation-from">
                <strong>{invite.related_username}</strong> invited you to a room
              </p>
              <p className="invitation-time">
                {new Date(invite.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="invitation-actions">
              <button
                className="btn btn-small btn-primary"
                onClick={() => handleAccept(invite)}
                disabled={loadingRooms[invite.related_room_id]}
              >
                {loadingRooms[invite.related_room_id] ? '...' : 'Accept'}
              </button>
              <button
                className="btn btn-small btn-secondary"
                onClick={() => handleDecline(invite)}
                disabled={loadingRooms[invite.related_room_id]}
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
