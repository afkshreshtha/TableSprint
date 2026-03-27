"use client";

import { ReactNode, useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Table as TableIcon,
  Settings,
  History,
  Menu as MenuIcon,
  X,
  LogOut,
  User,
  Users,
  CreditCard,
  Lock,
  Zap,
  Palette,
  Bell,
  BellRing,
  ShoppingCart,
  XCircle,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/authContext";
import { supabase } from "@/lib/supabase/client";

interface DashboardLayoutProps {
  children: ReactNode;
  restaurantName?: string;
}

// ── Notification types ────────────────────────────────────────
type NotifEvent = "new_order" | "cancelled" | "status_changed" | "payment";

interface Notification {
  id: string;
  event: NotifEvent;
  title: string;
  body: string;
  time: Date;
  read: boolean;
  orderId?: string;
  orderNumber?: string;
}

const EVENT_META: Record<
  NotifEvent,
  { icon: typeof ShoppingCart; color: string; bg: string; border: string }
> = {
  new_order: {
    icon: ShoppingCart,
    color: "#22c55e",
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.2)",
  },
  cancelled: {
    icon: XCircle,
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.2)",
  },
  status_changed: {
    icon: RefreshCw,
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.1)",
    border: "rgba(59,130,246,0.2)",
  },
  payment: {
    icon: CheckCircle,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.2)",
  },
};

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    proOnly: false,
  },
  {
    name: "Live Orders",
    href: "/dashboard/orders",
    icon: ShoppingBag,
    proOnly: false,
  },
  {
    name: "Menu",
    href: "/dashboard/menu",
    icon: UtensilsCrossed,
    proOnly: false,
  },
  {
    name: "Tables",
    href: "/dashboard/tables",
    icon: TableIcon,
    proOnly: false,
  },
  {
    name: "Order History",
    href: "/dashboard/order-history",
    icon: History,
    proOnly: false,
  },
  {
    name: "Manage Staff",
    href: "/dashboard/staff",
    icon: Users,
    proOnly: true,
  },
  { name: "Theme", href: "/dashboard/theme", icon: Palette, proOnly: false },
  {
    name: "Subscription",
    href: "/dashboard/pricing",
    icon: CreditCard,
    proOnly: false,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    proOnly: false,
  },
];

// ── Sound generator (Web Audio API — no external file needed) ─
function useNotificationSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSound = useCallback((event: NotifEvent) => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
      }
      const ctx = audioCtxRef.current;

      const configs: Record<
        NotifEvent,
        { freqs: number[]; type: OscillatorType; duration: number }
      > = {
        new_order: { freqs: [523, 659, 784], type: "sine", duration: 0.15 },
        cancelled: { freqs: [400, 300], type: "sawtooth", duration: 0.18 },
        status_changed: { freqs: [440, 550], type: "sine", duration: 0.12 },
        payment: { freqs: [523, 659, 784, 1047], type: "sine", duration: 0.12 },
      };

      const { freqs, type, duration } = configs[event];
      let startTime = ctx.currentTime;

      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
        startTime += duration * 0.85;
      });
    } catch (e) {
      // Audio blocked before user interaction — silently ignore
    }
  }, []);

  return playSound;
}

// ── Push notification helper ──────────────────────────────────
async function sendPushNotification(
  title: string,
  body: string,
  orderId?: string,
) {
  if (typeof window === "undefined") return;
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
  if (Notification.permission === "granted") {
    const n = new Notification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: orderId ?? "dashboard",
     
    });
    n.onclick = () => {
      window.focus();
      if (orderId) window.location.href = `/dashboard/orders`;
    };
  }
}

