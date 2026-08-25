import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  Sparkles,
  Wifi,
} from 'lucide-react';
import { useCall } from '../../context/CallContext';
import { Avatar } from '../common/Avatar';

export const CallModal: React.FC = () => {
  const {
    activeCall,
    localStream,
    remoteStream,
    isCallMinimized,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    toggleSpeaker,
    toggleMinimizeCall,
  } = useCall();

  const [callDuration, setCallDuration] = useState(0);
  const [audioWaveform, setAudioWaveform] = useState<number[]>([35, 60, 45, 80, 50, 75, 40, 65, 30, 90, 45, 70]);
  const [hasRemoteVideoTrack, setHasRemoteVideoTrack] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Setup local video stream preview
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, activeCall?.isVideoOff]);

  // Setup remote video and remote audio streams
  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch((err) => {
          console.warn('Autoplay remote video attempt:', err);
        });
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch((err) => {
          console.warn('Autoplay remote audio attempt:', err);
        });
      }

      const checkTracks = () => {
        const videoTracks = remoteStream.getVideoTracks();
        setHasRemoteVideoTrack(videoTracks.length > 0 && videoTracks[0].enabled);
      };

      checkTracks();
      remoteStream.onaddtrack = checkTracks;
      remoteStream.onremovetrack = checkTracks;
    } else {
      setHasRemoteVideoTrack(false);
    }
  }, [remoteStream, activeCall?.status]);

  // Manage speaker volume on audio element
  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = activeCall?.isSpeakerOn ? 1.0 : 0.2;
    }
  }, [activeCall?.isSpeakerOn]);

  // Duration timer & audio waveform animation
  useEffect(() => {
    if (!activeCall || activeCall.status !== 'connected') {
      setCallDuration(0);
      return;
    }

    const interval = window.setInterval(() => {
      setCallDuration(prev => prev + 1);
      setAudioWaveform(Array.from({ length: 14 }, () => Math.floor(Math.random() * 75) + 25));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCall?.status]);

  if (!activeCall) return null;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Minimized Floating PiP View
  if (isCallMinimized) {
    return (
      <div className="fixed bottom-20 right-6 z-50 bg-purple-950/95 text-white p-3 rounded-2xl shadow-2xl border border-purple-500/50 backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
        {/* Remote audio tag for background hearing */}
        <audio ref={remoteAudioRef} autoPlay playsInline />

        <Avatar src={activeCall.peerAvatar} name={activeCall.peerName} size="sm" isOnline />
        <div>
          <h4 className="text-xs font-semibold text-purple-100">{activeCall.peerName}</h4>
          <span className="text-[10px] text-purple-300 font-mono">
            {activeCall.status === 'connected' ? formatDuration(callDuration) : 'Conectando...'}
          </span>
        </div>
        <button
          type="button"
          onClick={toggleMinimizeCall}
          className="p-1.5 rounded-full bg-purple-800/80 hover:bg-purple-700 text-purple-200 transition-colors"
          title="Maximizar"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={endCall}
          className="p-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
          title="Colgar"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#1b0d2b] via-[#12081f] to-[#0d0517] flex flex-col justify-between text-white animate-in fade-in duration-200 select-none">
      {/* Remote audio tag for voice streaming */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Top Header */}
      <div className="p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-purple-600/70 border border-purple-400/40 text-purple-200 flex items-center gap-1.5 font-medium shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>WebRTC HD • {activeCall.type === 'video' ? 'Videollamada' : 'Llamada de voz'}</span>
          </span>
          {activeCall.status === 'connected' && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
              <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Conectado</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={toggleMinimizeCall}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Minimizar llamada"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Center Call Body */}
      <div className="flex-1 relative flex items-center justify-center p-3 sm:p-4">
        {activeCall.type === 'video' ? (
          /* Video Call Layout */
          <div className="relative w-full h-full max-w-5xl max-h-[78vh] rounded-3xl overflow-hidden bg-black border border-purple-900/60 shadow-2xl flex items-center justify-center">
            {/* Remote Video Stream from the other phone */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                activeCall.status === 'connected' && hasRemoteVideoTrack ? 'opacity-100' : 'opacity-0 absolute'
              }`}
            />

            {/* Fallback Display if video track is not active or during ringing */}
            {(!hasRemoteVideoTrack || activeCall.status !== 'connected') && (
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-radial from-purple-950/60 to-black p-6">
                <img
                  src={activeCall.peerAvatar}
                  alt={activeCall.peerName}
                  className="w-full h-full object-cover opacity-25 blur-md absolute inset-0 scale-110"
                />
                <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                  <div className="relative">
                    {activeCall.status === 'connected' ? (
                      <div className="relative">
                        <div className="absolute -inset-3 rounded-full bg-purple-500/30 animate-pulse" />
                        <Avatar
                          src={activeCall.peerAvatar}
                          name={activeCall.peerName}
                          size="xl"
                          className="relative z-10 ring-4 ring-purple-400 shadow-2xl"
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute -inset-4 rounded-full bg-purple-500/30 animate-ping" />
                        <div className="absolute -inset-2 rounded-full bg-purple-600/40 animate-pulse" />
                        <Avatar
                          src={activeCall.peerAvatar}
                          name={activeCall.peerName}
                          size="xl"
                          className="relative z-10 ring-4 ring-purple-400 shadow-2xl"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">{activeCall.peerName}</h3>
                    <p className="text-purple-300 font-mono text-sm">{activeCall.peerPhone}</p>
                    <p className="text-xs text-purple-300/80 mt-2 font-medium">
                      {activeCall.status === 'connected'
                        ? 'En directo • Cámara remota apagada o cargando...'
                        : 'Llamando al otro teléfono...'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Floating Live Duration Tag in Video Mode */}
            {activeCall.status === 'connected' && (
              <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-purple-500/40 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-mono font-semibold text-purple-200">
                  {formatDuration(callDuration)}
                </span>
              </div>
            )}

            {/* Local Camera Picture-in-Picture */}
            <div className="absolute bottom-4 right-4 w-32 sm:w-44 aspect-3/4 sm:aspect-video rounded-2xl overflow-hidden bg-purple-950/90 border-2 border-purple-500/80 shadow-2xl z-20 group">
              {!activeCall.isVideoOff && localStream ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-purple-950 text-purple-300 p-2 text-center">
                  <VideoOff className="w-6 h-6 mb-1 text-purple-400" />
                  <span className="text-[10px] font-medium">Cámara apagada</span>
                </div>
              )}
              <div className="absolute bottom-1.5 left-2 text-[10px] bg-black/70 px-1.5 py-0.5 rounded text-white font-medium">
                Tú
              </div>
            </div>
          </div>
        ) : (
          /* Voice Call Layout */
          <div className="flex flex-col items-center gap-6 max-w-sm text-center">
            <div className="relative">
              {activeCall.status === 'connected' ? (
                <div className="relative">
                  <div className="absolute -inset-4 rounded-full bg-purple-500/25 animate-pulse" />
                  <div className="absolute -inset-2 rounded-full bg-purple-600/35" />
                  <Avatar
                    src={activeCall.peerAvatar}
                    name={activeCall.peerName}
                    size="xl"
                    className="relative z-10 ring-4 ring-purple-400 shadow-2xl"
                  />
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute -inset-4 rounded-full bg-purple-500/30 animate-ping" />
                  <div className="absolute -inset-2 rounded-full bg-purple-600/40 animate-pulse" />
                  <Avatar
                    src={activeCall.peerAvatar}
                    name={activeCall.peerName}
                    size="xl"
                    className="relative z-10 ring-4 ring-purple-400"
                  />
                </div>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{activeCall.peerName}</h2>
              <p className="text-purple-300 font-mono text-sm">{activeCall.peerPhone}</p>
              <p className="text-purple-400 text-sm mt-2 font-mono">
                {activeCall.status === 'connected' ? formatDuration(callDuration) : 'Llamando...'}
              </p>
            </div>

            {/* Live Audio visualizer waves for active conversation */}
            {activeCall.status === 'connected' && (
              <div className="flex items-center gap-1.5 h-12 px-5 py-2.5 bg-purple-950/70 rounded-full border border-purple-600/40 shadow-inner">
                {audioWaveform.map((lvl, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-purple-500 via-indigo-400 to-white rounded-full transition-all duration-150"
                    style={{ height: `${lvl}%` }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="p-6 pb-8 flex items-center justify-center gap-4 z-20 bg-gradient-to-t from-black/90 to-transparent">
        {/* Toggle Mute Mic */}
        <button
          type="button"
          onClick={toggleMute}
          className={`p-4 rounded-full transition-all shadow-lg active:scale-95 ${
            activeCall.isMuted
              ? 'bg-red-500/90 text-white ring-4 ring-red-500/30'
              : 'bg-white/15 hover:bg-white/25 text-white'
          }`}
          title={activeCall.isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
        >
          {activeCall.isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* Toggle Video Camera (if video call) */}
        {activeCall.type === 'video' && (
          <button
            type="button"
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-all shadow-lg active:scale-95 ${
              activeCall.isVideoOff
                ? 'bg-red-500/90 text-white ring-4 ring-red-500/30'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title={activeCall.isVideoOff ? 'Encender cámara' : 'Apagar cámara'}
          >
            {activeCall.isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        )}

        {/* Toggle Screen Share */}
        {activeCall.type === 'video' && (
          <button
            type="button"
            onClick={toggleScreenShare}
            className={`p-4 rounded-full transition-all shadow-lg active:scale-95 ${
              activeCall.isScreenSharing
                ? 'bg-purple-600 text-white ring-4 ring-purple-400/40'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title="Compartir pantalla"
          >
            <Monitor className="w-6 h-6" />
          </button>
        )}

        {/* Toggle Speaker */}
        <button
          type="button"
          onClick={toggleSpeaker}
          className={`p-4 rounded-full transition-all shadow-lg active:scale-95 ${
            activeCall.isSpeakerOn
              ? 'bg-white/15 hover:bg-white/25 text-white'
              : 'bg-white/10 text-gray-400'
          }`}
          title="Altavoz"
        >
          {activeCall.isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
        </button>

        {/* End Call Button */}
        <button
          type="button"
          onClick={endCall}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl hover:scale-105 active:scale-95 transition-all ring-4 ring-red-600/40 ml-2"
          title="Finalizar llamada"
        >
          <PhoneOff className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};
