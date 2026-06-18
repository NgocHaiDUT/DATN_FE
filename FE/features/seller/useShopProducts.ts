import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";

const buildQueryString = (params: Record<string, string | number | boolean | undefined>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(key, value.toString());
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

export const useShopProducts = (
  shopId?: number,
  options?: {
    page?: number;
    limit?: number;
    search?: string;
    category_id?: string;
    brand_id?: string;
    is_published?: boolean;
    is_deleted?: boolean;
    moderation_status?: string;
    isOwnerView?: boolean; // New parameter to determine endpoint
  }
) => {
  return useQuery({
    queryKey: ["shop-products", shopId, options],
    enabled: !!shopId,
    queryFn: async () => {
      const params: Record<string, string | number | boolean | undefined> = {
        page: options?.page || 1,
        limit: options?.limit || 20,
      };
      if (options?.search) params.search = options.search;
      if (options?.category_id && options.category_id !== 'all') params.category_id = options.category_id;
      if (options?.brand_id && options.brand_id !== 'all') params.brand_id = options.brand_id;
      if (options?.is_published !== undefined) params.is_published = options.is_published;
      if (options?.is_deleted !== undefined) params.is_deleted = options.is_deleted;
      if (options?.moderation_status) params.moderation_status = options.moderation_status;

      // Use management endpoint if owner view, otherwise use public endpoint
      const endpoint = options?.isOwnerView
        ? ENDPOINTS.PRODUCTS.GET_SHOP_PRODUCTS_MANAGE(shopId!)
        : ENDPOINTS.PRODUCTS.GET_SHOP_PRODUCTS(shopId!);

      return apiClient(
        `${endpoint}${buildQueryString(params)}`
      );
    },
    staleTime: 30 * 1000,
    retry: 1,
  });
};

export const useProductDetail = (productId?: number, isOwnerView?: boolean) => {
  return useQuery({
    queryKey: ["product-detail", productId, isOwnerView],
    enabled: !!productId && productId > 0,
    queryFn: async () => {
      if (!productId) {
        throw new Error('Product ID is required');
      }
      // Use management endpoint if owner view, otherwise use public endpoint
      const endpoint = isOwnerView
        ? ENDPOINTS.PRODUCTS.GET_PRODUCT_DETAIL_MANAGE(productId)
        : ENDPOINTS.PRODUCTS.GET_PRODUCT_DETAIL(productId);

      const response = await apiClient(endpoint);
      return response;
    },
    staleTime: 30 * 1000,
    retry: false, // Don't retry on error
  });
};

export const useAllBrands = () => {
  return useQuery({
    queryKey: ["all-brands"],
    queryFn: async () => {
      return apiClient(ENDPOINTS.PRODUCTS.GET_ALL_BRANDS);
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const useAllCategories = () => {
  return useQuery({
    queryKey: ["all-categories"],
    queryFn: async () => {
      return apiClient(ENDPOINTS.PRODUCTS.GET_ALL_CATEGORIES);
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: {
      shop_id: number;
      name: string;
      is_published?: boolean;
      how_to_use?: string;
      description?: string;
      brand_id?: number;
      category_ids?: number[];
    }) => {
      return apiClient(ENDPOINTS.PRODUCTS.CREATE, {
        method: "POST",
        body: JSON.stringify({
          shop_id: String(productData.shop_id),
          name: productData.name,
          is_published: productData.is_published ?? false,
          how_to_use: productData.how_to_use || '',
          description: productData.description || '',
          brand_id: productData.brand_id ? String(productData.brand_id) : undefined,
          category_ids: productData.category_ids || [],
        }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["shop-products", variables.shop_id],
      });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      productData,
    }: {
      productId: number;
      productData: {
        name?: string;
        description?: string;
        how_to_use?: string;
        is_published?: boolean;
        brand_id?: number;
        category_ids?: number[];
      };
    }) => {
      return apiClient(ENDPOINTS.PRODUCTS.UPDATE(productId), {
        method: "PUT",
        body: JSON.stringify({
          name: productData.name,
          description: productData.description,
          how_to_use: productData.how_to_use,
          is_published: productData.is_published,
          brand_id: productData.brand_id ? String(productData.brand_id) : undefined,
          category_ids: productData.category_ids || [],
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["shop-products"],
      });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiClient(ENDPOINTS.PRODUCTS.DELETE(productId), {
        method: "DELETE",
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["shop-products"],
      });
    },
  });
};

export const useRequestProductRestore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: number) => {
      return apiClient(ENDPOINTS.PRODUCTS.RESTORE_REQUEST(productId), {
        method: "POST",
        body: JSON.stringify({}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["shop-products"],
      });
    },
  });
};

export const useCreateProductVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variantData: {
      product_id: number;
      sku?: string;
      name?: string;
      price: number;
      stock?: number;
      compare_at_price?: number;
      shade_hex?: string;
      size_label?: string;
      is_active?: boolean;
      opacity?: number;
      weight?: number;
      length?: number;
      width?: number;
      height?: number;
    }) => {
      return apiClient(ENDPOINTS.PRODUCTS.CREATE_VARIANT, {
        method: "POST",
        body: JSON.stringify({
          product_id: String(variantData.product_id),
          sku: variantData.sku,
          name: variantData.name || 'Default',
          price: String(variantData.price),
          stock: variantData.stock ? String(variantData.stock) : undefined,
          compare_at_price: variantData.compare_at_price ? String(variantData.compare_at_price) : undefined,
          shade_hex: variantData.shade_hex,
          size_label: variantData.size_label,
          opacity: variantData.opacity !== undefined ? String(variantData.opacity) : undefined,
          weight: variantData.weight !== undefined ? String(variantData.weight) : undefined,
          length: variantData.length !== undefined ? String(variantData.length) : undefined,
          width: variantData.width !== undefined ? String(variantData.width) : undefined,
          height: variantData.height !== undefined ? String(variantData.height) : undefined,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["shop-products"],
      });
    },
  });
};

export const useUpdateProductVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      variantId,
      variantData,
    }: {
      variantId: number;
      variantData: {
        sku?: string;
        name?: string;
        price?: number;
        stock?: number;
        compare_at_price?: number;
        shade_hex?: string;
        size_label?: string;
        is_active?: boolean;
        opacity?: number;
        weight?: number;
        length?: number;
        width?: number;
        height?: number;
      };
    }) => {
      return apiClient(ENDPOINTS.PRODUCTS.UPDATE_VARIANT(variantId), {
        method: "PUT",
        body: JSON.stringify({
          sku: variantData.sku,
          name: variantData.name,
          price: variantData.price ? String(variantData.price) : undefined,
          stock: variantData.stock !== undefined ? String(variantData.stock) : undefined,
          compare_at_price: variantData.compare_at_price ? String(variantData.compare_at_price) : undefined,
          shade_hex: variantData.shade_hex,
          size_label: variantData.size_label,
          is_active: variantData.is_active,
          opacity: variantData.opacity !== undefined ? String(variantData.opacity) : undefined,
          weight: variantData.weight !== undefined ? String(variantData.weight) : undefined,
          length: variantData.length !== undefined ? String(variantData.length) : undefined,
          width: variantData.width !== undefined ? String(variantData.width) : undefined,
          height: variantData.height !== undefined ? String(variantData.height) : undefined,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["shop-products"],
      });
    },
  });
};

export const useDeleteProductVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variantId: number) => {
      return apiClient(ENDPOINTS.PRODUCTS.DELETE_VARIANT(variantId), {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["shop-products"],
      });
    },
  });
};

export const useAddProductMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      file,
      type = 'image',
      sortOrder = 0,
    }: {
      productId: number;
      file: File;
      type?: string;
      sortOrder?: number;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('sort_order', String(sortOrder));

      return apiClient(ENDPOINTS.PRODUCTS.ADD_MEDIA(productId), {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["shop-products"],
      });
    },
  });
};

export const useDeleteProductMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mediaId: number) => {
      return apiClient(ENDPOINTS.PRODUCTS.DELETE_MEDIA(mediaId), {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["shop-products"],
      });
    },
  });
};

