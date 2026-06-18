import React, { useEffect, useState } from 'react';
import type { RoleWithPermissions, UserPermission } from '../../domain/entities';
import { GetAllRolesWithPermissionsUseCase, GetUserPermissionsUseCase, UpdateUserPermissionsUseCase } from '../../usecases';
import { UserRepositoryImpl } from '../../data/repositories';
import { UserApi } from '../../data/api/userApi';
import { useAuth } from '../../../auth/hooks/useAuth';

/**
 * UserPermissionPageProps defines the properties for UserPermissionPage component
 */
export interface UserPermissionPageProps {
  userId: string;
  userName: string;
  onBack: () => void;
}

/**
 * UserPermissionPage displays and manages user permissions
 */
export const UserPermissionPage: React.FC<UserPermissionPageProps> = ({ 
  userId, 
  userName,
  onBack 
}) => {
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<number>>(new Set());
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const repository = new UserRepositoryImpl(new UserApi(), token);
        
        // Fetch all roles with permissions
        const rolesUseCase = new GetAllRolesWithPermissionsUseCase(repository);
        const rolesData = await rolesUseCase.execute();
        
        // Fetch user-specific permissions
        const permissionsUseCase = new GetUserPermissionsUseCase(repository);
        const permissionsData = await permissionsUseCase.execute(userId);
        
        setRoles(rolesData);
        setUserPermissions(permissionsData);
        // Initialize selected permissions
        setSelectedPermissionIds(new Set(permissionsData.map(p => p.id)));
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching permissions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, token]);

  const handleTogglePermission = (permissionId: number) => {
    if (!isEditMode) return;
    
    setSelectedPermissionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  };

  const handleSavePermissions = async () => {
    try {
      setSaving(true);
      setError(null);
      const repository = new UserRepositoryImpl(new UserApi(), token);
      const useCase = new UpdateUserPermissionsUseCase(repository);
      
      await useCase.execute(userId, Array.from(selectedPermissionIds));
      
      // Refresh permissions after save
      const permissionsUseCase = new GetUserPermissionsUseCase(repository);
      const permissionsData = await permissionsUseCase.execute(userId);
      setUserPermissions(permissionsData);
      setSelectedPermissionIds(new Set(permissionsData.map(p => p.id)));
      
      setIsEditMode(false);
    } catch (err) {
      setError(err as Error);
      console.error('Error saving permissions:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setSelectedPermissionIds(new Set(userPermissions.map(p => p.id)));
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 text-lg font-medium mb-2">Error loading permissions</div>
            <div className="text-gray-600">{error.message}</div>
            <button
              onClick={onBack}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasPermission = (permissionId: number): boolean => {
    return userPermissions.some(p => p.id === permissionId);
  };

  return (
    <div className="p-8">
      {/* Back Button */}
      <div className="mb-4">
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
          Back to User Details
        </button>
      </div>

      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Permissions</h1>
          <p className="text-gray-600 mt-1">
            Managing permissions for <span className="font-semibold">{userName}</span>
          </p>
        </div>
        <div className="flex gap-3">
          {!isEditMode ? (
            <button
              onClick={() => setIsEditMode(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Permissions
            </button>
          ) : (
            <>
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-sm disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Edit Mode Banner */}
      {isEditMode && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="font-medium text-blue-900">Edit Mode Active</p>
            <p className="text-sm text-blue-700">Click on permissions below to select or deselect them. {selectedPermissionIds.size} permission{selectedPermissionIds.size !== 1 ? 's' : ''} selected.</p>
          </div>
        </div>
      )}

      {/* User Permissions Summary */}
      <div className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isEditMode ? 'Selected Permissions' : 'Active Permissions'}
            </h2>
            <p className="text-gray-600 mt-1">
              {isEditMode 
                ? `${selectedPermissionIds.size} permission${selectedPermissionIds.size !== 1 ? 's' : ''} will be assigned to this user`
                : `This user has ${userPermissions.length} permission${userPermissions.length !== 1 ? 's' : ''} granted`
              }
            </p>
          </div>
          <div className="bg-white rounded-full px-6 py-3 shadow-sm border border-purple-200">
            <span className="text-3xl font-bold text-purple-600">
              {isEditMode ? selectedPermissionIds.size : userPermissions.length}
            </span>
          </div>
        </div>
      </div>

      {/* User-Specific Permissions */}
      {userPermissions.length > 0 && (
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">User-Specific Permissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {userPermissions.map((permission) => (
                <div
                  key={permission.id}
                  className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">
                      {permission.name}
                    </div>
                    {permission.description && (
                      <div className="text-xs text-gray-600 truncate">
                        {permission.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* All Roles and Their Permissions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">All Roles & Permissions</h2>
        <p className="text-gray-600 mb-6">
          View all available roles and their associated permissions in the system
        </p>
        
        <div className="space-y-6">
          {roles.map((role) => (
            <div
              key={role.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Role Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">{role.name}</h3>
                    <p className="text-purple-100 text-sm mt-1">
                      {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="bg-white/20 rounded-full px-4 py-2">
                    <span className="text-white font-bold text-lg">
                      {role.permissions.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Role Permissions */}
              {role.permissions.length > 0 ? (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {role.permissions.map((permission) => {
                      const isSelected = isEditMode ? selectedPermissionIds.has(permission.id) : hasPermission(permission.id);
                      return (
                        <button
                          key={permission.id}
                          onClick={() => handleTogglePermission(permission.id)}
                          disabled={!isEditMode}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                            isSelected
                              ? 'bg-green-50 border-green-200'
                              : 'bg-gray-50 border-gray-200'
                          } ${
                            isEditMode 
                              ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]' 
                              : 'cursor-default'
                          }`}
                        >
                          <div className="flex-shrink-0">
                            {isSelected ? (
                              <svg
                                className="w-5 h-5 text-green-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-5 h-5 text-gray-400"
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
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className={`font-medium text-sm truncate ${
                                isSelected ? 'text-gray-900' : 'text-gray-600'
                              }`}
                            >
                              {permission.name}
                            </div>
                            {permission.description && (
                              <div className="text-xs text-gray-500 truncate">
                                {permission.description}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  No permissions assigned to this role
                </div>
              )}
            </div>
          ))}
        </div>

        {roles.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Roles Found</h3>
            <p className="text-gray-600">There are no roles configured in the system</p>
          </div>
        )}
      </div>
    </div>
  );
};
