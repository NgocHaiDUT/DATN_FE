"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { MessageCircle, Send, Reply } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";
import { useAuthStore } from "@/stores/auth.store";
import { resolveMediaUrl } from "@/lib/media";
import { formatTimeAgo } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/I18nContext";

interface CommentSectionProps {
  targetType: string;
  targetId: number;
  className?: string;
}

type CommentUser = {
  id?: number;
  full_name?: string;
  avatar?: string;
  avatar_url?: string;
};

type CommentWithReplies = {
  id?: number;
  content?: string;
  created_at?: string | Date;
  user?: CommentUser;
  replies?: CommentWithReplies[];
};

const CommentSection = ({
  targetType,
  targetId,
  className = "",
}: CommentSectionProps) => {
  const { t } = useI18n();
  const { user: currentUser } = useAuthStore();
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);

  // Helper function to refresh comments
  const refreshComments = async () => {
    try {
      const res: any = await apiClient(
        `/comments?target_type=${targetType}&target_id=${targetId}&include_replies=true`,
        { method: "GET" }
      );
      const data = res?.data || res;
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
}
  };

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      try {
        // Sử dụng endpoint GET /comments với query params
        const res: any = await apiClient(
          `/comments?target_type=${targetType}&target_id=${targetId}&include_replies=true`,
          { method: "GET" }
        );
        const data = res?.data || res;
        setComments(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error(t('comment.errorLoad'));
      } finally {
        setIsLoading(false);
      }
    };

    if (targetId && targetType) {
      fetchComments();
    }
  }, [targetId, targetType]);

  const handleSubmitComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!newComment.trim()) {
      toast.error(t('comment.required'));
      return;
    }

    if (!currentUser?.id) {
      toast.error(t('comment.loginRequired'));
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient(ENDPOINTS.COMMENTS.CREATE, {
        method: "POST",
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          content: newComment.trim(),
        }),
      });

      // Refresh comments to get updated data from server
      await refreshComments();
      setNewComment("");
      toast.success(t('comment.added'));
    } catch (error: any) {
toast.error(error?.message || t('comment.addError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: number) => {
    if (!replyText.trim()) {
      toast.error(t('comment.replyRequired'));
      return;
    }

    if (!currentUser?.id) {
      toast.error(t('comment.loginRequiredReply'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Sử dụng endpoint CREATE với parent_id để reply
      await apiClient(ENDPOINTS.COMMENTS.CREATE, {
        method: "POST",
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          content: replyText.trim(),
          parent_id: parentId,
        }),
      });

      // Refresh comments to get updated data from server
      await refreshComments();
      setReplyText("");
      setReplyingTo(null);
      toast.success(t('comment.replyAdded'));
    } catch (error: any) {
toast.error(error?.message || t('comment.replyError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayComments = showAllComments ? comments : comments.slice(0, 3);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Comment Form */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSubmitComment} className="space-y-3">
            <Textarea
              value={newComment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setNewComment(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                // Enter để gửi, Shift+Enter để xuống dòng
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (newComment.trim() && !isSubmitting) {
                    handleSubmitComment(e as any);
                  }
                }
              }}
              placeholder={t('comment.placeholder')}
              rows={3}
              className="resize-none min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? t('comment.submitting') : t('comment.submit')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Comments List */}
      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      ) : (
        <>
          {displayComments.length > 0 ? (
            <div className="space-y-4">
      {displayComments.map((comment) => (
                <div key={comment.id} className="space-y-3">
                  {/* Main Comment */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={
                              comment.user?.avatar_url
                                ? resolveMediaUrl(comment.user.avatar_url)
                                : undefined
                            }
                          />
                          <AvatarFallback>
                            {comment.user?.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {comment.user?.full_name || t('comment.user')}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(comment.created_at as string)
                                ? t('comment.ago', { time: formatTimeAgo(comment.created_at as string) })
                                : t('comment.justNow')}
                            </span>
                          </div>

                          <p className="text-sm text-gray-700">
                            {comment.content}
                          </p>

                          <div className="flex items-center gap-4">
                            <Button
                              variant="ghost"
                              size="sm"
                            onClick={() => {
                              if (comment.id == null) return;
                              setReplyingTo((prev) =>
                                prev === comment.id ? null : (comment.id as number)
                              );
                            }}
                              className="text-xs"
                            >
                              <Reply className="h-3 w-3 mr-1" />
                              {t('comment.reply')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Reply Form */}
                  {replyingTo === comment.id && (
                    <div className="ml-8">
                      <Card>
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <Textarea
                              value={replyText}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                setReplyText(e.target.value)
                              }
                              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                                // Enter để gửi, Shift+Enter để xuống dòng
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  if (replyText.trim() && !isSubmitting && comment.id != null) {
                                    handleSubmitReply(comment.id);
                                  }
                                }
                              }}
                            placeholder={t('comment.replyPlaceholder')}
                              rows={2}
                              className="resize-none min-h-[60px] text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                onClick={() => {
                                  if (comment.id == null) return;
                                  handleSubmitReply(comment.id);
                                }}
                                disabled={isSubmitting || !replyText.trim()}
                                size="sm"
                                className="text-xs"
                              >
                                <Send className="h-3 w-3 mr-1" />
                                {isSubmitting ? t('comment.submitting') : t('comment.reply')}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyText("");
                                }}
                                className="text-xs"
                              >
                                {t('common.cancel')}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-8 space-y-2">
                      {comment.replies.map((reply) => (
                        <Card key={reply.id}>
                          <CardContent className="p-3">
                            <div className="flex gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage
                                  src={
                                    reply.user?.avatar_url
                                      ? resolveMediaUrl(reply.user.avatar_url)
                                      : undefined
                                  }
                                />
                                <AvatarFallback className="text-xs">
                                  {reply.user?.full_name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>

                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-xs">
                                    {reply.user?.full_name || t('comment.user')}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatTimeAgo(reply.created_at as string)
                                      ? t('comment.ago', { time: formatTimeAgo(reply.created_at as string) })
                                      : t('comment.justNow')}
                                  </span>
                                </div>

                                <p className="text-xs text-gray-700 mt-1">
                                  {reply.content}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t('comment.none')}</p>
            </div>
          )}

          {/* Show More Comments Button */}
          {comments.length > 3 && !showAllComments && (
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => setShowAllComments(true)}
                className="text-sm"
              >
                {t('comment.showMore', { count: comments.length - 3 })}
              </Button>
            </div>
          )}

          {showAllComments && comments.length > 3 && (
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => setShowAllComments(false)}
                className="text-sm"
              >
                {t('comment.collapse')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CommentSection;
