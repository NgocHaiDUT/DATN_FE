// Domain exports
export type {
  Post,
  PostMedia,
  PostProduct,
  PostTag,
  CreatePostInput,
  UpdatePostInput,
  ModerationActionInput,
} from './domain/entities';
export { ModerationStatus, PostVisibility } from './domain/entities';
export type { IPostRepository } from './domain/repositories';



// Data layer exports
export { PostsApi } from './data/api';
export { PostRepositoryImpl } from './data/repositories';

// Hooks exports
export { usePosts } from './hooks';

// UI exports
export {
  PostCard,
  PostList,
  // PostForm, // Old component, not used in new implementation
  PostStatusBadge,
  ModerationActions,
  PostDetailModal,
} from './ui/components';
export { PostsPage } from './ui/pages';
// Old pages commented out - they use PostForm
// export { PostDetailPage, CreatePostPage, EditPostPage } from './ui/pages';



