"use client";
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient, API_BASE_URL } from '@/lib/api';
import { ENDPOINTS } from '@/constants/endpoint';
import { toast } from 'sonner';
import { useSocketIO } from '@/hooks/useSocketIO';
import { resolveMediaUrl } from '@/lib/media';


interface ShareDialogProps {
  children: React.ReactNode;
  itemType: 'product' | 'post' | 'profile';
  item: any;
}


export const ShareDialog = ({ children, itemType, item }: ShareDialogProps) => {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { socket, isConnected } = useSocketIO({ autoConnect: true });

  useEffect(() => {
    if (open && user) {
      const fetchConversations = async () => {
        setIsLoading(true);
        try {
          const response = await apiClient(ENDPOINTS.MESSAGES.GET_CONVERSATIONS, {
            method: "GET",
          });
          // Chuẩn hóa nhiều dạng trả về khác nhau
          const pickArray = (res: any) => {
            if (Array.isArray(res)) return res;
            if (Array.isArray(res?.data)) return res.data;
            if (Array.isArray(res?.data?.data)) return res.data.data;
            return [];
          };
          const list = pickArray(response);
          setConversations(list);
        } catch (error) {
          toast.error("Failed to load conversations.");
        }
        setIsLoading(false);
      };
      fetchConversations();
    }
  }, [open, user]);

  const getOtherParticipant = (conversation: any) => {
    if (!conversation || !user) return null;

    // Handle shop conversations
    if (conversation.type === 'user_shop') {
      const shopParticipant = conversation.participants?.find(
        (p: any) => p.entity_type === 'shop' && p.shop
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
        return participantUserId !== user.id && p.entity_type === 'user';
      });
      if (found?.user) return found.user;
      if (found) return { id: found.user_id, full_name: found.full_name, avatar_url: found.avatar_url };
    }

    // Fallback shapes
    if (conversation.other_user) return conversation.other_user;
    return null;
  };

  const pickPostImage = (it: any) => {
    if (!it) return '';

    // Try from post_media array - use first media
    const mediaArr = it.post_media || it.media || [];
    if (Array.isArray(mediaArr) && mediaArr.length > 0) {
      const firstMedia = mediaArr[0];
      return firstMedia?.media_url || firstMedia?.url || '';
    }

    // Fallback to direct image fields
    const c1 = it.post_image_url || it.post_cover_url || it.cover_url || it.coverImageUrl || it.cover_image_url;
    if (c1) return c1;

    return '';
  };

  const handleShare = async (conversation: any) => {
    const otherUser = getOtherParticipant(conversation);
    if (!otherUser || !user) return;

    try {
      // Determine type and payload
      let type = 'SHARE_POST';
      let payload: any = {};

      if (itemType === 'product') {
        type = 'SHARE_PRODUCT';
        payload = {
          product_id: item.id,
          product_name: item.name,
          product_price: item.price,
          product_image_url: item.images?.[0]?.image_url || item.image_url || item.image || '',
          seller_name: item.seller?.name || item.shop?.name || '',
          seller_avatar: item.seller?.avatar || item.shop?.logo_url || ''
        };
      } else if (itemType === 'profile') {
        type = 'SHARE_PROFILE';
        payload = {
          profile_id: item.id,
          full_name: item.full_name || item.name || '',
          avatar_url: item.avatar_url || item.avatar || '',
        };
      } else {
        // Default to post
        type = 'SHARE_POST';
        payload = {
          post_id: item.id,
          post_title: item.title,
          post_image_url: pickPostImage(item),
          author_name: item.shop?.name || item.user?.full_name || item.author_name || '',
          author_avatar: item.shop?.logo_url || item.user?.avatar_url || item.author_avatar || ''
        };
      }

      // Prepare share data for socket
      const shareData: any = {
        senderId: user.id,
        content: '', // No text, just the shared content
        type,
        payload,
        conversationId: conversation.id,
      };

      // ✅ Add ID fields for backend to save to database
      if (itemType === 'post') {
        shareData.postId = item.id; // ✅ Include postId for SHARE_POST
      } else if (itemType === 'profile') {
        shareData.sharedProfileId = item.id; // ✅ Include sharedProfileId for SHARE_PROFILE
      } else if (itemType === 'product') {
        shareData.productPayload = payload; // ✅ Include productPayload for SHARE_PRODUCT
      }

      // Check if this is a shop conversation
      if (otherUser.is_shop) {
        shareData.shopId = otherUser.id;
      } else {
        shareData.receiverId = otherUser.id;
      }

      // Use socket if connected, fallback to HTTP
      if (isConnected && socket) {
        socket.emit('sendMessage', shareData);
        toast.success(`Shared ${itemType} with ${otherUser.full_name}`);
        setOpen(false);
      } else {
        // Fallback to HTTP API
        const messageData: any = {
          conversation_id: conversation.id,
          content: shareData.content,
          messageType: shareData.type,
          payload: shareData.payload,
        };

        // ✅ Thêm ID fields để backend lưu cả ID và payload
        if (itemType === 'post') {
          messageData.postId = item.id; // ✅ Gửi postId
        } else if (itemType === 'profile') {
          messageData.sharedProfileId = item.id; // ✅ Gửi sharedProfileId
        }

        await apiClient(ENDPOINTS.MESSAGES.SEND, {
          method: "POST",
          body: JSON.stringify(messageData),
        });

        toast.success(`Shared ${itemType} with ${otherUser.full_name}`);
        setOpen(false);
      }
    } catch (error) {
      toast.error("Không thể chia sẻ. Vui lòng thử lại.");
    }
  };

  const resolveMediaUrl = (u: string | undefined) => {
    if (!u) return '';
    if (u.startsWith('http') || u.startsWith('blob:') || u.startsWith('data:')) return u;
    return `${API_BASE_URL}${u.startsWith('/') ? u : `/${u}`}`;
  };

  const triggerChild = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: any) => {
        try { (children as any).props?.onClick?.(e); } catch { }
        setOpen(true);
      },
    })
    : <span onClick={() => setOpen(true)}>{children}</span>;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerChild}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share {itemType}</DialogTitle>
          <DialogDescription>Chọn cuộc trò chuyện để chia sẻ.</DialogDescription>
        </DialogHeader>
        <div>
          {isLoading ? (
            <p>Loading conversations...</p>
          ) : conversations.length === 0 ? (
            <div className="text-sm text-gray-600 p-3">Không có cuộc hội thoại nào. Hãy nhắn tin trước rồi chia sẻ.</div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv: any) => {
                const otherUser = getOtherParticipant(conv);
                if (!otherUser) return null;
                return (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-all duration-150 cursor-pointer hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="transition-transform duration-150 group-hover:scale-[1.02]">
                        <AvatarImage src={resolveMediaUrl(otherUser.avatar_url)} />
                        <AvatarFallback>{otherUser.full_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <span>{otherUser.full_name}</span>
                    </div>
                    <Button onClick={() => handleShare(conv)} size="sm" className="transition-transform duration-150 hover:-translate-y-0.5">Share</Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
