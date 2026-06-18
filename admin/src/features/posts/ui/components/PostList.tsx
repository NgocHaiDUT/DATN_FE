import type { Post } from '../../domain/entities/Post';
import { PostCard } from './PostCard';

interface PostListProps {
  posts: Post[];
  loading?: boolean;
  onView?: (post: Post) => void;
  onDelete?: (id: number) => void;
  onApprove?: (postId: number) => Promise<void>;
  onReject?: (postId: number) => Promise<void>;
}

/**
 * PostList - Displays a grid of post cards
 */
export function PostList({
  posts,
  loading = false,
  onView,
  onDelete,
  onApprove,
  onReject,
}: PostListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
          >
            <div className="h-48 bg-gray-200" />
            <div className="p-5">
              <div className="h-4 bg-gray-200 rounded mb-3 w-1/3" />
              <div className="h-6 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded mb-4" />
              <div className="h-4 bg-gray-200 rounded mb-2 w-2/3" />
              <div className="h-10 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
        <p className="text-gray-600 text-center max-w-md">
          There are no posts matching your current filters. Try adjusting your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onView={onView}
          onDelete={onDelete}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
    </div>
  );
}
