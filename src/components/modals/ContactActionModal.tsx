import React, { useState } from 'react';
import {
  Trash2,
  Ban,
  CheckCircle,
  MessageSquare,
  Phone,
  Video,
  X,
  AlertTriangle,
  UserX,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { Contact } from '../../types';

interface ContactActionModalProps {
  isOpen: boolean;
  contact: Contact | null;
  isBlocked: boolean;
  onClose: () => void;
  onDelete: (contactPhone: string) => void;
  onBlock: (contactPhone: string) => void;
  onUnblock: (contactPhone: string) => void;
  onStartChat: (contactPhone: string) => void;
  onVoiceCall: (contactPhone: string) => void;
  onVideoCall: (contactPhone: string) => void;
}

export const ContactActionModal: React.FC<ContactActionModalProps> = ({
  isOpen,
  contact,
  isBlocked,
  onClose,
  onDelete,
  onBlock,
  onUnblock,
  onStartChat,
  onVoiceCall,
  onVideoCall,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen || !contact) return null;

  const handleDeletePermanent = () => {
    onDelete(contact.phone);
    setConfirmDelete(false);
    onClose();
  };

  const handleToggleBlock = () => {
    if (isBlocked) {
      onUnblock(contact.phone);
    } else {
      onBlock(contact.phone);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div
        className="bg-white dark:bg-[#1a1128] w-full max-w-sm rounded-3xl shadow-2xl border border-purple-200 dark:border-purple-800/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 bg-gradient-to-r from-purple-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-200">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Opciones de contacto</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contact Info Card */}
        <div className="p-5 flex flex-col items-center text-center border-b border-purple-100 dark:border-purple-900/40">
          <Avatar
            src={contact.avatar}
            name={contact.name}
            size="xl"
            isOnline={contact.isRegistered}
            className="mb-3 ring-4 ring-purple-100 dark:ring-purple-900/60 shadow-md"
          />
          <h3 className="font-bold text-lg text-slate-900 dark:text-purple-100 leading-snug">
            {contact.name}
          </h3>
          <p className="font-mono text-xs text-purple-600 dark:text-purple-300 font-semibold mt-0.5">
            {contact.phone}
          </p>
          <p className="text-xs text-slate-500 dark:text-purple-300/70 mt-1 max-w-[240px] truncate">
            {contact.about || 'Contacto en ViveChat'}
          </p>

          {/* Quick Contact Action Icons */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-purple-100 dark:border-purple-900/40 w-full">
            <button
              type="button"
              onClick={() => {
                onStartChat(contact.phone);
                onClose();
              }}
              className="flex flex-col items-center gap-1 text-slate-700 dark:text-purple-200 hover:text-purple-600 dark:hover:text-purple-300 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-xs">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold">Mensaje</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onVoiceCall(contact.phone);
                onClose();
              }}
              disabled={isBlocked}
              className="flex flex-col items-center gap-1 text-slate-700 dark:text-purple-200 hover:text-purple-600 dark:hover:text-purple-300 transition-colors group disabled:opacity-40"
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-xs">
                <Phone className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold">Llamar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onVideoCall(contact.phone);
                onClose();
              }}
              disabled={isBlocked}
              className="flex flex-col items-center gap-1 text-slate-700 dark:text-purple-200 hover:text-purple-600 dark:hover:text-purple-300 transition-colors group disabled:opacity-40"
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-xs">
                <Video className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold">Video</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Alert Banner */}
        {confirmDelete ? (
          <div className="p-4 bg-red-50 dark:bg-red-950/60 flex flex-col gap-3 animate-in fade-in">
            <div className="flex items-start gap-2.5 text-red-700 dark:text-red-300">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold">¿Eliminar contacto permanentemente?</p>
                <p className="mt-0.5 text-red-600 dark:text-red-300/80">
                  Se borrará a &ldquo;{contact.name}&rdquo; de tu lista y del servidor de forma definitiva.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-purple-900/40 border border-red-200 dark:border-red-800 text-slate-700 dark:text-purple-200 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeletePermanent}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, eliminar</span>
              </button>
            </div>
          </div>
        ) : (
          /* Main Action Buttons */
          <div className="p-3 flex flex-col gap-1.5">
            {/* Block / Unblock Button */}
            <button
              type="button"
              onClick={handleToggleBlock}
              className={`w-full py-3 px-4 rounded-2xl flex items-center gap-3 text-xs font-semibold transition-colors text-left ${
                isBlocked
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50'
              }`}
            >
              {isBlocked ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="block font-bold">Desbloquear contacto</span>
                    <span className="text-[10px] text-emerald-600/80 font-normal">
                      Permitir mensajes y llamadas de este número
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4 text-amber-600" />
                  <div>
                    <span className="block font-bold">Bloquear contacto</span>
                    <span className="text-[10px] text-amber-600/80 font-normal">
                      No recibirás mensajes ni llamadas de este usuario
                    </span>
                  </div>
                </>
              )}
            </button>

            {/* Permanent Delete Button */}
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full py-3 px-4 rounded-2xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 flex items-center gap-3 text-xs font-semibold transition-colors text-left"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
              <div>
                <span className="block font-bold">Eliminar contacto permanentemente</span>
                <span className="text-[10px] text-red-500/80 font-normal">
                  Remover de tu agenda telefónica y base de datos
                </span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
