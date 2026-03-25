// app/orders/page.tsx
"use client";

import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  RestaurantTheme,
  DEFAULT_THEME,
  FONT_PAIRS,
  hexA,
  isDarkColor,
} from "@/types/theme";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  restaurant_id: string;
  table_number: number;
}

interface Restaurant {
  id: string;
  name: string;
  theme?: Partial<RestaurantTheme>;
}

const STATUS_MAP = {
  pending:   { label: "Pending",   emoji: "📝", accent: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)"  },
  confirmed: { label: "Confirmed", emoji: "✅", accent: "#3b82f6", bg: "rgba(59,130,246,0.1)",   border: "rgba(59,130,246,0.25)"  },
  preparing: { label: "Preparing", emoji: "👨‍🍳", accent: "#a855f7", bg: "rgba(168,85,247,0.1)",  border: "rgba(168,85,247,0.25)"  },
  ready:     { label: "Ready",     emoji: "🔔", accent: "#22c55e", bg: "rgba(34,197,94,0.1)",    border: "rgba(34,197,94,0.25)"   },
  served:    { label: "Served",    emoji: "🍽️", accent: "#8a7d6a", bg: "rgba(138,125,106,0.1)", border: "rgba(138,125,106,0.25)" },
  cancelled: { label: "Cancelled", emoji: "❌", accent: "#ef4444", bg: "rgba(239,68,68,0.1)",    border: "rgba(239,68,68,0.25)"   },
};

