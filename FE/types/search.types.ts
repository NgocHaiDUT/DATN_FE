export type SearchableType = 'post' | 'user' | 'shop' | 'hashtag' | 'product';

export interface PostSearchResult {
  type: 'post';
  id: number; 
  relevance_score?: number;
  title: string | null; // post.title [cite: 66]
  content_snippet: string; // [cite: 66]
  user: {
    id: number; // user.id
    full_name: string | null; // user.full_name [cite: 4]
    avatar_url: string | null; // user.avatar_url [cite: 5]
  };
  like_count: number; // post.like_count [cite: 67]
  comment_count: number; // (Tính toán)
  created_at: string; // post.created_at (ISO string) [cite: 67]
  /** URL ảnh bìa (lấy từ post_media) */
  thumbnail_url?: string;
}

/**
 * Dữ liệu cần thiết để hiển thị một kết quả 'Mọi người' (User).
 */
export interface UserSearchResult {
  type: 'user';
  id: number; // user.id [cite: 3]
  relevance_score?: number;
  
  full_name: string | null; // user.full_name [cite: 4]
  avatar_url: string | null; // user.avatar_url [cite: 5]
  story: string | null; // user.story (bio) [cite: 7]
  // có thể thêm follower_count (tính toán)
}

/**
 * Dữ liệu cần thiết để hiển thị một kết quả 'Cửa hàng' (Shop).
 */
export interface ShopSearchResult {
  type: 'shop';
  id: number; // shop.id [cite: 24]
  relevance_score?: number;
  
  name: string; // shop.name [cite: 24]
  slug: string; // shop.slug [cite: 24]
  logo_url: string | null; // shop.logo_url [cite: 25]
  description: string | null; // shop.description [cite: 26]
  is_verified: boolean; // shop.is_verified [cite: 26]
}

export interface HashtagSearchResult {
  type: 'hashtag';
  id: number; // tag.id
  relevance_score?: number;

  name: string; // tag.name (ví dụ: "skincare") [cite: 70]
  slug: string; // tag.slug [cite: 70]
  post_count: number;
}

export interface ProductSearchResult {
  type: 'product';
  id: number; // product.id [cite: 32]
  relevance_score?: number;
  name: string; // product.name [cite: 32]
  slug: string; // product.slug
  thumbnail_url?: string;
  price: number; // [cite: 41]
  avg_rating: number; // product.avg_rating [cite: 35]
  review_count: number; // product.review_count [cite: 35]
}

export type SearchResult = 
  | PostSearchResult 
  | UserSearchResult 
  | ShopSearchResult 
  | HashtagSearchResult
  | ProductSearchResult;

export interface SearchRequest {
  query: string;
  filters?: {
    type?: SearchableType | SearchableType[]; 
    date_range?: {
      from: string; 
      to: string;  
    };
  };
  page?: number;
  page_size?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total_count: number;
  page: number;
  page_size: number;
}

// --- CÁC KIỂU AUTOCOMPLETE ---

export interface AutocompleteSuggestion {
  suggestion: string;
  type: SearchableType;
  id?: number; 
  image_url?: string;
}

export interface AutocompleteResponse {
  suggestions: AutocompleteSuggestion[];
}   

// --- CÁC KIỂU ANALYTICS (Không đổi) ---

export interface SearchAnalytics {
  total_searches: number;
  popular_queries: { query: string; count: number }[];
  zero_result_queries: string[];
}

export interface SearchAnalyticsResponse {
  analytics: SearchAnalytics;
}