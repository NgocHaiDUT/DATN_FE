import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";
import { resolveMediaUrl } from "@/lib/media";
import type { Brand, Shop, Product } from "@/types/shop";

function mapProductFromApi(p: any): Product {

    // Handle simplified format from /shop/{id}/products
    if (p.image_url !== undefined && p.stock_quantity !== undefined) {
        return {
            id: p.id,
            slug: p.slug || String(p.id),
            name: p.name || "Unknown Product",
            brand: p.brand || "No Brand",
            seller: {
                id: p.shop_id || 0,
                name: "Beauty Shop",
                avatar: "",
                verified: false,
                rating: 5.0
            },
            price: Number(p.price) || 0,
            discount_price: p.discount_price ? Number(p.discount_price) : undefined,
            originalPrice: p.discount_price ? Number(p.discount_price) : undefined,
            rating: Number(p.rating) || Number(p.avg_rating) || 0,
            avg_rating: Number(p.rating) || Number(p.avg_rating) || 0,
            reviews: p.review_count || 0,
            review_count: p.review_count || 0,
            image: p.image_url || "",
            first_image: p.image_url || "",
            image_url: p.image_url || "",
            images: p.image_url ? [p.image_url] : [],
            description: p.description || "",
            variants: [],
            category: "General",
            inStock: (p.stock_quantity || 0) > 0,
            stock_quantity: p.stock_quantity || 0,
            freeShipping: false,
            hasTryOn: p.hasTryOn || false,
            sold_count: p.sold_count || 0,
            badges: []
        };
    }

    // Handle detailed format from /products endpoints
    const variants = p.variants || p.product_variants || [];
    const prices = variants.map((v: any) => Number(v.price)).filter((p: number) => !isNaN(p));
    const minPrice = prices.length > 0 ? Math.min(...prices) : (p.price ? Number(p.price) : 0);
    const maxPrice = prices.length > 0 ? Math.max(...prices) : (p.price ? Number(p.price) : 0);

    // Find compare_at_price if exists
    const originalPrices = variants.map((v: any) => Number(v.compare_at_price)).filter((p: number) => !isNaN(p) && p > 0);
    const originalPrice = originalPrices.length > 0 ? Math.max(...originalPrices) : undefined;

    const stock = variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);

    const media = p.media || p.product_media || p.images || [];
    // Luôn lấy string URL — tránh trường hợp url rỗng dẫn đến gán cả object vào image
    const rawImage = media.length > 0
        ? (typeof media[0] === 'string' ? media[0] : (media[0]?.url || ""))
        : (p.image || p.thumbnail || p.first_image || "");
    const image = typeof rawImage === 'string' ? rawImage : "";
    const images = media
        .map((m: any) => typeof m === 'string' ? m : (m?.url || ""))
        .filter((url: string) => typeof url === 'string' && url.length > 0);

    // Extract category
    const categories = p.categories || p.product_categories || [];
    const categoryName = categories.length > 0
        ? (categories[0].category?.name || categories[0].name || "General")
        : (p.category?.name || "General");

    return {
        id: p.id,
        slug: p.slug || String(p.id),
        name: p.name || "Unknown Product",
        brand: (typeof p.brand === 'string' ? p.brand : p.brand?.name) || "No Brand",
        seller: p.shop ? {
            id: p.shop.id || p.shop_id,
            name: p.shop.name || "Unknown Shop",
            avatar: p.shop.logo_url || "",
            verified: p.shop.is_verified || false,
            rating: p.shop.rating || 4.9
        } : {
            id: p.shop_id || 0,
            name: "Beauty Shop",
            avatar: "",
            verified: false,
            rating: 5.0
        },
        price: minPrice,
        maxPrice: maxPrice,
        originalPrice: originalPrice,
        rating: Number(p.avg_rating) || 0,
        reviews: p.review_count || (p.reviews?.length) || 0,
        image: image,
        images: images,
        description: p.description || "",
        variants: variants.map((v: any) => ({
            id: v.id,
            product_id: v.product_id,
            name: v.name || "Default",
            price: Number(v.price) || 0,
            stock: v.stock || 0,
            sku: v.sku || "",
            shade_hex: v.shade_hex || v.shadeHex || null,
            opacity: v.opacity != null ? Number(v.opacity) : undefined,
            compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : null
        })),
        category: categoryName,
        inStock: stock > 0,
        freeShipping: minPrice > 500000,
        hasTryOn: p.hasTryOn || false,
        badges: stock < 5 && stock > 0 ? ["Low Stock"] : (stock === 0 ? ["Out of Stock"] : [])
    };
}

