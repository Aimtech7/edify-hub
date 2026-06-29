import { apiClient } from './api-client';

export interface PrivateMessage {
  id: number;
  sender_username: string;
  sender_role?: string;
  content: string;
  attachment_url?: string | null;
  attachment_name?: string;
  attachment_size?: number;
  attachment_type?: string;
  status?: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: number;
  subject: string;
  participant_names: string[];
  participant_details?: { id: number; username: string; role: string }[];
  unread_count?: number;
  last_message?: {
    content: string;
    sender_username: string;
    created_at: string;
    status?: string;
  } | null;
  is_pinned?: boolean;
  is_archived?: boolean;
  updated_at: string;
  messages?: PrivateMessage[];
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  target_group: string;
  author_name: string;
  is_pinned: boolean;
  created_at: string;
}

export interface BroadcastMessage {
  id: number;
  title: string;
  message: string;
  channel: string;
  recipient_count: number;
  sent_by_name: string;
  sent_at: string;
}

export const communicationService = {
  getConversations: async (searchQuery = '') => {
    const params = searchQuery ? { q: searchQuery } : {};
    const res = await apiClient.get<Conversation[]>('/communication/conversations/', { params });
    return res.data;
  },

  getConversationDetails: async (id: number) => {
    const res = await apiClient.get<Conversation>(`/communication/conversations/${id}/`);
    return res.data;
  },

  createConversation: async (subject: string, participantIds: number[] = []) => {
    const res = await apiClient.post<Conversation>('/communication/conversations/', {
      subject,
      participant_ids: participantIds,
    });
    return res.data;
  },

  sendMessage: async (conversationId: number, content: string, file?: File | null) => {
    if (file) {
      const formData = new FormData();
      if (content) formData.append('content', content);
      formData.append('attachment', file);
      const res = await apiClient.post<PrivateMessage>(
        `/communication/conversations/${conversationId}/send_message/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return res.data;
    } else {
      const res = await apiClient.post<PrivateMessage>(
        `/communication/conversations/${conversationId}/send_message/`,
        { content }
      );
      return res.data;
    }
  },

  markAsRead: async (conversationId: number) => {
    const res = await apiClient.post(`/communication/conversations/${conversationId}/mark_read/`);
    return res.data;
  },

  togglePin: async (conversationId: number) => {
    const res = await apiClient.post<{ is_pinned: boolean }>(`/communication/conversations/${conversationId}/toggle_pin/`);
    return res.data;
  },

  toggleArchive: async (conversationId: number) => {
    const res = await apiClient.post<{ is_archived: boolean }>(`/communication/conversations/${conversationId}/toggle_archive/`);
    return res.data;
  },

  getAnnouncements: async () => {
    const res = await apiClient.get<Announcement[]>('/communication/announcements/');
    return res.data;
  },

  getBroadcasts: async () => {
    const res = await apiClient.get<BroadcastMessage[]>('/communication/broadcasts/');
    return res.data;
  },

  sendBroadcast: async (title: string, message: string, channel: string) => {
    const res = await apiClient.post<BroadcastMessage>('/communication/broadcasts/', {
      title,
      message,
      channel,
      recipient_count: Math.floor(Math.random() * 150) + 10,
    });
    return res.data;
  },
};
