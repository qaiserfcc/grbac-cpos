"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ElementType, type ReactNode } from "react";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShieldEllipsis,
  LogOut,
  BarChart3,
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/hooks/useAuth";
import type { PermissionName } from "@/types/rbac";

interface NavItem {
  label: string;
  href: string;
  icon: ElementType<{ className?: string }>;
  permission?: PermissionName | string;
  role?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/dashboard/products", icon: Package, permission: "product.read" },
  { label: "Categories", href: "/dashboard/categories", icon: Boxes, permission: "category.read" },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, permission: "dashboard.view.kpis" },
  { label: "RBAC Admin", href: "/dashboard/rbac", icon: ShieldEllipsis, role: "Super Admin" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { tokens, user, hasPermission, hasRole, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!tokens) {
      router.replace("/login");
    }
  }, [tokens, router]);

  const filteredNav = useMemo(() => {
    return NAV_ITEMS.filter((item) => {
      if (item.permission && !hasPermission(item.permission)) return false;
      if (item.role && !hasRole(item.role)) return false;
      return true;
    });
  }, [hasPermission, hasRole]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!tokens) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        Redirecting to login…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-slate-900/95 p-6 text-white md:flex">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-400">CPOS</p>
          <h2 className="text-2xl font-semibold">Control</h2>
        </div>
        <nav className="mt-8 space-y-1">
          {filteredNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                pathname === item.href
                  ? "bg-white/10 text-white"
                  : "text-slate-200 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-xl bg-white/5 p-4">
          <p className="text-xs text-slate-300">Signed in as</p>
          <p className="text-sm font-semibold text-white">
            {user?.firstName ? `${user.firstName} ${user?.lastName ?? ""}` : user?.email}
          </p>
          <p className="text-xs text-slate-400">{user?.roles.map((r) => r.name).join(", ")}</p>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Dashboard</p>
            <h1 className="text-lg font-semibold text-slate-900">Granular RBAC Overview</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline-flex">
              {user?.email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              disabled={isLoggingOut}
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
