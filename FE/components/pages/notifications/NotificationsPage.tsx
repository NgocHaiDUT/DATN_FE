"use client";

import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Check, CheckCheck, Bell, ShoppingCart, Package, Star, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useNotifications, useMarkAsRead, useMarkAllAsRead, type Notification } from "@/features/seller/useNotifications";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveMediaUrl } from "@/lib/media";

const NotificationIcon = ({ type }: { type: string }) => {
    switch (type) {
        case "order":
        case "new_order":
            return <ShoppingCart className="w-5 h-5 text-blue-500" />;
        case "product":
        case "low_stock":
            return <Package className="w-5 h-5 text-orange-500" />;
        case "review":
            return <Star className="w-5 h-5 text-yellow-500" />;
        case "comment":
            return <AlertCircle className="w-5 h-5 text-purple-500" />;
        case "like":
            return <div className="w-5 h-5 text-pink-500">❤️</div>;
        case "follow":
            return <div className="w-5 h-5 text-blue-500">👤</div>;
        default:
            return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
};

export default function NotificationsPage() {
    const [page, setPage] = useState(1);
    const limit = 20;

    const { data, isLoading, refetch } = useNotifications(page, limit);
    const markAsReadMutation = useMarkAsRead();
    const markAllAsReadMutation = useMarkAllAsRead();

    const notifications = data?.notifications || [];
    const totalPages = data?.totalPages || 1;
    const unreadCount = data?.unreadCount || 0;

    const handleMarkAsRead = (id: number) => {
        markAsReadMutation.mutate(id, {
            onSuccess: () => {
                // Optimistic update handled by invalidation in hook
            },
            onError: () => {
                toast.error("Có lỗi xảy ra");
            }
        });
    };

    const handleMarkAllAsRead = () => {
        markAllAsReadMutation.mutate(undefined, {
            onSuccess: () => {
                toast.success("Đã đánh dấu tất cả là đã đọc");
            },
            onError: () => {
                toast.error("Có lỗi xảy ra");
            }
        });
    };

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b">
                    <div>
                        <CardTitle className="text-2xl font-bold flex items-center gap-2">
                            <Bell className="w-6 h-6" />
                            Thông báo
                            {unreadCount > 0 && (
                                <span className="ml-2 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">Quản lý tất cả thông báo của bạn</p>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            disabled={unreadCount === 0}
                        >
                            <CheckCheck className="w-4 h-4 mr-2" />
                            Đánh dấu tất cả đã đọc
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-gray-500">Đang tải thông báo...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Bell className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Chưa có thông báo nào</h3>
                            <p className="text-gray-500 mt-1">Chúng tôi sẽ thông báo cho bạn khi có cập nhật mới.</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification: Notification) => {
                                let actorName = "";
                                let actorAvatar = "";
                                try {
                                    if (notification.meta_json) {
                                        const meta = JSON.parse(notification.meta_json);
                                        actorName = meta.actor_name;
                                        actorAvatar = meta.actor_avatar;
                                    }
                                } catch (e) { }

                                return (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer group",
                                            !notification.is_read ? "bg-blue-50/50" : ""
                                        )}
                                        onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                                    >
                                        <div className={cn(
                                            "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
                                            !actorName && "bg-white border shadow-sm"
                                        )}>
                                            {actorName ? (
                                                <Avatar className="w-12 h-12 border shadow-sm">
                                                    <AvatarImage src={resolveMediaUrl(actorAvatar)} alt={actorName} />
                                                    <AvatarFallback>{actorName[0]?.toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                            ) : (
                                                <NotificationIcon type={notification.type} />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn("text-base", !notification.is_read ? "font-semibold text-gray-900" : "font-medium text-gray-700")}>
                                                    {notification.body || notification.title}
                                                </p>
                                                <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                                                    {format(new Date(notification.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                                                </span>
                                            </div>
                                        </div>

                                        {!notification.is_read && (
                                            <div className="flex-shrink-0 self-center">
                                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" title="Chưa đọc"></div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>

                {totalPages > 1 && (
                    <div className="p-4 border-t flex justify-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Trang trước
                        </Button>
                        <span className="flex items-center px-4 text-sm text-gray-600">
                            Trang {page} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            Trang sau
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}
