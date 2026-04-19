export interface Conversation {
  id: string;
  profileAId: string;
  profileBId: string;
  lastMessageAt: string | null;
  unreadCount: number;
  peerName: string;
  peerPhotoUrl: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderProfileId: string;
  body: string;
  mediaUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

export type InterestStatus = 'SENT' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN';

export interface Interest {
  id: string;
  fromProfileId: string;
  toProfileId: string;
  status: InterestStatus;
  sentAt: string;
  respondedAt: string | null;
}

export type SocketEvent =
  | { type: 'message:new'; message: Message }
  | { type: 'message:read'; conversationId: string; readerProfileId: string; at: string }
  | { type: 'typing'; conversationId: string; profileId: string; isTyping: boolean }
  | { type: 'presence:update'; profileId: string; isOnline: boolean }
  | { type: 'interest:new'; interest: Interest };
