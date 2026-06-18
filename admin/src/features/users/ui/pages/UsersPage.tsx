import React, { useState, useEffect } from 'react';
import { useUsers } from '../../hooks';
import { 
  UserTable, 
  CustomSelect, 
  Pagination, 
  CreateUserModal,
  type CreateUserFormData 
} from '../components';
import { useI18n } from '../../../../shared/i18n/I18nContext';

/**
 * UsersPageProps defines the properties for UsersPage component
 */
export interface UsersPageProps {
  onUserClick?: (userId: string) => void;
}

/**
 * UsersPage displays the user management interface
 */
export const UsersPage: React.FC<UsersPageProps> = ({ onUserClick }) => {
  const { t } = useI18n();
  const { users, total, loading, error, setFilters, roles, createUser } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const itemsPerPage = 10;

  const getRoleLabel = (role: string) => {
    if (role === 'admin') return t('role.admin');
    if (role === 'seller') return t('role.seller');
    if (role === 'user') return t('role.user');
    return role;
  };

  // Build role options dynamically from API
  const roleOptions = [
    { value: 'all', label: t('users.allRoles') },
    ...roles.map(role => ({
      value: String(role.id),
      label: getRoleLabel(role.name),
    })),
  ];

  const statusOptions = [
    { value: 'all', label: t('users.allStatus') },
    { value: 'active', label: t('status.active') },
    { value: 'inactive', label: t('status.inactive') },
    { value: 'banned', label: t('status.banned') },
  ];

  // Apply filters automatically when search term or filters change
  useEffect(() => {
    setFilters({
      search: searchTerm,
      role: selectedRole !== 'all' ? selectedRole : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      page: currentPage,
      limit: itemsPerPage,
    });
  }, [searchTerm, selectedRole, selectedStatus, currentPage, setFilters]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole, selectedStatus]);

  const totalPages = Math.ceil(total / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateUser = async (userData: CreateUserFormData) => {
    try {
      await createUser(userData);
      setIsCreateModalOpen(false);
      // Show success message (optional)
      console.log('User created successfully');
    } catch (err) {
      console.error('Failed to create user:', err);
      // You can show an error notification here
      alert(`${t('users.createError')}: ${err instanceof Error ? err.message : t('users.unknownError')}`);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-500">{t('users.loading')}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-red-500">Error: {error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('users.title')}</h1>
          <p className="text-gray-600">{t('users.subtitle')}</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all shadow-sm"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          {t('users.create')}
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder={t('users.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="lg:w-48">
            <CustomSelect
              value={selectedRole}
              onChange={setSelectedRole}
              options={roleOptions}
              placeholder={t('users.selectRole')}
            />
          </div>

          {/* Status Filter */}
          <div className="lg:w-48">
            <CustomSelect
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={statusOptions}
              placeholder={t('users.selectStatus')}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('users.totalUsers')}</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('users.activeUsers')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u) => u.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <UserTable users={users} onUserClick={onUserClick} />
        
        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateUser}
        roles={roles}
      />
    </div>
  );
};
