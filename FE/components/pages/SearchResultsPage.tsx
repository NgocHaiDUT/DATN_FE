"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  ArrowLeft,
  Tag,
  Store,
  Users,
  Hash,
} from "lucide-react";
import { useSearchAll } from "@/features/search/useSearchAll";
import { useSearchUsers } from "@/features/search/useSearchUsers";
import { useSearchShops } from "@/features/search/useSearchShops";
import { useSearchHashtags } from "@/features/search/useSearchHashtags";

export const SearchResultsPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get("q") || "";
  const initialTab = searchParams.get("tab") || "all";

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
  }, [initialQuery]);

  const allQuery = useSearchAll({ q: query, limit: 20 });
  const usersQuery = useSearchUsers(query, 20);
  const shopsQuery = useSearchShops(query, 20);
  const hashtagsQuery = useSearchHashtags(query, 20);

  const isLoading =
    allQuery.isLoading ||
    usersQuery.isLoading ||
    shopsQuery.isLoading ||
    hashtagsQuery.isLoading;

  const handleSearchSubmit = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (activeTab) params.set("tab", activeTab);
    const qs = params.toString();
    router.push(`/search${qs ? `?${qs}` : ""}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      {/* Header */}
      <section className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </div>

          <div className="text-center">
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              Tìm kiếm BeautyFeed
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              {query
                ? `Kết quả cho "${query}"`
                : "Tìm bài viết, người dùng, cửa hàng hoặc hashtag"}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <div className="relative max-w-md mx-auto sm:mx-0 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-200 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearchSubmit();
                  }}
                  className="pl-10 bg-white/10 border-white/30 text-white placeholder:text-white/70 focus:bg-white/20"
                />
              </div>
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-purple-600 hover:bg-white/90"
                onClick={handleSearchSubmit}
                disabled={!query.trim()}
              >
                <Search className="h-5 w-5 mr-2" />
                Tìm kiếm
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs + content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 flex flex-wrap justify-start gap-2 bg-white/80">
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-1">
                <Users className="h-4 w-4" /> Mọi người
              </TabsTrigger>
              <TabsTrigger value="shops" className="flex items-center gap-1">
                <Store className="h-4 w-4" /> Cửa hàng
              </TabsTrigger>
              <TabsTrigger value="hashtags" className="flex items-center gap-1">
                <Hash className="h-4 w-4" /> Hashtag
              </TabsTrigger>
            </TabsList>

            {/* Tất cả */}
            <TabsContent value="all">
              {isLoading && (
                <p className="text-sm text-gray-500">Đang tải kết quả...</p>
              )}
              {!isLoading && !query && (
                <p className="text-sm text-gray-500">
                  Nhập từ khóa để bắt đầu tìm kiếm.
                </p>
              )}
              {!isLoading && query && (
                <div className="space-y-6">
                  {/* Users */}
                  {allQuery.data?.users && allQuery.data.users.length > 0 && (
                    <section>
                      <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-500" />
                        Mọi người
                      </h2>
                      <div className="grid md:grid-cols-2 gap-3">
                        {allQuery.data.users.slice(0, 6).map((user: any) => (
                          <Card
                            key={user.id}
                            className="p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50"
                          >
                            <Avatar>
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback>
                                {user.full_name?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-0.5">
                              <p className="text-sm font-semibold text-gray-900">
                                {user.full_name}
                              </p>
                              {user.story && (
                                <p className="text-xs text-gray-600 line-clamp-2">
                                  {user.story}
                                </p>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Shops */}
                  {allQuery.data?.shops && allQuery.data.shops.length > 0 && (
                    <section>
                      <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Store className="h-4 w-4 text-indigo-500" />
                        Cửa hàng
                      </h2>
                      <div className="grid md:grid-cols-2 gap-3">
                        {allQuery.data.shops.slice(0, 6).map((shop: any) => (
                          <Card
                            key={shop.id}
                            className="p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50"
                          >
                            <Avatar>
                              <AvatarImage src={shop.logo_url || undefined} />
                              <AvatarFallback>
                                {shop.name?.[0] || "S"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-0.5">
                              <p className="text-sm font-semibold text-gray-900">
                                {shop.name}
                              </p>
                              {shop.description && (
                                <p className="text-xs text-gray-600 line-clamp-2">
                                  {shop.description}
                                </p>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Hashtags */}
                  {allQuery.data?.hashtags &&
                    allQuery.data.hashtags.length > 0 && (
                      <section>
                        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Tag className="h-4 w-4 text-emerald-500" />
                          Hashtag
                        </h2>
                        <div className="flex flex-wrap gap-2">
                          {allQuery.data.hashtags
                            .slice(0, 12)
                            .map((tag: any) => (
                              <span
                                key={tag.id}
                                className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs cursor-pointer hover:bg-emerald-100"
                              >
                                #{tag.name}{" "}
                                <span className="ml-1 text-[10px] text-emerald-600">
                                  {tag.post_count} bài viết
                                </span>
                              </span>
                            ))}
                        </div>
                      </section>
                    )}

                  {!isLoading &&
                    query &&
                    !allQuery.data?.posts?.length &&
                    !allQuery.data?.users?.length &&
                    !allQuery.data?.shops?.length &&
                    !allQuery.data?.hashtags?.length && (
                      <p className="text-sm text-gray-500">
                        Không tìm thấy kết quả nào.
                      </p>
                    )}
                </div>
              )}
            </TabsContent>


            {/* Users */}
            <TabsContent value="users">
              {usersQuery.isLoading && (
                <p className="text-sm text-gray-500">Đang tải người dùng...</p>
              )}
              {!usersQuery.isLoading && usersQuery.data?.length === 0 && (
                <p className="text-sm text-gray-500">
                  Không tìm thấy người dùng nào.
                </p>
              )}
              <div className="grid md:grid-cols-2 gap-3">
                {usersQuery.data?.map((user: any) => (
                  <Card
                    key={user.id}
                    className="p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50"
                  >
                    <Avatar>
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>
                        {user.full_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-gray-900">
                        {user.full_name}
                      </p>
                      {user.story && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {user.story}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Shops */}
            <TabsContent value="shops">
              {shopsQuery.isLoading && (
                <p className="text-sm text-gray-500">Đang tải cửa hàng...</p>
              )}
              {!shopsQuery.isLoading && shopsQuery.data?.length === 0 && (
                <p className="text-sm text-gray-500">
                  Không tìm thấy cửa hàng nào.
                </p>
              )}
              <div className="grid md:grid-cols-2 gap-3">
                {shopsQuery.data?.map((shop: any) => (
                  <Card
                    key={shop.id}
                    className="p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50"
                  >
                    <Avatar>
                      <AvatarImage src={shop.logo_url || undefined} />
                      <AvatarFallback>{shop.name?.[0] || "S"}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-gray-900">
                        {shop.name}
                      </p>
                      {shop.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {shop.description}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Hashtags */}
            <TabsContent value="hashtags">
              {hashtagsQuery.isLoading && (
                <p className="text-sm text-gray-500">Đang tải hashtag...</p>
              )}
              {!hashtagsQuery.isLoading && hashtagsQuery.data?.length === 0 && (
                <p className="text-sm text-gray-500">
                  Không tìm thấy hashtag nào.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {hashtagsQuery.data?.map((tag: any) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs cursor-pointer hover:bg-emerald-100"
                  >
                    #{tag.name}{" "}
                    <span className="ml-1 text-[10px] text-emerald-600">
                      {tag.post_count} bài viết
                    </span>
                  </span>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default SearchResultsPage;

