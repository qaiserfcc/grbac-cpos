"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, Home, Shapes, Package } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/ToastContext";
import { HasPermission } from "@/components/rbac/HasPermission";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { tokens, user, logout } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home, permission: null },
    { name: "Categories", href: "/dashboard/categories", icon: Shapes, permission: "category.read" },
    { name: "Products", href: "/dashboard/products", icon: Package, permission: "product.read" },
  ];

  useEffect(() => {
    if (!tokens) {
      toast.error("Please log in to access the dashboard");
      router.replace("/login");
    }
  }, [tokens, router, toast]);

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
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Sidebar */}
      <div className="hidden w-64 flex-col border-r border-white/20 bg-black/20 backdrop-blur-md md:flex">
        <div className="flex h-16 items-center border-b border-white/20 px-4">
          <p className="gradient-text text-lg font-semibold uppercase tracking-wide">CPOS</p>
        </div>
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const content = (
              <div className={clsx(
                "group flex items-center rounded-lg px-2 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}>
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </div>
            );

            if (item.permission) {
              return (
                <HasPermission key={item.name} permission={item.permission}>
                  <Link href={item.href}>
                    {content}
                  </Link>
                </HasPermission>
              );
            }

            return (
              <Link key={item.name} href={item.href}>
                {content}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-white/20 bg-black/10 px-4 backdrop-blur-md md:px-6">
          <div className="md:hidden">
            <p className="gradient-text text-lg font-semibold uppercase tracking-wide">CPOS</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-sm text-white/80 sm:inline-flex">
              {user?.email}
            </div>
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
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
