"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { getCart, addToCart, updateCartItem, removeFromCart } from "@/lib/api/shop";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/auth.store";

export function useCart() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const user = useAuthStore((s) => s.user);

    const { data: cart, isLoading, error } = useQuery({
        queryKey: ["cart-grouped"],
        queryFn: getCart,
        enabled: !!user,
    });

    const addToCartMutation = useMutation({
        mutationFn: ({ productId, quantity, variantId }: { productId: number; quantity: number; variantId?: number }) =>
            addToCart(productId, quantity, variantId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cart-grouped"] });
            toast({
                title: "Thành công",
                description: "Đã thêm sản phẩm vào giỏ hàng",
            });
        },
        onError: (error) => {
            toast({
                title: "Lỗi",
                description: "Không thể thêm vào giỏ hàng",
                variant: "destructive",
            });
        }
    });

    const updateQuantityMutation = useMutation({
        mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
            updateCartItem(itemId, quantity),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cart-grouped"] });
        },
    });

    const removeFromCartMutation = useMutation({
        mutationFn: (itemId: number) => removeFromCart(itemId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cart-grouped"] });
            toast({
                title: "Thành công",
                description: "Đã xóa sản phẩm khỏi giỏ hàng",
            });
        },
    });

    const allItems = useMemo(() => cart?.flatMap((group: any) => group.items) || [], [cart]);

    return {
        cart,
        items: allItems,
        isLoading,
        error,
        addToCart: addToCartMutation.mutate,
        updateQuantity: updateQuantityMutation.mutate,
        removeFromCart: removeFromCartMutation.mutate,
        isAdding: addToCartMutation.isPending,
        isUpdating: updateQuantityMutation.isPending,
        isRemoving: removeFromCartMutation.isPending
    };
}
