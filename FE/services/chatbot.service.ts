import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";
import {
  SendMessageRequest,
  SendMessageResponse,
  SessionsResponse,
  MessagesResponse,
} from "@/types/chatbot.types";

/**
 * Gửi tin nhắn tới chatbot
 * @param request - Tin nhắn và sessionId (nếu có)
 * @returns Phản hồi từ bot
 */
export async function sendChatbotMessage(
  request: SendMessageRequest
): Promise<SendMessageResponse> {
  return apiClient(ENDPOINTS.CHATBOT.SEND, {
    method: "POST",
    body: JSON.stringify(request),
  }) as Promise<SendMessageResponse>;
}

/**
 * Lấy danh sách phiên chatbot của user hiện tại
 * @returns Danh sách các phiên chat
 */
export async function getChatbotSessions(): Promise<SessionsResponse> {
  return apiClient(ENDPOINTS.CHATBOT.SESSIONS, {
    method: "GET",
  }) as Promise<SessionsResponse>;
}

/**
 * Lấy danh sách tin nhắn của một phiên
 * @param sessionId - ID của phiên chat
 * @returns Danh sách tin nhắn
 */
export async function getChatbotMessages(
  sessionId: number
): Promise<MessagesResponse> {
  return apiClient(ENDPOINTS.CHATBOT.MESSAGES(sessionId), {
    method: "GET",
  }) as Promise<MessagesResponse>;
}
