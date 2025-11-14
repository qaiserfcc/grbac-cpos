"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { registerSchema, type RegisterSchema } from "@/lib/validators";
import { get, post } from "@/lib/api";

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
}

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const fetcher = async (url: string): Promise<Role[]> => {
    return get(url);
  };

  const { data: roles, error: rolesError } = useSWR<Role[]>(
    '/api/rbac/roles',
    fetcher
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "", fullName: "", roles: [] },
  });

  const selectedRoles = watch("roles");

  const onSubmit = handleSubmit(async (values) => {
    try {
      setError(null);
      await post("/api/auth/register", values);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  });

  if (rolesError) {
    return <div className="p-4">Failed to load roles</div>;
  }

  if (!roles) {
    return <div className="p-4">Loading roles...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-slate-900">Register User</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create a new user account with roles.
        </p>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Username
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none"
              placeholder="admin"
              {...register("username")}
            />
            {errors.username && (
              <span className="mt-1 block text-xs text-red-500">{errors.username.message}</span>
            )}
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none"
              placeholder="admin@cpos.local"
              {...register("email")}
            />
            {errors.email && (
              <span className="mt-1 block text-xs text-red-500">{errors.email.message}</span>
            )}
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Full Name
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none"
              placeholder="Admin User"
              {...register("fullName")}
            />
            {errors.fullName && (
              <span className="mt-1 block text-xs text-red-500">{errors.fullName.message}</span>
            )}
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none"
              placeholder="Passw0rd!"
              {...register("password")}
            />
            {errors.password && (
              <span className="mt-1 block text-xs text-red-500">{errors.password.message}</span>
            )}
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Roles
            <select
              multiple
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none"
              value={selectedRoles}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, (option) => option.value);
                setValue("roles", values);
              }}
            >
              {roles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.name} - {role.description}
                </option>
              ))}
            </select>
            {errors.roles && (
              <span className="mt-1 block text-xs text-red-500">{errors.roles.message}</span>
            )}
          </label>
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
          )}
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Registering…" : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}