import React from 'react';
import '../styles/roomList.css';

export default function RoomList({ rooms, currentRoom, onSelectRoom }) {
  return (
    <div className="room-list">
      {rooms.length === 0 ? (
        <div className="empty-list">
          <p>No rooms available</p>
        </div>
      ) : (
        rooms.map(room => (
          <div
            key={room.id}
            className={`room-item ${currentRoom?.id === room.id ? 'active' : ''}`}
            onClick={() => onSelectRoom(room)}
          >
            <div className="room-icon">#</div>
            <div className="room-info">
              <h4>{room.name}</h4>
              <span className="room-members">{room.member_count || 0} members</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
