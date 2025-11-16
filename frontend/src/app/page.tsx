'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-4xl text-center">
            {/* Glass Card */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-12 shadow-2xl">
              <h1 className="text-6xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Cloud POS
              </h1>
              <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                Streamline your business operations with our cloud-based Point of Sale system.
                Manage inventory, process sales, and handle customer relationships with ease.
              </p>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="text-3xl mb-4">📦</div>
                  <h3 className="text-lg font-semibold text-white mb-2">Inventory Management</h3>
                  <p className="text-white/70 text-sm">
                    Track products, stock levels, and suppliers in real-time.
                  </p>
                </div>
                <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="text-3xl mb-4">💰</div>
                  <h3 className="text-lg font-semibold text-white mb-2">Sales Processing</h3>
                  <p className="text-white/70 text-sm">
                    Fast and secure transaction processing with detailed reporting.
                  </p>
                </div>
                <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="text-3xl mb-4">👥</div>
                  <h3 className="text-lg font-semibold text-white mb-2">Customer Management</h3>
                  <p className="text-white/70 text-sm">
                    Build customer profiles and loyalty programs.
                  </p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-8 py-3 backdrop-blur-lg bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { user, tokens, isLoading } = useAuth();

  const isAuthenticated = Boolean(user && tokens);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="text-white text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return <LandingPage />;
}
