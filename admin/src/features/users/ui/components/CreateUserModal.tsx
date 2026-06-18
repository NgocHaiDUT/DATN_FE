import React, { useState } from 'react';
import { useI18n } from '../../../../shared/i18n/I18nContext';

/**
 * CreateUserModalProps defines the properties for CreateUserModal component
 */
export interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: CreateUserFormData) => void;
  roles?: Array<{ id: number; name: string }>;
}

/**
 * CreateUserFormData defines the structure of form data
 */
export interface CreateUserFormData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  is_active: boolean;
  role_id: number;
  avatar?: File;
}

/**
 * CreateUserModal displays a modal for creating new users
 */
export const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onSubmit, roles = [] }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState<CreateUserFormData>({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    is_active: true,
    role_id: 1,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [errors, setErrors] = useState<Partial<Record<keyof CreateUserFormData, string>>>({});

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value 
    }));
    // Clear error when user starts typing
    if (errors[name as keyof CreateUserFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CreateUserFormData, string>> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = t('users.validation.fullNameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('users.validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('users.validation.emailInvalid');
    }

    if (!formData.password.trim()) {
      newErrors.password = t('users.validation.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('users.validation.passwordMin');
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t('users.validation.phoneRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const submitData = { ...formData, avatar: avatarFile || undefined };
      onSubmit(submitData);
      // Reset form
      setFormData({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        is_active: true,
        role_id: 1,
      });
      setAvatarFile(null);
      setAvatarPreview(null);
      setErrors({});
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{t('users.create')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('users.basicInfo')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('users.fullName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${
                    errors.full_name ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500`}
                  placeholder={t('users.fullNamePlaceholder')}
                />
                {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('users.emailAddress')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500`}
                  placeholder="user@example.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('users.password')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500`}
                  placeholder={t('users.passwordPlaceholder')}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('users.phone')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500`}
                  placeholder={t('users.phonePlaceholder')}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('users.colRole')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="role_id"
                  value={formData.role_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  {roles.length > 0 ? (
                    roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name === 'admin' ? t('role.admin') : role.name === 'seller' ? t('role.seller') : role.name === 'user' ? t('role.user') : role.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value={1}>{t('role.admin')}</option>
                      <option value={2}>{t('role.seller')}</option>
                      <option value={3}>{t('role.user')}</option>
                    </>
                  )}
                </select>
              </div>

              {/* Is Active */}
              <div className="flex items-center">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="w-5 h-5 text-pink-500 border-gray-300 rounded focus:ring-2 focus:ring-pink-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{t('users.activeAccount')}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Avatar Upload */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('users.avatar')}</h3>
            <div className="flex items-center space-x-4">
              {avatarPreview && (
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
                  <img src={avatarPreview} alt={t('users.avatarPreview')} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('users.uploadAvatar')}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <p className="text-xs text-gray-500 mt-1">{t('users.avatarHint')}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all shadow-sm"
            >
              {t('users.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
