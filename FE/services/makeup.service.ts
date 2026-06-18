// API service for makeup backend
import type { FeatureGroupKey } from '@/lib/faceFeatures'
import { apiClient } from '@/lib/api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'
const UNKNOWN_STOCK = Number.MAX_SAFE_INTEGER
const UNKNOWN_PRICE = Number.NaN

// Enums matching Prisma schema
export type SkinType = 'unknown' | 'normal' | 'oily' | 'dry' | 'combination' | 'sensitive'
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'removed'

// Product Variant type matching Prisma product_variants model
export type ProductVariant = {
  id: number
  product_id: number
  sku: string
  name: string | null
  shade_hex: string | null
  opacity?: number
  size_label: string | null
  price: number
  compare_at_price: number | null
  stock: number
  is_active: boolean
  weight: number | null
  length: number | null
  width: number | null
  height: number | null
  created_at: string
  updated_at: string
}

// Product type matching Prisma products model
export type MakeupProduct = {
  id: number
  shop_id: number
  brand_id: number | null
  name: string
  slug: string
  description: string | null
  how_to_use: string | null
  skin_type_compat: SkinType
  moderation_status: ModerationStatus
  is_published: boolean
  avg_rating: number
  review_count: number
  created_at: string
  updated_at: string
  variants: ProductVariant[]
  group: FeatureGroupKey
  alpha?: number
  image_url?: string | null
}

// Brand type matching Prisma brands model
export type Brand = {
  id: number
  name: string
  slug: string
  logo_url: string | null
}

export type ApiProductResponse = {
  id: number
  shop_id: number
  brand_id: number | null
  name: string
  slug: string
  description: string | null
  how_to_use: string | null
  skin_type_compat: string
  moderation_status: string
  is_published: boolean
  avg_rating: number
  review_count: number
  created_at: string
  updated_at: string
  brand?: Brand
  product_categories?: Array<{
    category: {
      id: number
      name: string
      slug: string
    }
  }>
  product_media?: Array<{
    id: number
    url: string
    type: string
  }>
  product_variants: Array<{
    id: number
    product_id?: number
    sku?: string
    name: string | null
    shade_hex: string | null
    opacity?: number
    size_label?: string | null
    price?: number
    compare_at_price?: number | null
    stock?: number
    is_active?: boolean
    weight?: number | null
    length?: number | null
    width?: number | null
    height?: number | null
    created_at?: string
    updated_at?: string
  }>
}

export type RecommendedProduct = {
  product_id: number
  product_name: string
  variant_id: number | null
  shade_hex: string | null
  colorDistance: number
  bestMatch: string
}

export type CategoriesResponse = {
  success: boolean
  data: {
    lips?: ApiProductResponse[]
    eyeshadow?: ApiProductResponse[]
    blush?: ApiProductResponse[]
    eyeliner?: ApiProductResponse[]
    eyebrows?: ApiProductResponse[]
    foundation?: ApiProductResponse[]
    mascara?: ApiProductResponse[]
  }
}

export type RecommendResponse = {
  success: boolean
  data: RecommendedProduct[]
}

// Map backend category names to our FeatureGroupKey
const CATEGORY_TO_GROUP_MAP: Record<string, FeatureGroupKey> = {
  'lips': 'LIPS',
  'eyeshadow': 'EYESHADOW',
  'blush': 'BLUSH',
  'eyeliner': 'EYELINER',
  'eyebrows': 'EYEBROWS',
  'foundation': 'FOUNDATION',
  'mascara': 'MASCARA',
}

// Convert backend product to our Product type
const convertApiProductToProduct = (apiProduct: ApiProductResponse, group: FeatureGroupKey): MakeupProduct => {
  // Get first image from product_media (API returns 'url' not 'media_url')
  const firstImage = apiProduct.product_media?.find((m: any) => m.type === 'image')
  
  return {
    id: apiProduct.id,
    shop_id: apiProduct.shop_id,
    brand_id: apiProduct.brand_id,
    name: apiProduct.name,
    slug: apiProduct.slug,
    description: apiProduct.description,
    how_to_use: apiProduct.how_to_use,
    skin_type_compat: apiProduct.skin_type_compat as any,
    moderation_status: apiProduct.moderation_status as any,
    is_published: apiProduct.is_published,
    avg_rating: apiProduct.avg_rating,
    review_count: apiProduct.review_count,
    created_at: apiProduct.created_at,
    updated_at: apiProduct.updated_at,
    image_url: firstImage?.url || null,
    variants: apiProduct.product_variants.map(v => ({
      id: v.id,
      product_id: v.product_id ?? apiProduct.id,
      sku: v.sku ?? '',
      name: v.name,
      shade_hex: v.shade_hex,
      opacity: v.opacity,
      size_label: v.size_label || null,
      price: v.price != null ? Number(v.price) : UNKNOWN_PRICE,
      compare_at_price: v.compare_at_price ?? null,
      stock: v.stock ?? UNKNOWN_STOCK,
      is_active: v.is_active !== false, // default to true if not specified
      weight: v.weight || null,
      length: v.length || null,
      width: v.width || null,
      height: v.height || null,
      created_at: v.created_at || new Date().toISOString(),
      updated_at: v.updated_at || new Date().toISOString(),
    })),
    group,
  }
}

