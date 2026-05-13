import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChat } from '../context/ChatContext';
import '../styles/messageList.css';

function formatMarkdown(content) {
  return content.replace(/(^|\s)@(\w+)/g, '$1**@$2**');
}

function extractMedia(content) {
  const media = { images: [], links: [] };
  
  // Extract image URLs (markdown and plain URLs)
  const imageRegex = /!\[.*?\]\((.*?)\)|(?:https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp))/gi;
  let match;
  
  while ((match = imageRegex.exec(content)) !== null) {
    const url = match[1] || match[0];
    if (media.images.indexOf(url) === -1) {
      media.images.push(url);
    }
  }
  
  // Extract non-image URLs
  const urlRegex = /(?:https?:\/\/[^\s)]+)/g;
  while ((match = urlRegex.exec(content)) !== null) {
    const url = match[0];
    if (!url.match(/\.(png|jpg|jpeg|gif|webp)$/i) && media.links.indexOf(url) === -1) {
      media.links.push(url);
    }
  }
  
  return media;
}

export default function MessageList({ messages }) {
  const { user, editMessage, deleteMessage } = useChat();
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [draftContent, setDraftContent] = useState('');

  const startEditing = (message) => {
    setEditingMessageId(message.id);
    setDraftContent(message.content);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setDraftContent('');
  };

  const saveEdit = (messageId) => {
    if (!draftContent.trim()) {
      return;
    }

    editMessage(messageId, draftContent.trim());
    cancelEditing();
  };

  const handleDelete = (messageId) => {
    if (window.confirm('Delete this message?')) {
      deleteMessage(messageId);
    }
  };

  return (
    <div className="message-list">
      {messages.length === 0 ? (
        <div className="empty-messages">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        messages.map((message, index) => {
          const showAvatar =
            index === 0 ||
            messages[index - 1].sender_id !== message.sender_id ||
            new Date(message.created_at) -
              new Date(messages[index - 1].created_at) >
              5 * 60 * 1000;

          const isOwnMessage = Number(message.sender_id) === Number(user?.id);
          const isEditing = editingMessageId === message.id;

          return (
            <div
              key={message.id}
              className={`message-group ${showAvatar ? 'with-avatar' : ''}`}
            >
              {showAvatar && (
                <div className="message-avatar">
                  {message.avatar_url ? (
                    <img src={message.avatar_url} alt={message.username} />
                  ) : (
                    <div className="avatar-placeholder">
                      {message.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              )}

              <div className="message-content">
                {showAvatar && (
                  <div className="message-meta">
                    <strong>{message.username}</strong>
                    <span className="message-time">
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true
                      })}
                    </span>
                  </div>
                )}

                <div
                  className={`message-bubble ${message.is_deleted ? 'deleted' : ''}`}
                >
                  {message.is_deleted ? (
                    <em>This message was deleted</em>
                  ) : isEditing ? (
                    <div className="message-editor">
                      <textarea
                        value={draftContent}
                        onChange={(e) => setDraftContent(e.target.value)}
                        rows="3"
                      />
                      <div className="message-editor-actions">
                        <button
                          type="button"
                          className="btn btn-small btn-primary"
                          onClick={() => saveEdit(message.id)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn btn-small btn-secondary"
                          onClick={cancelEditing}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="message-markdown">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: ({ children, ...props }) => (
                              <a {...props} target="_blank" rel="noreferrer">
                                {children}
                              </a>
                            )
                          }}
                        >
                          {formatMarkdown(message.content)}
                        </ReactMarkdown>
                      </div>
                      
                      {(() => {
                        const media = extractMedia(message.content);
                        return (
                          <>
                            {media.images.length > 0 && (
                              <div className="message-images">
                                {media.images.map((imageUrl, idx) => (
                                  <img
                                    key={idx}
                                    src={imageUrl}
                                    alt="Shared media"
                                    className="message-image"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                            {media.links.length > 0 && (
                              <div className="message-links">
                                {media.links.map((linkUrl, idx) => (
                                  <a
                                    key={idx}
                                    href={linkUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="message-link-preview"
                                    title={linkUrl}
                                  >
                                    <span className="link-icon">🔗</span>
                                    <span className="link-text">
                                      {new URL(linkUrl).hostname}
                                    </span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}
                      
                      {Boolean(message.is_edited) && (
                        <span className="edited-label">(edited)</span>
                      )}
                    </>
                  )}
                </div>

                {isOwnMessage && !message.is_deleted && !isEditing && (
                  <div className="message-actions">
                    <button
                      type="button"
                      className="message-action-btn"
                      onClick={() => startEditing(message)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="message-action-btn danger"
                      onClick={() => handleDelete(message.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}

                {message.readBy && message.readBy.length > 0 && (
                  <div className="read-receipts">
                    Read by{' '}
                    {message.readBy
                      .map((receipt) => receipt.username || `User ${receipt.userId}`)
                      .join(', ')}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
