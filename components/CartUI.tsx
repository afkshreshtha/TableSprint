"use client";

import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { clearCart, addItem, decreaseItem } from "@/store/slices/cartSlice";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useCartPersistence } from "@/hooks/useCartPersistence";
import {
  ArrowLeft, Edit3, Check, ChevronRight,
  Smartphone, Copy, Share2, ExternalLink
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  RestaurantTheme,
  DEFAULT_THEME,
  FONT_PAIRS,
  hexA,
  isDarkColor,
} from "@/types/theme";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  upi_id: string;
  theme?: Partial<RestaurantTheme>;
  tax_percent?: number;            // e.g. 5 means 5% — fetched from restaurants table
  service_charge_percent?: number; // e.g. 10 means 10% — fetched from restaurants table
}

export default function CartUI({ restaurant }: { restaurant: Restaurant }) {
  const cart = useAppSelector((state) => state.cart);
  const dispatch = useAppDispatch();
  const { deleteCartFromSupabase } = useCartPersistence();
  const router = useRouter();

  const [paymentMarked, setPaymentMarked]     = useState(false);
  const [isProcessing, setIsProcessing]       = useState(false);
  const [orderLink, setOrderLink]             = useState("");
  const [paymentMethod, setPaymentMethod]     = useState<"upi" | "cash">("upi");
  const [specialInstructions, setSpecialInstructions] = useState<Record<string, string>>({});
  const [editingItemId, setEditingItemId]     = useState<string | null>(null);
  const [copied, setCopied]                   = useState(false);

  // ── Use restaurant's rates, fallback to 0 if not configured ──
  const taxRate           = (restaurant.tax_percent ?? 0) / 100;
  const serviceChargeRate = (restaurant.service_charge_percent ?? 0) / 100;

const subtotal      = cart.total;
const tax           = Math.round(subtotal * taxRate * 100) / 100;
const serviceCharge = Math.round(subtotal * serviceChargeRate * 100) / 100;
const total         = Math.round((subtotal + tax + serviceCharge) * 100) / 100;

  const upiParams = new URLSearchParams({
    pa: restaurant.upi_id || "",
    pn: restaurant.name,
    am: total.toFixed(2),
    cu: "INR",
    tn: `Order from ${restaurant.name}`,
  });
  const upiLink = `upi://pay?${upiParams.toString()}`;

  // ── Resolve theme ─────────────────────────────────────────
  const t  = { ...DEFAULT_THEME, ...restaurant.theme };
  const fp = FONT_PAIRS.find((f) => f.key === t.fontPair) ?? FONT_PAIRS[0];

  const dark        = isDarkColor(t.bgColor);
  const borderCol   = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.09)";
  const mutedText   = hexA(t.textColor, dark ? 0.50 : 0.55);
  const dimText     = hexA(t.textColor, dark ? 0.28 : 0.35);
  const a12         = hexA(t.accentColor, 0.12);
  const a25         = hexA(t.accentColor, 0.25);
  const a35         = hexA(t.accentColor, 0.35);
  const surface2    = dark ? hexA(t.textColor, 0.04) : hexA(t.textColor, 0.06);
  const surface3    = dark ? hexA(t.textColor, 0.07) : hexA(t.textColor, 0.09);
  const btnBg       = t.buttonStyle === "filled"   ? t.accentColor : "transparent";
  const btnColor    = t.buttonStyle === "filled"   ? t.bgColor     : t.accentColor;
  const btnBorder   = t.buttonStyle === "outlined" ? `1.5px solid ${t.accentColor}` : "none";

  const css = `
    @import url('${fp.googleUrl}');
    .cu__root { min-height:100vh; background:${t.bgColor}; font-family:'${fp.body}',sans-serif; color:${t.textColor}; }
    .cu__header { background:${dark?`${t.bgColor}f2`:`${t.bgColor}f5`}; backdrop-filter:blur(16px); border-bottom:1px solid ${borderCol}; padding:16px 20px; position:sticky; top:0; z-index:50; }
    .cu__back { display:inline-flex; align-items:center; gap:6px; color:${mutedText}; font-size:13px; font-weight:500; background:none; border:none; cursor:pointer; padding:0; transition:color .2s; margin-bottom:14px; font-family:'${fp.body}',sans-serif; }
    .cu__back:hover { color:${t.accentColor}; }
    .cu__header-row { display:flex; align-items:flex-end; justify-content:space-between; }
    .cu__title { font-family:'${fp.display}',serif; font-size:clamp(24px,6vw,32px); font-weight:900; color:${t.textColor}; }
    .cu__count { font-size:12px; color:${mutedText}; font-weight:500; letter-spacing:1px; text-transform:uppercase; margin-bottom:3px; }
    .cu__body { max-width:560px; margin:0 auto; padding:20px 16px 120px; }
    .cu__slbl { font-size:11px; font-weight:600; color:${dimText}; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:12px; display:block; }
    .cu__card { background:${t.surfaceColor}; border:1px solid ${borderCol}; border-radius:${t.cardRadius}px; padding:16px; margin-bottom:10px; transition:border-color .2s; }
    .cu__card:hover { border-color:${hexA(t.textColor, dark?0.12:0.15)}; }
    .cu__card-row { display:flex; align-items:flex-start; gap:12px; }
    .cu__info { flex:1; min-width:0; }
    .cu__name { font-family:'${fp.display}',serif; font-size:16px; font-weight:700; color:${t.textColor}; line-height:1.2; margin-bottom:4px; }
    .cu__price { font-size:13px; color:${t.accentColor}; font-weight:600; }
    .cu__subtotal { font-family:'${fp.display}',serif; font-size:17px; font-weight:700; color:${t.textColor}; white-space:nowrap; }
    .cu__right { display:flex; flex-direction:column; align-items:flex-end; gap:10px; }
    .cu__counter { display:flex; align-items:center; gap:3px; background:${surface2}; border:1px solid ${borderCol}; border-radius:100px; padding:3px; }
    .cu__cbtn { width:28px; height:28px; border-radius:50%; background:${t.accentColor}; color:${t.bgColor}; border:none; cursor:pointer; font-size:15px; font-weight:700; display:flex; align-items:center; justify-content:center; transition:opacity .15s,transform .1s; line-height:1; }
    .cu__cbtn:active { transform:scale(.9); }
    .cu__cbtn.cu__minus { background:${surface3}; border:1px solid ${borderCol}; color:${mutedText}; }
    .cu__cnum { min-width:22px; text-align:center; font-size:13px; font-weight:700; color:${t.textColor}; }
    .cu__si-btn { display:flex; align-items:center; gap:6px; font-size:12px; color:${dimText}; cursor:pointer; background:none; border:none; padding:0; margin-top:10px; padding-top:10px; border-top:1px solid ${borderCol}; width:100%; text-align:left; transition:color .2s; font-family:'${fp.body}',sans-serif; }
    .cu__si-btn:hover { color:${t.accentColor}; }
    .cu__si-filled { color:${hexA(t.accentColor,0.8)}; font-style:italic; }
    .cu__si-area { width:100%; margin-top:10px; padding-top:10px; border-top:1px solid ${borderCol}; }
    .cu__si-area textarea { width:100%; background:${surface2}; border:1px solid ${borderCol}; color:${t.textColor}; border-radius:10px; padding:10px 12px; font-size:12px; font-family:'${fp.body}',sans-serif; resize:none; outline:none; transition:border-color .2s; }
    .cu__si-area textarea:focus { border-color:${hexA(t.accentColor,0.6)}; }
    .cu__si-area textarea::placeholder { color:${dimText}; }
    .cu__si-done { font-size:12px; color:${t.accentColor}; font-weight:600; cursor:pointer; background:none; border:none; margin-top:8px; padding:0; font-family:'${fp.body}',sans-serif; }
    .cu__divider { height:1px; background:${borderCol}; margin:20px 0; }
    .cu__bill { background:${t.surfaceColor}; border:1px solid ${borderCol}; border-radius:${t.cardRadius}px; padding:16px; margin-bottom:20px; }
    .cu__bill-row { display:flex; justify-content:space-between; align-items:center; padding:6px 0; }
    .cu__bill-lbl { font-size:13px; color:${mutedText}; }
    .cu__bill-val { font-size:13px; color:${t.textColor}; font-weight:500; }
    .cu__bill-total-row { display:flex; justify-content:space-between; align-items:center; border-top:1px solid ${borderCol}; margin-top:6px; padding-top:12px; }
    .cu__bill-total-lbl { font-family:'${fp.display}',serif; font-size:17px; font-weight:700; color:${t.textColor}; }
    .cu__bill-total-val { font-family:'${fp.display}',serif; font-size:22px; font-weight:900; color:${t.accentColor}; }
    .cu__rupee { font-family:'${fp.body}',sans-serif; font-weight:600; font-size:0.82em; vertical-align:baseline; letter-spacing:0; }
    .cu__pay-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:20px; }
    .cu__pay-opt { background:${t.surfaceColor}; border:1px solid ${borderCol}; border-radius:${t.cardRadius}px; padding:14px 12px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:6px; transition:all .2s; font-family:'${fp.body}',sans-serif; }
    .cu__pay-opt:hover { border-color:${hexA(t.textColor,dark?0.15:0.18)}; }
    .cu__pay-opt.cu__sel { border-color:${t.accentColor}; background:${a12}; }
    .cu__pay-icon { font-size:24px; }
    .cu__pay-name { font-size:13px; font-weight:600; color:${t.textColor}; }
    .cu__pay-sub { font-size:11px; color:${mutedText}; }
    .cu__upi-box { background:${hexA(t.accentColor,0.06)}; border:1px solid ${a25}; border-radius:${t.cardRadius}px; padding:20px; text-align:center; margin-bottom:16px; }
    .cu__upi-qr { background:#fff; border-radius:12px; padding:12px; display:inline-block; margin-bottom:12px; }
    .cu__upi-lbl { font-size:12px; color:${mutedText}; margin-bottom:12px; }
    .cu__upi-btn { display:flex; align-items:center; justify-content:center; gap:6px; width:100%; background:${t.accentColor}; color:${t.bgColor}; border:none; border-radius:${t.buttonRadius}px; padding:10px; font-size:13px; font-weight:600; cursor:pointer; text-decoration:none; font-family:'${fp.body}',sans-serif; transition:opacity .2s; }
    .cu__upi-btn:hover { opacity:.85; }
    .cu__cash-box { background:rgba(76,175,80,.08); border:1px solid rgba(76,175,80,.25); border-radius:${t.cardRadius}px; padding:16px; margin-bottom:16px; }
    .cu__cash-amount { font-family:'${fp.display}',serif; font-size:28px; font-weight:900; color:#4caf50; margin-bottom:4px; }
    .cu__cash-sub { font-size:12px; color:${mutedText}; }
    .cu__place { width:100%; background:${btnBg}; color:${btnColor}; border:${btnBorder}; border-radius:${t.buttonRadius}px; padding:16px; font-size:16px; font-weight:700; cursor:pointer; font-family:'${fp.body}',sans-serif; display:flex; align-items:center; justify-content:center; gap:8px; transition:opacity .2s,transform .2s,box-shadow .2s; box-shadow:0 6px 24px ${a35}; }
    .cu__place:hover:not(:disabled) { opacity:.88; transform:translateY(-2px); box-shadow:0 10px 32px ${a35}; }
    .cu__place:disabled { opacity:.5; cursor:not-allowed; }
    @keyframes cu__spin { to { transform:rotate(360deg); } }
    .cu__spin { animation:cu__spin .8s linear infinite; }
    .cu__empty { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:70vh; text-align:center; padding:40px; }
    .cu__empty-icon { width:80px; height:80px; border-radius:50%; background:${surface2}; border:1px solid ${borderCol}; display:flex; align-items:center; justify-content:center; font-size:36px; margin-bottom:24px; }
    .cu__empty-title { font-family:'${fp.display}',serif; font-size:24px; font-weight:700; color:${t.textColor}; margin-bottom:8px; }
    .cu__empty-sub { font-size:14px; color:${mutedText}; margin-bottom:24px; }
    .cu__empty-btn { display:inline-flex; align-items:center; gap:6px; background:${btnBg}; color:${btnColor}; border:${btnBorder}; border-radius:${t.buttonRadius}px; padding:12px 24px; font-size:14px; font-weight:700; cursor:pointer; font-family:'${fp.body}',sans-serif; transition:opacity .2s; }
    .cu__empty-btn:hover { opacity:.85; }
    .cu__success-hero { background:linear-gradient(165deg,${hexA(t.accentColor,0.07)} 0%,${t.bgColor} 60%); padding:40px 20px 32px; text-align:center; border-bottom:1px solid ${borderCol}; }
    .cu__success-circle { width:72px; height:72px; border-radius:50%; background:rgba(76,175,80,.1); border:2px solid rgba(76,175,80,.3); display:flex; align-items:center; justify-content:center; margin:0 auto 16px; font-size:32px; color:#4caf50; }
    .cu__success-title { font-family:'${fp.display}',serif; font-size:26px; font-weight:900; color:${t.textColor}; margin-bottom:6px; }
    .cu__success-sub { font-size:13px; color:${mutedText}; }
    .cu__track-box { background:${t.surfaceColor}; border:1px solid ${borderCol}; border-radius:${t.cardRadius}px; padding:20px; margin-bottom:16px; }
    .cu__track-lbl { font-size:11px; color:${dimText}; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; text-align:center; display:block; }
    .cu__track-qr { background:#fff; border-radius:12px; padding:12px; display:inline-block; margin-bottom:16px; }
    .cu__track-link-box { background:${surface2}; border:1px solid ${borderCol}; border-radius:10px; padding:10px 12px; margin-bottom:16px; }
    .cu__track-link-lbl { font-size:10px; color:${dimText}; margin-bottom:4px; display:block; }
    .cu__track-link { font-size:12px; color:${t.accentColor}; word-break:break-all; }
    .cu__action-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px; }
    .cu__action-btn { display:flex; align-items:center; justify-content:center; gap:6px; border:1px solid ${borderCol}; background:${surface2}; color:${t.textColor}; border-radius:${t.cardRadius}px; padding:12px; font-size:13px; font-weight:600; cursor:pointer; font-family:'${fp.body}',sans-serif; transition:all .2s; text-decoration:none; }
    .cu__action-btn:hover { border-color:${t.accentColor}; color:${t.accentColor}; }
    .cu__action-btn.cu__primary { background:${t.accentColor}; color:${t.bgColor}; border-color:${t.accentColor}; }
    .cu__action-btn.cu__primary:hover { opacity:.88; }
    .cu__tip { background:${a12}; border:1px solid ${a25}; border-radius:${t.cardRadius}px; padding:12px 14px; display:flex; align-items:flex-start; gap:8px; }
    .cu__tip-text { font-size:12px; color:${mutedText}; line-height:1.5; }
  `;

  const handleInstructionChange = (itemId: string, value: string) => {
    setSpecialInstructions((prev) => ({ ...prev, [itemId]: value }));
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    try {
      const sessionToken = sessionStorage.getItem("order_session");
      if (!sessionToken) { alert("Session not found. Please refresh and try again."); setIsProcessing(false); return; }

      const { data: existingSession, error: sessionError } = await supabase
        .from("order_sessions").select("id, restaurant_id, table_id")
        .eq("session_token", sessionToken).single();

      if (sessionError || !existingSession) { alert("Session expired. Please scan the QR code again."); setIsProcessing(false); return; }

      if (existingSession.restaurant_id !== restaurant.id) {
        alert("Session mismatch. Please scan the QR code again.");
        sessionStorage.removeItem("order_session"); sessionStorage.removeItem("session_restaurant_id");
        dispatch(clearCart()); setIsProcessing(false); return;
      }

      let tableNumber = null;
      if (existingSession.table_id) {
        const { data: tableData } = await supabase.from("tables").select("table_number").eq("id", existingSession.table_id).single();
        tableNumber = tableData?.table_number || null;
      }

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const { data: order, error: orderError } = await supabase.from("orders").insert({
        session_id: existingSession.id,
        restaurant_id: existingSession.restaurant_id,
        table_id: existingSession.table_id,
        order_number: orderNumber,
        table_number: tableNumber || 0,
        subtotal, tax,
        service_charge: serviceCharge,
        total,
        payment_method: paymentMethod,
        payment_status: paymentMethod === "upi" ? "paid" : "pending",
        status: paymentMethod === "upi" ? "confirmed" : "pending",
      }).select().single();

      if (orderError || !order) { alert(`Failed to create order: ${orderError?.message}`); setIsProcessing(false); return; }

      const items = cart.items.map((item) => ({
        order_id: order.id, menu_item_id: item.id, quantity: item.quantity,
        price_at_time: item.price, price: item.price, name: item.name,
        special_instructions: specialInstructions[item.id] || null,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(items);
      if (itemsError) { alert(`Failed to add items: ${itemsError.message}`); setIsProcessing(false); return; }

      await supabase.from("order_status_history").insert({
        order_id: order.id, status: paymentMethod === "upi" ? "confirmed" : "pending",
      });

      const link = `${window.location.origin}/order/${order.id}`;
      setOrderLink(link); setPaymentMarked(true);
      dispatch(clearCart()); deleteCartFromSupabase();
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("An unexpected error occurred. Please try again.");
    } finally { setIsProcessing(false); }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(orderLink);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  // ── EMPTY STATE ────────────────────────────────────────────
  if (!cart.items.length && !paymentMarked) {
    return (
      <><style>{css}</style>
        <div className="cu__root">
          <div className="cu__header">
            <button className="cu__back" onClick={() => router.back()}><ArrowLeft size={15} /> Back to Menu</button>
          </div>
          <div className="cu__empty">
            <div className="cu__empty-icon">🛒</div>
            <h2 className="cu__empty-title">Your cart is empty</h2>
            <p className="cu__empty-sub">Add something delicious from the menu</p>
            <button className="cu__empty-btn" onClick={() => router.back()}><ArrowLeft size={15} /> Browse Menu</button>
          </div>
        </div>
      </>
    );
  }

  // ── SUCCESS STATE ──────────────────────────────────────────
  if (paymentMarked && orderLink) {
    return (
      <><style>{css}</style>
        <div className="cu__root">
          <div className="cu__success-hero">
            <div className="cu__success-circle">✓</div>
            <h1 className="cu__success-title">Order Confirmed!</h1>
            <p className="cu__success-sub">Your order is being prepared</p>
          </div>
          <div className="cu__body">
            <div className="cu__track-box">
              <span className="cu__track-lbl">Track your order</span>
              <div style={{ textAlign: "center" }}>
                <div className="cu__track-qr"><QRCodeSVG value={orderLink} size={160} /></div>
              </div>
              <div className="cu__track-link-box">
                <span className="cu__track-link-lbl">Order tracking link</span>
                <p className="cu__track-link">{orderLink}</p>
              </div>
              <div className="cu__action-row">
                <button className="cu__action-btn" onClick={handleCopy}>
                  {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied!" : "Copy Link"}
                </button>
                <button className="cu__action-btn" onClick={() => navigator.share?.({ title: "Track My Order", url: orderLink })}>
                  <Share2 size={15} /> Share
                </button>
              </div>
              <a href="/orders" className="cu__action-btn cu__primary" style={{ marginTop: 0 }}>
                <ExternalLink size={15} /> View Order Status
              </a>
            </div>
            <div className="cu__tip">
              <span style={{ fontSize: 14 }}>💡</span>
              <p className="cu__tip-text">Bookmark or screenshot this link to track your order from any device.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── MAIN CART VIEW ─────────────────────────────────────────
  const totalItems = cart.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <><style>{css}</style>
      <div className="cu__root">

        <div className="cu__header">
          <button className="cu__back" onClick={() => router.back()}><ArrowLeft size={15} /> Back to Menu</button>
          <div className="cu__header-row">
            <h1 className="cu__title">Your Order</h1>
            <p className="cu__count">{totalItems} {totalItems === 1 ? "item" : "items"}</p>
          </div>
        </div>

        <div className="cu__body">
          <span className="cu__slbl">Items</span>
          {cart.items.map((item) => (
            <div key={item.id} className="cu__card">
              <div className="cu__card-row">
                <div className="cu__info">
                  <h3 className="cu__name">{item.name}</h3>
                  <p className="cu__price"><span className="cu__rupee">₹</span>{item.price.toFixed(2)} each</p>
                </div>
                <div className="cu__right">
                  <p className="cu__subtotal"><span className="cu__rupee">₹</span>{(item.price * item.quantity).toFixed(2)}</p>
                  <div className="cu__counter">
                    <button className="cu__cbtn cu__minus" onClick={() => {
                      if (item.quantity === 1) {
                        if (confirm("Remove this item from cart?")) {
                          dispatch(decreaseItem(item.id));
                        deleteCartFromSupabase();
                          const n = { ...specialInstructions }; delete n[item.id]; setSpecialInstructions(n);
                        }
                      } else { dispatch(decreaseItem(item.id)); }
                    }}>−</button>
                    <span className="cu__cnum">{item.quantity}</span>
                    <button className="cu__cbtn" onClick={() => dispatch(addItem({ ...item, quantity: 1 }))}>+</button>
                  </div>
                </div>
              </div>
              {editingItemId === item.id ? (
                <div className="cu__si-area">
                  <textarea rows={2} autoFocus value={specialInstructions[item.id] || ""}
                    onChange={(e) => handleInstructionChange(item.id, e.target.value)}
                    placeholder="e.g. No onions, extra spicy, less oil…" />
                  <button className="cu__si-done" onClick={() => setEditingItemId(null)}>✓ Done</button>
                </div>
              ) : (
                <button className="cu__si-btn" onClick={() => setEditingItemId(item.id)}>
                  <Edit3 size={12} />
                  {specialInstructions[item.id]
                    ? <span className="cu__si-filled">"{specialInstructions[item.id]}"</span>
                    : <span>Add special instructions</span>}
                </button>
              )}
            </div>
          ))}

          <div className="cu__divider" />

          <span className="cu__slbl">Bill Summary</span>
          <div className="cu__bill">
            <div className="cu__bill-row">
              <span className="cu__bill-lbl">Subtotal</span>
              <span className="cu__bill-val"><span className="cu__rupee">₹</span>{subtotal.toFixed(2)}</span>
            </div>
            {/* Only render rows when the restaurant has configured a non-zero rate */}
            {taxRate > 0 && (
              <div className="cu__bill-row">
                <span className="cu__bill-lbl">GST ({restaurant.tax_percent}%)</span>
                <span className="cu__bill-val"><span className="cu__rupee">₹</span>{tax.toFixed(2)}</span>
              </div>
            )}
            {serviceChargeRate > 0 && (
              <div className="cu__bill-row">
                <span className="cu__bill-lbl">Service Charge ({restaurant.service_charge_percent}%)</span>
                <span className="cu__bill-val"><span className="cu__rupee">₹</span>{serviceCharge.toFixed(2)}</span>
              </div>
            )}
            <div className="cu__bill-total-row">
              <span className="cu__bill-total-lbl">Total</span>
              <span className="cu__bill-total-val">
                <span className="cu__rupee" style={{ fontSize: "0.75em" }}>₹</span>{total.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="cu__divider" />

          <span className="cu__slbl">Payment Method</span>
          <div className="cu__pay-grid">
            <button className={`cu__pay-opt ${paymentMethod === "upi" ? "cu__sel" : ""}`}
              onClick={() => setPaymentMethod("upi")} disabled={!restaurant.upi_id}
              style={!restaurant.upi_id ? { opacity: 0.4, cursor: "not-allowed" } : {}}>
              <span className="cu__pay-icon">📱</span>
              <span className="cu__pay-name">UPI</span>
              <span className="cu__pay-sub">Pay instantly</span>
            </button>
            <button className={`cu__pay-opt ${paymentMethod === "cash" ? "cu__sel" : ""}`}
              onClick={() => setPaymentMethod("cash")}>
              <span className="cu__pay-icon">💵</span>
              <span className="cu__pay-name">Cash</span>
              <span className="cu__pay-sub">Pay at counter</span>
            </button>
          </div>

          {paymentMethod === "upi" && restaurant.upi_id && (
            <div className="cu__upi-box">
              <div className="cu__upi-qr"><QRCodeSVG value={upiLink} size={150} /></div>
              <p className="cu__upi-lbl">Scan with any UPI app to pay <span className="cu__rupee">₹</span>{total.toFixed(2)}</p>
              <a href={upiLink} className="cu__upi-btn"><Smartphone size={14} /> Open UPI App</a>
            </div>
          )}

          {paymentMethod === "cash" && (
            <div className="cu__cash-box">
              <p className="cu__cash-sub" style={{ marginBottom: 4 }}>Amount to pay at counter</p>
              <p className="cu__cash-amount">
                <span className="cu__rupee" style={{ fontSize: "0.72em", fontWeight: 700 }}>₹</span>{total.toFixed(2)}
              </p>
              <p className="cu__cash-sub">Our staff will collect payment when your order is ready</p>
            </div>
          )}

          <button className="cu__place" onClick={handlePlaceOrder}
            disabled={isProcessing || (paymentMethod === "upi" && !restaurant.upi_id)}>
            {isProcessing ? (
              <><svg className="cu__spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" strokeOpacity=".25" /><path d="M12 2a10 10 0 0 1 10 10" />
              </svg>Processing…</>
            ) : paymentMethod === "upi" ? (
              <><Check size={18} strokeWidth={2.5} /> I've Paid — Confirm Order</>
            ) : (
              <><ChevronRight size={18} strokeWidth={2.5} /> Place Order</>
            )}
          </button>
        </div>
      </div>
    </>
  );
}