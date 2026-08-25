import { User, Contact, Message, StatusItem, CallRecord, Group } from '../types';

export const apiClient = {
  // Register or update user on server
  async registerUser(user: User): Promise<User | null> {
    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user || null;
    } catch {
      return null;
    }
  },

  // Save Group
  async saveGroup(group: Group): Promise<boolean> {
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(group),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Fetch all registered users
  async getUsers(): Promise<User[]> {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  // Global sync for a phone number
  async sync(phone: string): Promise<{
    users: User[];
    messages: Message[];
    statuses: StatusItem[];
    calls: CallRecord[];
    contacts: Contact[];
  } | null> {
    try {
      const res = await fetch(`/api/sync?phone=${encodeURIComponent(phone)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // Send message to server
  async sendMessage(message: Message): Promise<boolean> {
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Mark messages as read
  async markAsRead(readerPhone: string, messageIds?: string[]): Promise<boolean> {
    try {
      const res = await fetch('/api/messages/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readerPhone, status: 'read', messageIds }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Send typing indicator
  async sendTyping(senderPhone: string, targetPhone: string, isTyping: boolean): Promise<boolean> {
    try {
      const res = await fetch('/api/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderPhone, targetPhone, isTyping }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Send call signaling data
  async sendCallSignal(payload: {
    action: 'offer' | 'answer' | 'ice-candidate' | 'end' | 'reject';
    callerPhone: string;
    callerName?: string;
    callerAvatar?: string;
    targetPhone: string;
    callType: 'voice' | 'video';
    sdp?: any;
    candidate?: any;
  }): Promise<boolean> {
    try {
      const res = await fetch('/api/calls/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Save contact
  async saveContact(userPhone: string, contact: Contact): Promise<boolean> {
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPhone, contact }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Delete contact
  async deleteContact(userPhone: string, contactPhone: string): Promise<boolean> {
    try {
      const res = await fetch('/api/contacts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPhone, contactPhone }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Add / Publish Status
  async addStatus(status: StatusItem): Promise<boolean> {
    try {
      const res = await fetch('/api/statuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(status),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Subscribe to real-time Server-Sent Events (SSE) stream
  subscribeToEvents(
    phone: string,
    onEvent: (event: { type: string; payload: any; timestamp: number }) => void
  ): () => void {
    if (typeof window === 'undefined' || !window.EventSource) {
      return () => {};
    }

    let eventSource: EventSource | null = null;
    let isClosed = false;

    const connect = () => {
      if (isClosed) return;
      try {
        eventSource = new EventSource(`/api/events?phone=${encodeURIComponent(phone)}`);

        eventSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data && data.type) {
              onEvent(data);
            }
          } catch {
            // ignore heartbeat or parse errors
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Reconnect after 3 seconds
          if (!isClosed) {
            setTimeout(connect, 3000);
          }
        };
      } catch {
        if (!isClosed) {
          setTimeout(connect, 3000);
        }
      }
    };

    connect();

    return () => {
      isClosed = true;
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  },
};
