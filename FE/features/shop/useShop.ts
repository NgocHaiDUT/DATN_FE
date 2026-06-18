"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";
import { useAuthStore } from "@/stores/auth.store";

export const useShop = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    const queryKey = ["shop", user?.id];

    const shopQuery = useQuery({
        queryKey,
        queryFn: () => apiClient(ENDPOINTS.SHOP.GET_MY_SHOP),
        enabled: !!user?.id,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    const updateLogo = useMutation({
        mutationFn: ({
            shopId,
            file,
        }: {
            shopId: number;
            file: File;
        }) => {
            const formData = new FormData();
            formData.append("file", file);

            return apiClient(ENDPOINTS.SHOP.UPDATE_LOGO(shopId), {
                method: "POST",
                body: formData,
            });
        },
        onSuccess: (res: any) => {
            if (res?.logo_url) {
                queryClient.setQueryData(queryKey, (old: any) => ({
                    ...old,
                    logo_url: res.logo_url,
                }));
            }
        },
    });

    const updateBanner = useMutation({
        mutationFn: ({
            shopId,
            file,
        }: {
            shopId: number;
            file: File;
        }) => {
            const formData = new FormData();
            formData.append("file", file);

            return apiClient(ENDPOINTS.SHOP.UPDATE_BANNER(shopId), {
                method: "POST",
                body: formData,
            });
        },
        onSuccess: (res: any) => {
            if (res?.cover_url) {
                queryClient.setQueryData(queryKey, (old: any) => ({
                    ...old,
                    cover_url: res.cover_url,
                }));
            }
        },
    });

    const updatePhone = useMutation({
        mutationFn: ({
            shopId,
            phone,
        }: {
            shopId: number;
            phone: string;
        }) =>
            apiClient(ENDPOINTS.SHOP.UPDATE_PHONE(shopId), {
                method: "PATCH",
                body: JSON.stringify({ phone }),
            }),
        onSuccess: (updatedShop) => {
            queryClient.setQueryData(queryKey, updatedShop);
        },
    });

    const updateEmail = useMutation({
        mutationFn: ({
            shopId,
            email,
        }: {
            shopId: number;
            email: string;
        }) =>
            apiClient(ENDPOINTS.SHOP.UPDATE_EMAIL(shopId), {
                method: "PATCH",
                body: JSON.stringify({ email }),
            }),
        onSuccess: (updatedShop) => {
            queryClient.setQueryData(queryKey, updatedShop);
        },
    });

    const updateDescription = useMutation({
        mutationFn: ({
            shopId,
            description,
        }: {
            shopId: number;
            description: string;
        }) =>
            apiClient(ENDPOINTS.SHOP.UPDATE_DESCRIPTION(shopId), {
                method: "PATCH",
                body: JSON.stringify({ description }),
            }),
        onSuccess: (updatedShop) => {
            queryClient.setQueryData(queryKey, updatedShop);
        },
    });

    const getShopInitials = () => {
        if (!shopQuery.data?.name) return "BS";
        return shopQuery.data.name
            .split(" ")
            .map((w: string) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const isVerified = () => Boolean(shopQuery.data?.is_verified);

    return {
        shop: shopQuery.data,
        isLoading: shopQuery.isLoading,
        error: shopQuery.error,
        refetch: shopQuery.refetch,

        updateLogo: updateLogo.mutateAsync,
        updateBanner: updateBanner.mutateAsync,
        updatePhone: updatePhone.mutateAsync,
        updateEmail: updateEmail.mutateAsync,
        updateDescription: updateDescription.mutateAsync,

        getShopInitials,
        isVerified,
    };
};

export const useShopDetails = (shopId: number) => {
    return useQuery({
        queryKey: ["shop-details", shopId],
        queryFn: () => apiClient(ENDPOINTS.SHOP.DETAILS_ADMIN(shopId)),
        enabled: !!shopId,
    });
};
