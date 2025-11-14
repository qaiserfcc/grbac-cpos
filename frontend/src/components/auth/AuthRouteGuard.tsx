"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface AuthRouteGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Route guard that redirects authenticated users away from auth pages (login/register)
 * If user is authenticated, redirects to dashboard or specified redirectTo path
 */
export function AuthRouteGuard({ children, redirectTo = "/dashboard" }: AuthRouteGuardProps) {
  const { tokens, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && tokens) {
      // User is authenticated, redirect away from auth pages
      router.replace(redirectTo);
    }
  }, [tokens, isLoading, router, redirectTo]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="glass rounded-2xl border border-white/20 p-8 text-center backdrop-blur-md">
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, don't render children (will redirect)
  if (tokens) {
    return null;
  }

  // User is not authenticated, render the auth page
  return <>{children}</>;
}