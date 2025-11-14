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
import { useToast } from "@/context/ToastContext";
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
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!tokens) {
      toast.error("Please log in to access the dashboard");
      router.replace("/login");
    }
  }, [tokens, router, toast]);

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
    <div className="flex min-h-screen">
      <aside className="glass hidden w-64 flex-col border-r border-white/20 p-6 text-white md:flex">
        <div>
          <p className="gradient-text text-sm uppercase tracking-wide">CPOS</p>
          <h2 className="text-2xl font-semibold text-white">Control</h2>
        </div>
        <nav className="mt-8 space-y-1">
          {filteredNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                pathname === item.href
                  ? "bg-white/20 text-white backdrop-blur-sm"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-xl bg-white/10 p-4 backdrop-blur-sm">
          <p className="text-xs text-white/70">Signed in as</p>
          <p className="text-sm font-semibold text-white">
            {user?.fullName ?? user?.email}
          </p>
          <p className="text-xs text-white/50">{user?.roles.map((r) => r.name).join(", ")}</p>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="glass sticky top-0 z-10 flex items-center justify-between border-b border-white/20 px-4 py-3">
          <div>
            <p className="gradient-text text-xs font-semibold uppercase tracking-wide">Dashboard</p>
            <h1 className="text-lg font-semibold text-white">Granular RBAC Overview</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-white/80 sm:inline-flex">
              {user?.email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/30 hover:bg-white/20"
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
