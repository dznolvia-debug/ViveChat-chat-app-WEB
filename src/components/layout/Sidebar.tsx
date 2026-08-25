import React, { useState } from 'react';
import {
  MessageSquare,
  CircleDot,
  Phone,
  Users,
  Settings,
  Search,
  UserPlus,
  ArrowRightLeft,
  CheckCheck,
  Check,
  Mic,
  Image as ImageIcon,
  Video as VideoIcon,
  Pin,
  Sparkles,
  MoreVertical,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useCall } from '../../context/CallContext';
import { arePhonesMatching, normalizePhone } from '../../utils/phoneMatcher';
import { Avatar } from '../common/Avatar';
import { Message, Contact, Group } from '../../types';
import { StatusTab } from '../tabs/StatusTab';
import { CallsTab } from '../tabs/CallsTab';
import { ContactsTab } from '../tabs/ContactsTab';
import { SettingsTab } from '../tabs/SettingsTab';
import { NewChatModal } from '../modals/NewChatModal';
import { ProfileModal } from '../modals/ProfileModal';
import { SwitchUserModal } from '../modals/SwitchUserModal';
import { ContactActionModal } from '../modals/ContactActionModal';
import { CreateGroupModal } from '../modals/CreateGroupModal';
import { useLongPress } from '../../hooks/useLongPress';

interface ChatRowProps {
  item: {
    contact: Contact;
    lastMsg?: Message;
    unread: number;
    lastTime: number;
    isGroup?: boolean;
    group?: Group;
  };
  isSelected: boolean;
  isPinned: boolean;
  isBlocked: boolean;
  isTyping: boolean;
  currentUserPhone: string;
  onSelect: () => void;
  onOpenActions: (contact: Contact) => void;
}

