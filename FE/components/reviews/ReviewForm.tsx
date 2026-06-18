"use client";

import { useCreateReview, useUploadReviewMedia } from "@/features/reviews/useReviews";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { StarRating } from "@/components/ui/star-rating";
import { useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { resolveMediaUrl } from "@/lib/media";
import { useI18n } from "@/lib/i18n/I18nContext";

interface ReviewFormProps {
    productId: number;
    productName: string;
    productImage: string;
    isOpen: boolean;
    onClose: () => void;
    isVerifiedPurchase?: boolean;
}

export const ReviewForm = ({
    productId,
    productName,
    productImage,
    isOpen,
    onClose,
    isVerifiedPurchase = false,
}: ReviewFormProps) => {
    const { t } = useI18n();
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState(""); // Optional in backend, but good for UI
    const [content, setContent] = useState("");
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const createReviewMutation = useCreateReview();
    const uploadMediaMutation = useUploadReviewMedia();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const result: any = await uploadMediaMutation.mutateAsync(file);
            // The backend returns { success: true, data: { url: "..." } } based on reviewService implementation
            if (result?.success && result?.data?.url) {
                setMediaUrl(result.data.url);
            } else if (result?.data?.url) {
                // Fallback check
                setMediaUrl(result.data.url);
            }
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            await createReviewMutation.mutateAsync({
                product_id: productId,
                rating,
                title: title || undefined,
                content,
                media_url: mediaUrl || undefined,
                is_verified_purchase: isVerifiedPurchase
            });
            onClose();
        } catch (error) {
            // Error handled in hook
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t('review.form.title')}</DialogTitle>
                    <DialogDescription>
                        {t('review.form.desc')}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg mb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resolveMediaUrl(productImage)} alt={productName} className="h-16 w-16 object-cover rounded-md border" />
                    <div>
                        <h4 className="font-medium text-gray-900 line-clamp-1">{productName}</h4>
                        <p className="text-xs text-green-600 font-medium">{t('review.form.verified')}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex flex-col items-center gap-2">
                        <Label>{t('review.form.ratingQ')}</Label>
                        <div className="p-2">
                            <StarRating rating={rating} size={32} interactive onRatingChange={setRating} />
                        </div>
                        <span className="text-sm font-medium text-pink-600">
                            {rating === 5 ? t('review.form.rating5') : rating === 4 ? t('review.form.rating4') : rating === 3 ? t('review.form.rating3') : rating === 2 ? t('review.form.rating2') : t('review.form.rating1')}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="content">{t('review.form.contentLabel')}</Label>
                        <Textarea
                            id="content"
                            placeholder={t('review.form.contentPlaceholder')}
                            className="min-h-[100px] resize-none"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    <div>
                        <Label className="mb-2 block">{t('review.form.addImage')}</Label>

                        {mediaUrl ? (
                            <div className="relative inline-block">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={resolveMediaUrl(mediaUrl)} alt="Preview" className="h-24 w-24 object-cover rounded-md border" />
                                <button
                                    onClick={() => setMediaUrl(null)}
                                    className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 border shadow-sm hover:bg-gray-100"
                                >
                                    <X className="h-4 w-4 text-gray-500" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Input
                                    id="media"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    disabled={isUploading}
                                />
                                <Label
                                    htmlFor="media"
                                    className={`flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                                >
                                    {isUploading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <ImagePlus className="h-4 w-4 text-gray-500" />
                                    )}
                                    <span className="text-sm text-gray-600">
                                        {isUploading ? t('review.form.uploading') : t('review.form.chooseImage')}
                                    </span>
                                </Label>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={onClose} disabled={createReviewMutation.isPending}>{t('common.cancel')}</Button>
                    <Button
                        onClick={handleSubmit}
                        className="bg-pink-600 hover:bg-pink-700"
                        disabled={createReviewMutation.isPending || isUploading}
                    >
                        {createReviewMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {t('review.form.submit')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
