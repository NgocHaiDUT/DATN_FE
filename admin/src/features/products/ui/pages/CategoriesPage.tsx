import React, { useState, useEffect } from 'react';
import { productApi } from '../../data/api/productApi';

interface Category {
    id: number;
    name: string;
    slug: string;
    parent_id?: number;
}

export const CategoriesPage: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({ name: '', slug: '', parent_id: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await productApi.getCategories();
            if (response.success && response.categories) {
                setCategories(response.categories);
            } else {
                setError('Failed to load categories');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingCategory(null);
        setFormData({ name: '', slug: '', parent_id: '' });
        setShowForm(true);
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            slug: category.slug,
            parent_id: category.parent_id?.toString() || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (categoryId: number) => {
        if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await productApi.deleteCategory(categoryId);
            if (response.success) {
                alert('Category deleted successfully');
                loadCategories();
            } else {
                alert(response.message || 'Failed to delete category');
            }
        } catch (err: any) {
            alert(err.message || 'Failed to delete category');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (editingCategory) {
                // Update category
                if (formData.name !== editingCategory.name) {
                    const nameResponse = await productApi.updateCategoryName(editingCategory.id, formData.name);
                    if (!nameResponse.success) {
                        throw new Error(nameResponse.message || 'Failed to update category name');
                    }
                }
                if (formData.slug !== editingCategory.slug) {
                    const slugResponse = await productApi.updateCategorySlug(editingCategory.id, formData.slug);
                    if (!slugResponse.success) {
                        throw new Error(slugResponse.message || 'Failed to update category slug');
                    }
                }
                alert('Category updated successfully');
            } else {
                // Create category
                const response = await productApi.createCategory(
                    formData.name,
                    formData.slug,
                    formData.parent_id ? Number(formData.parent_id) : undefined
                );
                if (response.success) {
                    alert('Category created successfully');
                } else {
                    throw new Error(response.message || 'Failed to create category');
                }
            }
            setShowForm(false);
            loadCategories();
        } catch (err: any) {
            alert(err.message || 'Failed to save category');
        } finally {
            setSubmitting(false);
        }
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const getCategoryName = (id: number) => {
        return categories.find(c => c.id === id)?.name || `Category ${id}`;
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <p className="mt-2 text-gray-600">Loading categories...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Manage Categories</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Create, edit, and delete product categories
                    </p>
                </div>
                <button
                    onClick={handleAdd}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium shadow-sm flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Category
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {showForm ? (
                <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        {editingCategory ? 'Edit Category' : 'Create New Category'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Category Name *
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={formData.name}
                                onChange={(e) => {
                                    setFormData({ ...formData, name: e.target.value });
                                    if (!editingCategory) {
                                        setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) });
                                    }
                                }}
                                required
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                placeholder="e.g., Lipstick, Foundation"
                            />
                        </div>
                        <div>
                            <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                                Slug *
                            </label>
                            <input
                                type="text"
                                id="slug"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                required
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                placeholder="e.g., lipstick, foundation"
                            />
                        </div>
                        <div>
                            <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700">
                                Parent Category (Optional)
                            </label>
                            <select
                                id="parent_id"
                                value={formData.parent_id}
                                onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            >
                                <option value="">None (Top Level Category)</option>
                                {categories
                                    .filter(c => !editingCategory || c.id !== editingCategory.id)
                                    .map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50"
                                disabled={submitting}
                            >
                                {submitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Slug
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Parent Category
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {categories.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                    No categories found. Click "Add Category" to create one.
                                </td>
                            </tr>
                        ) : (
                            categories.map((category) => (
                                <tr key={category.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{category.slug}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {category.parent_id ? getCategoryName(category.parent_id) : '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEdit(category)}
                                            className="text-purple-600 hover:text-purple-900 mr-4"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(category.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
