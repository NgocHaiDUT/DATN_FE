import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { Post } from '../../domain/entities/Post';
import { PostStatusBadge } from './PostStatusBadge';
import { ModerationActions } from './ModerationActions';
import { fetchPostComments, fetchCommentReplies, type Comment } from '../../data/api/commentsApi';

interface PostDetailModalProps {
    post: Post;
    onClose: () => void;
    onApprove?: (postId: number, reason?: string) => Promise<void>;
    onReject?: (postId: number, reason?: string) => Promise<void>;
    onDelete?: (postId: number) => Promise<void>;
}

/**
 * PostDetailModal - Modal for viewing full post details and moderation
 */
export function PostDetailModal({
    post,
    onClose,
    onApprove,
    onReject,
    onDelete,
}: PostDetailModalProps) {
    const navigate = useNavigate();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
    const [commentReplies, setCommentReplies] = useState<Record<number, Comment[]>>({});
    const [loadingReplies, setLoadingReplies] = useState<Set<number>>(new Set());

    // Fetch comments when modal opens
    useEffect(() => {
        const loadComments = async () => {
            setLoadingComments(true);
            try {
                const fetchedComments = await fetchPostComments(post.id);
                setComments(fetchedComments);
            } catch (error) {
                console.error('Failed to fetch comments:', error);
            } finally {
                setLoadingComments(false);
            }
        };

        loadComments();
    }, [post.id]);

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleDelete = async () => {
        if (!onDelete) return;

        const confirmed = window.confirm(
            `Are you sure you want to delete this post?\n\nThis action cannot be undone.`
        );

        if (!confirmed) return;

        try {
            await onDelete(post.id);
            onClose();
        } catch (error) {
            alert(`Failed to delete post: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleAuthorClick = () => {
        if (post.user_id) {
            navigate(`/users/${post.user_id}`);
        }
    };

    const handleCommentAuthorClick = (userId: number) => {
        if (userId) {
            navigate(`/users/${userId}`);
        }
    };

    const handleToggleReplies = async (commentId: number) => {
        const isExpanded = expandedComments.has(commentId);

        if (isExpanded) {
            // Collapse
            const newExpanded = new Set(expandedComments);
            newExpanded.delete(commentId);
            setExpandedComments(newExpanded);
        } else {
            // Expand - fetch replies if not already loaded
            const newExpanded = new Set(expandedComments);
            newExpanded.add(commentId);
            setExpandedComments(newExpanded);

            if (!commentReplies[commentId]) {
                const newLoading = new Set(loadingReplies);
                newLoading.add(commentId);
                setLoadingReplies(newLoading);

                try {
                    const replies = await fetchCommentReplies(commentId);
                    setCommentReplies(prev => ({ ...prev, [commentId]: replies }));
                } catch (error) {
                    console.error('Failed to fetch replies:', error);
                } finally {
                    const updated = new Set(loadingReplies);
                    updated.delete(commentId);
                    setLoadingReplies(updated);
                }
            }
        }
    };



    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Post Details</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Status and Type */}
                    <div className="flex items-center gap-3 mb-6">
                        <PostStatusBadge status={post.moderation_status} />
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                            Type: {post.post_type || 'post'}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                            Visibility: {post.visibility}
                        </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        {post.title || 'Untitled Post'}
                    </h3>

                    {/* Author Information */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Author Information</h4>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                {post.user?.full_name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                                <p
                                    className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
                                    onClick={handleAuthorClick}
                                    title="View user details"
                                >
                                    {post.user?.full_name || 'Unknown User'}
                                </p>
                                <p className="text-sm text-gray-600">{post.user?.email || 'No email'}</p>
                                <p className="text-xs text-gray-500">User ID: {post.user_id}</p>
                            </div>
                        </div>
                    </div>

                    {/* Shop Information */}
                    {post.shop && (
                        <div className="bg-blue-50 rounded-lg p-4 mb-6">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Shop Information</h4>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xl">
                                    🏪
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{post.shop.name}</p>
                                    <p className="text-xs text-gray-500">Shop ID: {post.shop_id}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Media Gallery */}
                    {post.post_media && post.post_media.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Media ({post.post_media.length})</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {post.post_media.map((media) => (
                                    <div key={media.id} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                        {media.media_type === 'image' ? (
                                            <img
                                                src={media.media_url}
                                                alt="Post media"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                                <span className="text-white text-4xl">▶️</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Content</h4>
                        <div className="prose max-w-none bg-gray-50 rounded-lg p-4">
                            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                                {post.content_md}
                            </pre>
                        </div>
                    </div>

                    {/* Tagged Products */}
                    {post.post_products && post.post_products.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                Linked Products ({post.post_products.length})
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {post.post_products.map((productItem) => (
                                    <div
                                        key={productItem.product_id}
                                        className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
                                    >
                                        {/* Product Image */}
                                        <div className="aspect-square bg-gray-100 relative">
                                            {productItem.product?.image ? (
                                                <img
                                                    src={productItem.product.image}
                                                    alt={productItem.product.name || 'Product'}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="40" fill="%239ca3af"%3E📦%3C/text%3E%3C/svg%3E';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                                                    📦
                                                </div>
                                            )}
                                            {/* Try-On Badge */}
                                            {productItem.product?.hasTryOn && (
                                                <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-md">
                                                    ✨ Try-On
                                                </div>
                                            )}
                                        </div>
                                        {/* Product Info */}
                                        <div className="p-3">
                                            <p className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                                                {productItem.product?.name || `Product #${productItem.product_id}`}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                ID: {productItem.product_id}
                                            </p>
                                            {productItem.product?.slug && (
                                                <p className="text-xs text-blue-600 truncate mt-1" title={productItem.product.slug}>
                                                    {productItem.product.slug}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tags */}
                    {post.post_tags && post.post_tags.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Tags</h4>
                            <div className="flex flex-wrap gap-2">
                                {post.post_tags.map((tagItem) => (
                                    <span
                                        key={tagItem.tag_id}
                                        className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                                    >
                                        #{tagItem.tag?.name || 'tag'}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-1">👁️ Views</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {post.view_count.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-pink-50 rounded-lg p-4">
                            <p className="text-sm text-pink-600 mb-1">❤️ Likes</p>
                            <p className="text-2xl font-bold text-pink-700">
                                {post.like_count.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4">
                            <p className="text-sm text-blue-600 mb-1">💬 Comments</p>
                            <p className="text-2xl font-bold text-blue-700">
                                {(post.comment_count || 0).toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-1">📅 Created</p>
                            <p className="text-sm font-medium text-gray-900">{formatDate(post.created_at)}</p>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="border-t border-gray-200 pt-6 mb-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-4">
                            💬 Comments ({comments.length})
                        </h4>
                        {loadingComments ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500">Loading comments...</p>
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                                <p className="text-gray-500">No comments yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {comments.map((comment) => (
                                    <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                                {comment.user?.full_name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1">
                                                <p
                                                    className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer transition-colors text-sm"
                                                    onClick={() => handleCommentAuthorClick(comment.user_id)}
                                                    title="View user details"
                                                >
                                                    {comment.user?.full_name || 'Unknown User'}
                                                </p>
                                                <p className="text-xs text-gray-500 mb-2">
                                                    {new Date(comment.created_at).toLocaleString('vi-VN')}
                                                </p>
                                                <p className="text-sm text-gray-700">{comment.content}</p>

                                                {/* Reply toggle button */}
                                                {comment.replies_count && comment.replies_count > 0 && (
                                                    <button
                                                        onClick={() => handleToggleReplies(comment.id)}
                                                        className="text-xs text-blue-600 hover:text-blue-800 mt-2 flex items-center gap-1 font-medium transition-colors"
                                                    >
                                                        <span>{expandedComments.has(comment.id) ? '▼' : '▶'}</span>
                                                        {comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}
                                                    </button>
                                                )}

                                                {/* Nested replies */}
                                                {expandedComments.has(comment.id) && (
                                                    <div className="mt-3 ml-4 space-y-3 border-l-2 border-gray-300 pl-4">
                                                        {loadingReplies.has(comment.id) ? (
                                                            <p className="text-xs text-gray-500">Loading replies...</p>
                                                        ) : (
                                                            commentReplies[comment.id]?.map((reply) => (
                                                                <div key={reply.id} className="bg-white rounded p-3">
                                                                    <div className="flex items-start gap-2">
                                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                                            {reply.user?.full_name?.charAt(0).toUpperCase() || '?'}
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <p
                                                                                className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer transition-colors text-xs"
                                                                                onClick={() => handleCommentAuthorClick(reply.user_id)}
                                                                                title="View user details"
                                                                            >
                                                                                {reply.user?.full_name || 'Unknown User'}
                                                                            </p>
                                                                            <p className="text-xs text-gray-500 mb-1">
                                                                                {new Date(reply.created_at).toLocaleString('vi-VN')}
                                                                            </p>
                                                                            <p className="text-xs text-gray-700">{reply.content}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Moderation Actions */}
                    {(onApprove || onReject) && (
                        <div className="border-t border-gray-200 pt-6 mb-6">
                            <h4 className="text-sm font-semibold text-gray-700 mb-4">Moderation Actions</h4>
                            <ModerationActions
                                post={post}
                                onApprove={onApprove || (async () => { })}
                                onReject={onReject || (async () => { })}
                            />
                        </div>
                    )}

                    {/* Delete Action */}
                    {onDelete && (
                        <div className="border-t border-gray-200 pt-6">
                            <h4 className="text-sm font-semibold text-gray-700 mb-4">Danger Zone</h4>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
                            >
                                🗑 Delete Post Permanently
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
