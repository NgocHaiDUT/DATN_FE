// ============================================
// CHAT TYPES
// ============================================

export interface UserInfo {
  Id: number;
  Fullname: string;
  Avatar?: string;
}

export interface ChatMessage {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  createdAt: string;
  status?: boolean;
  sender?: { Id: number; Fullname: string; Avatar?: string };
  receiver?: { Id: number; Fullname: string; Avatar?: string };
  // ✅ Add shared post support
  sharedPostId?: number;
  messageType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'SHARE_POST' | 'SHARE_PRODUCT'; // ✅ Use enum values
  sharedPost?: {
    id: number;
    title: string;
    image?: string;
    images?: Array<{ Id: number; Url: string; Order: number }>;
    author: string;
    avatar?: string;
    timeAgo: string;
    videoUrl?: string; // ✅ Add videoUrl
    postType?: 'post' | 'video'; // ✅ Add postType
  };
  // ✅ Add reactions support
  reactions?: Array<{
    emoji: string;
    count: number;
    users: number[];
  }>;
  // ✅ Add media files support
  mediaFiles?: Array<{
    id?: number;
    url: string;
    type: 'image' | 'video' | 'file';
    fileName?: string;
    fileSize?: number;
    duration?: number;
    thumbnailUrl?: string;
  }>;
}

export interface Message {
  id: number;
  conversation_id: string;
  sender_id: number;
  receiver_id: number;
  content: string;
  message_type: 'text' | 'image' | 'video' | 'file';
  is_read: boolean;
  created_at: Date;
  updated_at?: Date;
  // Relations
  sender?: UserInfo;
  receiver?: UserInfo;
}

export interface ConversationSummaryItem {
  id: number;
  type: string;
  created_at: string;
  participants: Array<{
    user_id: number;
    user: {
      id: number;
      full_name: string;
      avatar_url?: string;
    };
  }>;
  last_message?: {
    id: number;
    content: string;
    created_at: string;
    sender: {
      id: number;
      full_name: string;
    };
  };
  unread_count?: number;
}

export interface ConversationWithMessages {
  with: UserInfo;
  messages: ChatMessage[];
}

// ============================================
// CHAT REQUEST/RESPONSE TYPES
// ============================================

export interface SendMessageRequest {
  conversation_id?: string;
  sender_id: number;
  receiver_id: number;
  content: string;
  message_type?: 'text' | 'image' | 'video' | 'file';
}

export interface MarkAsReadRequest {
  conversation_id: string;
  user_id: number;
}

export interface ConversationsResponse {
  success: boolean;
  data?: ConversationSummaryItem[];
  error?: string;
}

export interface MessagesResponse {
  success: boolean;
  data?: Message[];
  error?: string;
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  data?: Message;
  error?: string;
}

// ============================================
// SOCKET EVENT TYPES
// ============================================

export interface SocketEvents {
  // Emit events
  join: (userId: number) => void;
  sendMessage: (data: SendMessageRequest) => void;
  markAsRead: (data: MarkAsReadRequest) => void;
  
  // Listen events
  onNewMessage: (callback: (message: ChatMessage) => void) => void;
  onConversationUpdate: (callback: (data: ConversationWithMessages) => void) => void;
  onConversationRead: (callback: (data: { userId: number; partnerId: number }) => void) => void;
  onConnect: (callback: () => void) => void;
  onDisconnect: (callback: () => void) => void;
}
