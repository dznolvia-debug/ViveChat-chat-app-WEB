import React, { useState } from 'react';
import { X, Search, Check, Send, Share2 } from 'lucide-react';
import { useChat, normalizePhone } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';
import { Message } from '../../types';

interface ForwardModalProps {
  isOpen?: boolean;
  message: Message | null;
  onClose: () => void;
}

export const ForwardModal: React.FC<ForwardModalProps> = ({ isOpen = true, message, onClose }) => {
  const { contacts, forwardMessage, currentUser } = useChat();
  const [selectedPhones, setSelectedPhones] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen || !message) return null;

  const filteredContacts = contacts.filter(c => {
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const toggleSelect = (phone: string) => {
    setSelectedPhones(prev =>
      prev.includes(phone) ? prev.filter(p => p !== phone) : [...prev, phone]
    );
  };

  const handleSend = () => {
    if (selectedPhones.length === 0 || !message) return;
    forwardMessage(message.id, selectedPhones);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1a1128] text-slate-800 dark:text-purple-100 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-purple-800/80 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-purple-900/40 flex items-center justify-between bg-slate-50 dark:bg-[#160d24]">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-base">Reenviar mensaje a...</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-purple-200 hover:bg-slate-200/50 dark:hover:bg-purple-900/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message preview snippet */}
        <div className="p-3 bg-purple-50/80 dark:bg-purple-950/40 border-b border-purple-100 dark:border-purple-900/30 text-xs text-slate-600 dark:text-purple-300">
          <span className="font-semibold block mb-0.5">Mensaje a reenviar:</span>
          <p className="truncate italic">
            {message.content || (message.type === 'image' ? '📷 Foto' : message.type === 'video' ? '🎥 Video' : '🎤 Nota de voz')}
          </p>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-100 dark:border-purple-900/30">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar contacto..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-[#231834] rounded-lg text-sm outline-none focus:ring-1 focus:ring-purple-500 border border-transparent"
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-purple-900/20 p-2">
          {filteredContacts.length > 0 ? (
            filteredContacts.map(c => {
              const isSelected = selectedPhones.includes(c.phone);
              return (
                <div
                  key={c.phone}
                  onClick={() => toggleSelect(c.phone)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-purple-100/70 dark:bg-purple-900/50'
                      : 'hover:bg-slate-50 dark:hover:bg-purple-950/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={c.avatar} name={c.name} size="sm" />
                    <div>
                      <h4 className="font-semibold text-sm">{c.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-purple-300/70 font-mono">{c.phone}</p>
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'border-slate-300 dark:border-purple-700'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-sm text-slate-400">
              No se encontraron contactos para reenviar.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-purple-900/40 bg-slate-50 dark:bg-[#160d24] flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-purple-300">
            {selectedPhones.length} {selectedPhones.length === 1 ? 'contacto seleccionado' : 'contactos seleccionados'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-purple-300 hover:bg-slate-200 dark:hover:bg-purple-900/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={selectedPhones.length === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white shadow-sm transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
