import { User, Contact, Message, StatusItem, CallRecord, Group } from '../types';
import { INITIAL_USERS, INITIAL_CONTACTS, INITIAL_MESSAGES, INITIAL_STATUSES, INITIAL_CALLS } from './mockData';

const STORAGE_KEYS = {
  USERS: 'pt_users_v3',
  ACTIVE_USER_ID: 'pt_active_user_id_v3',
  ONBOARDING_COMPLETED: 'pt_onboarding_completed_v3',
  CONTACTS: 'pt_contacts_v3',
  MESSAGES: 'pt_messages_v3',
  STATUSES: 'pt_statuses_v3',
  CALLS: 'pt_calls_v3',
  SETTINGS: 'pt_settings_v3',
  BLOCKED: 'pt_blocked_v3',
  PINNED: 'pt_pinned_v3',
  GROUPS: 'pt_groups_v3',
};

export interface AppSettings {
  theme: 'light' | 'dark';
  soundEnabled: boolean;
  wallpaper: string;
  readReceipts: boolean;
  enterIsSend: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  soundEnabled: true,
  wallpaper: 'purple-doodle',
  readReceipts: true,
  enterIsSend: true,
};

// BroadcastChannel for instant cross-tab / cross-window real-time sync & WebRTC signaling
let syncChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    syncChannel = new BroadcastChannel('vivechat_realtime_sync_v3');
  } catch {
    syncChannel = null;
  }
}

export function broadcastEvent(type: string, payload: any) {
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type, payload, timestamp: Date.now() });
    } catch {
      // ignore
    }
  }
}

export function subscribeToBroadcast(callback: (event: { type: string; payload: any; timestamp: number }) => void) {
  if (!syncChannel) return () => {};
  const handler = (e: MessageEvent) => {
    if (e.data && e.data.type) {
      callback(e.data);
    }
  };
  syncChannel.addEventListener('message', handler);
  return () => {
    syncChannel?.removeEventListener('message', handler);
  };
}

export const storage = {
  hasCompletedOnboarding(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED) === 'true';
    } catch {
      return false;
    }
  },

  setCompletedOnboarding(completed: boolean) {
    try {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, completed ? 'true' : 'false');
    } catch {
      // ignore
    }
  },

  getUsers(): User[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  },

  saveUsers(users: User[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      broadcastEvent('USERS_UPDATED', users);
    } catch {
      // ignore
    }
  },

  getActiveUserId(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID) || 'user_a';
    } catch {
      return 'user_a';
    }
  },

  setActiveUserId(id: string) {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, id);
      broadcastEvent('ACTIVE_USER_CHANGED', id);
    } catch {
      // ignore
    }
  },

  getContacts(userId: string): Contact[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONTACTS);
      const allContacts = data ? JSON.parse(data) : INITIAL_CONTACTS;
      return allContacts[userId] || [];
    } catch {
      return INITIAL_CONTACTS[userId] || [];
    }
  },

  saveContacts(userId: string, contacts: Contact[]) {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONTACTS);
      const allContacts = data ? JSON.parse(data) : { ...INITIAL_CONTACTS };
      allContacts[userId] = contacts;
      localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(allContacts));
      broadcastEvent('CONTACTS_UPDATED', { userId, contacts });
    } catch {
      // ignore
    }
  },

  getMessages(): Message[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      return data ? JSON.parse(data) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  },

  saveMessages(messages: Message[]) {
    try {
      // Keep at most latest 80 messages in local storage cache to keep mobile UI light and snappy
      const trimmed = messages.length > 80 ? messages.slice(messages.length - 80) : messages;
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(trimmed));
      broadcastEvent('MESSAGES_UPDATED', messages);
    } catch {
      // ignore
    }
  },

  getStatuses(): StatusItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATUSES);
      return data ? JSON.parse(data) : INITIAL_STATUSES;
    } catch {
      return INITIAL_STATUSES;
    }
  },

  saveStatuses(statuses: StatusItem[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.STATUSES, JSON.stringify(statuses));
      broadcastEvent('STATUSES_UPDATED', statuses);
    } catch {
      // ignore
    }
  },

  getCalls(): CallRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CALLS);
      return data ? JSON.parse(data) : INITIAL_CALLS;
    } catch {
      return INITIAL_CALLS;
    }
  },

  saveCalls(calls: CallRecord[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.CALLS, JSON.stringify(calls));
      broadcastEvent('CALLS_UPDATED', calls);
    } catch {
      // ignore
    }
  },

  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  },

  getBlocked(userId: string): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BLOCKED);
      const all = data ? JSON.parse(data) : {};
      return all[userId] || [];
    } catch {
      return [];
    }
  },

  saveBlocked(userId: string, blockedPhones: string[]) {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BLOCKED);
      const all = data ? JSON.parse(data) : {};
      all[userId] = blockedPhones;
      localStorage.setItem(STORAGE_KEYS.BLOCKED, JSON.stringify(all));
      broadcastEvent('BLOCKED_UPDATED', { userId, blockedPhones });
    } catch {
      // ignore
    }
  },

  getPinned(userId: string): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PINNED);
      const all = data ? JSON.parse(data) : {};
      return all[userId] || [];
    } catch {
      return [];
    }
  },

  savePinned(userId: string, pinnedPhones: string[]) {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PINNED);
      const all = data ? JSON.parse(data) : {};
      all[userId] = pinnedPhones;
      localStorage.setItem(STORAGE_KEYS.PINNED, JSON.stringify(all));
      broadcastEvent('PINNED_UPDATED', { userId, pinnedPhones });
    } catch {
      // ignore
    }
  },

  getGroups(): Group[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GROUPS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveGroups(groups: Group[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
      broadcastEvent('GROUPS_UPDATED', groups);
    } catch {
      // ignore
    }
  },

  clearAll() {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
  }
};
