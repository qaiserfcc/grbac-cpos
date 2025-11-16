'use client';

import useSWR from 'swr';
import { ShieldCheck, RefreshCcw, LockKeyhole, Plus, Edit, Trash2, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { get, post, patch, del } from '@/lib/api';
import type {
  Role,
  UserProfile,
  Permission,
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignRoleRequest,
} from '@/types/rbac';
import { HasRole } from '@/components/rbac/HasRole';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const FALLBACK_ROLES: Role[] = [
  {
    id: 'role-1',
    name: 'Super Admin',
    description: 'Global access, RBAC + catalog',
    permissions: [
      { id: 'perm-1', name: 'product.create' },
      { id: 'perm-2', name: 'category.create' },
      { id: 'perm-3', name: 'rbac.manage.roles' },
    ],
  },
  {
    id: 'role-2',
    name: 'Product Admin',
    description: 'Owns product catalog',
    permissions: [{ id: 'perm-4', name: 'product.read' }],
  },
  {
    id: 'role-3',
    name: 'Category Admin',
    description: 'Category assortment',
    permissions: [{ id: 'perm-5', name: 'category.read' }],
  },
];

const FALLBACK_USERS: UserProfile[] = [
  {
    id: 'usr-1',
    email: 'admin@cpos.local',
    fullName: 'Avery Ops',
    roles: [FALLBACK_ROLES[0]],
    permissions: ['product.create', 'category.create', 'rbac.manage.roles'],
  },
  {
    id: 'usr-2',
    email: 'product.admin@cpos.local',
    fullName: 'Nico Merch',
    roles: [FALLBACK_ROLES[1]],
    permissions: ['product.read'],
  },
];

const fetchRoles = ([path, token]: [string, string]) => get<Role[]>(path, { accessToken: token });
const fetchUsers = ([path, token]: [string, string]) =>
  get<UserProfile[]>(path, { accessToken: token });
const fetchPermissions = ([path, token]: [string, string]) =>
  get<Permission[]>(path, { accessToken: token });

function NoAccessMessage() {
  return (
    <div className="glass rounded-2xl border border-white/20 p-10 text-center backdrop-blur-md">
      <LockKeyhole className="mx-auto mb-4 h-12 w-12 text-white/40" />
      <p className="text-lg font-semibold text-white">RBAC administration restricted</p>
      <p className="text-sm text-white/70">
        Only Super Admins can manage identity and permissions.
      </p>
    </div>
  );
}

export default function RbacPage() {
  const { tokens } = useAuth();
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const rolesQuery = useSWR(
    tokens?.accessToken ? ['/rbac/roles', tokens.accessToken] : null,
    fetchRoles,
    {
      revalidateOnFocus: false,
    },
  );
  const usersQuery = useSWR(
    tokens?.accessToken ? ['/users', tokens.accessToken] : null,
    fetchUsers,
    { revalidateOnFocus: false },
  );
  const permissionsQuery = useSWR(
    tokens?.accessToken ? ['/rbac/permissions', tokens.accessToken] : null,
    fetchPermissions,
    { revalidateOnFocus: false },
  );

  const roles = useMemo(() => rolesQuery.data ?? FALLBACK_ROLES, [rolesQuery.data]);
  const users = useMemo(() => usersQuery.data ?? FALLBACK_USERS, [usersQuery.data]);
  const permissions = useMemo(() => permissionsQuery.data ?? [], [permissionsQuery.data]);

  const handleCreateRole = async (formData: FormData) => {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    try {
      await post<Role, CreateRoleRequest>('/rbac/roles', {
        name,
        description,
      });
      rolesQuery.mutate();
      setShowCreateRoleModal(false);
    } catch (error) {
      console.error('Failed to create role:', error);
    }
  };

  const handleUpdateRole = async (formData: FormData) => {
    if (!editingRole) return;

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    try {
      await patch<Role, UpdateRoleRequest>(`/rbac/roles/${editingRole.id}`, {
        name,
        description,
      });
      rolesQuery.mutate();
      setShowEditRoleModal(false);
      setEditingRole(null);
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      await del(`/rbac/roles/${roleToDelete.id}`);
      rolesQuery.mutate();
      usersQuery.mutate();
      setShowDeleteConfirm(false);
      setRoleToDelete(null);
    } catch (error) {
      console.error('Failed to delete role:', error);
    }
  };

  const handleAssignRole = async (formData: FormData) => {
    const userId = formData.get('userId') as string;
    const roleId = formData.get('roleId') as string;

    try {
      await post<{ message: string }, AssignRoleRequest>('/rbac/user-roles', {
        userId,
        roleId,
      });
      usersQuery.mutate();
      setShowAssignRoleModal(false);
    } catch (error) {
      console.error('Failed to assign role:', error);
    }
  };

  return (
    <HasRole role="Super Admin" fallback={<NoAccessMessage />}>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-white/70">
              Enforce least privilege across the control plane.
            </p>
            <h2 className="text-2xl font-semibold text-white">Role-based access control</h2>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowCreateRoleModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
            >
              <Plus className="h-4 w-4" /> Create role
            </button>
            <button
              type="button"
              onClick={() => {
                rolesQuery.mutate();
                usersQuery.mutate();
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh data
            </button>
          </div>
        </div>

        {(rolesQuery.isLoading || usersQuery.isLoading) && !rolesQuery.data && (
          <div className="glass rounded-2xl border border-white/20 p-4 text-sm text-white/70 backdrop-blur-md">
            Loading RBAC matrices…
          </div>
        )}

        {(rolesQuery.error || usersQuery.error) && (
          <div className="glass rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 backdrop-blur-md">
            Live RBAC endpoints unavailable. Showing sample data.
          </div>
        )}

        <section>
          <h3 className="text-lg font-semibold text-white">Roles</h3>
          <p className="text-sm text-white/70">
            Each role maps to curated permissions and widgets.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <div
                key={role.id}
                className="glass rounded-2xl border border-white/20 p-5 backdrop-blur-md shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-400" />
                  <p className="text-base font-semibold text-white">{role.name}</p>
                </div>
                <p className="mt-2 text-sm text-white/70">{role.description}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-white/60">
                  Permissions
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {role.permissions?.map((permission) => (
                    <span
                      key={permission.id}
                      className="rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-3 py-1 text-xs font-semibold text-white border border-white/20"
                    >
                      {permission.name}
                    </span>
                  ))}
                  {(!role.permissions || role.permissions.length === 0) && (
                    <span className="text-xs text-white/50">No permissions mapped yet.</span>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRole(role);
                      setShowEditRoleModal(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
                  >
                    <Edit className="h-3 w-3" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRoleToDelete(role);
                      setShowDeleteConfirm(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-400/20 bg-red-500/10 px-2 py-1 text-xs font-medium text-red-200 backdrop-blur-sm transition hover:bg-red-500/20"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">User assignments</h3>
              <p className="text-sm text-white/70">
                Track which operators carry privileged access.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAssignRoleModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
            >
              <UserPlus className="h-4 w-4" /> Assign role
            </button>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md shadow-lg">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-white/10 text-xs font-semibold uppercase tracking-wide text-white/80">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Roles</th>
                  <th className="px-6 py-3">Direct permissions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-white">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{user.fullName ?? user.email}</p>
                      <p className="text-xs text-white/70">{user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {user.roles?.map((role) => (
                          <span
                            key={role.id}
                            className="rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-3 py-1 text-xs font-semibold text-emerald-200 border border-emerald-400/20"
                          >
                            {role.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {user.permissions?.map((permission) => (
                          <span
                            key={permission}
                            className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white border border-white/20"
                          >
                            {permission}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Create Role Modal */}
      <Modal
        isOpen={showCreateRoleModal}
        onClose={() => setShowCreateRoleModal(false)}
        title="Create New Role"
      >
        <form action={handleCreateRole} className="space-y-4">
          <div>
            <label htmlFor="roleName" className="block text-sm font-medium text-white">
              Role Name
            </label>
            <input
              type="text"
              id="roleName"
              name="name"
              className="mt-1 block w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50 backdrop-blur-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Enter role name"
            />
          </div>
          <div>
            <label htmlFor="roleDescription" className="block text-sm font-medium text-white">
              Description
            </label>
            <textarea
              id="roleDescription"
              name="description"
              rows={3}
              className="mt-1 block w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50 backdrop-blur-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Describe the role's purpose"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Permissions</label>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {permissions.map((permission) => (
                <label key={permission.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-white/20 bg-white/10 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-white/70">{permission.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowCreateRoleModal(false)}
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:shadow-xl"
            >
              Create Role
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={showEditRoleModal}
        onClose={() => {
          setShowEditRoleModal(false);
          setEditingRole(null);
        }}
        title="Edit Role"
      >
        <form action={handleUpdateRole} className="space-y-4">
          <div>
            <label htmlFor="editRoleName" className="block text-sm font-medium text-white">
              Role Name
            </label>
            <input
              type="text"
              id="editRoleName"
              name="name"
              defaultValue={editingRole?.name}
              className="mt-1 block w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50 backdrop-blur-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Enter role name"
            />
          </div>
          <div>
            <label htmlFor="editRoleDescription" className="block text-sm font-medium text-white">
              Description
            </label>
            <textarea
              id="editRoleDescription"
              name="description"
              rows={3}
              defaultValue={editingRole?.description}
              className="mt-1 block w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50 backdrop-blur-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Describe the role's purpose"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Permissions</label>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {permissions.map((permission) => (
                <label key={permission.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    defaultChecked={editingRole?.permissions?.some((p) => p.id === permission.id)}
                    className="rounded border-white/20 bg-white/10 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-white/70">{permission.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowEditRoleModal(false);
                setEditingRole(null);
              }}
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:shadow-xl"
            >
              Update Role
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setRoleToDelete(null);
        }}
        onConfirm={handleDeleteRole}
        title="Delete Role"
        description={`Are you sure you want to delete the role "${roleToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Role"
        cancelLabel="Cancel"
      />

      {/* Assign Role Modal */}
      <Modal
        isOpen={showAssignRoleModal}
        onClose={() => {
          setShowAssignRoleModal(false);
        }}
        title="Assign Role to User"
      >
        <form action={handleAssignRole} className="space-y-4">
          <div>
            <label htmlFor="selectUser" className="block text-sm font-medium text-white">
              Select User
            </label>
            <select
              id="selectUser"
              name="userId"
              className="mt-1 block w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Choose a user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName ?? user.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="selectRole" className="block text-sm font-medium text-white">
              Select Role
            </label>
            <select
              id="selectRole"
              name="roleId"
              className="mt-1 block w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Choose a role...</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowAssignRoleModal(false);
              }}
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:shadow-xl"
            >
              Assign Role
            </button>
          </div>
        </form>
      </Modal>
    </HasRole>
  );
}
