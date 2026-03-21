'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Search, 
  Eye, 
  Ban, 
  CheckCircle,
  Download,
  Loader2,
} from 'lucide-react';
import { isSuperAdmin } from '@/lib/utils/isSuperAdmin';

interface SubscriptionPlan {
  name: string;
  display_name: string;
}

interface RestaurantSubscription {
  status: string;
  plan_id: string;
  subscription_plans: SubscriptionPlan;
}

interface Restaurant {
  id: string;
  name: string;
  email: string;
  phone: string;
  slug: string;
  created_at: string;
  owner_id: string;
  is_active: boolean;
  restaurant_subscriptions: RestaurantSubscription | null;
}

export default function RestaurantsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  useEffect(() => {
    const checkAdmin = async () => {
      const isAdmin = await isSuperAdmin();
      if (!isAdmin) {
        router.push('/dashboard');
        return;
      }
      fetchRestaurants();
    };
    checkAdmin();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          restaurant_subscriptions (
            status,
            plan_id,
            subscription_plans (
              name,
              display_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRestaurants((data as Restaurant[]) ?? []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (restaurantId: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'suspend' : 'activate'} this restaurant?`)) {
      return;
    }
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ is_active: !currentStatus })
        .eq('id', restaurantId);

      if (error) throw error;
      alert(`Restaurant ${currentStatus ? 'suspended' : 'activated'} successfully`);
      fetchRestaurants();
    } catch (error) {
      console.error('Error updating restaurant:', error);
      alert('Failed to update restaurant');
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Slug', 'Status', 'Plan', 'Created'];
    const rows = filteredRestaurants.map(r => [
      r.name,
      r.email,
      r.phone || '',
      r.slug,
      r.is_active ? 'Active' : 'Suspended',
      r.restaurant_subscriptions?.subscription_plans?.display_name || 'None', // fixed
      new Date(r.created_at).toLocaleDateString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `restaurants-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase());

    const sub = r.restaurant_subscriptions; // fixed: was r.subscription
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'active' && sub?.status === 'active') ||
      (filterStatus === 'free' && sub?.subscription_plans?.name === 'free') ||
      (filterStatus === 'trial' && sub?.status === 'trialing') ||
      (filterStatus === 'suspended' && !r.is_active);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Restaurants</h2>
            <p className="text-gray-600 mt-1">Manage all restaurants on the platform</p>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Restaurants</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{restaurants.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Active Subscribers</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {restaurants.filter(r => r.restaurant_subscriptions?.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Free Tier</p>
            <p className="text-2xl font-bold text-gray-600 mt-1">
              {restaurants.filter(r => r.restaurant_subscriptions?.subscription_plans?.name === 'free').length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">On Trial</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              {restaurants.filter(r => r.restaurant_subscriptions?.status === 'trialing').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {(['all', 'active', 'free', 'trial', 'suspended'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterStatus(filter)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === filter
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restaurant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRestaurants.map((restaurant) => {
                  const sub = restaurant.restaurant_subscriptions;
                  return (
                    <tr key={restaurant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{restaurant.name}</p>
                        <p className="text-sm text-gray-500">{restaurant.slug}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{restaurant.email}</p>
                        <p className="text-sm text-gray-500">{restaurant.phone || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          sub?.subscription_plans?.name === 'pro'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {sub?.subscription_plans?.display_name || 'None'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block w-fit ${
                            sub?.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : sub?.status === 'trialing'
                              ? 'bg-yellow-100 text-yellow-700'
                              : sub?.status === 'paused'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {sub?.status || 'None'}
                          </span>
                          {!restaurant.is_active && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 inline-block w-fit">
                              Suspended
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(restaurant.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/admin/restaurants/${restaurant.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSuspend(restaurant.id, restaurant.is_active)}
                            className={`p-2 rounded-lg transition-colors ${
                              restaurant.is_active
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={restaurant.is_active ? 'Suspend' : 'Activate'}
                          >
                            {restaurant.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredRestaurants.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No restaurants found</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
