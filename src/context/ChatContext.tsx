import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, Contact, Message, StatusItem, CallRecord, TabType, MessageType, Group } from '../types';
import { storage, broadcastEvent, subscribeToBroadcast, AppSettings } from '../utils/storage';
import { apiClient } from '../utils/apiClient';
import { firestoreService } from '../utils/firebase';
import { sounds } from '../utils/soundEffects';
import { arePhonesMatching, normalizePhone, cleanPhoneDigits } from '../utils/phoneMatcher';

interface ChatContextType {
  currentUser: User;
  allUsers: User[];
  contacts: Contact[];
  groups: Group[];
  messages: Message[];
  statuses: StatusItem[];
  calls: CallRecord[];
  activeTab: TabType;
  selectedContactPhone: string | null;
  selectedContact: Contact | null;
  selectedGroup: Group | null;
  settings: AppSettings;
  typingUsers: Record<string, boolean>; // phone -> boolean
  mediaViewerData: { isOpen: boolean; url: string; type: 'image' | 'video'; title?: string } | null;
  pinnedPhones: string[];
  blockedPhones: string[];
  isRegistered: boolean;
  
  // Actions
  setActiveTab: (tab: TabType) => void;
  selectChatByPhone: (phone: string) => void;
  selectGroupById: (groupId: string) => void;
  createGroupChat: (name: string, participantPhones: string[], avatar?: string, description?: string) => Group;
  sendMessage: (payload: {
    type: MessageType;
    content: string;
    mediaUrl?: string;
    mediaName?: string;
    mediaSize?: string;
    mediaDuration?: number;
    replyToId?: string;
    isForwarded?: boolean;
  }) => void;
  editMessage: (messageId: string, newContent: string) => void;
  toggleStarMessage: (messageId: string) => void;
  forwardMessage: (messageId: string, targetPhones: string[]) => void;
  deleteMessage: (messageId: string, forEveryone?: boolean) => void;
  reactToMessage: (messageId: string, emoji: string) => void;
  clearChat: (contactPhone: string) => void;
  togglePinChat: (contactPhone: string) => void;
  isChatPinned: (contactPhone: string) => boolean;
  blockContact: (contactPhone: string) => void;
  unblockContact: (contactPhone: string) => void;
  isContactBlocked: (contactPhone: string) => boolean;
  addContactByPhone: (phone: string, name: string) => { success: boolean; message: string; contact?: Contact };
  deleteContact: (contactPhone: string) => { success: boolean; message: string };
  switchUser: (userId: string) => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  addStatus: (status: Omit<StatusItem, 'id' | 'userId' | 'userName' | 'userPhone' | 'userAvatar' | 'timestamp'>) => void;
  setTyping: (isTyping: boolean) => void;
  openMediaViewer: (url: string, type: 'image' | 'video', title?: string) => void;
  closeMediaViewer: () => void;
  addCallRecord: (call: Omit<CallRecord, 'id' | 'timestamp'>) => void;
  getChatMessages: (contactPhone: string) => Message[];
  getUnreadCountForPhone: (phone: string) => number;
  markChatAsRead: (contactPhone: string) => void;
  completeOnboarding: (user: User) => void;
  logoutAndReset: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export { arePhonesMatching, normalizePhone };

export function formatPhone(phone: string): string {
  return phone.trim();
}

const DEFAULT_FALLBACK_USER: User = {
  id: 'guest_user',
  name: 'Usuario',
  phone: '',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  about: '¡Hola! Estoy usando ViveChat 🟣',
  isOnline: true,
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<User[]>(() => storage.getUsers());
  const [currentUserId, setCurrentUserId] = useState<string>(() => storage.getActiveUserId());
  const [isRegistered, setIsRegistered] = useState<boolean>(() => storage.hasCompletedOnboarding());
  const [contacts, setContacts] = useState<Contact[]>(() => storage.getContacts(currentUserId));
  const [groups, setGroups] = useState<Group[]>(() => storage.getGroups());
  const [messages, setMessages] = useState<Message[]>(() => storage.getMessages());
  const [statuses, setStatuses] = useState<StatusItem[]>(() => storage.getStatuses());
  const [calls, setCalls] = useState<CallRecord[]>(() => storage.getCalls());
  const [settings, setSettingsState] = useState<AppSettings>(() => storage.getSettings());
  const [pinnedPhones, setPinnedPhones] = useState<string[]>(() => storage.getPinned(currentUserId));
  const [blockedPhones, setBlockedPhones] = useState<string[]>(() => storage.getBlocked(currentUserId));
  const [activeTab, setActiveTab] = useState<TabType>('chats');
  const [selectedContactPhone, setSelectedContactPhone] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [mediaViewerData, setMediaViewerData] = useState<{ isOpen: boolean; url: string; type: 'image' | 'video'; title?: string } | null>(null);

  const currentUser = allUsers.find(u => u.id === currentUserId) || allUsers[0] || DEFAULT_FALLBACK_USER;
  const selectedContactPhoneRef = useRef(selectedContactPhone);
  selectedContactPhoneRef.current = selectedContactPhone;
  const selectedGroupIdRef = useRef(selectedGroupId);
  selectedGroupIdRef.current = selectedGroupId;
  const groupsRef = useRef(groups);
  groupsRef.current = groups;

  // Sync settings with SoundManager
  useEffect(() => {
    sounds.setSoundEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Load contacts, pins, blocks when currentUser changes
  useEffect(() => {
    setContacts(storage.getContacts(currentUser.id));
    setPinnedPhones(storage.getPinned(currentUser.id));
    setBlockedPhones(storage.getBlocked(currentUser.id));
  }, [currentUser.id]);

  // 1. Initial user cloud registration in Firestore
  const lastRegisteredUserHashRef = useRef<string>('');
  useEffect(() => {
    if (isRegistered && currentUser?.phone) {
      const userHash = `${currentUser.id}_${currentUser.phone}_${currentUser.name}_${currentUser.avatar}_${currentUser.about}`;
      if (lastRegisteredUserHashRef.current !== userHash) {
        lastRegisteredUserHashRef.current = userHash;
        firestoreService.registerUser(currentUser);
        apiClient.registerUser(currentUser);
      }
    }
  }, [isRegistered, currentUser.id, currentUser.phone, currentUser.name, currentUser.avatar, currentUser.about]);

  // 2. Real-Time Firestore Cloud Users Subscription
  useEffect(() => {
    const unsubUsers = firestoreService.subscribeToUsers((cloudUsers) => {
      setAllUsers(prev => {
        const map = new Map<string, User>();
        prev.forEach(u => map.set(normalizePhone(u.phone), u));
        let changed = false;
        cloudUsers.forEach(u => {
          const norm = normalizePhone(u.phone);
          const old = map.get(norm);
          if (!old || old.name !== u.name || old.avatar !== u.avatar || old.about !== u.about) {
            map.set(norm, u);
            changed = true;
          }
        });
        if (!changed && map.size === prev.length) return prev;
        const merged = Array.from(map.values());
        storage.saveUsers(merged);
        return merged;
      });
    });

    return () => unsubUsers();
  }, []);

  // 3. Real-Time Firestore Groups Subscription
  useEffect(() => {
    if (!currentUser?.phone) return;

    const unsubGroups = firestoreService.subscribeToGroups(currentUser.phone, (cloudGroups) => {
      setGroups(prev => {
        const map = new Map<string, Group>();
        prev.forEach(g => map.set(g.id, g));
        let changed = false;
        cloudGroups.forEach(g => {
          const old = map.get(g.id);
          if (!old || old.name !== g.name || old.members.length !== g.members.length || old.avatar !== g.avatar) {
            map.set(g.id, g);
            changed = true;
          }
        });
        if (!changed && map.size === prev.length) return prev;
        const merged = Array.from(map.values());
        storage.saveGroups(merged);
        return merged;
      });
    });

    return () => unsubGroups();
  }, [currentUser.phone]);

  // 4. Real-Time Firestore Cloud Messages Subscription
  useEffect(() => {
    if (!isRegistered || !currentUser.phone) return;

    const unsubFirestoreMsgs = firestoreService.subscribeToMessages(
      currentUser.phone,
      (changeType, msg) => {
        setMessages(prev => {
          let updated: Message[];
          if (changeType === 'added') {
            const exists = prev.some(m => m.id === msg.id);
            if (exists) {
              updated = prev.map(m => m.id === msg.id ? msg : m);
            } else {
              updated = [...prev, msg];
            }
          } else if (changeType === 'modified') {
            updated = prev.map(m => m.id === msg.id ? msg : m);
          } else {
            // removed
            updated = prev.filter(m => m.id !== msg.id);
          }

          storage.saveMessages(updated);

          // If a new incoming message arrived from someone else
          if (
            changeType === 'added' &&
            !arePhonesMatching(msg.senderPhone, currentUser.phone)
          ) {
            const isGroupMsg = msg.isGroup || msg.groupId;
            const currentGroups = groupsRef.current;
            const isForMe = arePhonesMatching(msg.receiverPhone, currentUser.phone) ||
              (isGroupMsg && currentGroups.some(g => g.id === msg.groupId && g.members.some(m => arePhonesMatching(m, currentUser.phone))));

            if (isForMe) {
              sounds.playMessageReceived();

              // If the chat with this sender/group is currently open, mark it as read immediately
              if (
                selectedContactPhoneRef.current &&
                (arePhonesMatching(msg.senderPhone, selectedContactPhoneRef.current) ||
                 (msg.groupId && selectedContactPhoneRef.current === msg.groupId))
              ) {
                firestoreService.updateMessageStatus(msg.id, 'read');
              }
            }
          }

          return updated;
        });
      }
    );

    // 5. Firestore Typing Indicator Subscription
    const unsubTyping = firestoreService.subscribeToTyping(currentUser.phone, (senderPhone, isTyping) => {
      setTypingUsers(prev => {
        if (prev[senderPhone] === isTyping) return prev;
        return {
          ...prev,
          [senderPhone]: isTyping
        };
      });
    });

    // 6. Server SSE Stream (Guaranteed real-time backbone)
    const unsubSSE = apiClient.subscribeToEvents(currentUser.phone, (event) => {
      const { type, payload } = event;
      if (type === 'NEW_MESSAGE') {
        const newMsg = payload as Message;
        setMessages(prev => {
          const exists = prev.some(m => m.id === newMsg.id);
          const updated = exists ? prev.map(m => m.id === newMsg.id ? newMsg : m) : [...prev, newMsg];
          storage.saveMessages(updated);
          return updated;
        });
        if (
          !arePhonesMatching(newMsg.senderPhone, currentUser.phone)
        ) {
          sounds.playMessageReceived();
          if (
            selectedContactPhoneRef.current &&
            (arePhonesMatching(selectedContactPhoneRef.current, newMsg.senderPhone) ||
             (newMsg.groupId && selectedContactPhoneRef.current === newMsg.groupId))
          ) {
            apiClient.markAsRead(currentUser.phone, [newMsg.id]);
          }
        }
      } else if (type === 'USERS_UPDATED') {
        setAllUsers(payload);
        storage.saveUsers(payload);
      } else if (type === 'GROUPS_UPDATED') {
        setGroups(payload);
        storage.saveGroups(payload);
      } else if (type === 'TYPING_STATUS') {
        const { senderPhone, targetPhone, isTyping } = payload;
        if (arePhonesMatching(targetPhone, currentUser.phone)) {
          setTypingUsers(prev => ({
            ...prev,
            [senderPhone]: isTyping
          }));
        }
      } else if (type === 'STATUSES_UPDATED') {
        setStatuses(payload);
        storage.saveStatuses(payload);
      }
    });

    // 7. Firestore Statuses Listener
    const unsubStatuses = firestoreService.subscribeToStatuses((cloudStatuses) => {
      setStatuses(prev => {
        const map = new Map<string, StatusItem>();
        cloudStatuses.forEach(s => map.set(s.id, s));
        let changed = false;
        prev.forEach(s => {
          if (!map.has(s.id)) {
            map.set(s.id, s);
            changed = true;
          }
        });
        if (!changed && map.size === prev.length) return prev;
        const merged = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
        storage.saveStatuses(merged);
        return merged;
      });
    });

    // 8. High-Frequency Polling (1.5s) to guarantee delivery
    const performSync = async () => {
      if (!currentUser?.phone) return;
      try {
        const res = await apiClient.sync(currentUser.phone);
        if (res) {
          if (res.statuses && res.statuses.length) {
            setStatuses(prev => {
              const map = new Map<string, StatusItem>();
              prev.forEach(s => map.set(s.id, s));
              let hasNew = false;
              res.statuses.forEach(s => {
                if (!map.has(s.id)) {
                  map.set(s.id, s);
                  hasNew = true;
                }
              });
              if (!hasNew) return prev;
              const merged = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
              storage.saveStatuses(merged);
              return merged;
            });
          }

          if (res.users && res.users.length) {
            setAllUsers(prev => {
              const map = new Map<string, User>();
              prev.forEach(u => map.set(normalizePhone(u.phone), u));
              let hasChanges = false;
              res.users.forEach(u => {
                const norm = normalizePhone(u.phone);
                const old = map.get(norm);
                if (!old || old.name !== u.name || old.avatar !== u.avatar || old.about !== u.about) {
                  map.set(norm, u);
                  hasChanges = true;
                }
              });
              if (!hasChanges && prev.length === map.size) {
                return prev;
              }
              const merged = Array.from(map.values());
              storage.saveUsers(merged);
              return merged;
            });
          }

          if (res.messages && res.messages.length) {
            setMessages(prev => {
              const map = new Map<string, Message>();
              prev.forEach(m => map.set(m.id, m));
              let hasChanges = false;
              res.messages.forEach(m => {
                const old = map.get(m.id);
                if (!old || old.status !== m.status || old.content !== m.content || old.isStarred !== m.isStarred || old.deletedForEveryone !== m.deletedForEveryone) {
                  map.set(m.id, m);
                  hasChanges = true;
                }
              });
              if (!hasChanges && prev.length === map.size) return prev;
              const merged = Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
              storage.saveMessages(merged);
              return merged;
            });
          }
        }
      } catch {
        // Network silent fallback
      }
    };

    // Perform initial sync once
    performSync();

    // Background sync check (runs only when window is active, avoiding lag)
    const pollingInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        performSync();
      }
    }, 6000);

    const onVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        performSync();
      }
    };
    window.addEventListener('focus', onVisibilityOrFocus);
    document.addEventListener('visibilitychange', onVisibilityOrFocus);