// ────────────────────────────────────────────────────────────────
export default function DashboardLayout({
  children,
  restaurantName = "Restaurant",
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [bellShake, setBellShake] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const playSound = useNotificationSound();

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── Add notification ────────────────────────────────────────
  const addNotification = useCallback(
    async (
      event: NotifEvent,
      title: string,
      body: string,
      orderId?: string,
      orderNumber?: string,
    ) => {
      const notif: Notification = {
        id: `${Date.now()}-${Math.random()}`,
        event,
        title,
        body,
        time: new Date(),
        read: false,
        orderId,
        orderNumber,
      };
      setNotifications((prev) => [notif, ...prev].slice(0, 50)); // keep last 50

      // Bell shake animation
      setBellShake(true);
      setTimeout(() => setBellShake(false), 600);

      // Sound
      playSound(event);

      // Browser push
      await sendPushNotification(title, body, orderId);
    },
    [playSound],
  );

  // ── Fetch restaurant & subscription ────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (!restaurant) return;
      setRestaurantId(restaurant.id);

      const { data: sub } = await supabase
        .from("restaurant_subscriptions")
        .select("status,current_period_end")
        .eq("restaurant_id", restaurant.id)
        .single();
      const isStatusOk = ["active", "trialing"].includes(sub?.status ?? "");
      const isNotExpired =
        !sub?.current_period_end ||
        new Date(sub.current_period_end) > new Date();
      setIsPro(isStatusOk && isNotExpired);
    })();
  }, [user]);

  // ── Supabase realtime subscription ─────────────────────────
  useEffect(() => {
    if (!restaurantId) return;

    // Request push permission early
    if (
      typeof window !== "undefined" &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }

    const channel = supabase
      .channel(`dashboard-notifs-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const order = payload.new as any;
          addNotification(
            "new_order",
            "🛒 New Order Placed!",
            `Order #${order.order_number} · Table ${order.table_number} · ₹${Number(order.total).toFixed(0)}`,
            order.id,
            order.order_number,
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const oldOrder = payload.old as any;
          const newOrder = payload.new as any;

          // Skip if status didn't change
          if (
            oldOrder.status === newOrder.status &&
            oldOrder.payment_status === newOrder.payment_status
          )
            return;

          // Cancelled by customer
          if (
            oldOrder.status !== "cancelled" &&
            newOrder.status === "cancelled"
          ) {
            addNotification(
              "cancelled",
              "❌ Order Cancelled",
              `Order #${newOrder.order_number} · Table ${newOrder.table_number} was cancelled by customer`,
              newOrder.id,
              newOrder.order_number,
            );
            return;
          }

          // Payment received
          if (
            oldOrder.payment_status !== "paid" &&
            newOrder.payment_status === "paid" &&
            oldOrder.status === newOrder.status // ← add this guard
          ) {
            addNotification(
              "payment",
              "💰 Payment Received",
              `Order #${newOrder.order_number} · ₹${Number(newOrder.total).toFixed(0)} paid via ${newOrder.payment_method}`,
              newOrder.id,
              newOrder.order_number,
            );
            return;
          }

          // Other status change (confirmed, preparing, ready, served)
          if (oldOrder.status !== newOrder.status) {
            const labels: Record<string, string> = {
              confirmed: "Confirmed",
              preparing: "Preparing",
              ready: "Ready to Serve",
              served: "Served",
            };
            const label = labels[newOrder.status] ?? newOrder.status;
            addNotification(
              "status_changed",
              `🔄 Order ${label}`,
              `Order #${newOrder.order_number} · Table ${newOrder.table_number} is now ${label}`,
              newOrder.id,
              newOrder.order_number,
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, addNotification]);

  // ── Close bell dropdown on outside click ───────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Pro route guard ─────────────────────────────────────────
  useEffect(() => {
    if (isPro === null) return;
    const currentNav = navigation.find((item) => item.href === pathname);
    if (currentNav?.proOnly && !isPro) {
      router.replace("/dashboard/pricing?upgrade=staff");
    }
  }, [pathname, isPro, router]);

  const handleSignOut = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      setSigningOut(true);
      await signOut();
    }
  };

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const clearAll = () => setNotifications([]);
  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @keyframes bell-shake {
          0%,100% { transform: rotate(0deg); }
          15%      { transform: rotate(14deg); }
          30%      { transform: rotate(-14deg); }
          45%      { transform: rotate(10deg); }
          60%      { transform: rotate(-10deg); }
          75%      { transform: rotate(6deg); }
          90%      { transform: rotate(-4deg); }
        }
        .bell-shake { animation: bell-shake 0.6s ease; }

        @keyframes notif-slide-in {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .notif-slide-in { animation: notif-slide-in 0.2s ease forwards; }

        .notif-item:hover { background: rgba(249,115,22,0.04); }

        /* Thin scrollbar for notif list */
        .notif-scroll::-webkit-scrollbar       { width: 4px; }
        .notif-scroll::-webkit-scrollbar-track { background: transparent; }
        .notif-scroll::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
      `}</style>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                TableSprint
              </span>
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
            <p className="text-sm font-medium text-gray-900">
              {restaurantName}
            </p>
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
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive ? "bg-orange-50 text-orange-600" : "text-gray-700 hover:bg-gray-100"}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={`w-5 h-5 mr-3 ${isActive ? "text-orange-600" : "text-gray-400"}`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Pro upgrade nudge */}
          {isPro === false && (
            <div className="mx-4 mb-3 p-3 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <Zap className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-900">
                  Upgrade to Pro
                </span>
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

          {/* User info & sign out */}
          <div className="border-t border-gray-200">
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.email ?? "User"}
                  </p>
                  <p className="text-xs">
                    {isPro ? (
                      <span className="text-emerald-600 font-medium">
                        Pro Plan
                      </span>
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
                {signingOut ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
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
              {navigation.find((item) => item.href === pathname)?.name ??
                "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* User email (desktop) */}
            <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{user?.email}</span>
            </div>

            {/* ── Bell icon ── */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => {
                  setBellOpen((o) => !o);
                  if (!bellOpen) markAllRead();
                }}
                className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-orange-50 transition-colors"
                aria-label="Notifications"
              >
                {unreadCount > 0 ? (
                  <BellRing
                    className={`w-5 h-5 text-orange-600 ${bellShake ? "bell-shake" : ""}`}
                  />
                ) : (
                  <Bell
                    className={`w-5 h-5 text-gray-500 ${bellShake ? "bell-shake" : ""}`}
                  />
                )}
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {/* ── Dropdown ── */}
              {bellOpen && (
                <div className="notif-slide-in absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-semibold text-gray-900">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span className="text-xs bg-orange-100 text-orange-700 font-bold px-1.5 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <button
                      onClick={clearAll}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors font-medium"
                    >
                      Clear all
                    </button>
                  </div>

                  {/* List */}
                  <div className="notif-scroll overflow-y-auto max-h-[380px]">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center">
                        <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">
                          No notifications yet
                        </p>
                        <p className="text-xs text-gray-300 mt-1">
                          Orders will appear here in real time
                        </p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const meta = EVENT_META[n.event];
                        const Icon = meta.icon;
                        return (
                          <Link
                            key={n.id}
                            href="/dashboard/orders"
                            onClick={() => setBellOpen(false)}
                            className="notif-item flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 transition-colors cursor-pointer"
                            style={{
                              background: n.read
                                ? "transparent"
                                : "rgba(249,115,22,0.03)",
                            }}
                          >
                            {/* Icon circle */}
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{
                                background: meta.bg,
                                border: `1px solid ${meta.border}`,
                              }}
                            >
                              <Icon
                                style={{ color: meta.color }}
                                className="w-4 h-4"
                              />
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-gray-900 leading-snug">
                                  {n.title}
                                </p>
                                <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">
                                  {formatTime(n.time)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                {n.body}
                              </p>
                            </div>

                            {/* Unread dot */}
                            {!n.read && (
                              <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </Link>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                      <Link
                        href="/dashboard/orders"
                        onClick={() => setBellOpen(false)}
                        className="text-xs text-orange-600 font-semibold hover:text-orange-700 transition-colors"
                      >
                        View all live orders →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className={pathname === "/dashboard/theme" ? "" : "p-4 lg:p-8"}>
          {children}
        </main>
      </div>
    </div>
  );
}
