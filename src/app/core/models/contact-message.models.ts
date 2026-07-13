import { PageQuery } from './api.models';

export interface ContactMessageQuery extends PageQuery {
  isRead?: boolean;
}

export interface CreateContactMessageRequest {
  name: string;
  email: string;
  subject: string;
  phoneNumber?: string | null;
  message: string;
}

export interface ContactMessage {
  id: number;
  carId: number;
  carTitle: string;
  name: string;
  email: string;
  subject: string;
  phoneNumber: string | null;
  message: string;
  createdAt: string;
  isRead: boolean;
}
