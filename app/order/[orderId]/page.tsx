// app/order/[orderId]/page.tsx
"use client";

import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  subtotal: number;
  tax: number;
  service_charge: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  table_number: number;
  restaurant_id: string;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  price_at_time: number;
  special_instructions: string | null;
}

interface Restaurant {
  id: string;
  name: string;
  theme?: Partial<RestaurantTheme>;
}

const STEPS = [
  {
    key: "pending",
    label: "Order Placed",
    emoji: "📝",
    desc: "Your order has been received",
  },
  {
    key: "confirmed",
    label: "Confirmed",
    emoji: "✅",
    desc: "Kitchen has confirmed your order",
  },
  {
    key: "preparing",
    label: "Preparing",
    emoji: "👨‍🍳",
    desc: "Chef is cooking your food",
  },
  {
    key: "ready",
    label: "Ready to Serve",
    emoji: "🔔",
    desc: "Your order is ready!",
  },
  { key: "served", label: "Served", emoji: "🍽️", desc: "Enjoy your meal!" },
];

export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch order + items + restaurant ────────────────────────
  useEffect(() => {
    const fetchOrder = async () => {
      const { data: orderData } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      const { data: itemsData } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      setOrder(orderData);
      setOrderItems(itemsData || []);

      // Fetch restaurant with theme
      if (orderData?.restaurant_id) {
        const { data: restData } = await supabase
          .from("restaurants")
          .select("id, name, theme")
          .eq("id", orderData.restaurant_id)
          .single();
        setRestaurant(restData);
      }

      setLoading(false);
    };
    fetchOrder();
  }, [orderId]);

  // ── Realtime subscription ────────────────────────────────────
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder(payload.new as Order);
          const audio = new Audio("/notification.mp3");
          audio.play().catch(() => {});
          if (Notification.permission === "granted") {
            new Notification("Order Updated! 🎉", {
              body: `Your order is now ${payload.new.status}`,
              icon: "/logo.png",
            });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  // ── Resolve theme ────────────────────────────────────────────
  const t = { ...DEFAULT_THEME, ...restaurant?.theme };
  const fp = FONT_PAIRS.find((f) => f.key === t.fontPair) ?? FONT_PAIRS[0];

  const dark = isDarkColor(t.bgColor);
  const borderCol = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.09)";
  const mutedText = hexA(t.textColor, dark ? 0.5 : 0.55);
  const dimText = hexA(t.textColor, dark ? 0.28 : 0.35);
  const surface2 = dark ? hexA(t.textColor, 0.04) : hexA(t.textColor, 0.06);
  const a12 = hexA(t.accentColor, 0.12);
  const a25 = hexA(t.accentColor, 0.25);
  const a35 = hexA(t.accentColor, 0.35);

  const isCancelled = order?.status === "cancelled";
  const currentStep = STEPS.findIndex((s) => s.key === order?.status);

  // ── CSS ──────────────────────────────────────────────────────
  const css = `
    @import url('${fp.googleUrl}');

    .ot__root {
      min-height: 100vh;
      background: ${t.bgColor};
      font-family: '${fp.body}', sans-serif;
      color: ${t.textColor};
    }

    /* HEADER */
    .ot__header {
      background: linear-gradient(150deg, ${hexA(t.accentColor, dark ? 0.1 : 0.06)} 0%, ${t.bgColor} 55%);
      border-bottom: 1px solid ${borderCol};
      padding: 36px 20px 24px;
      position: relative; overflow: hidden;
      position: sticky; top: 0; z-index: 50;
      backdrop-filter: blur(16px);
    }
    .ot__header::before {
      content: ''; position: absolute; inset: 0; pointer-events: none;
      background: radial-gradient(ellipse 70% 120% at 85% 0%, ${hexA(t.accentColor, 0.1)} 0%, transparent 70%);
    }
    .ot__header-inner { max-width: 560px; margin: 0 auto; position: relative; }
    .ot__back {
      display: inline-flex; align-items: center; gap: 6px;
      color: ${mutedText}; font-size: 13px; font-weight: 500;
      background: none; border: none; cursor: pointer; padding: 0;
      font-family: '${fp.body}', sans-serif; transition: color .2s;
      margin-bottom: 16px;
    }
    .ot__back:hover { color: ${t.accentColor}; }
    .ot__header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
    .ot__order-num {
      font-family: '${fp.display}', serif;
      font-size: clamp(22px, 5vw, 30px); font-weight: 900;
      color: ${t.textColor}; line-height: 1.1; margin-bottom: 6px;
    }
    .ot__order-num em { font-style: italic; color: ${t.accentColor}; }
    .ot__rest-name { font-size: 13px; color: ${mutedText}; font-weight: 500; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
    .ot__rest-dot { width: 5px; height: 5px; border-radius: 50%; background: ${t.accentColor}; flex-shrink: 0; }
    .ot__meta-pills { display: flex; flex-wrap: wrap; gap: 6px; }
    .ot__pill {
      font-size: 10px; color: ${dimText}; font-weight: 600;
      background: ${surface2}; border: 1px solid ${borderCol};
      padding: 4px 10px; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .ot__live-badge {
      display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0;
      background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.25);
      color: #22c55e; font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
      text-transform: uppercase; padding: 5px 10px; border-radius: 100px;
    }
    .ot__live-dot { width: 5px; height: 5px; border-radius: 50%; background: #22c55e; animation: ot__pulse 1.5s infinite; }
    @keyframes ot__pulse { 0%,100%{opacity:1} 50%{opacity:.3} }

    /* CANCELLED BANNER */
    .ot__cancelled-banner {
      background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
      border-radius: 16px; padding: 20px; margin-bottom: 20px;
      display: flex; align-items: center; gap: 14px;
    }
    .ot__cancelled-icon { font-size: 32px; flex-shrink: 0; }
    .ot__cancelled-title { font-family: '${fp.display}', serif; font-size: 18px; font-weight: 700; color: #ef4444; margin-bottom: 4px; }
    .ot__cancelled-sub { font-size: 12px; color: ${mutedText}; line-height: 1.5; }

    /* BODY */
    .ot__body { max-width: 560px; margin: 0 auto; padding: 20px 16px 48px; }

    /* SECTION LABEL */
    .ot__slbl {
      font-size: 10px; font-weight: 700; color: ${dimText};
      text-transform: uppercase; letter-spacing: 2px; margin-bottom: 14px; display: block;
    }

    /* STATUS TRACKER */
    .ot__tracker {
      background: ${t.surfaceColor}; border: 1px solid ${borderCol};
      border-radius: 20px; padding: 20px; margin-bottom: 16px;
    }
    .ot__step { display: flex; align-items: flex-start; gap: 14px; }
    .ot__step-spine { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
    .ot__step-circle {
      width: 44px; height: 44px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; flex-shrink: 0; transition: all .3s;
      position: relative;
    }
    .ot__step-circle.done {
      background: ${t.accentColor}; box-shadow: 0 4px 16px ${a35};
    }
    .ot__step-circle.done::after {
      content: '✓'; position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; font-weight: 700; color: ${t.bgColor};
    }
    .ot__step-circle.current {
      background: ${a12}; border: 2px solid ${t.accentColor};
      animation: ot__ring 2s ease infinite;
    }
    @keyframes ot__ring {
      0%,100% { box-shadow: 0 0 0 0 ${hexA(t.accentColor, 0.3)}; }
      50%      { box-shadow: 0 0 0 8px ${hexA(t.accentColor, 0)}; }
    }
    .ot__step-circle.future {
      background: ${surface2}; border: 1px solid ${borderCol};
      opacity: .5;
    }
    .ot__step-line {
      width: 2px; flex: 1; min-height: 28px; border-radius: 2px; margin: 4px 0;
      transition: background .3s;
    }
    .ot__step-line.done { background: ${t.accentColor}; opacity: .7; }
    .ot__step-line.future { background: ${borderCol}; }

    .ot__step-content { flex: 1; padding-top: 10px; padding-bottom: 16px; }
    .ot__step-label {
      font-family: '${fp.display}', serif; font-size: 15px; font-weight: 700;
      line-height: 1.2; margin-bottom: 3px;
    }
    .ot__step-label.done    { color: ${t.accentColor}; }
    .ot__step-label.current { color: ${t.textColor}; }
    .ot__step-label.future  { color: ${dimText}; }
    .ot__step-desc { font-size: 12px; color: ${mutedText}; }
    .ot__step-desc.current { color: ${t.accentColor}; }
    .ot__in-progress {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 11px; font-weight: 600; color: ${t.accentColor};
      background: ${a12}; border: 1px solid ${a25};
      padding: 3px 9px; border-radius: 100px; margin-top: 5px;
    }
    .ot__in-progress-dot { width: 5px; height: 5px; border-radius: 50%; background: ${t.accentColor}; animation: ot__pulse 1.5s infinite; }

    /* ITEMS */
    .ot__items {
      background: ${t.surfaceColor}; border: 1px solid ${borderCol};
      border-radius: 20px; padding: 20px; margin-bottom: 16px;
    }
    .ot__item {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
      padding: 12px 0; border-bottom: 1px solid ${borderCol};
    }
    .ot__item:last-child { border-bottom: none; padding-bottom: 0; }
    .ot__item:first-child { padding-top: 0; }
    .ot__item-name {
      font-family: '${fp.display}', serif; font-size: 14px; font-weight: 700;
      color: ${t.textColor}; margin-bottom: 3px;
    }
    .ot__item-qty { font-size: 12px; color: ${mutedText}; }
    .ot__item-note {
      font-size: 11px; color: ${dimText}; font-style: italic;
      background: ${a12}; border: 1px solid ${a25};
      padding: 5px 9px; border-radius: 8px; margin-top: 6px;
    }
    .ot__item-price {
      font-family: '${fp.display}', serif; font-size: 15px; font-weight: 700;
      color: ${t.accentColor}; white-space: nowrap; text-align: right;
    }
    .ot__item-each { font-size: 10px; color: ${dimText}; margin-top: 2px; text-align: right; }

    /* BILL */
    .ot__bill {
      background: ${t.surfaceColor}; border: 1px solid ${borderCol};
      border-radius: 20px; padding: 20px; margin-bottom: 16px;
    }
    .ot__bill-row { display: flex; justify-content: space-between; padding: 6px 0; }
    .ot__bill-lbl { font-size: 13px; color: ${mutedText}; }
    .ot__bill-val { font-size: 13px; color: ${t.textColor}; font-weight: 500; }
    .ot__bill-total {
      display: flex; justify-content: space-between; align-items: center;
      border-top: 1px solid ${borderCol}; margin-top: 8px; padding-top: 12px;
    }
    .ot__bill-total-lbl { font-family: '${fp.display}', serif; font-size: 17px; font-weight: 700; color: ${t.textColor}; }
    .ot__bill-total-val { font-family: '${fp.display}', serif; font-size: 22px; font-weight: 900; color: ${t.accentColor}; }

    /* PAYMENT */
    .ot__pay {
      background: ${t.surfaceColor}; border: 1px solid ${borderCol};
      border-radius: 20px; padding: 20px; margin-bottom: 16px;
    }
    .ot__pay-row { display: flex; align-items: center; gap: 12px; }
    .ot__pay-icon {
      width: 44px; height: 44px; border-radius: 12px;
      background: ${a12}; border: 1px solid ${a25};
      display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;
    }
    .ot__pay-lbl { font-size: 11px; color: ${dimText}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
    .ot__pay-val { font-family: '${fp.display}', serif; font-size: 15px; font-weight: 700; color: ${t.textColor}; text-transform: capitalize; }
    .ot__pay-status {
      margin-left: auto; font-size: 11px; font-weight: 700;
      padding: 5px 11px; border-radius: 100px;
    }
    .ot__pay-status.paid { background: rgba(34,197,94,0.12); color: #22c55e; border: 1px solid rgba(34,197,94,0.25); }
    .ot__pay-status.pending { background: rgba(245,158,11,0.12); color: #f59e0b; border: 1px solid rgba(245,158,11,0.25); }

    /* RUPEE */
    .ot__rupee { font-family: '${fp.body}', sans-serif; font-weight: 600; font-size: 0.8em; letter-spacing: 0; }

    /* NOT FOUND */
    .ot__notfound {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; min-height: 70vh; text-align: center; padding: 40px;
    }
    .ot__nf-icon { font-size: 56px; margin-bottom: 20px; }
    .ot__nf-title { font-family: '${fp.display}', serif; font-size: 24px; font-weight: 700; color: ${t.textColor}; margin-bottom: 8px; }
    .ot__nf-sub { font-size: 14px; color: ${mutedText}; margin-bottom: 24px; }
    .ot__nf-btn {
      display: inline-flex; align-items: center; gap: 6px;
      background: ${t.accentColor}; color: ${t.bgColor};
      border: none; border-radius: 100px; padding: 12px 24px;
      font-size: 14px; font-weight: 700; cursor: pointer;
      font-family: '${fp.body}', sans-serif;
    }

    /* LOADER */
    .ot__spin { animation: ot__spin-anim 1s linear infinite; }
    @keyframes ot__spin-anim { to { transform: rotate(360deg); } }
  `;

  // ── LOADING ──────────────────────────────────────────────────
  if (loading) {
    // Use default theme colors before restaurant loads
    return (
      <div
        style={{
          minHeight: "100vh",
          background: DEFAULT_THEME.bgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&display=swap'); .ot__spin{animation:sp 1s linear infinite} @keyframes sp{to{transform:rotate(360deg)}}`}</style>
        <div style={{ textAlign: "center" }}>
          <svg
            className="ot__spin"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke={DEFAULT_THEME.accentColor}
            strokeWidth="2"
            style={{ margin: "0 auto 20px", display: "block" }}
          >
            <circle cx="12" cy="12" r="10" strokeOpacity=".2" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          <p
            style={{
              fontFamily: "'DM Sans',sans-serif",
              color: "rgba(240,235,227,.45)",
              fontSize: 12,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Loading order…
          </p>
        </div>
      </div>
    );
  }

  // ── NOT FOUND ────────────────────────────────────────────────
  if (!order) {
    return (
      <>
        <style>{css}</style>
        <div className="ot__root">
          <div className="ot__notfound">
            <div className="ot__nf-icon">🔍</div>
            <h2 className="ot__nf-title">Order not found</h2>
            <p className="ot__nf-sub">
              This order doesn't exist or the link may have expired.
            </p>
            <button className="ot__nf-btn" onClick={() => router.push("/")}>
              Go Home
            </button>
          </div>
        </div>
      </>
    );
  }

  const isPaid = order.payment_status === "paid";
  const time = new Date(order.created_at).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = new Date(order.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <>
      <style>{css}</style>
      <div className="ot__root">
        {/* HEADER */}
        <div className="ot__header">
          <div className="ot__header-inner">
            <button className="ot__back" onClick={() => router.back()}>
              ← Back
            </button>
            <div className="ot__header-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                {restaurant && (
                  <p className="ot__rest-name">
                    <span className="ot__rest-dot" />
                    {restaurant.name}
                  </p>
                )}
                <h1 className="ot__order-num">
                  Order <em>#{order.order_number}</em>
                </h1>
                <div className="ot__meta-pills">
                  <span className="ot__pill">Table {order.table_number}</span>
                  <span className="ot__pill">{date}</span>
                  <span className="ot__pill">{time}</span>
                </div>
              </div>
              {!isCancelled && (
                <div className="ot__live-badge">
                  <span className="ot__live-dot" /> Live
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="ot__body">
          {/* CANCELLED BANNER */}
          {isCancelled && (
            <div className="ot__cancelled-banner">
              <span className="ot__cancelled-icon">❌</span>
              <div>
                <p className="ot__cancelled-title">Order Cancelled</p>
                <p className="ot__cancelled-sub">
                  This order has been cancelled. If you have questions, please
                  speak with the restaurant staff.
                  {isPaid && " Any payment made will be refunded."}
                </p>
              </div>
            </div>
          )}

          {/* STATUS TRACKER */}
          {!isCancelled && (
            <>
              <span className="ot__slbl">Order Status</span>
              <div className="ot__tracker">
                {STEPS.map((step, idx) => {
                  const isDone = idx < currentStep;
                  const isCurrent = idx === currentStep;
                  const isFuture = idx > currentStep;
                  const circleClass = isDone
                    ? "done"
                    : isCurrent
                      ? "current"
                      : "future";
                  const labelClass = isDone
                    ? "done"
                    : isCurrent
                      ? "current"
                      : "future";
                  const isLast = idx === STEPS.length - 1;

                  return (
                    <div key={step.key} className="ot__step">
                      <div className="ot__step-spine">
                        <div className={`ot__step-circle ${circleClass}`}>
                          {!isDone && step.emoji}
                        </div>
                        {!isLast && (
                          <div
                            className={`ot__step-line ${isDone || isCurrent ? "done" : "future"}`}
                          />
                        )}
                      </div>
                      <div
                        className="ot__step-content"
                        style={{ paddingBottom: isLast ? 0 : 16 }}
                      >
                        <p className={`ot__step-label ${labelClass}`}>
                          {step.label}
                        </p>
                        {isCurrent && step.key !== "served" && (
                          <div className="ot__in-progress">
                            <span className="ot__in-progress-dot" /> In
                            progress…
                          </div>
                        )}
                        {isCurrent && step.key === "served" && (
                          <p
                            className="ot__step-desc"
                            style={{
                              color: hexA(t.accentColor, 0.85),
                              fontWeight: 600,
                            }}
                          >
                            🎉 Enjoy your meal!
                          </p>
                        )}
                        {isDone && (
                          <p
                            className="ot__step-desc"
                            style={{ color: hexA(t.accentColor, 0.6) }}
                          >
                            ✓ Completed
                          </p>
                        )}
                        {isFuture && (
                          <p className="ot__step-desc">{step.desc}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ORDER ITEMS */}
          <span
            className="ot__slbl"
            style={{ marginTop: isCancelled ? 0 : undefined }}
          >
            Items
          </span>
          <div className="ot__items">
            {orderItems.map((item) => (
              <div key={item.id} className="ot__item">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="ot__item-name">{item.name}</p>
                  <p className="ot__item-qty">× {item.quantity}</p>
                  {item.special_instructions && (
                    <p className="ot__item-note">
                      📝 {item.special_instructions}
                    </p>
                  )}
                </div>
                <div>
                  <p className="ot__item-price">
                    <span className="ot__rupee">₹</span>
                    {(
                      (item.price_at_time ?? item.price) * item.quantity
                    ).toFixed(0)}
                  </p>
                  <p className="ot__item-each">
                    <span className="ot__rupee">₹</span>
                    {(item.price_at_time ?? item.price).toFixed(0)} each
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* BILL SUMMARY */}
          <span className="ot__slbl">Bill Summary</span>
          <div className="ot__bill">
            <div className="ot__bill-row">
              <span className="ot__bill-lbl">Subtotal</span>
              <span className="ot__bill-val">
                <span className="ot__rupee">₹</span>
                {order.subtotal.toFixed(0)}
              </span>
            </div>
            {order.tax > 0 && (
              <div className="ot__bill-row">
                <span className="ot__bill-lbl">GST</span>
                <span className="ot__bill-val">
                  <span className="ot__rupee">₹</span>
                  {order.tax.toFixed(0)}
                </span>
              </div>
            )}
            {order.service_charge > 0 && (
              <div className="ot__bill-row">
                <span className="ot__bill-lbl">Service Charge</span>
                <span className="ot__bill-val">
                  <span className="ot__rupee">₹</span>
                  {order.service_charge.toFixed(0)}
                </span>
              </div>
            )}
            <div className="ot__bill-total">
              <span className="ot__bill-total-lbl">Total</span>
              <span className="ot__bill-total-val">
                <span className="ot__rupee" style={{ fontSize: "0.75em" }}>
                  ₹
                </span>
                {order.total.toFixed(0)}
              </span>
            </div>
          </div>

          {/* PAYMENT */}
          <span className="ot__slbl">Payment</span>
          <div className="ot__pay">
            <div className="ot__pay-row">
              <div className="ot__pay-icon">
                {order.payment_method === "upi"
                  ? "📱"
                  : order.payment_method === "card"
                    ? "💳"
                    : "💵"}
              </div>
              <div>
                <p className="ot__pay-lbl">Method</p>
                <p className="ot__pay-val">{order.payment_method}</p>
              </div>
              <span className={`ot__pay-status ${isPaid ? "paid" : "pending"}`}>
                {isPaid ? "✓ Paid" : "⏳ Pending"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
