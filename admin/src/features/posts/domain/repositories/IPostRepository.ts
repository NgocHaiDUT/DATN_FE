import type { Post, CreatePostInput, UpdatePostInput } from '../entities';

/**
 * IPostRepository - Interface defining post data access operations
 */
export interface IPostRepository {
  /**
   * Retrieves all posts with optional filtering
   */
  getPosts(params?: {
    status?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Post[]; total: number }>;

  /**
   * Retrieves a single post by ID
   */
  getPostById(id: number): Promise<Post>;

  /**
   * Creates a new post
   */
  createPost(input: CreatePostInput): Promise<Post>;

  /**
   * Updates an existing post
   */
  updatePost(input: UpdatePostInput): Promise<Post>;

  /**
   * Deletes a post by ID
   */
  deletePost(id: number): Promise<void>;
}
