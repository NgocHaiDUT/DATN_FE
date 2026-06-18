export interface Brand {
    id: number;
    name: string;
    slug: string;
    logo_url?: string;
}

export interface Seller {
    id: number | string;
    name: string;
    avatar: string;
    verified: boolean;
    rating: number;
}

export interface ProductVariant {
    id: number;
    product_id: number;
    name: string;
    price: string | number;
    compare_at_price?: string | number;
    stock: number;
    sku?: string;
    image?: string;
    shade_hex?: string;
    opacity?: number;
}

export interface Product {
    id: string | number;
    slug?: string;
    name: string;
    brand: string | Brand;
    seller: Seller;
    price: number;
    discount_price?: number;
    maxPrice?: number;
    originalPrice?: number;
    rating: number;
    avg_rating?: number; // Alias
    reviews: number;
    review_count?: number; // Backend field
    image: string;
    first_image?: string; // Alias
    image_url?: string; // Backend field
    images?: string[];
    description?: string;
    variants?: ProductVariant[];
    category: string;
    badges?: string[];
    inStock: boolean;
    stock_quantity?: number; // Backend field
    freeShipping: boolean;
    hasTryOn?: boolean;
    sold_count?: number;
    is_deleted?: boolean;
    deleted_at?: string | null;
}

export interface CartItem {
    id: number;
    product: Product;
    quantity: number;
    variantId?: number;
    selectedVariant?: {
        id: number;
        name: string;
        price: number;
        sku?: string;
    };
}

export interface CartGroup {
    shop: Shop;
    items: CartItem[];
}

export interface WishlistItem {
    id: number;
    product: Product;
    addedAt: string;
}

export interface Shop {
    id: number;
    slug: string;
    name: string;
    logo_url?: string;
    description?: string;
    follower_count: number;
    product_count: number;
    is_verified?: boolean;
    rating?: number;
    avg_rating?: number; // Alias
    staff_count?: number;
    owner_id?: number;
    cover_url?: string;
    followers?: number;
    phone?: string;
    email?: string;
    address?: string;
    created_at?: string;
    is_following?: boolean;
    total_reviews?: number;
    owner?: {
        id: number;
        full_name?: string;
        avatar_url?: string;
        email?: string;
        phone?: string;
    };
}

export interface Category {
    name: string;
    icon: string;
    count: string;
    color: string;
}
