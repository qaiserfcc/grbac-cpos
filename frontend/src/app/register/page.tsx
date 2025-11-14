"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { registerSchema, type RegisterSchema } from "@/lib/validators";
import { get, post } from "@/lib/api";
import { AuthRouteGuard } from "@/components/auth/AuthRouteGuard";

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
}

function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const fetcher = async (url: string): Promise<Role[]> => {
    return get(url);
  };

  const { data: roles, error: rolesError } = useSWR<Role[]>(
    '/rbac/roles',
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
      await post("/auth/register", values);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  });

  if (rolesError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4">
        <div className="glass rounded-2xl border border-white/20 p-8 text-center backdrop-blur-md">
          <p className="text-white">Failed to load roles</p>
        </div>
      </div>
    );
  }

  if (!roles) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4">
        <div className="glass rounded-2xl border border-white/20 p-8 text-center backdrop-blur-md">
          <p className="text-white">Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4">
      <div className="glass w-full max-w-md rounded-2xl border border-white/20 p-8 backdrop-blur-md shadow-2xl">
        <h1 className="text-2xl font-semibold text-white">Register User</h1>
        <p className="mt-1 text-sm text-white/70">
          Create a new user account with roles.
        </p>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm font-medium text-white">
            Username
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50 backdrop-blur-sm focus:border-blue-400 focus:outline-none"
              placeholder="admin"
              {...register("username")}
            />
            {errors.username && (
              <span className="mt-1 block text-xs text-red-300">{errors.username.message}</span>
            )}
          </label>
          <label className="block text-sm font-medium text-white">
            Email
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50 backdrop-blur-sm focus:border-blue-400 focus:outline-none"
              placeholder="admin@cpos.local"
              {...register("email")}
            />
            {errors.email && (
              <span className="mt-1 block text-xs text-red-300">{errors.email.message}</span>
            )}
          </label>
          <label className="block text-sm font-medium text-white">
            Full Name
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50 backdrop-blur-sm focus:border-blue-400 focus:outline-none"
              placeholder="Admin User"
              {...register("fullName")}
            />
            {errors.fullName && (
              <span className="mt-1 block text-xs text-red-300">{errors.fullName.message}</span>
            )}
          </label>
          <label className="block text-sm font-medium text-white">
            Password
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50 backdrop-blur-sm focus:border-blue-400 focus:outline-none"
              placeholder="Passw0rd!"
              {...register("password")}
            />
            {errors.password && (
              <span className="mt-1 block text-xs text-red-300">{errors.password.message}</span>
            )}
          </label>
          <label className="block text-sm font-medium text-white">
            Roles
            <select
              multiple
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-sm focus:border-blue-400 focus:outline-none"
              value={selectedRoles}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, (option) => option.value);
                setValue("roles", values);
              }}
            >
              {roles.map((role) => (
                <option key={role.id} value={role.name} className="bg-slate-800 text-white">
                  {role.name} - {role.description}
                </option>
              ))}
            </select>
            {errors.roles && (
              <span className="mt-1 block text-xs text-red-300">{errors.roles.message}</span>
            )}
          </label>
          {error && (
            <div className="glass rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200 backdrop-blur-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Registering…" : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <AuthRouteGuard>
      <RegisterForm />
    </AuthRouteGuard>
  );
}