import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  setLogLevel,
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  updateDoc
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Message, User, Contact, Group } from '../types';
import { arePhonesMatching, cleanPhoneDigits } from './phoneMatcher';

// Silence verbose console connection logs
try {
  setLogLevel('silent');
} catch {
  // Safe fallback
}

// Initialize Firebase App safely with auto-detect long polling for robust cloud connectivity
let app: any = null;
let db: any = null;
let isQuotaExhausted = false;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined;

  try {
    db = dbId
      ? initializeFirestore(app, {
          experimentalAutoDetectLongPolling: true,
          ignoreUndefinedProperties: true,
        }, dbId)
      : initializeFirestore(app, {
          experimentalAutoDetectLongPolling: true,
          ignoreUndefinedProperties: true,
        });
  } catch {
    db = dbId ? getFirestore(app, dbId) : getFirestore(app);
  }
} catch {
  // Safe initialization fallback
}

export { db };

// In-memory cache to prevent redundant UI re-renders and freezing
const userCache = new Map<string, User>();
let typingTimeoutTimer: any = null;
let lastTypingSentTime = 0;

// Helper to check for quota, unavailability or connection errors
function isConnectionOrQuotaError(err: any): boolean {
  if (!err) return false;
  const code = err.code || '';
  const message = err.message || '';
  return (
    code === 'resource-exhausted' ||
    code === 'quota-exceeded' ||
    code === 'unavailable' ||
    code === 'failed-precondition' ||
    code === 'deadline-exceeded' ||
    message.includes('Cuota') ||
    message.includes('exhausted') ||
    message.includes('quota') ||
    message.includes('unavailable') ||
    message.includes('backend')
  );
}

