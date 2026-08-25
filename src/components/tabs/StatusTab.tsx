import React, { useState, useRef } from 'react';
import { Plus, Camera, X, Sparkles, Image as ImageIcon, Send } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { arePhonesMatching } from '../../utils/phoneMatcher';
import { Avatar } from '../common/Avatar';
import { StatusItem } from '../../types';

export const StatusTab: React.FC = () => {
  const { currentUser, contacts, statuses, addStatus, selectChatByPhone, sendMessage, setActiveTab } = useChat();
  const [viewingStatus, setViewingStatus] = useState<StatusItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [statusBgColor, setStatusBgColor] = useState('#7c3aed');
  const [statusImage, setStatusImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const BG_COLORS = ['#7c3aed', '#9333ea', '#6366f1', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

  const myStatuses = statuses.filter(s => s.userId === currentUser.id || arePhonesMatching(s.userPhone, currentUser.phone));
  const otherStatuses = statuses.filter(s => {
    if (s.userId === currentUser.id || arePhonesMatching(s.userPhone, currentUser.phone)) return false;
    // Show statuses from saved contacts or recent users
    return contacts.some(c => arePhonesMatching(c.phone, s.userPhone)) || contacts.length === 0;
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setStatusImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePostStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (statusImage) {
      addStatus({
        type: 'image',
        content: statusImage,
        caption: statusText.trim() || undefined,
      });
    } else if (statusText.trim()) {
      addStatus({
        type: 'text',
        content: statusText.trim(),
        backgroundColor: statusBgColor,
      });
    }

    setStatusText('');
    setStatusImage(null);
    setShowAddModal(false);
  };

  const formatTimestamp = (ts: number) => {
    const diffMin = Math.floor((Date.now() - ts) / (1000 * 60));
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    return `hace ${diffHours} h`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
      {/* My Status Section */}
      <div className="bg-white dark:bg-[#1f1530] p-3.5 rounded-2xl border border-purple-100 dark:border-purple-800/50 shadow-sm">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer flex-1"
            onClick={() => myStatuses.length > 0 ? setViewingStatus(myStatuses[0]) : setShowAddModal(true)}
          >
            <div className="relative">
              <Avatar
                src={currentUser.avatar}
                name={currentUser.name}
                size="lg"
                hasStatus={myStatuses.length > 0}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddModal(true);
                }}
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center border-2 border-white dark:border-gray-900 shadow"
                title="Añadir estado"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-purple-100">Mi estado</h4>
              <p className="text-xs text-gray-500 dark:text-purple-300/70">
                {myStatuses.length > 0 ? `Publicado ${formatTimestamp(myStatuses[0].timestamp)}` : 'Toca para actualizar tu estado (24h)'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="p-2.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 hover:bg-purple-200 transition-colors"
            title="Crear nuevo estado"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Recent Updates from Contacts */}
      <div>
        <h3 className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider mb-3 px-1">
          Actualizaciones Recientes
        </h3>

        {otherStatuses.length > 0 ? (
          <div className="flex flex-col gap-2">
            {otherStatuses.map((st) => (
              <div
                key={st.id}
                onClick={() => setViewingStatus(st)}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-white dark:bg-[#1f1530] border border-purple-100 dark:border-purple-800/40 hover:bg-purple-50 dark:hover:bg-purple-900/30 cursor-pointer transition-all shadow-sm group"
              >
                <Avatar
                  src={st.userAvatar}
                  name={st.userName}
                  size="md"
                  hasStatus
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-purple-100 group-hover:text-purple-600 transition-colors truncate">
                    {st.userName}
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-purple-300/70">
                    {formatTimestamp(st.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-white/50 dark:bg-purple-950/20 rounded-2xl border border-dashed border-purple-200 dark:border-purple-800/40">
            <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-purple-300">No hay actualizaciones de estado recientes.</p>
          </div>
        )}
      </div>

      {/* View Status Fullscreen Story Modal */}
      {viewingStatus && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between p-4 animate-in fade-in">
          {/* Top Progress & User Info */}
          <div className="w-full max-w-lg z-10 pt-2">
            <div className="w-full h-1 bg-white/30 rounded-full mb-3 overflow-hidden">
              <div className="h-full bg-white animate-[progress_5s_linear_forwards]" />
            </div>

            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Avatar src={viewingStatus.userAvatar} name={viewingStatus.userName} size="sm" />
                <div>
                  <h4 className="font-semibold text-sm">{viewingStatus.userName}</h4>
                  <span className="text-xs text-gray-300">{formatTimestamp(viewingStatus.timestamp)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingStatus(null)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Story Body */}
          <div className="flex-1 w-full max-w-lg flex flex-col items-center justify-center p-4 text-center select-none">
            {viewingStatus.type === 'image' ? (
              <div className="flex flex-col items-center justify-center gap-4">
                <img
                  src={viewingStatus.content}
                  alt="Story"
                  className="max-h-[60vh] rounded-2xl object-contain shadow-2xl"
                />
                {viewingStatus.caption && (
                  <p className="text-white text-base font-medium bg-black/60 px-4 py-2 rounded-full">
                    {viewingStatus.caption}
                  </p>
                )}
              </div>
            ) : (
              <div
                className="w-full aspect-square max-h-[50vh] rounded-3xl p-8 flex items-center justify-center text-white text-2xl font-bold shadow-2xl"
                style={{ backgroundColor: viewingStatus.backgroundColor || '#7c3aed' }}
              >
                {viewingStatus.content}
              </div>
            )}
          </div>

          {/* Reply to status input (WhatsApp style) */}
          {viewingStatus.userId !== currentUser.id && (
            <div className="w-full max-w-lg z-10 pb-2">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/20">
                <input
                  type="text"
                  placeholder="Responder al estado..."
                  id="status-reply-input"
                  className="flex-1 bg-transparent px-3 text-sm text-white placeholder:text-white/60 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (document.getElementById('status-reply-input') as HTMLInputElement)?.value;
                      if (val && val.trim()) {
                        const targetPhone = viewingStatus.userPhone;
                        if (targetPhone) {
                          selectChatByPhone(targetPhone);
                          sendMessage({
                            type: 'text',
                            content: `💬 En respuesta a tu estado: "${viewingStatus.type === 'text' ? viewingStatus.content : viewingStatus.caption || 'Foto'}": ${val.trim()}`,
                          });
                          setActiveTab('chats');
                          setViewingStatus(null);
                        }
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = (document.getElementById('status-reply-input') as HTMLInputElement)?.value;
                    if (val && val.trim()) {
                      const targetPhone = viewingStatus.userPhone;
                      if (targetPhone) {
                        selectChatByPhone(targetPhone);
                        sendMessage({
                          type: 'text',
                          content: `💬 En respuesta a tu estado: "${viewingStatus.type === 'text' ? viewingStatus.content : viewingStatus.caption || 'Foto'}": ${val.trim()}`,
                        });
                        setActiveTab('chats');
                        setViewingStatus(null);
                      }
                    }
                  }}
                  className="px-4 py-1.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold"
                >
                  Enviar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add New Status Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e1430] w-full max-w-md rounded-2xl shadow-2xl border border-purple-200 dark:border-purple-800 overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white p-4 flex items-center justify-between">
              <h3 className="font-semibold text-base">Crear nuevo estado</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-full hover:bg-white/20">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostStatus} className="p-5 flex flex-col gap-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />

              {statusImage ? (
                <div className="relative rounded-xl overflow-hidden aspect-video bg-black flex items-center justify-center">
                  <img src={statusImage} alt="Status preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setStatusImage(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  className="rounded-xl p-6 flex flex-col items-center justify-center min-h-[160px] text-white text-center font-semibold transition-colors relative"
                  style={{ backgroundColor: statusBgColor }}
                >
                  <textarea
                    value={statusText}
                    onChange={(e) => setStatusText(e.target.value)}
                    placeholder="Escribe tu estado aquí..."
                    rows={3}
                    className="w-full bg-transparent text-white placeholder:text-white/70 text-center text-lg resize-none outline-none font-bold"
                  />
                  <div className="flex items-center gap-2 mt-4">
                    {BG_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setStatusBgColor(c)}
                        className={`w-6 h-6 rounded-full border-2 ${statusBgColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-semibold flex items-center gap-2 hover:bg-purple-200"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Subir Foto</span>
                </button>

                <button
                  type="submit"
                  disabled={!statusText.trim() && !statusImage}
                  className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold text-sm shadow transition-all"
                >
                  Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
