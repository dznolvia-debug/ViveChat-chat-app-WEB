import React from 'react';
import {
  X,
  Phone,
  Video,
  Pin,
  Trash2,
  Ban,
  ShieldCheck,
  Star,
  Image as ImageIcon,
  BellOff,
  UserMinus
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useCall } from '../../context/CallContext';
import { Avatar } from '../common/Avatar';
import { Contact, Message } from '../../types';

interface ContactInfoModalProps {
  isOpen?: boolean;
  contact: Contact | null;
  onClose: () => void;
  onStartVoiceCall?: () => void;
  onStartVideoCall?: () => void;
}

export const ContactInfoModal: React.FC<ContactInfoModalProps> = ({
  isOpen = true,
  contact,
  onClose,
  onStartVoiceCall,
  onStartVideoCall,
}) => {
  const {
    getChatMessages,
    isChatPinned,
    togglePinChat,
    isContactBlocked,
    blockContact,
    unblockContact,
    clearChat,
    deleteContact,
    openMediaViewer
  } = useChat();

  const { startCall } = useCall();

  if (!isOpen || !contact) return null;

  const isPinned = isChatPinned(contact.phone);
  const isBlocked = isContactBlocked(contact.phone);
  const messages = getChatMessages(contact.phone);

  const mediaMessages = messages.filter(m => (m.type === 'image' || m.type === 'video') && m.mediaUrl);
  const starredMessages = messages.filter(m => m.isStarred);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#191024] text-slate-800 dark:text-purple-100 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-purple-800/80 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-purple-900/40 flex items-center justify-between bg-slate-50 dark:bg-[#160d24]">
          <h3 className="font-semibold text-base">Info. del contacto</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-purple-200 hover:bg-slate-200/50 dark:hover:bg-purple-900/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center">
          {/* Avatar & Name */}
          <Avatar src={contact.avatar} name={contact.name} size="xl" className="shadow-lg mb-3 ring-4 ring-purple-100 dark:ring-purple-900/50" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-0.5 text-center">{contact.name}</h2>
          <p className="text-xs font-mono text-slate-500 dark:text-purple-300/80 mb-4">{contact.phone}</p>

          {/* Quick Call Actions */}
          <div className="flex items-center gap-6 mb-6">
            <button
              type="button"
              onClick={() => {
                onClose();
                startCall(contact.phone, 'voice');
              }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 transition-colors w-24"
            >
              <Phone className="w-5 h-5" />
              <span className="text-[11px] font-semibold">Llamar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                startCall(contact.phone, 'video');
              }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 transition-colors w-24"
            >
              <Video className="w-5 h-5" />
              <span className="text-[11px] font-semibold">Video</span>
            </button>
          </div>

          {/* Info Status / About */}
          <div className="w-full bg-slate-50 dark:bg-[#201533] p-3.5 rounded-xl mb-4 border border-slate-100 dark:border-purple-900/30">
            <span className="text-[11px] text-slate-400 dark:text-purple-400 font-semibold uppercase tracking-wider block mb-1">
              Info. y número de teléfono
            </span>
            <p className="text-sm text-slate-800 dark:text-purple-100 mb-1">{contact.about || '¡Hola! Estoy usando ViveChat 🟣'}</p>
            <p className="text-xs font-mono text-slate-500 dark:text-purple-300/70">{contact.phone}</p>
          </div>

          {/* Media, links and docs */}
          <div className="w-full bg-slate-50 dark:bg-[#201533] p-3.5 rounded-xl mb-4 border border-slate-100 dark:border-purple-900/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-slate-400 dark:text-purple-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Archivos y fotos compartidas ({mediaMessages.length})</span>
              </span>
            </div>

            {mediaMessages.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {mediaMessages.slice(0, 4).map((m) => (
                  <div
                    key={m.id}
                    onClick={() => openMediaViewer(m.mediaUrl!, m.type as any, m.content)}
                    className="aspect-square rounded-lg overflow-hidden bg-slate-200 dark:bg-purple-900/50 cursor-pointer hover:opacity-85 transition-opacity"
                  >
                    {m.type === 'image' ? (
                      <img src={m.mediaUrl} alt="media" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-black text-white">
                        <Video className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No hay fotos ni videos compartidos aún.</p>
            )}
          </div>

          {/* Encryption Info */}
          <div className="w-full bg-slate-50 dark:bg-[#201533] p-3.5 rounded-xl mb-4 border border-slate-100 dark:border-purple-900/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-slate-800 dark:text-purple-200">Cifrado de extremo a extremo</h4>
              <p className="text-[11px] text-slate-500 dark:text-purple-300/70 leading-relaxed">
                Los mensajes y las llamadas están protegidos con cifrado. Nadie fuera de este chat puede leerlos ni escucharlos.
              </p>
            </div>
          </div>

          {/* Action List */}
          <div className="w-full bg-slate-50 dark:bg-[#201533] rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-purple-900/30 border border-slate-100 dark:border-purple-900/30 text-xs font-medium">
            <button
              type="button"
              onClick={() => togglePinChat(contact.phone)}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-purple-900/30 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <Pin className="w-4 h-4 text-purple-600" />
                <span>{isPinned ? 'Desfijar chat' : 'Fijar chat al inicio'}</span>
              </div>
              {isPinned && <span className="text-[10px] bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-semibold">Fijado</span>}
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm('¿Deseas vaciar todos los mensajes de esta conversación?')) {
                  clearChat(contact.phone);
                  onClose();
                }
              }}
              className="w-full p-3.5 flex items-center gap-2.5 text-slate-700 dark:text-purple-200 hover:bg-slate-100 dark:hover:bg-purple-900/30 transition-colors text-left"
            >
              <Trash2 className="w-4 h-4 text-slate-500" />
              <span>Vaciar chat</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isBlocked) {
                  unblockContact(contact.phone);
                } else {
                  if (confirm(`¿Bloquear a ${contact.name}? No recibirás más mensajes ni llamadas de este número.`)) {
                    blockContact(contact.phone);
                  }
                }
              }}
              className="w-full p-3.5 flex items-center gap-2.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors text-left font-medium"
            >
              <Ban className="w-4 h-4" />
              <span>{isBlocked ? 'Desbloquear contacto' : 'Bloquear a ' + contact.name}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm(`¿Estás seguro de que deseas eliminar a ${contact.name} de tu agenda de contactos?`)) {
                  deleteContact(contact.phone);
                  onClose();
                }
              }}
              className="w-full p-3.5 flex items-center gap-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left font-semibold"
            >
              <UserMinus className="w-4 h-4" />
              <span>Eliminar contacto</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
