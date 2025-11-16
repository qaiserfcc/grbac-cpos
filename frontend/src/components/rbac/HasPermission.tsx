'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { PermissionName } from '@/types/rbac';

interface HasPermissionProps {
  permission: PermissionName | string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function HasPermission({ permission, fallback = null, children }: HasPermissionProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
