'use client';

import { useEffect, useState, useCallback } from 'react';
import { Clock, CheckCircle, Timer } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import ProtectedRoute from '@/lib/utils/protectedRoute';
import { useStaffRole } from '@/hooks/useStaffrole';

interface OrderItem {
  id: string;
  quantity: number;
  special_instructions?: string;
  menu_items: { name: string };
}

interface KitchenOrder {
  id: string;
  order_number: string;
  table_number: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
}

function KitchenDisplay() {
  const { restaurantId } = useStaffRole();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchOrders = useCallback(async () => {
    if (!restaurantId) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            special_instructions,
            menu_items (name)
          )
        `)
        .eq('restaurant_id', restaurantId)        // ← scoped
        .in('status', ['confirmed', 'preparing'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,  // ← scoped
        },
        () => {
          fetchOrders();
          playNotificationSound();
        }
      )
      .subscribe();

    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timeInterval);
    };
  }, [restaurantId, fetchOrders]);

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .eq('restaurant_id', restaurantId);       // ← scoped

      if (error) throw error;

      await supabase.from('order_status_history').insert({
        order_id: orderId,
        status,
        changed_by: 'kitchen',
      });

      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const getAge = (d: string) =>
    Math.floor((currentTime.getTime() - new Date(d).getTime()) / 60000);

  const getTimeSince = (d: string) => {
    const mins = getAge(d);
    if (mins < 1) return 'Just now';
    if (mins === 1) return '1 min ago';
    return `${mins} mins ago`;
  };

  const getBorderColor = (d: string) => {
    const age = getAge(d);
    if (age > 15) return 'border-red-500 bg-red-50';
    if (age > 10) return 'border-yellow-500 bg-yellow-50';
    return 'border-green-500 bg-white';
  };

  const getTimerColor = (d: string) => {
    const age = getAge(d);
    if (age > 15) return 'text-red-500';
    if (age > 10) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading kitchen orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg p-6 mb-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Kitchen Display</h1>
            <p className="text-orange-100">
              {orders.length} active {orders.length === 1 ? 'order' : 'orders'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-orange-100 text-sm mb-1">Current Time</p>
            <p className="text-3xl font-bold text-white">
              {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-16 text-center">
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-3">All Caught Up!</h2>
          <p className="text-gray-400 text-xl">No pending orders at the moment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map((order) => {
            const isPreparing = order.status === 'preparing';

            return (
              <div
                key={order.id}
                className={`rounded-lg border-4 shadow-xl overflow-hidden transition-all ${getBorderColor(order.created_at)}`}
              >
                {/* Card Header */}
                <div className="bg-gray-800 p-6 border-b-4 border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-orange-600 px-4 py-2 rounded-lg">
                      <p className="text-white font-bold text-2xl">TABLE {order.table_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm mb-1">#{order.order_number}</p>
                      <div className="flex items-center space-x-2">
                        <Timer className={`w-5 h-5 ${getTimerColor(order.created_at)}`} />
                        <p className={`font-bold ${getTimerColor(order.created_at)}`}>
                          {getTimeSince(order.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                  {isPreparing && (
                    <div className="bg-purple-900 text-purple-200 px-4 py-2 rounded-lg text-center font-semibold">
                      In Preparation
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="p-6 space-y-4">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-2xl font-bold text-gray-900 mb-2">
                        {item.quantity}x {item.menu_items.name}
                      </p>
                      {item.special_instructions && (
                        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-3 rounded">
                          <p className="text-sm font-semibold text-yellow-800 mb-1">Special Instructions:</p>
                          <p className="text-yellow-900">{item.special_instructions}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Action */}
                <div className="p-6 bg-gray-50 border-t-4 border-gray-200">
                  {isPreparing ? (
                    <button
                      onClick={() => updateStatus(order.id, 'ready')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl text-2xl font-bold transition-colors shadow-lg"
                    >
                      MARK READY ✓
                    </button>
                  ) : (
                    <button
                      onClick={() => updateStatus(order.id, 'preparing')}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 rounded-xl text-2xl font-bold transition-colors shadow-lg"
                    >
                      START PREPARING
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function KitchenPage() {
  return (
    // Both owner and chef can access kitchen
    <ProtectedRoute allowedRoles={['owner', 'chef']}>
      <KitchenDisplay />
    </ProtectedRoute>
  );
}