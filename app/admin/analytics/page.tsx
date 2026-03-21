"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CreditCard,
  Calendar,
  Loader2,
} from "lucide-react";
import { isSuperAdmin } from "@/lib/utils/isSuperAdmin";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Analytics {
  revenue: {
    today: number;
    yesterday: number;
    thisMonth: number;
    lastMonth: number;
    total: number;
  };
  subscriptions: {
    active: number;
    trial: number;
    free: number;
    cancelled: number;
  };
  growth: {
    newRestaurants: number[];
    dates: string[];
  };
  revenueOverTime: {
    date: string;
    revenue: number;
  }[];
}

interface SubscriptionRow {
  status: string;
  subscription_plans: { name: string } | { name: string }[] | null;
}

interface PaymentRow {
  amount: number;
}

const COLORS = ["#ea580c", "#16a34a", "#eab308", "#dc2626"];

const sumAmounts = (payments: PaymentRow[] | null): number =>
  (payments ?? []).reduce((sum, p) => sum + p.amount, 0) / 100;

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics>({
    revenue: {
      today: 0,
      yesterday: 0,
      thisMonth: 0,
      lastMonth: 0,
      total: 0,
    },
    subscriptions: {
      active: 0,
      trial: 0,
      free: 0,
      cancelled: 0,
    },
    growth: {
      newRestaurants: [],
      dates: [],
    },
    revenueOverTime: [],
  });
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    const checkAdmin = async () => {
      const isAdmin = await isSuperAdmin();
      if (!isAdmin) {
        router.push("/dashboard");
        return;
      }
      fetchAnalytics();
    };
    checkAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, router]);

  const fetchAnalytics = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfLastMonth = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        1,
      );
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

      // Revenue data
      const { data: todayPayments } = await supabase
        .from("payment_history")
        .select("amount")
        .eq("status", "success")
        .gte("created_at", today.toISOString());

      const { data: yesterdayPayments } = await supabase
        .from("payment_history")
        .select("amount")
        .eq("status", "success")
        .gte("created_at", yesterday.toISOString())
        .lt("created_at", today.toISOString());

      const { data: thisMonthPayments } = await supabase
        .from("payment_history")
        .select("amount")
        .eq("status", "success")
        .gte("created_at", startOfMonth.toISOString());

      const { data: lastMonthPayments } = await supabase
        .from("payment_history")
        .select("amount")
        .eq("status", "success")
        .gte("created_at", startOfLastMonth.toISOString())
        .lte("created_at", endOfLastMonth.toISOString());

      const { data: allPayments } = await supabase
        .from("payment_history")
        .select("amount")
        .eq("status", "success");

      // Subscription counts
      const { data: subscriptions } = await supabase
        .from("restaurant_subscriptions")
        .select("status, subscription_plans(name)");

      const subStats = (subscriptions as SubscriptionRow[] | null)?.reduce(
        (acc, sub) => {
          if (sub.status === "active") acc.active++;
          else if (sub.status === "trialing") acc.trial++;
          else if (sub.status === "cancelled") acc.cancelled++;

          const plan = Array.isArray(sub.subscription_plans)
            ? sub.subscription_plans[0]
            : sub.subscription_plans;
          if (plan?.name === "free") acc.free++;

          return acc;
        },
        { active: 0, trial: 0, free: 0, cancelled: 0 },
      ) ?? { active: 0, trial: 0, free: 0, cancelled: 0 };

      // Growth data
      const daysToFetch =
        dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
      const growthData: number[] = [];
      const revenueData: { date: string; revenue: number }[] = [];

      for (let i = daysToFetch - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        // New restaurants
        const { count } = await supabase
          .from("restaurants")
          .select("*", { count: "exact", head: true })
          .gte("created_at", date.toISOString())
          .lt("created_at", nextDate.toISOString());

        // Revenue for that day
        const { data: dayPayments } = await supabase
          .from("payment_history")
          .select("amount")
          .eq("status", "success")
          .gte("created_at", date.toISOString())
          .lt("created_at", nextDate.toISOString());

        const dayRevenue =
          (dayPayments as PaymentRow[] | null)?.reduce(
            (sum, p) => sum + p.amount,
            0,
          ) ?? 0;

        growthData.push(count ?? 0);
        revenueData.push({
          date: date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          revenue: dayRevenue / 100,
        });
      }

      setAnalytics({
        revenue: {
          today: sumAmounts(todayPayments as PaymentRow[] | null),
          yesterday: sumAmounts(yesterdayPayments as PaymentRow[] | null),
          thisMonth: sumAmounts(thisMonthPayments as PaymentRow[] | null),
          lastMonth: sumAmounts(lastMonthPayments as PaymentRow[] | null),
          total: sumAmounts(allPayments as PaymentRow[] | null),
        },
        subscriptions: subStats,
        growth: {
          newRestaurants: growthData,
          dates: revenueData.map((d) => d.date),
        },
        revenueOverTime: revenueData,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
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

  const revenueChange =
    analytics.revenue.yesterday > 0
      ? ((analytics.revenue.today - analytics.revenue.yesterday) /
          analytics.revenue.yesterday) *
        100
      : 0;

  const monthlyChange =
    analytics.revenue.lastMonth > 0
      ? ((analytics.revenue.thisMonth - analytics.revenue.lastMonth) /
          analytics.revenue.lastMonth) *
        100
      : 0;

  const subscriptionData = [
    { name: "Active", value: analytics.subscriptions.active },
    { name: "Trial", value: analytics.subscriptions.trial },
    { name: "Free", value: analytics.subscriptions.free },
    { name: "Cancelled", value: analytics.subscriptions.cancelled },
  ];

  const growthChartData = analytics.growth.dates.map((date, index) => ({
    date,
    restaurants: analytics.growth.newRestaurants[index],
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
            <p className="text-gray-600 mt-1">
              Platform performance and insights
            </p>
          </div>
          <div className="flex gap-2">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  dateRange === range
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {range === "7d"
                  ? "7 Days"
                  : range === "30d"
                    ? "30 Days"
                    : "90 Days"}
              </button>
            ))}
          </div>
        </div>

        {/* Revenue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Today`&apos;s Revenue</p>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              ₹{analytics.revenue.today.toLocaleString()}
            </p>
            <div className="flex items-center gap-1">
              {revenueChange >= 0 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">
                    +{revenueChange.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-600 font-medium">
                    {revenueChange.toFixed(1)}%
                  </span>
                </>
              )}
              <span className="text-xs text-gray-500">vs yesterday</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">This Month</p>
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              ₹{analytics.revenue.thisMonth.toLocaleString()}
            </p>
            <div className="flex items-center gap-1">
              {monthlyChange >= 0 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">
                    +{monthlyChange.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-600 font-medium">
                    {monthlyChange.toFixed(1)}%
                  </span>
                </>
              )}
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ₹{analytics.revenue.total.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">All time</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Active Subscribers</p>
              <CreditCard className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {analytics.subscriptions.active}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              +{analytics.subscriptions.trial} trialing
            </p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Over Time */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Revenue Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.revenueOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value) => {
                    const num =
                      typeof value === "number" ? value : Number(value);
                    return [`₹${num.toLocaleString()}`, "Revenue (₹)"];
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#ea580c"
                  strokeWidth={2}
                  name="Revenue (₹)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Subscription Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Subscription Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subscriptionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {subscriptionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Restaurant Growth Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Restaurant Growth
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={growthChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="restaurants"
                fill="#ea580c"
                name="New Restaurants"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AdminLayout>
  );
}
