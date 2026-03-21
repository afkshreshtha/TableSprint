'use client';

import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Clock, User, CreditCard, Smartphone, Banknote, CheckCircle, ChefHat, UtensilsCrossed, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface OrderItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  price_at_time: number;
  special_instructions?: string;
  menu_items: { name: string };
}

interface Order {
  id: string;
  order_number: string;
  table_number: number;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  tax: number;
  service_charge: number;
  total: number;
  created_at: string;
  order_items: OrderItem[];
}

const statusConfig = {
  pending:   { label: 'Pending',   color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800',     icon: CheckCircle },
  preparing: { label: 'Preparing', color: 'bg-purple-100 text-purple-800', icon: ChefHat },
  ready:     { label: 'Ready',     color: 'bg-green-100 text-green-800',   icon: UtensilsCrossed },
  served:    { label: 'Served',    color: 'bg-gray-100 text-gray-800',     icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800',       icon: Clock },
};

const statusFlow = ['pending', 'confirmed', 'preparing', 'ready', 'served'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  // ── Step 1: get this user's restaurant ID once ──
  useEffect(() => {
    const getRestaurantId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (data) setRestaurantId(data.id);
    };

    getRestaurantId();
  }, []);

  // ── Step 2: fetch orders only after we have restaurantId ──
  const fetchOrders = useCallback(async () => {
    if (!restaurantId) return;

    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            menu_item_id,
            quantity,
            price_at_time,
            special_instructions,
            menu_items (name)
          )
        `)
        .eq('restaurant_id', restaurantId)        // ← KEY FIX: scope to this restaurant
        .order('created_at', { ascending: false });

      if (filter === 'active') {
        query = query.in('status', ['pending', 'confirmed', 'preparing', 'ready']);
      } else if (filter === 'completed') {
        query = query.in('status', ['served', 'cancelled']);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Step 3: realtime scoped to this restaurant ──
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel('orders-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,  // ← scoped realtime
        },
        () => { fetchOrders(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [restaurantId, fetchOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
        .eq('restaurant_id', restaurantId);       // ← extra safety check

      if (orderError) throw orderError;

      await supabase.from('order_status_history').insert({
        order_id: orderId,
        status: newStatus,
        changed_by: 'restaurant',
      });

      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const updatePaymentStatus = async (orderId: string, newPaymentStatus: string) => {
    try {
      const updateData: any = { payment_status: newPaymentStatus };
      if (newPaymentStatus === 'paid') updateData.status = 'confirmed';

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .eq('restaurant_id', restaurantId);       // ← extra safety check

      if (error) throw error;

      if (newPaymentStatus === 'paid') {
        await supabase.from('order_status_history').insert({
          order_id: orderId,
          status: 'confirmed',
          changed_by: 'restaurant',
        });
      }

      fetchOrders();
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status');
    }
  };

  const getNextStatus = (currentStatus: string) => {
    const idx = statusFlow.indexOf(currentStatus);
    return idx < statusFlow.length - 1 ? statusFlow[idx + 1] : null;
  };

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const formatCurrency = (n: number) => `₹${n.toFixed(2)}`;

  if (loading || !restaurantId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Filters */}
      <div className="flex space-x-2 mb-6">
        {(['all', 'active', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
              filter === f
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500">
            {filter === 'active'
              ? 'New orders will appear here automatically'
              : 'No orders match your filter'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map((order) => {
            const StatusIcon = statusConfig[order.status as keyof typeof statusConfig]?.icon || Clock;
            const nextStatus = getNextStatus(order.status);

            return (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span className="font-semibold text-lg">Table {order.table_number}</span>
                    </div>
                    <span className="text-sm opacity-90">#{order.order_number}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="opacity-90">{formatTime(order.created_at)}</span>
                    <span className="font-semibold">{formatCurrency(order.total)}</span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4 border-b border-gray-100">
                  <div className="space-y-2">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {item.quantity}x {item.menu_items.name}
                          </p>
                          {item.special_instructions && (
                            <p className="text-sm text-gray-500 italic mt-1">
                              📝 {item.special_instructions}
                            </p>
                          )}
                        </div>
                        <span className="text-sm text-gray-600 ml-2">
                          {formatCurrency(item.price_at_time * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment & Status */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {order.payment_method === 'upi' ? (
                        <Smartphone className="w-4 h-4 text-gray-500" />
                      ) : order.payment_method === 'card' ? (
                        <CreditCard className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Banknote className="w-4 h-4 text-gray-500" />
                      )}
                      <span className="text-sm text-gray-600 capitalize">{order.payment_method}</span>
                    </div>

                    {order.payment_status === 'pending' ? (
                      <button
                        onClick={() => updatePaymentStatus(order.id, 'paid')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
                      >
                        <DollarSign className="w-3 h-3" />
                        Mark as Paid
                      </button>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Paid
                      </span>
                    )}
                  </div>

                  <div className={`flex items-center justify-center space-x-2 py-2 rounded-lg mb-3 ${
                    statusConfig[order.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'
                  }`}>
                    <StatusIcon className="w-4 h-4" />
                    <span className="font-medium text-sm">
                      {statusConfig[order.status as keyof typeof statusConfig]?.label || order.status}
                    </span>
                  </div>

                  {nextStatus && order.status !== 'served' && order.status !== 'cancelled' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, nextStatus)}
                      className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors"
                    >
                      Mark as {statusConfig[nextStatus as keyof typeof statusConfig]?.label}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
