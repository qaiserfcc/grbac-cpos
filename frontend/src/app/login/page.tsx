'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginSchema, type LoginSchema } from '@/lib/validators';
import { useAuth } from '@/hooks/useAuth';
import { AuthRouteGuard } from '@/components/auth/AuthRouteGuard';

function LoginForm() {
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: 'admin@cpos.local', password: 'Passw0rd!' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values.identifier, values.password);
      router.push('/dashboard');
    } catch (err) {
      // Error is already shown in toast by AuthContext
      console.error('Login error:', err);
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass w-full max-w-md rounded-2xl p-8">
        <h1 className="gradient-text text-2xl font-semibold">CPOS Admin</h1>
        <p className="mt-1 text-sm text-slate-300">Sign in with your provisioned RBAC identity.</p>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm font-medium text-white">
            Email or Username
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/70 backdrop-blur-sm focus:border-white/40 focus:outline-none"
              placeholder="admin@cpos.local"
              {...register('identifier')}
            />
            {errors.identifier && (
              <span className="mt-1 block text-xs text-red-300">{errors.identifier.message}</span>
            )}
          </label>
          <label className="block text-sm font-medium text-white">
            Password
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/70 backdrop-blur-sm focus:border-white/40 focus:outline-none"
              placeholder="Passw0rd!"
              {...register('password')}
            />
            {errors.password && (
              <span className="mt-1 block text-xs text-red-300">{errors.password.message}</span>
            )}
          </label>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white transition hover:from-purple-600 hover:to-pink-600 disabled:cursor-not-allowed disabled:from-purple-300 disabled:to-pink-300 animate-gradient"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting || isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-white/70">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-white hover:text-white/80 underline">
            Register here
          </Link>
        </p>
        <div className="mt-6 space-y-2">
          <p className="text-center text-xs text-white/50">Quick login for demo users:</p>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => {
                setValue('identifier', 'admin@cpos.local');
                setValue('password', 'Passw0rd!');
              }}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('identifier', 'product@cpos.local');
                setValue('password', 'Passw0rd!');
              }}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Product Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('identifier', 'category@cpos.local');
                setValue('password', 'Passw0rd!');
              }}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Category Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthRouteGuard>
      <LoginForm />
    </AuthRouteGuard>
  );
}
