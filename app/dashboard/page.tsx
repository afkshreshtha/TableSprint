'use client';

import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ProtectedRoute from '@/lib/utils/protectedRoute';
import {
  ShoppingBag, DollarSign, Clock, TrendingUp, UtensilsCrossed,
  ArrowUpRight, ArrowDownRight, Calendar, Lock, Zap, Flame,
  BarChart3, Activity, Star, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, ReferenceLine,
} from 'recharts';

type TimePeriod = '24h' | '7d' | '30d' | '90d' | '1y' | 'all';

interface DashboardStats {
  currentOrders: number;
  currentRevenue: number;
  activeOrders: number;
  topItems: Array<{ name: string; count: number }>;
  trendData: Array<{ label: string; revenue: number; orders: number; avgOrder: number }>;
  hourlyData: Array<{ hour: string; orders: number; revenue: number }>;
  previousOrders: number;
  previousRevenue: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  table_number: number;
  status: string;
  total: number;
  created_at: string;
}

/* ─── Custom Tooltip ─── */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(15,15,20,0.95)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14,
      padding: '12px 16px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      minWidth: 160,
    }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, display: 'inline-block' }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{entry.name}</span>
          </div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
            {entry.name.toLowerCase().includes('revenue') || entry.name.toLowerCase().includes('avg')
              ? `₹${Number(entry.value).toLocaleString('en-IN')}`
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ─── Stat Card ─── */
const StatCard = ({ icon, label, value, trend, trendLabel, accent, delay = 0 }: {
  icon: React.ReactNode; label: string; value: string;
  trend: number; trendLabel: string; accent: string; delay?: number;
}) => {
  const isPositive = trend >= 0;
  return (
    <div style={{
      background: '#fff',
      borderRadius: 20,
      padding: '24px',
      border: '1px solid rgba(0,0,0,0.06)',
      boxShadow: '0 2px 20px rgba(0,0,0,0.04)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      animationDelay: `${delay}ms`,
    }}
      className="hover:-translate-y-1 hover:shadow-lg"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700,
          padding: '4px 10px', borderRadius: 100,
          background: isPositive ? '#ecfdf5' : '#fef2f2',
          color: isPositive ? '#059669' : '#dc2626',
        }}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}%
        </span>
      </div>
      <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 4, fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1.1, letterSpacing: '-0.02em' }}>{value}</p>
      <p style={{ fontSize: 11, color: '#d1d5db', marginTop: 6 }}>{trendLabel}</p>
    </div>
  );
};

/* ─── Pro Blur Overlay ─── */
const ProBlurOverlay = ({ title, description }: { title: string; description: string }) => (
  <div style={{
    position: 'absolute', inset: 0, zIndex: 10,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(8px)',
    borderRadius: 20,
    padding: 32,
    textAlign: 'center',
  }}>
    <div style={{
      width: 52, height: 52, borderRadius: 16,
      background: 'linear-gradient(135deg, #f97316, #ea580c)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: 16, boxShadow: '0 8px 24px rgba(249,115,22,0.3)',
    }}>
      <Lock className="w-6 h-6 text-white" />
    </div>
    <p style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 8 }}>{title}</p>
    <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, lineHeight: 1.6 }}>{description}</p>
    <Link href="/dashboard/pricing" style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      background: 'linear-gradient(135deg, #f97316, #ea580c)',
      color: '#fff', padding: '10px 20px', borderRadius: 12,
      fontSize: 13, fontWeight: 700, textDecoration: 'none',
      boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
    }}>
      <Zap className="w-4 h-4" /> Unlock with Pro
    </Link>
  </div>
);

