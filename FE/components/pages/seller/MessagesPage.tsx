"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Send,
  MoreVertical,
  Check,
  CheckCheck,
  MessageCircle,
  Clock,
  Star,
  Image as ImageIcon,
  Video,
  X,
  Paperclip
} from "lucide-react";
import { useShop } from "@/features/shop/useShop";
import {
  useShopConversations,
  useShopMessages,
  useSendShopMessage,
  useMarkAllAsRead,
} from "@/features/seller/useShopMessages";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";

export function MessagesPage() {
  const { shop, isLoading: isLoadingShop } = useShop();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch conversations
  const {
    data: conversationsData,
    isLoading: isLoadingConversations,
    refetch: refetchConversations,
  } = useShopConversations(shop?.id, { limit: 50 });

  const conversations = conversationsData?.data || [];

  // Fetch messages for selected conversation
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useShopMessages(shop?.id, selectedConversation?.id, { limit: 50 });

  const messages = messagesData?.data || [];

  // Mutations
  const sendMessageMutation = useSendShopMessage();
  const markAllAsReadMutation = useMarkAllAsRead();

  // Auto-select first conversation
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations, selectedConversation]);

  // Mark as read when conversation is selected
  useEffect(() => {
    if (selectedConversation && shop?.id) {
      markAllAsReadMutation.mutate({
        shopId: shop.id,
        conversationId: selectedConversation.id,
      });
    }
  }, [selectedConversation, shop?.id]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const filteredConversations = conversations.filter((conversation: any) => {
    const otherParticipant = conversation.participants?.find((p: any) => p.entity_type === 'user');
    const userName = otherParticipant?.user?.full_name || '';
    return userName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && selectedMedia.length === 0) || !selectedConversation || !shop?.id || sendMessageMutation.isPending) return;

    try {
      // If has media, upload first
      if (selectedMedia.length > 0) {
        setUploadingMedia(true);

        // Upload media files
        const formData = new FormData();
        selectedMedia.forEach(file => {
          formData.append('files', file);
        });

        const uploadResult = await apiClient(ENDPOINTS.MESSAGES.UPLOAD_MEDIA, {
          method: 'POST',
          body: formData,
        });

        if (!uploadResult.success || !uploadResult.data) {
          throw new Error('Failed to upload media');
        }

        const mediaFiles = uploadResult.data;

        // Send message with media
        for (const mediaFile of mediaFiles) {
          const messageType = mediaFile.type === 'image' ? 'IMAGE' : mediaFile.type === 'video' ? 'VIDEO' : 'TEXT';

          await sendMessageMutation.mutateAsync({
            shopId: shop.id,
            messageData: {
              conversation_id: selectedConversation.id,
              content: newMessage.trim() || "",
              type: messageType,
              payload: {
                mediaFiles: [
                  {
                    url: mediaFile.url,
                    type: mediaFile.type,
                    fileName: mediaFile.fileName,
                    fileSize: mediaFile.fileSize,
                  },
                ],
              },
            },
          });
        }

        setSelectedMedia([]);
        setUploadingMedia(false);
      } else {
        // Send text message
        await sendMessageMutation.mutateAsync({
          shopId: shop.id,
          messageData: {
            conversation_id: selectedConversation.id,
            content: newMessage.trim(),
            type: 'TEXT'
          },
        });
      }

      setNewMessage("");
      await refetchMessages();
      await refetchConversations();
    } catch (error) {
      alert('Có lỗi khi gửi tin nhắn');
      setUploadingMedia(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedMedia(prev => [...prev, ...files]);
  };

  const handleRemoveMedia = (index: number) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const getOtherParticipant = (conversation: any) => {
    if (!conversation?.participants) return null;
    return conversation.participants.find((p: any) => p.entity_type === 'user');
  };

  const formatTimestamp = (timestamp: string | undefined) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)} phút trước`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} giờ trước`;
    } else {
      return `${Math.floor(diffInHours / 24)} ngày trước`;
    }
  };

  const formatMessageTime = (timestamp: string | undefined) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Show loading state while shop is being fetched
  if (isLoadingShop) {
    return (
      <div className="flex items-center justify-center h-[500px] p-6">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#c27aff] mb-4"></div>
          <p className="text-gray-500">Đang tải dữ liệu cửa hàng...</p>
        </div>
      </div>
    );
  }

  // Show error if no shop data
  if (!shop) {
    return (
      <div className="flex items-center justify-center h-[500px] p-6">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Không thể tải thông tin cửa hàng</p>
          <p className="text-sm text-gray-400 mt-2">Vui lòng đảm bảo bạn đã thiết lập cửa hàng</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">Tin nhắn</h1>
          <p className="text-gray-600">Trò chuyện với khách hàng theo thời gian thực</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Hội thoại</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Tìm kiếm khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {isLoadingConversations ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Đang tải hội thoại...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Chưa có hội thoại nào</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredConversations.map((conversation: any) => {
                    const otherParticipant = getOtherParticipant(conversation);
                    const user = otherParticipant?.user;
                    const lastMsg = conversation.last_message;

                    return (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`p-4 cursor-pointer transition-colors border-b border-gray-100 hover:bg-gray-50 ${selectedConversation?.id === conversation.id ? 'bg-[#c27aff]/5 border-r-2 border-r-[#c27aff]' : ''
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={user?.avatar_url || undefined} />
                              <AvatarFallback className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] text-white">
                                {user?.full_name?.substring(0, 2).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {user?.full_name || 'Unknown User'}
                              </h4>
                              <span className="text-xs text-gray-500">
                                {lastMsg ? formatTimestamp(lastMsg.created_at) : ''}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {lastMsg?.content || 'No messages yet'}
                            </p>
                          </div>
                          {conversation.unread_count > 0 && (
                            <Badge className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] text-white">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="lg:col-span-2">
          {selectedConversation ? (
            <div className="flex flex-col h-full">
              {/* Chat Header */}
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={getOtherParticipant(selectedConversation)?.user?.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] text-white">
                          {getOtherParticipant(selectedConversation)?.user?.full_name?.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {getOtherParticipant(selectedConversation)?.user?.full_name || 'Unknown User'}
                      </h3>
                      <p className="text-sm text-gray-500">Customer</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[400px] p-4">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">Đang tải tin nhắn...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">Chưa có tin nhắn nào</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message: any) => {
                        const isShop = message.sender_type === 'shop';
                        const sender = isShop ? message.sender_shop : message.sender;
                        const hasMedia = message.message_media && message.message_media.length > 0;
                        const messageType = message.type;

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isShop ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg overflow-hidden ${hasMedia ? 'p-0' : 'p-3'
                                } ${isShop
                                  ? 'bg-gradient-to-r from-[#c27aff] to-[#fb64b6] text-white'
                                  : 'bg-gray-100 text-gray-900'
                                }`}
                            >
                              {/* Media content */}
                              {hasMedia && (
                                <div className="space-y-2">
                                  {message.message_media.map((media: any) => (
                                    <div key={media.id}>
                                      {media.media_type === 'image' ? (
                                        <img
                                          src={media.media_url}
                                          alt={media.file_name || 'Image'}
                                          className="w-full max-w-xs rounded-t-lg cursor-pointer hover:opacity-90"
                                          onClick={() => window.open(media.media_url, '_blank')}
                                        />
                                      ) : media.media_type === 'video' ? (
                                        <video
                                          src={media.media_url}
                                          controls
                                          className="w-full max-w-xs rounded-t-lg"
                                        />
                                      ) : null}
                                    </div>
                                  ))}
                                  {message.content && (
                                    <p className="text-sm px-3 pb-2">{message.content}</p>
                                  )}
                                </div>
                              )}

                              {/* Text content */}
                              {!hasMedia && message.content && (
                                <p className="text-sm">{message.content}</p>
                              )}

                              {/* Timestamp */}
                              <div className={`flex items-center gap-1 mt-1 ${hasMedia ? 'px-3 pb-2' : ''
                                } ${isShop ? 'justify-end' : 'justify-start'
                                }`}>
                                <span className={`text-xs ${isShop ? 'text-white/70' : 'text-gray-500'
                                  }`}>
                                  {formatMessageTime(message.created_at)}
                                </span>
                                {isShop && message.message_reads?.length > 0 && (
                                  <CheckCheck className="w-4 h-4 text-white/70" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4">
                {/* Media Preview */}
                {selectedMedia.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {selectedMedia.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                          {file.type.startsWith('image/') ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : file.type.startsWith('video/') ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="w-8 h-8 text-gray-400" />
                            </div>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingMedia}
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Input
                    placeholder="Nhập tin nhắn của bạn..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                    disabled={sendMessageMutation.isPending || uploadingMedia}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] hover:from-[#b169ee] to-[#fa52a5]"
                    disabled={(!newMessage.trim() && selectedMedia.length === 0) || sendMessageMutation.isPending || uploadingMedia}
                  >
                    {uploadingMedia ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#c27aff]/10 to-[#fb64b6]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-[#c27aff]" />
                </div>
                <h3 className="text-xl text-gray-900 mb-2">Chọn một hội thoại</h3>
                <p className="text-gray-600">Chọn hội thoại từ danh sách để bắt đầu trò chuyện</p>
              </div>
            </div>
          )}
        </Card>
      </div>

    </div>
  );
}

