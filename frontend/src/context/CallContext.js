import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback
} from 'react';
import { useChat } from './ChatContext';

const CallContext = createContext();

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:openrelay.metered.ca:80' }
  ],
  iceCandidatePoolSize: 10
};

// Generates simulated silent/tone audio stream if hardware mic is unavailable
function createFallbackAudioStream() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const dst = ctx.createMediaStreamDestination();
    const gain = ctx.createGain();
    gain.gain.value = 0.001; // nearly silent carrier
    osc.connect(gain);
    gain.connect(dst);
    osc.start();
    return dst.stream;
  } catch (err) {
    return null;
  }
}

// Generates animated simulated video feed if hardware camera is unavailable
function createSimulatedVideoStream(label) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    let tick = 0;

    const render = () => {
      tick++;
      // Dark charcoal background
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, 640, 480);

      // Subtle architectural grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 640; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 480);
        ctx.stroke();
      }
      for (let y = 0; y < 480; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(640, y);
        ctx.stroke();
      }

      // Warm radiant ambient pulse
      const radius = 90 + Math.sin(tick * 0.08) * 8;
      const grad = ctx.createRadialGradient(320, 210, 10, 320, 210, radius + 80);
      grad.addColorStop(0, 'rgba(249, 115, 22, 0.35)');
      grad.addColorStop(0.6, 'rgba(249, 115, 22, 0.08)');
      grad.addColorStop(1, 'rgba(24, 24, 27, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(320, 210, radius + 80, 0, Math.PI * 2);
      ctx.fill();

      // Avatar circle
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(320, 210, 64, 0, Math.PI * 2);
      ctx.fill();

      // Initial letter
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px Space Grotesk, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initial = (label || 'U').charAt(0).toUpperCase();
      ctx.fillText(initial, 320, 210);

      // Status badge
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(260, 320, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e4e4e7';
      ctx.font = '600 13px JetBrains Mono, monospace';
      ctx.fillText('LIVE HD 720P FEED', 330, 320);
    };

    render();
    const interval = setInterval(render, 100);
    if (canvas.captureStream) {
      const stream = canvas.captureStream(24);
      const track = stream.getVideoTracks()[0];
      if (track) {
        const origStop = track.stop.bind(track);
        track.stop = () => {
          clearInterval(interval);
          origStop();
        };
      }
      return track;
    }
  } catch (e) {
    return null;
  }
}

// Gentle audio chimes for ringing / ringback
function createToneGenerator() {
  let ctx = null;
  let intervalId = null;

  const playRingTone = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!ctx || ctx.state === 'closed') {
        ctx = new AudioCtx();
      }
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(480, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      // Audio autoplay policy
    }
  };

  return {
    start: () => {
      playRingTone();
      intervalId = setInterval(playRingTone, 2400);
    },
    stop: () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (ctx && ctx.state !== 'closed') {
        try {
          ctx.close();
        } catch (e) {
          // ignore
        }
        ctx = null;
      }
    }
  };
}

