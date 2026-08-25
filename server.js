import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

// Universal Phone Number Normalizer & Matcher
function cleanPhoneDigits(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
}

function normalizePhone(phone) {
  if (!phone) return '';
  const cleaned = String(phone).trim();
  const digits = cleaned.replace(/\D/g, '');
  if (!digits) return '';
  return '+' + digits;
}

function arePhonesMatching(phoneA, phoneB) {
  if (!phoneA || !phoneB) return false;
  const rawA = String(phoneA).trim();
  const rawB = String(phoneB).trim();
  if (rawA === rawB) return true;

  const digitsA = cleanPhoneDigits(rawA);
  const digitsB = cleanPhoneDigits(rawB);
  if (!digitsA || !digitsB) return false;
  if (digitsA === digitsB) return true;

  const minLen = Math.min(digitsA.length, digitsB.length);
  if (minLen >= 7) {
    if (digitsA.slice(-7) === digitsB.slice(-7)) return true;
  }
  if (minLen >= 8) {
    if (digitsA.slice(-8) === digitsB.slice(-8)) return true;
  }
  if (digitsA.endsWith(digitsB) || digitsB.endsWith(digitsA)) return true;
  return false;
}

// In-memory persistent data store on the server
const store = {
  users: [
    {
      id: 'user_a',
      name: 'Alex (Estudiante)',
      phone: '+1 555 0101',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      about: '¡Hola! Estoy usando PurpleTalk 🟣',
      isOnline: true,
    },
    {
      id: 'user_b',
      name: 'Prof. Carlos Martínez',
      phone: '+1 555 0202',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      about: 'Profesor titular • Horario de consultas 9am - 6pm 📚',
      isOnline: true,
    },
  ],
  messages: [],
  contacts: {},
  statuses: [],
  calls: [],
};

const sseClients = [];

function broadcastSSE(type, payload, targetPhone) {
  const data = JSON.stringify({ type, payload, timestamp: Date.now() });
  const msg = `data: ${data}\n\n`;

  sseClients.forEach(client => {
    try {
      if (!targetPhone || targetPhone === 'all' || arePhonesMatching(client.phone, targetPhone)) {
        client.res.write(msg);
      }
    } catch {
      // client connection closed
    }
  });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  });
  res.end(JSON.stringify(data));
}

// API router
app.use(async (req, res, next) => {
  if (req.url && req.url.startsWith('/api')) {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    if (req.method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
      });
      res.end();
      return;
    }

    // SSE Events Stream
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

      const client = { id: clientId, phone, res };
      sseClients.push(client);

      res.write(`data: ${JSON.stringify({ type: 'CONNECTED', payload: { clientId, phone }, timestamp: Date.now() })}\n\n`);

      const heartbeat = setInterval(() => {
        try {
          res.write(': ping\n\n');
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      req.on('close', () => {
        clearInterval(heartbeat);
        const idx = sseClients.findIndex(c => c.id === clientId);
        if (idx >= 0) sseClients.splice(idx, 1);
      });
      return;
    }

    // Fast Global Sync
    if (pathname === '/api/sync' && req.method === 'GET') {
      const phone = url.searchParams.get('phone') || '';
      const userMessages = phone
        ? store.messages.filter(m => {
            return arePhonesMatching(m.senderPhone, phone) || arePhonesMatching(m.receiverPhone, phone);
          })
        : store.messages;

      let userContacts = [];
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
      return;
    }

    // Users register
    if (pathname === '/api/users/register' && req.method === 'POST') {
      try {
        const user = await parseBody(req);
        if (!user.phone) {
          sendJson(res, 400, { error: 'Phone required' });
          return;
        }

        const existingIdx = store.users.findIndex(u => arePhonesMatching(u.phone, user.phone) || u.id === user.id);
        if (existingIdx >= 0) {
          store.users[existingIdx] = { ...store.users[existingIdx], ...user, isOnline: true };
        } else {
          store.users.push({ ...user, isOnline: true });
        }
        broadcastSSE('USERS_UPDATED', store.users, 'all');
        sendJson(res, 200, { success: true, user: store.users.find(u => arePhonesMatching(u.phone, user.phone)) });
      } catch {
        sendJson(res, 400, { error: 'Invalid user payload' });
      }
      return;
    }

    // Users list
    if (pathname === '/api/users' && req.method === 'GET') {
      sendJson(res, 200, store.users);
      return;
    }

    // Messages post
    if (pathname === '/api/messages' && req.method === 'POST') {
      try {
        const msg = await parseBody(req);
        const existingIdx = store.messages.findIndex(m => m.id === msg.id);
        if (existingIdx >= 0) {
          store.messages[existingIdx] = msg;
        } else {
          store.messages.push(msg);
        }
        broadcastSSE('NEW_MESSAGE', msg, msg.receiverPhone);
        broadcastSSE('NEW_MESSAGE', msg, msg.senderPhone);
        sendJson(res, 200, { success: true, message: msg });
      } catch {
        sendJson(res, 400, { error: 'Invalid message payload' });
      }
      return;
    }

    // Read status
    if (pathname === '/api/messages/status' && req.method === 'POST') {
      try {
        const { messageIds, status, readerPhone } = await parseBody(req);
        const affectedSenders = new Set();

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

        affectedSenders.forEach(senderPhone => {
          broadcastSSE('MESSAGES_READ', { readerPhone, status }, senderPhone);
        });

        sendJson(res, 200, { success: true });
      } catch {
        sendJson(res, 400, { error: 'Invalid status payload' });
      }
      return;
    }

    // Typing
    if (pathname === '/api/typing' && req.method === 'POST') {
      try {
        const payload = await parseBody(req);
        broadcastSSE('TYPING_STATUS', payload, payload.targetPhone);
        sendJson(res, 200, { success: true });
      } catch {
        sendJson(res, 400, { error: 'Invalid typing payload' });
      }
      return;
    }

    // Calls signal
    if (pathname === '/api/calls/signal' && req.method === 'POST') {
      try {
        const signalPayload = await parseBody(req);
        broadcastSSE('CALL_SIGNAL', signalPayload, signalPayload.targetPhone);
        sendJson(res, 200, { success: true });
      } catch {
        sendJson(res, 400, { error: 'Invalid signal payload' });
      }
      return;
    }

    // Contacts
    if (pathname === '/api/contacts' && req.method === 'POST') {
      try {
        const { userPhone, contact } = await parseBody(req);
        const normMe = normalizePhone(userPhone);
        if (!store.contacts[normMe]) store.contacts[normMe] = [];
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
      return;
    }

    // Delete Contact
    if (pathname === '/api/contacts/delete' && req.method === 'POST') {
      try {
        const { userPhone, contactPhone } = await parseBody(req);
        const normMe = normalizePhone(userPhone);
        if (store.contacts[normMe]) {
          store.contacts[normMe] = store.contacts[normMe].filter(c => !arePhonesMatching(c.phone, contactPhone));
        }
        broadcastSSE('CONTACTS_UPDATED', { userPhone, contacts: store.contacts[normMe] || [] }, userPhone);
        sendJson(res, 200, { success: true, contacts: store.contacts[normMe] || [] });
      } catch {
        sendJson(res, 400, { error: 'Invalid delete contact payload' });
      }
      return;
    }
  }
  next();
});

// Serve frontend dist files
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>PurpleTalk</title>
        </head>
        <body>
          <div id="root">PurpleTalk Initializing...</div>
        </body>
      </html>
    `);
  }
});

app.listen(PORT, HOST, () => {
  console.log(`PurpleTalk Server running on http://${HOST}:${PORT}`);
});
