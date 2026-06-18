import { useState, useEffect } from 'react';
import type { CreatePostInput, UpdatePostInput, Post } from '../../domain/entities/Post';
import { ModerationStatus, PostVisibility } from '../../domain/entities/Post';
import { ProductSelector } from './ProductSelector';

/**
 * PostFormProps - Props for PostForm component
 */
export interface PostFormProps {
  post?: Post;
  onSubmit: (input: CreatePostInput | UpdatePostInput) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

/**
 * PostForm - Form component for creating/editing posts
 */
export function PostForm({ post, onSubmit, onCancel, loading }: PostFormProps) {
  const [formData, setFormData] = useState({
    title: post?.title || '',
    content_md: post?.content_md || '',
    status: post?.moderation_status || ModerationStatus.APPROVED,
    visibility: post?.visibility || PostVisibility.PUBLIC,
    tags: post?.post_tags?.map(pt => pt.tag?.name).filter(Boolean).join(', ') || '',
  });

  const [selectedProductIds, setSelectedProductIds] = useState<number[]>(
    post?.post_products?.map(pp => pp.product_id) || []
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        content_md: post.content_md || '',
        status: post.moderation_status || ModerationStatus.APPROVED,
        visibility: post.visibility || PostVisibility.PUBLIC,
        tags: post.post_tags?.map(pt => pt.tag?.name).filter(Boolean).join(', ') || '',
      });
      setSelectedProductIds(post.post_products?.map(pp => pp.product_id) || []);
    }
  }, [post]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.content_md.trim()) {
      newErrors.content_md = 'Content is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const tags = formData.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const baseInput = {
      title: formData.title,
      content_md: formData.content_md,
      visibility: formData.visibility as PostVisibility,
      tags,
      product_ids: selectedProductIds,
    };

    try {
      if (post) {
        await onSubmit({
          ...baseInput,
          id: post.id,
        });
      } else {
        await onSubmit(baseInput);
      }
    } catch (error) {
      console.error('Failed to submit post:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900">
        {post ? 'Edit Post' : 'Create New Post'}
      </h2>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter post title (optional)"
        />
      </div>

      {/* Content */}
      <div>
        <label htmlFor="content_md" className="block text-sm font-medium text-gray-700 mb-2">
          Content *
        </label>
        <textarea
          id="content_md"
          name="content_md"
          value={formData.content_md}
          onChange={handleChange}
          rows={10}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.content_md ? 'border-red-500' : 'border-gray-300'
            }`}
          placeholder="Write your post content here (Markdown supported)..."
        />
        {errors.content_md && <p className="mt-1 text-sm text-red-600">{errors.content_md}</p>}
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          id="tags"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="react, typescript, tutorial"
        />
      </div>

      {/* Product Selector */}
      <ProductSelector
        selectedProductIds={selectedProductIds}
        onProductsChange={setSelectedProductIds}
      />

      {/* Visibility */}
      <div>
        <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-2">
          Visibility
        </label>
        <select
          id="visibility"
          name="visibility"
          value={formData.visibility}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={PostVisibility.PUBLIC}>Public</option>
          <option value={PostVisibility.FRIENDS}>Friends Only</option>
          <option value={PostVisibility.PRIVATE}>Private</option>
        </select>
      </div>

      {/* Status (Read-only for editing, or selectable) */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
          Moderation Status (Read-only)
        </label>
        <input
          type="text"
          value={formData.status}
          disabled
          className="w-full px-4 py-2 border border-gray-100 bg-gray-50 rounded-lg text-gray-500"
        />
      </div>

      {/* Actions */}
      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : post ? 'Update Post' : 'Create Post'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