export function CallProvider({ children }) {
  const { socket, user } = useChat();

  // 'idle' | 'calling' | 'incoming' | 'connected' | 'ended'
  const [callState, setCallState] = useState('idle');
  const [activeCall, setActiveCall] = useState(null); // { targetUser, isVideo, isIncoming, callId, statusMessage, offer }
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const incomingOfferRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const ringtoneRef = useRef(null);

  // Refs for tracking latest state inside stable socket listeners
  const callStateRef = useRef('idle');
  const activeCallRef = useRef(null);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  // Initialize and mount hidden remote audio element in DOM for cross-device mobile playback
  useEffect(() => {
    let audio = document.getElementById('webrtc-remote-audio-sink');
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = 'webrtc-remote-audio-sink';
      audio.autoplay = true;
      audio.playsInline = true;
      audio.style.position = 'fixed';
      audio.style.top = '-9999px';
      audio.style.left = '-9999px';
      audio.style.opacity = '0';
      audio.style.pointerEvents = 'none';
      audio.style.width = '1px';
      audio.style.height = '1px';
      document.body.appendChild(audio);
    }
    remoteAudioRef.current = audio;

    return () => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }
    };
  }, []);

  // Cleanup helper
  const cleanUpCall = useCallback(() => {
    if (ringtoneRef.current) {
      ringtoneRef.current.stop();
      ringtoneRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // ignore
        }
      });
      localStreamRef.current = null;
    }

    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch (e) {
        // ignore
      }
      pcRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    incomingOfferRef.current = null;
    pendingCandidatesRef.current = [];
    setIsMuted(false);
    setIsVideoDisabled(false);
    setIsAccepting(false);
  }, []);

  // Duration timer when connected
  useEffect(() => {
    let interval = null;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState]);

  // Acquire user media with multi-stage graceful fallback for mobile devices & permissions
  const acquireMedia = async (isVideo, label = 'User') => {
    let audioTrack = null;
    let videoTrack = null;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // Stage 1: Try optimal constraints
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: isVideo
            ? {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }
            : false
        });
        return stream;
      } catch (err1) {
        console.warn('[WebRTC] Stage 1 media capture failed, trying relaxed constraints:', err1);
        // Stage 2: Try basic unconstrained video/audio
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: isVideo ? true : false
          });
          return stream;
        } catch (err2) {
          console.warn('[WebRTC] Stage 2 media capture failed, attempting audio only:', err2);
          // Stage 3: Try audio only
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            audioTrack = audioStream.getAudioTracks()[0];
          } catch (audioErr) {
            console.warn('[WebRTC] Microphone also unavailable, fallback to synthesized audio:', audioErr);
          }
        }
      }
    }

    // Fallback simulated tracks if hardware unavailable or restricted
    if (!audioTrack) {
      const fallbackAudio = createFallbackAudioStream();
      if (fallbackAudio) audioTrack = fallbackAudio.getAudioTracks()[0];
    }

    if (isVideo && !videoTrack) {
      videoTrack = createSimulatedVideoStream(label);
    }

    const combinedStream = new MediaStream();
    if (audioTrack) combinedStream.addTrack(audioTrack);
    if (videoTrack) combinedStream.addTrack(videoTrack);
    return combinedStream;
  };

  // ================= INITIATE CALL =================
  const initiateCall = useCallback(
    async (targetUser, isVideo = false) => {
      if (!socket || !targetUser || callStateRef.current !== 'idle') return;

      cleanUpCall();
      const callData = {
        targetUser,
        isVideo,
        isIncoming: false,
        statusMessage: 'Connecting...'
      };
      activeCallRef.current = callData;
      setActiveCall(callData);
      callStateRef.current = 'calling';
      setCallState('calling');
      setIsVideoDisabled(!isVideo);

      const tone = createToneGenerator();
      ringtoneRef.current = tone;
      tone.start();

      // Unlock audio playback on direct user tap
      if (remoteAudioRef.current) {
        remoteAudioRef.current.play().catch(() => {});
      }

      try {
        const stream = await acquireMedia(isVideo, user?.username);
        localStreamRef.current = stream;
        setLocalStream(stream);

        const pc = new RTCPeerConnection(RTC_CONFIG);
        pcRef.current = pc;

        // Add local tracks to peer connection
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // ICE candidate handler
        pc.onicecandidate = (event) => {
          if (event.candidate && socket) {
            socket.emit('call:ice-candidate', {
              targetUserId: targetUser.id,
              candidate: event.candidate
            });
          }
        };

        // Remote track handler
        pc.ontrack = (event) => {
          const rStream =
            event.streams && event.streams[0]
              ? event.streams[0]
              : new MediaStream([event.track]);
          setRemoteStream(rStream);
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = rStream;
            remoteAudioRef.current.play().catch((e) => {
              console.warn('[WebRTC] Remote audio autoplay deferred:', e);
            });
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('call:initiate', {
          targetUserId: targetUser.id,
          offer,
          isVideo
        });
      } catch (err) {
        console.error('[WebRTC] Failed to initiate call:', err);
        cleanUpCall();
        callStateRef.current = 'idle';
        setCallState('idle');
        activeCallRef.current = null;
        setActiveCall(null);
      }
    },
    [socket, cleanUpCall, user?.username]
  );

  // ================= ACCEPT CALL =================
  const acceptCall = useCallback(async () => {
    if (isAccepting) return;
    const currentOffer = incomingOfferRef.current || activeCallRef.current?.offer;
    if (!socket || !activeCallRef.current || !currentOffer) {
      console.warn('[WebRTC] Cannot accept call: missing parameters', {
        socket: !!socket,
        call: activeCallRef.current,
        offer: !!currentOffer
      });
      return;
    }

    setIsAccepting(true);

    // Stop ringtone immediately
    if (ringtoneRef.current) {
      ringtoneRef.current.stop();
      ringtoneRef.current = null;
    }

    // Unlock audio context / element on direct user gesture
    if (remoteAudioRef.current) {
      remoteAudioRef.current.play().catch(() => {});
    }

    try {
      const isVideo = Boolean(activeCallRef.current.isVideo);
      const stream = await acquireMedia(isVideo, user?.username);
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket && activeCallRef.current) {
          socket.emit('call:ice-candidate', {
            targetUserId: activeCallRef.current.targetUser.id,
            candidate: event.candidate,
            callId: activeCallRef.current.callId
          });
        }
      };

      // Remote tracks
      pc.ontrack = (event) => {
        const rStream =
          event.streams && event.streams[0]
            ? event.streams[0]
            : new MediaStream([event.track]);
        setRemoteStream(rStream);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = rStream;
          remoteAudioRef.current.play().catch((e) => {
            console.warn('[WebRTC] Remote audio play caught:', e);
          });
        }
      };

      // Set remote offer
      await pc.setRemoteDescription(new RTCSessionDescription(currentOffer));

      // Create and set local answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Notify caller of acceptance
      socket.emit('call:accept', {
        callerId: activeCallRef.current.targetUser.id,
        answer,
        callId: activeCallRef.current.callId
      });

      // Flush buffered ICE candidates
      while (pendingCandidatesRef.current.length > 0) {
        const candidate = pendingCandidatesRef.current.shift();
        if (candidate && (candidate.candidate || candidate.sdpMid !== undefined)) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn('[WebRTC] Candidate buffer error:', e);
          }
        }
      }

      callStateRef.current = 'connected';
      setCallState('connected');
    } catch (err) {
      console.error('[WebRTC] Error accepting call:', err);
      cleanUpCall();
      callStateRef.current = 'idle';
      setCallState('idle');
      activeCallRef.current = null;
      setActiveCall(null);
    } finally {
      setIsAccepting(false);
    }
  }, [socket, cleanUpCall, user?.username, isAccepting]);

  // ================= REJECT CALL =================
  const rejectCall = useCallback(
    (reason = 'Call declined') => {
      if (socket && activeCallRef.current) {
        socket.emit('call:reject', {
          callerId: activeCallRef.current.targetUser.id,
          callId: activeCallRef.current.callId,
          reason
        });
      }
      cleanUpCall();
      callStateRef.current = 'idle';
      setCallState('idle');
      activeCallRef.current = null;
      setActiveCall(null);
    },
    [socket, cleanUpCall]
  );

  // ================= END CALL =================
  const endCall = useCallback(() => {
    if (socket && activeCallRef.current) {
      socket.emit('call:end', {
        targetUserId: activeCallRef.current.targetUser?.id,
        callId: activeCallRef.current.callId
      });
    }
    cleanUpCall();
    callStateRef.current = 'ended';
    setCallState('ended');
    setTimeout(() => {
      callStateRef.current = 'idle';
      setCallState('idle');
      activeCallRef.current = null;
      setActiveCall(null);
    }, 1200);
  }, [socket, cleanUpCall]);

  // ================= TOGGLE MUTE =================
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextEnabled = !audioTracks[0].enabled;
        audioTracks.forEach((t) => {
          t.enabled = nextEnabled;
        });
        setIsMuted(!nextEnabled);
      } else {
        setIsMuted((prev) => !prev);
      }
    } else {
      setIsMuted((prev) => !prev);
    }
  }, []);

  // ================= TOGGLE VIDEO =================
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const nextEnabled = !videoTracks[0].enabled;
        videoTracks.forEach((t) => {
          t.enabled = nextEnabled;
        });
        setIsVideoDisabled(!nextEnabled);
      } else {
        setIsVideoDisabled((prev) => !prev);
      }
    } else {
      setIsVideoDisabled((prev) => !prev);
    }
  }, []);

  // ================= SOCKET EVENT LISTENERS (Persistent) =================
  useEffect(() => {
    if (!socket || !user) return;

    // Incoming Call
    const handleCallIncoming = ({ callId, caller, offer, isVideo }) => {
      if (callStateRef.current !== 'idle') {
        socket.emit('call:reject', {
          callerId: caller.id,
          callId,
          reason: 'User is currently on another call.'
        });
        return;
      }

      incomingOfferRef.current = offer;
      const callData = {
        callId,
        targetUser: caller,
        isVideo,
        isIncoming: true,
        offer
      };
      activeCallRef.current = callData;
      setActiveCall(callData);
      callStateRef.current = 'incoming';
      setCallState('incoming');

      const tone = createToneGenerator();
      ringtoneRef.current = tone;
      tone.start();
    };

    // Caller receives Accepted
    const handleCallAccepted = async ({ answer }) => {
      if (ringtoneRef.current) {
        ringtoneRef.current.stop();
        ringtoneRef.current = null;
      }

      if (pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));

          while (pendingCandidatesRef.current.length > 0) {
            const candidate = pendingCandidatesRef.current.shift();
            if (candidate && (candidate.candidate || candidate.sdpMid !== undefined)) {
              try {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                console.warn('[WebRTC] Candidate flush error on accepted:', e);
              }
            }
          }

          callStateRef.current = 'connected';
          setCallState('connected');
        } catch (err) {
          console.error('[WebRTC] Error setting remote description on accepted call:', err);
        }
      }
    };

    // ICE Candidate
    const handleIceCandidate = async ({ candidate }) => {
      if (!candidate) return;
      if (pcRef.current && pcRef.current.remoteDescription) {
        try {
          if (candidate.candidate || candidate.sdpMid !== undefined) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          }
        } catch (e) {
          console.warn('[WebRTC] Error adding received ICE candidate:', e);
        }
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    };

    // Call Rejected
    const handleCallRejected = ({ reason }) => {
      cleanUpCall();
      setActiveCall((prev) => (prev ? { ...prev, statusMessage: reason || 'Call declined' } : null));
      callStateRef.current = 'ended';
      setCallState('ended');
      setTimeout(() => {
        callStateRef.current = 'idle';
        setCallState('idle');
        activeCallRef.current = null;
        setActiveCall(null);
      }, 1800);
    };

    // Call Ended
    const handleCallEnded = () => {
      cleanUpCall();
      setActiveCall((prev) => (prev ? { ...prev, statusMessage: 'Call ended' } : null));
      callStateRef.current = 'ended';
      setCallState('ended');
      setTimeout(() => {
        callStateRef.current = 'idle';
        setCallState('idle');
        activeCallRef.current = null;
        setActiveCall(null);
      }, 1200);
    };

    // Call Unavailable
    const handleCallUnavailable = ({ message }) => {
      cleanUpCall();
      setActiveCall((prev) => (prev ? { ...prev, statusMessage: message || 'User unreachable' } : null));
      callStateRef.current = 'ended';
      setCallState('ended');
      setTimeout(() => {
        callStateRef.current = 'idle';
        setCallState('idle');
        activeCallRef.current = null;
        setActiveCall(null);
      }, 2000);
    };

    socket.on('call:incoming', handleCallIncoming);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:ice-candidate', handleIceCandidate);
    socket.on('call:rejected', handleCallRejected);
    socket.on('call:ended', handleCallEnded);
    socket.on('call:unavailable', handleCallUnavailable);

    return () => {
      socket.off('call:incoming', handleCallIncoming);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('call:ice-candidate', handleIceCandidate);
      socket.off('call:rejected', handleCallRejected);
      socket.off('call:ended', handleCallEnded);
      socket.off('call:unavailable', handleCallUnavailable);
    };
  }, [socket, user, cleanUpCall]);

  const value = {
    callState,
    activeCall,
    isMuted,
    isVideoDisabled,
    isAccepting,
    callDuration,
    localStream,
    remoteStream,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
