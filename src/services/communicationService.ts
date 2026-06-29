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
  is_edited?: boolean;
  is_deleted?: boolean;
  reply_to_preview?: { id: number; sender_username: string; content: string } | null;
  reactions?: Record<string, string[]>;
  is_starred_by_me?: boolean;
  mentions_list?: string[];
  metadata?: any;
  created_at: string;
}

export interface Conversation {
  id: number;
  type?: 'DIRECT' | 'GROUP' | 'COURSE';
  subject: string;
  avatar_url?: string;
  course_channel?: string;
  participant_names: string[];
  participant_details?: { id: number; username: string; role: string; presence?: string }[];
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
  priority?: 'NORMAL' | 'IMPORTANT' | 'URGENT' | 'EMERGENCY';
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

export interface AdminStats {
  messages_today: number;
  unread_messages: number;
  online_users: number;
  ai_conversations: number;
  storage_status: string;
}

export const communicationService = {
  getConversations: async (searchQuery = '', type = '') => {
    const params: any = {};
    if (searchQuery) params.q = searchQuery;
    if (type) params.type = type;
    const res = await apiClient.get<Conversation[]>('/communication/conversations/', { params });
    return res.data;
  },

  getConversationDetails: async (id: number) => {
    const res = await apiClient.get<Conversation>(`/communication/conversations/${id}/`);
    return res.data;
  },

  createConversation: async (subject: string, participantIds: number[] = [], type = 'DIRECT', courseChannel = '') => {
    const res = await apiClient.post<Conversation>('/communication/conversations/', {
      subject,
      participant_ids: participantIds,
      type,
      course_channel: courseChannel,
    });
    return res.data;
  },

  sendMessage: async (
    conversationId: number,
    content: string,
    file?: File | Blob | null,
    fileName?: string,
    replyToId?: number,
    metadata?: any
  ) => {
    if (file) {
      const formData = new FormData();
      if (content) formData.append('content', content);
      if (fileName && file instanceof Blob) {
        formData.append('attachment', file, fileName);
      } else {
        formData.append('attachment', file as Blob);
      }
      if (replyToId) formData.append('reply_to_id', String(replyToId));
      if (metadata) formData.append('metadata', JSON.stringify(metadata));

      const res = await apiClient.post<PrivateMessage>(
        `/communication/conversations/${conversationId}/send_message/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return res.data;
    } else {
      const res = await apiClient.post<PrivateMessage>(
        `/communication/conversations/${conversationId}/send_message/`,
        { content, reply_to_id: replyToId, metadata }
      );
      return res.data;
    }
  },

  askAI: async (conversationId: number, prompt: string) => {
    const res = await apiClient.post<PrivateMessage>(`/communication/conversations/${conversationId}/ask_ai/`, {
      prompt,
    });
    return res.data;
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

  toggleReaction: async (messageId: number, emoji: string) => {
    const res = await apiClient.post<PrivateMessage>(`/communication/messages/${messageId}/toggle_reaction/`, { emoji });
    return res.data;
  },

  toggleStar: async (messageId: number) => {
    const res = await apiClient.post<{ is_starred: boolean }>(`/communication/messages/${messageId}/toggle_star/`);
    return res.data;
  },

  editMessage: async (messageId: number, content: string) => {
    const res = await apiClient.post<PrivateMessage>(`/communication/messages/${messageId}/edit_message/`, { content });
    return res.data;
  },

  deleteForEveryone: async (messageId: number) => {
    const res = await apiClient.post<PrivateMessage>(`/communication/messages/${messageId}/delete_for_everyone/`);
    return res.data;
  },

  updatePresence: async (presence_status: string, custom_status?: string, mute_all?: boolean) => {
    const res = await apiClient.post('/communication/profiles/update_presence/', {
      presence_status,
      custom_status,
      mute_all,
    });
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

  getAdminStats: async () => {
    const res = await apiClient.get<AdminStats>('/communication/admin-stats/');
    return res.data;
  },
};
