import React, { useState } from 'react';
import {
  UserPlus,
  Search,
  Phone,
  MessageSquare,
  Video,
  Sparkles,
  MoreVertical,
  BookUser,
  ShieldAlert,
  Users,
  CheckSquare,
  Square,
  Check,
  X
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useCall } from '../../context/CallContext';
import { Avatar } from '../common/Avatar';
import { NewChatModal } from '../modals/NewChatModal';
import { ContactActionModal } from '../modals/ContactActionModal';
import { CreateGroupModal } from '../modals/CreateGroupModal';
import { arePhonesMatching } from '../../utils/phoneMatcher';
import { useLongPress } from '../../hooks/useLongPress';
import { Contact } from '../../types';

interface ContactRowProps {
  contact: Contact;
  isBlocked: boolean;
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (phone: string) => void;
  onOpenActions: (contact: Contact) => void;
  onStartChat: (phone: string) => void;
  onVoiceCall: (phone: string) => void;
  onVideoCall: (phone: string) => void;
}

const ContactRowComponent: React.FC<ContactRowProps> = ({
  contact,
  isBlocked,
  isSelectionMode,
  isSelected,
  onToggleSelect,
  onOpenActions,
  onStartChat,
  onVoiceCall,
  onVideoCall,
}) => {
  const longPressProps = useLongPress(() => {
    if (isSelectionMode) {
      onToggleSelect(contact.phone);
    } else {
      onOpenActions(contact);
    }
  });

  return (
    <div
      {...longPressProps}
      onClick={() => {
        if (isSelectionMode) {
          onToggleSelect(contact.phone);
        } else {
          onStartChat(contact.phone);
        }
      }}
      className={`flex items-center justify-between p-3 hover:bg-purple-50/70 dark:hover:bg-purple-900/30 rounded-2xl transition-all cursor-pointer group select-none ${
        isSelected ? 'bg-purple-100/70 dark:bg-purple-950/80 ring-2 ring-purple-500/50' : ''
      } ${isBlocked ? 'opacity-70 bg-red-50/30 dark:bg-red-950/20' : ''}`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Selection Checkbox */}
        {isSelectionMode && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(contact.phone);
            }}
            className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
              isSelected
                ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                : 'border-slate-300 dark:border-purple-800 bg-white dark:bg-purple-950/50'
            }`}
          >
            {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
          </div>
        )}

        <Avatar src={contact.avatar} name={contact.name} size="md" isOnline={contact.isRegistered} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm text-slate-800 dark:text-purple-100 truncate group-hover:text-purple-600 transition-colors">
              {contact.name}
            </h4>
            {contact.isRegistered && (
              <span className="text-[10px] bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-semibold px-2 py-0.5 rounded-full">
                En ViveChat
              </span>
            )}
            {isBlocked && (
              <span className="text-[10px] bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-300 font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <ShieldAlert className="w-3 h-3" />
                Bloqueado
              </span>
            )}
          </div>
          <p className="text-xs font-mono text-purple-600 dark:text-purple-300">
            {contact.phone}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-purple-400/70 truncate mt-0.5">
            {contact.about || 'Disponible en ViveChat'}
          </p>
        </div>
      </div>

      {/* Action shortcuts (Hidden in selection mode to avoid accidental clicks) */}
      {!isSelectionMode && (
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onStartChat(contact.phone)}
            className="p-2 rounded-full text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors"
            title="Enviar mensaje"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onVoiceCall(contact.phone)}
            disabled={isBlocked}
            className="p-2 rounded-full text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors disabled:opacity-40"
            title="Llamada de voz"
          >
            <Phone className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onVideoCall(contact.phone)}
            disabled={isBlocked}
            className="p-2 rounded-full text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors disabled:opacity-40"
            title="Videollamada"
          >
            <Video className="w-4 h-4" />
          </button>

          {/* 3-dots button for quick access to actions */}
          <button
            type="button"
            onClick={() => onOpenActions(contact)}
            className="p-2 rounded-full text-slate-400 hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors ml-0.5"
            title="Opciones de contacto"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

const ContactRow = React.memo(ContactRowComponent, (prev, next) => {
  return (
    prev.isBlocked === next.isBlocked &&
    prev.isSelectionMode === next.isSelectionMode &&
    prev.isSelected === next.isSelected &&
    prev.contact.phone === next.contact.phone &&
    prev.contact.name === next.contact.name &&
    prev.contact.avatar === next.contact.avatar &&
    prev.contact.about === next.contact.about &&
    prev.contact.isRegistered === next.contact.isRegistered &&
    prev.onToggleSelect === next.onToggleSelect &&
    prev.onOpenActions === next.onOpenActions &&
    prev.onStartChat === next.onStartChat &&
    prev.onVoiceCall === next.onVoiceCall &&
    prev.onVideoCall === next.onVideoCall
  );
});

export const ContactsTab: React.FC = () => {
  const {
    currentUser,
    contacts,
    selectChatByPhone,
    setActiveTab,
    deleteContact,
    blockContact,
    unblockContact,
    isContactBlocked
  } = useChat();

  const { startCall } = useCall();
  const [search, setSearch] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [activeContactModal, setActiveContactModal] = useState<Contact | null>(null);
  
  // Multi-selection state for creating groups
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPhones, setSelectedPhones] = useState<string[]>([]);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);

  const filteredContacts = contacts.filter(
    c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const handleStartChat = (phone: string) => {
    selectChatByPhone(phone);
    setActiveTab('chats');
  };

  const handleToggleSelect = (phone: string) => {
    setSelectedPhones(prev => {
      if (prev.includes(phone)) {
        return prev.filter(p => p !== phone);
      } else {
        return [...prev, phone];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedPhones.length === contacts.length) {
      setSelectedPhones([]);
    } else {
      setSelectedPhones(contacts.map(c => c.phone));
    }
  };

  const handleOpenCreateGroupFromSelection = () => {
    setIsCreateGroupOpen(true);
    setShowOptionsDropdown(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
      {/* Header with 3-Dots Menu and Selection Mode Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-purple-100 flex items-center gap-2">
            <span>Agenda de Contactos</span>
            {isSelectionMode && (
              <span className="text-xs bg-purple-600 text-white font-bold px-2 py-0.5 rounded-full">
                {selectedPhones.length} seleccionados
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 dark:text-purple-300/70">
            {contacts.length} {contacts.length === 1 ? 'contacto guardado' : 'contactos guardados'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 relative">
          {isSelectionMode ? (
            <button
              type="button"
              onClick={() => {
                setIsSelectionMode(false);
                setSelectedPhones([]);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-purple-900/60 text-slate-700 dark:text-purple-200 text-xs font-semibold hover:bg-slate-300 transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancelar</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsNewChatOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Nuevo</span>
              </button>

              {/* Top 3-Dots Menu Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-purple-900/40 hover:bg-slate-200 dark:hover:bg-purple-900/80 text-slate-600 dark:text-purple-200 transition-colors"
                  title="Opciones de contactos"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showOptionsDropdown && (
                  <div
                    className="absolute right-0 top-9 w-48 bg-white dark:bg-[#1f1433] rounded-2xl shadow-2xl border border-slate-200 dark:border-purple-800/80 py-1.5 z-30 text-xs text-slate-700 dark:text-purple-100 animate-in fade-in zoom-in-95"
                    onMouseLeave={() => setShowOptionsDropdown(false)}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsSelectionMode(true);
                        setShowOptionsDropdown(false);
                      }}
                      className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/40 text-left transition-colors"
                    >
                      <CheckSquare className="w-4 h-4 text-purple-600" />
                      <span>Seleccionar contactos</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateGroupOpen(true);
                        setShowOptionsDropdown(false);
                      }}
                      className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/40 text-left transition-colors font-semibold text-purple-600 dark:text-purple-300"
                    >
                      <Users className="w-4 h-4" />
                      <span>Crear grupo</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating / Sticky Bar when Selection Mode is Active */}
      {isSelectionMode && (
        <div className="bg-purple-50 dark:bg-purple-950/70 p-3 rounded-2xl border border-purple-200 dark:border-purple-800 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs font-semibold text-purple-700 dark:text-purple-300 hover:underline flex items-center gap-1.5"
          >
            {selectedPhones.length === contacts.length ? (
              <>
                <CheckSquare className="w-4 h-4" />
                <span>Desmarcar todos</span>
              </>
            ) : (
              <>
                <Square className="w-4 h-4" />
                <span>Seleccionar todos</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenCreateGroupFromSelection}
            disabled={selectedPhones.length < 2}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:hover:bg-purple-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>Crear grupo ({selectedPhones.length})</span>
          </button>
        </div>
      )}

      {/* Search box */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar contacto por nombre o teléfono..."
          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-[#1f1530] rounded-xl text-sm border border-slate-200 dark:border-purple-800/60 focus:border-purple-500 outline-none text-slate-900 dark:text-purple-100 placeholder-slate-400 shadow-xs"
        />
      </div>

      {/* Tip Banner */}
      {!isSelectionMode && contacts.length > 0 && (
        <div className="text-[11px] text-purple-700 dark:text-purple-300/80 bg-purple-50/80 dark:bg-purple-950/40 p-2 rounded-xl border border-purple-200/60 dark:border-purple-900/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>Selecciona contactos y pulsa &ldquo;Crear grupo&rdquo; para chatear con varias personas.</span>
          </div>
          <button
            type="button"
            onClick={() => setIsSelectionMode(true)}
            className="text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:underline shrink-0 ml-2"
          >
            Seleccionar
          </button>
        </div>
      )}

      {/* Saved Contacts List */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
            <BookUser className="w-3.5 h-3.5" />
            Mis Contactos ({filteredContacts.length})
          </span>
        </div>

        <div className="flex flex-col divide-y divide-slate-100 dark:divide-purple-900/40 bg-white dark:bg-[#1c122c] rounded-3xl p-2 border border-slate-200/80 dark:border-purple-800/50 shadow-sm">
          {filteredContacts.length > 0 ? (
            filteredContacts.map((c) => (
              <ContactRow
                key={c.id || c.phone}
                contact={c}
                isBlocked={isContactBlocked(c.phone)}
                isSelectionMode={isSelectionMode}
                isSelected={selectedPhones.includes(c.phone)}
                onToggleSelect={handleToggleSelect}
                onOpenActions={(contact) => setActiveContactModal(contact)}
                onStartChat={handleStartChat}
                onVoiceCall={(phone) => startCall(phone, 'voice')}
                onVideoCall={(phone) => startCall(phone, 'video')}
              />
            ))
          ) : (
            <div className="text-center py-10 px-4 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 shadow-inner">
                <BookUser className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-purple-100 text-sm">
                  {search ? 'No se encontraron contactos' : 'No tienes contactos guardados todavía'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-purple-300/70 mt-1 max-w-xs">
                  {search
                    ? 'Intenta con otro término de búsqueda o agrega un nuevo número.'
                    : 'Agrega a tus amigos y familiares con su número telefónico para chatear y realizar llamadas.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewChatOpen(true)}
                className="mt-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Agregar nuevo contacto</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <NewChatModal isOpen={isNewChatOpen} onClose={() => setIsNewChatOpen(false)} />

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => {
          setIsCreateGroupOpen(false);
          setIsSelectionMode(false);
          setSelectedPhones([]);
        }}
        preSelectedPhones={selectedPhones}
      />

      <ContactActionModal
        isOpen={!!activeContactModal}
        contact={activeContactModal}
        isBlocked={activeContactModal ? isContactBlocked(activeContactModal.phone) : false}
        onClose={() => setActiveContactModal(null)}
        onDelete={(phone) => deleteContact(phone)}
        onBlock={(phone) => blockContact(phone)}
        onUnblock={(phone) => unblockContact(phone)}
        onStartChat={handleStartChat}
        onVoiceCall={(phone) => startCall(phone, 'voice')}
        onVideoCall={(phone) => startCall(phone, 'video')}
      />
    </div>
  );
};
