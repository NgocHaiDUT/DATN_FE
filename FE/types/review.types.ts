export interface ReviewUser {
    id: number;
    full_name: string;
    avatar_url: string | null;
}

export interface ReviewProduct {
    id: number;
    name: string;
    slug: string;
}

export interface Review {
    id: number;
    user_id: number;
    product_id: number;
    rating: number;
    title: string | null;
    content: string | null;
    media_url: string | null;
    created_at: string;
    is_verified_purchase: boolean;
    user: ReviewUser;
    product?: ReviewProduct;
}

export interface ReviewStats {
    avg_rating: number;
    review_count: number;
    distribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
}

export interface CreateReviewRequest {
    product_id: number;
    rating: number;
    title?: string;
    content?: string;
    media_url?: string;
    is_verified_purchase?: boolean;
}

export interface UpdateReviewRequest {
    rating?: number;
    title?: string;
    content?: string;
    media_url?: string;
}

export interface ReviewResponse {
    success: boolean;
    data: Review;
    message?: string;
}

export interface ReviewsListResponse {
    success: boolean;
    data: Review[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface ReviewStatsResponse {
    success: boolean;
    data: ReviewStats;
}
