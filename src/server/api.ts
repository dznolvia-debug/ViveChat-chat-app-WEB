import type { IncomingMessage, ServerResponse } from 'http';
import { User, Contact, Message, StatusItem, CallRecord, Group } from '../types';
import { INITIAL_USERS, INITIAL_CONTACTS, INITIAL_MESSAGES, INITIAL_STATUSES, INITIAL_CALLS } from '../utils/mockData';
import { arePhonesMatching, cleanPhoneDigits, normalizePhone } from '../utils/phoneMatcher';

// In-memory data store on the server
interface ServerStore {
  users: User[];
  contacts: Record<string, Contact[]>; // phone -> contacts
  messages: Message[];
  statuses: StatusItem[];
  calls: CallRecord[];
  groups: Group[];
}

const store: ServerStore = {
  users: [...INITIAL_USERS],
  contacts: { ...INITIAL_CONTACTS },
  messages: [...INITIAL_MESSAGES],
  statuses: [...INITIAL_STATUSES],
  calls: [...INITIAL_CALLS],
  groups: [],
};

// SSE active client connections mapped by phone
interface SSEClient {
  id: string;
  phone: string;
  res: ServerResponse;
}

const sseClients: SSEClient[] = [];

// Broadcast event to relevant SSE clients using flexible phone matching
export function broadcastSSE(type: string, payload: any, targetPhone?: string) {
  const data = JSON.stringify({ type, payload, timestamp: Date.now() });
  const msg = `data: ${data}\n\n`;

  sseClients.forEach(client => {
    try {
      if (!targetPhone || targetPhone === 'all' || arePhonesMatching(client.phone, targetPhone)) {
        client.res.write(msg);
      }
    } catch {
      // client connection dead
    }
  });
}

