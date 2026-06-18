"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveMediaUrl } from "@/lib/media";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/auth.store";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";

interface Product {
    id: string | number;
    name: string;
    price: number;
    image?: string;
    brand?: { id: number; name: string } | string;
    description?: string;
    product_media?: Array<{ url: string }>;
}

interface ShareProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product;
    onShare?: () => void;
}

export function ShareProductDialog({
    open,
    onOpenChange,
    product,
    onShare,
}: ShareProductDialogProps) {
    const user = useAuthStore((s) => s.user);
    const [conversations, setConversations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (open && user) {
            fetchConversations();
        }
    }, [open, user]);

    const fetchConversations = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient(ENDPOINTS.MESSAGES.GET_CONVERSATIONS, {
                method: "GET",
            });

            // Normalize different response formats
            const pickArray = (res: any) => {
                if (Array.isArray(res)) return res;
                if (Array.isArray(res?.data)) return res.data;
                if (Array.isArray(res?.data?.data)) return res.data.data;
                return [];
            };

            const list = pickArray(response);
            setConversations(list);
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể tải danh sách cuộc trò chuyện",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getOtherParticipant = (conversation: any) => {
        if (!conversation || !user) return null;

        // Handle shop conversations
        if (conversation.type === "user_shop") {
            const shopParticipant = conversation.participants?.find(
                (p: any) => p.entity_type === "shop" && p.shop
            );
            if (shopParticipant?.shop) {
                return {
                    id: shopParticipant.shop.id,
                    full_name: shopParticipant.shop.name,
                    avatar_url: shopParticipant.shop.logo_url,
                    is_shop: true,
                };
            }
        }

        // Handle regular user conversations
        if (Array.isArray(conversation.participants)) {
            const found = conversation.participants.find((p: any) => {
                const participantUserId = p?.user?.id ?? p?.user_id;
                return participantUserId !== user.id && p.entity_type === "user";
            });
            if (found?.user) return found.user;
            if (found)
                return {
                    id: found.user_id,
                    full_name: found.full_name,
                    avatar_url: found.avatar_url,
                };
        }

        // Fallback
        if (conversation.other_user) return conversation.other_user;
        return null;
    };

    const getProductImage = (): string => {
        if (product.product_media && product.product_media.length > 0) {
            const resolved = resolveMediaUrl(product.product_media[0].url);
            if (resolved) return resolved;
        }
        if (product.image) {
            const resolved = resolveMediaUrl(product.image);
            if (resolved) return resolved;
        }
        return "";
    };

    const handleShare = async (conversation: any) => {
        const otherUser = getOtherParticipant(conversation);
        if (!otherUser || !user) return;

        try {
            const brandName =
                typeof product.brand === "object" ? product.brand.name : product.brand;

            const payload = {
                product_id: product.id,
                product_name: product.name,
                product_brand: brandName || "",
                product_price: product.price,
                product_image: getProductImage(),
                product_description: product.description || "",
            };

            const messageData = {
                conversation_id: conversation.id,
                content: `Chia sẻ sản phẩm: ${product.name}`,
                messageType: "SHARE_PRODUCT",
                payload: payload,
            };

            await apiClient(ENDPOINTS.MESSAGES.SEND, {
                method: "POST",
                body: JSON.stringify(messageData),
            });

            toast({
                title: "Thành công",
                description: `Đã chia sẻ sản phẩm với ${otherUser.full_name}`,
            });

            onShare?.();
            onOpenChange(false);
        } catch (error) {
            console.error("Error sharing product:", error);
            toast({
                title: "Lỗi",
                description: "Không thể chia sẻ sản phẩm. Vui lòng thử lại.",
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Chia sẻ sản phẩm</DialogTitle>
                    <DialogDescription>
                        Chọn cuộc trò chuyện để chia sẻ sản phẩm này.
                    </DialogDescription>
                </DialogHeader>

                <div>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-pink-600 mb-2" />
                            <p className="text-sm text-muted-foreground">Đang tải...</p>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="text-sm text-muted-foreground p-3 text-center">
                            Không có cuộc hội thoại nào. Hãy nhắn tin trước rồi chia sẻ.
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {conversations.map((conv: any) => {
                                const otherUser = getOtherParticipant(conv);
                                if (!otherUser) return null;

                                return (
                                    <div
                                        key={conv.id}
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage
                                                    src={resolveMediaUrl(otherUser.avatar_url) ?? undefined}
                                                />
                                                <AvatarFallback>
                                                    {otherUser.full_name?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{otherUser.full_name}</span>
                                        </div>
                                        <Button
                                            onClick={() => handleShare(conv)}
                                            size="sm"
                                            className="bg-pink-600 hover:bg-pink-700"
                                        >
                                            Gửi
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
