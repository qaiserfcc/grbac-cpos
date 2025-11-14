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
    firstName: "Avery",
    lastName: "Ops",
    roles: [FALLBACK_ROLES[0]],
    permissions: ["product.create", "category.create", "rbac.manage.roles"],
  },
  {
    id: "usr-2",
    email: "product.admin@cpos.local",
    firstName: "Nico",
    lastName: "Merch",
    roles: [FALLBACK_ROLES[1]],
    permissions: ["product.read"],
  },
];

const fetchRoles = ([path, token]: [string, string]) => get<Role[]>(path, { accessToken: token });
const fetchUsers = ([path, token]: [string, string]) =>
  get<PaginatedResult<UserProfile>>(path, { accessToken: token });

function NoAccessMessage() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
      <LockKeyhole className="mx-auto mb-4 h-12 w-12 text-slate-300" />
      <p className="text-lg font-semibold text-slate-600">RBAC administration restricted</p>
      <p className="text-sm">Only Super Admins can manage identity and permissions.</p>
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
            <p className="text-sm text-slate-500">Enforce least privilege across the control plane.</p>
            <h2 className="text-2xl font-semibold text-slate-900">Role-based access control</h2>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                rolesQuery.mutate();
                usersQuery.mutate();
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh data
            </button>
          </div>
        </div>

        {(rolesQuery.isLoading || usersQuery.isLoading) && !rolesQuery.data && (
          <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500">
            Loading RBAC matrices…
          </div>
        )}

        {(rolesQuery.error || usersQuery.error) && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Live RBAC endpoints unavailable. Showing sample data.
          </div>
        )}

        <section>
          <h3 className="text-lg font-semibold text-slate-900">Roles</h3>
          <p className="text-sm text-slate-500">Each role maps to curated permissions and widgets.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <div key={role.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-500" />
                  <p className="text-base font-semibold text-slate-900">{role.name}</p>
                </div>
                <p className="mt-2 text-sm text-slate-500">{role.description}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Permissions</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {role.permissions.map((permission) => (
                    <span key={permission.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {permission.name}
                    </span>
                  ))}
                  {role.permissions.length === 0 && (
                    <span className="text-xs text-slate-400">No permissions mapped yet.</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">User assignments</h3>
              <p className="text-sm text-slate-500">Track which operators carry privileged access.</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              <Users2 className="h-4 w-4" /> Assign role
            </button>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Roles</th>
                  <th className="px-6 py-3">Direct permissions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{user.firstName ? `${user.firstName} ${user.lastName ?? ""}` : user.email}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {user.roles.map((role) => (
                          <span key={role.id} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                            {role.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {user.permissions.map((permission) => (
                          <span key={permission} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
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
