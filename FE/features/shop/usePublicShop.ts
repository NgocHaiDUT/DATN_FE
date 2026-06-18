"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBrands, getShopBySlug, getShopProducts, followShop, unfollowShop, getAllProducts, getAllCategories, getProductById } from "@/lib/api/shop";
import type { Brand, Shop } from "@/types/shop";

export function useGetAllCategories() {
    return useQuery<any[]>({
        queryKey: ["categories"],
        queryFn: getAllCategories,
    });
}

export function useGetAllProducts(params?: {
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
    return useQuery({
        queryKey: ["all-products", params],
        queryFn: () => getAllProducts(params),
    });
}

export function useGetProductById(id: string | number) {
    return useQuery({
        queryKey: ["product", id],
        queryFn: () => getProductById(id),
        enabled: !!id,
    });
}

import { useAuthStore } from "@/stores/auth.store";

// Brands
export function useGetBrands() {
    return useQuery<Brand[]>({
        queryKey: ["brands"],
        queryFn: getBrands,
    });
}

// Shop by slug
export function useGetShopBySlug(slug: string) {
    const user = useAuthStore((s) => s.user);
    // Convert slug to number for consistent cache key with mutations that use ID
    const shopId = Number(slug);

    return useQuery<Shop | null>({
        queryKey: ["shop", !isNaN(shopId) ? shopId : slug, user?.id],
        queryFn: () => getShopBySlug(slug, user?.id),
        enabled: !!slug,
    });
}

// Shop products
export function useGetShopProducts(shopId: number, params?: {
    page?: number;
    limit?: number;
    category?: string;
    sort?: string;
}) {
    return useQuery({
        queryKey: ["shop-products", shopId, params],
        queryFn: () => getShopProducts(shopId, params),
        enabled: !!shopId,
    });
}

// Check follow status
import { getFollowStats } from "@/lib/api/shop";
export function useGetFollowStats(targetUserId: number, currentUserId?: number) {
    return useQuery({
        queryKey: ["follow-status", targetUserId, currentUserId],
        queryFn: () => getFollowStats(targetUserId, currentUserId),
        enabled: !!targetUserId,
    });
}

// Follow shop
export function useFollowShop() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (shopId: number) => followShop(shopId),
        onSuccess: (_, shopId) => {
            // Invalidate specific shop query and follow status
            queryClient.invalidateQueries({ queryKey: ["shop", shopId] });
            queryClient.invalidateQueries({ queryKey: ["shop", String(shopId)] }); // Just in case
            queryClient.invalidateQueries({ queryKey: ["follow-status"] });
        },
    });
}

// Unfollow shop
export function useUnfollowShop() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (shopId: number) => unfollowShop(shopId),
        onSuccess: (_, shopId) => {
            queryClient.invalidateQueries({ queryKey: ["shop", shopId] });
            queryClient.invalidateQueries({ queryKey: ["shop", String(shopId)] });
            queryClient.invalidateQueries({ queryKey: ["follow-status"] });
        },
    });
}