// Helper to parse JSON body
function parseBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : ({} as T));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, data: any) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  });
  res.end(JSON.stringify(data));
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
    });
    res.end();
    return true;
  }

  // 1. SSE Stream: GET /api/events?phone=+15550101
  if (pathname === '/api/events' && req.method === 'GET') {
    const phone = url.searchParams.get('phone') || '';
    const clientId = 'sse_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    });

    const client: SSEClient = { id: clientId, phone, res };
    sseClients.push(client);

    // Initial connect ping
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', payload: { clientId, phone }, timestamp: Date.now() })}\n\n`);

    // Heartbeat ping interval to keep connection alive
    const heartbeat = setInterval(() => {
      try {
        res.write(`: ping\n\n`);
      } catch {
        clearInterval(heartbeat);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
      const idx = sseClients.findIndex(c => c.id === clientId);
      if (idx >= 0) sseClients.splice(idx, 1);
    });

    return true;
  }

  // 2. Global Sync: GET /api/sync?phone=+50497332145
  if (pathname === '/api/sync' && req.method === 'GET') {
    const phone = url.searchParams.get('phone') || '';

    // Filter messages for this user
    const userMessages = phone
      ? store.messages.filter(m => {
          return arePhonesMatching(m.senderPhone, phone) || arePhonesMatching(m.receiverPhone, phone);
        })
      : store.messages;

    // Find contacts registered for this phone
    let userContacts: Contact[] = [];
    Object.keys(store.contacts).forEach(savedPhone => {
      if (arePhonesMatching(savedPhone, phone)) {
        userContacts = [...userContacts, ...store.contacts[savedPhone]];
      }
    });

    sendJson(res, 200, {
      users: store.users,
      messages: userMessages,
      statuses: store.statuses,
      calls: store.calls,
      contacts: userContacts,
    });
    return true;
  }

  // 3. User Register/Update: POST /api/users/register
  if (pathname === '/api/users/register' && req.method === 'POST') {
    try {
      const user = await parseBody<User>(req);
      if (!user.phone) {
        sendJson(res, 400, { error: 'Phone is required' });
        return true;
      }

      const existingIdx = store.users.findIndex(u => arePhonesMatching(u.phone, user.phone) || u.id === user.id);
      if (existingIdx >= 0) {
        store.users[existingIdx] = {
          ...store.users[existingIdx],
          ...user,
          isOnline: true,
        };
      } else {
        store.users.push({
          ...user,
          isOnline: true,
        });
      }

      broadcastSSE('USERS_UPDATED', store.users, 'all');
      sendJson(res, 200, { success: true, user: store.users.find(u => arePhonesMatching(u.phone, user.phone)) });
    } catch {
      sendJson(res, 400, { error: 'Invalid user payload' });
    }
    return true;
  }

  // 4. Get Users: GET /api/users
  if (pathname === '/api/users' && req.method === 'GET') {
    sendJson(res, 200, store.users);
    return true;
  }

  // 5. Send Message: POST /api/messages
  if (pathname === '/api/messages' && req.method === 'POST') {
    try {
      const msg = await parseBody<Message>(req);
      const existingIdx = store.messages.findIndex(m => m.id === msg.id);

      if (existingIdx >= 0) {
        store.messages[existingIdx] = msg;
      } else {
        store.messages.push(msg);
      }

      if (msg.isGroup && msg.groupId) {
        const grp = store.groups.find(g => g.id === msg.groupId);
        if (grp) {
          grp.members.forEach(memberPhone => {
            broadcastSSE('NEW_MESSAGE', msg, memberPhone);
          });
        } else {
          broadcastSSE('NEW_MESSAGE', msg, 'all');
        }
      } else {
        // Broadcast to receiver and sender using flexible matching
        broadcastSSE('NEW_MESSAGE', msg, msg.receiverPhone);
        broadcastSSE('NEW_MESSAGE', msg, msg.senderPhone);
      }

      sendJson(res, 200, { success: true, message: msg });
    } catch {
      sendJson(res, 400, { error: 'Invalid message payload' });
    }
    return true;
  }

  // 6. Update Message Read Status: POST /api/messages/status
  if (pathname === '/api/messages/status' && req.method === 'POST') {
    try {
      const { messageIds, status, readerPhone } = await parseBody<{
        messageIds?: string[];
        status: 'read' | 'delivered';
        readerPhone: string;
      }>(req);

      const affectedSenders = new Set<string>();

      store.messages = store.messages.map(m => {
        if (
          arePhonesMatching(m.receiverPhone, readerPhone) &&
          (!messageIds || messageIds.includes(m.id))
        ) {
          affectedSenders.add(m.senderPhone);
          return { ...m, status };
        }
        return m;
      });

      // Notify the senders that their messages have been read
      affectedSenders.forEach(senderPhone => {
        broadcastSSE('MESSAGES_READ', { readerPhone, status }, senderPhone);
      });

      sendJson(res, 200, { success: true });
    } catch {
      sendJson(res, 400, { error: 'Invalid status payload' });
    }
    return true;
  }

  // 7. Typing Indicator: POST /api/typing
  if (pathname === '/api/typing' && req.method === 'POST') {
    try {
      const payload = await parseBody<{
        senderPhone: string;
        targetPhone: string;
        isTyping: boolean;
      }>(req);

      broadcastSSE('TYPING_STATUS', payload, payload.targetPhone);
      sendJson(res, 200, { success: true });
    } catch {
      sendJson(res, 400, { error: 'Invalid typing payload' });
    }
    return true;
  }

  // 8. Call Signaling: POST /api/calls/signal
  if (pathname === '/api/calls/signal' && req.method === 'POST') {
    try {
      const signalPayload = await parseBody<{
        action: 'offer' | 'answer' | 'ice-candidate' | 'end' | 'reject';
        callerPhone: string;
        callerName?: string;
        callerAvatar?: string;
        targetPhone: string;
        callType: 'voice' | 'video';
        sdp?: any;
        candidate?: any;
      }>(req);

      // Forward WebRTC signal to target phone
      broadcastSSE('CALL_SIGNAL', signalPayload, signalPayload.targetPhone);
      sendJson(res, 200, { success: true });
    } catch {
      sendJson(res, 400, { error: 'Invalid signal payload' });
    }
    return true;
  }

  // 9. Save Contact: POST /api/contacts
  if (pathname === '/api/contacts' && req.method === 'POST') {
    try {
      const { userPhone, contact } = await parseBody<{ userPhone: string; contact: Contact }>(req);
      const normMe = normalizePhone(userPhone);

      if (!store.contacts[normMe]) {
        store.contacts[normMe] = [];
      }

      const existingIdx = store.contacts[normMe].findIndex(c => arePhonesMatching(c.phone, contact.phone));
      if (existingIdx >= 0) {
        store.contacts[normMe][existingIdx] = contact;
      } else {
        store.contacts[normMe].unshift(contact);
      }

      broadcastSSE('CONTACTS_UPDATED', { userPhone, contacts: store.contacts[normMe] }, userPhone);
      sendJson(res, 200, { success: true, contacts: store.contacts[normMe] });
    } catch {
      sendJson(res, 400, { error: 'Invalid contact payload' });
    }
    return true;
  }

  // 10. Delete Contact: POST /api/contacts/delete
  if (pathname === '/api/contacts/delete' && req.method === 'POST') {
    try {
      const { userPhone, contactPhone } = await parseBody<{ userPhone: string; contactPhone: string }>(req);
      const normMe = normalizePhone(userPhone);

      if (store.contacts[normMe]) {
        store.contacts[normMe] = store.contacts[normMe].filter(c => !arePhonesMatching(c.phone, contactPhone));
      }

      // Also remove all messages between userPhone and contactPhone from store
      store.messages = store.messages.filter(m => {
        const isBetween =
          (arePhonesMatching(m.senderPhone, userPhone) && arePhonesMatching(m.receiverPhone, contactPhone)) ||
          (arePhonesMatching(m.receiverPhone, userPhone) && arePhonesMatching(m.senderPhone, contactPhone));
        return !isBetween;
      });

      broadcastSSE('CONTACTS_UPDATED', { userPhone, contacts: store.contacts[normMe] || [] }, userPhone);
      broadcastSSE('MESSAGES_UPDATED', store.messages, userPhone);
      sendJson(res, 200, { success: true, contacts: store.contacts[normMe] || [] });
    } catch {
      sendJson(res, 400, { error: 'Invalid delete contact payload' });
    }
    return true;
  }

  // 11. Add/Publish Status: POST /api/statuses
  if (pathname === '/api/statuses' && req.method === 'POST') {
    try {
      const newStatus = await parseBody<StatusItem>(req);
      if (!newStatus.id) {
        newStatus.id = 'st_' + Date.now();
      }
      newStatus.timestamp = newStatus.timestamp || Date.now();

      // Add to store and keep last 30
      store.statuses = [newStatus, ...store.statuses.filter(s => s.id !== newStatus.id)].slice(0, 30);

      // Broadcast immediately to all connected clients via SSE
      broadcastSSE('STATUSES_UPDATED', store.statuses, 'all');
      sendJson(res, 200, { success: true, status: newStatus });
    } catch {
      sendJson(res, 400, { error: 'Invalid status payload' });
    }
    return true;
  }

  // 12. Groups: POST /api/groups
  if (pathname === '/api/groups' && req.method === 'POST') {
    try {
      const group = await parseBody<Group>(req);
      const idx = store.groups.findIndex(g => g.id === group.id);
      if (idx >= 0) {
        store.groups[idx] = group;
      } else {
        store.groups.push(group);
      }
      group.members.forEach(memberPhone => {
        broadcastSSE('GROUPS_UPDATED', store.groups, memberPhone);
      });
      sendJson(res, 200, { success: true, group });
    } catch {
      sendJson(res, 400, { error: 'Invalid group payload' });
    }
    return true;
  }

  // 13. Get Groups: GET /api/groups
  if (pathname === '/api/groups' && req.method === 'GET') {
    const phone = url.searchParams.get('phone') || '';
    if (!phone) {
      sendJson(res, 200, store.groups);
    } else {
      const myGroups = store.groups.filter(g => g.members.some(m => arePhonesMatching(m, phone)));
      sendJson(res, 200, myGroups);
    }
    return true;
  }

  return false;
}
