"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { resolveMediaUrl } from "@/lib/media";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShoppingBag, ChevronRight } from "lucide-react";

interface SharedProductCardProps {
    payload: {
        product_id: number | string;
        product_name: string;
        product_price: number;
        // ✅ Support both old and new field names
        product_image_url?: string;
        product_image?: string;
        image_url?: string;
        seller_name?: string;
        product_brand?: string;
        seller_avatar?: string;
        product_description?: string;
    };
}

export const SharedProductCard = ({ payload }: SharedProductCardProps) => {
    if (!payload) return null;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    // ✅ Support both old and new field names
    const imageUrl = resolveMediaUrl(
        payload.product_image || payload.product_image_url || payload.image_url
    );
    const sellerName = payload.product_brand || payload.seller_name || "Nhà bán";
    const sellerAvatar = resolveMediaUrl(payload.seller_avatar);

    return (
        <Link href={`/product/${payload.product_id}`} className="block group">
            <Card className="p-3 border-0 shadow-sm bg-secondary/30 group-hover:shadow-md group-hover:bg-secondary/50 transition-all duration-300 rounded-xl max-w-sm">
                {/* Seller Info */}
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-secondary/50">
                    <Avatar className="w-5 h-5 border">
                        <AvatarImage src={sellerAvatar} />
                        <AvatarFallback className="text-[8px]">{sellerName[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] font-medium text-muted-foreground truncate">
                        {sellerName}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-muted">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={payload.product_name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/5">
                                <ShoppingBag className="w-6 h-6 text-primary/20" />
                            </div>
                        )}
                        <Badge className="absolute top-0 left-0 rounded-none rounded-br-lg bg-primary text-[8px] py-0 px-1 border-0">
                            Sale
                        </Badge>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {payload.product_name}
                        </h4>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-bold text-primary">
                                {formatPrice(payload.product_price)}
                            </span>
                            <div className="flex items-center text-[10px] text-muted-foreground font-medium group-hover:text-primary transition-colors">
                                <span>Mua ngay</span>
                                <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    );
};
