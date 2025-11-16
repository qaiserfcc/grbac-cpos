'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface HasRoleProps {
  role: string | string[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function HasRole({ role, fallback = null, children }: HasRoleProps) {
  const { hasRole } = useAuth();
  const roles = Array.isArray(role) ? role : [role];

  if (!roles.some((value) => hasRole(value))) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
