import React, { useEffect, useRef } from 'react';
import { useCall } from '../context/CallContext';
import {
  IconPhone,
  IconPhoneOff,
  IconMic,
  IconMicOff,
  IconVideo,
  IconVideoOff,
  IconShield
} from './Icons';

export default function CallModal() {
  const {
    callState,
    activeCall,
    isMuted,
    isVideoDisabled,
    isAccepting,
    callDuration,
    localStream,
    remoteStream,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioDOMRef = useRef(null);

  const isVideo = Boolean(activeCall?.isVideo);

  // Attach local and remote media streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState, isVideo]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState, isVideo]);

  // Dedicated in-DOM audio element attachment for cross-device mobile voice support
  useEffect(() => {
    if (remoteAudioDOMRef.current && remoteStream) {
      remoteAudioDOMRef.current.srcObject = remoteStream;
      remoteAudioDOMRef.current.play().catch((err) => {
        console.warn('[WebRTC] In-DOM remote audio autoplay deferred:', err);
      });
    }
  }, [remoteStream, callState]);

  if (callState === 'idle' || !activeCall) {
    return null;
  }

  const contact = activeCall.targetUser || {};
  const contactName = contact.username || contact.name || 'Teammate';
  const avatarUrl = contact.avatar_url;
  const isIncoming = activeCall.isIncoming && callState === 'incoming';

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getHeaderBadge = () => {
    if (callState === 'incoming') {
      return (
        <div className="call-header-badge">
          <span className="call-pulse incoming" />
          <span>Incoming {isVideo ? 'Video' : 'Audio'} Call</span>
        </div>
      );
    }
    if (callState === 'calling') {
      return (
        <div className="call-header-badge">
          <span className="call-pulse" />
          <span>Calling ({isVideo ? 'Video' : 'Voice'})...</span>
        </div>
      );
    }
    if (callState === 'connected') {
      return (
        <div className="call-header-badge">
          <span className="call-pulse connected" />
          <span>In Call • {formatTimer(callDuration)}</span>
        </div>
      );
    }
    if (callState === 'ended') {
      return (
        <div className="call-header-badge">
          <span className="call-pulse ended" />
          <span>{activeCall.statusMessage || 'Call Ended'}</span>
        </div>
      );
    }
    return null;
  };

  const isVideoStageActive = isVideo && callState === 'connected';

  return (
    <div className="modal-overlay call-modal-overlay" role="dialog" aria-modal="true">
      {/* Invisible in-DOM audio element guarantees audio decodes & outputs across mobile/desktop */}
      <audio
        ref={remoteAudioDOMRef}
        autoPlay
        playsInline
        style={{ position: 'fixed', opacity: 0, pointerEvents: 'none', width: '1px', height: '1px', bottom: 0 }}
      />
      <div
        className={`call-modal modal ${isVideoStageActive ? 'video-active' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {isVideoStageActive ? (
          /* ============ FULLSCREEN / EXPANDED VIDEO CONFERENCE STAGE ============ */
          <div className="video-call-stage">
            {/* Main Remote Video */}
            <div className="remote-video-container">
              {remoteStream && remoteStream.getVideoTracks().length > 0 ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="remote-video-stream"
                />
              ) : (
                <div className="remote-video-fallback">
                  <div className="call-avatar-placeholder">
                    {contactName.charAt(0).toUpperCase()}
                  </div>
                  <span className="fallback-text">{contactName}'s camera is inactive</span>
                </div>
              )}

              {/* Video Header Overlay */}
              <div className="video-top-overlay">
                <div className="video-contact-badge">
                  <span className="live-status-dot" />
                  <span style={{ fontWeight: 600 }}>{contactName}</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                  <span className="hd-tag">720P HD</span>
                </div>

                <div className="video-timer-badge">
                  {formatTimer(callDuration)}
                </div>
              </div>

              {/* Picture-in-Picture Local Self View */}
              <div className="local-pip-container">
                {!isVideoDisabled && localStream && localStream.getVideoTracks().length > 0 ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="local-video-stream"
                  />
                ) : (
                  <div className="local-pip-disabled">
                    <IconVideoOff size={16} />
                    <span>Camera Off</span>
                  </div>
                )}
                <span className="pip-label">YOU</span>
              </div>
            </div>

            {/* Floating Glassmorphism Controls HUD */}
            <div className="video-call-hud">
              <button
                type="button"
                className={`call-ctrl-btn ${isMuted ? 'active-warn' : ''}`}
                onClick={toggleMute}
                title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {isMuted ? <IconMicOff size={20} /> : <IconMic size={20} />}
              </button>

              <button
                type="button"
                className={`call-ctrl-btn ${isVideoDisabled ? 'active-warn' : ''}`}
                onClick={toggleVideo}
                title={isVideoDisabled ? 'Turn video on' : 'Turn video off'}
              >
                {isVideoDisabled ? <IconVideoOff size={20} /> : <IconVideo size={20} />}
              </button>

              <button
                type="button"
                className="call-ctrl-btn call-end-btn"
                onClick={endCall}
                title="End video call"
              >
                <IconPhoneOff size={22} />
              </button>
            </div>
          </div>
        ) : (
          /* ============ AUDIO / CALLING / INCOMING / ENDED CARD ============ */
          <div className="call-card">
            {getHeaderBadge()}

            <div className="call-avatar-wrap">
              {avatarUrl ? (
                <img src={avatarUrl} alt={contactName} className="call-avatar-img" />
              ) : (
                <div className="call-avatar-placeholder">
                  {contactName.charAt(0).toUpperCase()}
                </div>
              )}
              {(callState === 'calling' || callState === 'incoming') && (
                <div className="call-ring-wave" />
              )}
            </div>

            <h3 className="call-contact-name">{contactName}</h3>

            <p className="call-subtitle">
              {callState === 'incoming' && `Incoming peer-to-peer ${isVideo ? 'video' : 'audio'} transmission`}
              {callState === 'calling' && `Establishing secure WebRTC ${isVideo ? 'video' : 'audio'} link...`}
              {callState === 'connected' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <IconShield size={12} color="#f97316" />
                  <span>HD Audio • WebRTC Encrypted</span>
                </span>
              )}
              {callState === 'ended' && (activeCall.statusMessage || 'Disconnected')}
            </p>

            {/* Animated Waveform when connected in audio mode */}
            {callState === 'connected' && !isVideo && !isMuted && (
              <div className="call-live-waveform" title="Live audio stream active">
                <span className="call-wave-bar" />
                <span className="call-wave-bar" />
                <span className="call-wave-bar" />
                <span className="call-wave-bar" />
                <span className="call-wave-bar" />
                <span className="call-wave-bar" />
                <span className="call-wave-bar" />
              </div>
            )}

            {callState === 'connected' && isMuted && (
              <div style={{ color: '#ef4444', fontSize: '11px', marginBottom: '20px', fontFamily: 'JetBrains Mono' }}>
                MICROPHONE MUTED
              </div>
            )}

            {/* Call Action Controls */}
            <div className="call-controls">
              {isIncoming ? (
                <>
                  <div className="call-btn-action-group">
                    <button
                      type="button"
                      className="call-ctrl-btn call-end-btn"
                      onClick={() => rejectCall('Call declined')}
                      disabled={isAccepting}
                      title="Decline Call"
                    >
                      <IconPhoneOff size={22} />
                    </button>
                    <span className="call-btn-label">Decline</span>
                  </div>

                  <div className="call-btn-action-group">
                    <button
                      type="button"
                      className={`call-ctrl-btn call-accept-btn ${isAccepting ? 'btn-loading' : ''}`}
                      onClick={acceptCall}
                      disabled={isAccepting}
                      title={isVideo ? 'Accept Video Call' : 'Accept Audio Call'}
                    >
                      {isAccepting ? (
                        <span className="call-spinner" />
                      ) : isVideo ? (
                        <IconVideo size={22} />
                      ) : (
                        <IconPhone size={22} />
                      )}
                    </button>
                    <span className="call-btn-label">{isAccepting ? 'Connecting...' : 'Accept'}</span>
                  </div>
                </>
              ) : callState === 'connected' ? (
                <>
                  <div className="call-btn-action-group">
                    <button
                      type="button"
                      className={`call-ctrl-btn ${isMuted ? 'active-warn' : ''}`}
                      onClick={toggleMute}
                      title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                    >
                      {isMuted ? <IconMicOff size={20} /> : <IconMic size={20} />}
                    </button>
                    <span className="call-btn-label">{isMuted ? 'Unmute' : 'Mute'}</span>
                  </div>

                  <div className="call-btn-action-group">
                    <button
                      type="button"
                      className={`call-ctrl-btn ${isVideoDisabled ? 'active-warn' : ''}`}
                      onClick={toggleVideo}
                      title={isVideoDisabled ? 'Turn video on' : 'Turn video off'}
                    >
                      {isVideoDisabled ? <IconVideoOff size={20} /> : <IconVideo size={20} />}
                    </button>
                    <span className="call-btn-label">{isVideoDisabled ? 'Cam On' : 'Cam Off'}</span>
                  </div>

                  <div className="call-btn-action-group">
                    <button
                      type="button"
                      className="call-ctrl-btn call-end-btn"
                      onClick={endCall}
                      title="End Call"
                    >
                      <IconPhoneOff size={22} />
                    </button>
                    <span className="call-btn-label">End</span>
                  </div>
                </>
              ) : (
                <div className="call-btn-action-group">
                  <button
                    type="button"
                    className="call-ctrl-btn call-end-btn"
                    onClick={callState === 'calling' ? endCall : rejectCall}
                    title="Cancel Call"
                  >
                    <IconPhoneOff size={22} />
                  </button>
                  <span className="call-btn-label">Cancel</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
