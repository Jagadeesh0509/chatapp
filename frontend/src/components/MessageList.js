import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChat } from '../context/ChatContext';
import {
  IconCheck,
  IconCheckCheck,
  IconEdit,
  IconTrash,
  IconCopy,
  IconReply,
  IconPaperclip
} from './Icons';
import '../styles/messageList.css';

function formatMessageTime(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
}

function getDateSeparatorLabel(dateString) {
  try {
    const msgDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (msgDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (msgDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return msgDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: msgDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  } catch (e) {
    return '';
  }
}

function shouldShowDateSeparator(currentMsg, prevMsg) {
  if (!prevMsg) return true;
  try {
    const currentDate = new Date(currentMsg.created_at).toDateString();
    const prevDate = new Date(prevMsg.created_at).toDateString();
    return currentDate !== prevDate;
  } catch (e) {
    return false;
  }
}

function extractMedia(content) {
  const media = { images: [], links: [] };
  if (!content) return media;

  const imageRegex = /!\[.*?\]\((.*?)\)|(?:https?:\/\/[^\s)]+\.(?:png|jpg|jpeg|gif|webp))/gi;
  let match;
  while ((match = imageRegex.exec(content)) !== null) {
    const url = match[1] || match[0];
    if (media.images.indexOf(url) === -1) {
      media.images.push(url);
    }
  }

  const urlRegex = /(?:https?:\/\/[^\s)]+)/g;
  while ((match = urlRegex.exec(content)) !== null) {
    const url = match[0];
    if (!url.match(/\.(png|jpg|jpeg|gif|webp)$/i) && media.links.indexOf(url) === -1) {
      media.links.push(url);
    }
  }

  return media;
}

