"use client";

import useSWR from "swr";
import { ShieldCheck, Users2, RefreshCcw, LockKeyhole } from "lucide-react";
import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { get } from "@/lib/api";
import type { PaginatedResult, Role, UserProfile } from "@/types/rbac";
import { HasRole } from "@/components/rbac/HasRole";

const FALLBACK_ROLES: Role[] = [
  {
    id: "role-1",
    name: "Super Admin",
    description: "Global access, RBAC + catalog",
    permissions: [
      { id: "perm-1", name: "product.create" },
      { id: "perm-2", name: "category.create" },
      { id: "perm-3", name: "rbac.manage.roles" },
    ],
  },
  {
    id: "role-2",
    name: "Product Admin",
    description: "Owns product catalog",
    permissions: [{ id: "perm-4", name: "product.read" }],
  },
  {
    id: "role-3",
    name: "Category Admin",
    description: "Category assortment",
    permissions: [{ id: "perm-5", name: "category.read" }],
  },
];

const FALLBACK_USERS: UserProfile[] = [
  {
    id: "usr-1",
    email: "admin@cpos.local",
    fullName: "Avery Ops",
    roles: [FALLBACK_ROLES[0]],
    permissions: ["product.create", "category.create", "rbac.manage.roles"],
  },
  {
    id: "usr-2",
    email: "product.admin@cpos.local",
    fullName: "Nico Merch",
    roles: [FALLBACK_ROLES[1]],
    permissions: ["product.read"],
  },
];

const fetchRoles = ([path, token]: [string, string]) => get<Role[]>(path, { accessToken: token });
const fetchUsers = ([path, token]: [string, string]) =>
  get<PaginatedResult<UserProfile>>(path, { accessToken: token });

function NoAccessMessage() {
  return (
    <div className="glass rounded-2xl border border-white/20 p-10 text-center backdrop-blur-md">
      <LockKeyhole className="mx-auto mb-4 h-12 w-12 text-white/40" />
      <p className="text-lg font-semibold text-white">RBAC administration restricted</p>
      <p className="text-sm text-white/70">Only Super Admins can manage identity and permissions.</p>
    </div>
  );
}

export default function RbacPage() {
  const { tokens } = useAuth();
  const rolesQuery = useSWR(tokens?.accessToken ? ["/api/rbac/roles", tokens.accessToken] : null, fetchRoles, {
    revalidateOnFocus: false,
  });
  const usersQuery = useSWR(
    tokens?.accessToken ? ["/api/rbac/user-roles", tokens.accessToken] : null,
    fetchUsers,
    { revalidateOnFocus: false }
  );

  const roles = useMemo(() => rolesQuery.data ?? FALLBACK_ROLES, [rolesQuery.data]);
  const users = useMemo(() => usersQuery.data?.data ?? FALLBACK_USERS, [usersQuery.data]);

  return (
    <HasRole role="Super Admin" fallback={<NoAccessMessage />}>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-white/70">Enforce least privilege across the control plane.</p>
            <h2 className="text-2xl font-semibold text-white">Role-based access control</h2>
          </div>
          <div className="flex gap-3">
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
          <p className="text-sm text-white/70">Each role maps to curated permissions and widgets.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <div key={role.id} className="glass rounded-2xl border border-white/20 p-5 backdrop-blur-md shadow-lg">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-400" />
                  <p className="text-base font-semibold text-white">{role.name}</p>
                </div>
                <p className="mt-2 text-sm text-white/70">{role.description}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-white/60">Permissions</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {role.permissions.map((permission) => (
                    <span key={permission.id} className="rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-3 py-1 text-xs font-semibold text-white border border-white/20">
                      {permission.name}
                    </span>
                  ))}
                  {role.permissions.length === 0 && (
                    <span className="text-xs text-white/50">No permissions mapped yet.</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">User assignments</h3>
              <p className="text-sm text-white/70">Track which operators carry privileged access.</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
            >
              <Users2 className="h-4 w-4" /> Assign role
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
                        {user.roles.map((role) => (
                          <span key={role.id} className="rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-3 py-1 text-xs font-semibold text-emerald-200 border border-emerald-400/20">
                            {role.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {user.permissions.map((permission) => (
                          <span key={permission} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white border border-white/20">
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
    </HasRole>
  );
}