// Brands
export async function getBrands(): Promise<Brand[]> {
    const res: any = await apiClient(ENDPOINTS.BRANDS.GET_ALL, {
        method: "GET",
    });
    const raw = res?.brands || res?.items || res?.data || res || [];
    return Array.isArray(raw) ? raw : [];
}

export async function getAllCategories() {
    const res: any = await apiClient((ENDPOINTS as any).PRODUCTS.GET_CATEGORIES || '/products/categories', { // Use fallback if constant not updated yet
        method: 'GET'
    });
    const raw = res?.categories || res?.data || res || [];
    return Array.isArray(raw) ? raw : [];
}

export async function getAllProducts(params?: {
    page?: number;
    limit?: number;
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    search?: string;
    sort?: string;
}) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.brand) queryParams.append('brand', params.brand);
    if (params?.minPrice) queryParams.append('minPrice', params.minPrice.toString());
    if (params?.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params?.minRating) queryParams.append('minRating', params.minRating.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sort) queryParams.append('sort', params.sort);

    const res: any = await apiClient(`${ENDPOINTS.PRODUCTS.GET_ALL}?${queryParams.toString()}`, {
        method: "GET",
    });

    // Throw on hard network/auth failures so React Query retries and isError activates
    if (res?.error === 'network' || res?.error === 'cancelled') {
        throw new Error('Network error fetching products');
    }

    const rawProducts = res?.data?.products || res?.products || res?.data || [];
    return Array.isArray(rawProducts) ? rawProducts.map(mapProductFromApi) : [];
}

export async function getProductById(id: string | number): Promise<Product | null> {
    // Determine if id is a slug (non-numeric string) or numeric ID
    const isSlug = typeof id === 'string' && isNaN(Number(id));
    const endpoint = isSlug ? `/products/slug/${id}` : `/products/${id}`;

    const res: any = await apiClient(endpoint, { method: "GET" });

    // Backend returns: { success: true, product: {...} }
    const raw = res?.product || res?.data?.product || res?.data || res || null;

    if (!raw) {
        return null;
    }

    return mapProductFromApi(raw);
}

// Shops
export async function getShopBySlug(slug: string, currentUserId?: number): Promise<Shop | null> {
    // Assuming slug is numeric ID for now (like PBL6-web)
    const id = Number(slug);
    if (!id) return null;

    let path = ENDPOINTS.SHOP.DETAILS(id);
    if (currentUserId) {
        path += `?currentUserId=${currentUserId}`;
    }

    const res: any = await apiClient(path, { method: "GET" });
    return res?.data || res || null;
}

export async function getFollowStats(targetUserId: number, currentUserId?: number) {
    if (!targetUserId) return null;
    const query = currentUserId ? `?currentUserId=${currentUserId}` : '';
    const res: any = await apiClient(`${ENDPOINTS.FOLLOWS.STATS(targetUserId)}${query}`, { method: "GET" });
    return res;
}

export async function getShopProducts(shopId: number, params?: {
    page?: number;
    limit?: number;
    category?: string;
    sort?: string;
}) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.sort) queryParams.append('sort', params.sort);

    const path = `${ENDPOINTS.PRODUCTS.GET_SHOP_PRODUCTS(shopId)}?${queryParams.toString()}`;
    const res: any = await apiClient(path, { method: "GET" });
    const rawProducts = res?.data || res?.products || res || [];
    return Array.isArray(rawProducts) ? rawProducts.map(mapProductFromApi) : [];
}

