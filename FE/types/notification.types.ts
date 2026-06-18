// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType = 
  | 'like_post'
  | 'comment_post'
  | 'reply_comment'
  | 'like_comment'
  | 'follow'
  | 'mention'
  | 'share_post'
  | 'message'
  | 'system';

export interface Notification {
  id: number;
  user_id: number; // Người nhận notification
  type: NotificationType;
  title: string;
  content: string;
  is_read: boolean;
  created_at: Date;
  updated_at?: Date;
  // Metadata
  related_id?: number; // ID của post, comment, user, etc.
  related_type?: 'post' | 'comment' | 'user' | 'message';
  image_url?: string;
  // Relations
  sender?: {
    id: number;
    full_name: string;
    avatar?: string;
  };
  post?: {
    id: number;
    title: string;
    coverImage?: string;
  };
}

// ============================================
// NOTIFICATION REQUEST/RESPONSE TYPES
// ============================================

export interface CreateNotificationDto {
  user_id: number;
  type: NotificationType;
  title: string;
  content: string;
  related_id?: number;
  related_type?: 'post' | 'comment' | 'user' | 'message';
  image_url?: string;
  sender_id?: number;
}

export interface NotificationsResponse {
  success: boolean;
  data?: Notification[];
  unread_count?: number;
  error?: string;
}

export interface NotificationResponse {
  success: boolean;
  message?: string;
  data?: Notification;
  error?: string;
}

export interface MarkAsReadResponse {
  success: boolean;
  message: string;
  data?: {
    updated_count: number;
  };
}

// ============================================
// NOTIFICATION SETTINGS TYPES
// ============================================

export interface NotificationSettings {
  id: number;
  user_id: number;
  // Push notifications
  push_enabled: boolean;
  push_likes: boolean;
  push_comments: boolean;
  push_follows: boolean;
  push_messages: boolean;
  // Email notifications
  email_enabled: boolean;
  email_digest: 'daily' | 'weekly' | 'never';
  // In-app notifications
  inapp_enabled: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface UpdateNotificationSettingsDto {
  push_enabled?: boolean;
  push_likes?: boolean;
  push_comments?: boolean;
  push_follows?: boolean;
  push_messages?: boolean;
  email_enabled?: boolean;
  email_digest?: 'daily' | 'weekly' | 'never';
  inapp_enabled?: boolean;
}
