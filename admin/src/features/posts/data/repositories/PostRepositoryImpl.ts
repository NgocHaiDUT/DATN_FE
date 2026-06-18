import type { Post, CreatePostInput, UpdatePostInput, ModerationActionInput } from '../../domain/entities/Post';
import type { IPostRepository } from '../../domain/repositories/IPostRepository';
import { postsApi, type GetPostsParams } from '../api/postsApi';

/**
 * PostRepositoryImpl - Implementation of IPostRepository using PostsApi
 */
export class PostRepositoryImpl implements IPostRepository {
  async getPosts(params?: GetPostsParams): Promise<{ data: Post[]; total: number }> {
    const response = await postsApi.getPosts(params);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch posts');
    }

    return {
      data: response.data,
      total: response.pagination?.total || response.data.length,
    };
  }

  async getPostById(id: number): Promise<Post> {
    const response = await postsApi.getPostById(id);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Post not found');
    }

    return response.data;
  }

  async createPost(input: CreatePostInput): Promise<Post> {
    const response = await postsApi.createPost(input);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create post');
    }

    return response.data;
  }

  async updatePost(input: UpdatePostInput): Promise<Post> {
    const response = await postsApi.updatePost(input);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update post');
    }

    return response.data;
  }

  async deletePost(id: number): Promise<void> {
    await postsApi.deletePost(id);
    // Backend returns { message: 'Post deleted successfully' }
    // No need to check response, if it doesn't throw, it succeeded
  }

  async approvePost(postId: number, reason?: string): Promise<Post> {
    const response = await postsApi.approvePost(postId, reason);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to approve post');
    }

    return response.data;
  }

  async rejectPost(postId: number, reason?: string): Promise<Post> {
    const response = await postsApi.rejectPost(postId, reason);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to reject post');
    }

    return response.data;
  }

  async moderatePost(input: ModerationActionInput): Promise<Post> {
    const response = await postsApi.moderatePost(input);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to moderate post');
    }

    return response.data;
  }

  async getModerationStats(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    removed: number;
    total: number;
  }> {
    const response = await postsApi.getModerationStats();

    if (!response.success || !response.data) {
      throw new Error('Failed to fetch moderation stats');
    }

    return response.data;
  }
}
