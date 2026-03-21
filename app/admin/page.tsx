'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { isSuperAdmin } from '@/lib/utils/isSuperAdmin';

interface Stats {
  totalRestaurants: number;
  activeSubscriptions: number;
  freeUsers: number;
  trialingUsers: number;
  monthlyRevenue: number;
  totalRevenue: number;
  newSignupsToday: number;
  cancelledToday: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalRestaurants: 0,
    activeSubscriptions: 0,
    freeUsers: 0,
    trialingUsers: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    newSignupsToday: 0,
    cancelledToday: 0,
  });

  useEffect(() => {
    const checkAdmin = async () => {
      const isAdmin = await isSuperAdmin();
      if (!isAdmin) {
        router.push('/dashboard');
        return;
      }
      fetchStats();
    };

    checkAdmin();
  }, []);

  const fetchStats = async () => {
    try {
      // Total restaurants
      const { count: totalRestaurants } = await supabase
        .from('restaurants')
        .select('*', { count: 'exact', head: true });

      // Active subscriptions
      const { count: activeSubscriptions } = await supabase
        .from('restaurant_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Free users
      const { count: freeUsers } = await supabase
        .from('restaurant_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'free');

      // Trialing users
      const { count: trialingUsers } = await supabase
        .from('restaurant_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'trialing');

      // Monthly revenue (this month)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthlyPayments } = await supabase
        .from('payment_history')
        .select('amount')
        .eq('status', 'success')
        .gte('created_at', startOfMonth.toISOString());

      const monthlyRevenue = monthlyPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      // Total revenue
      const { data: allPayments } = await supabase
        .from('payment_history')
        .select('amount')
        .eq('status', 'success');

      const totalRevenue = allPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      // New signups today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: newSignupsToday } = await supabase
        .from('restaurants')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Cancelled today
      const { count: cancelledToday } = await supabase
        .from('restaurant_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'cancelled')
        .gte('cancelled_at', today.toISOString());

      setStats({
        totalRestaurants: totalRestaurants || 0,
        activeSubscriptions: activeSubscriptions || 0,
        freeUsers: freeUsers || 0,
        trialingUsers: trialingUsers || 0,
        monthlyRevenue: monthlyRevenue / 100,
        totalRevenue: totalRevenue / 100,
        newSignupsToday: newSignupsToday || 0,
        cancelledToday: cancelledToday || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: 'Total Restaurants',
      value: stats.totalRestaurants,
      icon: Building2,
      color: 'bg-blue-500',
      change: `+${stats.newSignupsToday} today`,
    },
    {
      title: 'Active Subscriptions',
      value: stats.activeSubscriptions,
      icon: CheckCircle,
      color: 'bg-green-500',
      change: `${stats.cancelledToday} cancelled today`,
    },
    {
      title: 'Free Tier Users',
      value: stats.freeUsers,
      icon: Users,
      color: 'bg-gray-500',
    },
    {
      title: 'Trial Users',
      value: stats.trialingUsers,
      icon: AlertCircle,
      color: 'bg-yellow-500',
    },
    {
      title: 'Monthly Revenue',
      value: `₹${stats.monthlyRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-orange-500',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Platform Overview</h2>
          <p className="text-gray-600">Monitor your TableSprint platform performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
              {stat.change && (
                <p className="text-sm text-gray-500">{stat.change}</p>
              )}
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => router.push('/admin/restaurants')}
            className="bg-white border-2 border-orange-600 text-orange-600 rounded-xl p-6 hover:bg-orange-50 transition-colors text-left"
          >
            <Building2 className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Manage Restaurants</h3>
            <p className="text-sm text-gray-600">View and manage all restaurants</p>
          </button>

          <button
            onClick={() => router.push('/admin/coupons')}
            className="bg-white border-2 border-orange-600 text-orange-600 rounded-xl p-6 hover:bg-orange-50 transition-colors text-left"
          >
            <CreditCard className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Create Coupon</h3>
            <p className="text-sm text-gray-600">Generate discount codes</p>
          </button>

          <button
            onClick={() => router.push('/admin/analytics')}
            className="bg-white border-2 border-orange-600 text-orange-600 rounded-xl p-6 hover:bg-orange-50 transition-colors text-left"
          >
            <TrendingUp className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-1">View Analytics</h3>
            <p className="text-sm text-gray-600">Detailed platform metrics</p>
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
