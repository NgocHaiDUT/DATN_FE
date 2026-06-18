"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, HeartOff } from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { useI18n } from "@/lib/i18n/I18nContext";

interface LikeButtonProps {
  targetType: string;
  targetId: number;
  className?: string;
  initialLiked?: boolean;
  initialCount?: number;
}

const LikeButton = ({
  targetType,
  targetId,
  className = "",
  initialLiked = false,
  initialCount = 0,
}: LikeButtonProps) => {
    const { user } = useAuthStore();
    const userId = user?.id;
    const { t } = useI18n();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  // Đồng bộ lại state khi dữ liệu từ server (list posts) thay đổi sau refresh/refetch
  useEffect(() => {
    setIsLiked(initialLiked);
  }, [initialLiked]);

  useEffect(() => {
    setLikeCount(initialCount);
  }, [initialCount]);

  // Sau khi reload, gọi API stats để biết chính xác user hiện tại đã like hay chưa
  useEffect(() => {
    const fetchLikeStats = async () => {
      try {
        if (!userId) {
          // Chưa đăng nhập: giữ nguyên giá trị initial từ list posts
          return;
        }

        const res: any = await apiClient(
          `/likes/stats/${targetType}/${targetId}?userId=${userId}`,
          { method: "GET" }
        );

        if (!res || res.success === false) {
          // API lỗi (ví dụ 401) thì không override, giữ giá trị hiện tại
          return;
        }

        const data = (res as any).data ?? res;
        const likedFromStats =
          data?.user_liked ?? data?.is_liked ?? data?.liked ?? false;
        setIsLiked(!!likedFromStats);
        if (typeof data?.total_likes === "number") {
          setLikeCount(data.total_likes);
        }
      } catch {
        // Im lặng nếu lỗi, tránh spam console/toast
      }
    };

    if (targetId && targetType) {
      fetchLikeStats();
    }
  }, [targetId, targetType, userId]);

    const handleToggleLike = async () => {
        if (isLoading) return;
        if (!userId) {
            toast.error(t('like.loginRequired'));
            return;
        }

        setIsLoading(true);

        try {
            const res: any = await apiClient(
                `/likes/toggle/${targetType}/${targetId}`,
                {
                    method: "POST",
                    body: JSON.stringify({ userId }),
                }
            );

            if (!res || res.success === false) {
                throw new Error(res?.message || 'Failed to toggle like');
            }

            const data = (res as any).data ?? res;
            const liked =
              data.liked ?? data.is_liked ?? data.user_liked ?? false;
            setIsLiked(!!liked);
            setLikeCount(data.total_likes ?? data.like_count ?? 0);

            if (liked) {
                toast.success(t('like.liked'));
            } else {
                toast.success(t('like.unliked'));
            }
        } catch (error) {
toast.error(t('like.error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleLike}
            disabled={isLoading}
            className={`flex items-center gap-2 ${className}`}
        >
            {isLiked ? (
                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
            ) : (
                <HeartOff className="h-4 w-4" />
            )}
            <span className="text-sm">{likeCount}</span>
        </Button>
    );
};

export default LikeButton;
