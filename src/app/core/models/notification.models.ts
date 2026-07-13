import { PageQuery } from './api.models';

export interface NotificationQuery extends PageQuery {
  isRead?: boolean;
  type?: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  relatedEntityType: string | null;
  relatedEntityId: number | null;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface UnreadNotificationCount {
  count: number;
}

export interface DeadLetterNotification {
  id: string;
  occurredAt: string;
  attempts: number;
  deadLetteredAt: string | null;
  lastError: string | null;
}
