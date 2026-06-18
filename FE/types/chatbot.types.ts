export interface ChatbotSession {
  id: number;
  user_id: number;
  coze_conversation_id: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatbotMessage {
  id: number;
  session_id: number;
  sender: "user" | "bot";
  content: string;
  created_at: string;
}

export interface SendMessageRequest {
  message: string;
  sessionId?: number;
  shopId?: number;
}

export interface SendMessageResponse {
  success: boolean;
  data: {
    sessionId: number;
    cozeConversationId: string | null;
    openaiThreadId?: string | null;
    chatId: string;
    botResponse: string;
  };
}

export interface SessionsResponse {
  success: boolean;
  data: ChatbotSession[];
}

export interface MessagesResponse {
  success: boolean;
  data: ChatbotMessage[];
}
