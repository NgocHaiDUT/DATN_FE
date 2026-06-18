"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  sendChatbotMessage,
  getChatbotSessions,
  getChatbotMessages,
} from "@/services/chatbot.service";
import type { ChatbotSession } from "@/types/chatbot.types";

export type ChatSender = "user" | "bot";

export interface AIChatMessage {
  id: string;
  text: string;
  sender: ChatSender;
  timestamp: Date;
}

// Welcome message removed - UI shows welcome screen instead when messages.length === 0
// const WELCOME_MESSAGE: AIChatMessage = {
//   id: "0",
//   text: "Xin chào! Tôi là MakeCare. Tôi có thể giúp bạn tư vấn về làm đẹp, chăm sóc da và trang điểm. Hãy hỏi tôi bất cứ điều gì!",
//   sender: "bot",
//   timestamp: new Date(),
// };

export function useAIChat(options?: { enabled?: boolean; shopId?: number }) {
  const enabled = options?.enabled ?? true;
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(enabled);
  const [sessions, setSessions] = useState<ChatbotSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | undefined>(
    undefined
  );

  const mountedRef = useRef(false);

  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true);

      // Gọi danh sách session
      const sessionsRes = await getChatbotSessions();

      if (sessionsRes.success && sessionsRes.data.length > 0) {
        setSessions(sessionsRes.data);
        const latestSession = sessionsRes.data[0];
        setCurrentSessionId(latestSession.id);

        const messagesRes = await getChatbotMessages(latestSession.id);

        if (messagesRes.success) {
          const converted = messagesRes.data.map<AIChatMessage>((msg) => ({
            id: msg.id.toString(),
            text: msg.content,
            sender: msg.sender,
            timestamp: new Date(msg.created_at),
          }));

          setMessages(converted);
          return;
        }
      }

      // Nếu không có session hoặc lỗi → để trống, UI sẽ hiển thị welcome screen
      setSessions([]);
      setMessages([]);
    } catch (error: unknown) {
      console.error("[useAIChat] loadHistory error", error);
      setSessions([]);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    if (mountedRef.current) return;
    mountedRef.current = true;
    loadHistory();
  }, [enabled, loadHistory]);

  const loadSessionMessages = useCallback(async (sessionId: number) => {
    try {
      setIsLoading(true);
      setCurrentSessionId(sessionId);

      const messagesRes = await getChatbotMessages(sessionId);

      if (messagesRes.success) {
        const converted = messagesRes.data.map<AIChatMessage>((msg) => ({
          id: msg.id.toString(),
          text: msg.content,
          sender: msg.sender,
          timestamp: new Date(msg.created_at),
        }));

        setMessages(converted);
      }
    } catch (error: unknown) {
      console.error("[useAIChat] loadSessionMessages error", error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMsg: AIChatMessage = {
        id: Date.now().toString(),
        text,
        sender: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      try {
        const body = {
          message: text,
          ...(currentSessionId && { sessionId: currentSessionId }),
          ...(options?.shopId && { shopId: options.shopId }),
        };

        const res = await sendChatbotMessage(body);

        if (!res || res.success === false || !res.data) {
          throw new Error("Failed to get bot response");
        }

        // Nếu tạo session mới, cập nhật sessionId và reload danh sách sessions
        if (!currentSessionId && res.data.sessionId) {
          setCurrentSessionId(res.data.sessionId);
          // Reload sessions để cập nhật UI
          const sessionsRes = await getChatbotSessions();
          if (sessionsRes.success) {
            setSessions(sessionsRes.data);
          }
        }

        const botMsg: AIChatMessage = {
          id: (Date.now() + 1).toString(),
          text: res.data.botResponse,
          sender: "bot",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMsg]);
      } catch (error) {
        console.error("[useAIChat] sendMessage error", error);
        const errorMsg: AIChatMessage = {
          id: (Date.now() + 1).toString(),
          text: "Xin lỗi, hiện tại tôi không thể kết nối. Vui lòng thử lại sau.",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsTyping(false);
      }
    },
    [currentSessionId, options?.shopId]
  );

  const startNewChat = useCallback(() => {
    setCurrentSessionId(undefined);
    setMessages([]);
  }, []);

  return {
    messages,
    isTyping,
    isLoading,
    sessions,
    currentSessionId,
    sendMessage,
    loadSessionMessages,
    startNewChat,
  };
}

