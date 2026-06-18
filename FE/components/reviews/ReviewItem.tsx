"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/ui/star-rating";
import { Review } from "@/types/review.types";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { CheckCircle2, ThumbsUp } from "lucide-react";
import { resolveMediaUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/I18nContext";

interface ReviewItemProps {
    review: Review;
}

export const ReviewItem = ({ review }: ReviewItemProps) => {
    const { t, locale } = useI18n();
    return (
        <div className="py-6 border-b border-gray-100 last:border-0">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-gray-100">
                        <AvatarImage src={resolveMediaUrl(review.user.avatar_url)} alt={review.user.full_name} />
                        <AvatarFallback>{review.user.full_name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">{review.user.full_name}</h4>
                            {review.is_verified_purchase && (
                                <span className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    {t('review.verifiedPurchase')}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <StarRating rating={review.rating} size={14} />
                            <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: locale === 'en' ? undefined : vi })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pl-[52px]">
                {review.title && <h5 className="font-medium text-gray-900 mb-1">{review.title}</h5>}
                <p className="text-gray-600 text-sm leading-relaxed mb-3">
                    {review.content}
                </p>

                {review.media_url && (
                    <div className="mb-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={resolveMediaUrl(review.media_url)}
                            alt="Review attachment"
                            className="h-24 w-24 object-cover rounded-md border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(resolveMediaUrl(review.media_url), '_blank')}
                        />
                    </div>
                )}

                <div className="flex items-center gap-4 mt-2">
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-500 text-xs hover:text-gray-900">
                        <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                        {t('review.helpful')}
                    </Button>
                    {/* Potential Reply Button for Shop Owner */}
                </div>
            </div>
        </div>
    );
};
