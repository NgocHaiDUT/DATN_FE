import { useEffect, useState } from 'react';
import { usePosts } from '../../hooks';
import { PostList, PostDetailModal } from '../components';
import type { Post, ModerationStatus } from '../../domain/entities/Post';
import { useI18n } from '../../../../shared/i18n/I18nContext';

/**
 * PostsPage - Main page for posts management with moderation features
 */
export function PostsPage() {
  const { t } = useI18n();
  const { posts, loading, error, total, fetchPosts, deletePost, approvePost, rejectPost, stats, fetchStats } =
    usePosts();

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [activeTab, setActiveTab] = useState<ModerationStatus>('approved');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);

  // Advanced filters
  const [filters, setFilters] = useState({
    visibility: '',
    post_type: '',
    user_id: '',
    shop_id: '',
  });

  useEffect(() => {
    loadPosts();
    fetchStats();
  }, [activeTab, currentPage, searchQuery, filters]);

  const loadPosts = () => {
    const params: any = {
      page: currentPage,
      limit: pageSize,
    };

    params.moderation_status = activeTab;

    if (searchQuery) {
      params.search = searchQuery;
    }

    if (filters.visibility) {
      params.visibility = filters.visibility;
    }

    if (filters.post_type) {
      params.post_type = filters.post_type;
    }

    if (filters.user_id) {
      params.user_id = parseInt(filters.user_id);
    }

    if (filters.shop_id) {
      params.shop_id = parseInt(filters.shop_id);
    }

    fetchPosts(params);
  };

  const handleApprove = async (postId: number, reason?: string) => {
    await approvePost(postId, reason);
    loadPosts();
    if (selectedPost?.id === postId) {
      setSelectedPost(null);
    }
  };

  const handleReject = async (postId: number, reason?: string) => {
    await rejectPost(postId, reason);
    loadPosts();
    if (selectedPost?.id === postId) {
      setSelectedPost(null);
    }
  };

  const handleDelete = async (postId: number) => {
    await deletePost(postId);
    loadPosts();
    if (selectedPost?.id === postId) {
      setSelectedPost(null);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilters({
      visibility: '',
      post_type: '',
      user_id: '',
      shop_id: '',
    });
    setActiveTab('approved');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('posts.title')}</h1>
          <p className="text-gray-600">{t('posts.subtitle')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">


          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('posts.approved')}</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.approved || 0}</p>
              </div>
              <div className="text-4xl">✓</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('posts.rejected')}</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.rejected || 0}</p>
              </div>
              <div className="text-4xl">✕</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('posts.total')}</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.total || total}</p>
              </div>
              <div className="text-4xl">📝</div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
            <button
              onClick={() => {
                setActiveTab('approved');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              ✓ {t('posts.approved')}
            </button>
            <button
              onClick={() => {
                setActiveTab('rejected');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              × {t('posts.rejected')}
            </button>
          </div>

          {/* Search and Filter Toggle */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={t('posts.searchPlaceholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
            >
              {showFilters ? '▲' : '▼'} {t('posts.advancedFilters')}
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
            >
              {t('posts.clearAll')}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('posts.visibility')}
                </label>
                <select
                  value={filters.visibility}
                  onChange={(e) => {
                    setFilters({ ...filters, visibility: e.target.value });
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('posts.all')}</option>
                  <option value="public">{t('posts.public')}</option>
                  <option value="private">{t('posts.private')}</option>
                  <option value="friends">{t('posts.friendsOnly')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('posts.postType')}
                </label>
                <input
                  type="text"
                  value={filters.post_type}
                  onChange={(e) => {
                    setFilters({ ...filters, post_type: e.target.value });
                    setCurrentPage(1);
                  }}
                  placeholder={t('posts.postTypePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('posts.userId')}</label>
                <input
                  type="number"
                  value={filters.user_id}
                  onChange={(e) => {
                    setFilters({ ...filters, user_id: e.target.value });
                    setCurrentPage(1);
                  }}
                  placeholder={t('posts.filterByUser')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('posts.shopId')}</label>
                <input
                  type="number"
                  value={filters.shop_id}
                  onChange={(e) => {
                    setFilters({ ...filters, shop_id: e.target.value });
                    setCurrentPage(1);
                  }}
                  placeholder={t('posts.filterByShop')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8">
            <p className="font-semibold">{t('posts.errorLoading')}</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Posts List */}
        <PostList
          posts={posts}
          loading={loading}
          onView={setSelectedPost}
          onDelete={handleDelete}
          onApprove={handleApprove}
          onReject={handleReject}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              ← {t('common.prev')}
            </button>

            <div className="flex gap-2">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg font-semibold ${currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {t('common.next')} →
            </button>
          </div>
        )}

        {/* Post Detail Modal */}
        {selectedPost && (
          <PostDetailModal
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            onApprove={handleApprove}
            onReject={handleReject}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
