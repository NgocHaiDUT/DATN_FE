"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { resolveMediaUrl } from "@/lib/media";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, ChevronRight, Store } from "lucide-react";

interface SharedProfileCardProps {
    payload: {
        id?: number | string;
        profile_id?: number | string;
        userId?: number | string;
        full_name?: string;
        name?: string;
        avatar_url?: string;
        avatar?: string;
        bio?: string;
        story?: string;
        is_shop?: boolean;
    };
}

export const SharedProfileCard = ({ payload }: SharedProfileCardProps) => {
    if (!payload) return null;

    const profileId = payload.profile_id ?? payload.userId ?? payload.id;
    const fullName = payload.full_name ?? payload.name ?? "Người dùng";
    const avatar = payload.avatar_url ?? payload.avatar;
    const bio = payload.bio ?? payload.story ?? "Khám phá trang cá nhân của tôi để xem thêm nhiều bài viết và sản phẩm thú vị.";

    const avatarUrl = avatar ? resolveMediaUrl(avatar) : undefined;

    if (!profileId) {
        return (
            <Card className="p-4 bg-muted/50 border-dashed">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Dữ liệu người dùng không hợp lệ
                </p>
            </Card>
        );
    }

    return (
        <Link href={`/profile/${profileId}`} className="block group">
            <Card className="overflow-hidden border-0 shadow-sm transition-all duration-300 group-hover:shadow-md bg-secondary/30 max-w-sm rounded-xl">
                <div className="relative p-6 flex flex-col items-center bg-gradient-to-br from-primary/10 via-secondary/10 to-transparent">
                    <Avatar className="w-20 h-20 border-4 border-white shadow-lg mb-3 transition-transform duration-500 group-hover:scale-110">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                            {fullName[0]}
                        </AvatarFallback>
                    </Avatar>

                    <Badge className="absolute top-2 left-2 bg-black/50 backdrop-blur-md border-0 text-[10px] py-0 px-2">
                        Profile
                    </Badge>

                    <div className="flex items-center gap-1.5 justify-center w-full min-w-0">
                        <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">
                            {fullName}
                        </h3>
                        {payload.is_shop && (
                            <Badge variant="secondary" className="h-4 px-1 bg-green-500 rounded flex items-center justify-center text-[10px] text-white flex-shrink-0">
                                <Store className="h-2.5 w-2.5 mr-0.5" />
                                Shop
                            </Badge>
                        )}
                    </div>
                    <p className="text-[11px] text-muted-foreground text-center mt-1 line-clamp-2 px-4 h-[2rem]">
                        {bio}
                    </p>
                </div>

                <div className="px-3 pb-3">
                    <div className="pt-2 border-t flex items-center justify-between text-[11px] font-medium text-primary">
                        <span>Trang cá nhân</span>
                        <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                    </div>
                </div>
            </Card>
        </Link>
    );
};
