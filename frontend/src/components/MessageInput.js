import React, { useRef, useState } from 'react';
import { useChat } from '../context/ChatContext';
import {
  IconSend,
  IconPaperclip,
  IconSmile,
  IconX,
  IconImage,
  IconReply
} from './Icons';
import '../styles/messageInput.css';

const POPULAR_EMOJIS = [
  '👍', '❤️', '🔥', '🎉', '👏', '😊', '🚀', '💯',
  '🙌', '✨', '👋', '😄', '💡', '✅', '👀', '🤝'
];

export default function MessageInput({ replyingTo, onCancelReply }) {
  const {
    currentRoom,
    currentConversation,
    sendMessage,
    startTyping,
    stopTyping
  } = useChat();

  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachment, setAttachment] = useState(null); // { name, size, type, dataUrl }
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scheduleTypingStop = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(currentRoom?.id, currentConversation?.id);
    }, 2500);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);

    // Auto resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }

    const contextId = currentRoom?.id || currentConversation?.id;
    if (contextId) {
      startTyping(currentRoom?.id, currentConversation?.id);
      scheduleTypingStop();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Attachment must be under 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachment({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type,
        isImage: file.type.startsWith('image/'),
        dataUrl: event.target.result
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  const handleEmojiSelect = (emoji) => {
    setInput((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed && !attachment) {
      return;
    }

    let finalMessage = trimmed;

    // Prepend reply quote if active
    if (replyingTo) {
      finalMessage = `> **@${replyingTo.username}**: ${replyingTo.content.substring(0, 100)}\n\n${finalMessage}`;
    }

    // Append image markdown or attachment reference
    if (attachment) {
      if (attachment.isImage) {
        finalMessage = finalMessage
          ? `${finalMessage}\n\n![${attachment.name}](${attachment.dataUrl})`
          : `![${attachment.name}](${attachment.dataUrl})`;
      } else {
        finalMessage = finalMessage
          ? `${finalMessage}\n\n📎 [Attachment: ${attachment.name}]`
          : `📎 [Attachment: ${attachment.name}]`;
      }
    }

    const mentions = extractMentions(finalMessage);
    sendMessage(finalMessage, currentRoom?.id, currentConversation?.id, mentions);

    setInput('');
    setAttachment(null);
    onCancelReply?.();
    stopTyping(currentRoom?.id, currentConversation?.id);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const extractMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const matches = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  };

  const canSubmit = input.trim().length > 0 || attachment !== null;

  return (
    <div className="message-composer-wrapper">
      {/* Replying-to Context Banner */}
      {replyingTo && (
        <div className="composer-reply-banner">
          <div className="reply-banner-left">
            <IconReply size={14} className="reply-banner-icon" />
            <span className="reply-banner-text">
              Replying to <strong>@{replyingTo.username}</strong>:{' '}
              <em>{replyingTo.content.slice(0, 60)}...</em>
            </span>
          </div>
          <button
            type="button"
            className="reply-cancel-btn"
            onClick={onCancelReply}
            title="Cancel reply"
          >
            <IconX size={14} />
          </button>
        </div>
      )}

      {/* Attachment Preview Chip */}
      {attachment && (
        <div className="attachment-preview-chip">
          <div className="chip-icon">
            <IconImage size={15} />
          </div>
          <div className="chip-info">
            <span className="chip-name">{attachment.name}</span>
            <span className="chip-size">{attachment.size}</span>
          </div>
          <button
            type="button"
            className="chip-remove-btn"
            onClick={removeAttachment}
            title="Remove attachment"
          >
            <IconX size={13} />
          </button>
        </div>
      )}

      {/* Composer Input Bar */}
      <form
        className="message-composer-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className="composer-left-actions">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept="image/*,application/pdf,.txt,.doc,.docx"
          />

          <button
            type="button"
            className="composer-action-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file or image"
            aria-label="Add attachment"
          >
            <IconPaperclip size={18} />
          </button>

          {/* Emoji Popover Trigger */}
          <div className="emoji-trigger-wrap">
            <button
              type="button"
              className={`composer-action-btn ${showEmojiPicker ? 'active' : ''}`}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Add reaction or emoji"
              aria-label="Select emoji"
            >
              <IconSmile size={18} />
            </button>

            {showEmojiPicker && (
              <div className="emoji-popover" role="dialog" aria-label="Emoji picker">
                <div className="emoji-popover-header">
                  <span>Quick Emojis</span>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowEmojiPicker(false)}
                  >
                    <IconX size={13} />
                  </button>
                </div>
                <div className="emoji-grid">
                  {POPULAR_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="emoji-item-btn"
                      onClick={() => handleEmojiSelect(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="composer-input-area">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              currentRoom
                ? `Message #${currentRoom.name}...`
                : `Message ${currentConversation?.title || 'conversation'}...`
            }
            className="composer-textarea"
            rows="1"
          />
        </div>

        <button
          type="submit"
          className="composer-send-btn"
          disabled={!canSubmit}
          title={canSubmit ? 'Send message (Enter)' : 'Type a message to send'}
          aria-label="Send message"
        >
          <IconSend size={16} />
        </button>
      </form>
    </div>
  );
}
