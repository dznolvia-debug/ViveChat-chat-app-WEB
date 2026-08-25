import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { ActiveCallState } from '../types';
import { useChat, arePhonesMatching } from './ChatContext';
import { broadcastEvent, subscribeToBroadcast } from '../utils/storage';
import { apiClient } from '../utils/apiClient';
import { firestoreService } from '../utils/firebase';
import { sounds } from '../utils/soundEffects';

interface CallContextType {
  activeCall: ActiveCallState | null;
  incomingCall: {
    callId: string;
    callerId: string;
    callerName: string;
    callerPhone: string;
    callerAvatar: string;
    type: 'voice' | 'video';
    sdp?: string;
  } | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isCallMinimized: boolean;
  
  // Call actions
  startCall: (contactPhone: string, type: 'voice' | 'video') => Promise<void>;
  answerCall: () => Promise<void>;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;
  toggleSpeaker: () => void;
  toggleMinimizeCall: () => void;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
  iceCandidatePoolSize: 10,
};

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, allUsers, contacts, addCallRecord, isRegistered } = useChat();
  
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    callId: string;
    callerId: string;
    callerName: string;
    callerPhone: string;
    callerAvatar: string;
    type: 'voice' | 'video';
    sdp?: string;
  } | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallMinimized, setIsCallMinimized] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const callTimerRef = useRef<number | null>(null);
  const currentCallDurationRef = useRef<number>(0);
  const targetPhoneRef = useRef<string | null>(null);
  const currentCallIdRef = useRef<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  // Helper to broadcast signals instantly across Firestore, Server SSE & Local BroadcastChannel
  const sendSignal = useCallback((payload: any) => {
    firestoreService.sendCallSignal(payload);
    apiClient.sendCallSignal(payload);
    broadcastEvent('CALL_SIGNAL', payload);
  }, []);

  // Stop all media tracks helper
  const stopTracks = useCallback((stream: MediaStream | null) => {
    if (stream) {
      stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
    }
  }, []);

  // Cleanup call resources
  const cleanupCall = useCallback(() => {
    sounds.stopRingtone();

    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.onconnectionstatechange = null;
        peerConnectionRef.current.close();
      } catch {
        // ignore
      }
      peerConnectionRef.current = null;
    }

    pendingCandidatesRef.current = [];
    targetPhoneRef.current = null;
    currentCallIdRef.current = null;

    stopTracks(localStreamRef.current);
    stopTracks(remoteStreamRef.current);

    localStreamRef.current = null;
    remoteStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setActiveCall(null);
    setIncomingCall(null);
    setIsCallMinimized(false);
  }, [stopTracks]);

  // Request user camera & microphone with automatic constraints for maximum clarity & compatibility
  const getMedia = useCallback(async (type: 'voice' | 'video'): Promise<MediaStream | null> => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: type === 'video' ? {
          facingMode: 'user',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        } : false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.warn('getUserMedia high constraints failed, attempting basic audio/video fallback', err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === 'video' ? true : false,
        });
        localStreamRef.current = stream;
        return stream;
      } catch (basicErr) {
        console.warn('Basic getUserMedia also failed, trying audio-only:', basicErr);
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          localStreamRef.current = stream;
          return stream;
        } catch (audioErr) {
          console.warn('Audio device access blocked or unavailable:', audioErr);
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const dst = ctx.createMediaStreamDestination();
            const gain = ctx.createGain();
            gain.gain.value = 0.0001;
            osc.connect(gain);
            gain.connect(dst);
            osc.start();
            localStreamRef.current = dst.stream;
            return dst.stream;
          } catch {
            return null;
          }
        }
      }
    }
  }, []);

  // Create & configure WebRTC RTCPeerConnection
  const createPeerConnection = useCallback((peerTargetPhone: string, callType: 'voice' | 'video', callId: string, myStream: MediaStream | null): RTCPeerConnection => {
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch {
        // ignore
      }
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionRef.current = pc;
    targetPhoneRef.current = peerTargetPhone;
    currentCallIdRef.current = callId;

    // Attach local audio/video tracks to peer connection
    if (myStream) {
      myStream.getTracks().forEach(track => {
        try {
          pc.addTrack(track, myStream);
        } catch (e) {
          console.warn('Could not add track to RTCPeerConnection', e);
        }
      });
    }

    // Remote track arrived (Audio & Video streams from the other phone)
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        setRemoteStream(event.streams[0]);
      } else if (event.track) {
        setRemoteStream(prev => {
          if (prev) {
            prev.addTrack(event.track);
            remoteStreamRef.current = prev;
            return prev;
          }
          const s = new MediaStream();
          s.addTrack(event.track);
          remoteStreamRef.current = s;
          return s;
        });
      }
    };

    // ICE Candidate generation - transmit to other phone immediately
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          action: 'ice-candidate',
          callId,
          callerPhone: currentUser.phone,
          targetPhone: peerTargetPhone,
          callType,
          candidate: event.candidate.toJSON ? event.candidate.toJSON() : event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setActiveCall(prev => prev ? { ...prev, status: 'connected', startTime: prev.startTime || Date.now() } : null);
      }
    };

    return pc;
  }, [currentUser.phone, sendSignal]);

  // Start outgoing call
  const startCall = useCallback(async (contactPhone: string, type: 'voice' | 'video') => {
    const targetUser = allUsers.find(u => arePhonesMatching(u.phone, contactPhone));
    const contactInfo = contacts.find(c => arePhonesMatching(c.phone, contactPhone));

    const peerName = contactInfo?.name || targetUser?.name || contactPhone;
    const peerAvatar = contactInfo?.avatar || targetUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
    const callId = 'call_' + Date.now();

    // 1. Acquire local camera & microphone
    const userStream = await getMedia(type);
    setLocalStream(userStream);

    const newCallState: ActiveCallState = {
      callId,
      peerId: targetUser?.id || 'unknown',
      peerName,
      peerPhone: contactPhone,
      peerAvatar,
      type,
      direction: 'outgoing',
      status: 'ringing',
      isMuted: false,
      isVideoOff: type === 'voice',
      isSpeakerOn: true,
      isScreenSharing: false,
      localStream: userStream,
      remoteStream: null,
    };

    setActiveCall(newCallState);
    sounds.playOutgoingRing();

    // 2. Initialize WebRTC Peer Connection & SDP Offer
    try {
      const pc = createPeerConnection(contactPhone, type, callId, userStream);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === 'video',
      });
      await pc.setLocalDescription(offer);

      // 3. Send offer signal to recipient phone in real time
      const offerPayload = {
        action: 'offer' as const,
        callId,
        callerId: currentUser.id,
        callerName: currentUser.name,
        callerPhone: currentUser.phone,
        callerAvatar: currentUser.avatar,
        targetPhone: contactPhone,
        callType: type,
        sdp: offer.sdp,
      };

      sendSignal(offerPayload);
    } catch (err) {
      console.error('Error creating WebRTC offer:', err);
    }
  }, [allUsers, contacts, createPeerConnection, currentUser, getMedia, sendSignal]);

  // Answer incoming call
  const answerCall = useCallback(async () => {
    if (!incomingCall) return;

    sounds.stopRingtone();
    sounds.playCallConnected();

    const userStream = await getMedia(incomingCall.type);
    setLocalStream(userStream);

    const newCallState: ActiveCallState = {
      callId: incomingCall.callId,
      peerId: incomingCall.callerId,
      peerName: incomingCall.callerName,
      peerPhone: incomingCall.callerPhone,
      peerAvatar: incomingCall.callerAvatar,
      type: incomingCall.type,
      direction: 'incoming',
      status: 'connected',
      startTime: Date.now(),
      isMuted: false,
      isVideoOff: incomingCall.type === 'voice',
      isSpeakerOn: true,
      isScreenSharing: false,
      localStream: userStream,
      remoteStream: null,
    };

    setActiveCall(newCallState);
    const answeringCall = { ...incomingCall };
    setIncomingCall(null);

    // Setup WebRTC and create Answer SDP
    try {
      const pc = createPeerConnection(answeringCall.callerPhone, answeringCall.type, answeringCall.callId, userStream);

      if (answeringCall.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription({
          type: 'offer',
          sdp: answeringCall.sdp,
        }));

        // Flush any ICE candidates that arrived before answering
        while (pendingCandidatesRef.current.length > 0) {
          const candidate = pendingCandidatesRef.current.shift();
          if (candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.warn('Error applying queued ICE candidate:', e);
            }
          }
        }
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send Answer signal back to caller phone
      const answerPayload = {
        action: 'answer' as const,
        callId: answeringCall.callId,
        callerPhone: currentUser.phone,
        targetPhone: answeringCall.callerPhone,
        callType: answeringCall.type,
        sdp: answer.sdp,
      };

      sendSignal(answerPayload);
    } catch (err) {
      console.error('Error answering WebRTC call:', err);
    }

    // Start duration counter
    if (!callTimerRef.current) {
      currentCallDurationRef.current = 0;
      callTimerRef.current = window.setInterval(() => {
        currentCallDurationRef.current += 1;
      }, 1000);
    }
  }, [createPeerConnection, currentUser.phone, getMedia, incomingCall, sendSignal]);

  // Decline call
  const declineCall = useCallback(() => {
    if (!incomingCall) return;

    sounds.stopRingtone();
    const rejectPayload = {
      action: 'reject' as const,
      callId: incomingCall.callId,
      callerPhone: currentUser.phone,
      targetPhone: incomingCall.callerPhone,
      callType: incomingCall.type,
    };

    sendSignal(rejectPayload);

    // Log missed call
    addCallRecord({
      callerId: incomingCall.callerId,
      callerName: incomingCall.callerName,
      callerPhone: incomingCall.callerPhone,
      callerAvatar: incomingCall.callerAvatar,
      type: incomingCall.type,
      direction: 'missed',
      durationSeconds: 0,
      status: 'missed',
    });

    cleanupCall();
  }, [addCallRecord, cleanupCall, currentUser.phone, incomingCall, sendSignal]);

  // End active call
  const endCall = useCallback(() => {
    if (!activeCall) return;

    sounds.playCallEnded();

    const endPayload = {
      action: 'end' as const,
      callId: activeCall.callId,
      callerPhone: currentUser.phone,
      targetPhone: activeCall.peerPhone,
      callType: activeCall.type,
    };

    sendSignal(endPayload);

    // Record call log
    const duration = currentCallDurationRef.current;
    addCallRecord({
      callerId: activeCall.peerId,
      callerName: activeCall.peerName,
      callerPhone: activeCall.peerPhone,
      callerAvatar: activeCall.peerAvatar,
      receiverId: currentUser.id,
      receiverName: currentUser.name,
      receiverPhone: currentUser.phone,
      receiverAvatar: currentUser.avatar,
      type: activeCall.type,
      direction: activeCall.direction === 'outgoing' ? 'outgoing' : 'incoming',
      durationSeconds: duration,
      status: 'completed',
    });

    cleanupCall();
  }, [activeCall, addCallRecord, cleanupCall, currentUser.avatar, currentUser.id, currentUser.name, currentUser.phone, sendSignal]);

  // Handle incoming signaling (offer, answer, ice-candidate, end, reject)
  useEffect(() => {
    if (!isRegistered || !currentUser.phone) return;

    const handleSignal = async (payload: any) => {
      const action = payload.action;

      // 1. Incoming Call Offer
      if (action === 'offer' && arePhonesMatching(payload.targetPhone, currentUser.phone)) {
        setIncomingCall({
          callId: payload.callId || ('call_' + Date.now()),
          callerId: payload.callerId || 'user_remote',
          callerName: payload.callerName || payload.callerPhone,
          callerPhone: payload.callerPhone,
          callerAvatar: payload.callerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          type: payload.callType || 'voice',
          sdp: payload.sdp,
        });
        sounds.startIncomingRingtone();
      }
      
      // 2. Call Answered by Peer
      else if (action === 'answer' && arePhonesMatching(payload.targetPhone, currentUser.phone)) {
        sounds.stopRingtone();
        sounds.playCallConnected();

        const pc = peerConnectionRef.current;
        if (pc && payload.sdp) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription({
              type: 'answer',
              sdp: payload.sdp,
            }));

            // Flush pending ICE candidates
            while (pendingCandidatesRef.current.length > 0) {
              const candidate = pendingCandidatesRef.current.shift();
              if (candidate) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                  console.warn('Error applying queued candidate:', e);
                }
              }
            }
          } catch (e) {
            console.error('Error applying remote answer description:', e);
          }
        }

        setActiveCall(prev => prev ? { ...prev, status: 'connected', startTime: Date.now() } : null);
        
        // Start duration counter
        if (!callTimerRef.current) {
          currentCallDurationRef.current = 0;
          callTimerRef.current = window.setInterval(() => {
            currentCallDurationRef.current += 1;
          }, 1000);
        }
      }

      // 3. ICE Candidate Exchange
      else if (action === 'ice-candidate' && arePhonesMatching(payload.targetPhone, currentUser.phone)) {
        if (payload.candidate) {
          const pc = peerConnectionRef.current;
          if (pc && pc.remoteDescription && pc.remoteDescription.type) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch (e) {
              console.warn('Could not add ice candidate:', e);
            }
          } else {
            pendingCandidatesRef.current.push(payload.candidate);
          }
        }
      }

      // 4. Call Terminated or Rejected
      else if ((action === 'end' || action === 'reject') && arePhonesMatching(payload.targetPhone, currentUser.phone)) {
        sounds.playCallEnded();
        cleanupCall();
      }
    };

    // 1. Firestore Cloud Call Signaling
    const unsubscribeFirestoreSignals = firestoreService.subscribeToCallSignals(
      currentUser.phone,
      (signal) => {
        handleSignal(signal);
      }
    );

    // 2. Server SSE Call Signals
    const unsubscribeSSE = apiClient.subscribeToEvents(currentUser.phone, (event) => {
      if (event.type === 'CALL_SIGNAL') {
        handleSignal(event.payload);
      }
    });

    // 3. Local tab broadcast
    const unsubscribeBroadcast = subscribeToBroadcast((event) => {
      if (event.type === 'CALL_SIGNAL') {
        handleSignal(event.payload);
      }
    });

    return () => {
      unsubscribeFirestoreSignals();
      unsubscribeSSE();
      unsubscribeBroadcast();
    };
  }, [cleanupCall, currentUser.phone, isRegistered]);

  // Toggle Microphone Mute
  const toggleMute = useCallback(() => {
    if (!activeCall) return;
    const isMuted = !activeCall.isMuted;
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
    setActiveCall(prev => prev ? { ...prev, isMuted } : null);
  }, [activeCall, localStream]);

  // Toggle Camera
  const toggleVideo = useCallback(() => {
    if (!activeCall) return;
    const isVideoOff = !activeCall.isVideoOff;
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOff;
      });
    }
    setActiveCall(prev => prev ? { ...prev, isVideoOff } : null);
  }, [activeCall, localStream]);

  // Toggle Screen Share
  const toggleScreenShare = useCallback(async () => {
    if (!activeCall) return;

    if (activeCall.isScreenSharing) {
      const cameraStream = await getMedia('video');
      if (cameraStream && localStream) {
        const videoTrack = cameraStream.getVideoTracks()[0];
        const oldTrack = localStream.getVideoTracks()[0];
        if (oldTrack) {
          localStream.removeTrack(oldTrack);
          oldTrack.stop();
        }
        if (videoTrack) {
          localStream.addTrack(videoTrack);
          if (peerConnectionRef.current) {
            const sender = peerConnectionRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) {
              sender.replaceTrack(videoTrack);
            }
          }
        }
      }
      setActiveCall(prev => prev ? { ...prev, isScreenSharing: false } : null);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        if (screenTrack && localStream) {
          const oldTrack = localStream.getVideoTracks()[0];
          if (oldTrack) {
            localStream.removeTrack(oldTrack);
            oldTrack.stop();
          }
          localStream.addTrack(screenTrack);

          if (peerConnectionRef.current) {
            const sender = peerConnectionRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) {
              sender.replaceTrack(screenTrack);
            }
          }

          screenTrack.onended = () => {
            toggleScreenShare();
          };

          setActiveCall(prev => prev ? { ...prev, isScreenSharing: true } : null);
        }
      } catch {
        // cancelled screen share
      }
    }
  }, [activeCall, getMedia, localStream]);

  // Toggle Speaker
  const toggleSpeaker = useCallback(() => {
    setActiveCall(prev => prev ? { ...prev, isSpeakerOn: !prev.isSpeakerOn } : null);
  }, []);

  // Minimize call overlay
  const toggleMinimizeCall = useCallback(() => {
    setIsCallMinimized(prev => !prev);
  }, []);

  return (
    <CallContext.Provider
      value={{
        activeCall,
        incomingCall,
        localStream,
        remoteStream,
        isCallMinimized,
        startCall,
        answerCall,
        declineCall,
        endCall,
        toggleMute,
        toggleVideo,
        toggleScreenShare,
        toggleSpeaker,
        toggleMinimizeCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