/* ─── Main Component ─── */
export default function DashboardPage() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7d');
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    currentOrders: 0, currentRevenue: 0, activeOrders: 0,
    topItems: [], trendData: [], hourlyData: [],
    previousOrders: 0, previousRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<'revenue' | 'orders' | 'both'>('both');

  const periodConfig: Record<TimePeriod, { label: string; days: number; format: string; proOnly: boolean }> = {
    '24h': { label: '24h',      days: 1,    format: 'hour',  proOnly: false },
    '7d':  { label: '7 days',   days: 7,    format: 'day',   proOnly: false },
    '30d': { label: '30 days',  days: 30,   format: 'day',   proOnly: true  },
    '90d': { label: '90 days',  days: 90,   format: 'week',  proOnly: true  },
    '1y':  { label: '1 year',   days: 365,  format: 'month', proOnly: true  },
    'all': { label: 'All time', days: 9999, format: 'month', proOnly: true  },
  };

  const formatLabel = (date: Date, format: string) => {
    if (format === 'hour') return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    if (format === 'day') return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    if (format === 'week') return `Wk ${Math.ceil(date.getDate() / 7)}`;
    if (format === 'month') return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    return date.toLocaleDateString('en-IN');
  };

  const fetchDashboardData = useCallback(async (restId: string, period: TimePeriod) => {
    try {
      const config = periodConfig[period];
      const now = new Date();

      let periodStart: Date;
      if (period === 'all') {
        periodStart = new Date('2020-01-01');
      } else {
        periodStart = new Date(now);
        periodStart.setDate(periodStart.getDate() - config.days);
        periodStart.setHours(0, 0, 0, 0);
      }

      const compareStart = new Date(periodStart);
      if (period !== 'all') compareStart.setDate(compareStart.getDate() - config.days);

      const { data: currentOrders } = await supabase
        .from('orders').select('id, total, status, created_at')
        .eq('restaurant_id', restId)
        .gte('created_at', periodStart.toISOString())
        .order('created_at', { ascending: true });

      const { data: previousOrders } = await supabase
        .from('orders').select('id, total')
        .eq('restaurant_id', restId)
        .gte('created_at', compareStart.toISOString())
        .lt('created_at', periodStart.toISOString());

      const { data: recent } = await supabase
        .from('orders').select('id, order_number, table_number, status, total, created_at')
        .eq('restaurant_id', restId)
        .order('created_at', { ascending: false }).limit(5);

      const { data: orderItems } = await supabase
        .from('order_items').select('menu_item_id, quantity, menu_items(name)')
        .eq('restaurant_id', restId)
        .gte('created_at', periodStart.toISOString());

      const currentCount = currentOrders?.length || 0;
      const currentRevenue = currentOrders?.reduce((s, o) => s + o.total, 0) || 0;
      const activeOrders = currentOrders?.filter(o =>
        ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
      ).length || 0;
      const previousCount = previousOrders?.length || 0;
      const previousRevenue = previousOrders?.reduce((s, o) => s + o.total, 0) || 0;

      /* Build trend data */
      let trendData: Array<{ label: string; revenue: number; orders: number; avgOrder: number }> = [];

      if (period === '24h') {
        const hourlyMap: Record<number, { revenue: number; orders: number; date: Date }> = {};
        for (let h = 0; h < 24; h++) {
          const d = new Date(now); d.setHours(now.getHours() - (23 - h), 0, 0, 0);
          hourlyMap[h] = { revenue: 0, orders: 0, date: d };
        }
        currentOrders?.forEach(o => {
          const diff = Math.floor((now.getTime() - new Date(o.created_at).getTime()) / (1000 * 60 * 60));
          if (diff >= 0 && diff < 24) { const idx = 23 - diff; hourlyMap[idx].revenue += o.total; hourlyMap[idx].orders++; }
        });
        trendData = Object.values(hourlyMap).map(v => ({
          label: v.date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          revenue: Math.round(v.revenue), orders: v.orders,
          avgOrder: v.orders > 0 ? Math.round(v.revenue / v.orders) : 0,
        }));
      } else if (period === '7d' || period === '30d') {
        const dayMap = new Map<string, { revenue: number; orders: number; date: Date }>();
        for (let i = config.days - 1; i >= 0; i--) {
          const d = new Date(now); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
          dayMap.set(d.toDateString(), { revenue: 0, orders: 0, date: d });
        }
        currentOrders?.forEach(o => {
          const key = new Date(o.created_at).toDateString();
          if (dayMap.has(key)) { const c = dayMap.get(key)!; c.revenue += o.total; c.orders++; }
        });
        trendData = Array.from(dayMap.values()).map(v => ({
          label: formatLabel(v.date, 'day'), revenue: Math.round(v.revenue),
          orders: v.orders, avgOrder: v.orders > 0 ? Math.round(v.revenue / v.orders) : 0,
        }));
      } else if (period === '90d') {
        const periodStartTime = periodStart.getTime();
        const weekMap = new Map<number, { revenue: number; orders: number; weekStart: Date }>();
        for (let i = 0; i < 13; i++) {
          const ws = new Date(periodStart); ws.setDate(ws.getDate() + (i * 7));
          weekMap.set(i, { revenue: 0, orders: 0, weekStart: ws });
        }
        currentOrders?.forEach(o => {
          const idx = Math.floor((new Date(o.created_at).getTime() - periodStartTime) / (7 * 24 * 3600 * 1000));
          if (idx >= 0 && idx < 13 && weekMap.has(idx)) { const c = weekMap.get(idx)!; c.revenue += o.total; c.orders++; }
        });
        trendData = Array.from(weekMap.values()).map((v, i) => ({
          label: `Wk ${i + 1}`, revenue: Math.round(v.revenue),
          orders: v.orders, avgOrder: v.orders > 0 ? Math.round(v.revenue / v.orders) : 0,
        }));
      } else {
        // 1y or all — monthly
        const monthMap = new Map<string, { revenue: number; orders: number; date: Date }>();
        const months = period === '1y' ? 12 : 24;
        for (let i = months - 1; i >= 0; i--) {
          const d = new Date(now); d.setMonth(d.getMonth() - i); d.setDate(1); d.setHours(0, 0, 0, 0);
          monthMap.set(`${d.getFullYear()}-${d.getMonth()}`, { revenue: 0, orders: 0, date: d });
        }
        currentOrders?.forEach(o => {
          const d = new Date(o.created_at);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          if (monthMap.has(key)) { const c = monthMap.get(key)!; c.revenue += o.total; c.orders++; }
        });
        trendData = Array.from(monthMap.values()).map(v => ({
          label: formatLabel(v.date, 'month'), revenue: Math.round(v.revenue),
          orders: v.orders, avgOrder: v.orders > 0 ? Math.round(v.revenue / v.orders) : 0,
        }));
      }

      /* Hourly for today */
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const hourMap: Record<number, { orders: number; revenue: number }> = {};
      for (let h = 0; h < 24; h++) hourMap[h] = { orders: 0, revenue: 0 };
      currentOrders?.filter(o => new Date(o.created_at) >= today).forEach(o => {
        const h = new Date(o.created_at).getHours();
        hourMap[h].orders++; hourMap[h].revenue += o.total;
      });
      const hourlyData = Object.entries(hourMap)
        .filter(([h]) => Number(h) >= 8 && Number(h) <= 23)
        .map(([h, v]) => ({ hour: `${h.padStart(2, '0')}:00`, orders: v.orders, revenue: Math.round(v.revenue) }));

      /* Top items */
      const itemCounts = new Map<string, { name: string; count: number }>();
      orderItems?.forEach((item: any) => {
        const name = item.menu_items?.name || 'Unknown';
        const cur = itemCounts.get(name) || { name, count: 0 };
        itemCounts.set(name, { name, count: cur.count + item.quantity });
      });
      const topItems = Array.from(itemCounts.values()).sort((a, b) => b.count - a.count).slice(0, 5);

      setStats({ currentOrders: currentCount, currentRevenue, activeOrders, topItems, trendData, hourlyData, previousOrders: previousCount, previousRevenue });
      setRecentOrders(recent || []);
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: restaurant } = await supabase.from('restaurants').select('id').eq('owner_id', user.id).single();
      if (!restaurant) { setLoading(false); return; }
      setRestaurantId(restaurant.id);

      const { data: sub } = await supabase.from('restaurant_subscriptions').select('status').eq('restaurant_id', restaurant.id).single();
      const pro = ['active', 'trialing'].includes(sub?.status || '');
      setIsPro(pro);

      await fetchDashboardData(restaurant.id, timePeriod);
    };
    init();
  }, []);

  useEffect(() => {
    if (!restaurantId) return;
    // If free user tries to use pro period, reset to 7d
    if (!isPro && periodConfig[timePeriod].proOnly) {
      setTimePeriod('7d');
      return;
    }
    setLoading(true);
    fetchDashboardData(restaurantId, timePeriod);
  }, [timePeriod, restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    const channel = supabase.channel('dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchDashboardData(restaurantId, timePeriod))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurantId, timePeriod, fetchDashboardData]);

  const formatCurrencyShort = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const calcTrend = (cur: number, prev: number) => prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);

  const statusConfig: Record<string, { bg: string; color: string; dot: string }> = {
    pending:   { bg: 'bg-amber-50',   color: 'text-amber-700',   dot: '#f59e0b' },
    confirmed: { bg: 'bg-blue-50',    color: 'text-blue-700',    dot: '#3b82f6' },
    preparing: { bg: 'bg-violet-50',  color: 'text-violet-700',  dot: '#8b5cf6' },
    ready:     { bg: 'bg-emerald-50', color: 'text-emerald-700', dot: '#10b981' },
    served:    { bg: 'bg-gray-50',    color: 'text-gray-600',    dot: '#9ca3af' },
    cancelled: { bg: 'bg-red-50',     color: 'text-red-600',     dot: '#ef4444' },
  };

  if (loading && !stats.currentOrders) {
    return (
      <ProtectedRoute allowedRoles={['owner']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-7 h-7 text-orange-600 animate-pulse" />
              </div>
              <p className="text-gray-500 font-medium text-sm">Loading your analytics…</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['owner']}>
      <DashboardLayout>
        <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

          {/* ── Header ── */}
          <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', marginBottom: 4 }}>
                Analytics
              </h1>
              <p style={{ fontSize: 13, color: '#9ca3af' }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            {/* Live indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 0 3px rgba(16,185,129,0.2)', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Live updates</span>
            </div>
          </div>

          {/* ── Time Period Selector ── */}
          <div style={{
            background: '#fff', borderRadius: 20, padding: '16px 20px',
            border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
            marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 4 }}>
              <Calendar className="w-4 h-4 text-gray-400" />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Period</span>
            </div>
            {(Object.keys(periodConfig) as TimePeriod[]).map((period) => {
              const config = periodConfig[period];
              const isLocked = config.proOnly && !isPro;
              const isActive = timePeriod === period;
              return (
                <button
                  key={period}
                  onClick={() => !isLocked && setTimePeriod(period)}
                  style={{
                    padding: '7px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    border: 'none', outline: 'none', display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.15s',
                    background: isActive ? 'linear-gradient(135deg, #f97316, #ea580c)' : isLocked ? '#fafafa' : '#f9fafb',
                    color: isActive ? '#fff' : isLocked ? '#d1d5db' : '#374151',
                    boxShadow: isActive ? '0 4px 12px rgba(249,115,22,0.3)' : 'none',
                  }}
                >
                  {isLocked && <Lock className="w-3 h-3" />}
                  {config.label}
                  {config.proOnly && !isPro && (
                    <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(249,115,22,0.1)', color: '#f97316', padding: '2px 6px', borderRadius: 100 }}>PRO</span>
                  )}
                </button>
              );
            })}
            {!isPro && (
              <Link href="/dashboard/pricing" style={{
                marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 700, color: '#f97316', textDecoration: 'none',
                padding: '6px 14px', background: 'rgba(249,115,22,0.08)', borderRadius: 10,
              }}>
                <Zap className="w-3.5 h-3.5" /> Unlock all periods
              </Link>
            )}
          </div>

          {/* ── Stat Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <StatCard
              icon={<ShoppingBag className="w-5 h-5 text-blue-600" />}
              label={`Orders · ${periodConfig[timePeriod].label}`}
              value={String(stats.currentOrders)}
              trend={calcTrend(stats.currentOrders, stats.previousOrders)}
              trendLabel="vs previous period"
              accent="rgba(59,130,246,0.1)"
              delay={0}
            />
            <StatCard
              icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
              label={`Revenue · ${periodConfig[timePeriod].label}`}
              value={formatCurrencyShort(stats.currentRevenue)}
              trend={calcTrend(stats.currentRevenue, stats.previousRevenue)}
              trendLabel="vs previous period"
              accent="rgba(16,185,129,0.1)"
              delay={50}
            />
            <StatCard
              icon={<Clock className="w-5 h-5 text-orange-600" />}
              label="Active Orders"
              value={String(stats.activeOrders)}
              trend={0}
              trendLabel="currently in kitchen"
              accent="rgba(249,115,22,0.1)"
              delay={100}
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5 text-violet-600" />}
              label="Avg. Order Value"
              value={stats.currentOrders > 0 ? formatCurrencyShort(Math.round(stats.currentRevenue / stats.currentOrders)) : '₹0'}
              trend={calcTrend(
                stats.currentOrders > 0 ? stats.currentRevenue / stats.currentOrders : 0,
                stats.previousOrders > 0 ? stats.previousRevenue / stats.previousOrders : 0
              )}
              trendLabel="vs previous period"
              accent="rgba(139,92,246,0.1)"
              delay={150}
            />
          </div>

          {/* ── PRIMARY CHART ── */}
          <div style={{
            background: '#fff', borderRadius: 20, border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 2px 20px rgba(0,0,0,0.04)', marginBottom: 20, overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Performance Trend</h2>
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Revenue & orders over {periodConfig[timePeriod].label}</p>
              </div>
              <div style={{ display: 'flex', background: '#f9fafb', borderRadius: 12, padding: 4, gap: 2 }}>
                {(['both', 'revenue', 'orders'] as const).map(mode => (
                  <button key={mode} onClick={() => setActiveChart(mode)} style={{
                    padding: '6px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600,
                    border: 'none', cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize',
                    background: activeChart === mode ? '#fff' : 'transparent',
                    color: activeChart === mode ? '#111827' : '#9ca3af',
                    boxShadow: activeChart === mode ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  }}>{mode}</button>
                ))}
              </div>
            </div>
            <div style={{ padding: '20px 8px 12px' }}>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={stats.trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false}
                    interval={timePeriod === '1y' || timePeriod === 'all' ? 0 : timePeriod === '24h' ? 2 : 'preserveStartEnd'} />
                  {(activeChart === 'both' || activeChart === 'revenue') && (
                    <YAxis yAxisId="revenue" orientation="left" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false}
                      tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`} width={65} />
                  )}
                  {(activeChart === 'both' || activeChart === 'orders') && (
                    <YAxis yAxisId="orders" orientation="right" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                  )}
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                  {(activeChart === 'both' || activeChart === 'revenue') && (
                    <Area yAxisId="revenue" type="monotone" dataKey="revenue" name="Revenue (₹)"
                      stroke="#f97316" strokeWidth={2.5} fill="url(#revGrad)"
                      dot={{ r: 3.5, fill: '#f97316', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#f97316' }} />
                  )}
                  {(activeChart === 'both' || activeChart === 'orders') && (
                    <Line yAxisId="orders" type="monotone" dataKey="orders" name="Orders"
                      stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3.5, fill: '#6366f1', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#6366f1' }} strokeDasharray={activeChart === 'both' ? '5 3' : undefined} />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── SECONDARY ROW ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 20 }}>

            {/* Hourly Activity */}
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 16px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Today's Rush Hours</h2>
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Order volume by hour — spot peak times</p>
              </div>
              <div style={{ padding: '16px 8px 8px' }}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.hourlyData} barSize={14} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="orders" name="Orders" radius={[6, 6, 0, 0]}>
                      {stats.hourlyData.map((entry, index) => (
                        <rect key={index} fill={entry.orders === Math.max(...stats.hourlyData.map(d => d.orders)) ? '#f97316' : '#fde5d1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Avg Order Trend — PRO ONLY */}
            <div style={{ position: 'relative', background: '#fff', borderRadius: 20, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 16px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Avg. Order Trend</h2>
                  {!isPro && (
                    <span style={{ fontSize: 10, fontWeight: 800, background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', padding: '3px 8px', borderRadius: 100 }}>PRO</span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>How spend per order is changing</p>
              </div>
              <div style={{ padding: '16px 8px 8px', filter: !isPro ? 'blur(3px)' : 'none', pointerEvents: !isPro ? 'none' : 'auto' }}>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={stats.trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} interval={'preserveStartEnd'} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} width={55} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="avgOrder" name="Avg Order (₹)" stroke="#10b981" strokeWidth={2.5} fill="url(#avgGrad)"
                      dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {!isPro && (
                <ProBlurOverlay
                  title="Avg. Order Trend"
                  description="See how your per-order spend is trending over time — identify your most profitable periods."
                />
              )}
            </div>
          </div>

          {/* ── BOTTOM ROW ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Recent Orders */}
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 16px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Recent Orders</h2>
                <Link href="/dashboard/orders" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#f97316', textDecoration: 'none' }}>
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              {recentOrders.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center' }}>
                  <ShoppingBag style={{ width: 40, height: 40, color: '#e5e7eb', margin: '0 auto 12px' }} />
                  <p style={{ color: '#9ca3af', fontSize: 13, fontWeight: 500 }}>No orders yet</p>
                </div>
              ) : (
                <div>
                  {recentOrders.map((order) => {
                    const sc = statusConfig[order.status] || statusConfig.served;
                    return (
                      <div key={order.id} style={{ padding: '14px 24px', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 12, background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#374151' }}>T{order.table_number}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Table {order.table_number}</span>
                            <span style={{ fontSize: 10, color: '#9ca3af', background: '#f3f4f6', padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>#{order.order_number}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, display: 'inline-block', flexShrink: 0 }} />
                            <span style={{ fontSize: 11, color: '#6b7280', textTransform: 'capitalize', fontWeight: 500 }}>{order.status}</span>
                            <span style={{ fontSize: 11, color: '#d1d5db' }}>·</span>
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>{formatTime(order.created_at)}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#111827', flexShrink: 0 }}>{formatCurrencyShort(order.total)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top Items — PRO gets full history, free gets period only */}
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 16px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Top Sellers</h2>
                  <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{periodConfig[timePeriod].label} bestsellers</p>
                </div>
                <Flame style={{ width: 18, height: 18, color: '#f97316' }} />
              </div>
              <div style={{ padding: '16px 24px' }}>
                {stats.topItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <UtensilsCrossed style={{ width: 36, height: 36, color: '#e5e7eb', margin: '0 auto 12px' }} />
                    <p style={{ color: '#9ca3af', fontSize: 13, fontWeight: 500 }}>No sales data yet</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {stats.topItems.map((item, i) => {
                      const maxCount = stats.topItems[0].count;
                      const pct = Math.round((item.count / maxCount) * 100);
                      return (
                        <div key={item.name}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{
                                width: 24, height: 24, borderRadius: 8,
                                background: i === 0 ? 'linear-gradient(135deg,#f97316,#ea580c)' : i === 1 ? 'rgba(249,115,22,0.15)' : '#f3f4f6',
                                color: i === 0 ? '#fff' : i === 1 ? '#f97316' : '#9ca3af',
                                fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                              }}>{i + 1}</span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{item.count}</span>
                              <span style={{ fontSize: 10, color: '#9ca3af' }}>sold</span>
                              {i === 0 && <span style={{ fontSize: 14 }}>🔥</span>}
                            </div>
                          </div>
                          <div style={{ height: 4, background: '#f3f4f6', borderRadius: 100, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: 100, transition: 'width 0.8s ease',
                              width: `${pct}%`,
                              background: i === 0 ? 'linear-gradient(90deg,#f97316,#ea580c)' : i === 1 ? 'rgba(249,115,22,0.5)' : 'rgba(249,115,22,0.25)',
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Free plan nudge at bottom of top sellers */}
              {!isPro && (
                <div style={{ margin: '0 16px 16px', padding: '12px 16px', background: 'linear-gradient(135deg, rgba(249,115,22,0.06), rgba(234,88,12,0.04))', border: '1px solid rgba(249,115,22,0.12)', borderRadius: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Star style={{ width: 16, height: 16, color: '#f97316', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 2 }}>See all-time bestsellers</p>
                      <p style={{ fontSize: 11, color: '#b45309' }}>Pro unlocks lifetime sales history & 90-day trends</p>
                    </div>
                    <Link href="/dashboard/pricing" style={{ fontSize: 11, fontWeight: 700, color: '#f97316', textDecoration: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Upgrade <ChevronRight style={{ width: 12, height: 12 }} />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}