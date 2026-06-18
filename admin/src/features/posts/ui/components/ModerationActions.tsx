import { useState } from 'react';
import type { Post } from '../../domain/entities/Post';

interface ModerationActionsProps {
    post: Post;
    onApprove: (postId: number, reason?: string) => Promise<void>;
    onReject: (postId: number, reason?: string) => Promise<void>;
    disabled?: boolean;
}

/**
 * ModerationActions - Action buttons for approving or rejecting posts
 */
export function ModerationActions({
    post,
    onApprove,
    onReject,
    disabled = false,
}: ModerationActionsProps) {
    const [loading, setLoading] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const handleApprove = async () => {
        if (disabled || loading) return;

        const confirmed = window.confirm(
            `Are you sure you want to approve this post?\n\nTitle: ${post.title || 'Untitled'}\nAuthor: ${post.user?.full_name || 'Unknown'}`
        );

        if (!confirmed) return;

        setLoading(true);
        try {
            await onApprove(post.id);
        } catch (error) {
            alert(`Failed to approve post: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRejectClick = () => {
        setShowRejectModal(true);
    };

    const handleRejectConfirm = async () => {
        if (disabled || loading) return;

        setLoading(true);
        try {
            await onReject(post.id, rejectReason || undefined);
            setShowRejectModal(false);
            setRejectReason('');
        } catch (error) {
            alert(`Failed to reject post: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRejectCancel = () => {
        setShowRejectModal(false);
        setRejectReason('');
    };

    return (
        <>
            <div className="flex items-center gap-2">
                <button
                    onClick={handleApprove}
                    disabled={disabled || loading}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                    {loading ? (
                        <>
                            <span className="animate-spin">⏳</span>
                            Processing...
                        </>
                    ) : (
                        <>
                            <span>✓</span>
                            Approve
                        </>
                    )}
                </button>

                <button
                    onClick={handleRejectClick}
                    disabled={disabled || loading}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                    <span>✕</span>
                    Reject
                </button>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Post</h3>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                                <strong>Post:</strong> {post.title || 'Untitled'}
                            </p>
                            <p className="text-sm text-gray-600 mb-4">
                                <strong>Author:</strong> {post.user?.full_name || 'Unknown'}
                            </p>
                        </div>

                        <div className="mb-6">
                            <label htmlFor="reject-reason" className="block text-sm font-medium text-gray-700 mb-2">
                                Reason for rejection (optional)
                            </label>
                            <textarea
                                id="reject-reason"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                rows={4}
                                placeholder="Explain why this post is being rejected..."
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleRejectCancel}
                                disabled={loading}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectConfirm}
                                disabled={loading}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <span className="animate-spin">⏳</span>
                                        Rejecting...
                                    </>
                                ) : (
                                    <>
                                        <span>✕</span>
                                        Confirm Rejection
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
