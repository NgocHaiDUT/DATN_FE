/**
 * productApi.ts - API client for product operations
 */

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

/**
 * Product from API response
 */
export interface ApiProduct {
  id: number;
  name: string;
  slug: string;
  description?: string;
  how_to_use?: string;
  shop_id: number;
  brand_id?: number;
  is_published: boolean;
  moderation_status: 'pending' | 'approved' | 'rejected';
  avg_rating?: string | number;
  review_count?: number;
  created_at: string;
  updated_at: string;
  product_media?: Array<{
    id: number;
    url: string;
    type: string;
    sort_order: number;
    created_at: string;
  }>;
  product_variants?: Array<{
    id: number;
    sku: string;
    name: string;
    price: string | number;
    compare_at_price?: string | number | null;
    stock: number;
    shade_hex?: string | null;
    size_label?: string | null;
    opacity?: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }>;
  brand?: {
    id: number;
    name: string;
    slug: string;
    logo_url?: string;
  };
  product_categories?: Array<{
    category_id: number;
    category: {
      id: number;
      name: string;
      slug: string;
      parent_id?: number;
    };
  }>;
  shop?: {
    id: number;
    name: string;
    slug: string;
    owner_id: number;
  };
  hasTryOn?: boolean;
  first_image?: string;
  rating?: string | number;
  reviews?: number;
  inStock?: boolean;
}

/**
 * Product search parameters
 */
export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: number; // Category ID
  brand?: number; // Brand ID
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  is_published?: boolean;
  moderation_status?: 'pending' | 'approved' | 'rejected';
}

export interface GetShopProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: number;
  brand?: number;
  is_published?: boolean;
  moderation_status?: 'pending' | 'approved' | 'rejected';
}

/**
 * Products API response
 */