// Statuses where cancellation is still allowed (kitchen hasn't started yet)
const CANCELLABLE_STATUSES = ["pending", "confirmed"];

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');

  .op__root { min-height:100vh; background:#0f0d0a; font-family:'DM Sans',sans-serif; color:#f0ebe3; }

  .op__header {
    background: linear-gradient(150deg, rgba(232,160,69,.09) 0%, #0f0d0a 55%);
    border-bottom: 1px solid rgba(255,255,255,.07);
    padding: 40px 20px 28px; position:relative; overflow:hidden;
  }
  .op__header::before {
    content:''; position:absolute; inset:0; pointer-events:none;
    background: radial-gradient(ellipse 60% 100% at 90% 0%, rgba(232,160,69,.1) 0%, transparent 70%);
  }
  .op__inner { max-width:560px; margin:0 auto; position:relative; }
  .op__badge {
    display:inline-flex; align-items:center; gap:6px;
    background:rgba(232,160,69,.12); border:1px solid rgba(232,160,69,.25); color:#e8a045;
    font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase;
    padding:4px 12px; border-radius:100px; margin-bottom:14px;
  }
  .op__bdot { width:5px; height:5px; border-radius:50%; background:#e8a045; animation:op__pulse 2s infinite; }
  @keyframes op__pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  .op__title {
    font-family:'Playfair Display',serif; font-size:clamp(28px,7vw,40px); font-weight:900;
    color:#f0ebe3; line-height:1.05; margin-bottom:6px;
  }
  .op__title em { font-style:italic; color:#e8a045; }
  .op__sub { font-size:13px; color:rgba(240,235,227,.5); }
  .op__divider { width:40px; height:2px; background:#e8a045; opacity:.7; margin-top:16px; }

  .op__stats { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; padding:20px 16px 0; max-width:560px; margin:0 auto; }
  .op__stat { background:#1a1610; border:1px solid rgba(255,255,255,.07); border-radius:14px; padding:14px 12px; text-align:center; }
  .op__stat-val { font-family:'Playfair Display',serif; font-size:22px; font-weight:900; color:#e8a045; line-height:1; margin-bottom:4px; }
  .op__stat-lbl { font-size:10px; color:rgba(240,235,227,.3); text-transform:uppercase; letter-spacing:1px; font-weight:600; }

  .op__body { max-width:560px; margin:0 auto; padding:20px 16px 48px; }
  .op__slbl { font-size:10px; font-weight:700; color:rgba(240,235,227,.28); text-transform:uppercase; letter-spacing:2px; margin-bottom:12px; margin-top:24px; display:block; }

  /* Loading / empty / error */
  .op__center { display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:64px 20px; }
  .op__center-icon { width:80px; height:80px; border-radius:50%; background:rgba(240,235,227,.04); border:1px solid rgba(255,255,255,.07); display:flex; align-items:center; justify-content:center; font-size:36px; margin-bottom:24px; }
  .op__center-title { font-family:'Playfair Display',serif; font-size:22px; font-weight:700; color:#f0ebe3; margin-bottom:8px; }
  .op__center-sub { font-size:14px; color:rgba(240,235,227,.5); margin-bottom:24px; line-height:1.6; max-width:320px; }
  .op__btn { display:inline-flex; align-items:center; gap:6px; background:#e8a045; color:#0f0d0a; border:none; border-radius:100px; padding:12px 24px; font-size:14px; font-weight:700; cursor:pointer; text-decoration:none; font-family:'DM Sans',sans-serif; transition:opacity .2s; }
  .op__btn:hover { opacity:.85; }
  .op__btn-ghost { display:inline-flex; align-items:center; gap:6px; background:rgba(240,235,227,.04); color:rgba(240,235,227,.5); border:1px solid rgba(255,255,255,.07); border-radius:100px; padding:12px 24px; font-size:14px; font-weight:600; cursor:pointer; text-decoration:none; font-family:'DM Sans',sans-serif; transition:all .2s; margin-left:10px; }
  .op__btn-ghost:hover { border-color:rgba(232,160,69,.3); color:#e8a045; }
  .op__loader { animation:op__spin 1s linear infinite; }
  @keyframes op__spin { to { transform:rotate(360deg); } }

  /* Cancel confirm modal */
  .op__modal-backdrop {
    position:fixed; inset:0; z-index:999;
    background:rgba(0,0,0,0.75); backdrop-filter:blur(4px);
    display:flex; align-items:flex-end; justify-content:center;
    padding:0 16px 32px;
    animation:op__fadein .2s ease;
  }
  @keyframes op__fadein { from{opacity:0} to{opacity:1} }
  .op__modal {
    width:100%; max-width:480px;
    background:#1a1610; border:1px solid rgba(255,255,255,0.1);
    border-radius:24px; padding:28px 24px;
    animation:op__slideup .25s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes op__slideup { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
  .op__modal-icon { font-size:36px; margin-bottom:14px; }
  .op__modal-title { font-family:'Playfair Display',serif; font-size:20px; font-weight:700; color:#f0ebe3; margin-bottom:8px; }
  .op__modal-sub { font-size:13px; color:rgba(240,235,227,.5); line-height:1.6; margin-bottom:24px; }
  .op__modal-order {
    background:rgba(239,68,68,0.06); border:1px solid rgba(239,68,68,0.15);
    border-radius:12px; padding:12px 14px; margin-bottom:20px;
    font-size:12px; color:rgba(240,235,227,.6);
  }
  .op__modal-order strong { color:#f0ebe3; }
  .op__modal-actions { display:flex; gap:10px; }
  .op__cancel-confirm-btn {
    flex:1; padding:13px; border-radius:14px; border:none; cursor:pointer;
    font-size:13px; font-weight:700; font-family:'DM Sans',sans-serif;
    background:#ef4444; color:#fff;
    transition:opacity .15s;
    display:flex; align-items:center; justify-content:center; gap:6px;
  }
  .op__cancel-confirm-btn:hover:not(:disabled) { opacity:.85; }
  .op__cancel-confirm-btn:disabled { opacity:.5; cursor:not-allowed; }
  .op__cancel-back-btn {
    flex:1; padding:13px; border-radius:14px; cursor:pointer;
    font-size:13px; font-weight:700; font-family:'DM Sans',sans-serif;
    background:rgba(240,235,227,.06); color:rgba(240,235,227,.6);
    border:1px solid rgba(255,255,255,0.08);
    transition:all .15s;
  }
  .op__cancel-back-btn:hover { background:rgba(240,235,227,.1); color:#f0ebe3; }

  /* Toast */
  .op__toast {
    position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
    z-index:9999; background:#1a1610; border:1px solid rgba(255,255,255,.12);
    border-radius:14px; padding:12px 20px;
    display:flex; align-items:center; gap:10px;
    box-shadow:0 8px 40px rgba(0,0,0,0.5);
    font-size:13px; font-weight:600; color:#f0ebe3;
    white-space:nowrap;
    animation:op__toastin .3s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes op__toastin { from{opacity:0;transform:translateX(-50%) translateY(16px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
`;

export default function OrdersPage() {
  const [orders, setOrders]           = useState<Order[]>([]);
  const [restaurants, setRestaurants] = useState<Record<string, Restaurant>>({});
  const [loading, setLoading]         = useState(true);
  const [hasSession, setHasSession]   = useState(true);
  const [error, setError]             = useState<string | null>(null);

  // Cancel modal state
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [cancelling, setCancelling]     = useState(false);
  const [toast, setToast]               = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Cancel order ─────────────────────────────────────────────
  const handleCancelOrder = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "cancelled",
          // Optionally record when it was cancelled:
          // cancelled_at: new Date().toISOString(),
        })
        .eq("id", cancelTarget.id)
        // Safety: only cancel if still in a cancellable state
        .in("status", CANCELLABLE_STATUSES);

      if (updateError) throw updateError;

      // Update local state immediately (realtime will also fire)
      setOrders(prev =>
        prev.map(o => o.id === cancelTarget.id ? { ...o, status: "cancelled" } : o)
      );
      setCancelTarget(null);
      showToast("Order cancelled successfully", "success");
    } catch (err) {
      console.error("Cancel error:", err);
      showToast("Failed to cancel. Please try again.", "error");
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const sessionToken = sessionStorage.getItem("order_session");
        if (!sessionToken) { setHasSession(false); setLoading(false); return; }

        const { data: session, error: sessionError } = await supabase
          .from("order_sessions").select("id").eq("session_token", sessionToken).single();

        if (sessionError || !session) { setHasSession(false); setLoading(false); return; }

        const { data: ordersData, error: ordersError } = await supabase
          .from("orders").select("*").eq("session_id", session.id)
          .order("created_at", { ascending: false });

        if (ordersError) { setError("Failed to load orders."); setLoading(false); return; }

        if (ordersData && ordersData.length > 0) {
          setOrders(ordersData);
          const ids = [...new Set(ordersData.map((o) => o.restaurant_id))];
          const { data: rData } = await supabase
            .from("restaurants")
            .select("id, name, theme")
            .in("id", ids);
          if (rData) {
            const map: Record<string, Restaurant> = {};
            rData.forEach((r) => { map[r.id] = r; });
            setRestaurants(map);
          }
        }
        setLoading(false);
      } catch {
        setError("An unexpected error occurred.");
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    if (orders.length === 0) return;
    const ch = supabase.channel("all-orders")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        setOrders((prev) => prev.map((o) => o.id === payload.new.id ? (payload.new as Order) : o));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [orders]);

  useEffect(() => {
    if (typeof window !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  if (loading) {
    return (
      <>
        <style>{PAGE_CSS}</style>
        <div className="op__root" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
          <div style={{ textAlign:"center" }}>
            <svg className="op__loader" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e8a045" strokeWidth="2" style={{ margin:"0 auto 20px", display:"block" }}>
              <circle cx="12" cy="12" r="10" strokeOpacity=".2" /><path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            <p style={{ color:"rgba(240,235,227,.45)", fontSize:12, letterSpacing:"0.15em", textTransform:"uppercase" }}>Loading orders…</p>
          </div>
        </div>
      </>
    );
  }

  if (!hasSession) {
    return (
      <>
        <style>{PAGE_CSS}</style>
        <div className="op__root">
          <div className="op__header"><div className="op__inner"><h1 className="op__title"><em>My Orders</em></h1><div className="op__divider" /></div></div>
          <div className="op__body">
            <div className="op__center">
              <div className="op__center-icon">🛒</div>
              <h2 className="op__center-title">No orders on this device</h2>
              <p className="op__center-sub">Use the tracking link from your order confirmation to check status.</p>
              <div><Link href="/track" className="op__btn">Track Order</Link><Link href="/" className="op__btn-ghost">Browse</Link></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{PAGE_CSS}</style>
        <div className="op__root">
          <div className="op__header"><div className="op__inner"><h1 className="op__title"><em>My Orders</em></h1><div className="op__divider" /></div></div>
          <div className="op__body">
            <div className="op__center">
              <div className="op__center-icon">⚠️</div>
              <h2 className="op__center-title">Something went wrong</h2>
              <p className="op__center-sub">{error}</p>
              <button className="op__btn" onClick={() => window.location.reload()}>Try Again</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (orders.length === 0) {
    return (
      <>
        <style>{PAGE_CSS}</style>
        <div className="op__root">
          <div className="op__header"><div className="op__inner"><h1 className="op__title"><em>My Orders</em></h1><div className="op__divider" /></div></div>
          <div className="op__body">
            <div className="op__center">
              <div className="op__center-icon">🍽️</div>
              <h2 className="op__center-title">No orders yet</h2>
              <p className="op__center-sub">Scan a QR code at a restaurant table to place your first order.</p>
              <Link href="/" className="op__btn">Browse Restaurants</Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const activeOrders    = orders.filter((o) => !["served","cancelled"].includes(o.status));
  const completedOrders = orders.filter((o) =>  ["served","cancelled"].includes(o.status));
  const totalSpent      = orders.reduce((s, o) => s + o.total, 0);

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="op__root">

        {/* HEADER */}
        <div className="op__header">
          <div className="op__inner">
            <div className="op__badge"><span className="op__bdot" /> Live Updates</div>
            <h1 className="op__title"><em>My Orders</em></h1>
            <p className="op__sub">{orders.length} {orders.length === 1 ? "order" : "orders"} this session</p>
            <div className="op__divider" />
          </div>
        </div>

        {/* STATS */}
        <div className="op__stats">
          <div className="op__stat"><div className="op__stat-val">{orders.length}</div><div className="op__stat-lbl">Total</div></div>
          <div className="op__stat">
            <div className="op__stat-val" style={{ fontSize:18 }}>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.75em", fontWeight:600 }}>₹</span>{totalSpent.toFixed(0)}
            </div>
            <div className="op__stat-lbl">Spent</div>
          </div>
          <div className="op__stat"><div className="op__stat-val">{activeOrders.length}</div><div className="op__stat-lbl">Active</div></div>
        </div>

        <div className="op__body">
          {activeOrders.length > 0 && (
            <>
              <span className="op__slbl">Active</span>
              {activeOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  restaurant={restaurants[order.restaurant_id]}
                  onRequestCancel={() => setCancelTarget(order)}
                />
              ))}
            </>
          )}

          {completedOrders.length > 0 && (
            <>
              <span className="op__slbl">Completed</span>
              {completedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  restaurant={restaurants[order.restaurant_id]}
                  onRequestCancel={() => setCancelTarget(order)}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* CANCEL CONFIRM MODAL */}
      {cancelTarget && (
        <div className="op__modal-backdrop" onClick={(e) => {
          if (e.target === e.currentTarget && !cancelling) setCancelTarget(null);
        }}>
          <div className="op__modal">
            <div className="op__modal-icon">🗑️</div>
            <h2 className="op__modal-title">Cancel this order?</h2>
            <p className="op__modal-sub">
              This cannot be undone. The kitchen will be notified and your order will be cancelled immediately.
            </p>
            <div className="op__modal-order">
              Order <strong>#{cancelTarget.order_number}</strong> · Table {cancelTarget.table_number} ·{" "}
              <strong>₹{cancelTarget.total.toFixed(0)}</strong>
            </div>
            <div className="op__modal-actions">
              <button
                className="op__cancel-back-btn"
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
              >
                Keep Order
              </button>
              <button
                className="op__cancel-confirm-btn"
                onClick={handleCancelOrder}
                disabled={cancelling}
              >
                {cancelling ? (
                  <>
                    <svg style={{ animation:"op__spin 1s linear infinite" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" strokeOpacity=".3"/><path d="M12 2a10 10 0 0 1 10 10"/>
                    </svg>
                    Cancelling…
                  </>
                ) : "Yes, Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="op__toast" style={{
          borderColor: toast.type === "success" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)",
        }}>
          <span>{toast.type === "success" ? "✅" : "❌"}</span>
          {toast.msg}
        </div>
      )}
    </>
  );
}

// ── ORDER CARD ────────────────────────────────────────────────
function OrderCard({
  order,
  restaurant,
  onRequestCancel,
}: {
  order: Order;
  restaurant?: Restaurant;
  onRequestCancel: () => void;
}) {
  const t  = { ...DEFAULT_THEME, ...restaurant?.theme };
  const fp = FONT_PAIRS.find((f) => f.key === t.fontPair) ?? FONT_PAIRS[0];

  const dark      = isDarkColor(t.bgColor);
  const borderCol = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.09)";
  const mutedText = hexA(t.textColor, dark ? 0.50 : 0.55);
  const dimText   = hexA(t.textColor, dark ? 0.28 : 0.35);
  const surface2  = dark ? hexA(t.textColor, 0.04) : hexA(t.textColor, 0.06);
  const a12       = hexA(t.accentColor, 0.12);
  const a25       = hexA(t.accentColor, 0.25);

  const s      = STATUS_MAP[order.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.pending;
  const isPaid = order.payment_status === "paid";
  const time   = new Date(order.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const date   = new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  // Can this order still be cancelled?
  const canCancel = CANCELLABLE_STATUSES.includes(order.status);

  return (
    <>
      <style>{`@import url('${fp.googleUrl}');`}</style>

      <div style={{
        background: t.surfaceColor,
        border: `1px solid ${borderCol}`,
        borderRadius: 20,
        overflow: "hidden",
        marginBottom: 12,
        fontFamily: `'${fp.body}', sans-serif`,
        color: t.textColor,
      }}>

        {/* Clickable top section → order detail */}
        <Link href={`/order/${order.id}`} style={{
          display: "block", textDecoration: "none", color: "inherit",
          transition: "background .15s",
        }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = surface2; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          {/* CARD TOP */}
          <div style={{ padding: "16px 16px 14px", borderBottom: `1px solid ${borderCol}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {restaurant && (
                <p style={{ fontSize: 11, color: mutedText, fontWeight: 600, display: "flex", alignItems: "center", gap: 5, marginBottom: 8, letterSpacing: "0.3px" }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: t.accentColor, flexShrink: 0, display: "inline-block" }} />
                  {restaurant.name}
                </p>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                <p style={{ fontFamily: `'${fp.display}', serif`, fontSize: 17, fontWeight: 700, color: t.textColor, margin: 0 }}>
                  #{order.order_number}
                </p>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 100,
                  background: s.bg, color: s.accent, border: `1px solid ${s.border}`,
                  display: "inline-flex", alignItems: "center", gap: 4,
                }}>
                  {s.emoji} {s.label}
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {[`Table ${order.table_number}`, date, time, order.payment_method].map((m) => (
                  <span key={m} style={{
                    fontSize: 10, color: dimText, fontWeight: 500,
                    background: surface2, border: `1px solid ${borderCol}`,
                    padding: "3px 9px", borderRadius: 100, textTransform: "capitalize",
                  }}>{m}</span>
                ))}
              </div>
            </div>

            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{ fontFamily: `'${fp.display}', serif`, fontSize: 20, fontWeight: 900, color: t.accentColor, marginBottom: 5 }}>
                <span style={{ fontFamily: `'${fp.body}', sans-serif`, fontSize: "0.78em", fontWeight: 600 }}>₹</span>
                {order.total.toFixed(0)}
              </p>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 100, display: "inline-block",
                background: isPaid ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)",
                color: isPaid ? "#22c55e" : "#f59e0b",
                border: `1px solid ${isPaid ? "rgba(34,197,94,0.25)" : "rgba(245,158,11,0.25)"}`,
              }}>
                {isPaid ? "✓ Paid" : "⏳ Pending"}
              </span>
            </div>
          </div>
        </Link>

        {/* CARD BOTTOM — View Details + Cancel button */}
        <div style={{
          padding: "11px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: a12,
        }}>
          <Link href={`/order/${order.id}`} style={{
            fontSize: 12, fontWeight: 600, color: t.accentColor,
            display: "flex", alignItems: "center", gap: 4,
            textDecoration: "none",
          }}>
            View Details
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>

          {/* Cancel button — only shown when cancellable */}
          {canCancel && (
            <button
              onClick={(e) => {
                e.preventDefault(); // prevent Link navigation if nested
                onRequestCancel();
              }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "rgba(239,68,68,0.1)", color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.2)", borderRadius: 100,
                padding: "5px 13px", fontSize: 11, fontWeight: 700,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                transition: "all .15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.18)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.4)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.2)";
              }}
            >
              ✕ Cancel Order
            </button>
          )}
        </div>
      </div>
    </>
  );
}

