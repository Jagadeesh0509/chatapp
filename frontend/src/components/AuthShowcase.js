import React from 'react';
import {
  IconLogo,
  IconShield,
  IconCheckCheck,
  IconZap,
  IconDatabase,
  IconActivity,
  IconLayers
} from './Icons';
import '../styles/AuthShowcase.css';

export default function AuthShowcase() {
  return (
    <div className="auth-showcase">
      {/* Background Ambient Glow */}
      <div className="showcase-ambient-glow" />

      {/* Brand Header */}
      <div className="showcase-header">
        <div className="showcase-brand-row">
          <div className="showcase-logo-badge">
            <IconLogo size={24} className="showcase-logo-icon" />
          </div>
          <div className="showcase-status-chip">
            <span className="live-status-dot" />
            <span className="mono-text">SYSTEM ACTIVE</span>
            <span className="chip-sep">•</span>
            <span className="mono-text">v2.4.0</span>
          </div>
        </div>

        <h1 className="showcase-heading">
          Real-time team clarity.
          <span className="showcase-heading-accent"> Zero noise.</span>
        </h1>

        <p className="showcase-subheading">
          A high-velocity communications platform engineered for deep focus. Dark charcoal aesthetics, warm orange precision, and sub-20ms socket dispatch.
        </p>
      </div>

      {/* Animated Communication Preview Deck */}
      <div className="showcase-preview-card">
        {/* Terminal / Channel Bar */}
        <div className="preview-top-bar">
          <div className="preview-channel-identity">
            <span className="channel-hash">#</span>
            <span className="channel-title">mission-control</span>
            <span className="channel-pulse-badge">LIVE</span>
          </div>
          <div className="preview-telemetry-meta">
            <span className="telemetry-item">
              <span className="ping-dot" /> 8ms
            </span>
            <span className="telemetry-divider">/</span>
            <span className="telemetry-item">TLS 1.3</span>
          </div>
        </div>

        {/* Dynamic Animated Message Stream */}
        <div className="preview-messages-viewport">
          {/* Incoming Message 1 */}
          <div className="preview-msg incoming animated-entry-1">
            <div className="msg-avatar-badge">EV</div>
            <div className="msg-body-wrap">
              <div className="msg-author-row">
                <span className="msg-author">Elena Vance</span>
                <span className="msg-role-tag">LEAD ARCHITECT</span>
                <span className="msg-time">13:42</span>
              </div>
              <div className="msg-bubble incoming-bubble">
                Telemetry verified across all regional nodes. Failover test passed with 0 dropped packets.
              </div>
            </div>
          </div>

          {/* Outgoing Message 2 (Warm Orange) */}
          <div className="preview-msg outgoing animated-entry-2">
            <div className="msg-body-wrap">
              <div className="msg-bubble outgoing-bubble">
                Sockets deployed to production. Channel switch latency reduced to under 12ms.
                <div className="msg-meta-row">
                  <span className="msg-time-alt">13:43</span>
                  <IconCheckCheck size={14} className="msg-receipt-icon" />
                </div>
              </div>
            </div>
          </div>

          {/* Simulated Audio Dispatch Note */}
          <div className="preview-msg incoming animated-entry-3">
            <div className="msg-avatar-badge alt-badge">DX</div>
            <div className="msg-body-wrap">
              <div className="msg-author-row">
                <span className="msg-author">David Kim</span>
                <span className="msg-role-tag">INFRA</span>
                <span className="msg-time">13:44</span>
              </div>
              <div className="audio-dispatch-bubble">
                <button type="button" className="audio-play-pill" aria-label="Simulated Audio Memo">
                  <span className="audio-play-triangle" />
                </button>
                <div className="audio-waveform-bars">
                  <span className="bar bar-1" />
                  <span className="bar bar-2" />
                  <span className="bar bar-3" />
                  <span className="bar bar-4" />
                  <span className="bar bar-5" />
                  <span className="bar bar-6" />
                  <span className="bar bar-7" />
                  <span className="bar bar-8" />
                  <span className="bar bar-9" />
                  <span className="bar bar-10" />
                </div>
                <span className="audio-duration mono-text">0:18</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Animated Telemetry Pill */}
        <div className="floating-telemetry-pill">
          <div className="floating-pill-content">
            <IconZap size={14} className="pill-zap-icon" />
            <span className="mono-text">142 Real-time Workers Active</span>
            <span className="pill-sep">•</span>
            <span className="mono-text text-green">100% HEALTH</span>
          </div>
        </div>
      </div>

      {/* Protocol & Architecture Badges */}
      <div className="showcase-tech-badges">
        <div className="tech-badge">
          <IconActivity size={13} className="tech-badge-icon" />
          <span>WebSocket Stream</span>
        </div>
        <div className="tech-badge">
          <IconDatabase size={13} className="tech-badge-icon" />
          <span>SQLite WAL Storage</span>
        </div>
        <div className="tech-badge">
          <IconShield size={13} className="tech-badge-icon" />
          <span>End-to-End TLS</span>
        </div>
        <div className="tech-badge">
          <IconLayers size={13} className="tech-badge-icon" />
          <span>Restrained Engine</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="showcase-metrics-grid">
        <div className="metric-box">
          <span className="metric-num">99.99%</span>
          <span className="metric-label">UPTIME SLA</span>
        </div>
        <div className="metric-box">
          <span className="metric-num">&lt; 15ms</span>
          <span className="metric-label">DISPATCH SPEED</span>
        </div>
        <div className="metric-box">
          <span className="metric-num">Zero</span>
          <span className="metric-label">PURPLE / BLUE GIMMICKS</span>
        </div>
      </div>
    </div>
  );
}
