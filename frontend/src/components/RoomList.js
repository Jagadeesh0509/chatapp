import React from 'react';
import { IconHash, IconLock, IconUsers } from './Icons';
import '../styles/roomList.css';

export default function RoomList({ rooms, currentRoom, onSelectRoom }) {
  if (rooms.length === 0) {
    return (
      <div className="room-list-empty">
        <div className="empty-icon-wrap">
          <IconHash size={24} />
        </div>
        <h4>No channels found</h4>
        <p>Create a channel using the + button above to start chatting with your team.</p>
      </div>
    );
  }

  return (
    <div className="room-list" role="list">
      {rooms.map((room) => {
        const isActive = currentRoom?.id === room.id;
        const isPrivate = room.is_public === false || room.is_public === 0;

        return (
          <button
            key={room.id}
            type="button"
            className={`room-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelectRoom(room)}
            role="listitem"
          >
            <div className={`room-icon-badge ${isActive ? 'active' : ''}`}>
              {isPrivate ? <IconLock size={15} /> : <IconHash size={15} />}
            </div>

            <div className="room-info">
              <div className="room-header-row">
                <span className="room-name">{room.name}</span>
                <span className="room-members-count" title={`${room.member_count || 1} members`}>
                  <IconUsers size={12} />
                  <span>{room.member_count || 1}</span>
                </span>
              </div>
              {room.description && (
                <p className="room-description">{room.description}</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
