import React, { useState, useRef, useEffect } from 'react';
import {
  Phone,
  Video,
  Search,
  MoreVertical,
  Lock,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Ban,
  Pin,
  Trash2,
  Info,
  Check,
  X,
  Star,
  UserMinus,
  Users
} from 'lucide-react';
import { useChat, normalizePhone, arePhonesMatching } from '../../context/ChatContext';
import { useCall } from '../../context/CallContext';
import { Avatar } from '../common/Avatar';
import { MessageBubble } from '../chat/MessageBubble';
import { InputBar } from '../chat/InputBar';
import { ForwardModal } from '../modals/ForwardModal';
import { ContactInfoModal } from '../modals/ContactInfoModal';
import { Message } from '../../types';

interface ChatAreaProps {
  onBackToSidebar?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ onBackToSidebar }) => {
  const {
    currentUser,
    selectedContact,
    selectedGroup,
    selectedContactPhone,
    typingUsers,
    settings,
    getChatMessages,
    sendMessage,
    editMessage,
    toggleStarMessage,
    deleteMessage,
    reactToMessage,
    clearChat,
    togglePinChat,
    isChatPinned,
    blockContact,
    unblockContact,
    isContactBlocked,
    deleteContact,
    setTyping,
    openMediaViewer,
    selectChatByPhone,
  } = useChat();

  const { startCall } = useCall();

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSearchInChat, setShowSearchInChat] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showOnlyStarred, setShowOnlyStarred] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isGroup = !!selectedGroup || (selectedContactPhone ? selectedContactPhone.startsWith('group_') : false);
  const messages = selectedContactPhone ? getChatMessages(selectedContactPhone) : [];
  const isTyping = selectedContactPhone && !isGroup ? typingUsers[selectedContactPhone] : false;
  const isBlocked = selectedContactPhone && !isGroup ? isContactBlocked(selectedContactPhone) : false;
  const isPinned = selectedContactPhone ? isChatPinned(selectedContactPhone) : false;

  // Auto scroll to bottom smoothly
  const scrollToBottom = () => {
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isTyping]);

  const handleReply = React.useCallback((m: Message) => setReplyingTo(m), []);
  const handleReact = React.useCallback((id: string, emoji: string) => reactToMessage(id, emoji), [reactToMessage]);
  const handleDelete = React.useCallback((id: string, forEveryone?: boolean) => deleteMessage(id, forEveryone), [deleteMessage]);
  const handleStar = React.useCallback((id: string) => toggleStarMessage(id), [toggleStarMessage]);
  const handleEdit = React.useCallback((m: Message) => setEditingMessage(m), []);
  const handleForward = React.useCallback((m: Message) => setForwardingMessage(m), []);
  const handleOpenMedia = React.useCallback((url: string, type: 'image' | 'video', title?: string) => openMediaViewer(url, type, title), [openMediaViewer]);
  const handleCancelReply = React.useCallback(() => setReplyingTo(null), []);

  if (!selectedContactPhone || !selectedContact) {
    return (
      <main className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#efe7fd]/50 dark:bg-[#140b1e] p-8 text-center select-none relative overflow-hidden">
        {/* Background decorative vector */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#7c3aed_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg mb-5 ring-4 ring-purple-100 dark:ring-purple-950/40">
          <Sparkles className="w-10 h-10" />
        </div>

        <h2 className="text-xl font-bold text-slate-800 dark:text-purple-100 mb-1.5">
          ViveChat para Web
        </h2>
        <p className="text-sm text-slate-600 dark:text-purple-300/80 max-w-md mb-5 leading-relaxed">
          Envía y recibe mensajes, fotos, videos, notas de voz y realiza llamadas y videollamadas en tiempo real comunicándote por número telefónico o grupos.
        </p>

        <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300 bg-white/80 dark:bg-purple-950/80 backdrop-blur-xs px-4 py-2 rounded-full border border-purple-200/80 dark:border-purple-800/60 shadow-xs">
          <Lock className="w-3.5 h-3.5" />
          <span>Cifrado de extremo a extremo • Llamadas HD sin latencia</span>
        </div>
      </main>
    );
  }

  // Filter messages by search if searching
  let displayedMessages = messages;
  if (showOnlyStarred) {
    displayedMessages = displayedMessages.filter(m => m.isStarred);
  }
  if (chatSearchQuery.trim()) {
    displayedMessages = displayedMessages.filter(m => (m.content || '').toLowerCase().includes(chatSearchQuery.toLowerCase()));
  }

  return (
    <main className="flex-1 flex flex-col h-full bg-[#efe7fd] dark:bg-[#120a1b] relative overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-[64px] bg-[#f0f2f5] dark:bg-[#1c122c] px-4 flex items-center justify-between z-20 border-b border-slate-200 dark:border-purple-900/40 shrink-0 relative">
        <div
          className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
          onClick={() => {
            if (!isGroup) setShowContactInfo(true);
          }}
        >
          {/* Mobile back button */}
          {onBackToSidebar && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onBackToSidebar();
              }}
              className="md:hidden p-1.5 rounded-full hover:bg-slate-200 text-slate-600 mr-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <Avatar
            src={selectedContact.avatar}
            name={selectedContact.name}
            size="sm"
            isOnline={isGroup ? undefined : selectedContact.isRegistered}
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800 dark:text-purple-100 text-sm leading-tight group-hover:text-purple-600 transition-colors truncate">
                {selectedContact.name}
              </h3>
              {isGroup && (
                <span className="text-[10px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-semibold px-2 py-0.2 rounded-full shrink-0">
                  Grupo
                </span>
              )}
              {isPinned && <Pin className="w-3 h-3 text-purple-600 fill-current shrink-0" />}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] mt-0.5 truncate">
              {isGroup ? (
                <span className="text-slate-500 dark:text-purple-300/70 truncate">
                  {selectedGroup ? `${selectedGroup.members.length} miembros: ${selectedGroup.members.slice(0, 3).join(', ')}...` : 'Grupo'}
                </span>
              ) : (
                <>
                  <span className="font-mono text-slate-500 dark:text-purple-300/70">{selectedContact.phone}</span>
                  <span className="text-slate-300 dark:text-purple-800">•</span>
                  {isTyping ? (
                    <span className="text-purple-600 dark:text-purple-400 font-medium italic animate-pulse">escribiendo...</span>
                  ) : isBlocked ? (
                    <span className="text-red-500 font-medium">Bloqueado</span>
                  ) : selectedContact.isRegistered ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">En línea</span>
                  ) : (
                    <span className="text-slate-400 dark:text-purple-300/60">Guardado</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Call Buttons: High Quality Video & Voice Calls */}
        <div className="flex items-center gap-1 md:gap-2 text-slate-600 dark:text-purple-300 shrink-0">
          {!isGroup && (
            <>
              {/* Video Call Button */}
              <button
                type="button"
                onClick={() => startCall(selectedContact.phone, 'video')}
                disabled={isBlocked}
                className="p-2 rounded-full hover:bg-slate-200/70 dark:hover:bg-purple-900/50 hover:text-purple-600 transition-colors disabled:opacity-40"
                title="Videollamada HD"
              >
                <Video className="w-5 h-5" />
              </button>

              {/* Voice Call Button */}
              <button
                type="button"
                onClick={() => startCall(selectedContact.phone, 'voice')}
                disabled={isBlocked}
                className="p-2 rounded-full hover:bg-slate-200/70 dark:hover:bg-purple-900/50 hover:text-purple-600 transition-colors disabled:opacity-40"
                title="Llamada de voz HD"
              >
                <Phone className="w-5 h-5" />
              </button>

              <div className="w-[1px] h-6 bg-slate-300 dark:bg-purple-900/60 my-auto" />
            </>
          )}

          {/* Search inside chat */}
          <button
            type="button"
            onClick={() => setShowSearchInChat(!showSearchInChat)}
            className={`p-2 rounded-full hover:bg-slate-200/70 dark:hover:bg-purple-900/50 hover:text-purple-600 transition-colors ${
              showSearchInChat ? 'text-purple-600 bg-slate-200/70' : ''
            }`}
            title="Buscar en el chat"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Chat options menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full hover:bg-slate-200/70 dark:hover:bg-purple-900/50 hover:text-purple-600 transition-colors"
              title="Opciones del chat"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-10 w-52 bg-white dark:bg-[#1f1433] rounded-xl shadow-xl border border-slate-200 dark:border-purple-800/80 py-1.5 z-40 text-xs text-slate-700 dark:text-purple-100 animate-in fade-in"
                onMouseLeave={() => setShowMenu(false)}
              >
                {!isGroup && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowContactInfo(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/40 text-left transition-colors"
                  >
                    <Info className="w-4 h-4 text-purple-600" />
                    <span>Info. del contacto</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    togglePinChat(selectedContact.phone);
                    setShowMenu(false);
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/40 text-left transition-colors"
                >
                  <Pin className="w-4 h-4 text-purple-600" />
                  <span>{isPinned ? 'Desfijar chat' : 'Fijar chat'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowOnlyStarred(!showOnlyStarred);
                    setShowMenu(false);
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/40 text-left transition-colors"
                >
                  <Star className={`w-4 h-4 ${showOnlyStarred ? 'text-amber-500 fill-current' : 'text-purple-600'}`} />
                  <span>{showOnlyStarred ? 'Ver todos los mensajes' : 'Mensajes destacados'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('¿Vaciar todos los mensajes de este chat?')) {
                      clearChat(selectedContact.phone);
                    }
                    setShowMenu(false);
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/40 text-left transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-slate-500" />
                  <span>Vaciar mensajes</span>
                </button>

                {!isGroup && (
                  <>
                    <div className="border-t border-slate-100 dark:border-purple-900/40 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        if (isBlocked) {
                          unblockContact(selectedContact.phone);
                        } else {
                          if (confirm(`¿Bloquear a ${selectedContact.name}?`)) {
                            blockContact(selectedContact.phone);
                          }
                        }
                        setShowMenu(false);
                      }}
                      className="w-full px-3.5 py-2 flex items-center gap-2.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-left font-medium transition-colors"
                    >
                      <Ban className="w-4 h-4" />
                      <span>{isBlocked ? 'Desbloquear contacto' : 'Bloquear contacto'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`¿Estás seguro de que deseas eliminar a ${selectedContact.name} de tu agenda de contactos?`)) {
                          deleteContact(selectedContact.phone);
                          if (onBackToSidebar) onBackToSidebar();
                        }
                        setShowMenu(false);
                      }}
                      className="w-full px-3.5 py-2 flex items-center gap-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-left font-semibold transition-colors"
                    >
                      <UserMinus className="w-4 h-4" />
                      <span>Eliminar contacto</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search in Chat overlay input */}
      {showSearchInChat && (
        <div className="bg-[#f0f2f5] dark:bg-purple-950/90 px-4 py-2 border-b border-slate-200 dark:border-purple-800 flex items-center gap-2 animate-in fade-in slide-in-from-top duration-150 z-10">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={chatSearchQuery}
            onChange={(e) => setChatSearchQuery(e.target.value)}
            placeholder="Buscar palabras o frases en este chat..."
            className="flex-1 bg-white dark:bg-purple-900/50 px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-purple-800 outline-none text-slate-800 dark:text-purple-100"
            autoFocus
          />
          <button
            type="button"
            onClick={() => {
              setShowSearchInChat(false);
              setChatSearchQuery('');
            }}
            className="text-xs text-purple-600 dark:text-purple-300 font-semibold px-2 hover:underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Starred filter active banner */}
      {showOnlyStarred && (
        <div className="bg-amber-50 dark:bg-amber-950/80 px-4 py-2 border-b border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 fill-current text-amber-500" />
            <span>Mostrando solo mensajes destacados en esta conversación</span>
          </div>
          <button
            type="button"
            onClick={() => setShowOnlyStarred(false)}
            className="font-bold underline text-amber-700 hover:text-amber-900"
          >
            Ver todos
          </button>
        </div>
      )}

      {/* Main Messages Scrollable Canvas */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1 relative">
        {/* Subtle patterned wallpaper */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, #7c3aed 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />

        {/* WhatsApp End-to-End Encryption Banner */}
        <div className="flex justify-center my-2">
          <div className="bg-white/80 dark:bg-purple-950/80 backdrop-blur-xs text-slate-600 dark:text-purple-200 text-[11px] px-3.5 py-1.5 rounded-xl border border-white/60 dark:border-purple-800/50 flex items-center gap-2 shadow-xs text-center max-w-sm">
            <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>Mensajes cifrados de extremo a extremo en tiempo real.</span>
          </div>
        </div>

        {/* Messages List */}
        {displayedMessages.map((msg) => {
          const isSender = arePhonesMatching(msg.senderPhone, currentUser.phone);
          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isSender={isSender}
              onReply={handleReply}
              onReact={handleReact}
              onDelete={handleDelete}
              onStar={handleStar}
              onEdit={handleEdit}
              onForward={handleForward}
              onOpenMedia={handleOpenMedia}
            />
          );
        })}

        {/* Typing indicator bubble */}
        {isTyping && (
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#201533] p-2.5 rounded-r-xl rounded-bl-xl w-16 shadow-xs border border-slate-100 dark:border-purple-900/40 mb-1 animate-in fade-in">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Edit Message Inline Bar */}
      {editingMessage && (
        <div className="bg-purple-50 dark:bg-purple-950/80 p-2.5 border-t border-purple-200 dark:border-purple-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex-1 flex items-center gap-2">
            <span className="font-semibold text-purple-700 dark:text-purple-300 shrink-0">Editando mensaje:</span>
            <input
              type="text"
              defaultValue={editingMessage.content}
              id="edit-input-field"
              className="flex-1 bg-white dark:bg-purple-900/60 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-700 outline-none text-slate-800 dark:text-purple-100"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (document.getElementById('edit-input-field') as HTMLInputElement)?.value;
                  if (val) {
                    editMessage(editingMessage.id, val);
                    setEditingMessage(null);
                  }
                } else if (e.key === 'Escape') {
                  setEditingMessage(null);
                }
              }}
            />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                const val = (document.getElementById('edit-input-field') as HTMLInputElement)?.value;
                if (val) {
                  editMessage(editingMessage.id, val);
                  setEditingMessage(null);
                }
              }}
              className="p-1.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
              title="Guardar edición"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setEditingMessage(null)}
              className="p-1.5 rounded-full text-slate-500 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
              title="Cancelar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Blocked message indicator or WhatsApp Input Bar */}
      {isBlocked ? (
        <div className="p-3 bg-red-50 dark:bg-red-950/60 border-t border-red-200 dark:border-red-900 text-center text-xs text-red-600 dark:text-red-300 flex items-center justify-center gap-2">
          <span>Has bloqueado a este contacto. No puedes enviar ni recibir mensajes.</span>
          <button
            type="button"
            onClick={() => unblockContact(selectedContact.phone)}
            className="font-bold underline hover:text-red-800"
          >
            Desbloquear
          </button>
        </div>
      ) : (
        <InputBar
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
        />
      )}

      {/* Modals */}
      <ForwardModal
        isOpen={!!forwardingMessage}
        onClose={() => setForwardingMessage(null)}
        message={forwardingMessage}
      />

      <ContactInfoModal
        isOpen={showContactInfo}
        onClose={() => setShowContactInfo(false)}
        contact={selectedContact}
        onStartVoiceCall={() => startCall(selectedContact.phone, 'voice')}
        onStartVideoCall={() => startCall(selectedContact.phone, 'video')}
      />
    </main>
  );
};
