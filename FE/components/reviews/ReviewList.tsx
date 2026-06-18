"use client";

import { useProductReviews, useProductRatingSummary } from "@/features/reviews/useReviews";
import { ReviewItem } from "./ReviewItem";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { StarRating } from "@/components/ui/star-rating";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Filter, Star, PenLine } from "lucide-react";
import { ReviewForm } from "./ReviewForm";
import { useI18n } from "@/lib/i18n/I18nContext";

interface ReviewListProps {
    productId: number;
    productName?: string;
    productImage?: string;
}

export const ReviewList = ({ productId, productName, productImage }: ReviewListProps) => {
    const [filterRating, setFilterRating] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const { t } = useI18n();

    const { data: reviewsData, isLoading: isLoadingReviews } = useProductReviews(productId, {
        page,
        limit: 5,
        rating: filterRating !== "all" ? Number(filterRating) : undefined
    });

    const { data: summaryData, isLoading: isLoadingSummary } = useProductRatingSummary(productId);

    if (isLoadingReviews && isLoadingSummary) {
        return <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>;
    }

    const stats = summaryData?.data;
    const reviews = reviewsData?.data || [];
    const pagination = reviewsData?.pagination;

    return (
        <div className="space-y-10">
            {/* Rating Summary */}
            <div className="grid md:grid-cols-3 gap-8 bg-gray-50 p-6 rounded-2xl">
                {/* Overall Rating */}
                <div className="text-center flex flex-col justify-center items-center border-r border-gray-200 pr-8">
                    <div className="text-5xl font-bold text-gray-900 mb-2">
                        {stats?.avg_rating?.toFixed(1) || "0.0"}
                    </div>
                    <StarRating rating={stats?.avg_rating || 0} size={20} className="mb-2" />
                    <p className="text-gray-500 text-sm">{t('reviews.count', { count: stats?.review_count || 0 })}</p>
                </div>

                {/* Rating Bars */}
                <div className="col-span-2 flex flex-col justify-center gap-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                        const count = stats?.distribution?.[star as keyof typeof stats.distribution] || 0;
                        const total = stats?.review_count || 1; // avoid division by zero
                        const percentage = (count / total) * 100;

                        return (
                            <div key={star} className="flex items-center gap-3">
                                <div className="flex items-center gap-1 w-12 flex-shrink-0 text-sm font-medium text-gray-700">
                                    {star} <Star className="h-3 w-3 fill-gray-400 text-gray-400" />
                                </div>
                                <Progress value={percentage} className="h-2 flex-1" indicatorClassName="bg-yellow-400" />
                                <span className="w-8 text-xs text-gray-500 text-right">{count}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Reviews List */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">{t('reviews.fromCustomers')}</h3>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">{t('reviews.filterBy')}</span>
                        <Select value={filterRating} onValueChange={(val) => { setFilterRating(val); setPage(1); }}>
                            <SelectTrigger className="w-[140px] h-9">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-3.5 w-3.5" />
                                    <SelectValue placeholder={t('reviews.allStars')} />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('reviews.allStars')}</SelectItem>
                                <SelectItem value="5">{t('reviews.stars', { n: 5 })}</SelectItem>
                                <SelectItem value="4">{t('reviews.stars', { n: 4 })}</SelectItem>
                                <SelectItem value="3">{t('reviews.stars', { n: 3 })}</SelectItem>
                                <SelectItem value="2">{t('reviews.stars', { n: 2 })}</SelectItem>
                                <SelectItem value="1">{t('reviews.stars', { n: 1 })}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={() => setIsReviewOpen(true)}
                            className="bg-slate-900 hover:bg-slate-800 text-white"
                        >
                            <PenLine className="w-4 h-4 mr-2" />
                            {t('reviews.writeReview')}
                        </Button>
                    </div>
                </div>

                {reviews.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <Star className="h-6 w-6 text-gray-400" />
                        </div>
                        <h4 className="text-gray-900 font-medium mb-1">{t('reviews.noReviews')}</h4>
                        <p className="text-gray-500 text-sm">{t('reviews.noReviewsDesc')}</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {reviews.map((review) => (
                            <ReviewItem key={review.id} review={review} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                    <div className="flex justify-center mt-8 gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                        >
                            {t('reviews.prev')}
                        </Button>
                        <div className="flex items-center px-4 font-medium text-sm">
                            {t('reviews.page', { page, total: pagination.pages })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === pagination.pages}
                            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                        >
                            {t('reviews.next')}
                        </Button>

                    </div>
                )}

            </div>

            <ReviewForm
                productId={productId}
                productName={productName || t('reviews.product')}
                productImage={productImage || ""}
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
                isVerifiedPurchase={false}
            />
        </div>
    );
};
