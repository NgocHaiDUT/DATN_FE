/**
 * Post entity - Represents a blog post or content post in the system
 */
export interface Post {
  id: number;
  user_id: number;
  shop_id?: number;
  post_type: string;
  title?: string;
  content_md: string;
  moderation_status: ModerationStatus;
  visibility: PostVisibility;
  view_count: number;
  like_count: number;
  comment_count?: number;
  created_at: Date;
  updated_at: Date;

  // Relations
  user?: {
    id: number;
    full_name: string;
    avatar_url?: string;
    email: string;
  };
  shop?: {
    id: number;
    name: string;
    logo_url?: string;
  };
  post_media?: PostMedia[];
  post_products?: PostProduct[];
  post_tags?: PostTag[];
}

/**
 * Post media (images/videos)
 */
export interface PostMedia {
  id: number;
  post_id: number;
  media_url: string;
  media_type: 'image' | 'video';
  sort_order: number;
  created_at: Date;
}

/**
 * Post product (tagged products)
 */
export interface PostProduct {
  post_id: number;
  product_id: number;
  product?: {
    id: number;
    name: string;
    slug: string;
    image?: string | null;
    hasTryOn?: boolean;
  };
}

/**
 * Post tag
 */
export interface PostTag {
  post_id: number;
  tag_id: number;
  tag?: {
    id: number;
    name: string;
    slug: string;
  };
}

/**
 * Moderation status enumeration
 */
export const ModerationStatus = {

  APPROVED: 'approved',
  REJECTED: 'rejected',
  REMOVED: 'removed',
} as const;

export type ModerationStatus = (typeof ModerationStatus)[keyof typeof ModerationStatus];

/**
 * Post visibility enumeration
 */
export const PostVisibility = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  FRIENDS: 'friends',
} as const;

export type PostVisibility = (typeof PostVisibility)[keyof typeof PostVisibility];

/**
 * Input data for creating a new post
 */
export interface CreatePostInput {
  user_id?: number;
  shop_id?: number;
  post_type?: string;
  title?: string;
  content_md: string;
  visibility?: PostVisibility;
  tags?: string[];
  product_ids?: number[];
}

/**
 * Input data for updating an existing post
 */
export interface UpdatePostInput {
  id: number;
  title?: string;
  content_md?: string;
  visibility?: PostVisibility;
  tags?: string[];
  product_ids?: number[];
}

/**
 * Moderation action input
 */
export interface ModerationActionInput {
  post_id: number;
  action: 'approve' | 'reject';
  reason?: string;
}