    return () => {
      unsubFirestoreMsgs();
      unsubTyping();
      unsubSSE();
      unsubStatuses();
      clearInterval(pollingInterval);
      window.removeEventListener('focus', onVisibilityOrFocus);
      document.removeEventListener('visibilitychange', onVisibilityOrFocus);
    };
  }, [currentUser.phone, isRegistered]);

  // Local Broadcast listener for multi-tab support
  useEffect(() => {
    const unsubscribe = subscribeToBroadcast((event) => {
      switch (event.type) {
        case 'MESSAGES_UPDATED':
          setMessages(event.payload);
          break;
        case 'USERS_UPDATED':
          setAllUsers(event.payload);
          break;
        case 'GROUPS_UPDATED':
          setGroups(event.payload);
          break;
        case 'CONTACTS_UPDATED':
          if (event.payload.userId === currentUser.id) {
            setContacts(event.payload.contacts);
          }
          break;
        case 'STATUSES_UPDATED':
          setStatuses(event.payload);
          break;
        case 'CALLS_UPDATED':
          setCalls(event.payload);
          break;
      }
    });

    return () => unsubscribe();
  }, [currentUser.id, currentUser.phone]);

  // Find selected group
  const selectedGroup: Group | null = selectedGroupId
    ? groups.find(g => g.id === selectedGroupId) || null
    : (selectedContactPhone && selectedContactPhone.startsWith('group_')
        ? groups.find(g => g.id === selectedContactPhone) || null
        : null);

  // Find selected contact details with flexible phone matching
  const selectedContact: Contact | null = selectedGroup
    ? {
        id: selectedGroup.id,
        userId: '',
        name: selectedGroup.name,
        phone: selectedGroup.id,
        avatar: selectedGroup.avatar,
        about: selectedGroup.description || `${selectedGroup.members.length} miembros`,
        isRegistered: true,
      }
    : (selectedContactPhone
        ? contacts.find(c => arePhonesMatching(c.phone, selectedContactPhone)) || {
            id: 'temp_' + selectedContactPhone,
            userId: allUsers.find(u => arePhonesMatching(u.phone, selectedContactPhone))?.id || '',
            name: allUsers.find(u => arePhonesMatching(u.phone, selectedContactPhone))?.name || selectedContactPhone,
            phone: selectedContactPhone,
            avatar: allUsers.find(u => arePhonesMatching(u.phone, selectedContactPhone))?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            about: allUsers.find(u => arePhonesMatching(u.phone, selectedContactPhone))?.about || 'Disponible',
            isRegistered: !!allUsers.find(u => arePhonesMatching(u.phone, selectedContactPhone)),
          }
        : null);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettingsState(prev => {
      const updated = { ...prev, ...updates };
      storage.saveSettings(updated);
      return updated;
    });
  }, []);

  const switchUser = useCallback((userId: string) => {
    storage.setActiveUserId(userId);
    setCurrentUserId(userId);
    setContacts(storage.getContacts(userId));
    setPinnedPhones(storage.getPinned(userId));
    setBlockedPhones(storage.getBlocked(userId));
    setSelectedContactPhone(null);
    setSelectedGroupId(null);
  }, []);

  const updateCurrentUser = useCallback((updates: Partial<User>) => {
    setAllUsers(prev => {
      const updated = prev.map(u => u.id === currentUser.id ? { ...u, ...updates } : u);
      storage.saveUsers(updated);
      const updatedUser = updated.find(u => u.id === currentUser.id);
      if (updatedUser) {
        firestoreService.registerUser(updatedUser);
        apiClient.registerUser(updatedUser);
      }
      return updated;
    });
  }, [currentUser.id]);

  const markChatAsRead = useCallback((targetIdOrPhone: string) => {
    setMessages(prev => {
      let changed = false;
      const updated = prev.map(m => {
        const isTargetMatch =
          (m.isGroup && (m.groupId === targetIdOrPhone || m.receiverPhone === targetIdOrPhone)) ||
          (!m.isGroup && arePhonesMatching(m.senderPhone, targetIdOrPhone) && arePhonesMatching(m.receiverPhone, currentUser.phone));

        if (isTargetMatch && m.status !== 'read') {
          changed = true;
          firestoreService.updateMessageStatus(m.id, 'read');
          return { ...m, status: 'read' as const };
        }
        return m;
      });
      if (changed) {
        storage.saveMessages(updated);
      }
      return updated;
    });

    apiClient.markAsRead(currentUser.phone);
  }, [currentUser.phone]);

  const selectChatByPhone = useCallback((phone: string) => {
    setSelectedGroupId(null);
    setSelectedContactPhone(phone);
    if (phone) {
      markChatAsRead(phone);
    }
  }, [markChatAsRead]);

  const selectGroupById = useCallback((groupId: string) => {
    setSelectedContactPhone(groupId);
    setSelectedGroupId(groupId);
    if (groupId) {
      markChatAsRead(groupId);
    }
  }, [markChatAsRead]);

  // Create new Group Chat
  const createGroupChat = useCallback((name: string, participantPhones: string[], avatar?: string, description?: string): Group => {
    const groupId = 'group_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    // Ensure currentUser is included in members and admins
    const allMembers = Array.from(new Set([currentUser.phone, ...participantPhones]));
    
    const newGroup: Group = {
      id: groupId,
      name: name.trim(),
      description: description?.trim() || '',
      avatar: avatar || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
      createdByPhone: currentUser.phone,
      createdAt: Date.now(),
      members: allMembers,
      admins: [currentUser.phone],
    };

    const updatedGroups = [newGroup, ...groups.filter(g => g.id !== groupId)];
    setGroups(updatedGroups);
    storage.saveGroups(updatedGroups);
    firestoreService.saveGroup(newGroup);
    apiClient.saveGroup(newGroup);
    broadcastEvent('GROUPS_UPDATED', updatedGroups);

    // Create an initial system message in the group
    const initialMsgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const systemMsg: Message = {
      id: initialMsgId,
      chatId: groupId,
      senderId: currentUser.id,
      senderPhone: currentUser.phone,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      receiverId: groupId,
      receiverPhone: groupId,
      isGroup: true,
      groupId: groupId,
      type: 'text',
      content: `🎉 ${currentUser.name} creó el grupo "${name}"`,
      timestamp: Date.now(),
      status: 'delivered',
    };

    setMessages(prev => {
      const updated = [...prev, systemMsg];
      storage.saveMessages(updated);
      return updated;
    });
    firestoreService.sendMessage(systemMsg);
    apiClient.sendMessage(systemMsg);

    // Select the new group chat immediately
    selectGroupById(groupId);
    setActiveTab('chats');

    return newGroup;
  }, [currentUser, groups, selectGroupById]);

  // Set typing indicator
  const setTyping = useCallback((isTyping: boolean) => {
    if (!selectedContactPhone) return;
    firestoreService.setTyping(currentUser.phone, selectedContactPhone, isTyping);
    apiClient.sendTyping(currentUser.phone, selectedContactPhone, isTyping);
  }, [currentUser.phone, selectedContactPhone]);

  // Add contact to phone book
  const addContactByPhone = useCallback((phone: string, name: string) => {
    const raw = phone.trim();
    if (!raw || cleanPhoneDigits(raw).length < 6) {
      return { success: false, message: 'Ingresa un número de teléfono válido con código de país (ej. +504 9876-5432 o +52 55 1234 5678).' };
    }

    if (arePhonesMatching(raw, currentUser.phone)) {
      return { success: false, message: 'No puedes agregarte a ti mismo como contacto.' };
    }

    const exists = contacts.find(c => arePhonesMatching(c.phone, raw));
    if (exists) {
      return { success: false, message: 'Este contacto ya está guardado en tu agenda.' };
    }

    const registeredUser = allUsers.find(u => arePhonesMatching(u.phone, raw));

    const newContact: Contact = {
      id: 'contact_' + Date.now(),
      userId: registeredUser ? registeredUser.id : '',
      name: name.trim() || (registeredUser ? registeredUser.name : raw),
      phone: raw,
      avatar: registeredUser ? registeredUser.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      about: registeredUser ? registeredUser.about : 'Disponible',
      isRegistered: !!registeredUser,
    };

    const updated = [newContact, ...contacts];
    setContacts(updated);
    storage.saveContacts(currentUser.id, updated);
    firestoreService.saveContact(currentUser.phone, newContact);
    apiClient.saveContact(currentUser.phone, newContact);

    return {
      success: true,
      message: registeredUser
        ? `Contacto ${newContact.name} agregado con éxito a ViveChat.`
        : `Contacto guardado con éxito.`,
      contact: newContact
    };
  }, [allUsers, contacts, currentUser.id, currentUser.phone]);

  // Delete contact from phone book and clear conversation
  const deleteContact = useCallback((contactPhone: string) => {
    if (!currentUser?.phone) return { success: false, message: 'Usuario no válido' };

    const targetContact = contacts.find(c => arePhonesMatching(c.phone, contactPhone));
    const contactName = targetContact?.name || contactPhone;

    // 1. Remove contact from contacts state & storage
    const updatedContacts = contacts.filter(c => !arePhonesMatching(c.phone, contactPhone));
    setContacts(updatedContacts);
    storage.saveContacts(currentUser.id, updatedContacts);

    // 2. Remove all messages between currentUser and this contact
    const updatedMessages = messages.filter(m => {
      const isBetween =
        (arePhonesMatching(m.senderPhone, currentUser.phone) && arePhonesMatching(m.receiverPhone, contactPhone)) ||
        (arePhonesMatching(m.receiverPhone, currentUser.phone) && arePhonesMatching(m.senderPhone, contactPhone));
      return !isBetween;
    });
    setMessages(updatedMessages);
    storage.saveMessages(updatedMessages);

    // 3. Remove pin & block if present
    setPinnedPhones(prev => {
      const filtered = prev.filter(p => !arePhonesMatching(p, contactPhone));
      storage.savePinned(currentUser.id, filtered);
      return filtered;
    });

    setBlockedPhones(prev => {
      const filtered = prev.filter(p => !arePhonesMatching(p, contactPhone));
      storage.saveBlocked(currentUser.id, filtered);
      return filtered;
    });

    // 4. If current open chat is this contact, close it
    if (selectedContactPhone && arePhonesMatching(selectedContactPhone, contactPhone)) {
      setSelectedContactPhone(null);
    }

    // 5. Delete in Firestore & Server
    firestoreService.deleteContact(currentUser.phone, contactPhone);
    apiClient.deleteContact(currentUser.phone, contactPhone);

    // 6. Broadcast across tabs
    broadcastEvent('CONTACTS_UPDATED', { userId: currentUser.id, contacts: updatedContacts });
    broadcastEvent('MESSAGES_UPDATED', updatedMessages);

    return {
      success: true,
      message: `Contacto "${contactName}" eliminado permanentemente.`
    };
  }, [contacts, currentUser?.id, currentUser?.phone, messages, selectedContactPhone]);

  // Pinned chat toggling
  const togglePinChat = useCallback((contactPhone: string) => {
    setPinnedPhones(prev => {
      let updated: string[];
      const isAlreadyPinned = prev.some(p => arePhonesMatching(p, contactPhone));
      if (isAlreadyPinned) {
        updated = prev.filter(p => !arePhonesMatching(p, contactPhone));
      } else {
        if (prev.length >= 3) {
          updated = [contactPhone, ...prev.slice(0, 2)];
        } else {
          updated = [contactPhone, ...prev];
        }
      }
      storage.savePinned(currentUser.id, updated);
      return updated;
    });
  }, [currentUser.id]);

  const isChatPinned = useCallback((contactPhone: string) => {
    return pinnedPhones.some(p => arePhonesMatching(p, contactPhone));
  }, [pinnedPhones]);

  // Block / unblock contact
  const blockContact = useCallback((contactPhone: string) => {
    setBlockedPhones(prev => {
      if (prev.some(p => arePhonesMatching(p, contactPhone))) return prev;
      const updated = [...prev, contactPhone];
      storage.saveBlocked(currentUser.id, updated);
      return updated;
    });
  }, [currentUser.id]);

  const unblockContact = useCallback((contactPhone: string) => {
    setBlockedPhones(prev => {
      const updated = prev.filter(p => !arePhonesMatching(p, contactPhone));
      storage.saveBlocked(currentUser.id, updated);
      return updated;
    });
  }, [currentUser.id]);

  const isContactBlocked = useCallback((contactPhone: string) => {
    return blockedPhones.some(p => arePhonesMatching(p, contactPhone));
  }, [blockedPhones]);

  // Clear chat conversation
  const clearChat = useCallback((targetIdOrPhone: string) => {
    setMessages(prev => {
      const updated = prev.filter(m => {
        if (m.isGroup || m.groupId) {
          return m.groupId !== targetIdOrPhone && m.receiverPhone !== targetIdOrPhone;
        }
        const isFromMeToContact = arePhonesMatching(m.senderPhone, currentUser.phone) && arePhonesMatching(m.receiverPhone, targetIdOrPhone);
        const isFromContactToMe = arePhonesMatching(m.senderPhone, targetIdOrPhone) && arePhonesMatching(m.receiverPhone, currentUser.phone);
        return !(isFromMeToContact || isFromContactToMe);
      });
      storage.saveMessages(updated);
      return updated;
    });
  }, [currentUser.phone]);

  // Send Real Human-to-Human Message
  const sendMessage = useCallback((payload: {
    type: MessageType;
    content: string;
    mediaUrl?: string;
    mediaName?: string;
    mediaSize?: string;
    mediaDuration?: number;
    replyToId?: string;
    isForwarded?: boolean;
  }) => {
    if (!selectedContactPhone) return;

    const isGroupChat = !!selectedGroup || selectedContactPhone.startsWith('group_');

    if (!isGroupChat && blockedPhones.some(p => arePhonesMatching(p, selectedContactPhone))) {
      return;
    }

    const targetUser = allUsers.find(u => arePhonesMatching(u.phone, selectedContactPhone));

    let replyToObj = undefined;
    if (payload.replyToId) {
      const parentMsg = messages.find(m => m.id === payload.replyToId);
      if (parentMsg) {
        replyToObj = {
          id: parentMsg.id,
          senderName: arePhonesMatching(parentMsg.senderPhone, currentUser.phone)
            ? 'Tú'
            : (parentMsg.senderName || selectedContact?.name || 'Contacto'),
          content: parentMsg.content || (parentMsg.type === 'image' ? '📷 Foto' : parentMsg.type === 'video' ? '🎥 Video' : '🎤 Audio'),
          type: parentMsg.type,
        };
      }
    }

    const newMsgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    // Initial message state
    const initialMsg: Message = {
      id: newMsgId,
      chatId: isGroupChat
        ? selectedContactPhone
        : [normalizePhone(currentUser.phone), normalizePhone(selectedContactPhone)].sort().join('_'),
      senderId: currentUser.id,
      senderPhone: currentUser.phone,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      receiverId: isGroupChat ? selectedContactPhone : (targetUser?.id || 'contact_' + cleanPhoneDigits(selectedContactPhone)),
      receiverPhone: selectedContactPhone,
      isGroup: isGroupChat,
      groupId: isGroupChat ? selectedContactPhone : undefined,
      type: payload.type,
      content: payload.content,
      mediaUrl: payload.mediaUrl,
      mediaName: payload.mediaName,
      mediaSize: payload.mediaSize,
      mediaDuration: payload.mediaDuration,
      timestamp: Date.now(),
      status: 'delivered',
      replyTo: replyToObj,
      isForwarded: payload.isForwarded,
    };

    // Play sending sound pop
    sounds.playMessageSent();

    setMessages(prev => {
      const updated = [...prev, initialMsg];
      storage.saveMessages(updated);
      return updated;
    });

    // Send immediately to Firestore Cloud Database
    firestoreService.sendMessage(initialMsg);
    apiClient.sendMessage(initialMsg);
    broadcastEvent('MESSAGES_UPDATED', [...messages, initialMsg]);
  }, [allUsers, blockedPhones, currentUser, messages, selectedContact?.name, selectedContactPhone, selectedGroup]);

  // Edit message
  const editMessage = useCallback((messageId: string, newContent: string) => {
    if (!newContent.trim()) return;
    setMessages(prev => {
      const updated = prev.map(m => {
        if (m.id === messageId && arePhonesMatching(m.senderPhone, currentUser.phone)) {
          const edited = { ...m, content: newContent.trim(), isEdited: true };
          firestoreService.sendMessage(edited);
          apiClient.sendMessage(edited);
          return edited;
        }
        return m;
      });
      storage.saveMessages(updated);
      return updated;
    });
  }, [currentUser.phone]);

  // Star message toggle
  const toggleStarMessage = useCallback((messageId: string) => {
    setMessages(prev => {
      const updated = prev.map(m => {
        if (m.id === messageId) {
          return { ...m, isStarred: !m.isStarred };
        }
        return m;
      });
      storage.saveMessages(updated);
      return updated;
    });
  }, []);

  // Forward message to multiple contacts
  const forwardMessage = useCallback((messageId: string, targetPhones: string[]) => {
    const original = messages.find(m => m.id === messageId);
    if (!original || targetPhones.length === 0) return;

    targetPhones.forEach(phone => {
      const isGroupTarget = phone.startsWith('group_');
      const targetUser = allUsers.find(u => arePhonesMatching(u.phone, phone));

      const fwdMsg: Message = {
        id: 'msg_fwd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        chatId: isGroupTarget
          ? phone
          : [normalizePhone(currentUser.phone), normalizePhone(phone)].sort().join('_'),
        senderId: currentUser.id,
        senderPhone: currentUser.phone,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        receiverId: isGroupTarget ? phone : (targetUser?.id || 'contact_' + cleanPhoneDigits(phone)),
        receiverPhone: phone,
        isGroup: isGroupTarget,
        groupId: isGroupTarget ? phone : undefined,
        type: original.type,
        content: original.content,
        mediaUrl: original.mediaUrl,
        mediaName: original.mediaName,
        mediaSize: original.mediaSize,
        mediaDuration: original.mediaDuration,
        timestamp: Date.now(),
        status: 'delivered',
        isForwarded: true,
      };

      setMessages(prev => {
        const updated = [...prev, fwdMsg];
        storage.saveMessages(updated);
        return updated;
      });
      firestoreService.sendMessage(fwdMsg);
      apiClient.sendMessage(fwdMsg);
    });
  }, [allUsers, currentUser, messages]);

  // Delete message
  const deleteMessage = useCallback((messageId: string, forEveryone: boolean = false) => {
    setMessages(prev => {
      let updated: Message[];
      if (forEveryone) {
        updated = prev.map(m => {
          if (m.id === messageId) {
            const del: Message = {
              ...m,
              content: '🚫 Este mensaje fue eliminado.',
              deletedForEveryone: true,
              mediaUrl: undefined,
            };
            firestoreService.sendMessage(del);
            apiClient.sendMessage(del);
            return del;
          }
          return m;
        });
      } else {
        updated = prev.filter(m => m.id !== messageId);
      }
      storage.saveMessages(updated);
      return updated;
    });
  }, []);

  // React to message with emoji
  const reactToMessage = useCallback((messageId: string, emoji: string) => {
    setMessages(prev => {
      const updated = prev.map(m => {
        if (m.id !== messageId) return m;
        const currentReactions = m.reactions || [];
        const existingIdx = currentReactions.findIndex(r => r.userId === currentUser.id);
        
        let newReactions = [...currentReactions];
        if (existingIdx >= 0) {
          if (newReactions[existingIdx].emoji === emoji) {
            newReactions.splice(existingIdx, 1);
          } else {
            newReactions[existingIdx] = { emoji, userId: currentUser.id, userName: currentUser.name };
          }
        } else {
          newReactions.push({ emoji, userId: currentUser.id, userName: currentUser.name });
        }
        const updatedMsg = { ...m, reactions: newReactions };
        firestoreService.sendMessage(updatedMsg);
        apiClient.sendMessage(updatedMsg);
        return updatedMsg;
      });
      storage.saveMessages(updated);
      return updated;
    });
  }, [currentUser.id, currentUser.name]);

  // Add status
  const addStatus = useCallback((statusData: Omit<StatusItem, 'id' | 'userId' | 'userName' | 'userPhone' | 'userAvatar' | 'timestamp'>) => {
    const newStatus: StatusItem = {
      id: 'st_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: currentUser.id,
      userName: currentUser.name,
      userPhone: currentUser.phone,
      userAvatar: currentUser.avatar,
      timestamp: Date.now(),
      ...statusData,
    };
    const updated = [newStatus, ...statuses.filter(s => s.id !== newStatus.id)];
    setStatuses(updated);
    storage.saveStatuses(updated);

    // Instant cloud and server synchronization
    firestoreService.saveStatus(newStatus);
    apiClient.addStatus(newStatus);
    broadcastEvent('STATUSES_UPDATED', updated);
  }, [currentUser, statuses]);

  // Add Call record
  const addCallRecord = useCallback((callData: Omit<CallRecord, 'id' | 'timestamp'>) => {
    const newCall: CallRecord = {
      id: 'call_' + Date.now(),
      timestamp: Date.now(),
      ...callData,
    };
    const updated = [newCall, ...calls];
    setCalls(updated);
    storage.saveCalls(updated);
  }, [calls]);

  // Get messages for a contact or group
  const getChatMessages = useCallback((targetIdOrPhone: string) => {
    if (targetIdOrPhone.startsWith('group_')) {
      return messages.filter(m => m.groupId === targetIdOrPhone || m.receiverPhone === targetIdOrPhone)
        .sort((a, b) => a.timestamp - b.timestamp);
    }

    return messages.filter(m => {
      if (m.isGroup || m.groupId) return false;
      const isFromMeToContact = arePhonesMatching(m.senderPhone, currentUser.phone) && arePhonesMatching(m.receiverPhone, targetIdOrPhone);
      const isFromContactToMe = arePhonesMatching(m.senderPhone, targetIdOrPhone) && arePhonesMatching(m.receiverPhone, currentUser.phone);
      return isFromMeToContact || isFromContactToMe;
    }).sort((a, b) => a.timestamp - b.timestamp);
  }, [currentUser.phone, messages]);

  // Get unread count for a contact or group
  const getUnreadCountForPhone = useCallback((targetIdOrPhone: string) => {
    if (targetIdOrPhone.startsWith('group_')) {
      return messages.filter(m => {
        return (m.groupId === targetIdOrPhone || m.receiverPhone === targetIdOrPhone) &&
               !arePhonesMatching(m.senderPhone, currentUser.phone) &&
               m.status !== 'read';
      }).length;
    }

    return messages.filter(m => {
      if (m.isGroup || m.groupId) return false;
      return arePhonesMatching(m.senderPhone, targetIdOrPhone) &&
             arePhonesMatching(m.receiverPhone, currentUser.phone) &&
             m.status !== 'read';
    }).length;
  }, [currentUser.phone, messages]);

  const openMediaViewer = useCallback((url: string, type: 'image' | 'video', title?: string) => {
    setMediaViewerData({ isOpen: true, url, type, title });
  }, []);

  const closeMediaViewer = useCallback(() => {
    setMediaViewerData(null);
  }, []);

  const completeOnboarding = useCallback((user: User) => {
    storage.setActiveUserId(user.id);
    storage.setCompletedOnboarding(true);
    setCurrentUserId(user.id);
    setIsRegistered(true);
    firestoreService.registerUser(user);
    apiClient.registerUser(user);
  }, []);

  const logoutAndReset = useCallback(() => {
    storage.clearAll();
    window.location.reload();
  }, []);

  return (
    <ChatContext.Provider
      value={{
        currentUser,
        allUsers,
        contacts,
        groups,
        messages,
        statuses,
        calls,
        activeTab,
        selectedContactPhone,
        selectedContact,
        selectedGroup,
        settings,
        typingUsers,
        mediaViewerData,
        pinnedPhones,
        blockedPhones,
        isRegistered,
        setActiveTab,
        selectChatByPhone,
        selectGroupById,
        createGroupChat,
        sendMessage,
        editMessage,
        toggleStarMessage,
        forwardMessage,
        deleteMessage,
        reactToMessage,
        clearChat,
        togglePinChat,
        isChatPinned,
        blockContact,
        unblockContact,
        isContactBlocked,
        addContactByPhone,
        deleteContact,
        switchUser,
        updateCurrentUser,
        updateSettings,
        addStatus,
        setTyping,
        openMediaViewer,
        closeMediaViewer,
        addCallRecord,
        getChatMessages,
        getUnreadCountForPhone,
        markChatAsRead,
        completeOnboarding,
        logoutAndReset,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
