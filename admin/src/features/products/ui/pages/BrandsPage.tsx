import React, { useState, useEffect } from 'react';
import { productApi } from '../../data/api/productApi';

interface Brand {
    id: number;
    name: string;
    slug: string;
    logo_url?: string;
}

export const BrandsPage: React.FC = () => {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [formData, setFormData] = useState({ name: '', slug: '', logo: null as File | null });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadBrands();
    }, []);

    const loadBrands = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await productApi.getBrands();
            if (response.success && response.brands) {
                setBrands(response.brands);
            } else {
                setError('Failed to load brands');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load brands');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingBrand(null);
        setFormData({ name: '', slug: '', logo: null });
        setShowForm(true);
    };

    const handleEdit = (brand: Brand) => {
        setEditingBrand(brand);
        setFormData({ name: brand.name, slug: brand.slug, logo: null });
        setShowForm(true);
    };

    const handleDelete = async (brandId: number) => {
        if (!confirm('Are you sure you want to delete this brand? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await productApi.deleteBrand(brandId);
            if (response.success) {
                alert('Brand deleted successfully');
                loadBrands();
            } else {
                alert(response.message || 'Failed to delete brand');
            }
        } catch (err: any) {
            alert(err.message || 'Failed to delete brand');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (editingBrand) {
                // Update brand
                if (formData.name !== editingBrand.name) {
                    const nameResponse = await productApi.updateBrandName(editingBrand.id, formData.name);
                    if (!nameResponse.success) {
                        throw new Error(nameResponse.message || 'Failed to update brand name');
                    }
                }
                if (formData.slug !== editingBrand.slug) {
                    const slugResponse = await productApi.updateBrandSlug(editingBrand.id, formData.slug);
                    if (!slugResponse.success) {
                        throw new Error(slugResponse.message || 'Failed to update brand slug');
                    }
                }
                if (formData.logo) {
                    const logoResponse = await productApi.updateBrandLogo(editingBrand.id, formData.logo);
                    if (!logoResponse.success) {
                        throw new Error(logoResponse.message || 'Failed to update brand logo');
                    }
                }
                alert('Brand updated successfully');
            } else {
                // Create brand
                if (!formData.logo) {
                    alert('Please select a logo image');
                    setSubmitting(false);
                    return;
                }
                const response = await productApi.createBrand(formData.name, formData.slug, formData.logo);
                if (response.success) {
                    alert('Brand created successfully');
                } else {
                    throw new Error(response.message || 'Failed to create brand');
                }
            }
            setShowForm(false);
            loadBrands();
        } catch (err: any) {
            alert(err.message || 'Failed to save brand');
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

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <p className="mt-2 text-gray-600">Loading brands...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    Brand Management
                                </h1>
                                <p className="mt-3 text-gray-600 text-lg">
                                    Create, edit, and manage makeup brands with ease
                                </p>
                            </div>
                            <button
                                onClick={handleAdd}
                                className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-3"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Add New Brand
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-5 bg-red-50 border-l-4 border-red-500 rounded-xl shadow-md animate-shake">
                        <div className="flex items-center">
                            <svg className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-red-800 font-medium">{error}</p>
                        </div>
                    </div>
                )}

                {showForm ? (
                    <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 border border-gray-100 animate-fadeIn">
                        <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                </div>
                                {editingBrand ? 'Edit Brand' : 'Create New Brand'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Brand Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => {
                                            setFormData({ ...formData, name: e.target.value });
                                            if (!editingBrand) {
                                                setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) });
                                            }
                                        }}
                                        required
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all duration-200"
                                        placeholder="e.g., MAC Cosmetics"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="slug" className="block text-sm font-semibold text-gray-700 mb-2">
                                        URL Slug *
                                    </label>
                                    <input
                                        type="text"
                                        id="slug"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        required
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all duration-200"
                                        placeholder="e.g., mac-cosmetics"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="logo" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Brand Logo {!editingBrand && '*'}
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="logo"
                                        accept="image/*"
                                        onChange={(e) => setFormData({ ...formData, logo: e.target.files?.[0] || null })}
                                        required={!editingBrand}
                                        className="w-full text-sm text-gray-600 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-indigo-50 file:to-purple-50 file:text-indigo-700 hover:file:from-indigo-100 hover:file:to-purple-100 cursor-pointer transition-all duration-200"
                                    />
                                </div>
                                {editingBrand && editingBrand.logo_url && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                        <p className="text-sm font-medium text-gray-600 mb-2">Current Logo:</p>
                                        <img src={editingBrand.logo_url} alt={editingBrand.name} className="h-20 object-contain rounded-lg shadow-md" />
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-8 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Saving...
                                        </span>
                                    ) : editingBrand ? 'Update Brand' : 'Create Brand'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : null}

                {/* Brands Grid */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                            </svg>
                            All Brands ({brands.length})
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                        Logo
                                    </th>
                                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                        Brand Name
                                    </th>
                                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                        URL Slug
                                    </th>
                                    <th className="px-8 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {brands.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <svg className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                </svg>
                                                <p className="text-gray-500 text-lg font-medium">No brands found</p>
                                                <p className="text-gray-400 text-sm mt-1">Click "Add New Brand" to create your first brand</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    brands.map((brand) => (
                                        <tr key={brand.id} className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200">
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                {brand.logo_url ? (
                                                    <div className="h-14 w-14 rounded-xl bg-white shadow-md p-2 border border-gray-100 flex items-center justify-center">
                                                        <img src={brand.logo_url} alt={brand.name} className="h-full w-full object-contain" />
                                                    </div>
                                                ) : (
                                                    <div className="h-14 w-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center border border-gray-200">
                                                        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <div className="text-base font-semibold text-gray-900">{brand.name}</div>
                                            </td>
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                                                    {brand.slug}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleEdit(brand)}
                                                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-900 font-semibold mr-6 transition-colors duration-200"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                    </svg>
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(brand.id)}
                                                    className="inline-flex items-center gap-2 text-red-600 hover:text-red-900 font-semibold transition-colors duration-200"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
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
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                .animate-shake {
                    animation: shake 0.3s ease-in-out;
                }
            `}</style>
        </div>
    );
};
