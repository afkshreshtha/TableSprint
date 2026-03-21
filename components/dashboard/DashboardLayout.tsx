'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Table as TableIcon,
  Settings,
  History,
  Menu as MenuIcon,
  X,
  ChefHat,
  LogOut,
  User,
  Users,
  CreditCard,
  Lock,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/contexts/authContext';
import { supabase } from '@/lib/supabase/client';

interface DashboardLayoutProps {
  children: ReactNode;
  restaurantName?: string;
}

const navigation = [
  { name: 'Dashboard',      href: '/dashboard',              icon: LayoutDashboard, proOnly: false },
  { name: 'Live Orders',    href: '/dashboard/orders',       icon: ShoppingBag,     proOnly: false },
  { name: 'Kitchen Display',href: '/dashboard/kitchen',      icon: ChefHat,         proOnly: false },
  { name: 'Menu',           href: '/dashboard/menu',         icon: UtensilsCrossed, proOnly: false },
  { name: 'Tables',         href: '/dashboard/tables',       icon: TableIcon,       proOnly: false },
  { name: 'Order History',  href: '/dashboard/order-history',icon: History,         proOnly: false },
  { name: 'Manage Staff',   href: '/dashboard/staff',        icon: Users,           proOnly: true  },
  { name: 'Subscription',   href: '/dashboard/pricing',      icon: CreditCard,      proOnly: false },
  { name: 'Settings',       href: '/dashboard/settings',     icon: Settings,        proOnly: false },
];

export default function DashboardLayout({ children, restaurantName = 'Restaurant' }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [isPro, setIsPro] = useState<boolean | null>(null); // null = loading

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return;

      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!restaurant) return;

      const { data: sub } = await supabase
        .from('restaurant_subscriptions')
        .select('status')
        .eq('restaurant_id', restaurant.id)
        .single();

      const proStatuses = ['active', 'trialing'];
      setIsPro(proStatuses.includes(sub?.status || ''));
    };

    fetchSubscription();
  }, [user]);

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      setSigningOut(true);
      await signOut();
    }
  };

  // If a free user tries to directly navigate to a pro-only page, redirect them
  useEffect(() => {
    if (isPro === null) return; // still loading
    const currentNav = navigation.find((item) => item.href === pathname);
    if (currentNav?.proOnly && !isPro) {
      router.replace('/dashboard/pricing?upgrade=staff');
    }
  }, [pathname, isPro, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">TableSprint</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Restaurant name */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <p className="text-sm font-medium text-gray-900">{restaurantName}</p>
            <p className="text-xs text-gray-500">Restaurant Dashboard</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const isLocked = item.proOnly && isPro === false;

              if (isLocked) {
                return (
                  <Link
                    key={item.name}
                    href="/dashboard/pricing?upgrade=staff"
                    className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-400 hover:bg-orange-50 hover:text-orange-600 transition-colors group"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="w-5 h-5 mr-3 text-gray-300 group-hover:text-orange-400" />
                    <span className="flex-1">{item.name}</span>
                    <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">
                      <Lock className="w-3 h-3" />
                      Pro
                    </span>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-orange-600' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Pro upgrade nudge for free users */}
          {isPro === false && (
            <div className="mx-4 mb-3 p-3 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <Zap className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-900">Upgrade to Pro</span>
              </div>
              <p className="text-xs text-orange-700 mb-2">
                Unlock staff accounts, full analytics & more.
              </p>
              <Link
                href="/dashboard/pricing"
                className="block text-center text-xs font-semibold bg-orange-600 text-white px-3 py-1.5 rounded-lg hover:bg-orange-700 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                View Plans
              </Link>
            </div>
          )}

          {/* User Info & Sign Out */}
          <div className="border-t border-gray-200">
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.email || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isPro ? (
                      <span className="text-emerald-600 font-medium">Pro Plan</span>
                    ) : (
                      <span className="text-gray-400">Free Plan</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {signingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="mr-4 text-gray-500 hover:text-gray-700 lg:hidden"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {navigation.find((item) => item.href === pathname)?.name || 'Dashboard'}
            </h1>
          </div>

          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}