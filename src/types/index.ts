export interface User {
  id: string;
  name: string;
  phone: string; // E.g., "+34 612 345 678" or "+1 555 0101"
  avatar: string;
  about: string;
  isOnline: boolean;
  lastSeen?: string;
  customWallpaper?: string;
}

export interface Contact {
  id: string;
  userId: string; // The user ID if they are registered
  name: string;
  phone: string;
  avatar: string;
  about: string;
  isRegistered: boolean;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar: string;
  createdByPhone: string;
  createdAt: number;
  members: string[]; // List of member phone numbers
  admins: string[]; // List of admin phone numbers
}

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'call_log';

export interface MessageReaction {
  emoji: string;
  userId: string;
  userName: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderPhone: string;
  senderName?: string;
  senderAvatar?: string;
  receiverId: string;
  receiverPhone: string;
  isGroup?: boolean;
  groupId?: string;
  type: MessageType;
  content: string; // text content, image/video base64 URL or audio data URL
  mediaUrl?: string;
  mediaName?: string;
  mediaSize?: string;
  mediaDuration?: number; // for audio/video in seconds
  timestamp: number;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  reactions?: MessageReaction[];
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
    type: MessageType;
  };
  deletedForEveryone?: boolean;
  isStarred?: boolean;
  isEdited?: boolean;
  isForwarded?: boolean;
}

export interface Chat {
  id: string;
  participantPhones: string[]; // Phone numbers of participants
  contactPhone: string;
  isGroup?: boolean;
  groupId?: string;
  groupName?: string;
  groupAvatar?: string;
  unreadCount: number;
  lastMessage?: Message;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  updatedAt: number;
}

export interface CallRecord {
  id: string;
  callerId: string;
  callerName: string;
  callerPhone: string;
  callerAvatar: string;
  receiverId: string;
  receiverName: string;
  receiverPhone: string;
  receiverAvatar: string;
  type: 'voice' | 'video';
  direction: 'incoming' | 'outgoing' | 'missed';
  timestamp: number;
  durationSeconds?: number;
  status: 'completed' | 'missed' | 'declined' | 'busy';
}

export interface StatusItem {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userAvatar: string;
  type: 'image' | 'text';
  content: string; // text or image url
  caption?: string;
  backgroundColor?: string;
  timestamp: number;
  viewedBy?: string[]; // user IDs who saw this
}

export type TabType = 'chats' | 'status' | 'calls' | 'contacts' | 'settings';

export interface ActiveCallState {
  callId: string;
  peerId: string;
  peerName: string;
  peerPhone: string;
  peerAvatar: string;
  type: 'voice' | 'video';
  direction: 'incoming' | 'outgoing';
  status: 'calling' | 'ringing' | 'connected' | 'ended';
  startTime?: number;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeakerOn: boolean;
  isScreenSharing: boolean;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
}
