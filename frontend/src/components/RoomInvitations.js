import React, { useEffect, useState } from 'react';
import { roomService } from '../services/api';
import { IconUsers, IconCheck, IconX } from './Icons';
import '../styles/roomInvitations.css';

export default function RoomInvitations({ notifications, onInviteHandled }) {
  const [roomInvites, setRoomInvites] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState({});

  useEffect(() => {
    const invites = notifications.filter((notif) => notif.type === 'room_invite');
    setRoomInvites(invites);
  }, [notifications]);

  const handleAccept = async (notification) => {
    const roomId = notification.related_room_id;
    setLoadingRooms((prev) => ({ ...prev, [roomId]: true }));

    try {
      await roomService.acceptInvite(roomId);
      setRoomInvites((prev) =>
        prev.filter((inv) => inv.related_room_id !== roomId)
      );
      onInviteHandled?.();
    } catch (error) {
      console.error('Error accepting invite:', error);
    } finally {
      setLoadingRooms((prev) => ({ ...prev, [roomId]: false }));
    }
  };

  const handleDecline = async (notification) => {
    const roomId = notification.related_room_id;
    setLoadingRooms((prev) => ({ ...prev, [roomId]: true }));

    try {
      await roomService.declineInvite(roomId);
      setRoomInvites((prev) =>
        prev.filter((inv) => inv.related_room_id !== roomId)
      );
      onInviteHandled?.();
    } catch (error) {
      console.error('Error declining invite:', error);
    } finally {
      setLoadingRooms((prev) => ({ ...prev, [roomId]: false }));
    }
  };

  if (roomInvites.length === 0) {
    return null;
  }

  return (
    <div className="room-invitations-banner">
      <div className="invitations-banner-header">
        <div className="banner-title-wrap">
          <IconUsers size={14} className="banner-icon" />
          <span>Channel Invitations ({roomInvites.length})</span>
        </div>
      </div>

      <div className="invitations-list">
        {roomInvites.map((invite) => (
          <div key={invite.id} className="invitation-item-card">
            <div className="invitation-copy">
              <p>
                <strong>{invite.related_username}</strong> invited you to join
              </p>
              <span className="invitation-timestamp">
                {new Date(invite.created_at).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>

            <div className="invitation-btn-group">
              <button
                type="button"
                className="btn btn-small btn-primary"
                onClick={() => handleAccept(invite)}
                disabled={loadingRooms[invite.related_room_id]}
              >
                <IconCheck size={12} />
                <span>{loadingRooms[invite.related_room_id] ? 'Joining...' : 'Join'}</span>
              </button>
              <button
                type="button"
                className="btn btn-small btn-secondary"
                onClick={() => handleDecline(invite)}
                disabled={loadingRooms[invite.related_room_id]}
              >
                <IconX size={12} />
                <span>Decline</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