export const formatPrice = (price: number | null | undefined): string => {
  const numericPrice = Number(price)

  if (!Number.isFinite(numericPrice)) {
    return 'Đang cập nhật'
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(numericPrice)
}

// Mock data for development/fallback
const createMockProduct = (id: number, name: string, shadeHex: string, group: FeatureGroupKey): MakeupProduct => ({
  id,
  shop_id: 1,
  brand_id: 1,
  name,
  slug: name.toLowerCase().replace(/\s+/g, '-'),
  description: `Beautiful ${group.toLowerCase()} product`,
  how_to_use: null,
  skin_type_compat: 'normal',
  moderation_status: 'approved',
  is_published: true,
  avg_rating: 4.5,
  review_count: 100,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  variants: [{
    id: id * 10,
    product_id: id,
    sku: `SKU-${id}`,
    name: 'Default',
    shade_hex: shadeHex,
    size_label: 'Regular',
    price: 250000,
    compare_at_price: null,
    stock: 100,
    is_active: true,
    weight: null,
    length: null,
    width: null,
    height: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }],
  group,
  alpha: 0.6
})

const getMockProducts = (): Map<FeatureGroupKey, MakeupProduct[]> => {
  const productsMap = new Map<FeatureGroupKey, MakeupProduct[]>()
  
  productsMap.set('LIPS', [
    createMockProduct(1, 'Velvet Red Lipstick', '#DC143C', 'LIPS'),
    createMockProduct(2, 'Pink Perfection', '#FF69B4', 'LIPS'),
    createMockProduct(3, 'Nude Elegance', '#E8B5A8', 'LIPS'),
    createMockProduct(4, 'Berry Bliss', '#8B1A3D', 'LIPS'),
  ])
  
  productsMap.set('EYESHADOW', [
    createMockProduct(10, 'Golden Shimmer', '#FFD700', 'EYESHADOW'),
    createMockProduct(11, 'Brown Sugar', '#8B4513', 'EYESHADOW'),
    createMockProduct(12, 'Purple Dream', '#9370DB', 'EYESHADOW'),
  ])
  
  productsMap.set('BLUSH', [
    createMockProduct(20, 'Peachy Glow', '#FFDAB9', 'BLUSH'),
    createMockProduct(21, 'Rose Petal', '#FFB6C1', 'BLUSH'),
    createMockProduct(22, 'Coral Crush', '#FF7F50', 'BLUSH'),
  ])
  
  productsMap.set('EYELINER', [
    createMockProduct(30, 'Classic Black Liner', '#000000', 'EYELINER'),
    createMockProduct(31, 'Brown Liner', '#4B3621', 'EYELINER'),
  ])
  
  productsMap.set('EYEBROWS', [
    createMockProduct(40, 'Brow Pencil Dark', '#3D2817', 'EYEBROWS'),
    createMockProduct(41, 'Brow Pencil Light', '#6F4E37', 'EYEBROWS'),
  ])
  
  productsMap.set('FOUNDATION', [
    createMockProduct(50, 'Fair Foundation', '#F5D7C3', 'FOUNDATION'),
    createMockProduct(51, 'Medium Foundation', '#D4A373', 'FOUNDATION'),
    createMockProduct(52, 'Deep Foundation', '#8D5524', 'FOUNDATION'),
  ])
  
  return productsMap
}

/**
 * Fetch products grouped by makeup categories
 * Falls back to mock data if API is unavailable
 */
export const fetchProductsByCategories = async (limit: number = 10): Promise<Map<FeatureGroupKey, MakeupProduct[]>> => {
  try {
    const result = await apiClient(`/makeup/categories?limit=${limit}`) as CategoriesResponse
    
    // If API call fails, return mock data
    if (!result.success || !result.data) {
      console.warn('API returned error, using mock data')
      return getMockProducts()
    }
    
    const productsMap = new Map<FeatureGroupKey, MakeupProduct[]>()
    
    Object.entries(result.data).forEach(([categoryKey, products]) => {
      const groupKey = CATEGORY_TO_GROUP_MAP[categoryKey]
      if (groupKey && products) {
        const convertedProducts = products.map(p => convertApiProductToProduct(p, groupKey))
        productsMap.set(groupKey, convertedProducts)
      }
    })
    
    return productsMap
  } catch (error) {
    console.warn('Error fetching products, using mock data:', error)
    return getMockProducts()
  }
}

/**
 * Fetch my shop products grouped by makeup categories (for seller try-on tester)
 * Falls back to mock data if API is unavailable
 */
export const fetchMyShopProductsByCategories = async (limit: number = 10): Promise<Map<FeatureGroupKey, MakeupProduct[]>> => {
  try {
    const result = await apiClient(`/makeup/my-shop-products?limit=${limit}`) as CategoriesResponse
    
    // If API call fails, return mock data
    if (!result.success || !result.data) {
      console.warn('API returned error, using mock data')
      return getMockProducts()
    }
    
    const productsMap = new Map<FeatureGroupKey, MakeupProduct[]>()
    
    Object.entries(result.data).forEach(([categoryKey, products]) => {
      const groupKey = CATEGORY_TO_GROUP_MAP[categoryKey]
      if (groupKey && products) {
        const convertedProducts = products.map(p => convertApiProductToProduct(p, groupKey))
        productsMap.set(groupKey, convertedProducts)
      }
    })
    
    return productsMap
  } catch (error) {
    console.warn('Error fetching my shop products, using mock data:', error)
    return getMockProducts()
  }
}

/**
 * Fetch recommended products by skin tone
 * Falls back to empty array if API is unavailable
 */
export const fetchRecommendedProducts = async (skintone: string): Promise<RecommendedProduct[]> => {
  try {
    const result = await apiClient(`/makeup/recommend?skintone=${skintone}`) as RecommendResponse
    
    if (!result.success || !result.data) {
      console.warn('Recommendations API returned error')
      return []
    }
    
    return result.data
  } catch (error) {
    console.warn('Error fetching recommended products:', error)
    return []
  }
}

/**
 * Get full product details by product_id and variant_id
 */
export const fetchProductDetails = async (
  productId: number,
  variantId: number | null
): Promise<{ product: MakeupProduct | null; variant: ProductVariant | null }> => {
  try {
    const productsMap = await fetchProductsByCategories(100)
    
    let foundProduct: MakeupProduct | null = null
    let foundVariant: ProductVariant | null = null
    
    for (const products of productsMap.values()) {
      const product = products.find(p => p.id === productId)
      if (product) {
        foundProduct = product
        if (variantId) {
          foundVariant = product.variants.find(v => v.id === variantId) || null
        } else if (product.variants.length > 0) {
          // Use first variant as default
          foundVariant = product.variants[0]
        }
        break
      }
    }
    
    return { product: foundProduct, variant: foundVariant }
  } catch (error) {
    console.warn('Error fetching product details:', error)
    return { product: null, variant: null }
  }
}

// Mock brands for local use
export const MOCK_BRANDS: Brand[] = [
  { id: 1, name: 'MAC Cosmetics', slug: 'mac-cosmetics', logo_url: '/brands/mac.png' },
  { id: 2, name: 'Charlotte Tilbury', slug: 'charlotte-tilbury', logo_url: '/brands/charlotte-tilbury.png' },
  { id: 3, name: 'NARS', slug: 'nars', logo_url: '/brands/nars.png' },
  { id: 4, name: 'Maybelline', slug: 'maybelline', logo_url: '/brands/maybelline.png' },
  { id: 5, name: 'L\'Oréal Paris', slug: 'loreal-paris', logo_url: '/brands/loreal.png' },
  { id: 6, name: 'Fenty Beauty', slug: 'fenty-beauty', logo_url: '/brands/fenty.png' },
  { id: 7, name: 'Rare Beauty', slug: 'rare-beauty', logo_url: '/brands/rare-beauty.png' },
]

/**
 * Update variant shade color and opacity
 * PUT /makeup/variant/{variantId}/shade
 */
export type UpdateVariantShadePayload = {
  shade_hex: string
  opacity: number
}

export type UpdateVariantShadeResponse = {
  success: boolean
  message?: string
  data?: ProductVariant
}

export const updateVariantShade = async (
  variantId: number,
  payload: UpdateVariantShadePayload
): Promise<UpdateVariantShadeResponse> => {
  try {
    const result = await apiClient(`/makeup/variant/${variantId}/shade`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }) as UpdateVariantShadeResponse
    
    return result
  } catch (error) {
    console.error('Error updating variant shade:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update variant shade',
    }
  }
}