const ChatRowComponent: React.FC<ChatRowProps> = ({
  item,
  isSelected,
  isPinned,
  isBlocked,
  isTyping,
  currentUserPhone,
  onSelect,
  onOpenActions,
}) => {
  const longPressProps = useLongPress(() => {
    if (!item.isGroup) {
      onOpenActions(item.contact);
    }
  });

  const formatMsgTime = (ts?: number) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderLastMessagePreview = () => {
    if (isTyping) {
      return (
        <span className="text-purple-600 dark:text-purple-400 font-semibold italic animate-pulse">
          escribiendo...
        </span>
      );
    }

    const msg = item.lastMsg;
    if (!msg) {
      return <span className="text-slate-400 dark:text-purple-300/60">Toca para chatear</span>;
    }

    const isMe = arePhonesMatching(msg.senderPhone, currentUserPhone);

    return (
      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-purple-300/80 truncate">
        {isMe && (
          <span>
            {msg.status === 'read' ? (
              <CheckCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 font-bold inline" />
            ) : (
              <Check className="w-3.5 h-3.5 text-slate-400 inline" />
            )}
          </span>
        )}
        {item.isGroup && !isMe && msg.senderName && (
          <span className="font-semibold text-purple-700 dark:text-purple-300">
            {msg.senderName}:
          </span>
        )}
        {msg.type === 'image' && (
          <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Foto</span>
          </span>
        )}
        {msg.type === 'video' && (
          <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
            <VideoIcon className="w-3.5 h-3.5" />
            <span>Video</span>
          </span>
        )}
        {msg.type === 'audio' && (
          <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
            <Mic className="w-3.5 h-3.5" />
            <span>Nota de voz</span>
          </span>
        )}
        {msg.type === 'text' && <span className="truncate">{msg.content}</span>}
      </div>
    );
  };

  return (
    <div
      {...longPressProps}
      onClick={() => onSelect()}
      className={`flex items-center gap-3 p-3 cursor-pointer transition-colors relative border-b border-slate-100 dark:border-purple-900/20 select-none group ${
        isSelected
          ? 'bg-purple-50 dark:bg-purple-950/60'
          : 'hover:bg-slate-50 dark:hover:bg-[#201533]'
      } ${isBlocked ? 'opacity-70 bg-red-50/20' : ''}`}
    >
      <Avatar
        src={item.contact.avatar}
        name={item.contact.name}
        size="md"
        isOnline={item.isGroup ? undefined : item.contact.isRegistered}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 truncate">
            <h3 className="font-semibold text-sm text-slate-800 dark:text-purple-100 truncate group-hover:text-purple-600 transition-colors">
              {item.contact.name}
            </h3>
            {item.isGroup && (
              <span className="text-[10px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-semibold px-1.5 py-0.2 rounded-full shrink-0">
                Grupo
              </span>
            )}
            {isPinned && <Pin className="w-3 h-3 text-purple-600 fill-current shrink-0" />}
          </div>
          <span
            className={`text-[11px] shrink-0 ml-1 ${
              item.unread > 0 || isSelected
                ? 'text-purple-600 dark:text-purple-400 font-medium'
                : 'text-slate-400 dark:text-purple-300/60'
            }`}
          >
            {formatMsgTime(item.lastMsg?.timestamp || item.lastTime)}
          </span>
        </div>

        <div className="flex items-center justify-between mt-0.5">
          <div className="min-w-0 flex-1 mr-2">{renderLastMessagePreview()}</div>
          {item.unread > 0 && (
            <span className="min-w-[18px] h-[18px] bg-purple-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center px-1 shadow-xs shrink-0">
              {item.unread}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const ChatRow = React.memo(ChatRowComponent, (prev, next) => {
  return (
    prev.isSelected === next.isSelected &&
    prev.isPinned === next.isPinned &&
    prev.isBlocked === next.isBlocked &&
    prev.isTyping === next.isTyping &&
    prev.item.contact.id === next.item.contact.id &&
    prev.item.contact.name === next.item.contact.name &&
    prev.item.contact.avatar === next.item.contact.avatar &&
    prev.item.contact.isRegistered === next.item.contact.isRegistered &&
    prev.item.unread === next.item.unread &&
    prev.item.lastTime === next.item.lastTime &&
    prev.item.lastMsg?.id === next.item.lastMsg?.id &&
    prev.item.lastMsg?.content === next.item.lastMsg?.content &&
    prev.item.lastMsg?.status === next.item.lastMsg?.status &&
    prev.currentUserPhone === next.currentUserPhone &&
    prev.onSelect === next.onSelect &&
    prev.onOpenActions === next.onOpenActions
  );
});

export const Sidebar: React.FC = () => {
  const {
    currentUser,
    allUsers,
    contacts,
    groups,
    messages,
    activeTab,
    selectedContactPhone,
    typingUsers,
    isChatPinned,
    isContactBlocked,
    setActiveTab,
    selectChatByPhone,
    selectGroupById,
    getUnreadCountForPhone,
    deleteContact,
    blockContact,
    unblockContact,
  } = useChat();

  const { startCall } = useCall();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'media'>('all');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSwitchUserOpen, setIsSwitchUserOpen] = useState(false);
  const [activeActionContact, setActiveActionContact] = useState<Contact | null>(null);

  // Group messages, direct chats, and active group chats
  const chatList = React.useMemo(() => {
    const contactMap = new Map<string, { contact: Contact; lastMsg?: Message; unread: number; lastTime: number; isGroup?: boolean; group?: Group }>();

    // 1. Add All Groups where currentUser is a member
    groups.forEach(g => {
      if (g.members.some(m => arePhonesMatching(m, currentUser.phone))) {
        const groupMsgs = messages.filter(m => m.groupId === g.id || m.receiverPhone === g.id);
        const lastMsg = groupMsgs.length > 0 ? groupMsgs[groupMsgs.length - 1] : undefined;
        const unread = getUnreadCountForPhone(g.id);

        contactMap.set(g.id, {
          contact: {
            id: g.id,
            userId: '',
            name: g.name,
            phone: g.id,
            avatar: g.avatar,
            about: g.description || `${g.members.length} miembros`,
            isRegistered: true,
          },
          lastMsg,
          unread,
          lastTime: lastMsg ? lastMsg.timestamp : g.createdAt,
          isGroup: true,
          group: g,
        });
      }
    });

    // 2. Scan direct messages to identify 1:1 active conversations
    messages.forEach(m => {
      if (m.isGroup || m.groupId) return;

      const isFromMe = arePhonesMatching(m.senderPhone, currentUser.phone);
      const isToMe = arePhonesMatching(m.receiverPhone, currentUser.phone);

      if (!isFromMe && !isToMe) return;

      const otherPhone = isFromMe ? m.receiverPhone : m.senderPhone;
      if (!otherPhone) return;

      let matchedKey = otherPhone;
      for (const key of contactMap.keys()) {
        if (arePhonesMatching(key, otherPhone)) {
          matchedKey = key;
          break;
        }
      }

      // Find saved contact or registered user info
      const savedContact = contacts.find(c => arePhonesMatching(c.phone, otherPhone));
      const registeredUser = allUsers.find(u => arePhonesMatching(u.phone, otherPhone));

      const contactObj: Contact = savedContact || {
        id: registeredUser?.id || 'c_' + otherPhone,
        userId: registeredUser?.id || '',
        name: registeredUser?.name || otherPhone,
        phone: otherPhone,
        avatar: registeredUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        about: registeredUser?.about || 'Contacto',
        isRegistered: !!registeredUser,
      };

      const existing = contactMap.get(matchedKey);
      if (!existing || !existing.lastMsg || m.timestamp > existing.lastMsg.timestamp) {
        contactMap.set(matchedKey, {
          contact: contactObj,
          lastMsg: m,
          unread: getUnreadCountForPhone(contactObj.phone),
          lastTime: m.timestamp,
        });
      }
    });

    // 3. If a contact was explicitly selected by phone, ensure it's in the list
    if (selectedContactPhone && !selectedContactPhone.startsWith('group_') && !arePhonesMatching(selectedContactPhone, currentUser.phone)) {
      let alreadyInList = false;
      for (const key of contactMap.keys()) {
        if (arePhonesMatching(key, selectedContactPhone)) {
          alreadyInList = true;
          break;
        }
      }
      if (!alreadyInList) {
        const savedContact = contacts.find(c => arePhonesMatching(c.phone, selectedContactPhone));
        const registeredUser = allUsers.find(u => arePhonesMatching(u.phone, selectedContactPhone));
        const contactObj: Contact = savedContact || {
          id: registeredUser?.id || 'c_' + selectedContactPhone,
          userId: registeredUser?.id || '',
          name: registeredUser?.name || selectedContactPhone,
          phone: selectedContactPhone,
          avatar: registeredUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          about: registeredUser?.about || 'Contacto',
          isRegistered: !!registeredUser,
        };
        contactMap.set(selectedContactPhone, {
          contact: contactObj,
          unread: 0,
          lastTime: Date.now(),
        });
      }
    }

    // Convert map to array and apply search & filters
    return Array.from(contactMap.values())
      .filter(item => {
        if (!item.contact) return false;
        const matchesSearch =
          item.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.contact.phone.includes(searchQuery);
        if (!matchesSearch) return false;

        if (filterType === 'unread') return item.unread > 0;
        if (filterType === 'media') return item.lastMsg && (item.lastMsg.type === 'image' || item.lastMsg.type === 'video');
        return true;
      })
      .sort((a, b) => {
        const isPinnedA = isChatPinned(a.contact.phone);
        const isPinnedB = isChatPinned(b.contact.phone);
        if (isPinnedA && !isPinnedB) return -1;
        if (!isPinnedA && isPinnedB) return 1;
        return b.lastTime - a.lastTime;
      });
  }, [allUsers, contacts, currentUser.phone, filterType, getUnreadCountForPhone, groups, isChatPinned, messages, searchQuery, selectedContactPhone]);

  const totalUnreadAllChats = chatList.reduce((acc, curr) => acc + curr.unread, 0);

  return (
    <aside className="w-full h-full flex flex-col bg-white dark:bg-[#191024] select-none">
      {/* Top Header */}
      <header className="h-[64px] bg-[#f0f2f5] dark:bg-[#1c122c] px-4 flex items-center justify-between border-b border-slate-200 dark:border-purple-900/40 z-10 shrink-0">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setIsProfileOpen(true)}
          title="Ver y editar mi perfil"
        >
          <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" isOnline />
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-800 dark:text-purple-100 text-sm tracking-tight truncate max-w-[130px] group-hover:text-purple-600 transition-colors">
              {currentUser.name}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-purple-300/80 font-mono leading-none">
              {currentUser.phone}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 text-slate-600 dark:text-purple-300">
          <button
            type="button"
            onClick={() => setIsCreateGroupOpen(true)}
            className="p-2 rounded-full hover:bg-slate-200/80 dark:hover:bg-purple-900/50 transition-colors"
            title="Crear grupo nuevo"
          >
            <Users className="w-5 h-5 text-purple-600 dark:text-purple-300" />
          </button>

          <button
            type="button"
            onClick={() => setIsNewChatOpen(true)}
            className="p-2 rounded-full hover:bg-slate-200/80 dark:hover:bg-purple-900/50 transition-colors"
            title="Nuevo mensaje / Agregar contacto"
          >
            <UserPlus className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setIsSwitchUserOpen(true)}
            className="p-2 rounded-full hover:bg-slate-200/80 dark:hover:bg-purple-900/50 transition-colors"
            title="Cambiar de usuario"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex items-center justify-around px-2 py-2 bg-[#f0f2f5] dark:bg-[#1c122c] border-b border-slate-200 dark:border-purple-900/30 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('chats')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'chats'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-purple-300 hover:bg-slate-200/60 dark:hover:bg-purple-900/40'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chats</span>
          {totalUnreadAllChats > 0 && (
            <span className="w-4 h-4 rounded-full bg-pink-500 text-white text-[10px] flex items-center justify-center font-bold">
              {totalUnreadAllChats}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('status')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'status'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-purple-300 hover:bg-slate-200/60 dark:hover:bg-purple-900/40'
          }`}
        >
          <CircleDot className="w-3.5 h-3.5" />
          <span>Estados</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calls')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'calls'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-purple-300 hover:bg-slate-200/60 dark:hover:bg-purple-900/40'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Llamadas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contacts')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'contacts'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-purple-300 hover:bg-slate-200/60 dark:hover:bg-purple-900/40'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Contactos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'settings'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-purple-300 hover:bg-slate-200/60 dark:hover:bg-purple-900/40'
          }`}
          title="Ajustes"
        >
          <Settings className="w-4 h-4" />
        </button>
      </nav>

      {/* Tab Panels */}
      {activeTab === 'chats' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search & Filter Bar */}
          <div className="p-2 bg-white dark:bg-[#191024] border-b border-slate-100 dark:border-purple-900/40 flex flex-col gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar conversación por número o nombre"
                className="w-full bg-[#f0f2f5] dark:bg-[#231834] py-2 pl-9 pr-4 rounded-lg text-sm text-slate-800 dark:text-purple-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-transparent"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 text-xs font-medium px-0.5">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-0.5 rounded-full transition-colors ${
                  filterType === 'all'
                    ? 'bg-purple-100 dark:bg-purple-900/80 text-purple-700 dark:text-purple-300 font-semibold'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-purple-900/30'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFilterType('unread')}
                className={`px-2.5 py-0.5 rounded-full transition-colors ${
                  filterType === 'unread'
                    ? 'bg-purple-100 dark:bg-purple-900/80 text-purple-700 dark:text-purple-300 font-semibold'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-purple-900/30'
                }`}
              >
                No leídos
              </button>
              <button
                type="button"
                onClick={() => setFilterType('media')}
                className={`px-2.5 py-0.5 rounded-full transition-colors ${
                  filterType === 'media'
                    ? 'bg-purple-100 dark:bg-purple-900/80 text-purple-700 dark:text-purple-300 font-semibold'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-purple-900/30'
                }`}
              >
                Fotos / Videos
              </button>
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-purple-900/20">
            {chatList.length > 0 ? (
              chatList.map((item) => {
                const isSelected = !!(
                  selectedContactPhone &&
                  (item.isGroup
                    ? selectedContactPhone === item.contact.phone
                    : normalizePhone(selectedContactPhone) === normalizePhone(item.contact.phone))
                );
                const isPinned = isChatPinned(item.contact.phone);
                const isBlocked = !item.isGroup && isContactBlocked(item.contact.phone);
                const isTyping = !item.isGroup && !!typingUsers[item.contact.phone];

                return (
                  <ChatRow
                    key={item.contact.phone}
                    item={item}
                    isSelected={isSelected}
                    isPinned={isPinned}
                    isBlocked={isBlocked}
                    isTyping={isTyping}
                    currentUserPhone={currentUser.phone}
                    onSelect={() => {
                      if (item.isGroup) {
                        selectGroupById(item.contact.phone);
                      } else {
                        selectChatByPhone(item.contact.phone);
                      }
                    }}
                    onOpenActions={(contact) => setActiveActionContact(contact)}
                  />
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 dark:text-purple-300 flex flex-col items-center gap-3 my-auto">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 shadow-inner">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-purple-100 text-sm">
                    No tienes conversaciones aún
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-purple-300/70 mt-1 max-w-xs">
                    Tu aplicación está lista y limpia. Agrega un contacto o crea un grupo para chatear con varias personas.
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewChatOpen(true)}
                    className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 shadow-md transition-all flex items-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Iniciar chat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateGroupOpen(true)}
                    className="px-4 py-2 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-200 text-xs font-semibold hover:bg-purple-200 shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Users className="w-4 h-4" />
                    <span>Crear grupo</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'status' && <StatusTab />}
      {activeTab === 'calls' && <CallsTab />}
      {activeTab === 'contacts' && <ContactsTab />}
      {activeTab === 'settings' && (
        <SettingsTab
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenSwitchUser={() => setIsSwitchUserOpen(true)}
        />
      )}

      {/* Modals */}
      <NewChatModal isOpen={isNewChatOpen} onClose={() => setIsNewChatOpen(false)} />
      <CreateGroupModal isOpen={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <SwitchUserModal isOpen={isSwitchUserOpen} onClose={() => setIsSwitchUserOpen(false)} />

      <ContactActionModal
        isOpen={!!activeActionContact}
        contact={activeActionContact}
        isBlocked={activeActionContact ? isContactBlocked(activeActionContact.phone) : false}
        onClose={() => setActiveActionContact(null)}
        onDelete={(phone) => deleteContact(phone)}
        onBlock={(phone) => blockContact(phone)}
        onUnblock={(phone) => unblockContact(phone)}
        onStartChat={(phone) => {
          selectChatByPhone(phone);
          setActiveTab('chats');
        }}
        onVoiceCall={(phone) => startCall(phone, 'voice')}
        onVideoCall={(phone) => startCall(phone, 'video')}
      />
    </aside>
  );
};
