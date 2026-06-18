import type { Post } from '../../domain/entities/Post';
import { PostStatusBadge } from './PostStatusBadge';
import { ModerationStatus } from '../../domain/entities/Post';

/**
 * PostCardProps - Props for PostCard component
 */
export interface PostCardProps {
  post: Post;
  onView?: (post: Post) => void;
  onDelete?: (id: number) => void;
  onApprove?: (postId: number) => Promise<void>;
  onReject?: (postId: number) => Promise<void>;
}

/**
 * PostCard - Displays a single post in card format with admin features
 */
export function PostCard({ post, onView, onDelete, onApprove, onReject }: PostCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getFirstMedia = () => {
    if (post.post_media && post.post_media.length > 0) {
      return post.post_media[0];
    }
    return null;
  };

  const firstMedia = getFirstMedia();


  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden border border-gray-200">
      {/* Media Preview */}
      {firstMedia && (
        <div className="relative h-48 bg-gray-100">
          {firstMedia.media_type === 'image' ? (
            <img
              src={firstMedia.media_url}
              alt={post.title || 'Post image'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <span className="text-white text-4xl">▶️</span>
            </div>
          )}
          {post.post_media && post.post_media.length > 1 && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
              +{post.post_media.length - 1} more
            </div>
          )}
        </div>
      )}

      <div className="p-5">
        {/* Status and Type */}
        <div className="flex items-center justify-between mb-3">
          <PostStatusBadge status={post.moderation_status} />
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {post.post_type || 'post'}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {post.title || 'Untitled Post'}
        </h3>

        {/* Content Preview */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {post.content_md.substring(0, 150)}
          {post.content_md.length > 150 ? '...' : ''}
        </p>

        {/* Author Information */}
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
            {post.user?.full_name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {post.user?.full_name || 'Unknown User'}
            </p>
            <p className="text-xs text-gray-500 truncate">{post.user?.email || ''}</p>
          </div>
        </div>

        {/* Shop Information (if applicable) */}
        {post.shop && (
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm">
              🏪
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{post.shop.name}</p>
              <p className="text-xs text-gray-500">Shop Post</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            👁️ {post.view_count.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            ❤️ {post.like_count.toLocaleString()}
          </span>
          <span className="text-xs">
            📅 {formatDate(post.created_at)}
          </span>
        </div>

        {/* Tags */}
        {post.post_tags && post.post_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.post_tags.slice(0, 3).map((tagItem) => (
              <span
                key={tagItem.tag_id}
                className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded"
              >
                #{tagItem.tag?.name || 'tag'}
              </span>
            ))}
            {post.post_tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                +{post.post_tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {onView && (
            <button
              onClick={() => onView(post)}
              className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Details
            </button>
          )}

          {post.moderation_status !== ModerationStatus.APPROVED && onApprove && (
            <button
              onClick={() => onApprove(post.id)}
              className="px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
              title="Approve"
            >
              ✓
            </button>
          )}

          {post.moderation_status !== ModerationStatus.REJECTED && onReject && (
            <button
              onClick={() => onReject(post.id)}
              className="px-3 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
              title="Reject"
            >
              ✕
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(post.id)}
              className="px-3 py-2 bg-gray-600 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors"
              title="Delete"
            >
              🗑
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
