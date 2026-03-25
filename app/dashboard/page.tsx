"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProtectedRoute from "@/lib/utils/protectedRoute";
import {
  ShoppingBag,
  DollarSign,
  TrendingUp,
  UtensilsCrossed,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Lock,
  Zap,
  Flame,
  BarChart3,
  ChefHat,
  ChevronRight,
  Star,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
} from "recharts";

/* ═══════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════ */
type TimePeriod = "24h" | "7d" | "30d" | "90d" | "1y" | "all";

interface TableRevenue {
  table_number: number;
  revenue: number;
  orders: number;
}
interface SlowMover {
  name: string;
  count: number;
  category: string;
}
interface CategoryBreakdown {
  name: string;
  revenue: number;
  orders: number;
}

interface DashboardStats {
  currentOrders: number;
  currentRevenue: number;
  activeOrders: number;
  topItems: Array<{ name: string; count: number }>;
  trendData: Array<{
    label: string;
    revenue: number;
    orders: number;
    avgOrder: number;
  }>;
  hourlyData: Array<{ hour: string; orders: number; revenue: number }>;
  previousOrders: number;
  previousRevenue: number;
  cancelledOrders: number;
  totalAllOrders: number; // ← FIX: hoisted from fetch scope
  tableRevenue: TableRevenue[];
  slowMovers: SlowMover[];
  cancellationRate: number;
  wowRevenue: { thisWeek: number; lastWeek: number; delta: number };
  categoryBreakdown: CategoryBreakdown[];
}

interface RecentOrder {
  id: string;
  order_number: string;
  table_number: number;
  status: string;
  total: number;
  created_at: string;
}

/* ═══════════════════════════════════════════════════════════
   PERIOD CONFIG
═══════════════════════════════════════════════════════════ */
const PERIOD_CFG: Record<
  TimePeriod,
  { label: string; days: number; format: string; proOnly: boolean }
> = {
  "24h": { label: "24h", days: 1, format: "hour", proOnly: false },
  "7d": { label: "7d", days: 7, format: "day", proOnly: false },
  "30d": { label: "30d", days: 30, format: "day", proOnly: true },
  "90d": { label: "90d", days: 90, format: "week", proOnly: true },
  "1y": { label: "1yr", days: 365, format: "month", proOnly: true },
  all: { label: "All", days: 9999, format: "month", proOnly: true },
};

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */
const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const fmtShort = (n: number) =>
  n >= 100000
    ? `₹${(n / 100000).toFixed(1)}L`
    : n >= 1000
      ? `₹${(n / 1000).toFixed(1)}k`
      : `₹${n}`;
const calcTrend = (cur: number, prev: number) =>
  prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);
const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
const formatLabel = (date: Date, format: string) => {
  if (format === "hour")
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  if (format === "day")
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  if (format === "week") return `Wk${Math.ceil(date.getDate() / 7)}`;
  if (format === "month")
    return date.toLocaleDateString("en-IN", {
      month: "short",
      year: "2-digit",
    });
  return date.toLocaleDateString("en-IN");
};

const STATUS_META: Record<
  string,
  { label: string; dot: string; textColor: string; bg: string }
> = {
  pending: {
    label: "Pending",
    dot: "#f59e0b",
    textColor: "#92400e",
    bg: "#fffbeb",
  },
  confirmed: {
    label: "Confirmed",
    dot: "#3b82f6",
    textColor: "#1e40af",
    bg: "#eff6ff",
  },
  preparing: {
    label: "Preparing",
    dot: "#8b5cf6",
    textColor: "#5b21b6",
    bg: "#f5f3ff",
  },
  ready: {
    label: "Ready",
    dot: "#10b981",
    textColor: "#065f46",
    bg: "#ecfdf5",
  },
  served: {
    label: "Served",
    dot: "#6b7280",
    textColor: "#374151",
    bg: "#f9fafb",
  },
  cancelled: {
    label: "Cancelled",
    dot: "#ef4444",
    textColor: "#991b1b",
    bg: "#fef2f2",
  },
};