export interface ProductsResponse {
  success: boolean;
  products?: ApiProduct[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

export interface ShopProductsResponse {
  success: boolean;
  data?: {
    products?: ApiProduct[];
    pagination?: ProductsResponse['pagination'];
  };
  products?: ApiProduct[];
  pagination?: ProductsResponse['pagination'];
  message?: string;
}

/**
 * Brands API response
 */
export interface BrandsResponse {
  success: boolean;
  brands?: Array<{
    id: number;
    name: string;
    slug: string;
    logo_url?: string;
  }>;
  message?: string;
}

/**
 * Categories API response
 */
export interface CategoriesResponse {
  success: boolean;
  categories?: Array<{
    id: number;
    name: string;
    slug: string;
    parent_id?: number;
  }>;
  message?: string;
}

export const productApi = {
  /**
   * Get products with optional filters
   */
  async getProducts(params?: GetProductsParams): Promise<ProductsResponse> {
    const queryParams = new URLSearchParams();

    if (params?.page) {
      queryParams.set('page', params.page.toString());
    }
    if (params?.limit) {
      queryParams.set('limit', params.limit.toString());
    }
    if (params?.search) {
      queryParams.set('search', params.search);
    }
    if (params?.category) {
      queryParams.set('category', params.category.toString());
    }
    if (params?.brand) {
      queryParams.set('brand', params.brand.toString());
    }
    if (params?.minPrice !== undefined) {
      queryParams.set('minPrice', params.minPrice.toString());
    }
    if (params?.maxPrice !== undefined) {
      queryParams.set('maxPrice', params.maxPrice.toString());
    }
    if (params?.minRating !== undefined) {
      queryParams.set('minRating', params.minRating.toString());
    }
    if (params?.is_published !== undefined) {
      queryParams.set('is_published', params.is_published.toString());
    }
    if (params?.moderation_status) {
      queryParams.set('moderation_status', params.moderation_status);
    }

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/products${queryString ? `?${queryString}` : ''}`;

    return fetchWithAuth(url);
  },

  /**
   * Get all products for a shop management view.
   */
  async getShopProductsForManagement(shopId: string, params?: GetShopProductsParams): Promise<ShopProductsResponse> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.search) queryParams.set('search', params.search);
    if (params?.category) queryParams.set('category_id', params.category.toString());
    if (params?.brand) queryParams.set('brand_id', params.brand.toString());
    if (params?.is_published !== undefined) queryParams.set('is_published', params.is_published.toString());
    if (params?.moderation_status) queryParams.set('moderation_status', params.moderation_status);

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/shop/${encodeURIComponent(shopId)}/products/manage${queryString ? `?${queryString}` : ''}`;

    return fetchWithAuth(url);
  },

  /**
   * Get product by ID
   */
  async getProductById(id: number): Promise<{ success: boolean; product?: ApiProduct; message?: string }> {
    const url = `${API_BASE_URL}/products/${id}`;
    return fetchWithAuth(url);
  },

  /**
   * Create a new product
   */
  async createProduct(data: {
    shop_id: number;
    name: string;
    slug?: string;
    description?: string;
    how_to_use?: string;
    brand_id?: number;
    category_ids?: number[];
    is_published: boolean;
  }): Promise<{ success: boolean; product?: ApiProduct; message?: string }> {
    const url = `${API_BASE_URL}/products`;
    return fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a product
   */
  async updateProduct(id: number, data: {
    name?: string;
    slug?: string;
    description?: string;
    how_to_use?: string;
    brand_id?: number;
    category_ids?: number[];
    is_published?: boolean;
  }): Promise<{ success: boolean; product?: ApiProduct; message?: string }> {
    const url = `${API_BASE_URL}/products/${id}`;
    return fetchWithAuth(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a product
   */
  async deleteProduct(id: number): Promise<{ success: boolean; message?: string }> {
    const url = `${API_BASE_URL}/products/${id}`;
    return fetchWithAuth(url, {
      method: 'DELETE',
    });
  },

  /**
   * Get all brands
   */
  async getBrands(): Promise<BrandsResponse> {
    const url = `${API_BASE_URL}/products/brands`;
    return fetchWithAuth(url);
  },

  /**
   * Get all categories
   */
  async getCategories(): Promise<CategoriesResponse> {
    const url = `${API_BASE_URL}/products/categories`;
    return fetchWithAuth(url);
  },

  // ========== BRAND MANAGEMENT ==========

  /**
   * Create a new brand
   */
  async createBrand(name: string, slug: string, logo: File): Promise<{ success: boolean; message?: string }> {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('slug', slug);
    formData.append('file', logo);

    const response = await fetch(`${API_BASE_URL}/products/brands`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  },

  /**
   * Update brand name
   */
  async updateBrandName(brandId: number, name: string): Promise<{ success: boolean; message?: string }> {
    const url = `${API_BASE_URL}/products/brands/${brandId}/name`;
    return fetchWithAuth(url, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  },

  /**
   * Update brand slug
   */
  async updateBrandSlug(brandId: number, slug: string): Promise<{ success: boolean; message?: string }> {
    const url = `${API_BASE_URL}/products/brands/${brandId}/slug`;
    return fetchWithAuth(url, {
      method: 'PATCH',
      body: JSON.stringify({ slug }),
    });
  },

  /**
   * Update brand logo
   */
  async updateBrandLogo(brandId: number, logo: File): Promise<{ success: boolean; message?: string }> {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', logo);

    const response = await fetch(`${API_BASE_URL}/products/brands/${brandId}/logo`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  },

  /**
   * Delete a brand
   */
  async deleteBrand(brandId: number): Promise<{ success: boolean; message?: string }> {
    const url = `${API_BASE_URL}/products/brands/${brandId}`;
    return fetchWithAuth(url, {
      method: 'DELETE',
    });
  },

  // ========== CATEGORY MANAGEMENT ==========

  /**
   * Create a new category
   */
  async createCategory(name: string, slug: string, parent_id?: number): Promise<{ success: boolean; message?: string }> {
    const url = `${API_BASE_URL}/products/categories`;
    return fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify({ name, slug, parent_id }),
    });
  },

  /**
   * Update category name
   */
  async updateCategoryName(categoryId: number, name: string): Promise<{ success: boolean; message?: string }> {
    const url = `${API_BASE_URL}/products/categories/${categoryId}/name`;
    return fetchWithAuth(url, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  },

  /**
   * Update category slug
   */
  async updateCategorySlug(categoryId: number, slug: string): Promise<{ success: boolean; message?: string }> {
    const url = `${API_BASE_URL}/products/categories/${categoryId}/slug`;
    return fetchWithAuth(url, {
      method: 'PATCH',
      body: JSON.stringify({ slug }),
    });
  },

  /**
   * Delete a category
   */
  async deleteCategory(categoryId: number): Promise<{ success: boolean; message?: string }> {
    const url = `${API_BASE_URL}/products/categories/${categoryId}`;
    return fetchWithAuth(url, {
      method: 'DELETE',
    });
  },
};
