import React, { useEffect, useState } from 'react';
import type { User } from '../../domain/entities';
import { GetUserByIdUseCase } from '../../usecases';
import { UserRepositoryImpl } from '../../data/repositories';
import { UserApi } from '../../data/api/userApi';
import { useAuth } from '../../../auth/hooks/useAuth';
import { OrderListModal } from '../components';

/**
 * UserDetailPageProps defines the properties for UserDetailPage component
 */
export interface UserDetailPageProps {
  userId: string;
  onBack: () => void;
  onManagePermissions?: () => void;
  onEdit?: () => void;
}

/**
 * UserDetailPage displays detailed information about a user
 */
export const UserDetailPage: React.FC<UserDetailPageProps> = ({ userId, onBack, onManagePermissions, onEdit }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const repository = new UserRepositoryImpl(new UserApi(), token);
        const useCase = new GetUserByIdUseCase(repository);
        const userData = await useCase.execute(userId);
        setUser(userData);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleDeleteUser = async () => {
    if (!confirm(`Are you sure you want to delete user "${user?.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      const repository = new UserRepositoryImpl(new UserApi(), token);
      await repository.deleteUser(userId);
      alert('User deleted successfully');
      onBack();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(`Failed to delete user: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-500">Loading user details...</div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-red-500">Error: {error?.message || 'User not found'}</div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'banned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'seller':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <div className="p-8">
      {/* Back Button and Edit Button */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Users
        </button>
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit User
          </button>
        )}
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
        <p className="text-gray-600 mt-1">View and manage user information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Profile */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            {/* Avatar */}
              <div className="flex flex-col items-center">
              <div className="w-32 h-32 mb-4">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-5xl">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 text-center">{user.name}</h2>
              <p className="text-gray-500 text-center mt-1">{user.email}</p>
              
              {/* Status and Role */}
              <div className="flex gap-2 mt-4">
                <span
                  className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getRoleBadge(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>
                <span
                  className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    user.status
                  )}`}
                >
                  {user.status}
                </span>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Email</label>
                <p className="text-sm text-gray-900 mt-1">{user.email}</p>
              </div>
              {user.phone && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Phone</label>
                  <p className="text-sm text-gray-900 mt-1">{user.phone}</p>
                </div>
              )}
              {user.addresses && user.addresses.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Addresses</label>
                  <div className="mt-2 space-y-3">
                    {user.addresses.map((a) => (
                      <div key={a.id} className="p-3 bg-gray-50 rounded">
                        <div className="text-sm font-medium text-gray-900">{a.label || a.recipient || 'Address'}</div>
                        <div className="text-sm text-gray-700 mt-1">{a.full_address || [a.street, a.ward, a.district, a.province].filter(Boolean).join(', ')}</div>
                        {(a.recipient || a.phone) && (
                          <div className="text-xs text-gray-500 mt-1">{[a.recipient, a.phone].filter(Boolean).join(' • ')}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Details and Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setIsOrderModalOpen(true)}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
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
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-gray-900">{user.totalOrders || 0}</p>
                    <svg
                      className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                  <p className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                    Click to view details
                  </p>
                </div>
              </div>
            </button>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
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
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Spent</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(user.totalSpent || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="text-sm font-bold text-gray-900">
                    {new Date(user.joinedDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">User ID</label>
                <p className="text-sm text-gray-900 mt-1 font-mono">{user.id}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">
                  Account Status
                </label>
                <p className="text-sm text-gray-900 mt-1 capitalize">{user.status}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Role</label>
                <p className="text-sm text-gray-900 mt-1 capitalize">{user.role}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Joined Date</label>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(user.joinedDate).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {user.lastLogin && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Last Login</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(user.lastLogin).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bio/Description */}
          {user.bio && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">About</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{user.bio}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            {onManagePermissions && (
              <button 
                onClick={onManagePermissions}
                className="flex-1 min-w-[200px] px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-sm flex items-center justify-center gap-2"
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Manage Permissions
              </button>
            )}
            <button 
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="px-6 py-3 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                'Delete User'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Order List Modal */}
      <OrderListModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        userId={userId}
        userName={user.name}
      />
    </div>
  );
};
