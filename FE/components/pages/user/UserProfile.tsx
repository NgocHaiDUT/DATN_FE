"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Heart,
  Mail,
  Phone,
  Calendar,
  Users,
  BarChart3,
  Info,
  ArrowLeft,
  MessageCircle,
  Share2,
  Store,
} from "lucide-react";
import { usePublicProfile } from "@/features/profile/usePublicProfile";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";
import { useAuthStore } from "@/stores/auth.store";
import { formatNumber, formatDate, formatTimeAgo } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/media";
import { toast } from "sonner";
import { ShareDialog } from "@/components/common/ShareDialog";
import { OnlineStatus } from "@/components/common/OnlineStatus";

interface UserProfileProps {
  userId: number;
}

export function UserProfile({ userId }: UserProfileProps) {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");
  const { data: user, isLoading, isError } = usePublicProfile(userId);
  const currentUserId = currentUser?.id;

  // Fetch user stats (likes)
  const statsQuery = useQuery<any>({
    queryKey: ["user-stats", userId],
    enabled: !!userId,
    queryFn: async () => {
      try {
        const likesRes = await apiClient(
          ENDPOINTS.PROFILE.GET_TOTAL_LIKES_BY_USER(userId),
          {
            method: "GET",
          }
        );
        return {
          likes: likesRes?.data?.totalLikes ?? 0,
        };
      } catch (error) {
        return { likes: 0 };
      }
    },
  });

  const userStats = {
    likes: statsQuery.data?.likes || 0,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-50 via-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải thông tin người dùng...</p>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="min-h-screen bg-linear-to-brrom-purple-50 via-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <User className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Không tìm thấy người dùng
          </h2>
          <p className="text-gray-600 mb-4">
            {isError ? "Không thể tải thông tin người dùng" : "Người dùng này không tồn tại"}
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-pink-50 to-white">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold bg-linear-to-r from-[#c27aff] to-[#fb64b6] bg-clip-text text-transparent flex items-center gap-2">
                {user.full_name}
                {(user as any).is_shop && (
                  <Badge className="bg-green-500 text-white ml-2">
                    <Store className="h-4 w-4 mr-1" />
                    Shop
                  </Badge>
                )}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <ShareDialog itemType="profile" item={user}>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Chia sẻ
                </Button>
              </ShareDialog>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/chat?user=${user.id}`)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Nhắn tin
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Profile Summary */}
          <Card className="lg:col-span-1 h-fit">
            <CardContent className="p-6 text-center">
              <div className="relative mb-4">
                <Avatar className="w-24 h-24 mx-auto border-4 border-white shadow-lg">
                  <AvatarImage src={resolveMediaUrl(user.avatar_url)} />
                  <AvatarFallback className="text-2xl">
                    {user.full_name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <OnlineStatus userId={user.id} size="lg" className="right-[30%] bottom-1" />
                {user.is_verified && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-blue-500 text-white">✓</Badge>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h2 className="font-bold text-gray-900">{user.full_name}</h2>
                  {(user as any).is_shop && (
                    <Badge className="h-4 px-1 bg-green-500 rounded flex items-center justify-center text-[10px] text-white">
                      <Store className="h-3 w-3 mr-0.5" />
                      Shop
                    </Badge>
                  )}
                  {user.is_verified && (
                    <Badge className="h-4 w-4 p-0 bg-blue-500 rounded-full flex items-center justify-center">
                      ✓
                    </Badge>
                  )}
                </div>
                <p className="text-purple-600 font-medium">@user_{user.id}</p>
                <p className="text-sm text-gray-600 mt-2">Chưa có mô tả</p>
              </div>

              <div className="flex justify-center gap-4 mb-6">
                <div className="text-center px-4">
                  <div className="font-bold text-lg text-gray-900">
                    {formatNumber(userStats.likes)}
                  </div>
                  <div className="text-sm text-gray-600">Lượt thích</div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/chat?user=${user.id}`)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Nhắn tin
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 w-full mb-6">
                <TabsTrigger value="profile" className="text-xs">
                  <User className="h-4 w-4 mr-1" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="about" className="text-xs">
                  <Info className="h-4 w-4 mr-1" />
                  About
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin cá nhân</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Họ và tên
                        </label>
                        <p className="text-gray-900">{user.full_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Email
                        </label>
                        <p className="text-gray-900">{user.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Số điện thoại
                        </label>
                        <p className="text-gray-900">
                          {user.phone || "Chưa cập nhật"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Trạng thái
                        </label>
                        <p className="text-gray-900">
                          {user.is_active ? "Hoạt động" : "Không hoạt động"}
                        </p>
                      </div>
                    </div>
                    {user.story?.trim() && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Giới thiệu
                      </label>
                      <p className="text-gray-900">{user.story}</p>
                    </div>
                  )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* About Tab */}
              <TabsContent value="about" className="space-y-6">
              <Card>
  {user.story?.trim() && (
    <CardHeader>
      <CardTitle>Giới thiệu</CardTitle>
    </CardHeader>
  )}

  <CardContent className="space-y-6">
    {user.story?.trim() && (
      <div className="space-y-4">
        <p className="text-gray-900">{user.story}</p>
      </div>
    )}

    <div>
      <h3 className="font-medium text-gray-900 mb-2">
        Thông tin liên hệ
      </h3>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">{user.email}</span>
        </div>

        {user.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{user.phone}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">
            Tham gia từ {formatDate(user.created_at)}
          </span>
        </div>
      </div>
    </div>
  </CardContent>
</Card>

              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
