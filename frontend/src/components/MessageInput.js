import React, { useRef, useState } from 'react';
import { useChat } from '../context/ChatContext';
import '../styles/messageInput.css';

export default function MessageInput() {
  const {
    currentRoom,
    currentConversation,
    sendMessage,
    startTyping,
    stopTyping
  } = useChat();

  const [input, setInput] = useState('');
  const typingTimeoutRef = useRef(null);

  const scheduleTypingStop = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(currentRoom?.id, currentConversation?.id);
    }, 3000);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);

    const contextId = currentRoom?.id || currentConversation?.id;
    if (contextId) {
      startTyping(currentRoom?.id, currentConversation?.id);
      scheduleTypingStop();
    }
  };

  const handleSubmit = () => {
    if (!input.trim()) {
      return;
    }

    const mentions = extractMentions(input);
    sendMessage(input, currentRoom?.id, currentConversation?.id, mentions);
    setInput('');
    stopTyping(currentRoom?.id, currentConversation?.id);

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

  return (
    <form
      className="message-input-form"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <div className="message-input-stack">
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... Use Markdown, Shift+Enter for a new line, and @username to mention."
          className="message-input"
          rows="2"
        />
        <span className="message-helper">
          Enter to send, Shift+Enter for a new line.
        </span>
      </div>
      <button type="submit" className="btn-send" disabled={!input.trim()}>
        Send
      </button>
    </form>
  );
}
