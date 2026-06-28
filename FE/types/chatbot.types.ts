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
  products?: ChatbotRecommendedProduct[] | null;
  created_at: string;
}

export interface ChatbotRecommendedProduct {
  id: number;
  name: string;
  slug: string;
  url: string;
  image_url: string | null;
  price_from: number | null;
  compare_at_price?: number | null;
  brand?: {
    id: number;
    name: string;
    slug: string;
  } | null;
  shop?: {
    id: number;
    name: string;
    slug: string;
  };
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
    recommendedProducts?: ChatbotRecommendedProduct[];
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
