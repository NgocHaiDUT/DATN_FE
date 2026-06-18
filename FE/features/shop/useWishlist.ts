"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWishlist, addToWishlist, removeFromWishlist } from "@/lib/api/shop";
import { useToast } from "@/hooks/use-toast";

export function useWishlist() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: wishlist, isLoading } = useQuery({
        queryKey: ["wishlist"],
        queryFn: getWishlist,
    });

    const addToWishlistMutation = useMutation({
        mutationFn: (productId: number) => addToWishlist(productId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wishlist"] });
            toast({
                title: "Thành công",
                description: "Đã thêm vào danh sách yêu thích",
            });
        },
        onError: (error) => {
            toast({
                title: "Lỗi",
                description: "Không thể thêm vào danh sách yêu thích",
                variant: "destructive",
            });
        }
    });

    const removeFromWishlistMutation = useMutation({
        mutationFn: (productId: number) => removeFromWishlist(productId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wishlist"] });
        },
    });

    return {
        wishlist,
        isLoading,
        addToWishlist: addToWishlistMutation.mutate,
        removeFromWishlist: removeFromWishlistMutation.mutate,
        isAdding: addToWishlistMutation.isPending,
        isRemoving: removeFromWishlistMutation.isPending
    };
}
