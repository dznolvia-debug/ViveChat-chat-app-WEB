import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCall } from '../../context/CallContext';
import { Avatar } from '../common/Avatar';

export const IncomingCallModal: React.FC = () => {
  const { incomingCall, answerCall, declineCall } = useCall();

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-[#24133b] to-[#140a22] text-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-purple-500/50 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        {/* Caller Avatar with glowing pulse */}
        <div className="relative mb-4 mt-2">
          <div className="absolute -inset-4 rounded-full bg-purple-500/30 animate-ping" />
          <div className="absolute -inset-2 rounded-full bg-purple-600/40 animate-pulse" />
          <Avatar
            src={incomingCall.callerAvatar}
            name={incomingCall.callerName}
            size="xl"
            className="relative z-10 ring-4 ring-purple-400 shadow-2xl"
          />
        </div>

        {/* Caller Info */}
        <h3 className="text-xl font-bold text-white mb-0.5">{incomingCall.callerName}</h3>
        <p className="text-xs font-mono text-purple-300 mb-2">{incomingCall.callerPhone}</p>
        
        <div className="flex items-center gap-1.5 text-xs text-purple-400 bg-purple-950/80 px-3 py-1 rounded-full border border-purple-800/60 mb-8">
          {incomingCall.type === 'video' ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
          <span>{incomingCall.type === 'video' ? 'Videollamada de WhatsApp Morado entrante...' : 'Llamada de voz entrante...'}</span>
        </div>

        {/* Action Buttons: Decline & Accept */}
        <div className="flex items-center justify-center gap-12 w-full">
          {/* Decline Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={declineCall}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all ring-4 ring-red-600/30"
              title="Rechazar"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <span className="text-xs text-gray-300">Rechazar</span>
          </div>

          {/* Accept Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={answerCall}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 hover:brightness-110 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all ring-4 ring-purple-500/40 animate-bounce"
              title="Aceptar"
            >
              {incomingCall.type === 'video' ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
            </button>
            <span className="text-xs text-purple-300 font-semibold">Contestar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
