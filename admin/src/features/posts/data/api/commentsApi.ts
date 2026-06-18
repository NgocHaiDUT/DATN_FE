const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

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

export interface Comment {
    id: number;
    user_id: number;
    target_type: string;
    target_id: number;
    content: string;
    parent_id: number | null;
    created_at: Date;
    user?: {
        id: number;
        full_name: string | null;
        email: string;
        avatar_url?: string | null;
    };
    replies?: Comment[];
    replies_count?: number;
    likes_count?: number;
    is_liked?: boolean;
}

export interface CommentsResponse {
    data: Comment[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

/**
 * Fetch comments for a specific post
 */
export async function fetchPostComments(postId: number): Promise<Comment[]> {
    const url = `${API_BASE_URL}/comments?target_type=post&target_id=${postId}&limit=100`;
    const response = await fetchWithAuth(url);
    return response.data || [];
}

/**
 * Fetch replies for a specific comment
 */
export async function fetchCommentReplies(commentId: number): Promise<Comment[]> {
    const url = `${API_BASE_URL}/comments/${commentId}/replies`;
    const response = await fetchWithAuth(url);
    return response.data || response || [];
}
