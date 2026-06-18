import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";
import { useAuthStore } from "@/stores/auth.store";
import { useSocketIO } from "@/hooks/useSocketIO";

const getMessageId = (message: any) => {
  const id = message?.id ?? message?.message_id;
  return id === undefined || id === null || id === "" ? null : String(id);
};

const dedupeMessagesById = (messageList: any[]) => {
  const seen = new Set<string>();

  return messageList.filter((message) => {
    const id = getMessageId(message);
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const appendMessageIfNew = (messageList: any[], nextMessage: any) => {
  const id = getMessageId(nextMessage);
  if (id && messageList.some((message) => getMessageId(message) === id)) {
    return messageList;
  }

  return [...messageList, nextMessage];
};

export const useChat = () => {
  const searchParams = useSearchParams();
  const { user: currentUser } = useAuthStore();
  const userId = currentUser?.id;

  // States
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: number]: number;
  }>({});
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasHandledTargetUser = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Socket.IO connection
  const {
    socket,
    status: socketStatus,
    lastMessage: socketMessage,
    sendMessage: sendSocketMessage,
    markConversationRead: markSocketRead,
    isConnected: isSocketConnected,
    emit,
  } = useSocketIO({ autoConnect: true });

  // Get user ID from URL params
  const targetUserId = searchParams.get("user");
  const conversationParam = searchParams.get("conversation");

  // Fetch conversations from REST API
  const fetchConversations = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const res: any = await apiClient(
        `${ENDPOINTS.MESSAGES.GET_CONVERSATIONS}?userId=${userId}`,
        {
          method: "GET",
        }
      );
      const data = res?.data || res;
      setConversations(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Không thể tải danh sách cuộc trò chuyện");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string | number) => {
    try {
      // Skip for temporary conversations
      if (String(conversationId).startsWith("temp-")) {
        setMessages([]);
        return;
      }

      setIsLoading(true);
      const res: any = await apiClient(
        `${ENDPOINTS.MESSAGES.GET_CONVERSATIONS}/${conversationId}/messages`,
        { method: "GET" }
      );
      const data = res?.data || res;
      setMessages(Array.isArray(data) ? dedupeMessagesById(data) : []);
    } catch (error) {
      toast.error("Không thể tải tin nhắn");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mark conversation as read
  const markConversationAsRead = useCallback(
    async (conversationId: string | number) => {
      try {
        // Skip for temporary conversations
        if (String(conversationId).startsWith("temp-")) return;

        await apiClient(
          `${ENDPOINTS.MESSAGES.GET_CONVERSATIONS}/${conversationId}/read-all`,
          {
            method: "PATCH",
          }
        );
      } catch (error) {}
    },
    []
  );

  // Search users
  const searchUsers = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        setIsSearching(true);
        const res: any = await apiClient(
          `${ENDPOINTS.SEARCH.USERS}?q=${encodeURIComponent(query)}`,
          { method: "GET" }
        );
        const data = res?.data || res;
        // Filter out current user
        const filteredUsers = (Array.isArray(data) ? data : []).filter(
          (user: any) => user.id !== userId
        );
        setSearchResults(filteredUsers);
      } catch (error) {
        toast.error("Có lỗi xảy ra khi tìm kiếm người dùng");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [userId]
  );

  // Start new conversation with user
  const startNewConversation = useCallback(
    async (otherUserId: number) => {
      if (!userId) return null;

      try {
        const res: any = await apiClient(
          ENDPOINTS.MESSAGES.FIND_OR_CREATE_CONVERSATION(otherUserId),
          {
            method: "POST",
          }
        );

        const conversationData = res?.data || res;
        const conversationId = conversationData.id;

        // Refresh conversations list to get full data
        const refreshedRes: any = await apiClient(
          `${ENDPOINTS.MESSAGES.GET_CONVERSATIONS}?userId=${userId}`,
          {
            method: "GET",
          }
        );
        const refreshedData = refreshedRes?.data || refreshedRes;
        const refreshedConversations = Array.isArray(refreshedData)
          ? refreshedData
          : refreshedData?.data || [];

        setConversations(refreshedConversations);

        const foundConversation = refreshedConversations.find(
          (conv: any) => conv.id === conversationId
        );

        if (foundConversation) {
          setSelectedConversation(foundConversation);
        } else {
          setSelectedConversation(conversationData);
          setConversations((prev) => {
            const exists = prev.some((conv: any) => conv.id === conversationId);
            if (!exists) {
              return [conversationData, ...prev];
            }
            return prev;
          });
        }

        setShowNewChatDialog(false);
        setUserSearchQuery("");
        setSearchResults([]);
        return foundConversation || conversationData;
      } catch (error: any) {
        toast.error(error?.message || "Có lỗi xảy ra khi tạo cuộc trò chuyện");
        return null;
      }
    },
    [userId]
  );

  // Start new conversation with shop
  const startShopConversation = useCallback(
    async (shopId: number) => {
      if (!userId) return null;

      try {
        const res: any = await apiClient(
          ENDPOINTS.MESSAGES.FIND_OR_CREATE_SHOP_CONVERSATION(shopId),
          {
            method: "POST",
          }
        );

        const conversationData = res?.data || res;
        const conversationId = conversationData.id;

        // Refresh conversations list to get full data
        const refreshedRes: any = await apiClient(
          `${ENDPOINTS.MESSAGES.GET_CONVERSATIONS}?userId=${userId}`,
          {
            method: "GET",
          }
        );
        const refreshedData = refreshedRes?.data || refreshedRes;
        const refreshedConversations = Array.isArray(refreshedData)
          ? refreshedData
          : refreshedData?.data || [];

        setConversations(refreshedConversations);

        const foundConversation = refreshedConversations.find(
          (conv: any) => conv.id === conversationId
        );

        if (foundConversation) {
          setSelectedConversation(foundConversation);
        } else {
          setSelectedConversation(conversationData);
          setConversations((prev) => {
            const exists = prev.some((conv: any) => conv.id === conversationId);
            if (!exists) {
              return [conversationData, ...prev];
            }
            return prev;
          });
        }

        return foundConversation || conversationData;
      } catch (error: any) {
        toast.error(
          error?.message || "Có lỗi xảy ra khi tạo cuộc trò chuyện với cửa hàng"
        );
        return null;
      }
    },
    [userId]
  );

  // Get other participant
  const getOtherParticipant = useCallback(
    (conversation: any) => {
      if (!conversation?.participants || !userId) return null;

      // For user_shop conversations, find the shop participant
      if (conversation.type === "user_shop") {
        const shopParticipant = conversation.participants.find(
          (p: any) => p.entity_type === "shop" && p.shop
        );

        if (shopParticipant?.shop) {
          // Return shop info with user-like structure for compatibility
          return {
            id: shopParticipant.shop.id,
            full_name: shopParticipant.shop.name,
            avatar_url: shopParticipant.shop.logo_url,
            is_shop: true, // Flag to identify as shop
          };
        }
      }

      // For regular user conversations
      const userParticipant = conversation.participants.find(
        (p: any) => p.user_id !== userId && p.entity_type === "user"
      );

      return userParticipant?.user || null;
    },
    [userId]
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, accept: string) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const filteredFiles = files.filter((file) => {
        if (accept.includes("image")) {
          return file.type.startsWith("image/");
        } else if (accept.includes("video")) {
          return file.type.startsWith("video/");
        }
        return true;
      });

      if (filteredFiles.length === 0) {
        toast.error("Vui lòng chọn file ảnh hoặc video");
        return;
      }

      const maxSize = 50 * 1024 * 1024; // 50MB
      const validFiles = filteredFiles.filter((file) => {
        if (file.size > maxSize) {
          toast.error(`File ${file.name} quá lớn (tối đa 50MB)`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      setSelectedFiles((prev) => [...prev, ...validFiles]);

      validFiles.forEach((file) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setFilePreviews((prev) => [...prev, e.target?.result as string]);
          };
          reader.readAsDataURL(file);
        } else if (file.type.startsWith("video/")) {
          const videoUrl = URL.createObjectURL(file);
          setFilePreviews((prev) => [...prev, videoUrl]);
        }
      });

      if (e.target) {
        e.target.value = "";
      }
    },
    []
  );

  // Remove selected file
  const removeFile = useCallback(
    (index: number) => {
      const file = selectedFiles[index];
      if (file?.type.startsWith("video/")) {
        const preview = filePreviews[index];
        if (preview && preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
      }
      setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
      setFilePreviews((prev) => prev.filter((_, i) => i !== index));
    },
    [selectedFiles, filePreviews]
  );

  // Upload files with progress tracking
  const uploadFilesWithProgress = useCallback(
    async (
      files: File[],
      onProgress: (index: number, progress: number) => void
    ): Promise<any[]> => {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      const accessToken = useAuthStore.getState().accessToken;

      return new Promise<any[]>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();

        files.forEach((file) => {
          formData.append("files", file);
        });

        const totalSize = files.reduce((sum, file) => sum + file.size, 0);

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const overallProgress = Math.round((e.loaded / e.total) * 100);
            files.forEach((_, index) => {
              const fileProgress = Math.round(
                (overallProgress * files[index].size) / totalSize
              );
              onProgress(index, Math.min(fileProgress, 100));
            });
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              const uploadedFiles = response.data || response;
              const filesArray = Array.isArray(uploadedFiles)
                ? uploadedFiles
                : [uploadedFiles];
              files.forEach((_, index) => {
                onProgress(index, 100);
              });
              resolve(filesArray);
            } catch (error) {
              reject(new Error("Failed to parse response"));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.message || "Upload failed"));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during upload"));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("Upload was aborted"));
        });

        xhr.open("POST", `${API_BASE_URL}/messages/upload-media`);
        if (accessToken) {
          xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
        }
        xhr.send(formData);
      });
    },
    []
  );

  // Send message using Socket.IO (fallback to REST API if socket not connected)
  const handleSendMessage = useCallback(async () => {
    // If there are files, use media handler
    if (selectedFiles.length > 0) {
      return handleSendMessageWithMedia();
    }

    if (!messageInput.trim() || !selectedConversation || !userId) return;

    try {
      setIsSending(true);

      const otherUser = getOtherParticipant(selectedConversation);
      if (!otherUser?.id) {
        throw new Error("Không tìm thấy người nhận");
      }

      let conversationId = selectedConversation.id;
      if (String(selectedConversation.id).startsWith("temp-")) {
        const otherUserId = parseInt(
          String(selectedConversation.id).replace("temp-", "")
        );
        const newConversation = await startNewConversation(otherUserId);
        if (newConversation) {
          conversationId = newConversation.id;
          setSelectedConversation(newConversation);
        } else {
          throw new Error("Failed to create conversation");
        }
      }

      // Check if this is a shop conversation
      const isShopConversation =
        selectedConversation.type === "user_shop" || otherUser.is_shop;

      // Use socket for regular user chats, but fallback/force REST for shop chats to ensure reliable delivery
      if (isSocketConnected && socket && !isShopConversation) {
        const messageData: any = {
          senderId: userId,
          content: messageInput.trim(),
          type: "TEXT",
          conversationId: conversationId, // Ensure conversationId is sent
        };

        messageData.receiverId = otherUser.id;

        sendSocketMessage(messageData);
        setMessageInput("");
      } else {
        const res: any = await apiClient(ENDPOINTS.MESSAGES.SEND, {
          method: "POST",
          body: JSON.stringify({
            conversation_id: conversationId,
            content: messageInput.trim(),
          }),
        });

        const newMessage = res?.data || res;
        setMessages((prev) => appendMessageIfNew(prev, newMessage));
        setMessageInput("");
        // toast.success("Tin nhắn đã được gửi!"); // Optional: disable toast for smoother feel
        await fetchConversations();
      }
    } catch (error: any) {
      toast.error(error?.message || "Có lỗi xảy ra khi gửi tin nhắn");
    } finally {
      setIsSending(false);
    }
  }, [
    messageInput,
    selectedConversation,
    selectedFiles,
    userId,
    isSocketConnected,
    socket,
    sendSocketMessage,
    getOtherParticipant,
    startNewConversation,
    fetchConversations,
  ]);

  // Send message with media
  const handleSendMessageWithMedia = useCallback(async () => {
    if (
      (!messageInput.trim() && selectedFiles.length === 0) ||
      !selectedConversation ||
      !userId
    )
      return;

    try {
      setIsSending(true);
      setUploadingFiles(true);
      setUploadProgress({});

      const otherUser = getOtherParticipant(selectedConversation);
      if (!otherUser?.id) {
        throw new Error("Không tìm thấy người nhận");
      }

      let conversationId = selectedConversation.id;
      if (String(selectedConversation.id).startsWith("temp-")) {
        const otherUserId = parseInt(
          String(selectedConversation.id).replace("temp-", "")
        );
        const newConversation = await startNewConversation(otherUserId);
        if (newConversation) {
          conversationId = newConversation.id;
          setSelectedConversation(newConversation);
        } else {
          throw new Error("Failed to create conversation");
        }
      }

      const uploadedFiles = await uploadFilesWithProgress(
        selectedFiles,
        (index, progress) => {
          setUploadProgress((prev) => ({ ...prev, [index]: progress }));
        }
      );

      const mediaFiles = uploadedFiles.map((file: any) => ({
        url: file.url || file.media_url,
        type: file.type || (file.media_type === "image" ? "image" : "video"),
        fileName: file.fileName || file.file_name,
        fileSize: file.fileSize || file.file_size,
      }));

      // Check if this is a shop conversation
      const isShopConversation =
        selectedConversation.type === "user_shop" || otherUser.is_shop;

      // Use socket for regular user chats, but fallback/force REST for shop chats
      if (isSocketConnected && socket && !isShopConversation) {
        const messageData: any = {
          senderId: userId,
          content: messageInput.trim() || "",
          mediaFiles,
          conversationId: conversationId,
        };

        messageData.receiverId = otherUser.id;

        socket.emit("sendMessageWithMedia", messageData);
        setMessageInput("");
        filePreviews.forEach((preview) => {
          if (preview && preview.startsWith("blob:")) {
            URL.revokeObjectURL(preview);
          }
        });
        setSelectedFiles([]);
        setFilePreviews([]);
        setUploadProgress({});
        toast.success("Tin nhắn đã được gửi!");
      } else {
        // REST API Fallback: include messageType and payload.mediaFiles (backend expects payload.mediaFiles or payload.mediaUrl)
        const payload: any = {
          conversation_id: conversationId,
          content: messageInput.trim() || "",
          messageType:
            mediaFiles[0]?.type === "image"
              ? "IMAGE"
              : mediaFiles[0]?.type === "video"
              ? "VIDEO"
              : "TEXT",
          payload: {
            mediaFiles,
          },
        };

        const res: any = await apiClient(ENDPOINTS.MESSAGES.SEND, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        // Cleanup
        setMessageInput("");
        filePreviews.forEach((preview) => {
          if (preview && preview.startsWith("blob:")) {
            URL.revokeObjectURL(preview);
          }
        });
        setSelectedFiles([]);
        setFilePreviews([]);
        setUploadProgress({});
        // toast.success("Tin nhắn đã được gửi!");

        // Add optimistic update or fetch
        const newMessage = res?.data || res;
        if (newMessage) {
          setMessages((prev) => appendMessageIfNew(prev, newMessage));
        } else {
          await fetchConversations();
        }
      }
    } catch (error: any) {
      toast.error(error?.message || "Có lỗi xảy ra khi gửi tin nhắn có media");
    } finally {
      setIsSending(false);
      setUploadingFiles(false);
      setUploadProgress({});
    }
  }, [
    selectedFiles,
    messageInput,
    selectedConversation,
    userId,
    isSocketConnected,
    socket,
    getOtherParticipant,
    startNewConversation,
    uploadFilesWithProgress,
    filePreviews,
  ]);

  //Load conversations on mount and set up polling as fallback
  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    fetchConversations();

    // Set up polling every 3 seconds for faster updates
    const pollInterval = setInterval(() => {
      fetchConversations().catch((err) => console.error("Polling error:", err));
    }, 3000); // 3 seconds for faster updates

    return () => clearInterval(pollInterval);
  }, [userId, fetchConversations]);

  // Reset handler when handler params change
  useEffect(() => {
    hasHandledTargetUser.current = false;
  }, [targetUserId, conversationParam]);

  const shopParam = searchParams.get("shop");

  // Auto open chat with target user if specified in URL
  useEffect(() => {
    if (!userId || conversations.length === 0 || hasHandledTargetUser.current)
      return;

    // Priority 1: Conversation ID
    if (conversationParam) return; // Handled by separate effect

    // Priority 2: Shop ID
    if (shopParam) {
      const targetShopId = parseInt(shopParam);
      // Check if we already have a conversation with this shop
      const existingConversation = conversations.find((conv) => {
        if (conv.type !== "user_shop") return false;
        const shopParticipant = conv.participants.find(
          (p: any) => p.entity_type === "shop" && p.shop_id === targetShopId
        );
        // If shop_id is not directly on participant (depending on backend), check nested shop object
        const shopParticipantNested = conv.participants.find(
          (p: any) => p.entity_type === "shop" && p.shop?.id === targetShopId
        );

        return !!shopParticipant || !!shopParticipantNested;
      });

      if (existingConversation) {
        setSelectedConversation(existingConversation);
        hasHandledTargetUser.current = true;
      } else {
        startShopConversation(targetShopId).then(() => {
          hasHandledTargetUser.current = true;
        });
      }
      return;
    }

    // Priority 3: User ID
    if (targetUserId) {
      const existingConversation = conversations.find((conv) => {
        const otherUser = getOtherParticipant(conv);
        return (
          otherUser &&
          otherUser.id === parseInt(targetUserId) &&
          !otherUser.is_shop
        );
      });

      if (existingConversation) {
        setSelectedConversation(existingConversation);
        hasHandledTargetUser.current = true;
      } else {
        startNewConversation(parseInt(targetUserId)).then(() => {
          hasHandledTargetUser.current = true;
        });
      }
    }
  }, [
    targetUserId,
    shopParam,
    conversationParam,
    conversations,
    userId,
    getOtherParticipant,
    startNewConversation,
    startShopConversation,
  ]);

  // Handle conversation ID from URL
  useEffect(() => {
    const loadConversationFromUrl = async () => {
      if (!conversationParam || !userId) return;

      // If already selected, do nothing
      if (selectedConversation?.id === Number(conversationParam)) return;

      // Try to find in existing list
      const existing = conversations.find(
        (c) => String(c.id) === conversationParam
      );
      if (existing) {
        setSelectedConversation(existing);
        return;
      }

      // If not in list, fetch details
      try {
        setIsLoading(true);
        const res: any = await apiClient(
          `${ENDPOINTS.MESSAGES.GET_CONVERSATIONS}/${conversationParam}`,
          { method: "GET" }
        );
        const conversation = res?.data || res;

        if (conversation && conversation.id) {
          // Add to list if not exists
          setConversations((prev) => {
            if (prev.find((c) => c.id === conversation.id)) return prev;
            return [conversation, ...prev];
          });
          setSelectedConversation(conversation);
        }
      } catch (error) {
        console.error("Failed to load conversation from URL", error);
        toast.error("Không thể tải cuộc trò chuyện");
      } finally {
        setIsLoading(false);
      }
    };

    loadConversationFromUrl();
  }, [conversationParam, userId, conversations]); // Added conversations dependency to check if already loaded

  // Create temporary conversation for target user if needed
  useEffect(() => {
    if (
      targetUserId &&
      !selectedConversation &&
      !isLoading &&
      userId &&
      !conversationParam
    ) {
      const tempConversation = {
        id: `temp-${targetUserId}`,
        participants: [
          {
            user_id: userId,
            user: {
              id: userId,
              full_name: currentUser?.full_name || "You",
              avatar_url: currentUser?.avatar_url || null,
            },
          },
          {
            user_id: parseInt(targetUserId),
            user: {
              id: parseInt(targetUserId),
              full_name: `User ${targetUserId}`,
              avatar_url: null,
            },
          },
        ],
      };
      setSelectedConversation(tempConversation);
    }
  }, [
    targetUserId,
    selectedConversation,
    isLoading,
    userId,
    currentUser,
    conversationParam,
  ]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      const conversationId = String(selectedConversation.id);
      if (!conversationId.startsWith("temp-")) {
        fetchMessages(conversationId);
        markConversationAsRead(conversationId);
        if (isSocketConnected && userId && !isNaN(Number(conversationId))) {
          markSocketRead({
            userId,
            conversationId: Number(conversationId),
          });
        }

        // Set up polling for messages every 3 seconds
        const pollInterval = setInterval(() => {
          fetchMessages(conversationId).catch((err) =>
            console.error("Message polling error:", err)
          );
        }, 3000); // 3 seconds for real-time updates

        return () => clearInterval(pollInterval);
      } else {
        setMessages([]);
      }
    }
  }, [
    selectedConversation,
    isSocketConnected,
    userId,
    fetchMessages,
    markConversationAsRead,
    markSocketRead,
  ]);

  // Listen to socket messages for real-time updates
  useEffect(() => {
    if (!socketMessage) return;

    const messageType = socketMessage.type;
    const messageData = messageType ? socketMessage : socketMessage;

    // Handle new message received
    if (messageType === "newMessage" || messageData.conversationId) {
      const currentConvId = selectedConversation?.id;

      if (
        currentConvId &&
        messageData.conversationId === currentConvId &&
        !String(currentConvId).startsWith("temp-")
      ) {
        setMessages((prev) => appendMessageIfNew(prev, messageData));

        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }

      // Fetch conversations to update the conversation list with new message
      fetchConversations().catch((err) =>
        console.error("Failed to refresh conversations:", err)
      );
    }

    // Handle message sent confirmation
    if (messageType === "messageSent") {
      const currentConvId = selectedConversation?.id;
      const senderId = messageData.sender_id || messageData.senderId;

      if (
        currentConvId &&
        messageData.conversationId === currentConvId &&
        Number(senderId) === Number(userId)
      ) {
        setMessages((prev) => appendMessageIfNew(prev, messageData));

        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }

      toast.success("Tin nhắn đã được gửi!");
      fetchConversations().catch((err) =>
        console.error("Failed to refresh conversations:", err)
      );
    }

    // Handle conversation marked as read
    if (messageType === "conversationRead") {
      fetchConversations().catch((err) =>
        console.error("Failed to refresh conversations:", err)
      );
    }

    // Handle message deleted
    if (messageType === "messageDeleted") {
      const currentConvId = selectedConversation?.id;
      if (currentConvId && messageData.conversationId === currentConvId) {
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== messageData.messageId)
        );
      }
      fetchConversations().catch((err) =>
        console.error("Failed to refresh conversations:", err)
      );
    }
    // Handle message reaction updated
    if (messageType === "messageReactionUpdated") {
      const currentConvId = selectedConversation?.id;
      // We might need to check conversation ID if it's available in the event data,
      // but for now let's update if the message exists in current view
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageData.messageId) {
            // Update reactions locally
            return {
              ...msg,
              reactions: messageData.reactions,
            };
          }
          return msg;
        })
      );
    }
  }, [socketMessage, selectedConversation, userId, fetchConversations]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Search users when query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (userSearchQuery.trim()) {
        searchUsers(userSearchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [userSearchQuery, searchUsers]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      filePreviews.forEach((preview) => {
        if (preview && preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, []);

  // React to message
  const reactToMessage = useCallback(
    (messageId: number, emoji: string) => {
      if (!socket || !isSocketConnected || !userId || !selectedConversation) {
        toast.error("Không thể kết nối đến máy chủ chat");
        return;
      }

      const otherUser = getOtherParticipant(selectedConversation);
      if (!otherUser) return;

      emit("reactToMessage", {
        messageId,
        userId,
        emoji,
        receiverId: otherUser.id,
      });
    },
    [
      socket,
      isSocketConnected,
      userId,
      selectedConversation,
      getOtherParticipant,
      emit,
    ]
  );

  // Delete message
  const deleteMessage = useCallback(
    (messageId: number) => {
      if (!socket || !isSocketConnected || !userId) {
        toast.error("Không thể kết nối đến máy chủ chat");
        return;
      }

      emit("deleteMessage", {
        messageId,
        userId,
      });
    },
    [socket, isSocketConnected, userId, emit]
  );

  return {
    // States
    selectedConversation,
    setSelectedConversation,
    messageInput,
    setMessageInput,
    searchQuery,
    setSearchQuery,
    conversations,
    messages,
    isLoading,
    isSending,
    showNewChatDialog,
    setShowNewChatDialog,
    userSearchQuery,
    setUserSearchQuery,
    searchResults,
    isSearching,
    selectedFiles,
    filePreviews,
    uploadProgress,
    uploadingFiles,
    isSocketConnected,
    socketStatus,

    // Refs
    messagesEndRef,
    fileInputRef,
    imageInputRef,
    videoInputRef,

    // Functions
    fetchConversations,
    fetchMessages,
    markConversationAsRead,
    searchUsers,
    startNewConversation,
    getOtherParticipant,
    handleFileSelect,
    removeFile,
    handleSendMessage,
    handleSendMessageWithMedia,
    currentUserId: userId,
    reactToMessage,
    deleteMessage,
  };
};
