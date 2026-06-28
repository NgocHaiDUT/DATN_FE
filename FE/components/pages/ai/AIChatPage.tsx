"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Smile,
  Image as ImageIcon,
  ArrowLeft,
  MessageSquarePlus,
  History,
  X,
} from "lucide-react";
import { useAIChat } from "@/features/ai/useAIChat";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ChatbotProductCards } from "@/components/common/ChatbotProductCards";

export default function AIChatPage() {
  const router = useRouter();
  const {
    messages,
    isLoading,
    isTyping,
    sessions,
    currentSessionId,
    sendMessage,
    loadSessionMessages,
    startNewChat,
  } = useAIChat();
  const [input, setInput] = useState("");
  const [showSessionsSidebar, setShowSessionsSidebar] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    const chatBody = listRef.current?.parentElement?.parentElement;
    if (chatBody) {
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    sendMessage(text);
  };

  const suggestedQuestions = [
    "Cách chăm sóc da mụn?",
    "Skincare routine buổi sáng",
    "Makeup cho da dầu",
    "Kem chống nắng nào tốt?"
  ];

  const renderMessageText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s)]+|\/product\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]+)/g;
    const isUrlRegex = /^(https?:\/\/[^\s)]+|\/product\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]+)$/;
    return text.split(urlRegex).map((part, index) => {
      if (!isUrlRegex.test(part)) return part;
      const href = part.startsWith("/") ? part : part;
      return (
        <a
          key={`${part}-${index}`}
          href={href}
          target={part.startsWith("http") ? "_blank" : undefined}
          rel={part.startsWith("http") ? "noreferrer" : undefined}
          className="font-semibold text-purple-700 underline underline-offset-2 hover:text-pink-600"
        >
          {part}
        </a>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex">
      {/* Sessions Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-80 bg-white/95 backdrop-blur-lg border-r border-purple-100 shadow-xl transform transition-transform duration-300 ease-in-out",
          showSessionsSidebar ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-purple-100">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-purple-600" />
              <h2 className="font-semibold text-gray-800">Lịch sử chat</h2>
            </div>
            <button
              onClick={() => setShowSessionsSidebar(false)}
              className="p-1.5 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-3">
            <button
              onClick={() => {
                startNewChat();
                setShowSessionsSidebar(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#c27aff] to-[#fb64b6] text-white rounded-lg hover:shadow-md transition-all duration-200"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span className="font-medium">Cuộc trò chuyện mới</span>
            </button>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Chưa có lịch sử chat
              </div>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    loadSessionMessages(session.id);
                    setShowSessionsSidebar(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg transition-all duration-200",
                    currentSessionId === session.id
                      ? "bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200"
                      : "bg-white hover:bg-purple-50 border border-gray-200"
                  )}
                >
                  <h3
                    className={cn(
                      "font-medium text-sm truncate",
                      currentSessionId === session.id
                        ? "text-purple-700"
                        : "text-gray-800"
                    )}
                  >
                    {session.title || "Cuộc trò chuyện không có tiêu đề"}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(session.updated_at).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Header - Enhanced - Fixed at top */}
        <div className="bg-white/80 backdrop-blur-lg border-b border-purple-100 shadow-sm z-20 flex-shrink-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/ai-studio")}
                  className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                  title="Quay lại AI Studio"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <button
                  onClick={() => setShowSessionsSidebar(true)}
                  className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                  title="Lịch sử chat"
                >
                  <History className="w-5 h-5 text-gray-700" />
                </button>
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c27aff] via-[#e066d5] to-[#fb64b6] flex items-center justify-center shadow-lg animate-pulse">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white"></span>
                </div>
                <div>
                  <h1 className="font-bold text-lg bg-gradient-to-r from-[#c27aff] to-[#fb64b6] bg-clip-text text-transparent">
                    MakeCare
                  </h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-gray-600 font-medium">
                      Trợ lý AI chăm sóc sắc đẹp
                    </span>
                  </div>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
                <Bot className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">
                  AI-Powered
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat body - Enhanced - Scrollable area */}
        <div className="flex-1 overflow-y-auto pb-32">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div
            ref={listRef}
            className="space-y-4 pb-4"
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-purple-200 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-t-[#c27aff] border-r-[#fb64b6] rounded-full animate-spin absolute top-0"></div>
                </div>
                <p className="mt-4 text-sm font-medium text-gray-600">Đang tải lịch sử chat...</p>
                <p className="text-xs text-gray-400 mt-1">Vui lòng đợi trong giây lát</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full space-y-8 px-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#c27aff] to-[#fb64b6] flex items-center justify-center shadow-2xl">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                <div className="text-center space-y-4 max-w-2xl">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-[#c27aff] to-[#fb64b6] bg-clip-text text-transparent">
                    Chào mừng đến với MakeCare
                  </h2>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    Trợ lý AI chuyên về chăm sóc sắc đẹp, skincare và makeup.
                    <br />
                    Hãy đặt câu hỏi để nhận tư vấn từ MakeCare!
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full mt-4">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(q);
                      }}
                      className="px-5 py-3.5 bg-white hover:bg-purple-50 border border-purple-200 rounded-xl text-sm text-gray-700 hover:text-purple-700 hover:border-purple-300 transition-all duration-200 shadow-sm hover:shadow-md text-left font-medium"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, index) => {
                const isUser = m.sender === "user";
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex items-start gap-3 animate-fadeIn",
                      isUser ? "justify-end" : "justify-start"
                    )}
                    style={{
                      animationDelay: `${index * 50}ms`
                    }}
                  >
                    {!isUser && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#c27aff] to-[#fb64b6] flex items-center justify-center shadow-md">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 shadow-md",
                        isUser
                          ? "bg-gradient-to-br from-[#c27aff] to-[#e066d5] text-white rounded-tr-sm"
                          : "bg-white text-gray-800 border border-purple-100 rounded-tl-sm"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {renderMessageText(m.text)}
                      </p>
                      {!isUser && <ChatbotProductCards products={m.products} />}
                      <p
                        className={cn(
                          "mt-2 text-[10px] text-right font-medium",
                          isUser ? "text-white/80" : "text-gray-400"
                        )}
                      >
                        {m.timestamp.getHours()}:
                        {m.timestamp
                          .getMinutes()
                          .toString()
                          .padStart(2, "0")}
                      </p>
                    </div>
                    {isUser && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-md">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {isTyping && !isLoading && (
              <div className="flex items-start gap-3 animate-fadeIn">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#c27aff] to-[#fb64b6] flex items-center justify-center shadow-md">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-white border border-purple-100 shadow-md rounded-tl-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Input - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-4 pb-4 border-t border-purple-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white/80 backdrop-blur-lg border border-purple-200 rounded-2xl shadow-xl p-3">
            <div className="flex items-end gap-3">
              <button
                type="button"
                className="flex-shrink-0 p-2.5 text-purple-500 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-200"
                title="Thêm emoji"
              >
                <Smile className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="flex-shrink-0 p-2.5 text-purple-500 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-200"
                title="Thêm hình ảnh"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập câu hỏi về skincare, makeup, chăm sóc da..."
                  className="min-h-[44px] max-h-[120px] resize-none border-0 focus-visible:ring-0 p-2 text-sm bg-transparent placeholder:text-gray-400"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className={cn(
                  "flex-shrink-0 p-2.5 rounded-xl bg-gradient-to-r from-[#c27aff] to-[#fb64b6] text-white transition-all duration-200 shadow-md",
                  "hover:shadow-lg hover:scale-105 active:scale-95",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                )}
                title="Gửi tin nhắn"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-3 px-4">
            ⚠️ Thông tin MakeCare đưa ra chỉ mang tính chất tham khảo. Nếu tình trạng da không ổn, hãy tìm chuyên gia hoặc bác sĩ da liễu để được tư vấn chính xác.
            </p>
          </div>
        </div>

        <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #e9d5ff;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
            background: #d8b4fe;
          }
        `}</style>
      </div>
    </div>
  );
}