export default function MessageList({ messages, onReplyMessage }) {
  const { user, editMessage, deleteMessage } = useChat();
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [draftContent, setDraftContent] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const startEditing = (message) => {
    setEditingMessageId(message.id);
    setDraftContent(message.content);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setDraftContent('');
  };

  const saveEdit = (messageId) => {
    if (!draftContent.trim()) return;
    editMessage(messageId, draftContent.trim());
    cancelEditing();
  };

  const handleDelete = (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      deleteMessage(messageId);
    }
  };

  const handleCopy = (message) => {
    navigator.clipboard?.writeText(message.content);
    setCopiedId(message.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!messages || messages.length === 0) {
    return (
      <div className="empty-messages-container">
        <div className="empty-chat-hero">
          <div className="empty-chat-icon">
            <IconReply size={28} />
          </div>
          <h3>Start of Conversation</h3>
          <p>
            No messages have been sent here yet. Send a friendly message or share project notes to get started.
          </p>
          <div className="suggested-prompts">
            <span className="prompt-pill">Say hello 👋</span>
            <span className="prompt-pill">Share an update 🚀</span>
            <span className="prompt-pill">Plan a sync 📅</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="message-list-stream">
      {messages.map((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const showDateSeparator = shouldShowDateSeparator(message, prevMessage);

        const isOwn = Number(message.sender_id) === Number(user?.id);
        const isEditing = editingMessageId === message.id;

        // Grouping: consecutive message from same sender within 4 minutes
        const isConsecutive =
          prevMessage &&
          !showDateSeparator &&
          Number(prevMessage.sender_id) === Number(message.sender_id) &&
          new Date(message.created_at) - new Date(prevMessage.created_at) < 4 * 60 * 1000;

        const showAvatar = !isConsecutive;
        const media = extractMedia(message.content);

        // Read receipt status: if read by any other recipient
        const isReadByOthers =
          Array.isArray(message.readBy) &&
          message.readBy.some((r) => Number(r.userId) !== Number(user?.id));

        return (
          <React.Fragment key={message.id || index}>
            {showDateSeparator && (
              <div className="date-separator">
                <span className="date-separator-label">
                  {getDateSeparatorLabel(message.created_at)}
                </span>
              </div>
            )}

            <div
              className={`message-row ${isOwn ? 'outgoing' : 'incoming'} ${
                isConsecutive ? 'consecutive' : 'first-in-group'
              }`}
            >
              {/* Incoming Avatar */}
              {!isOwn && (
                <div className="message-avatar-col">
                  {showAvatar ? (
                    message.avatar_url ? (
                      <img
                        src={message.avatar_url}
                        alt={message.username}
                        className="msg-avatar-img"
                      />
                    ) : (
                      <div className="msg-avatar-fallback">
                        {message.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )
                  ) : (
                    <div className="msg-avatar-spacer" />
                  )}
                </div>
              )}

              {/* Message Content Container */}
              <div className="message-bubble-wrapper">
                {/* Sender Name on first in group for incoming */}
                {!isOwn && showAvatar && (
                  <div className="msg-sender-name">{message.username}</div>
                )}

                <div
                  className={`message-bubble ${isOwn ? 'bubble-outgoing' : 'bubble-incoming'} ${
                    message.is_deleted ? 'bubble-deleted' : ''
                  }`}
                >
                  {message.is_deleted ? (
                    <div className="msg-deleted-notice">
                      <em>This message was deleted</em>
                    </div>
                  ) : isEditing ? (
                    <div className="message-inline-editor">
                      <textarea
                        value={draftContent}
                        onChange={(e) => setDraftContent(e.target.value)}
                        className="inline-edit-textarea"
                        rows="3"
                        autoFocus
                      />
                      <div className="inline-editor-actions">
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
                      <div className="message-markdown-body">
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
                          {message.content}
                        </ReactMarkdown>
                      </div>

                      {/* Extracted Images */}
                      {media.images.length > 0 && (
                        <div className="message-media-images">
                          {media.images.map((imgUrl, idx) => (
                            <img
                              key={idx}
                              src={imgUrl}
                              alt="Shared preview"
                              className="message-shared-image"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Extracted Links */}
                      {media.links.length > 0 && (
                        <div className="message-link-pills">
                          {media.links.map((linkUrl, idx) => {
                            let hostname = linkUrl;
                            try {
                              hostname = new URL(linkUrl).hostname;
                            } catch (e) {}
                            return (
                              <a
                                key={idx}
                                href={linkUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="link-pill"
                                title={linkUrl}
                              >
                                <IconPaperclip size={12} />
                                <span>{hostname}</span>
                              </a>
                            );
                          })}
                        </div>
                      )}

                      {/* Bubble Metadata: timestamp, edited, read receipts */}
                      <div className="message-bubble-meta">
                        {Boolean(message.is_edited) && (
                          <span className="msg-edited-badge">edited</span>
                        )}
                        <span className="msg-timestamp">
                          {formatMessageTime(message.created_at)}
                        </span>
                        {isOwn && (
                          <span
                            className={`msg-receipt-icon ${isReadByOthers ? 'read' : 'sent'}`}
                            title={isReadByOthers ? 'Read by recipient' : 'Delivered'}
                          >
                            {isReadByOthers ? (
                              <IconCheckCheck size={14} />
                            ) : (
                              <IconCheck size={13} />
                            )}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Hover Action Toolbar */}
                {!message.is_deleted && !isEditing && (
                  <div className="message-hover-toolbar">
                    <button
                      type="button"
                      className="toolbar-btn"
                      onClick={() => onReplyMessage?.(message)}
                      title="Reply"
                      aria-label="Reply to message"
                    >
                      <IconReply size={13} />
                    </button>

                    <button
                      type="button"
                      className="toolbar-btn"
                      onClick={() => handleCopy(message)}
                      title={copiedId === message.id ? 'Copied!' : 'Copy text'}
                      aria-label="Copy message"
                    >
                      {copiedId === message.id ? <IconCheck size={13} /> : <IconCopy size={13} />}
                    </button>

                    {isOwn && (
                      <>
                        <button
                          type="button"
                          className="toolbar-btn"
                          onClick={() => startEditing(message)}
                          title="Edit message"
                          aria-label="Edit message"
                        >
                          <IconEdit size={13} />
                        </button>
                        <button
                          type="button"
                          className="toolbar-btn danger"
                          onClick={() => handleDelete(message.id)}
                          title="Delete message"
                          aria-label="Delete message"
                        >
                          <IconTrash size={13} />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
