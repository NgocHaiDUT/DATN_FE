import { useState, useCallback } from 'react';
import type { Post } from '../domain/entities/Post';
import { PostRepositoryImpl } from '../data/repositories/PostRepositoryImpl';
import type { GetPostsParams } from '../data/api/postsApi';

const repository = new PostRepositoryImpl();

interface ModerationStats {

  approved: number;
  rejected: number;
  removed: number;
  total: number;
}

/**
 * usePosts - Custom hook for managing posts with moderation capabilities
 */
export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<ModerationStats | null>(null);

  /**
   * Fetch posts with optional filters
   */
  const fetchPosts = useCallback(async (params?: GetPostsParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await repository.getPosts(params);
      setPosts(response.data);
      setTotal(response.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch posts';
      setError(message);
      setPosts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch moderation statistics
   */
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await repository.getModerationStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch moderation stats:', err);
    }
  }, []);

  /**
   * Get a single post by ID
   */
  const getPostById = useCallback(async (id: number): Promise<Post | null> => {
    try {
      return await repository.getPostById(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch post';
      setError(message);
      return null;
    }
  }, []);

  /**
   * Delete a post
   */
  const deletePost = useCallback(async (id: number) => {
    try {
      await repository.deletePost(id);
      setPosts((prev) => prev.filter((post) => post.id !== id));
      setTotal((prev) => prev - 1);

      // Update stats
      await fetchStats();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete post';
      setError(message);
      throw err;
    }
  }, [fetchStats]);

  /**
   * Approve a post
   */
  const approvePost = useCallback(
    async (postId: number, reason?: string) => {
      try {
        const updatedPost = await repository.approvePost(postId, reason);

        // Update local state
        setPosts((prev) =>
          prev.map((post) => (post.id === postId ? updatedPost : post))
        );

        // Update stats
        await fetchStats();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to approve post';
        setError(message);
        throw err;
      }
    },
    [fetchStats]
  );

  /**
   * Reject a post
   */
  const rejectPost = useCallback(
    async (postId: number, reason?: string) => {
      try {
        const updatedPost = await repository.rejectPost(postId, reason);

        // Update local state
        setPosts((prev) =>
          prev.map((post) => (post.id === postId ? updatedPost : post))
        );

        // Update stats
        await fetchStats();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to reject post';
        setError(message);
        throw err;
      }
    },
    [fetchStats]
  );

  return {
    posts,
    loading,
    error,
    total,
    stats,
    fetchPosts,
    fetchStats,
    getPostById,
    deletePost,
    approvePost,
    rejectPost,
  };
}
