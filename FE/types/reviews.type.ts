// ============================================
// REVIEW TYPES
// ============================================

export interface ProductReview {
  id: number;
  user_id: number;
  product_id: number;
  rating: number;
  title?: string;
  content?: string;
  media_url?: string;
  is_verified_purchase: boolean;
  created_at: string;
  user?: {
    id: number;
    full_name: string;
    avatar_url?: string;
  };
  product?: {
    id: number;
    name: string;
    slug: string;
  };
}

// Alias for backward compatibility
export type Review = ProductReview;

export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface ProductRatingSummary {
  avg_rating: number;
  review_count: number;
  distribution: RatingDistribution;
}

// ============================================
// DTO TYPES
// ============================================

export interface CreateReviewDto {
  product_id: number;
  rating: number;
  title?: string;
  content?: string;
  media_url?: string;
  is_verified_purchase?: boolean;
}

export interface UpdateReviewDto {
  rating?: number;
  title?: string;
  content?: string;
  media_url?: string;
}

export interface QueryReviewsDto {
  product_id?: number;
  user_id?: number;
  rating?: number;
  page?: number;
  limit?: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ReviewResponse {
  success: boolean;
  message?: string;
  data?: ProductReview;
  error?: string;
}

export interface ReviewsResponse {
  success: boolean;
  data?: ProductReview[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error?: string;
}

export interface RatingSummaryResponse {
  success: boolean;
  data?: ProductRatingSummary;
  error?: string;
}
