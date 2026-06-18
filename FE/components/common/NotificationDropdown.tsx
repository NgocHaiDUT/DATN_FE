"use client";

import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, Package, ShoppingCart, Star, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNotifications, useMarkAsRead, useMarkAllAsRead, type Notification } from "@/features/seller/useNotifications";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { resolveMediaUrl } from "@/lib/media";
import { useI18n } from "@/lib/i18n/I18nContext";
import type { TranslationKey } from "@/lib/i18n/translations";

const formatTimeAgo = (date: string, t: (key: TranslationKey) => string) => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return t('notifications.justNow');
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} ${t('notifications.minutesAgo')}`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ${t('notifications.hoursAgo')}`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ${t('notifications.daysAgo')}`;
  return `${Math.floor(diffInSeconds / 604800)} ${t('notifications.weeksAgo')}`;
};

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
    default:
      return <AlertCircle className="w-5 h-5 text-gray-500" />;
  }
};

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NotificationItem = ({ notification, onRead }: { notification: Notification; onRead: (id: number) => void }) => {
  const { t } = useI18n();
  const timeAgo = formatTimeAgo(notification.created_at, t);
  let actorName = "";
  let actorAvatar = "";

  try {
    if (notification.meta_json) {
      const meta = JSON.parse(notification.meta_json);
      actorName = meta.actor_name;
      actorAvatar = meta.actor_avatar;
    }
  } catch (e) {
    // Ignore parse error
  }

  return (
    <div
      onClick={() => !notification.is_read && onRead(notification.id)}
      className={cn(
        "flex gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors",
        !notification.is_read && "bg-blue-50"
      )}
    >
      <div className="flex-shrink-0 mt-1">
        {actorName ? (
          <Avatar className="w-10 h-10 border shadow-sm">
            <AvatarImage src={resolveMediaUrl(actorAvatar)} alt={actorName} />
            <AvatarFallback>{actorName[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <NotificationIcon type={notification.type} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm text-gray-900", !notification.is_read && "font-semibold")}>
          {notification.body || notification.title}
        </p>
        <p className="text-xs text-gray-500 mt-1" suppressHydrationWarning>
          {timeAgo}
        </p>
      </div>
      {!notification.is_read && (
        <div className="flex-shrink-0">
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
        </div>
      )}
    </div>
  );
};

export function NotificationDropdown() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data, isLoading } = useNotifications();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  useEffect(() => {
    setMounted(true);
  }, []);

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Prevent hydration mismatch by only rendering after mount
  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="relative">
        <Bell className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-gradient-to-r from-[#c27aff] to-[#fb64b6] text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-900">{t('notifications.title')}</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-blue-600 hover:text-blue-700"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              {t('notifications.markAllRead')}
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-500">{t('notifications.loading')}</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Bell className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">{t('notifications.empty')}</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification: Notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={handleMarkAsRead}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator className="m-0" />
            <div className="p-2">
              <Link href={ROUTES.NOTIFICATIONS} onClick={() => setOpen(false)}>
                <Button variant="ghost" className="w-full text-sm text-blue-600 hover:text-blue-700">
                  {t('notifications.viewAll')}
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