export const firestoreService = {
  // 1. Register or update user with throttling and safety
  async registerUser(user: User): Promise<void> {
    if (!db || isQuotaExhausted) return;
    try {
      const cleanDigits = cleanPhoneDigits(user.phone) || user.id;
      if (!cleanDigits) return;

      const userRef = doc(db, 'users', cleanDigits);
      await setDoc(userRef, {
        id: user.id,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar || '',
        about: user.about || 'Disponible',
        isOnline: true,
        lastSeen: Date.now(),
      }, { merge: true });
    } catch (err: any) {
      if (isConnectionOrQuotaError(err)) {
        if (err?.code === 'resource-exhausted') isQuotaExhausted = true;
      }
    }
  },

  // 2. High-performance user listener with graceful error handling
  subscribeToUsers(onUsersUpdated: (users: User[]) => void): () => void {
    if (!db || isQuotaExhausted) return () => {};
    try {
      const usersCol = collection(db, 'users');
      const unsubscribe = onSnapshot(
        usersCol,
        (snapshot) => {
          let hasChanges = false;
          snapshot.docChanges().forEach((change) => {
            hasChanges = true;
            const data = change.doc.data();
            const userObj: User = {
              id: data.id || change.doc.id,
              name: data.name || 'Usuario',
              phone: data.phone || '',
              avatar: data.avatar || '',
              about: data.about || 'Disponible',
              isOnline: data.isOnline ?? true,
            };
            userCache.set(change.doc.id, userObj);
          });

          if (hasChanges || userCache.size === 0) {
            onUsersUpdated(Array.from(userCache.values()));
          }
        },
        (err) => {
          if (isConnectionOrQuotaError(err)) {
            if (err?.code === 'resource-exhausted') isQuotaExhausted = true;
          }
        }
      );
      return unsubscribe;
    } catch {
      return () => {};
    }
  },

  // 3. Instant Message Dispatch (Lightweight payload, protected)
  async sendMessage(message: Message): Promise<void> {
    if (!db || isQuotaExhausted) return;
    try {
      const msgRef = doc(db, 'messages', message.id);
      const cleanMsg: Record<string, any> = {};
      Object.entries(message).forEach(([k, v]) => {
        if (v !== undefined) cleanMsg[k] = v;
      });

      await setDoc(msgRef, cleanMsg, { merge: true });
    } catch (err: any) {
      if (isConnectionOrQuotaError(err)) {
        if (err?.code === 'resource-exhausted') isQuotaExhausted = true;
      }
    }
  },

  // 4. Smooth, non-blocking Message Listener with error safety
  subscribeToMessages(
    myPhone: string,
    onMessageChange: (changeType: 'added' | 'modified' | 'removed', msg: Message) => void
  ): () => void {
    if (!db || isQuotaExhausted) return () => {};
    try {
      const messagesCol = collection(db, 'messages');
      const q = query(messagesCol, orderBy('timestamp', 'asc'), limit(80));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data() as Message;
            const msgObj: Message = {
              ...data,
              id: change.doc.id,
            };

            if (!myPhone || arePhonesMatching(msgObj.senderPhone, myPhone) || arePhonesMatching(msgObj.receiverPhone, myPhone)) {
              onMessageChange(change.type, msgObj);
            }
          });
        },
        (err) => {
          if (isConnectionOrQuotaError(err)) {
            if (err?.code === 'resource-exhausted') isQuotaExhausted = true;
          }
        }
      );
      return unsubscribe;
    } catch {
      return () => {};
    }
  },

  // 5. Update message read / delivered status
  async updateMessageStatus(messageId: string, status: 'delivered' | 'read'): Promise<void> {
    if (!db || isQuotaExhausted) return;
    try {
      const msgRef = doc(db, 'messages', messageId);
      await updateDoc(msgRef, { status });
    } catch (err: any) {
      if (isConnectionOrQuotaError(err)) {
        if (err?.code === 'resource-exhausted') isQuotaExhausted = true;
      }
    }
  },

  // 6. Throttled typing indicator
  async setTyping(senderPhone: string, targetPhone: string, isTyping: boolean): Promise<void> {
    if (!db || isQuotaExhausted) return;
    const now = Date.now();
    if (isTyping && now - lastTypingSentTime < 2000) {
      return;
    }
    lastTypingSentTime = now;

    try {
      const cleanSender = cleanPhoneDigits(senderPhone);
      const cleanTarget = cleanPhoneDigits(targetPhone);
      if (!cleanSender || !cleanTarget) return;

      const typingRef = doc(db, 'typingStatus', `${cleanSender}_to_${cleanTarget}`);
      await setDoc(typingRef, {
        senderPhone,
        targetPhone,
        isTyping,
        timestamp: now,
      });

      if (isTyping) {
        if (typingTimeoutTimer) clearTimeout(typingTimeoutTimer);
        typingTimeoutTimer = setTimeout(async () => {
          try {
            if (!isQuotaExhausted) {
              await setDoc(typingRef, {
                senderPhone,
                targetPhone,
                isTyping: false,
                timestamp: Date.now(),
              });
            }
          } catch {
            // ignore
          }
        }, 3500);
      }
    } catch (err: any) {
      if (isConnectionOrQuotaError(err)) {
        if (err?.code === 'resource-exhausted') isQuotaExhausted = true;
      }
    }
  },

  // 7. Subscribe to typing status
  subscribeToTyping(
    myPhone: string,
    onTypingUpdated: (senderPhone: string, isTyping: boolean) => void
  ): () => void {
    if (!db || isQuotaExhausted) return () => {};
    try {
      const typingCol = collection(db, 'typingStatus');
      const unsubscribe = onSnapshot(
        typingCol,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            if (arePhonesMatching(data.targetPhone, myPhone)) {
              const isFresh = Date.now() - (data.timestamp || 0) < 4500;
              onTypingUpdated(data.senderPhone, data.isTyping && isFresh);
            }
          });
        },
        (err) => {
          if (isConnectionOrQuotaError(err)) {
            if (err?.code === 'resource-exhausted') isQuotaExhausted = true;
          }
        }
      );
      return unsubscribe;
    } catch {
      return () => {};
    }
  },

  // 8. Targeted Call Signaling
  async sendCallSignal(signal: {
    action: 'offer' | 'answer' | 'ice-candidate' | 'end' | 'reject';
    callerPhone: string;
    callerName?: string;
    callerAvatar?: string;
    targetPhone: string;
    callType: 'voice' | 'video';
    sdp?: any;
    candidate?: any;
    callId?: string;
  }): Promise<void> {
    if (!db || isQuotaExhausted) return;
    try {
      const cleanTarget = cleanPhoneDigits(signal.targetPhone);
      if (!cleanTarget) return;

      const signalRef = doc(db, 'callSignals', cleanTarget);
      await setDoc(signalRef, {
        ...signal,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      if (isConnectionOrQuotaError(err)) {
        if (err?.code === 'resource-exhausted') isQuotaExhausted = true;
      }
    }
  },

  // 9. Subscribe to Call Signals directed to this phone
  subscribeToCallSignals(
    myPhone: string,
    onSignalReceived: (signal: any) => void
  ): () => void {
    if (!db || isQuotaExhausted) return () => {};
    try {
      const cleanMyPhone = cleanPhoneDigits(myPhone);
      if (!cleanMyPhone) return () => {};

      const signalRef = doc(db, 'callSignals', cleanMyPhone);
      const unsubscribe = onSnapshot(
        signalRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (Date.now() - (data.timestamp || 0) < 15000) {
              onSignalReceived(data);
            }
          }
        },
        (err) => {
          if (isConnectionOrQuotaError(err)) {
            if (err?.code === 'resource-exhausted') isQuotaExhausted = true;
          }
        }
      );
      return unsubscribe;
    } catch {
      return () => {};
    }
  },

  // 10. Save Contact
  async saveContact(userPhone: string, contact: Contact): Promise<void> {
    if (!db || isQuotaExhausted) return;
    try {
      const cleanUser = cleanPhoneDigits(userPhone);
      const cleanContact = cleanPhoneDigits(contact.phone);
      if (!cleanUser || !cleanContact) return;

      const contactRef = doc(db, 'userContacts', `${cleanUser}_${cleanContact}`);
      await setDoc(contactRef, {
        userPhone,
        contact,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      if (isConnectionOrQuotaError(err)) {
        if (err?.code === 'resource-exhausted') isQuotaExhausted = true;
      }
    }
  },

  // 11. Delete Contact from Firestore
  async deleteContact(userPhone: string, contactPhone: string): Promise<void> {
    if (!db || isQuotaExhausted) return;
    try {
      const cleanUser = cleanPhoneDigits(userPhone);
      const cleanContact = cleanPhoneDigits(contactPhone);
      if (!cleanUser || !cleanContact) return;

      const contactRef = doc(db, 'userContacts', `${cleanUser}_${cleanContact}`);
      // Mark or remove contact doc safely
      await setDoc(contactRef, {
        userPhone,
        contactPhone,
        deleted: true,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      if (isConnectionOrQuotaError(err)) {
        if (err?.code === 'resource-exhausted') isQuotaExhausted = true;
      }
    }
  },

  // 12. Save Status to Firestore
  async saveStatus(status: any): Promise<void> {
    if (!db || isQuotaExhausted) return;
    try {
      const statusRef = doc(db, 'statuses', status.id);
      await setDoc(statusRef, {
        ...status,
        timestamp: status.timestamp || Date.now(),
      }, { merge: true });
    } catch (err: any) {
      if (isConnectionOrQuotaError(err)) {
        if (err?.code === 'resource-exhausted') isQuotaExhausted = true;
      }
    }
  },

  // 13. Subscribe to Real-Time Statuses from Firestore
  subscribeToStatuses(onStatusesUpdated: (statuses: any[]) => void): () => void {
    if (!db || isQuotaExhausted) return () => {};
    try {
      const statusesCol = collection(db, 'statuses');
      const q = query(statusesCol, orderBy('timestamp', 'desc'), limit(30));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const freshStatuses: any[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            // Filter only statuses within 24 hours
            if (Date.now() - (data.timestamp || 0) < 24 * 60 * 60 * 1000) {
              freshStatuses.push({
                ...data,
                id: docSnap.id,
              });
            }
          });
          if (freshStatuses.length > 0) {
            onStatusesUpdated(freshStatuses);
          }
        },
        (err) => {
          if (isConnectionOrQuotaError(err)) {
            if (err?.code === 'resource-exhausted') isQuotaExhausted = true;
          }
        }
      );
      return unsubscribe;
    } catch {
      return () => {};
    }
  },

  // 14. Save Group to Firestore
  async saveGroup(group: Group): Promise<void> {
    if (!db || isQuotaExhausted) return;
    try {
      const groupRef = doc(db, 'groups', group.id);
      await setDoc(groupRef, group, { merge: true });
    } catch (err: any) {
      if (isConnectionOrQuotaError(err)) {
        if (err?.code === 'resource-exhausted') isQuotaExhausted = true;
      }
    }
  },

  // 15. Subscribe to Groups
  subscribeToGroups(myPhone: string, onGroupsUpdated: (groups: Group[]) => void): () => void {
    if (!db || isQuotaExhausted) return () => {};
    try {
      const groupsCol = collection(db, 'groups');
      const unsubscribe = onSnapshot(
        groupsCol,
        (snapshot) => {
          const groups: Group[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Group;
            if (
              !myPhone ||
              data.members.some(memberPhone => arePhonesMatching(memberPhone, myPhone))
            ) {
              groups.push({
                ...data,
                id: docSnap.id,
              });
            }
          });
          onGroupsUpdated(groups);
        },
        (err) => {
          if (isConnectionOrQuotaError(err)) {
            if (err?.code === 'resource-exhausted') isQuotaExhausted = true;
          }
        }
      );
      return unsubscribe;
    } catch {
      return () => {};
    }
  }
};
