"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Bot, ChevronDown, History, LogIn, MessageCircle, MessageSquarePlus, Send, Sparkles, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAIChat } from "@/features/ai/useAIChat";
import { useAuthStore } from "@/stores/auth.store";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ChatbotProductCards } from "@/components/common/ChatbotProductCards";

const suggestedQuestions = [
  "Tư vấn kem chống nắng cho da dầu",
  "Da khô nên dùng sản phẩm nào?",
  "Gợi ý son trong tầm giá 500k trở xuống",

];

function renderMessageText(text: string) {
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/product\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]+)\)|(https?:\/\/[^\s)]+|\/product\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]+)/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const label = match[1] || match[3];
    const href = match[2] || match[3];
    nodes.push(
      <a
        key={`${href}-${match.index}`}
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noreferrer" : undefined}
        className="font-semibold text-pink-700 underline underline-offset-2 hover:text-purple-700"
      >
        {label}
      </a>
    );
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export function ChatbotWidget() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [isOpen, setIsOpen] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const {
    messages,
    isLoading,
    isTyping,
    sessions,
    currentSessionId,
    sendMessage,
    loadSessionMessages,
    startNewChat,
  } = useAIChat({ enabled: isOpen && Boolean(accessToken) });

  useEffect(() => {
    if (!isOpen) return;
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [isOpen, messages, isTyping]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isTyping || !accessToken) return;
    setInput("");
    sendMessage(text);
  };

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div className="mb-4 flex h-[min(620px,calc(100vh-6rem))] w-[calc(100vw-2rem)] max-w-[390px] flex-col overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Sparkles className="h-5 w-5" />
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">MakeCare AI</p>
                <p className="text-xs text-white/80">Tư vấn mua hàng</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {accessToken && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowSessions((value) => !value)}
                    className="rounded-lg p-2 text-white/90 transition hover:bg-white/15"
                    title="Lịch sử chat"
                  >
                    <History className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      startNewChat();
                      setShowSessions(false);
                    }}
                    className="rounded-lg p-2 text-white/90 transition hover:bg-white/15"
                    title="Chat mới"
                  >
                    <MessageSquarePlus className="h-4 w-4" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-white/90 transition hover:bg-white/15"
                title="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {showSessions && accessToken && (
            <div className="max-h-44 overflow-y-auto border-b border-gray-100 bg-gray-50 p-3">
              {sessions.length === 0 ? (
                <p className="px-2 py-4 text-center text-sm text-gray-500">Chưa có lịch sử chat</p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => {
                        loadSessionMessages(session.id);
                        setShowSessions(false);
                      }}
                      className={cn(
                        "w-full rounded-xl border px-3 py-2 text-left text-sm transition",
                        currentSessionId === session.id
                          ? "border-pink-200 bg-pink-50 text-pink-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-pink-200"
                      )}
                    >
                      <span className="block truncate font-medium">{session.title || "Cuộc trò chuyện"}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(session.updated_at).toLocaleDateString("vi-VN")}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto bg-gray-50 px-4 py-4">
            {!accessToken ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-pink-100 text-pink-600">
                  <LogIn className="h-7 w-7" />
                </div>
                <p className="text-sm font-semibold text-gray-900">Đăng nhập để chat với MakeCare AI</p>
                <p className="mt-2 text-sm text-gray-500">
                  Bot sẽ lưu lịch sử và gợi ý sản phẩm phù hợp từ cửa hàng.
                </p>
                <button
                  type="button"
                  onClick={handleLogin}
                  className="mt-5 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Đăng nhập
                </button>
              </div>
            ) : isLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-pink-200 border-t-pink-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg">
                    <Bot className="h-8 w-8" />
                  </div>
                  <p className="text-base font-semibold text-gray-900">Cần mua sản phẩm gì hôm nay?</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Hỏi về nhu cầu, loại da, ngân sách hoặc tone màu để nhận gợi ý sản phẩm phù hợp.
                  </p>
                </div>
                <div className="mt-5 space-y-2">
                  {suggestedQuestions.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => setInput(question)}
                      className="w-full rounded-xl border border-pink-100 bg-white px-3 py-2 text-left text-sm text-gray-700 transition hover:border-pink-300 hover:bg-pink-50"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const isUser = message.sender === "user";
                return (
                  <div key={message.id} className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}>
                    {!isUser && (
                      <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm",
                        isUser
                          ? "rounded-tr-sm bg-pink-500 text-white"
                          : "rounded-tl-sm border border-gray-100 bg-white text-gray-800"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{renderMessageText(message.text)}</p>
                      {!isUser && <ChatbotProductCards products={message.products} compact />}
                    </div>
                    {isUser && (
                      <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-white">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {isTyping && accessToken && (
              <div className="flex gap-2">
                <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-tl-sm border border-gray-100 bg-white px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-pink-400" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-purple-400 [animation-delay:0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-pink-400 [animation-delay:0.3s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 bg-white p-3">
            <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 focus-within:border-pink-300 focus-within:ring-2 focus-within:ring-pink-100">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={!accessToken || isTyping}
                placeholder="Nhập câu hỏi về sản phẩm..."
                rows={1}
                className="max-h-24 min-h-10 resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || !accessToken || isTyping}
                className="mb-0.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 p-2 text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                title="Gửi"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-gray-400">
              Gợi ý sản phẩm chỉ mang tính tham khảo.
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-2xl transition hover:scale-105 hover:shadow-pink-200"
        aria-label={isOpen ? "Thu gon chatbot" : "Mo chatbot"}
      >
        {isOpen ? <ChevronDown className="h-7 w-7" /> : <MessageCircle className="h-7 w-7" />}
      </button>
    </div>
  );
}
