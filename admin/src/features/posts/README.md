# Posts Management Feature

## Overview
This feature implements a complete posts management system following Clean Architecture principles and feature-based folder structure.

## Architecture

The feature is organized into four main layers:

### 1. Domain Layer (`domain/`)
Contains the core business entities and repository interfaces.

- **Entities**: `Post`, `CreatePostInput`, `UpdatePostInput`, `PostStatus`
- **Repositories**: `IPostRepository` (interface defining data operations)

### 2. Use Cases Layer (`usecases/`)
Contains business logic and application-specific flows.

- `GetPostsUseCase` - Fetch all posts with filtering
- `GetPostByIdUseCase` - Fetch a single post
- `CreatePostUseCase` - Create a new post with validation
- `UpdatePostUseCase` - Update an existing post
- `DeletePostUseCase` - Delete a post

### 3. Data Layer (`data/`)
Handles API communication and data transformation.

- **API Client**: `PostsApi` - HTTP requests to backend
- **Mappers**: Convert between DTOs and domain entities
- **Repository Implementation**: `PostRepositoryImpl` - Implements `IPostRepository`

### 4. Presentation Layer (`ui/`)
React components and pages for user interaction.

#### Components (`ui/components/`)
- `PostCard` - Display single post in card format
- `PostList` - Grid layout of post cards
- `PostForm` - Form for creating/editing posts

#### Pages (`ui/pages/`)
- `PostsPage` - Main listing page with filters
- `PostDetailPage` - Detailed view of a single post
- `CreatePostPage` - Create new post
- `EditPostPage` - Edit existing post

### 5. Hooks Layer (`hooks/`)
Custom React hooks for state management.

- `usePosts` - Main hook providing all post operations

## Usage

### Import the feature
```typescript
import { PostsPage, usePosts } from '@/features/posts';
```

### Use in routing
```typescript
import { PostsPage, PostDetailPage, CreatePostPage, EditPostPage } from '@/features/posts';

// In your router
<Route path="/posts" element={<PostsPage />} />
<Route path="/posts/:id" element={<PostDetailPage />} />
<Route path="/posts/create" element={<CreatePostPage />} />
<Route path="/posts/edit/:id" element={<EditPostPage />} />
```

### Use the hook directly
```typescript
import { usePosts } from '@/features/posts';

function MyComponent() {
  const { posts, loading, fetchPosts, createPost, updatePost, deletePost } = usePosts();

  useEffect(() => {
    fetchPosts();
  }, []);

  // Use the data and actions
}
```

## Features

- ✅ Complete CRUD operations (Create, Read, Update, Delete)
- ✅ Filtering by status, category, and search
- ✅ Post status management (Draft, Published, Archived)
- ✅ Rich post metadata (views, likes, comments)
- ✅ Image support
- ✅ Tags and categories
- ✅ Author information
- ✅ Responsive UI with TailwindCSS
- ✅ Form validation
- ✅ Loading and error states
- ✅ Clean Architecture separation

## Post Entity Structure

```typescript
interface Post {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  authorId: string;
  authorName: string;
  status: PostStatus; // 'draft' | 'published' | 'archived'
  category: string;
  tags: string[];
  imageUrl?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}
```

## Development

### Adding new features
1. Add new use case in `usecases/`
2. Update repository interface if needed
3. Implement in data layer
4. Expose through custom hook
5. Create/update UI components

### Testing
- Unit tests for use cases (mock repository)
- Integration tests for repository (mock API)
- Component tests for UI

## Dependencies

- React 18+
- TypeScript
- TailwindCSS
- React Router (for navigation)

## Notes

- All business logic is in use cases, not in components
- Domain layer has no framework dependencies
- Repository pattern abstracts data access
- Clean separation enables easy testing and maintenance
