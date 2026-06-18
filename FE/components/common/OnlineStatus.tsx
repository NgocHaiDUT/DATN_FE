"use client";

import React from "react";
import { useSocketStore } from "@/stores/socket.store";
import { cn } from "@/lib/utils";

interface OnlineStatusProps {
    userId?: number;
    shopId?: number;
    className?: string;
    size?: "sm" | "md" | "lg";
}

export const OnlineStatus: React.FC<OnlineStatusProps> = ({
    userId,
    shopId,
    className,
    size = "md",
}) => {
    const isUserOnline = useSocketStore((state) => state.isUserOnline(userId));
    const isShopOnline = useSocketStore((state) => state.isShopOnline(shopId));

    const isOnline = userId ? isUserOnline : isShopOnline;

    if (!isOnline) return null;

    const sizeClasses = {
        sm: "w-2 h-2",
        md: "w-3 h-3 border-2",
        lg: "w-4 h-4 border-2",
    };

    return (
        <span
            className={cn(
                "absolute bottom-0 right-0 bg-green-500 rounded-full border-white animate-pulse",
                sizeClasses[size],
                className
            )}
            title="Đang hoạt động"
        />
    );
};