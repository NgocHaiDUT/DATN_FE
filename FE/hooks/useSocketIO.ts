import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { useSocketStore } from "@/stores/socket.store";

type SocketStatus = "connecting" | "connected" | "disconnected" | "error";

interface UseSocketIOOptions {
  autoConnect?: boolean;
  path?: string;
}

export const useSocketIO = (options: UseSocketIOOptions = {}) => {
  const { autoConnect = true, path = "/socket.io" } = options;
  const { user } = useAuthStore();
  const {
    addUser,
    removeUser,
    addShop,
    removeShop,
    setOnlineUsers,
    setOnlineShops,
  } = useSocketStore();
  const socketRef = useRef<Socket | null>(null);
  const triedWebsocketRef = useRef(false);
  const [status, setStatus] = useState<SocketStatus>("disconnected");
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    if (!API_BASE_URL || !user?.id) {
      setStatus("disconnected");
      return;
    }

    // Determine socket server URL
    // NEXT_PUBLIC_SOCKET_URL is the direct backend URL (not the proxy)
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
    let socketUrl = "";
    if (SOCKET_URL) {
      socketUrl = SOCKET_URL;
    } else {
      // Fallback: try to parse API_BASE_URL if it's a full URL
      try {
        const url = new URL(API_BASE_URL as string);
        socketUrl = url.origin;
      } catch (e) {
        // API_BASE_URL is a relative path (e.g. /api-proxy), use current window origin
        if (typeof window !== "undefined") {
          socketUrl = window.location.origin;
        }
      }
    }

    console.log("🔌 Connecting to socket:", socketUrl, "with path:", path);

    const attachListeners = (socket: Socket) => {
      socket.on("connect", () => {
        console.log("✅ Socket connected");
        setStatus("connected");
        // Auto join user room
        if (user?.id) {
          socket.emit("join", user.id);
        }
        // Initial lists
        socket.emit("getOnlineUsers");
        socket.emit("getOnlineShops");
      });

      socket.on("disconnect", (reason) => {
        console.log("❌ Socket disconnected:", reason);
        setStatus("disconnected");
      });

      socket.on("connect_error", (error: any) => {
        // Log the whole error to help debugging (CORS, network, bad path, etc.)
        console.error("❌ Socket connection error:", error);
        setStatus("error");

        // Fallback for xhr poll errors: try websocket-only transport once
        const message =
          typeof error === "object" && error?.message
            ? String(error.message)
            : String(error);
        if (message.includes("xhr poll error") && !triedWebsocketRef.current) {
          triedWebsocketRef.current = true;
          console.warn(
            "⚠️ Detected xhr poll error, attempting websocket-only fallback"
          );
          try {
            socket.disconnect();
          } catch (e) {
            // ignore
          }

          const wsSocket = io(socketUrl, {
            path,
            transports: ["websocket"],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            auth: {
              token:
                typeof window !== "undefined"
                  ? localStorage.getItem("token")
                  : null,
            },
          });

          socketRef.current = wsSocket;
          attachListeners(wsSocket);
        }
      });

      socket.on("joined", (data) => {
        console.log("✅ Joined room:", data);
      });

      socket.on("onlineUsers", (users: number[]) => {
        setOnlineUsers(users);
      });

      socket.on("onlineShops", (shops: number[]) => {
        setOnlineShops(shops);
      });

      socket.on(
        "userStatusChanged",
        ({
          userId,
          status,
        }: {
          userId: number;
          status: "online" | "offline";
        }) => {
          if (status === "online") addUser(userId);
          else removeUser(userId);
        }
      );

      socket.on(
        "shopStatusChanged",
        ({
          shopId,
          status,
        }: {
          shopId: number;
          status: "online" | "offline";
        }) => {
          if (status === "online") addShop(shopId);
          else removeShop(shopId);
        }
      );

      socket.on("newMessage", (message) => {
        setLastMessage({ type: "newMessage", ...message });
      });

      socket.on("notification", (data) => {
        setLastMessage({ type: "notification", ...data });
      });

      socket.on("messageSent", (data) => {
        if (data.success) {
          setLastMessage({ type: "messageSent", ...data.message });
        }
      });

      socket.on("conversationMarkedRead", (data) => {
        setLastMessage({ type: "conversationRead", ...data });
      });

      socket.on("messageDeleted", (data) => {
        setLastMessage({ type: "messageDeleted", ...data });
      });
    };

    // Create initial socket with polling + websocket
    const initSocket = () => {
      const s = io(socketUrl, {
        path,
        transports: ["polling", "websocket"],
        autoConnect,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        auth: {
          token:
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null,
        },
      });
      socketRef.current = s;
      setStatus("connecting");
      attachListeners(s);
    };

    initSocket();

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [API_BASE_URL, user?.id, path, autoConnect]);

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn(`⚠️ Cannot emit ${event}: Socket not connected`);
    }
  }, []);

  const sendMessage = useCallback(
    (data: {
      senderId: number;
      receiverId?: number;
      shopId?: number;
      content: string;
      type?:
        | "TEXT"
        | "IMAGE"
        | "VIDEO"
        | "SHARE_POST"
        | "SHARE_PRODUCT"
        | "SHARE_PROFILE";
      postId?: number;
      sharedProfileId?: number;
      productPayload?: any;
      conversationId?: number;
    }) => {
      emit("sendMessage", data);
    },
    [emit]
  );

  const markConversationRead = useCallback(
    (data: { userId: number; conversationId: number }) => {
      emit("markConversationRead", data);
    },
    [emit]
  );

  const deleteMessage = useCallback(
    (data: { messageId: number; userId: number }) => {
      emit("deleteMessage", data);
    },
    [emit]
  );

  const joinRoom = useCallback(
    (userId: number) => {
      emit("join", userId);
    },
    [emit]
  );

  return {
    socket: socketRef.current,
    status,
    lastMessage,
    emit,
    sendMessage,
    markConversationRead,
    deleteMessage,
    joinRoom,
    isConnected: status === "connected",
  };
};
