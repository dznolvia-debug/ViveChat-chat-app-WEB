import React from 'react';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Calendar } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useCall } from '../../context/CallContext';
import { Avatar } from '../common/Avatar';

export const CallsTab: React.FC = () => {
  const { calls, currentUser } = useChat();
  const { startCall } = useCall();

  const formatDuration = (sec?: number) => {
    if (!sec) return '';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `(${m}:${s < 10 ? '0' : ''}${s})`;
  };

  const formatCallDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-base">Llamadas y Videollamadas HD</h3>
          <p className="text-xs text-purple-200">Audio y video en tiempo real sin latencia</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Phone className="w-5 h-5" />
        </div>
      </div>

      {/* Call History */}
      <div className="flex flex-col divide-y divide-purple-100 dark:divide-purple-900/40 bg-white dark:bg-[#1f1530] rounded-2xl p-2 border border-purple-100 dark:border-purple-800/50 shadow-sm">
        {calls.length > 0 ? (
          calls.map((call) => {
            const isCaller = call.callerId === currentUser.id;
            const peerName = isCaller ? call.receiverName : call.callerName;
            const peerPhone = isCaller ? call.receiverPhone : call.callerPhone;
            const peerAvatar = isCaller ? call.receiverAvatar : call.callerAvatar;

            return (
              <div key={call.id} className="flex items-center justify-between p-3 hover:bg-purple-50/70 dark:hover:bg-purple-900/30 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar src={peerAvatar} name={peerName} size="md" />
                  <div>
                    <h4 className={`font-semibold text-sm ${call.direction === 'missed' ? 'text-red-500' : 'text-gray-900 dark:text-purple-100'}`}>
                      {peerName}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-purple-300/70 mt-0.5">
                      {call.direction === 'incoming' && <PhoneIncoming className="w-3.5 h-3.5 text-emerald-500" />}
                      {call.direction === 'outgoing' && <PhoneOutgoing className="w-3.5 h-3.5 text-purple-600" />}
                      {call.direction === 'missed' && <PhoneMissed className="w-3.5 h-3.5 text-red-500" />}
                      <span>{formatCallDate(call.timestamp)}</span>
                      {call.durationSeconds && (
                        <span className="font-mono text-[11px] text-purple-600 dark:text-purple-400">
                          {formatDuration(call.durationSeconds)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Call back action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startCall(peerPhone, 'voice')}
                    className="p-2.5 rounded-full text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors"
                    title="Llamar"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => startCall(peerPhone, 'video')}
                    className="p-2.5 rounded-full text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors"
                    title="Videollamada"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 text-gray-400 dark:text-purple-300 text-sm">
            No tienes llamadas recientes.
          </div>
        )}
      </div>
    </div>
  );
};
