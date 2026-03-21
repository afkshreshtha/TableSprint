'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Globe, 
  Calendar,
  CreditCard,
  Users,
  Table,
  UtensilsCrossed,
  Loader2,
} from 'lucide-react';
import type { Tables } from '@/types/supabase';

// ── Derived types from generated schema ──────────────────────────────────────
type Restaurant         = Tables<'restaurants'>;
type Subscription       = Tables<'restaurant_subscriptions'>;
type SubscriptionPlan   = Tables<'subscription_plans'>;
type TableRow           = Tables<'tables'>;
type MenuItem           = Tables<'menu_items'>;
type Staff              = Tables<'restaurant_staff'>;
type Order              = Tables<'orders'>;

// ── Joined type matching the select query ────────────────────────────────────
type RestaurantDetails = Restaurant & {
  restaurant_subscriptions: (Subscription & {
    subscription_plans: SubscriptionPlan;
  }) | null;
  tables: TableRow[];
  menu_items: MenuItem[];
  restaurant_staff: Staff[];
};

export default function RestaurantDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<RestaurantDetails | null>(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    tablesCount: 0,
    menuItemsCount: 0,
    staffCount: 0,
  });

  useEffect(() => {
    if (params.id) {
      fetchRestaurantDetails(params.id as string);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchRestaurantDetails = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          restaurant_subscriptions (
            *,
            subscription_plans (*)
          ),
          tables (*),
          menu_items (*),
          restaurant_staff (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // orders uses `total` not `total_amount` per your schema
      const { data: orders } = await supabase
        .from('orders')
        .select('total, status')
        .eq('restaurant_id', id);

      const totalOrders = orders?.length ?? 0;
      const totalRevenue = orders
        ?.filter((o): o is Order => o.status === 'served')
        .reduce((sum, o) => sum + (o.total ?? 0), 0) ?? 0;

      setRestaurant(data as RestaurantDetails);

      setStats({
        totalOrders,
        totalRevenue,
        tablesCount:    data.tables?.length    ?? 0,
        menuItemsCount: data.menu_items?.length ?? 0,
        staffCount:     data.restaurant_staff?.length ?? 0,
      });
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        </div>
      </AdminLayout>
    );
  }

  if (!restaurant) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Restaurant not found</p>
          <button
            onClick={() => router.push('/admin/restaurants')}
            className="mt-4 text-orange-600 hover:text-orange-700"
          >
            ← Back to Restaurants
          </button>
        </div>
      </AdminLayout>
    );
  }

  const sub = restaurant.restaurant_subscriptions;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/admin/restaurants')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Restaurants
          </button>
        </div>

        {/* Restaurant Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {restaurant.name}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {restaurant.email}
                </span>
                {restaurant.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {restaurant.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {restaurant.slug}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                restaurant.is_active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {restaurant.is_active ? 'Active' : 'Suspended'}
              </span>
              {restaurant.created_at && (
                <span className="text-xs text-gray-500 text-right">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Joined {new Date(restaurant.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <CreditCard className="w-5 h-5 text-orange-600" />
                <p className="text-sm text-gray-600">Total Orders</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                <p className="text-sm text-gray-600">Revenue</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ₹{stats.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Table className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-gray-600">Tables</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.tablesCount}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <UtensilsCrossed className="w-5 h-5 text-purple-600" />
                <p className="text-sm text-gray-600">Menu Items</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.menuItemsCount}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <p className="text-sm text-gray-600">Staff</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.staffCount}</p>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        {sub && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Subscription Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Plan</p>
                <p className="font-semibold text-gray-900">
                  {sub.subscription_plans?.display_name ?? 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  sub.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : sub.status === 'trialing'
                    ? 'bg-yellow-100 text-yellow-700'
                    : sub.status === 'paused'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {sub.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Billing Cycle</p>
                <p className="font-semibold text-gray-900 capitalize">
                  {sub.billing_cycle ?? 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}