export async function checkShopFollowStatus(shopId: number) {
    return await apiClient(ENDPOINTS.SHOP.CHECK_FOLLOW(shopId), {
        method: "GET",
    });
}

export async function followShop(shopId: number) {
    const res = await apiClient(ENDPOINTS.SHOP.FOLLOW(shopId), {
        method: "POST",
    });
    return res;
}

export async function unfollowShop(shopId: number) {
    const res = await apiClient(ENDPOINTS.SHOP.UNFOLLOW(shopId), {
        method: "DELETE",
    });
    return res;
}

// Wishlist
export async function getWishlist() {
    const res: any = await apiClient(ENDPOINTS.WISHLIST.GET_ALL, { method: "GET" });
    const rawItems = res?.wishlist || res?.data || [];
    return Array.isArray(rawItems) ? rawItems.map((item: any) => ({
        id: item.id,
        product: mapProductFromApi(item),
        addedAt: item.added_at || item.created_at
    })) : [];
}

export async function addToWishlist(productId: number) {
    return await apiClient(ENDPOINTS.WISHLIST.ADD, {
        method: "POST",
        body: JSON.stringify({ productId })
    });
}

export async function removeFromWishlist(productId: number) {
    return await apiClient(ENDPOINTS.WISHLIST.REMOVE(productId), {
        method: "DELETE"
    });
}

// Cart
export async function getCart() {
    const res: any = await apiClient(ENDPOINTS.CART.GET_CART, { method: "GET" });

    // Backend returns { success: true, cart: { cart_items: [...] } }
    const rawItems = res?.cart?.cart_items || res?.data?.cart_items || [];

    if (!Array.isArray(rawItems)) return [];

    // Group items by shop
    const groupedMap = new Map<number, any>();

    rawItems.forEach((item: any) => {
        // Handle both product.shop (if included) or default/mock shop
        const shop = item.product?.shop || {
            id: item.product?.shop_id || 0,
            name: "Unknown Shop",
            slug: "",
            logo_url: ""
        };

        if (!productHasShop(item.product?.shop, item.product?.shop_id)) {
            // Optional: Log or handle items without valid shop if needed
        }

        if (!groupedMap.has(shop.id)) {
            groupedMap.set(shop.id, {
                shop: {
                    id: shop.id,
                    name: shop.name,
                    slug: shop.slug || "",
                    logo_url: shop.logo_url,
                },
                items: []
            });
        }

        groupedMap.get(shop.id).items.push({
            id: item.id,
            product: mapProductFromApi(item.product),
            quantity: item.quantity,
            variant_id: item.variant_id,
            price_snapshot: item.price_snapshot,
            selectedVariant: item.variant ? {
                id: item.variant.id,
                name: item.variant.name,
                price: Number(item.variant.price),
                sku: item.variant.sku
            } : undefined
        });
    });

    return Array.from(groupedMap.values());
}

function productHasShop(shop: any, shopId: any) {
    return !!shop || !!shopId;
}

export async function addToCart(productId: number, quantity: number, variantId?: number) {
    // Backend expects snake_case: product_id, variant_id
    const payload = {
        product_id: productId,
        quantity,
        variant_id: variantId
    };
    return await apiClient(ENDPOINTS.CART.ADD_ITEM, {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

export async function updateCartItem(itemId: number, quantity: number) {
    return await apiClient(ENDPOINTS.CART.UPDATE_ITEM(itemId), {
        method: "PATCH", // Backend uses PATCH
        body: JSON.stringify({ quantity })
    });
}

export async function removeFromCart(itemId: number) {
    return await apiClient(ENDPOINTS.CART.REMOVE_ITEM(itemId), {
        method: "DELETE"
    });
}
