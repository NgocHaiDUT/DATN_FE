import React, { useState } from 'react';
import type { CreateProductInput, UpdateProductInput, Product } from '../../domain/entities/Product';

export interface ProductFormProps {
  product?: Product;
  onSubmit: (input: CreateProductInput | UpdateProductInput) => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * ProductForm - Form component for creating/editing products
 */
export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    description: product?.description || '',
    how_to_use: product?.how_to_use || '',
    shop_id: product?.shop_id?.toString() || '',
    brand_id: product?.brand_id?.toString() || '',
    category_ids: product?.product_categories?.map((pc) => pc.category_id).join(', ') || '',
    is_published: product?.is_published ?? true,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      is_published: e.target.checked,
    }));
  };

  const parseCsvNumbers = (value: string): number[] | undefined => {
    const parsed = value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v) && v > 0);
    return parsed.length > 0 ? parsed : undefined;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payloadBase = {
      name: formData.name.trim(),
      slug: formData.slug.trim() || undefined,
      description: formData.description.trim() || undefined,
      how_to_use: formData.how_to_use.trim() || undefined,
      brand_id: formData.brand_id ? Number(formData.brand_id) : undefined,
      category_ids: parseCsvNumbers(formData.category_ids),
      is_published: formData.is_published,
    };

    if (product) {
      const updateInput: UpdateProductInput = {
        id: product.id,
        ...payloadBase,
      };
      onSubmit(updateInput);
    } else {
      const createInput: CreateProductInput = {
        ...payloadBase,
        shop_id: Number(formData.shop_id),
      };
      onSubmit(createInput);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Product Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
            Slug
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="brand_id" className="block text-sm font-medium text-gray-700">
            Brand ID
          </label>
          <input
            type="number"
            id="brand_id"
            name="brand_id"
            min="1"
            value={formData.brand_id}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="shop_id" className="block text-sm font-medium text-gray-700">
            Shop ID *
          </label>
          <input
            type="number"
            id="shop_id"
            name="shop_id"
            required
            min="1"
            value={formData.shop_id}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            disabled={Boolean(product)}
          />
        </div>

        <div>
          <label htmlFor="category_ids" className="block text-sm font-medium text-gray-700">
            Category IDs (comma separated)
          </label>
          <input
            type="text"
            id="category_ids"
            name="category_ids"
            value={formData.category_ids}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="1, 2, 3"
          />
        </div>

        <div>
          <label htmlFor="how_to_use" className="block text-sm font-medium text-gray-700">
            How To Use
          </label>
          <textarea
            id="how_to_use"
            name="how_to_use"
            rows={3}
            value={formData.how_to_use}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={3}
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_published"
          name="is_published"
          checked={formData.is_published}
          onChange={handleCheckboxChange}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900">
          Published
        </label>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
};
