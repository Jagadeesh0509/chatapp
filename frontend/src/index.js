import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ChatProvider } from './context/ChatContext';
import { CallProvider } from './context/CallContext';

// Initialize user visual theme preference (default to dark)
const savedTheme = localStorage.getItem('aura_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ChatProvider>
      <CallProvider>
        <App />
      </CallProvider>
    </ChatProvider>
  </React.StrictMode>
);
