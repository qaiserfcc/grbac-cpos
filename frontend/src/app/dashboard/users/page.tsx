'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { HasPermission } from '@/components/rbac/HasPermission';
import { get, post, patch, request } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { UserProfile, Role } from '@/types/rbac';

// Removed demo fallbacks to avoid invalid IDs hitting backend during tests

const fetchUsers = ([path, token]: [string, string]) =>
  get<UserProfile[]>(path, { accessToken: token });
const fetchRoles = ([path, token]: [string, string]) => get<Role[]>(path, { accessToken: token });

export default function UsersPage() {
  const { tokens } = useAuth();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const { data: users, mutate: mutateUsers } = useSWR(
    tokens?.accessToken ? ['/users', tokens.accessToken] : null,
    fetchUsers,
  );

  const { data: roles } = useSWR(
    tokens?.accessToken ? ['/rbac/roles', tokens.accessToken] : null,
    fetchRoles,
  );

  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const handleCreateUser = async (formData: FormData) => {
    const fullName = String(formData.get('fullName') || '');
    const email = String(formData.get('email') || '');
    const username = String(formData.get('username') || '');
    try {
      await post('/users', { fullName, email, username }, { accessToken: tokens?.accessToken });
      await mutateUsers();
      setShowAddUserModal(false);
    } catch (err) {
      console.error('Failed to create user:', err);
    }
  };

  const handleAssignRole = async (userId: string, roleId: string) => {
    try {
      await post('/rbac/user-roles', { userId, roleId }, { accessToken: tokens?.accessToken });
      mutateUsers();
      setShowRoleModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to assign role:', error);
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    try {
      await request('/rbac/user-roles', {
        method: 'DELETE',
        body: JSON.stringify({ userId, roleId }),
        accessToken: tokens?.accessToken,
      });
      mutateUsers();
    } catch (error) {
      console.error('Failed to remove role:', error);
    }
  };

  const handleStatusChange = async (userId: string, isEnabled: boolean) => {
    try {
      await patch(`/users/${userId}/status`, { isEnabled }, { accessToken: tokens?.accessToken });
      mutateUsers();
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  };

  return (
    <HasPermission permission="rbac.manage.users">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <button
            data-testid="add-user-btn"
            onClick={() => setShowAddUserModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Add User
          </button>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users?.map((user) => (
                    <tr key={user.id} data-testid="user-row">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {user.roles?.map((role) => (
                            <span
                              key={role.id}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {role.name}
                              <button
                                onClick={() => handleRemoveRole(user.id, role.id)}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isEnabled
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.isEnabled ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            data-testid="assign-role-btn"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowRoleModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Assign Role
                          </button>
                          <button
                            onClick={() => handleStatusChange(user.id, !user.isEnabled)}
                            data-testid="status-toggle"
                            className={`${
                              user.isEnabled
                                ? 'text-red-600 hover:text-red-900'
                                : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {user.isEnabled ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Role Assignment Modal */}
        {showRoleModal && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Assign Role to {selectedUser.fullName}
                </h3>
                <div className="space-y-2">
                  {roles
                    ?.filter(
                      (role) => !selectedUser.roles?.some((userRole) => userRole.id === role.id),
                    )
                    .map((role) => (
                      <button
                        key={role.id}
                        onClick={() => handleAssignRole(selectedUser.id, role.id)}
                        className="w-full text-left px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        <div className="font-medium">{role.name}</div>
                        <div className="text-sm text-gray-500">{role.description}</div>
                      </button>
                    ))}
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => {
                      setShowRoleModal(false);
                      setSelectedUser(null);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {showAddUserModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New User</h3>
                <form
                  data-testid="add-user-modal"
                  action={async (fd) => {
                    await handleCreateUser(fd);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      placeholder="Full name"
                      className="mt-1 block w-full border rounded-md p-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      placeholder="email@domain.com"
                      className="mt-1 block w-full border rounded-md p-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                      Username
                    </label>
                    <input
                      id="username"
                      name="username"
                      placeholder="username"
                      className="mt-1 block w-full border rounded-md p-2"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddUserModal(false)}
                      className="px-4 py-2 bg-gray-300 rounded-md"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </HasPermission>
  );
}
