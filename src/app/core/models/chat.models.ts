import { PageQuery } from './api.models';

export type ChatQuery = PageQuery;
export type MessageQuery = PageQuery;

export interface CreateChatRequest {
  message: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface Chat {
  id: number;
  carId: number;
  carTitle: string;
  otherUserId: number;
  otherUserName: string;
  otherUserImageUrl: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface ChatMessage {
  id: number;
  chatId: number;
  senderId: number;
  senderName: string;
  content: string;
  sentAt: string;
  isRead: boolean;
}

export interface MarkMessagesReadResult {
  markedReadCount: number;
}
