import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";
import {
    CreateReviewRequest,
    ReviewResponse,
    ReviewsListResponse,
    ReviewStatsResponse,
    UpdateReviewRequest,
} from "@/types/review.types";

export const reviewService = {
    async getReviews(params: {
        product_id?: number;
        user_id?: number;
        rating?: number;
        page?: number;
        limit?: number;
    }): Promise<ReviewsListResponse> {
        const query = new URLSearchParams();
        if (params.product_id) query.append("product_id", params.product_id.toString());
        if (params.user_id) query.append("user_id", params.user_id.toString());
        if (params.rating) query.append("rating", params.rating.toString());
        if (params.page) query.append("page", params.page.toString());
        if (params.limit) query.append("limit", params.limit.toString());

        return apiClient(`${ENDPOINTS.REVIEWS.GET_ALL}?${query.toString()}`);
    },

    async createReview(data: CreateReviewRequest): Promise<ReviewResponse> {
        return apiClient(ENDPOINTS.REVIEWS.CREATE, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    async updateReview(
        id: number,
        data: UpdateReviewRequest
    ): Promise<ReviewResponse> {
        return apiClient(ENDPOINTS.REVIEWS.UPDATE(id), {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },

    async deleteReview(id: number): Promise<{ success: boolean; message: string }> {
        return apiClient(ENDPOINTS.REVIEWS.DELETE(id), {
            method: "DELETE",
        });
    },

    async getProductRatingSummary(productId: number): Promise<ReviewStatsResponse> {
        return apiClient(ENDPOINTS.REVIEWS.RATING_SUMMARY(productId));
    },

    async uploadReviewMedia(id: number, file: File): Promise<any> {
        const formData = new FormData();
        formData.append("media", file);

        return apiClient(ENDPOINTS.REVIEWS.UPLOAD_MEDIA(id), {
            method: "POST",
            body: formData,
        });
    },

    async uploadTempMedia(file: File): Promise<{ success: boolean; data: { url: string } }> {
        const formData = new FormData();
        formData.append("media", file);

        return apiClient(ENDPOINTS.REVIEWS.UPLOAD_TEMP, {
            method: "POST",
            body: formData,
        });
    }
};
