"use client";

import { useQuery } from "@tanstack/react-query";
import {
    generalSearch,
    searchUsers,
    searchShops,
    searchHashtags,
    getAutocomplete
} from "@/lib/api/search";
import { getAllProducts } from "@/lib/api/shop";

export function useGeneralSearch(query: string, type?: string) {
    return useQuery({
        queryKey: ["search", query, type],
        queryFn: async () => {
            // If type is specifically product, use the products search API
            if (type === 'product') {
                const products = await getAllProducts({ search: query });
                return { results: products };
            }

            // Otherwise call general search
            const res: any = await generalSearch(query, type);
            const data = res?.data || null;

            // Normalize sub-tab results
            if (data && type && !data.results) {
                if (type === 'post') data.results = data.posts;
                if (type === 'user') data.results = data.users;
                if (type === 'shop') data.results = data.shops;
                if (type === 'hashtag') data.results = data.hashtags;
            }

            // If type is 'all' (or not specified), also fetch products and merge
            if (!type || type === 'all') {
                try {
                    const products = await getAllProducts({ search: query, limit: 8 });
                    if (data) {
                        data.products = products;
                    }
                } catch (e) {
                    console.error("Failed to fetch products for general search", e);
                }
            }

            return data;
        },
        enabled: !!query,
    });
}

export function useSearchProducts(query: string) {
    return useQuery({
        queryKey: ["search-products", query],
        queryFn: async () => {
            return await getAllProducts({ search: query });
        },
        enabled: !!query,
    });
}

export function useSearchUsers(query: string) {
    return useQuery({
        queryKey: ["search-users", query],
        queryFn: async () => {
            const res: any = await searchUsers(query);
            return res?.data || null;
        },
        enabled: !!query,
    });
}

export function useSearchShops(query: string) {
    return useQuery({
        queryKey: ["search-shops", query],
        queryFn: async () => {
            const res: any = await searchShops(query);
            return res?.data || null;
        },
        enabled: !!query,
    });
}

export function useSearchHashtags(query: string) {
    return useQuery({
        queryKey: ["search-hashtags", query],
        queryFn: async () => {
            const res: any = await searchHashtags(query);
            return res?.data || null;
        },
        enabled: !!query,
    });
}

export function useAutocomplete(query: string) {
    return useQuery({
        queryKey: ["autocomplete", query],
        queryFn: async () => {
            const res: any = await getAutocomplete(query);
            return res?.data || null;
        },
        enabled: query.length >= 2,
    });
}
