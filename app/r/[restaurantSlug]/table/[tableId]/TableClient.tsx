"use client";

// components/TableClient.tsx
// Customer-facing menu — reads restaurant.theme from Supabase and applies it fully.

import { useEffect, useState, useRef } from "react";
import { createSession } from "@/services/sessionServices";
import { useAppDispatch } from "@/store/hooks";
import {
  addItem,
  decreaseItem,
  setCart,
  clearCart,
} from "@/store/slices/cartSlice";
import { useAppSelector } from "@/store/hooks";
import { useRouter } from "next/navigation";
import { getCart } from "@/services/cartServices";
import {
  ShoppingCart,
  Plus,
  Minus,
  Leaf,
  ChevronUp,
  Flame,
  UtensilsCrossed,
  Clock,
  WifiOff,
} from "lucide-react";
import { useCartPersistence } from "@/hooks/useCartPersistence";
import { supabase } from "@/lib/supabase/client";
import {
  RestaurantTheme,
  DEFAULT_THEME,
  FONT_PAIRS,
  hexA,
  isDarkColor,
} from "@/types/theme";

// ── Interfaces ──────────────────────────────────────────────────────────────

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  theme?: Partial<RestaurantTheme>; // ← from restaurants.theme JSONB column
}

interface Table {
  id: string;
  table_number: number;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
  display_order?: number;
  image_url?: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  is_available: boolean;
  is_vegetarian: boolean;
  image_url?: string;
  is_popular?: boolean;
}

interface TableClientProps {
  restaurant: Restaurant;
  table: Table;
  categories: Category[];
  items: MenuItem[];
}

// ── Fallback emojis per category ────────────────────────────────────────────
const CATEGORY_EMOJIS = [
  "🍛",
  "🍗",
  "🥗",
  "🍜",
  "🍕",
  "🥩",
  "🍱",
  "🥘",
  "🍣",
  "🧆",
];

function InactiveTableScreen({
  table,
  restaurant,
}: {
  table: Table;
  restaurant: Restaurant;
}) {
  return (
    <div className="min-h-screen bg-[#0f0e0c] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {" "}
      {/* Ambient background blobs */}{" "}
      <div className="absolute top-[-10%] left-[-10%] w-[420px] h-[420px] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />{" "}
      <div className="absolute bottom-[-10%] right-[-10%] w-[380px] h-[380px] rounded-full bg-orange-400/5 blur-[120px] pointer-events-none" />{" "}
      {/* Subtle grid texture */}{" "}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,200,100,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,200,100,0.4) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />{" "}
      {/* Card */}{" "}
      <div className="relative z-10 w-full max-w-sm text-center">
        {" "}
        {/* Top ornament line */}{" "}
        <div className="flex items-center gap-3 mb-10 justify-center">
          {" "}
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-500/50" />{" "}
          <span className="text-amber-500/60 text-[10px] tracking-[0.3em] uppercase font-semibold">
            {" "}
            {restaurant.name}{" "}
          </span>{" "}
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-500/50" />{" "}
        </div>{" "}
        {/* Icon cluster */}{" "}
        <div className="relative flex items-center justify-center mb-8">
          {" "}
          {/* Outer ring */}{" "}
          <div
            className="absolute w-28 h-28 rounded-full border border-amber-500/10 animate-ping-slow"
            style={{ animationDuration: "3s" }}
          />{" "}
          <div className="absolute w-20 h-20 rounded-full border border-amber-500/15" />{" "}
          {/* Icon circle */}{" "}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/25 flex items-center justify-center backdrop-blur-sm">
            {" "}
            <UtensilsCrossed
              size={26}
              className="text-amber-400/80"
              strokeWidth={1.5}
            />{" "}
          </div>{" "}
        </div>{" "}
        {/* Main heading */}{" "}
        <h1
          className="text-3xl font-bold text-white/90 mb-2 leading-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {" "}
          Table {table.table_number} <br />{" "}
          <em className="text-amber-400/80 not-italic">is Closed</em>{" "}
        </h1>{" "}
        {/* Divider */}{" "}
        <div className="flex items-center gap-2 justify-center my-5">
          {" "}
          <div className="h-px flex-1 bg-white/5" />{" "}
          <div className="w-1 h-1 rounded-full bg-amber-500/40" />{" "}
          <div className="h-px flex-1 bg-white/5" />{" "}
        </div>{" "}
        {/* Message card */}{" "}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-6 py-5 mb-6 text-left">
          {" "}
          <div className="flex items-start gap-3">
            {" "}
            <div className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              {" "}
              <Clock size={13} className="text-amber-400/70" />{" "}
            </div>{" "}
            <div>
              {" "}
              <p className="text-white/75 text-[13px] leading-relaxed">
                {" "}
                This table isn&apos;t accepting orders right now. Please ask a staff
                member for assistance or scan a nearby active table&apos;s QR
                code.{" "}
              </p>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* Status badge */}{" "}
        <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400/80 text-[11px] font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-10">
          {" "}
          <WifiOff size={10} strokeWidth={2.5} /> Table Inactive{" "}
        </div>{" "}
        {/* Bottom note */}{" "}
        <p className="text-white/20 text-[11px] tracking-wider uppercase">
          {" "}
          Need help? 📞 Call us or wave to our team{" "}
        </p>{" "}
        {/* Bottom ornament */}{" "}
        <div className="flex items-center gap-3 mt-10 justify-center">
          {" "}
          <div className="h-px w-8 bg-white/10" />{" "}
          <span className="text-white/15 text-[10px] tracking-[0.25em]">
            TABROVA
          </span>{" "}
          <div className="h-px w-8 bg-white/10" />{" "}
        </div>{" "}
      </div>{" "}
      <style>{` @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap'); @keyframes ping-slow { 0%, 100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.35); opacity: 0; } } .animate-ping-slow { animation: ping-slow 3s ease-in-out infinite; } `}</style>{" "}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
