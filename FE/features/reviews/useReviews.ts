import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewService } from "@/services/review.service";
import { CreateReviewRequest, UpdateReviewRequest } from "@/types/review.types";
import { toast } from "sonner";

export const useProductReviews = (productId: number, params?: { page?: number; limit?: number; rating?: number }) => {
    return useQuery({
        queryKey: ["reviews", "product", productId, params],
        queryFn: () => reviewService.getReviews({ product_id: productId, ...params }),
        enabled: !!productId,
    });
};

export const useProductRatingSummary = (productId: number) => {
    return useQuery({
        queryKey: ["reviews", "summary", productId],
        queryFn: () => reviewService.getProductRatingSummary(productId),
        enabled: !!productId,
    });
};

export const useCreateReview = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateReviewRequest) => reviewService.createReview(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["reviews", "product", variables.product_id] });
            queryClient.invalidateQueries({ queryKey: ["reviews", "summary", variables.product_id] });
            toast.success("Đánh giá sản phẩm thành công!");
        },
        onError: (error: any) => {
            toast.error(error?.message || "Có lỗi xảy ra khi đánh giá");
        },
    });
};

export const useUpdateReview = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateReviewRequest }) =>
            reviewService.updateReview(id, data),
        onSuccess: (_, variables) => {
            // We might not have the productId here easily to invalidate specific queries consistently without returning it from backend
            // For now, invalidate all reviews might be safer or we rely on the user to refresh
            queryClient.invalidateQueries({ queryKey: ["reviews"] });
            toast.success("Cập nhật đánh giá thành công!");
        },
        onError: (error: any) => {
            toast.error(error?.message || "Có lỗi xảy ra khi cập nhật đánh giá");
        },
    });
};

export const useDeleteReview = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => reviewService.deleteReview(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reviews"] });
            toast.success("Xóa đánh giá thành công!");
        },
        onError: (error: any) => {
            toast.error(error?.message || "Có lỗi xảy ra khi xóa đánh giá");
        },
    });
};

export const useUploadReviewMedia = () => {
    return useMutation({
        mutationFn: (file: File) => reviewService.uploadTempMedia(file),
        onError: (error: any) => {
            toast.error("Lỗi upload ảnh: " + (error?.message || "Unknown error"));
        }
    })
}
