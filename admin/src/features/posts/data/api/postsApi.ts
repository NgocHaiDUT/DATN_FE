import type { Post, ModerationActionInput, CreatePostInput, UpdatePostInput } from '../../domain/entities/Post';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

/**
 * Build full API URL
 */
function buildUrl(path: string): string {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('access_token');
}

/**
 * Make authenticated API request
 */
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Query parameters for fetching posts
 */
export interface GetPostsParams {
  moderation_status?: 'approved' | 'rejected' | 'removed';
  visibility?: 'public' | 'private' | 'friends';
  search?: string;
  user_id?: number;
  shop_id?: number;
  post_type?: string;
  page?: number;
  limit?: number;
}

/**
 * API response for posts list
 */
export interface PostsResponse {
  success: boolean;
  data?: Post[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  message?: string;
}

/**
 * API response for single post
 */
export interface PostResponse {
  success: boolean;
  data?: Post;
  message?: string;
}

/**
 * PostsApi - API client for posts endpoints
 */
export class PostsApi {
  /**
   * Fetch all posts with optional filters
   */
  async getPosts(params?: GetPostsParams): Promise<PostsResponse> {
    const queryParams = new URLSearchParams();

    if (params?.moderation_status) {
      queryParams.set('moderation_status', params.moderation_status);
    }
    if (params?.visibility) {
      queryParams.set('visibility', params.visibility);
    }
    if (params?.search) {
      queryParams.set('search', params.search);
    }
    if (params?.user_id) {
      queryParams.set('user_id', params.user_id.toString());
    }
    if (params?.shop_id) {
      queryParams.set('shop_id', params.shop_id.toString());
    }
    if (params?.post_type) {
      queryParams.set('post_type', params.post_type);
    }
    if (params?.page) {
      queryParams.set('page', params.page.toString());
    }
    if (params?.limit) {
      queryParams.set('limit', params.limit.toString());
    }

    const queryString = queryParams.toString();
    const url = buildUrl(`/posts${queryString ? `?${queryString}` : ''}`);

    return fetchWithAuth(url);
  }

  /**
   * Fetch a single post by ID
   */
  async getPostById(id: number): Promise<PostResponse> {
    const url = buildUrl(`/posts/${id}`);
    return fetchWithAuth(url);
  }

  /**
   * Delete a post
   */
  async deletePost(id: number): Promise<PostResponse> {
    const url = buildUrl(`/posts/${id}`);
    return fetchWithAuth(url, {
      method: 'DELETE',
    });
  }

  /**
   * Approve a post (moderation action)
   */
  async approvePost(postId: number, reason?: string): Promise<PostResponse> {
    const url = buildUrl(`/posts/${postId}/moderate`);
    return fetchWithAuth(url, {
      method: 'PATCH',
      body: JSON.stringify({
        action: 'approved',
        reason,
      }),
    });
  }

  /**
   * Reject a post (moderation action)
   */
  async rejectPost(postId: number, reason?: string): Promise<PostResponse> {
    const url = buildUrl(`/posts/${postId}/moderate`);
    return fetchWithAuth(url, {
      method: 'PATCH',
      body: JSON.stringify({
        action: 'rejected',
        reason,
      }),
    });
  }

  /**
   * Create a new post
   */
  async createPost(input: CreatePostInput): Promise<PostResponse> {
    const url = buildUrl('/posts');
    return fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Update an existing post
   */
  async updatePost(input: UpdatePostInput): Promise<PostResponse> {
    const url = buildUrl(`/posts/${input.id}`);
    return fetchWithAuth(url, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  /**
   * Moderate a post (generic moderation action)
   */
  async moderatePost(input: ModerationActionInput): Promise<PostResponse> {
    const url = buildUrl(`/posts/${input.post_id}/moderate`);
    return fetchWithAuth(url, {
      method: 'PATCH',
      body: JSON.stringify({
        action: input.action,
        reason: input.reason,
      }),
    });
  }

  /**
   * Get moderation statistics
   */
  async getModerationStats(): Promise<{
    success: boolean;
    data?: {
      pending: number;
      approved: number;
      rejected: number;
      removed: number;
      total: number;
    };
  }> {
    const url = buildUrl('/posts/stats/moderation');
    return fetchWithAuth(url);
  }
}

// Export singleton instance
export const postsApi = new PostsApi();