export default function TableClient({
  restaurant,
  table,
  categories,
  items,
}: TableClientProps) {
  const dispatch = useAppDispatch();
  const cart = useAppSelector((state) => state.cart);
  const { deleteCartFromSupabase } = useCartPersistence();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [cartBump, setCartBump] = useState(false);

  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const navRef = useRef<HTMLDivElement>(null);

  // ── Resolve theme ──────────────────────────────────────────────────────────
  const t = { ...DEFAULT_THEME, ...restaurant.theme };
  const fp = FONT_PAIRS.find((f) => f.key === t.fontPair) ?? FONT_PAIRS[0];

  // ── Derived values ─────────────────────────────────────────────────────────
  const dark = isDarkColor(t.bgColor);
  const borderCol = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.09)";
  const mutedText = hexA(t.textColor, dark ? 0.5 : 0.55);
  const dimText = hexA(t.textColor, dark ? 0.28 : 0.35);
  const a12 = hexA(t.accentColor, 0.12);
  const a25 = hexA(t.accentColor, 0.25);
  const a35 = hexA(t.accentColor, 0.35);
  const cardShadow =
    t.cardStyle === "elevated"
      ? `0 2px 18px rgba(0,0,0,${dark ? ".45" : ".09"})`
      : "none";
  const cardBorderV =
    t.cardStyle === "outlined"
      ? `1px solid ${borderCol}`
      : t.cardStyle === "elevated"
        ? `1px solid ${hexA(t.textColor, dark ? 0.05 : 0.07)}`
        : "none";
  const btnBg = t.buttonStyle === "filled" ? t.accentColor : "transparent";
  const btnColor = t.buttonStyle === "filled" ? t.bgColor : t.accentColor;
  const btnBorder =
    t.buttonStyle === "outlined" ? `1.5px solid ${t.accentColor}` : "none";

  // ── Session init ───────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const existingToken = sessionStorage.getItem("order_session");
        const existingRestaurantId = sessionStorage.getItem(
          "session_restaurant_id",
        );
        const isSame = existingRestaurantId === restaurant.id;

        if (existingToken && isSame) {
          const { data: sessionData } = await supabase
            .from("order_sessions")
            .select("id")
            .eq("session_token", existingToken)
            .maybeSingle();

          if (sessionData) {
            setSessionToken(existingToken);
            const cartItems = await getCart(existingToken);
            if (cartItems && Array.isArray(cartItems)) {
              dispatch(
                setCart(
                  cartItems.map((item: any) => ({
                    id: item.menu_items.id,
                    name: item.menu_items.name,
                    price: item.menu_items.price,
                    quantity: item.quantity,
                  })),
                ),
              );
            }
            setLoading(false);
            return;
          }
        }

        dispatch(clearCart());
        sessionStorage.removeItem("order_session");
        sessionStorage.removeItem("session_restaurant_id");
        sessionStorage.removeItem("table_number");

        const session = await createSession(
          restaurant.id,
          table.id,
          table.table_number,
        );
        const token = session.session_token;
        sessionStorage.setItem("order_session", token);
        sessionStorage.setItem("session_restaurant_id", restaurant.id);
        sessionStorage.setItem("table_number", table.table_number.toString());
        setSessionToken(token);
      } catch (err) {
        console.error("Session init error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [dispatch, restaurant.id, table.id]);

  // ── Scroll tracking ────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 80);
      const pos = window.scrollY + 160;
      let found = "";
      for (const [id, el] of Object.entries(categoryRefs.current)) {
        if (el && el.offsetTop <= pos) found = id;
      }
      if (found) setActiveCategory(found);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Keep active category pill in view
  useEffect(() => {
    if (!activeCategory || !navRef.current) return;
    const pill = navRef.current.querySelector(
      `[data-cat="${activeCategory}"]`,
    ) as HTMLElement;
    pill?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeCategory]);

  // ── Cart handlers ──────────────────────────────────────────────────────────
  const handleIncrease = (item: MenuItem) => {
    dispatch(
      addItem({ id: item.id, name: item.name, price: item.price, quantity: 1 }),
    );
    setCartBump(true);
    setTimeout(() => setCartBump(false), 300);
  };

  const handleDecrease = (item: MenuItem) => {
    const cartItem = cart.items.find((i) => i.id === item.id);
    if (!cartItem) return;
    if (cartItem.quantity === 1) {
      if (confirm("Remove this item from cart?")) {
        deleteCartFromSupabase();
        dispatch(decreaseItem(item.id));
      }
    } else {
      dispatch(decreaseItem(item.id));
    }
  };

  const scrollToCategory = (id: string) => {
    const el = categoryRefs.current[id];
    if (el) window.scrollTo({ top: el.offsetTop - 140, behavior: "smooth" });
  };

  const totalItems = cart.items.reduce((s, i) => s + i.quantity, 0);

  if (!loading && table.is_active === false) {
    return <InactiveTableScreen table={table} restaurant={restaurant} />;
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: t.bgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <style>{`
          @import url('${fp.googleUrl}');
          .lr{animation:spin 1s linear infinite}
          @keyframes spin{to{transform:rotate(360deg)}}
        `}</style>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              position: "relative",
              width: 64,
              height: 64,
              margin: "0 auto 24px",
            }}
          >
            <div
              className="lr"
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "2px solid transparent",
                borderTopColor: t.accentColor,
                borderRightColor: t.accentColor,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 12,
                borderRadius: "50%",
                background: hexA(t.accentColor, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              🍽️
            </div>
          </div>
          <p
            style={{
              fontFamily: `'${fp.body}', sans-serif`,
              color: hexA(t.textColor, 0.45),
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Preparing your menu…
          </p>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('${fp.googleUrl}');

        :root {
          --bg:      ${t.bgColor};
          --surface: ${t.surfaceColor};
          --accent:  ${t.accentColor};
          --text:    ${t.textColor};
          --muted:   ${mutedText};
          --dim:     ${dimText};
          --border:  ${borderCol};
          --cr:      ${t.cardRadius}px;
          --br:      ${t.buttonRadius}px;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); }

        .menu-root {
          min-height: 100vh;
          background: var(--bg);
          font-family: '${fp.body}', sans-serif;
          color: var(--text);
        }

        /* ── HERO ── */
        .hero {
          position: relative;
          background: linear-gradient(150deg, ${hexA(t.accentColor, dark ? 0.09 : 0.05)} 0%, var(--bg) 55%);
          padding: 48px 20px 36px;
          overflow: hidden;
        }
        .hero::before {
          content: '';
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 60% 80% at 80% 20%, ${hexA(t.accentColor, 0.1)} 0%, transparent 70%),
            radial-gradient(ellipse 40% 60% at 10% 80%, ${hexA(t.accentColor, 0.05)} 0%, transparent 60%);
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: ${a12}; border: 1px solid ${a25}; color: var(--accent);
          font-size: 11px; font-weight: 600; letter-spacing: 2px;
          text-transform: uppercase; padding: 5px 12px; border-radius: 100px; margin-bottom: 16px;
        }
        .hero-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); display: inline-block; }
        .hero-title {
          font-family: '${fp.display}', serif;
          font-size: clamp(30px, 8vw, 50px); font-weight: 900;
          line-height: 1.05; color: var(--text);
        }
        .hero-title em { font-style: italic; color: var(--accent); }
        .hero-sub { font-size: 13px; color: var(--muted); margin-top: 6px; }
        .hero-divider { width: 48px; height: 2px; background: var(--accent); opacity: .7; margin-top: 20px; }

        /* ── STICKY NAV ── */
        .cat-nav-wrap {
          position: sticky; top: 0; z-index: 50;
          background: ${dark ? `${t.bgColor}ee` : `${t.bgColor}f0`};
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
          padding: 0 16px;
        }
        .cat-nav { display: flex; gap: 8px; overflow-x: auto; padding: 12px 0; scrollbar-width: none; }
        .cat-nav::-webkit-scrollbar { display: none; }
        .cat-pill {
          flex-shrink: 0; padding: 7px 16px; border-radius: 100px;
          font-size: 13px; font-weight: 500; cursor: pointer; transition: all .2s;
          border: 1px solid var(--border); background: var(--surface); color: var(--muted);
          white-space: nowrap; font-family: '${fp.body}', sans-serif;
        }
        .cat-pill.active { background: var(--accent); border-color: var(--accent); color: ${t.bgColor}; font-weight: 700; }
        .cat-pill:not(.active):hover { border-color: ${hexA(t.accentColor, 0.5)}; color: var(--accent); }

        /* ── SECTION ── */
        .section-wrap { padding: 32px 16px 8px; max-width: 680px; margin: 0 auto; }
        .section-head { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
        .section-cat-img { width: 60px; height: 60px; border-radius: 14px; object-fit: cover; border: 1px solid var(--border); flex-shrink: 0; }
        .section-cat-emoji {
          width: 60px; height: 60px; border-radius: 14px;
          background: var(--surface); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center; font-size: 26px; flex-shrink: 0;
        }
        .section-title { font-family: '${fp.display}', serif; font-size: clamp(20px, 5vw, 28px); font-weight: 700; color: var(--text); line-height: 1.1; }
        .section-count { font-size: 11px; color: var(--dim); font-weight: 500; letter-spacing: 1px; text-transform: uppercase; margin-top: 3px; }
        .section-line { width: 100%; height: 1px; background: var(--accent); opacity: .2; margin-bottom: 18px; }

        /* ── ITEM CARD ── */
        .item-card {
          background: var(--surface);
          border: ${cardBorderV};
          border-radius: var(--cr);
          box-shadow: ${cardShadow};
          overflow: hidden; margin-bottom: 12px;
          display: flex; transition: border-color .2s, transform .15s;
        }
        .item-card:active { transform: scale(0.99); }
        .item-card:hover { border-color: ${a25}; }

        .item-img-wrap { width: 108px; flex-shrink: 0; background: ${a12}; }
        .item-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .item-img-placeholder {
          width: 108px; min-height: 128px;
          background: ${a12};
          display: flex; align-items: center; justify-content: center; font-size: 34px;
        }

        .item-body { flex: 1; padding: 13px 13px 11px; display: flex; flex-direction: column; gap: 5px; min-width: 0; }
        .item-badges { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
        .badge-veg {
          display: inline-flex; align-items: center; gap: 3px;
          font-size: 9px; font-weight: 700; color: #4caf50;
          background: rgba(76,175,80,.12); border: 1px solid rgba(76,175,80,.25);
          padding: 2px 7px; border-radius: 100px;
        }
        .badge-popular {
          display: inline-flex; align-items: center; gap: 3px;
          font-size: 9px; font-weight: 700; color: var(--accent);
          background: ${a12}; border: 1px solid ${a25};
          padding: 2px 7px; border-radius: 100px;
        }
        .item-name { font-family: '${fp.display}', serif; font-size: 15px; font-weight: 700; color: var(--text); line-height: 1.25; }
        .item-desc {
          font-size: 11.5px; color: var(--muted); line-height: 1.5;
          font-family: '${fp.body}', sans-serif;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .item-footer { display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 8px; }
        .item-price { font-family: '${fp.display}', serif; font-size: 19px; font-weight: 700; color: var(--accent); letter-spacing: -0.5px; }
        .item-price-label { font-size: 9px; font-weight: 500; color: var(--dim); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1px; }

        /* ── BUTTONS ── */
        .btn-add {
          display: flex; align-items: center; gap: 6px;
          background: ${btnBg}; color: ${btnColor}; border: ${btnBorder};
          font-size: 12px; font-weight: 700; padding: 7px 15px;
          border-radius: var(--br); cursor: pointer; transition: opacity .2s, transform .1s;
          font-family: '${fp.body}', sans-serif;
        }
        .btn-add:hover { opacity: .85; }
        .btn-add:active { transform: scale(0.95); }

        .counter-wrap {
          display: flex; align-items: center; gap: 3px;
          background: ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"};
          border: 1px solid var(--border); border-radius: 100px; padding: 3px;
        }
        .counter-btn {
          width: 28px; height: 28px; border-radius: 50%;
          background: var(--accent); color: ${t.bgColor};
          border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: opacity .15s, transform .1s;
        }
        .counter-btn:active { transform: scale(0.9); }
        .counter-btn.minus { background: ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}; color: var(--muted); }
        .counter-num { min-width: 22px; text-align: center; font-size: 13px; font-weight: 700; color: var(--text); }

        /* ── RUPEE ── */
        .rupee { font-family: '${fp.body}', sans-serif; font-weight: 600; font-size: .8em; vertical-align: baseline; letter-spacing: 0; }

        /* ── FLOATING CART ── */
        .cart-bar {
          position: fixed; bottom: 0; left: 0; right: 0;
          padding: 14px 16px 24px; z-index: 100;
          background: linear-gradient(to top, var(--bg) 65%, transparent);
        }
        .cart-btn {
          max-width: 680px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          background: var(--accent); color: ${t.bgColor};
          border: none; border-radius: 18px; padding: 13px 20px; cursor: pointer; width: 100%;
          box-shadow: 0 8px 32px ${a35}; transition: transform .2s, box-shadow .2s;
          font-family: '${fp.body}', sans-serif;
        }
        .cart-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 40px ${hexA(t.accentColor, 0.45)}; }
        .cart-btn.bump { animation: bump .3s ease; }
        @keyframes bump { 0%{transform:scale(1)} 40%{transform:scale(1.03) translateY(-2px)} 100%{transform:scale(1) translateY(-2px)} }

        .cart-left { display: flex; align-items: center; gap: 12px; }
        .cart-icon-wrap {
          background: rgba(0,0,0,0.15); border-radius: 11px;
          width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; position: relative;
        }
        .cart-badge {
          position: absolute; top: -5px; right: -5px;
          background: ${t.bgColor}; color: var(--accent);
          font-size: 9px; font-weight: 800;
          width: 17px; height: 17px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .cart-label { font-size: 11px; font-weight: 600; opacity: .65; }
        .cart-items { font-family: '${fp.display}', serif; font-size: 16px; font-weight: 700; }
        .cart-total { font-family: '${fp.display}', serif; font-size: 19px; font-weight: 900; }

        /* ── SCROLL TOP ── */
        .scroll-top {
          position: fixed; bottom: 96px; right: 16px; z-index: 99;
          width: 40px; height: 40px; border-radius: 50%;
          background: var(--surface); border: 1px solid var(--border); color: var(--muted);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 16px rgba(0,0,0,.3); transition: all .2s;
        }
        .scroll-top:hover { border-color: var(--accent); color: var(--accent); }

        .bottom-space { height: 96px; }
      `}</style>

      <div className="menu-root">
        {/* HERO */}
        <div className="hero">
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <div className="hero-badge">
              <span className="hero-dot" />
              Table {table.table_number}
            </div>
            <h1 className="hero-title">
              <em>{restaurant.name}</em>
            </h1>
            {restaurant.description && (
              <p className="hero-sub">{restaurant.description}</p>
            )}
            <div className="hero-divider" />
          </div>
        </div>

        {/* STICKY NAV */}
        {categories.length > 0 && (
          <div className="cat-nav-wrap">
            <div className="cat-nav" ref={navRef}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  data-cat={cat.id}
                  className={`cat-pill ${activeCategory === cat.id ? "active" : ""}`}
                  onClick={() => scrollToCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MENU SECTIONS */}
        {categories.length > 0 ? (
          categories.map((category, catIdx) => {
            const categoryItems = items?.filter(
              (item) => item.category_id === category.id && item.is_available,
            );
            if (!categoryItems?.length) return null;

            return (
              <div
                key={category.id}
                ref={(el) => {
                  categoryRefs.current[category.id] = el;
                }}
              >
                <div className="section-wrap">
                  <div className="section-head">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="section-cat-img"
                      />
                    ) : (
                      <div className="section-cat-emoji">
                        {CATEGORY_EMOJIS[catIdx % CATEGORY_EMOJIS.length]}
                      </div>
                    )}
                    <div>
                      <h2 className="section-title">{category.name}</h2>
                      <p className="section-count">
                        {categoryItems.length}{" "}
                        {categoryItems.length === 1 ? "item" : "items"}
                      </p>
                    </div>
                  </div>
                  <div className="section-line" />

                  {categoryItems.map((item) => {
                    const cartItem = cart.items.find((i) => i.id === item.id);
                    return (
                      <div key={item.id} className="item-card">
                        {item.image_url ? (
                          <div className="item-img-wrap">
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="item-img"
                            />
                          </div>
                        ) : (
                          <div className="item-img-placeholder">
                            {CATEGORY_EMOJIS[catIdx % CATEGORY_EMOJIS.length]}
                          </div>
                        )}

                        <div className="item-body">
                          <div className="item-badges">
                            {item.is_vegetarian && (
                              <span className="badge-veg">
                                <Leaf size={8} /> Veg
                              </span>
                            )}
                            {item.is_popular && (
                              <span className="badge-popular">
                                <Flame size={8} /> Popular
                              </span>
                            )}
                          </div>
                          <h3 className="item-name">{item.name}</h3>
                          {item.description && (
                            <p className="item-desc">{item.description}</p>
                          )}
                          <div className="item-footer">
                            <div>
                              <p className="item-price-label">Price</p>
                              <p className="item-price">
                                <span className="rupee">₹</span>
                                {item.price.toFixed(0)}
                              </p>
                            </div>
                            {!cartItem ? (
                              <button
                                className="btn-add"
                                onClick={() => handleIncrease(item)}
                              >
                                <Plus size={13} strokeWidth={3} /> Add
                              </button>
                            ) : (
                              <div className="counter-wrap">
                                <button
                                  className="counter-btn minus"
                                  onClick={() => handleDecrease(item)}
                                >
                                  <Minus size={12} strokeWidth={3} />
                                </button>
                                <span className="counter-num">
                                  {cartItem.quantity}
                                </span>
                                <button
                                  className="counter-btn"
                                  onClick={() => handleIncrease(item)}
                                >
                                  <Plus size={12} strokeWidth={3} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
              color: dimText,
            }}
          >
            <p style={{ fontSize: 48, marginBottom: 16 }}>🍽️</p>
            <p style={{ fontFamily: `'${fp.display}', serif`, fontSize: 20 }}>
              No menu items yet
            </p>
          </div>
        )}

        <div className="bottom-space" />

        {/* FLOATING CART */}
        {cart.items.length > 0 && (
          <div className="cart-bar">
            <button
              className={`cart-btn ${cartBump ? "bump" : ""}`}
              onClick={() => router.push(`/r/${restaurant.slug}/cart`)}
            >
              <div className="cart-left">
                <div className="cart-icon-wrap">
                  <ShoppingCart size={19} />
                  <span className="cart-badge">{totalItems}</span>
                </div>
                <div style={{ textAlign: "left" }}>
                  <p className="cart-label">Your Order</p>
                  <p className="cart-items">
                    {totalItems} {totalItems === 1 ? "item" : "items"}
                  </p>
                </div>
              </div>
              <p className="cart-total">
                <span className="rupee">₹</span>
                {cart.total?.toFixed(0) ?? "0"}
              </p>
            </button>
          </div>
        )}

        {/* SCROLL TO TOP */}
        {scrolled && (
          <button
            className="scroll-top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <ChevronUp size={17} />
          </button>
        )}
      </div>
    </>
  );
}
