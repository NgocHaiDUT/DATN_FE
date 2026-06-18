"use client";

import { useRouter } from "next/navigation";
import { Send, ImageIcon, Video, X, Plus, Heart, Store, MessageSquare } from "lucide-react";
import { useChat } from "@/features/chat/useChat";
import { resolveMediaUrl } from "@/lib/media";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SharedProductCard } from "@/components/common/SharedProductCard";
import { SharedProfileCard } from "@/components/common/SharedProfileCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import clsx from "clsx";
import { ROUTES } from "@/constants/routes";
import { OnlineStatus } from "@/components/common/OnlineStatus";

const getMessageRenderKey = (msg: any, index: number) => {
  const id = msg?.id ?? msg?.message_id;
  const createdAt = msg?.created_at ?? msg?.createdAt;

  if (id !== undefined && id !== null && id !== "") {
    return `msg-${id}-${createdAt || "no-date"}-${index}`;
  }

  return `msg-idx-${index}`;
};

export default function ChatPage() {
  const router = useRouter();
  const {
    conversations,
    selectedConversation,
    setSelectedConversation,
    messages,
    messageInput,
    setMessageInput,
    handleSendMessage,
    handleFileSelect,
    removeFile,
    selectedFiles,
    filePreviews,
    uploadProgress,
    uploadingFiles,
    messagesEndRef,
    showNewChatDialog,
    setShowNewChatDialog,
    userSearchQuery,
    setUserSearchQuery,
    searchResults,
    startNewConversation,
    isSending,
    currentUserId,
    reactToMessage,
    deleteMessage,
    imageInputRef,
    videoInputRef,
  } = useChat();

  // Get other participant (handles both user and shop)
  const otherUser = selectedConversation
    ? (() => {
      // Use the getOtherParticipant function from useChat hook
      if (!selectedConversation?.participants || !currentUserId) return null;

      // For user_shop conversations, find the shop participant
      if (selectedConversation.type === 'user_shop') {
        const shopParticipant = selectedConversation.participants.find(
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

      // For regular user conversations
      const userParticipant = selectedConversation.participants.find(
        (p: any) => p.user_id !== currentUserId && p.entity_type === 'user'
      );

      return userParticipant?.user || null;
    })()
    : null;

  const handleProfileClick = (participant: any) => {
    if (participant?.is_shop) {
      router.push(ROUTES.SHOP.SHOP_DETAIL(participant.id));
    } else {
      router.push(ROUTES.PROFILE.PUBLIC(participant?.id || participant));
    }
  };

  const getMessagePreview = (message: any) => {
    if (!message) return "Chưa có tin nhắn";

    switch (message.type) {
      case "IMAGE":
        return "📷 Đã gửi ảnh";
      case "VIDEO":
        return "🎥 Đã gửi video";
      case "SHARE_POST":
        return "📝 Đã chia sẻ bài viết";
      case "SHARE_PRODUCT":
        return "🛍️ Đã chia sẻ sản phẩm";
      case "SHARE_PROFILE":
        return "👤 Đã chia sẻ hồ sơ";
      case "STORY_REPLY":
        return "💬 Đã phản hồi story";
      case "TEXT":
      default:
        return message.content || "Tin nhắn";
    }
  };

  const MessageContent = ({ message }: { message: any }) => {
    const type = (message.type || message.message_type || message.messageType || 'TEXT').toUpperCase();

    switch (type) {
      case "IMAGE": {
        const rawMedia =
          message.mediaFiles?.map((m: any) => m.url) ||
          message.media_urls ||
          message.message_media?.map((m: any) => m.media_url) ||
          message.media?.map((m: any) => m.url) ||
          message.files?.map((f: any) => f.url) || [];
        // Filter out empty or invalid URLs
        const mediaList = Array.isArray(rawMedia)
          ? rawMedia
            .map((url: any) => resolveMediaUrl(url))
            .filter((url): url is string => typeof url === 'string' && url.trim() !== '')
          : [];

        if (mediaList.length === 0) return null;

        return (
          <div className="space-y-2">
            {message.content && <p className="mb-1">{message.content}</p>}
            {mediaList.map((url: string, idx: number) => (
              <div key={idx} className="relative w-full max-w-60 aspect-auto rounded-lg overflow-hidden border bg-background">
                <img
                  src={url}
                  alt="Image message"
                  className="object-cover w-full h-auto"
                />
              </div>
            ))}
          </div>
        );
      }
      case "VIDEO": {
        const rawMedia =
          message.mediaFiles?.map((m: any) => m.url) ||
          message.media_urls ||
          message.message_media?.map((m: any) => m.media_url) ||
          message.media?.map((m: any) => m.url) ||
          message.files?.map((f: any) => f.url) || [];
        // Filter out empty or invalid URLs
        const mediaList = Array.isArray(rawMedia)
          ? rawMedia
            .map((url: any) => resolveMediaUrl(url))
            .filter((url): url is string => typeof url === 'string' && url.trim() !== '')
          : [];

        if (mediaList.length === 0) return null;

        return (
          <div className="space-y-2">
            {message.content && <p className="mb-1">{message.content}</p>}
            {mediaList.map((url: string, idx: number) => (
              <div key={idx} className="relative w-full max-w-[320px] aspect-video rounded-lg overflow-hidden border bg-black">
                <video
                  src={url}
                  controls
                  className="w-full h-full"
                />
              </div>
            ))}
          </div>
        );
      }
      case "SHARE_PRODUCT": {
        const productPayload = message.payload || message.shared_product_data || message.sharePayload;
        return (
          <div className="w-full max-w-75">
            {message.content && <p className="mb-2 text-sm">{message.content}</p>}
            <SharedProductCard payload={productPayload} />
          </div>
        );
      }
      case "SHARE_PROFILE": {
        const profilePayload = message.shared_profile_data || message.sharePayload || message.payload;
        return (
          <div className="w-full max-w-75">
            {message.content && <p className="mb-2 text-sm">{message.content}</p>}
            <SharedProfileCard payload={profilePayload} />
          </div>
        );
      }
      case "STORY_REPLY": {
        // data: { storyId, storyUrl, storyType, replyText }
        const story = message.story_reply_data || message.sharePayload;
        const mediaUrl = resolveMediaUrl(story?.media_url || story?.storyUrl);
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <div className="w-0.5 h-3 bg-primary rounded-full"></div>
              <span>Đã phản hồi tin của {story?.owner_name || "người dùng"}</span>
            </div>
            <div className="flex gap-2 p-1 bg-muted/50 rounded-lg border border-transparent hover:border-border transition-colors cursor-pointer w-full max-w-70">
              <div className="w-10 h-14 shrink-0 rounded overflow-hidden bg-black relative">
                {story?.story_type === 'video' || story?.type === 'video' ? (
                  <video src={mediaUrl} className="w-full h-full object-cover" />
                ) : (
                  <img src={mediaUrl} alt="Story" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="text-sm line-clamp-2 italic opacity-80">"{message.content}"</p>
              </div>
            </div>
          </div>
        );
      }
      case "TEXT":
      default:
        return <p className="whitespace-pre-wrap wrap-break-word">{message.content}</p>;
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-background">
      {/* ================= LEFT: Conversations ================= */}
      <aside className="w-80 border-r flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-lg">Chats</h2>
          <Button size="icon" variant="ghost" onClick={() => setShowNewChatDialog(true)}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv, index) => {
            // Get other participant (handles both user and shop)
            let user = null;
            if (conv.type === 'user_shop') {
              const shopParticipant = conv.participants?.find(
                (p: any) => p.entity_type === 'shop' && p.shop
              );
              if (shopParticipant?.shop) {
                user = {
                  id: shopParticipant.shop.id,
                  full_name: shopParticipant.shop.name,
                  avatar_url: shopParticipant.shop.logo_url,
                  is_shop: true,
                };
              }
            } else {
              const userParticipant = conv.participants?.find(
                (p: any) => p.user_id !== currentUserId && p.entity_type === 'user'
              );
              user = userParticipant?.user;
            }

            return (
              <div
                key={`${conv.id}-${index}`}
                onClick={() => setSelectedConversation(conv)}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted",
                  selectedConversation?.id === conv.id && "bg-muted"
                )}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={resolveMediaUrl(user?.avatar_url)} />
                    <AvatarFallback>
                      {user?.full_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <OnlineStatus
                    userId={!user?.is_shop ? user?.id : undefined}
                    shopId={user?.is_shop ? user?.id : undefined}
                    size="sm"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{user?.full_name}</p>
                    {user?.is_shop && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-green-100 text-green-700 border-green-200">
                        <Store className="h-3 w-3 mr-0.5" />
                        Shop
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {getMessagePreview(conv.last_message)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ================= RIGHT: Chat ================= */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        {selectedConversation ? (
          <div className="h-16 border-b flex items-center px-4 gap-3">
            <div className="relative">
              <Avatar
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => otherUser && handleProfileClick(otherUser)}
              >
                <AvatarImage src={resolveMediaUrl(otherUser?.avatar_url)} />
                <AvatarFallback>
                  {otherUser?.full_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <OnlineStatus
                userId={!otherUser?.is_shop ? otherUser?.id : undefined}
                shopId={otherUser?.is_shop ? otherUser?.id : undefined}
                size="sm"
              />
            </div>
            <div
              className="cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2"
              onClick={() => otherUser && handleProfileClick(otherUser)}
            >
              <p className="font-semibold">{otherUser?.full_name}</p>
              {otherUser?.is_shop && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                  <Store className="h-3 w-3 mr-1" />
                  Shop
                </Badge>
              )}
            </div>
          </div>
        ) : null}

        {selectedConversation ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, index) => {
                const isMine = Number(msg.sender_id) === Number(currentUserId);

                return (
                  <div
                    key={getMessageRenderKey(msg, index)}
                    className={clsx(
                      "group flex flex-col gap-1",
                      isMine ? "items-end" : "items-start"
                    )}
                  >
                    <div className={clsx("flex items-end gap-2", isMine ? "flex-row-reverse" : "flex-row")}>
                      <div
                        className={clsx(
                          "px-4 py-2 rounded-2xl text-sm relative",
                          isMine
                            ? "bg-primary text-white rounded-br-sm"
                            : "bg-muted rounded-bl-sm",
                          // Adjust styling for non-text messages
                          (msg.type === "SHARE_POST" || msg.type === "SHARE_PRODUCT" || msg.type === "SHARE_PROFILE") ? "p-1 bg-transparent text-foreground! font-normal" : "",
                          (msg.type === "IMAGE" || msg.type === "VIDEO") ? "p-2" : ""
                        )}
                      >
                        <MessageContent message={msg} />

                        {/* Reactions Display */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="absolute -bottom-3 flex gap-0.5 bg-background border rounded-full px-1.5 py-0.5 shadow-sm text-[10px] text-foreground z-10 transition-all">
                            {msg.reactions.map((r: any) => (
                              <span key={r.emoji}>{r.emoji} {r.count > 1 ? r.count : ''}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions (visible on hover) */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        {/* Reaction Button */}
                        <span
                          className="cursor-pointer hover:scale-110 transition-transform p-1 text-muted-foreground hover:text-foreground"
                          onClick={() => reactToMessage(msg.id, "👍")}
                          title="Thích"
                        >
                          <Heart size={14} />
                        </span>

                        {/* Delete Button (only for own messages) */}
                        {isMine && (
                          <span
                            className="cursor-pointer hover:scale-110 transition-transform p-1 text-muted-foreground hover:text-red-500"
                            onClick={() => {
                              if (confirm("Bạn có chắc muốn xóa tin nhắn này?")) {
                                deleteMessage(msg.id);
                              }
                            }}
                            title="Xóa"
                          >
                            <X size={14} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Optimistic Upload Files Display */}
              {uploadingFiles && filePreviews.length > 0 && (
                <div className="flex flex-col gap-2 items-end px-4">
                  {filePreviews.map((preview, index) => (
                    <div key={`upload-${index}`} className="flex items-end gap-2 flex-row-reverse animate-pulse">
                      <div className="relative p-2 rounded-2xl rounded-br-sm bg-primary/80 border text-white">
                        <div className="relative w-full max-w-50 aspect-square rounded-lg overflow-hidden">
                          {selectedFiles[index]?.type.startsWith('video/') ? (
                            <video src={preview} className="w-full h-full object-cover opacity-70" />
                          ) : (
                            <img src={resolveMediaUrl(preview) ?? ""} alt="Uploading" className="absolute inset-0 w-full h-full object-cover opacity-70" />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <div className="w-16 h-16 relative flex items-center justify-center">
                              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <circle
                                  cx="18"
                                  cy="18"
                                  r="16"
                                  fill="none"
                                  className="stroke-white/20"
                                  strokeWidth="3"
                                />
                                <circle
                                  cx="18"
                                  cy="18"
                                  r="16"
                                  fill="none"
                                  className="stroke-white transition-all duration-300"
                                  strokeWidth="3"
                                  strokeDasharray={`${uploadProgress[index] || 0}, 100`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              {uploadProgress[index] !== undefined && (
                                <span className="absolute text-xs font-bold text-white">{uploadProgress[index]}%</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {!uploadingFiles && filePreviews.length > 0 && (
              <div className="px-4 py-2 border-t flex gap-3 overflow-x-auto">
                {filePreviews.map((src, i) => (
                  <div key={i} className="relative w-24 h-24 rounded overflow-hidden">
                    <img src={resolveMediaUrl(src) ?? ""} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t p-4 flex items-center gap-2">
              <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e, "image")}
              />
              <input
                type="file"
                ref={videoInputRef}
                accept="video/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e, "video")}
              />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => imageInputRef.current?.click()}
              >
                <ImageIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => videoInputRef.current?.click()}
              >
                <Video />
              </Button>

              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Nhập tin nhắn..."
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />

              <Button onClick={handleSendMessage} disabled={isSending}>
                <Send size={16} />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-sm">Chọn một cuộc trò chuyện để bắt đầu nhắn tin</p>
          </div>
        )}
      </main>

      {/* ================= New Chat Dialog ================= */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bắt đầu chat mới</DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Tìm người dùng..."
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
          />

          <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-muted"
                onClick={() => startNewConversation(user.id)}
              >
                <Avatar>
                  <AvatarImage src={resolveMediaUrl(user.avatar_url)} />
                  <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                  <span>{user.full_name}</span>
                  {user.is_shop && (
                    <Badge variant="secondary" className="h-4 px-1 bg-green-100 text-green-700 border-green-200 text-[10px]">
                      <Store className="h-2.5 w-2.5 mr-0.5" />
                      Shop
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