/* ═══════════════════════════════════════════════════════════
   CUSTOM TOOLTIP
═══════════════════════════════════════════════════════════ */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#0f172a",
        borderRadius: 12,
        padding: "11px 14px",
        minWidth: 150,
        boxShadow: "0 16px 48px rgba(0,0,0,.35)",
      }}
    >
      <p
        style={{
          color: "rgba(255,255,255,.4)",
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 8,
        }}
      >
        {label}
      </p>
      {payload.map((entry: any, idx: number) => (
        <div
          key={idx}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 5,
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: entry.color,
              flexShrink: 0,
            }}
          />
          <span
            style={{ color: "rgba(255,255,255,.5)", fontSize: 11, flex: 1 }}
          >
            {entry.name}
          </span>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>
            {entry.name.toLowerCase().includes("revenue") ||
            entry.name.toLowerCase().includes("avg")
              ? `₹${Number(entry.value).toLocaleString("en-IN")}`
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   STAT CARD
═══════════════════════════════════════════════════════════ */
const StatCard = ({
  icon,
  label,
  value,
  trend,
  trendLabel,
  accentColor,
  sparkData,
  delay = 0,
  hideTrend = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: number;
  trendLabel: string;
  accentColor: string;
  sparkData?: number[];
  delay?: number;
  hideTrend?: boolean;
}) => {
  const isPos = trend >= 0;
  const spark = (sparkData || []).map((v) => ({ v }));
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 18,
        padding: "20px",
        border: "1px solid rgba(0,0,0,.06)",
        boxShadow: "0 2px 12px rgba(0,0,0,.04)",
        transition: "all .2s",
        animation: `tsFadeUp .4s ease ${delay}ms both`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 13,
            background: `${accentColor}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: accentColor,
          }}
        >
          {icon}
        </div>
        {!hideTrend && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              fontSize: 11,
              fontWeight: 800,
              padding: "4px 9px",
              borderRadius: 100,
              background: isPos ? "#ecfdf5" : "#fef2f2",
              color: isPos ? "#059669" : "#dc2626",
            }}
          >
            {isPos ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p
        style={{
          fontSize: 12,
          color: "#94a3b8",
          fontWeight: 600,
          marginBottom: 3,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 26,
          fontWeight: 900,
          color: "#0f172a",
          letterSpacing: "-0.04em",
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 5 }}>
        {trendLabel}
      </p>
      {spark.length > 0 && (
        <div style={{ marginTop: 12, height: 36 }}>
          <ResponsiveContainer width="100%" height={36}>
            <AreaChart
              data={spark}
              margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`sp-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={accentColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={accentColor}
                strokeWidth={1.5}
                fill={`url(#sp-${label})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   PRO BADGE
═══════════════════════════════════════════════════════════ */
const ProBadge = () => (
  <span
    style={{
      fontSize: 9,
      fontWeight: 800,
      background: "linear-gradient(135deg,#f97316,#ea580c)",
      color: "#fff",
      padding: "2px 7px",
      borderRadius: 100,
    }}
  >
    PRO
  </span>
);

/* ═══════════════════════════════════════════════════════════
   PRO OVERLAY
═══════════════════════════════════════════════════════════ */
const ProOverlay = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      zIndex: 10,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(255,255,255,.9)",
      backdropFilter: "blur(8px)",
      borderRadius: 18,
      padding: 28,
      textAlign: "center",
    }}
  >
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 14,
        background: "linear-gradient(135deg,#f97316,#ea580c)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        marginBottom: 14,
        boxShadow: "0 8px 24px rgba(249,115,22,.3)",
      }}
    >
      <Lock size={20} />
    </div>
    <p
      style={{
        fontSize: 15,
        fontWeight: 900,
        color: "#0f172a",
        marginBottom: 6,
      }}
    >
      {title}
    </p>
    <p
      style={{
        fontSize: 12,
        color: "#475569",
        marginBottom: 18,
        lineHeight: 1.6,
        maxWidth: 220,
      }}
    >
      {description}
    </p>
    <Link
      href="/dashboard/pricing"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "linear-gradient(135deg,#f97316,#ea580c)",
        color: "#fff",
        padding: "9px 18px",
        borderRadius: 10,
        fontSize: 12,
        fontWeight: 800,
        textDecoration: "none",
        boxShadow: "0 4px 14px rgba(249,115,22,.4)",
      }}
    >
      <Zap size={13} /> Unlock Pro
    </Link>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   SKELETON LOADER
═══════════════════════════════════════════════════════════ */
const Skeleton = ({
  w = "100%",
  h = 16,
  r = 8,
}: {
  w?: string | number;
  h?: number;
  r?: number;
}) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: r,
      background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)",
      backgroundSize: "200% 100%",
      animation: "tsSkeleton 1.4s ease-in-out infinite",
    }}
  />
);
const SkeletonCard = () => (
  <div
    style={{
      background: "#fff",
      borderRadius: 18,
      padding: 20,
      border: "1px solid rgba(0,0,0,.06)",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 14,
      }}
    >
      <Skeleton w={42} h={42} r={13} />
      <Skeleton w={60} h={24} r={100} />
    </div>
    <Skeleton w="60%" h={12} r={6} />
    <div style={{ marginTop: 8 }}>
      <Skeleton w="40%" h={26} r={6} />
    </div>
    <div style={{ marginTop: 8 }}>
      <Skeleton w="80%" h={10} r={5} />
    </div>
    <div style={{ marginTop: 14 }}>
      <Skeleton w="100%" h={36} r={6} />
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   CARD WRAPPER
═══════════════════════════════════════════════════════════ */
const Card = ({
  children,
  style = {},
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 18,
      border: "1px solid rgba(0,0,0,.06)",
      boxShadow: "0 2px 12px rgba(0,0,0,.04)",
      overflow: "hidden",
      ...style,
    }}
  >
    {children}
  </div>
);
const CardHead = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      padding: "16px 20px",
      borderBottom: "1px solid rgba(0,0,0,.05)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap" as const,
    }}
  >
    {children}
  </div>
);
const CardBody = ({
  children,
  style = {},
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => <div style={{ padding: "16px 20px", ...style }}>{children}</div>;

/* ═══════════════════════════════════════════════════════════
   EMPTY STATE
═══════════════════════════════════════════════════════════ */
const Empty = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div style={{ padding: "40px 20px", textAlign: "center" }}>
    <div
      style={{
        color: "#e2e8f0",
        marginBottom: 10,
        display: "flex",
        justifyContent: "center",
      }}
    >
      {icon}
    </div>
    <p style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>{text}</p>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("7d");
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<"revenue" | "orders" | "both">(
    "both",
  );

  const EMPTY_STATS: DashboardStats = {
    currentOrders: 0,
    currentRevenue: 0,
    activeOrders: 0,
    topItems: [],
    trendData: [],
    hourlyData: [],
    previousOrders: 0,
    previousRevenue: 0,
    cancelledOrders: 0,
    totalAllOrders: 0, // ← FIX
    tableRevenue: [],
    slowMovers: [],
    cancellationRate: 0,
    wowRevenue: { thisWeek: 0, lastWeek: 0, delta: 0 },
    categoryBreakdown: [],
  };
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  /* ── Data fetch ────────────────────────────────────────── */
  const fetchDashboardData = useCallback(
    async (restId: string, period: TimePeriod) => {
      try {
        const config = PERIOD_CFG[period];
        const now = new Date();
        const periodStart =
          period === "all"
            ? new Date("2020-01-01")
            : (() => {
                const d = new Date(now);
                d.setDate(d.getDate() - config.days);
                d.setHours(0, 0, 0, 0);
                return d;
              })();
        const compareStart = new Date(periodStart);
        if (period !== "all")
          compareStart.setDate(compareStart.getDate() - config.days);

        const [
          { data: currentOrders },
          { data: previousOrders },
          { data: recent },
        ] = await Promise.all([
          supabase
            .from("orders")
            .select("id, total, status, created_at")
            .eq("restaurant_id", restId)
            .gte("created_at", periodStart.toISOString())
            .order("created_at", { ascending: true })
            .neq("status", "cancelled")
            .eq("payment_status", "paid"),
          supabase
            .from("orders")
            .select("id, total")
            .eq("restaurant_id", restId)
            .gte("created_at", compareStart.toISOString())
            .lt("created_at", periodStart.toISOString()),
          supabase
            .from("orders")
            .select("id, order_number, table_number, status, total, created_at")
            .eq("restaurant_id", restId)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        // Table revenue
        const { data: tableOrders } = await supabase
          .from("orders")
          .select("table_number, total")
          .eq("restaurant_id", restId)
          .gte("created_at", periodStart.toISOString())
          .neq("status", "cancelled")
          .eq("payment_status", "paid");
        const tableMap = new Map<number, { revenue: number; orders: number }>();
        tableOrders?.forEach((o) => {
          const tableNum = Number(o.table_number); // ← ADD THIS
          const e = tableMap.get(tableNum) || { revenue: 0, orders: 0 };
          tableMap.set(tableNum, {
            revenue: e.revenue + o.total,
            orders: e.orders + 1,
          });
        });
        const tableRevenue = Array.from(tableMap.entries())
          .map(([table_number, v]) => ({
            table_number: Number(table_number),
            ...v,
          })) // ← ensure Number

          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 8);

        // Slow movers (last 30 days)
        const slowPeriodStart = new Date(now);
        slowPeriodStart.setDate(slowPeriodStart.getDate() - 30);
        const { data: slowOrds } = await supabase
          .from("orders")
          .select("id")
          .eq("restaurant_id", restId)
          .gte("created_at", slowPeriodStart.toISOString())
          .neq("status", "cancelled")
          .eq("payment_status", "paid");

        let slowMovers: SlowMover[] = [];
        if ((slowOrds?.length || 0) > 0) {
          const { data: slowItems } = await supabase
            .from("order_items")
            .select("name, quantity, menu_items(categories(name))")
            .in(
              "order_id",
              (slowOrds || []).map((o) => o.id),
            );
          const slowMap = new Map<
            string,
            { count: number; category: string }
          >();
          slowItems?.forEach((item: any) => {
            const e = slowMap.get(item.name) || {
              count: 0,
              category: item.menu_items?.categories?.name || "Uncategorized",
            };
            slowMap.set(item.name, {
              count: e.count + item.quantity,
              category: e.category,
            });
          });
          const allItems = Array.from(slowMap.entries()).map(([name, v]) => ({
            name,
            ...v,
          }));
          const avgCount =
            allItems.reduce((s, i) => s + i.count, 0) / allItems.length;

          slowMovers = allItems
            .filter((item) => item.count < avgCount * 0.3) // less than 30% of average
            .sort((a, b) => a.count - b.count)
            .slice(0, 5);
        }

        // ── FIX: store cancelledCount + totalAll in state ──────
        const { data: allPeriodOrders } = await supabase
          .from("orders")
          .select("status")
          .eq("restaurant_id", restId)
          .gte("created_at", periodStart.toISOString());
        const totalAllOrders = allPeriodOrders?.length || 0;
        const cancelledOrders =
          allPeriodOrders?.filter((o) => o.status === "cancelled").length || 0;
        const cancellationRate =
          totalAllOrders > 0
            ? Math.round((cancelledOrders / totalAllOrders) * 100)
            : 0;

        // WoW
        const thisWeekStart = new Date(now);
        thisWeekStart.setDate(thisWeekStart.getDate() - 7);
        thisWeekStart.setHours(0, 0, 0, 0);
        const lastWeekStart = new Date(thisWeekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const [{ data: twOrds }, { data: lwOrds }] = await Promise.all([
          supabase
            .from("orders")
            .select("total")
            .eq("restaurant_id", restId)
            .gte("created_at", thisWeekStart.toISOString())
            .neq("status", "cancelled")
            .eq("payment_status", "paid"),
          supabase
            .from("orders")
            .select("total")
            .eq("restaurant_id", restId)
            .gte("created_at", lastWeekStart.toISOString())
            .lt("created_at", thisWeekStart.toISOString())
            .neq("status", "cancelled")
            .eq("payment_status", "paid"),
        ]);
        const thisWeek = twOrds?.reduce((s, o) => s + o.total, 0) || 0;
        const lastWeek = lwOrds?.reduce((s, o) => s + o.total, 0) || 0;
        const wowDelta =
          lastWeek === 0
            ? thisWeek > 0
              ? 100
              : 0
            : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);

        // Category breakdown
        let categoryBreakdown: CategoryBreakdown[] = [];
        if ((currentOrders?.length || 0) > 0) {
          const { data: catItems } = await supabase
            .from("order_items")
            .select("quantity, price_at_time, menu_items(categories(name))")
            .in(
              "order_id",
              (currentOrders || []).map((o) => o.id),
            );
          const catMap = new Map<string, { revenue: number; orders: number }>();
          catItems?.forEach((item: any) => {
            const cat = item.menu_items?.categories?.name || "Uncategorized";
            const e = catMap.get(cat) || { revenue: 0, orders: 0 };
            catMap.set(cat, {
              revenue: e.revenue + item.price_at_time * item.quantity,
              orders: e.orders + item.quantity,
            });
          });
          categoryBreakdown = Array.from(catMap.entries())
            .map(([name, v]) => ({
              name,
              revenue: Math.round(v.revenue),
              orders: v.orders,
            }))
            .sort((a, b) => b.revenue - a.revenue);
        }

        // Top items
        let topItems: Array<{ name: string; count: number }> = [];
        if ((currentOrders?.length || 0) > 0) {
          const { data: oi } = await supabase
            .from("order_items")
            .select("name, quantity")
            .in(
              "order_id",
              (currentOrders || []).map((o) => o.id),
            );
          const ic = new Map<string, number>();
          oi?.forEach((item) => {
            ic.set(item.name, (ic.get(item.name) || 0) + item.quantity);
          });
          topItems = Array.from(ic.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        }

        const currentCount = currentOrders?.length || 0;
        const currentRevenue =
          currentOrders?.reduce((s, o) => s + o.total, 0) || 0;
        const activeOrders =
          currentOrders?.filter((o) =>
            ["pending", "confirmed", "preparing", "ready"].includes(o.status),
          ).length || 0;

        // Trend data
        let trendData: Array<{
          label: string;
          revenue: number;
          orders: number;
          avgOrder: number;
        }> = [];
        if (period === "24h") {
          const hm: Record<
            number,
            { revenue: number; orders: number; date: Date }
          > = {};
          for (let h = 0; h < 24; h++) {
            const d = new Date(now);
            d.setHours(now.getHours() - (23 - h), 0, 0, 0);
            hm[h] = { revenue: 0, orders: 0, date: d };
          }
          currentOrders?.forEach((o) => {
            const diff = Math.floor(
              (now.getTime() - new Date(o.created_at).getTime()) /
                (1000 * 60 * 60),
            );
            if (diff >= 0 && diff < 24) {
              const idx = 23 - diff;
              hm[idx].revenue += o.total;
              hm[idx].orders++;
            }
          });
          trendData = Object.values(hm).map((v) => ({
            label: v.date.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            revenue: Math.round(v.revenue),
            orders: v.orders,
            avgOrder: v.orders > 0 ? Math.round(v.revenue / v.orders) : 0,
          }));
        } else if (period === "7d" || period === "30d") {
          const dm = new Map<
            string,
            { revenue: number; orders: number; date: Date }
          >();
          for (let i = config.days - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            dm.set(d.toDateString(), { revenue: 0, orders: 0, date: d });
          }
          currentOrders?.forEach((o) => {
            const k = new Date(o.created_at).toDateString();
            if (dm.has(k)) {
              const c = dm.get(k)!;
              c.revenue += o.total;
              c.orders++;
            }
          });
          trendData = Array.from(dm.values()).map((v) => ({
            label: formatLabel(v.date, "day"),
            revenue: Math.round(v.revenue),
            orders: v.orders,
            avgOrder: v.orders > 0 ? Math.round(v.revenue / v.orders) : 0,
          }));
        } else if (period === "90d") {
          const pst = periodStart.getTime();
          const wm = new Map<number, { revenue: number; orders: number }>();
          for (let i = 0; i < 13; i++) wm.set(i, { revenue: 0, orders: 0 });
          currentOrders?.forEach((o) => {
            const idx = Math.floor(
              (new Date(o.created_at).getTime() - pst) / (7 * 24 * 3600 * 1000),
            );
            if (idx >= 0 && idx < 13) {
              const c = wm.get(idx)!;
              c.revenue += o.total;
              c.orders++;
            }
          });
          trendData = Array.from(wm.values()).map((v, i) => ({
            label: `Wk${i + 1}`,
            revenue: Math.round(v.revenue),
            orders: v.orders,
            avgOrder: v.orders > 0 ? Math.round(v.revenue / v.orders) : 0,
          }));
        } else {
          const months = period === "1y" ? 12 : 24;
          const mm = new Map<
            string,
            { revenue: number; orders: number; date: Date }
          >();
          for (let i = months - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setMonth(d.getMonth() - i);
            d.setDate(1);
            d.setHours(0, 0, 0, 0);
            mm.set(`${d.getFullYear()}-${d.getMonth()}`, {
              revenue: 0,
              orders: 0,
              date: d,
            });
          }
          currentOrders?.forEach((o) => {
            const d = new Date(o.created_at);
            const k = `${d.getFullYear()}-${d.getMonth()}`;
            if (mm.has(k)) {
              const c = mm.get(k)!;
              c.revenue += o.total;
              c.orders++;
            }
          });
          trendData = Array.from(mm.values()).map((v) => ({
            label: formatLabel(v.date, "month"),
            revenue: Math.round(v.revenue),
            orders: v.orders,
            avgOrder: v.orders > 0 ? Math.round(v.revenue / v.orders) : 0,
          }));
        }

        // Hourly today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const hm: Record<number, { orders: number; revenue: number }> = {};
        for (let h = 0; h < 24; h++) hm[h] = { orders: 0, revenue: 0 };
        currentOrders
          ?.filter((o) => new Date(o.created_at) >= today)
          .forEach((o) => {
            const h = new Date(o.created_at).getHours();
            hm[h].orders++;
            hm[h].revenue += o.total;
          });
        const hourlyData = Object.entries(hm)
          .filter(([h]) => Number(h) >= 8 && Number(h) <= 23)
          .map(([h, v]) => ({
            hour: `${String(h).padStart(2, "0")}:00`,
            orders: v.orders,
            revenue: Math.round(v.revenue),
          }));

        setStats({
          currentOrders: currentCount,
          currentRevenue,
          activeOrders,
          topItems,
          trendData,
          hourlyData,
          previousOrders: previousOrders?.length || 0,
          previousRevenue:
            previousOrders?.reduce((s, o) => s + (o as any).total, 0) || 0,
          cancelledOrders,
          totalAllOrders,
          tableRevenue,
          slowMovers,
          cancellationRate,
          wowRevenue: { thisWeek, lastWeek, delta: wowDelta },
          categoryBreakdown,
        });
        setRecentOrders(recent || []);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user.id)
        .single();
      if (!restaurant) {
        setLoading(false);
        return;
      }
      setRestaurantId(restaurant.id);
      const { data: sub } = await supabase
        .from("restaurant_subscriptions")
        .select("status")
        .eq("restaurant_id", restaurant.id)
        .single();
      setIsPro(["active", "trialing"].includes(sub?.status || ""));
      await fetchDashboardData(restaurant.id, timePeriod);
    };
    init();
  }, []);

  useEffect(() => {
    if (!restaurantId) return;
    if (!isPro && PERIOD_CFG[timePeriod].proOnly) {
      setTimePeriod("7d");
      return;
    }
    setLoading(true);
    fetchDashboardData(restaurantId, timePeriod);
  }, [timePeriod, restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    const ch = supabase
      .channel("dashboard-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchDashboardData(restaurantId, timePeriod);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [restaurantId, timePeriod, fetchDashboardData]);

  const sparkRevenue = stats.trendData.slice(-7).map((d) => d.revenue);
  const sparkOrders = stats.trendData.slice(-7).map((d) => d.orders);

  /* ── SKELETON LOADING STATE ─────────────────────────────── */
  if (loading && !stats.currentOrders) {
    return (
      <ProtectedRoute allowedRoles={["owner"]}>
        <DashboardLayout>
          <style>{`
            @keyframes tsSkeleton { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
            @keyframes tsFadeUp   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
          `}</style>
          {/* Header skeleton */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
              gap: 12,
            }}
          >
            <div>
              <Skeleton w={180} h={28} r={8} />
              <div style={{ marginTop: 8 }}>
                <Skeleton w={220} h={14} r={6} />
              </div>
            </div>
            <Skeleton w={80} h={32} r={100} />
          </div>
          {/* Period bar skeleton */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "12px 16px",
              border: "1px solid rgba(0,0,0,.06)",
              marginBottom: 20,
            }}
          >
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
              {[70, 50, 55, 55, 50, 50].map((w, i) => (
                <Skeleton key={i} w={w} h={32} r={10} />
              ))}
            </div>
          </div>
          {/* Stat cards skeleton */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
              gap: 14,
              marginBottom: 20,
            }}
          >
            {[0, 1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          {/* Chart skeleton */}
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              border: "1px solid rgba(0,0,0,.06)",
              overflow: "hidden",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid rgba(0,0,0,.05)",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div>
                <Skeleton w={140} h={16} r={6} />
                <div style={{ marginTop: 6 }}>
                  <Skeleton w={200} h={12} r={5} />
                </div>
              </div>
              <Skeleton w={140} h={34} r={10} />
            </div>
            <div style={{ padding: "20px 12px 12px" }}>
              <Skeleton w="100%" h={260} r={8} />
            </div>
          </div>
          {/* Bottom grid skeleton */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
              gap: 14,
            }}
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  background: "#fff",
                  borderRadius: 18,
                  border: "1px solid rgba(0,0,0,.06)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid rgba(0,0,0,.05)",
                  }}
                >
                  <Skeleton w={140} h={16} r={6} />
                </div>
                <div style={{ padding: 20 }}>
                  {[0, 1, 2, 3, 4].map((j) => (
                    <div key={j} style={{ marginBottom: 14 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 6,
                        }}
                      >
                        <Skeleton w="50%" h={13} r={5} />
                        <Skeleton w={50} h={13} r={5} />
                      </div>
                      <Skeleton w="100%" h={5} r={100} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  /* ── MAIN RENDER ─────────────────────────────────────────── */
  const CAT_COLORS = [
    "#f97316",
    "#6366f1",
    "#10b981",
    "#f59e0b",
    "#ec4899",
    "#3b82f6",
    "#8b5cf6",
  ];

  return (
    <ProtectedRoute allowedRoles={["owner"]}>
      <DashboardLayout>
        <style>{`
          @keyframes tsFadeUp   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
          @keyframes tsPulse    { 0%,100%{box-shadow:0 0 0 3px rgba(16,185,129,.2)} 50%{box-shadow:0 0 0 6px rgba(16,185,129,.08)} }
          @keyframes tsSkeleton { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

          .ts-page * { box-sizing: border-box; }

          /* responsive grid helpers */
          .ts-stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; }
          .ts-grid-3-2   { display:grid; grid-template-columns:3fr 2fr; gap:14px; margin-bottom:14px; }
          .ts-grid-2     { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px; }
          .ts-grid-2-bottom { display:grid; grid-template-columns:1fr 1fr; gap:14px; }

          @media (max-width: 1100px) {
            .ts-stats-grid { grid-template-columns: repeat(2,1fr); }
            .ts-grid-3-2   { grid-template-columns: 1fr; }
          }
          @media (max-width: 700px) {
            .ts-stats-grid { grid-template-columns: repeat(2,1fr); gap:10px; }
            .ts-grid-2     { grid-template-columns: 1fr; }
            .ts-grid-2-bottom { grid-template-columns: 1fr; }
          }
          @media (max-width: 440px) {
            .ts-stats-grid { grid-template-columns: 1fr; }
          }

          .ts-period-btn {
            padding:7px 14px; border-radius:10px; font-size:12px; font-weight:700;
            border:none; cursor:pointer; transition:all .15s; display:flex; align-items:center; gap:5px;
            background:transparent; color:#64748b; font-family:inherit;
          }
          .ts-period-btn:hover:not(:disabled) { background:#f1f5f9; }
          .ts-period-btn.ts-active { background:#f97316; color:#fff; box-shadow:0 4px 14px rgba(249,115,22,.35); }
          .ts-period-btn:disabled  { color:#cbd5e1; cursor:not-allowed; }

          .ts-chart-btn {
            padding:6px 12px; border-radius:8px; font-size:12px; font-weight:700;
            border:none; cursor:pointer; transition:all .15s; background:transparent;
            color:#94a3b8; font-family:inherit; text-transform:capitalize;
          }
          .ts-chart-btn.ts-active { background:#fff; color:#0f172a; box-shadow:0 1px 4px rgba(0,0,0,.08); }

          .ts-order-row { padding:13px 20px; border-bottom:1px solid rgba(0,0,0,.04); display:flex; align-items:center; gap:12px; transition:background .1s; cursor:default; }
          .ts-order-row:last-child { border-bottom:none; }
          .ts-order-row:hover { background:#f8f9fb; }

          .ts-bar-enter { animation: tsBarIn .8s cubic-bezier(.34,1.56,.64,1) both; }
          @keyframes tsBarIn { from{width:0} }

          .ts-pro-tag { font-size:9px; font-weight:800; background:linear-gradient(135deg,#f97316,#ea580c); color:#fff; padding:2px 7px; border-radius:100px; }

          .ts-view-all { display:flex; align-items:center; gap:3px; font-size:12px; font-weight:700; color:#f97316; text-decoration:none; }
          .ts-view-all:hover { text-decoration:underline; }
        `}</style>

        <div
          className="ts-page"
          style={{
            fontFamily: "'DM Sans',system-ui,sans-serif",
            color: "#0f172a",
          }}
        >
          {/* ── HEADER ─────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 22,
              flexWrap: "wrap" as const,
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "clamp(20px,3vw,26px)",
                  fontWeight: 900,
                  color: "#0f172a",
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  margin: 0,
                }}
              >
                Analytics
              </h1>
              <p
                style={{
                  fontSize: 13,
                  color: "#94a3b8",
                  marginTop: 4,
                  fontWeight: 500,
                }}
              >
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {loading && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "7px 14px",
                    background: "#fff",
                    border: "1px solid rgba(0,0,0,.06)",
                    borderRadius: 100,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#64748b",
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#f97316",
                      animation: "tsPulse 1s ease infinite",
                    }}
                  />
                  Refreshing…
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "7px 14px",
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,.06)",
                  borderRadius: 100,
                  boxShadow: "0 1px 6px rgba(0,0,0,.04)",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#10b981",
                    boxShadow: "0 0 0 3px rgba(16,185,129,.2)",
                    animation: "tsPulse 2s ease-in-out infinite",
                  }}
                />
                <span
                  style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}
                >
                  Live
                </span>
              </div>
            </div>
          </div>

          {/* ── PERIOD SELECTOR ────────────────────────────── */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "10px 14px",
              border: "1px solid rgba(0,0,0,.06)",
              boxShadow: "0 2px 10px rgba(0,0,0,.04)",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap" as const,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase" as const,
                letterSpacing: "0.06em",
                marginRight: 4,
              }}
            >
              <Calendar size={11} /> Period
            </div>
            {(Object.keys(PERIOD_CFG) as TimePeriod[]).map((p) => {
              const cfg = PERIOD_CFG[p];
              const locked = cfg.proOnly && !isPro;
              return (
                <button
                  key={p}
                  disabled={locked}
                  className={`ts-period-btn ${timePeriod === p ? "ts-active" : ""}`}
                  onClick={() => !locked && setTimePeriod(p)}
                >
                  {locked && <Lock size={10} />}
                  {cfg.label}
                  {cfg.proOnly && !isPro && (
                    <span className="ts-pro-tag">PRO</span>
                  )}
                </button>
              );
            })}
            {!isPro && (
              <Link
                href="/dashboard/pricing"
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#f97316",
                  textDecoration: "none",
                  padding: "6px 12px",
                  background: "rgba(249,115,22,.08)",
                  borderRadius: 8,
                }}
              >
                <Zap size={12} /> Unlock all
              </Link>
            )}
          </div>

          {/* ── STAT CARDS ──────────────────────────────────── */}
          <div className="ts-stats-grid">
            <StatCard
              icon={<ShoppingBag size={18} />}
              label={`Orders · ${PERIOD_CFG[timePeriod].label}`}
              value={String(stats.currentOrders)}
              trend={calcTrend(stats.currentOrders, stats.previousOrders)}
              trendLabel="vs previous period"
              accentColor="#3b82f6"
              sparkData={sparkOrders}
              delay={0}
            />
            <StatCard
              icon={<DollarSign size={18} />}
              label={`Revenue · ${PERIOD_CFG[timePeriod].label}`}
              value={fmtShort(stats.currentRevenue)}
              trend={calcTrend(stats.currentRevenue, stats.previousRevenue)}
              trendLabel="vs previous period"
              accentColor="#10b981"
              sparkData={sparkRevenue}
              delay={60}
            />
            <StatCard
              icon={<ChefHat size={18} />}
              label="Active Orders"
              value={String(stats.activeOrders)}
              trend={0}
              trendLabel="in kitchen right now"
              accentColor="#f97316"
              hideTrend
              delay={120}
            />
            <StatCard
              icon={<TrendingUp size={18} />}
              label="Avg. Order Value"
              value={
                stats.currentOrders > 0
                  ? fmt(Math.round(stats.currentRevenue / stats.currentOrders))
                  : "₹0"
              }
              trend={calcTrend(
                stats.currentOrders > 0
                  ? stats.currentRevenue / stats.currentOrders
                  : 0,
                stats.previousOrders > 0
                  ? stats.previousRevenue / stats.previousOrders
                  : 0,
              )}
              trendLabel="vs previous period"
              accentColor="#8b5cf6"
              delay={180}
            />
          </div>

          {/* ── MAIN TREND CHART ────────────────────────────── */}
          <div style={{ marginBottom: 14 }}>
            <Card>
              <CardHead>
                <div>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "#0f172a",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Performance Trend
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "#94a3b8",
                      marginTop: 2,
                      fontWeight: 500,
                    }}
                  >
                    Revenue & orders over {PERIOD_CFG[timePeriod].label}
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    background: "#f1f5f9",
                    borderRadius: 10,
                    padding: 3,
                    gap: 2,
                  }}
                >
                  {(["both", "revenue", "orders"] as const).map((m) => (
                    <button
                      key={m}
                      className={`ts-chart-btn ${activeChart === m ? "ts-active" : ""}`}
                      onClick={() => setActiveChart(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </CardHead>
              <div style={{ padding: "20px 8px 12px" }}>
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart
                    data={stats.trendData}
                    margin={{ top: 8, right: 20, left: 4, bottom: 4 }}
                  >
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#f97316"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#f97316"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f1f5f9"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#94a3b8", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval={timePeriod === "24h" ? 3 : "preserveStartEnd"}
                      dy={6}
                    />
                    {(activeChart === "both" || activeChart === "revenue") && (
                      <YAxis
                        yAxisId="rev"
                        orientation="left"
                        tick={{ fill: "#94a3b8", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) =>
                          `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                        }
                        width={52}
                      />
                    )}
                    {(activeChart === "both" || activeChart === "orders") && (
                      <YAxis
                        yAxisId="ord"
                        orientation="right"
                        tick={{ fill: "#94a3b8", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        width={28}
                        allowDecimals={false}
                      />
                    )}
                    <Tooltip content={<ChartTooltip />} />
                    {(activeChart === "both" || activeChart === "revenue") && (
                      <Area
                        yAxisId="rev"
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue (₹)"
                        stroke="#f97316"
                        strokeWidth={2.5}
                        fill="url(#revGrad)"
                        dot={{ r: 3, fill: "#f97316", strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: "#f97316" }}
                      />
                    )}
                    {(activeChart === "both" || activeChart === "orders") && (
                      <Line
                        yAxisId="ord"
                        type="monotone"
                        dataKey="orders"
                        name="Orders"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: "#6366f1" }}
                        strokeDasharray={
                          activeChart === "both" ? "6 3" : undefined
                        }
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* ── RUSH HOURS + AVG ORDER ───────────────────────── */}
          <div className="ts-grid-3-2">
            <Card>
              <CardHead>
                <div>
                  <p
                    style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}
                  >
                    Rush Hours
                  </p>
                  <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                    Today's order volume by hour
                  </p>
                </div>
                <Activity size={15} style={{ color: "#94a3b8" }} />
              </CardHead>
              <div style={{ padding: "16px 8px 12px" }}>
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart
                    data={stats.hourlyData}
                    barSize={14}
                    margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f1f5f9"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="hour"
                      tick={{ fill: "#94a3b8", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      interval={1}
                      dy={4}
                    />
                    <YAxis
                      tick={{ fill: "#94a3b8", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={22}
                      allowDecimals={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar
                      dataKey="orders"
                      name="Orders"
                      radius={[5, 5, 0, 0]}
                      fill="#fde5d1"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div style={{ position: "relative" }}>
              <Card>
                <CardHead>
                  <div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 7 }}
                    >
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: "#0f172a",
                        }}
                      >
                        Avg. Order
                      </p>
                      {!isPro && <ProBadge />}
                    </div>
                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                      Spend per order over time
                    </p>
                  </div>
                </CardHead>
                <div
                  style={{
                    padding: "16px 8px 12px",
                    filter: !isPro ? "blur(3px)" : "none",
                    pointerEvents: !isPro ? "none" : "auto",
                  }}
                >
                  <ResponsiveContainer width="100%" height={170}>
                    <AreaChart
                      data={stats.trendData}
                      margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="avgGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f1f5f9"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "#94a3b8", fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                        dy={4}
                      />
                      <YAxis
                        tick={{ fill: "#94a3b8", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `₹${v}`}
                        width={46}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="avgOrder"
                        name="Avg Order (₹)"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fill="url(#avgGrad)"
                        dot={{ r: 2.5, fill: "#10b981", strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              {!isPro && (
                <ProOverlay
                  title="Avg. Order Trend"
                  description="See how spend per order is shifting — find your most profitable times."
                />
              )}
            </div>
          </div>

          {/* ── WoW + CANCELLATION ──────────────────────────── */}
          <div className="ts-grid-2">
            {/* WoW Revenue */}
            <Card>
              <CardHead>
                <div>
                  <p
                    style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}
                  >
                    Week-over-Week
                  </p>
                  <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                    This week vs last week
                  </p>
                </div>
                <TrendingUp size={15} style={{ color: "#94a3b8" }} />
              </CardHead>
              <CardBody>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: 11,
                        color: "#94a3b8",
                        fontWeight: 600,
                        marginBottom: 3,
                      }}
                    >
                      This week
                    </p>
                    <p
                      style={{
                        fontSize: 28,
                        fontWeight: 900,
                        color: "#0f172a",
                        letterSpacing: "-0.04em",
                        lineHeight: 1,
                      }}
                    >
                      {fmtShort(stats.wowRevenue.thisWeek)}
                    </p>
                  </div>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "4px 9px",
                      borderRadius: 100,
                      marginBottom: 4,
                      background:
                        stats.wowRevenue.delta >= 0 ? "#ecfdf5" : "#fef2f2",
                      color:
                        stats.wowRevenue.delta >= 0 ? "#059669" : "#dc2626",
                    }}
                  >
                    {stats.wowRevenue.delta >= 0 ? (
                      <ArrowUpRight size={11} />
                    ) : (
                      <ArrowDownRight size={11} />
                    )}
                    {Math.abs(stats.wowRevenue.delta)}%
                  </span>
                </div>
                <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
                  <div>
                    <p
                      style={{
                        fontSize: 10,
                        color: "#94a3b8",
                        fontWeight: 600,
                        marginBottom: 2,
                      }}
                    >
                      Last week
                    </p>
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: "#475569",
                      }}
                    >
                      {fmtShort(stats.wowRevenue.lastWeek)}
                    </p>
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: 10,
                        color: "#94a3b8",
                        fontWeight: 600,
                        marginBottom: 2,
                      }}
                    >
                      Difference
                    </p>
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color:
                          stats.wowRevenue.delta >= 0 ? "#059669" : "#dc2626",
                      }}
                    >
                      {stats.wowRevenue.delta >= 0 ? "+" : ""}
                      {fmtShort(
                        Math.abs(
                          stats.wowRevenue.thisWeek - stats.wowRevenue.lastWeek,
                        ),
                      )}
                    </p>
                  </div>
                </div>
                {[
                  {
                    label: "This week",
                    value: stats.wowRevenue.thisWeek,
                    color: "#f97316",
                  },
                  {
                    label: "Last week",
                    value: stats.wowRevenue.lastWeek,
                    color: "#e2e8f0",
                  },
                ].map(({ label, value, color }) => {
                  const max = Math.max(
                    stats.wowRevenue.thisWeek,
                    stats.wowRevenue.lastWeek,
                    1,
                  );
                  return (
                    <div key={label} style={{ marginBottom: 8 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: "#94a3b8",
                            fontWeight: 600,
                          }}
                        >
                          {label}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#475569",
                          }}
                        >
                          {fmtShort(value)}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 6,
                          background: "#f1f5f9",
                          borderRadius: 100,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          className="ts-bar-enter"
                          style={{
                            height: "100%",
                            borderRadius: 100,
                            background: color,
                            width: `${Math.round((value / max) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardBody>
            </Card>

            {/* Cancellation Rate — FIX: use stats.totalAllOrders + stats.cancelledOrders */}
            <Card>
              <CardHead>
                <div>
                  <p
                    style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}
                  >
                    Cancellation Rate
                  </p>
                  <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                    For selected period
                  </p>
                </div>
              </CardHead>
              <CardBody
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  paddingTop: 20,
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: 120,
                    height: 120,
                    marginBottom: 16,
                  }}
                >
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="48"
                      fill="none"
                      stroke="#f1f5f9"
                      strokeWidth="14"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="48"
                      fill="none"
                      stroke={
                        stats.cancellationRate > 20
                          ? "#ef4444"
                          : stats.cancellationRate > 10
                            ? "#f59e0b"
                            : "#10b981"
                      }
                      strokeWidth="14"
                      strokeLinecap="round"
                      strokeDasharray={`${(stats.cancellationRate / 100) * 301.6} 301.6`}
                      transform="rotate(-90 60 60)"
                      style={{
                        transition:
                          "stroke-dasharray 1s cubic-bezier(.34,1.56,.64,1)",
                      }}
                    />
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 24,
                        fontWeight: 900,
                        color: "#0f172a",
                        lineHeight: 1,
                      }}
                    >
                      {stats.cancellationRate}%
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: "#94a3b8",
                        fontWeight: 600,
                      }}
                    >
                      rate
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 24,
                    textAlign: "center",
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: 18,
                        fontWeight: 900,
                        color: "#0f172a",
                      }}
                    >
                      {stats.cancelledOrders}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: "#94a3b8",
                        fontWeight: 600,
                      }}
                    >
                      Cancelled
                    </p>
                  </div>
                  <div style={{ width: 1, background: "rgba(0,0,0,.06)" }} />
                  <div>
                    <p
                      style={{
                        fontSize: 18,
                        fontWeight: 900,
                        color: "#0f172a",
                      }}
                    >
                      {stats.totalAllOrders}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: "#94a3b8",
                        fontWeight: 600,
                      }}
                    >
                      Total orders
                    </p>
                  </div>
                </div>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color:
                      stats.cancellationRate > 20
                        ? "#dc2626"
                        : stats.cancellationRate > 10
                          ? "#d97706"
                          : "#059669",
                    background:
                      stats.cancellationRate > 20
                        ? "#fef2f2"
                        : stats.cancellationRate > 10
                          ? "#fffbeb"
                          : "#ecfdf5",
                    padding: "5px 14px",
                    borderRadius: 100,
                  }}
                >
                  {stats.cancellationRate > 20
                    ? "⚠ High — investigate causes"
                    : stats.cancellationRate > 10
                      ? "Moderate — monitor closely"
                      : "✓ Healthy cancellation rate"}
                </p>
              </CardBody>
            </Card>
          </div>

          {/* ── TABLE REVENUE + CATEGORY BREAKDOWN ──────────── */}
          <div className="ts-grid-2">
            <div style={{ position: "relative" }}>
              <Card>
                <CardHead>
                  <div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 7 }}
                    >
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: "#0f172a",
                        }}
                      >
                        Revenue by Table
                      </p>
                      {!isPro && <ProBadge />}
                    </div>
                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                      Top earning tables
                    </p>
                  </div>
                </CardHead>
                <CardBody
                  style={{
                    filter: !isPro ? "blur(3px)" : "none",
                    pointerEvents: !isPro ? "none" : "auto",
                  }}
                >
                  {stats.tableRevenue.length === 0 ? (
                    <Empty
                      icon={<UtensilsCrossed size={32} />}
                      text="No data yet"
                    />
                  ) : (
                    stats.tableRevenue.map((t, i) => {
                      const max = stats.tableRevenue[0].revenue;
                      return (
                        <div key={t.table_number} style={{ marginBottom: 12 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 5,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <span
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 9,
                                  flexShrink: 0,
                                  background:
                                    i === 0
                                      ? "linear-gradient(135deg,#f97316,#ea580c)"
                                      : "#f1f5f9",
                                  color: i === 0 ? "#fff" : "#475569",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 11,
                                  fontWeight: 900,
                                }}
                              >
                                T{t.table_number}
                              </span>
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "#94a3b8",
                                  fontWeight: 600,
                                }}
                              >
                                {t.orders} order{t.orders !== 1 ? "s" : ""}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 800,
                                color: "#0f172a",
                              }}
                            >
                              {fmtShort(t.revenue)}
                            </span>
                          </div>
                          <div
                            style={{
                              height: 5,
                              background: "#f1f5f9",
                              borderRadius: 100,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              className="ts-bar-enter"
                              style={{
                                height: "100%",
                                borderRadius: 100,
                                background:
                                  i === 0
                                    ? "linear-gradient(90deg,#f97316,#ea580c)"
                                    : "rgba(249,115,22,.22)",
                                width: `${Math.round((t.revenue / max) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardBody>
              </Card>
              {!isPro && (
                <ProOverlay
                  title="Revenue by Table"
                  description="See which tables drive the most revenue and optimize your layout."
                />
              )}
            </div>

            <div style={{ position: "relative" }}>
              <Card>
                <CardHead>
                  <div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 7 }}
                    >
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: "#0f172a",
                        }}
                      >
                        Category Breakdown
                      </p>
                      {!isPro && <ProBadge />}
                    </div>
                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                      Revenue share by menu category
                    </p>
                  </div>
                </CardHead>
                <CardBody
                  style={{
                    filter: !isPro ? "blur(3px)" : "none",
                    pointerEvents: !isPro ? "none" : "auto",
                  }}
                >
                  {stats.categoryBreakdown.length === 0 ? (
                    <Empty icon={<BarChart3 size={32} />} text="No data yet" />
                  ) : (
                    (() => {
                      const total =
                        stats.categoryBreakdown.reduce(
                          (s, c) => s + c.revenue,
                          0,
                        ) || 1;
                      return stats.categoryBreakdown.map((cat, i) => {
                        const pct = Math.round((cat.revenue / total) * 100);
                        return (
                          <div key={cat.name} style={{ marginBottom: 12 }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 5,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 7,
                                }}
                              >
                                <span
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    background:
                                      CAT_COLORS[i % CAT_COLORS.length],
                                    flexShrink: 0,
                                  }}
                                />
                                <span
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "#0f172a",
                                  }}
                                >
                                  {cat.name}
                                </span>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: "#94a3b8",
                                    fontWeight: 600,
                                  }}
                                >
                                  {pct}%
                                </span>
                                <span
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 800,
                                    color: "#0f172a",
                                  }}
                                >
                                  {fmtShort(cat.revenue)}
                                </span>
                              </div>
                            </div>
                            <div
                              style={{
                                height: 5,
                                background: "#f1f5f9",
                                borderRadius: 100,
                                overflow: "hidden",
                              }}
                            >
                              <div
                                className="ts-bar-enter"
                                style={{
                                  height: "100%",
                                  borderRadius: 100,
                                  background: CAT_COLORS[i % CAT_COLORS.length],
                                  width: `${pct}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()
                  )}
                </CardBody>
              </Card>
              {!isPro && (
                <ProOverlay
                  title="Category Breakdown"
                  description="Discover which menu categories drive the most revenue."
                />
              )}
            </div>
          </div>

          {/* ── SLOW MOVERS ─────────────────────────────────── */}
          <div style={{ position: "relative", marginBottom: 14 }}>
            <Card>
              <CardHead>
                <div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 7 }}
                  >
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "#0f172a",
                      }}
                    >
                      Slow Movers
                    </p>
                    {!isPro && <ProBadge />}
                  </div>
                  <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                    Least ordered items — last 30 days
                  </p>
                </div>
              </CardHead>
              <div
                style={{
                  filter: !isPro ? "blur(3px)" : "none",
                  pointerEvents: !isPro ? "none" : "auto",
                }}
              >
                {stats.slowMovers.length === 0 ? (
                  <Empty
                    icon={<UtensilsCrossed size={32} />}
                    text="No data yet"
                  />
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
                      gap: 0,
                      borderTop: "1px solid rgba(0,0,0,.05)",
                    }}
                  >
                    {stats.slowMovers.map((item) => (
                      <div
                        key={item.name}
                        style={{
                          padding: "14px 18px",
                          borderRight: "1px solid rgba(0,0,0,.05)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginBottom: 6,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 800,
                              padding: "2px 7px",
                              borderRadius: 100,
                              background: "#fef2f2",
                              color: "#dc2626",
                            }}
                          >
                            SLOW
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              color: "#94a3b8",
                              fontWeight: 600,
                            }}
                          >
                            {item.category}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#0f172a",
                            marginBottom: 4,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.name}
                        </p>
                        <p
                          style={{
                            fontSize: 22,
                            fontWeight: 900,
                            color: "#dc2626",
                            lineHeight: 1,
                          }}
                        >
                          {item.count}{" "}
                          <span
                            style={{
                              fontSize: 12,
                              color: "#94a3b8",
                              fontWeight: 600,
                            }}
                          >
                            sold
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
            {!isPro && (
              <ProOverlay
                title="Slow Mover Report"
                description="Find dead-weight items dragging down your menu. Remove or reprice to boost average order value."
              />
            )}
          </div>

          {/* ── RECENT ORDERS + TOP SELLERS ─────────────────── */}
          <div className="ts-grid-2-bottom">
            <Card>
              <CardHead>
                <div>
                  <p
                    style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}
                  >
                    Recent Orders
                  </p>
                  <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                    Latest 5
                  </p>
                </div>
                <Link href="/dashboard/orders" className="ts-view-all">
                  View all <ChevronRight size={13} />
                </Link>
              </CardHead>
              {recentOrders.length === 0 ? (
                <Empty icon={<ShoppingBag size={36} />} text="No orders yet" />
              ) : (
                recentOrders.slice(0, 5).map((o) => {
                  const sm = STATUS_META[o.status] || STATUS_META.served;
                  return (
                    <div key={o.id} className="ts-order-row">
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: "#f8f9fb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 900,
                          color: "#0f172a",
                          flexShrink: 0,
                          border: "1px solid rgba(0,0,0,.06)",
                        }}
                      >
                        T{o.table_number}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                            marginBottom: 3,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#0f172a",
                            }}
                          >
                            Table {o.table_number}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              color: "#94a3b8",
                              background: "#f1f5f9",
                              padding: "2px 7px",
                              borderRadius: 100,
                              fontWeight: 600,
                            }}
                          >
                            #{o.order_number}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <span
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: "50%",
                              background: sm.dot,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: sm.textColor,
                            }}
                          >
                            {sm.label}
                          </span>
                          <span style={{ color: "#cbd5e1", fontSize: 11 }}>
                            ·
                          </span>
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>
                            {formatTime(o.created_at)}
                          </span>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: "#0f172a",
                          flexShrink: 0,
                        }}
                      >
                        {fmt(o.total)}
                      </span>
                    </div>
                  );
                })
              )}
            </Card>

            <Card>
              <CardHead>
                <div>
                  <p
                    style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}
                  >
                    Top Sellers
                  </p>
                  <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                    {PERIOD_CFG[timePeriod].label} bestsellers
                  </p>
                </div>
                <Flame size={15} style={{ color: "#f97316" }} />
              </CardHead>
              <CardBody>
                {stats.topItems.length === 0 ? (
                  <Empty
                    icon={<UtensilsCrossed size={32} />}
                    text="No sales data yet"
                  />
                ) : (
                  stats.topItems.map((item, i) => {
                    const pct = Math.round(
                      (item.count / stats.topItems[0].count) * 100,
                    );
                    const rankBgs = [
                      "linear-gradient(135deg,#f97316,#ea580c)",
                      "rgba(249,115,22,.15)",
                      "#f1f5f9",
                      "#f1f5f9",
                      "#f1f5f9",
                    ];
                    const rankColors = [
                      "#fff",
                      "#f97316",
                      "#64748b",
                      "#94a3b8",
                      "#94a3b8",
                    ];
                    const barBgs = [
                      "linear-gradient(90deg,#f97316,#ea580c)",
                      "rgba(249,115,22,.5)",
                      "rgba(249,115,22,.3)",
                      "rgba(249,115,22,.2)",
                      "rgba(249,115,22,.15)",
                    ];
                    return (
                      <div key={item.name} style={{ marginBottom: 14 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 6,
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              minWidth: 0,
                            }}
                          >
                            <span
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 7,
                                background: rankBgs[i] || rankBgs[4],
                                color: rankColors[i] || rankColors[4],
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 10,
                                fontWeight: 900,
                                flexShrink: 0,
                              }}
                            >
                              {i + 1}
                            </span>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#0f172a",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: 160,
                              }}
                            >
                              {item.name}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              flexShrink: 0,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 800,
                                color: "#0f172a",
                              }}
                            >
                              {item.count}
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                color: "#94a3b8",
                                fontWeight: 600,
                              }}
                            >
                              sold
                            </span>
                            {i === 0 && (
                              <span style={{ fontSize: 14 }}>🔥</span>
                            )}
                          </div>
                        </div>
                        <div
                          style={{
                            height: 4,
                            background: "#f1f5f9",
                            borderRadius: 100,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            className="ts-bar-enter"
                            style={{
                              height: "100%",
                              borderRadius: 100,
                              background: barBgs[i] || barBgs[4],
                              width: `${pct}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
                {!isPro && stats.topItems.length > 0 && (
                  <div
                    style={{
                      marginTop: 4,
                      padding: "11px 13px",
                      background:
                        "linear-gradient(135deg,rgba(249,115,22,.04),rgba(234,88,12,.02))",
                      border: "1px solid rgba(249,115,22,.1)",
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Star
                      size={13}
                      style={{ color: "#f97316", flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: "#92400e",
                          marginBottom: 2,
                        }}
                      >
                        See all-time bestsellers
                      </p>
                      <p style={{ fontSize: 11, color: "#b45309" }}>
                        Pro unlocks lifetime sales history
                      </p>
                    </div>
                    <Link
                      href="/dashboard/pricing"
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#f97316",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Upgrade <ChevronRight size={11} />
                    </Link>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
