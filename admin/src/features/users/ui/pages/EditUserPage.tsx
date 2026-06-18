import React, { useEffect, useState } from 'react';
import type { User } from '../../domain/entities';
import { 
  GetUserByIdUseCase, 
  UpdateUserUseCase,
  CreateUserAddressUseCase,
  UpdateUserAddressUseCase,
  DeleteUserAddressUseCase,
  GetPageInfoUseCase
} from '../../usecases';
import { UserRepositoryImpl } from '../../data/repositories';
import { UserApi } from '../../data/api/userApi';
import { useAuth } from '../../../auth/hooks/useAuth';

/**
 * EditUserPageProps defines the properties for EditUserPage component
 */
export interface EditUserPageProps {
  userId: string;
  onBack: () => void;
  onSuccess?: () => void;
}

interface Address {
  id: string;
  label?: string;
  recipient?: string;
  phone?: string;
  province?: string;
  district?: string;
  ward?: string;
  street?: string;
  is_default?: boolean;
}

/**
 * EditUserPage allows editing user information and managing addresses
 */
export const EditUserPage: React.FC<EditUserPageProps> = ({ userId, onBack, onSuccess }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [roles, setRoles] = useState<Array<{ id: number; name: string }>>([]);
  const { token } = useAuth();

  // User form fields
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [story, setStory] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  // Address management
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: '',
    receiver_name: '',
    phone: '',
    province: '',
    district: '',
    ward: '',
    street: '',
    is_default: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const repository = new UserRepositoryImpl(new UserApi(), token);
        
        // Fetch user data
        const getUserUseCase = new GetUserByIdUseCase(repository);
        const userData = await getUserUseCase.execute(userId);
        setUser(userData);
        
        // Populate form fields
        setEmail(userData.email);
        setFullName(userData.name);
        setPhone(userData.phone || '');
        setStory(userData.bio || '');
        setIsActive(userData.status === 'active');
        setAvatarPreview(userData.avatar || '');
        
        // Set addresses
        if (userData.addresses) {
          setAddresses(userData.addresses.map(a => ({
            id: a.id,
            label: a.label,
            recipient: a.recipient,
            phone: a.phone,
            province: a.province,
            district: a.district,
            ward: a.ward,
            street: a.street,
            is_default: a.is_default,
          })));
        }

        // Fetch roles
        const getPageInfoUseCase = new GetPageInfoUseCase(repository);
        const pageInfo = await getPageInfoUseCase.execute();
        setRoles(pageInfo.roles);
        
        // Set role ID based on user role
        const userRoleObj = pageInfo.roles.find(r => r.name.toLowerCase() === userData.role.toLowerCase());
        if (userRoleObj) {
          setRoleId(userRoleObj.id);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, token]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveUser = async () => {
    try {
      setSaving(true);
      const repository = new UserRepositoryImpl(new UserApi(), token);
      const updateUserUseCase = new UpdateUserUseCase(repository);
      
      const updateData: any = {};
      if (avatar) updateData.avatar = avatar;
      if (email !== user?.email) updateData.email = email;
      if (fullName !== user?.name) updateData.full_name = fullName;
      if (phone !== (user?.phone || '')) updateData.phone = phone;
      if (story !== (user?.bio || '')) updateData.story = story;
      if (isActive !== (user?.status === 'active')) updateData.is_active = isActive;
      if (roleId !== null) updateData.role_id = roleId;
      if (password) updateData.password = password;

      await updateUserUseCase.execute(userId, updateData);
      
      if (onSuccess) {
        onSuccess();
      } else {
        onBack();
      }
    } catch (err) {
      setError(err as Error);
      alert(`Failed to update user: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      label: '',
      receiver_name: '',
      phone: '',
      province: '',
      district: '',
      ward: '',
      street: '',
      is_default: false,
    });
    setShowAddressForm(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddressId(address.id);
    setAddressForm({
      label: address.label || '',
      receiver_name: address.recipient || '',
      phone: address.phone || '',
      province: address.province || '',
      district: address.district || '',
      ward: address.ward || '',
      street: address.street || '',
      is_default: address.is_default || false,
    });
    setShowAddressForm(true);
  };

  const handleSaveAddress = async () => {
    try {
      const repository = new UserRepositoryImpl(new UserApi(), token);
      
      if (editingAddressId) {
        // Update existing address
        const updateAddressUseCase = new UpdateUserAddressUseCase(repository);
        await updateAddressUseCase.execute(userId, editingAddressId, addressForm);
      } else {
        // Create new address
        const createAddressUseCase = new CreateUserAddressUseCase(repository);
        await createAddressUseCase.execute(userId, addressForm);
      }
      
      // Refresh user data
      const getUserUseCase = new GetUserByIdUseCase(repository);
      const userData = await getUserUseCase.execute(userId);
      if (userData.addresses) {
        setAddresses(userData.addresses.map(a => ({
          id: a.id,
          label: a.label,
          recipient: a.recipient,
          phone: a.phone,
          province: a.province,
          district: a.district,
          ward: a.ward,
          street: a.street,
          is_default: a.is_default,
        })));
      }
      
      setShowAddressForm(false);
      setEditingAddressId(null);
    } catch (err) {
      alert(`Failed to save address: ${(err as Error).message}`);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    
    try {
      const repository = new UserRepositoryImpl(new UserApi(), token);
      const deleteAddressUseCase = new DeleteUserAddressUseCase(repository);
      await deleteAddressUseCase.execute(userId, addressId);
      
      // Remove from local state
      setAddresses(addresses.filter(a => a.id !== addressId));
    } catch (err) {
      alert(`Failed to delete address: ${(err as Error).message}`);
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
          Back
        </button>
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
        <p className="text-gray-600 mt-1">Update user information and manage addresses</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Profile */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h2>
            
            {/* Avatar Preview */}
            <div className="flex flex-col items-center mb-4">
              <div className="w-32 h-32 mb-4">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-5xl">
                      {fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                Change Avatar
              </label>
            </div>
          </div>
        </div>

        {/* Right Column - User Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio / Story
                </label>
                <textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={roleId || ''}
                  onChange={(e) => setRoleId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password (leave empty to keep current)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                  Active Account
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSaveUser}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={onBack}
                className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Address Management */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Addresses</h2>
              <button
                onClick={handleAddAddress}
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
              >
                + Add Address
              </button>
            </div>

            {/* Address List */}
            <div className="space-y-3">
              {addresses.map((address) => (
                <div key={address.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {address.label || address.recipient || 'Address'}
                        </span>
                        {address.is_default && (
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        {[address.street, address.ward, address.district, address.province]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      {(address.recipient || address.phone) && (
                        <p className="text-xs text-gray-500 mt-1">
                          {[address.recipient, address.phone].filter(Boolean).join(' • ')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditAddress(address)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(address.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {addresses.length === 0 && (
                <p className="text-gray-500 text-center py-4">No addresses added yet</p>
              )}
            </div>

            {/* Address Form Modal */}
            {showAddressForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {editingAddressId ? 'Edit Address' : 'Add New Address'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Label
                      </label>
                      <input
                        type="text"
                        value={addressForm.label}
                        onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Home, Office"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Receiver Name
                      </label>
                      <input
                        type="text"
                        value={addressForm.receiver_name}
                        onChange={(e) => setAddressForm({ ...addressForm, receiver_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street
                      </label>
                      <input
                        type="text"
                        value={addressForm.street}
                        onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ward
                      </label>
                      <input
                        type="text"
                        value={addressForm.ward}
                        onChange={(e) => setAddressForm({ ...addressForm, ward: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        District
                      </label>
                      <input
                        type="text"
                        value={addressForm.district}
                        onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Province
                      </label>
                      <input
                        type="text"
                        value={addressForm.province}
                        onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={addressForm.is_default}
                        onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="isDefault" className="ml-2 text-sm font-medium text-gray-700">
                        Set as default address
                      </label>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={handleSaveAddress}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Save Address
                    </button>
                    <button
                      onClick={() => {
                        setShowAddressForm(false);
                        setEditingAddressId(null);
                      }}
                      className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
