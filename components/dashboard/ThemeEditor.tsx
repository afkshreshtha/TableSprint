"use client";

// components/dashboard/ThemeEditor.tsx

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { Check, RotateCcw, Loader2, Palette, Type, Layers, Eye } from "lucide-react";
import {
  RestaurantTheme,
  DEFAULT_THEME,
  FONT_PAIRS,
  THEME_PRESETS,
  deriveSurface,
  hexA,
  isDarkColor,
} from "@/types/theme";

// ── Types ──────────────────────────────────────────────────────────────────────
interface ThemeEditorProps {
  restaurantId:   string;
  restaurantName: string;
  initialTheme?:  Partial<RestaurantTheme>;
}

interface PreviewPanelProps {
  theme:          RestaurantTheme;
  restaurantName: string;
  showCloseBtn:   boolean;
  onClose:        () => void;
}

type Tab = "colors" | "fonts" | "shapes";

// ── PreviewPanel — declared at module level, NOT inside ThemeEditor ────────────
function PreviewPanel({ theme, restaurantName, showCloseBtn, onClose }: PreviewPanelProps) {
  const dark        = isDarkColor(theme.bgColor);
  const borderCol   = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.09)";
  const mutedText   = hexA(theme.textColor, dark ? 0.50 : 0.55);
  const dimText     = hexA(theme.textColor, dark ? 0.30 : 0.35);
  const a12         = hexA(theme.accentColor, 0.12);
  const a25         = hexA(theme.accentColor, 0.25);
  const a35         = hexA(theme.accentColor, 0.35);
  const cardShadow  = theme.cardStyle === "elevated"
    ? `0 2px 18px rgba(0,0,0,${dark ? ".45" : ".09"})` : "none";
  const cardBorderV = theme.cardStyle === "outlined"
    ? `1px solid ${borderCol}`
    : theme.cardStyle === "elevated"
    ? `1px solid ${hexA(theme.textColor, dark ? 0.05 : 0.07)}`
    : "none";
  const btnBg     = theme.buttonStyle === "filled"   ? theme.accentColor : "transparent";
  const btnColor  = theme.buttonStyle === "filled"   ? theme.bgColor     : theme.accentColor;
  const btnBorder = theme.buttonStyle === "outlined" ? `1.5px solid ${theme.accentColor}` : "none";
  const fp        = FONT_PAIRS.find((f) => f.key === theme.fontPair) ?? FONT_PAIRS[0];

  const menuItems = [
    {
      emoji: "🫕", tagType: "veg" as const,
      name: "Paneer Tikka",
      desc: "Marinated cottage cheese grilled in a smoky tandoor with mint chutney",
      price: "280", counter: false,
    },
    {
      emoji: "🍗", tagType: "hot" as const,
      name: "Chicken 65",
      desc: "Crispy deep-fried chicken with red chillies and curry leaves",
      price: "320", counter: true,
    },
    {
      emoji: "🧆", tagType: "both" as const,
      name: "Hara Bhara Kabab",
      desc: "Spinach, peas and potato patties with herb chutney",
      price: "240", counter: false,
    },
  ];

  return (
    <div
      className="overflow-y-auto h-full"
      style={{ background: theme.bgColor, scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
    >
      {/* sticky top bar */}
      <div
        className="sticky top-0 z-10 flex items-center gap-2 px-3.5 py-1.5"
        style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="4.5" stroke="rgba(255,255,255,.3)" />
          <path d="M5 2v3l2 1" stroke="rgba(255,255,255,.3)" strokeWidth="1" strokeLinecap="round" />
        </svg>
        <span className="text-[9px] font-bold uppercase tracking-[2px]" style={{ color: "rgba(255,255,255,0.3)" }}>
          Live Preview
        </span>
        {showCloseBtn && (
          <button
            onClick={onClose}
            className="ml-auto text-[9px] font-bold uppercase tracking-[1px] px-2 py-1 rounded"
            style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.08)" }}
          >
            Close
          </button>
        )}
      </div>

      {/* hero */}
      <div
        className="px-4 pt-7 pb-5"
        style={{ background: `linear-gradient(150deg, ${hexA(theme.accentColor, dark ? 0.09 : 0.05)} 0%, ${theme.bgColor} 55%)` }}
      >
        <div
          className="inline-flex items-center gap-1.5 mb-2.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-[2px]"
          style={{ background: a12, border: `1px solid ${a25}`, color: theme.accentColor }}
        >
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: theme.accentColor }} />
          Table 7
        </div>
        <h1
          className="text-2xl font-black leading-tight"
          style={{ fontFamily: `'${fp.display}', serif`, color: theme.textColor }}
        >
          <em style={{ fontStyle: "italic", color: theme.accentColor }}>{restaurantName || "The Grand Spice"}</em>
        </h1>
        <div className="w-9 h-0.5 mt-3 opacity-70" style={{ background: theme.accentColor }} />
      </div>

      {/* category nav */}
      <div
        className="flex gap-1.5 px-3.5 py-2.5 overflow-x-auto"
        style={{ background: theme.bgColor, borderBottom: `1px solid ${borderCol}` }}
      >
        {["Starters", "Main Course", "Breads", "Desserts"].map((cat, i) => (
          <span
            key={cat}
            className="px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap flex-shrink-0"
            style={
              i === 0
                ? { background: theme.accentColor, border: `1px solid ${theme.accentColor}`, color: theme.bgColor, fontWeight: 700, fontFamily: `'${fp.body}', sans-serif` }
                : { background: theme.surfaceColor, border: `1px solid ${borderCol}`, color: mutedText, fontFamily: `'${fp.body}', sans-serif` }
            }
          >
            {cat}
          </span>
        ))}
      </div>

      {/* section header */}
      <div className="px-3.5 pt-4 pb-2">
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: theme.surfaceColor, border: `1px solid ${borderCol}` }}
          >
            🥗
          </div>
          <div>
            <div className="text-xl font-bold" style={{ fontFamily: `'${fp.display}', serif`, color: theme.textColor }}>
              Starters
            </div>
            <div className="text-[10px] uppercase tracking-[1px]" style={{ color: dimText }}>4 items</div>
          </div>
        </div>
        <div className="w-full h-px mb-3" style={{ background: theme.accentColor, opacity: 0.2 }} />

        {/* menu item cards */}
        {menuItems.map((item) => (
          <div
            key={item.name}
            className="flex overflow-hidden mb-2.5"
            style={{
              background: theme.surfaceColor,
              border: cardBorderV,
              borderRadius: `${theme.cardRadius}px`,
              boxShadow: cardShadow,
            }}
          >
            <div
              className="w-[88px] flex-shrink-0 flex items-center justify-center text-3xl min-h-[100px]"
              style={{ background: a12 }}
            >
              {item.emoji}
            </div>
            <div className="flex-1 flex flex-col gap-1 p-3">
              <div className="flex gap-1 flex-wrap">
                {(item.tagType === "veg" || item.tagType === "both") && (
                  <span
                    className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ color: "#4caf50", background: "rgba(76,175,80,0.12)", border: "1px solid rgba(76,175,80,0.25)" }}
                  >
                    ● Veg
                  </span>
                )}
                {(item.tagType === "hot" || item.tagType === "both") && (
                  <span
                    className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ color: theme.accentColor, background: a12, border: `1px solid ${a25}` }}
                  >
                    🔥 Popular
                  </span>
                )}
              </div>
              <div
                className="text-[13px] font-bold leading-tight"
                style={{ fontFamily: `'${fp.display}', serif`, color: theme.textColor }}
              >
                {item.name}
              </div>
              <div
                className="text-[10px] leading-snug line-clamp-2"
                style={{ color: mutedText, fontFamily: `'${fp.body}', sans-serif` }}
              >
                {item.desc}
              </div>
              <div className="flex items-center justify-between mt-auto pt-1.5">
                <div
                  className="text-base font-bold"
                  style={{ fontFamily: `'${fp.display}', serif`, color: theme.accentColor }}
                >
                  <span style={{ fontFamily: `'${fp.body}', sans-serif`, fontSize: "0.78em", fontWeight: 600 }}>₹</span>
                  {item.price}
                </div>
                {item.counter ? (
                  <div
                    className="flex items-center gap-0.5 rounded-full p-0.5"
                    style={{ background: hexA(theme.textColor, dark ? 0.04 : 0.05), border: `1px solid ${borderCol}` }}
                  >
                    <button
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[13px] font-bold border-0 cursor-pointer"
                      style={{ background: theme.accentColor, color: theme.bgColor }}
                    >−</button>
                    <span className="min-w-[18px] text-center text-[11px] font-bold" style={{ color: theme.textColor }}>2</span>
                    <button
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[13px] font-bold border-0 cursor-pointer"
                      style={{ background: theme.accentColor, color: theme.bgColor }}
                    >+</button>
                  </div>
                ) : (
                  <button
                    className="px-3 py-1.5 text-[11px] font-bold cursor-pointer"
                    style={{
                      borderRadius: `${theme.buttonRadius}px`,
                      background: btnBg,
                      color: btnColor,
                      border: btnBorder,
                      fontFamily: `'${fp.body}', sans-serif`,
                    }}
                  >
                    + Add
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* cart bar */}
      <div
        className="px-3.5 pt-2 pb-5"
        style={{ background: `linear-gradient(to top, ${theme.bgColor} 70%, transparent)` }}
      >
        <button
          className="flex items-center justify-between w-full rounded-2xl px-4 py-3 border-0 cursor-pointer"
          style={{ background: theme.accentColor, color: theme.bgColor, boxShadow: `0 4px 20px ${a35}` }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
              style={{ background: "rgba(0,0,0,0.12)" }}
            >
              🛒
            </div>
            <div>
              <div className="text-[9px] font-semibold opacity-65" style={{ fontFamily: `'${fp.body}', sans-serif` }}>
                Your Order
              </div>
              <div className="text-[13px] font-bold" style={{ fontFamily: `'${fp.display}', serif` }}>3 items</div>
            </div>
          </div>
          <div className="text-[15px] font-black" style={{ fontFamily: `'${fp.display}', serif` }}>
            <span style={{ fontFamily: `'${fp.body}', sans-serif`, fontSize: "0.75em", fontWeight: 600 }}>₹</span>840
          </div>
        </button>
      </div>
    </div>
  );
}

// ── ThemeEditor ────────────────────────────────────────────────────────────────
export default function ThemeEditor({ restaurantId, restaurantName, initialTheme }: ThemeEditorProps) {
  const [theme, setTheme]             = useState<RestaurantTheme>({ ...DEFAULT_THEME, ...initialTheme });
  const [tab, setTab]                 = useState<Tab>("colors");
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const update = useCallback((patch: Partial<RestaurantTheme>) => {
    setTheme((t) => ({ ...t, ...patch }));
  }, []);

  const applyPreset = (preset: Partial<RestaurantTheme>) => {
    const bg = preset.bgColor ?? theme.bgColor;
    update({ ...preset, surfaceColor: deriveSurface(bg) });
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("restaurants")
      .update({ theme })
      .eq("id", restaurantId);
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      alert("Failed to save: " + error.message);
    }
  };

  const googleFontImports = FONT_PAIRS.map((f) => `@import url('${f.googleUrl}');`).join("\n");

  return (
    <>
      <style>{`
        ${googleFontImports}
        @keyframes te__spin { to { transform: rotate(360deg); } }
        .te-spin { animation: te__spin 0.8s linear infinite; }
        .te-scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .te-scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        .te-range { accent-color: #e8a045; cursor: pointer; height: 3px; }
      `}</style>

      <div
        className="flex h-[calc(100vh-64px)] bg-[#0e0b08] text-[#f0ebe3] overflow-hidden"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* ══ EDITOR PANEL ══════════════════════════════════ */}
        <div className="w-full md:w-[360px] flex-shrink-0 flex flex-col bg-[#0e0b08] border-r border-white/[0.06] overflow-hidden">

          {/* Scrollable body */}
          <div
            className="flex-1 overflow-y-auto px-5 pt-6 pb-4 te-scrollbar-thin"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,.08) transparent" } as React.CSSProperties}
          >
            <h2 className="text-xl font-black text-[#f0ebe3] mb-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>
              Menu Theme
            </h2>
            <p className="text-[12px] text-[#6a5e50] mb-5">Customise how guests see your menu</p>

            {/* Tabs */}
            <div className="flex gap-1 bg-[#181410] border border-[#2a2218] rounded-xl p-1 mb-5">
              {(["colors", "fonts", "shapes"] as Tab[]).map((t) => (
                <button
                  key={t}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border-0 text-[12px] font-semibold cursor-pointer transition-all duration-150 ${tab === t ? "bg-[#2a2218] text-[#f0ebe3]" : "bg-transparent text-[#6a5e50]"}`}
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                  onClick={() => setTab(t)}
                >
                  {t === "colors" && <Palette size={12} />}
                  {t === "fonts"  && <Type size={12} />}
                  {t === "shapes" && <Layers size={12} />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* ── COLORS TAB ── */}
            {tab === "colors" && (
              <>
                <span className="block text-[9px] font-bold text-[#4a4030] uppercase tracking-[2px] mb-2.5">Quick Presets</span>
                <div className="grid grid-cols-3 gap-1.5 mb-5">
                  {THEME_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      className="border border-[#2a2218] bg-[#181410] rounded-xl py-2.5 px-1.5 cursor-pointer text-center transition-all duration-150 hover:border-[#4a4030]"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                      onClick={() => applyPreset(p.theme)}
                    >
                      <div className="flex gap-1 justify-center mb-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.theme.bgColor }} />
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.theme.accentColor }} />
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.theme.textColor }} />
                      </div>
                      <p className="text-[9px] text-[#6a5e50] font-medium">{p.name}</p>
                    </button>
                  ))}
                </div>

                <span className="block text-[9px] font-bold text-[#4a4030] uppercase tracking-[2px] mb-2.5">Custom Colors</span>
                {([
                  { key: "accentColor"  as const, label: "Accent",      sub: "Buttons · prices · highlights" },
                  { key: "bgColor"      as const, label: "Background",   sub: "Menu page background"          },
                  { key: "surfaceColor" as const, label: "Card Surface", sub: "Item card fill"                },
                  { key: "textColor"    as const, label: "Text",         sub: "Headings & descriptions"       },
                ]).map(({ key, label, sub }) => (
                  <div key={key} className="flex items-center justify-between px-3 py-2.5 bg-[#181410] border border-[#2a2218] rounded-xl mb-1.5">
                    <div>
                      <p className="text-[12px] text-[#c0a888] font-medium">{label}</p>
                      <p className="text-[9px] text-[#4a4030] mt-0.5">{sub}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-[#6a5e50] font-mono bg-[#231f19] px-1.5 py-0.5 rounded">{theme[key]}</span>
                      <div
                        className="w-8 h-8 rounded-lg border-2 border-white/10 cursor-pointer relative overflow-hidden flex-shrink-0"
                        style={{ background: theme[key] }}
                      >
                        <input
                          type="color"
                          value={theme[key]}
                          className="absolute inset-0 w-[calc(100%+12px)] h-[calc(100%+12px)] -top-1.5 -left-1.5 opacity-0 cursor-pointer border-0 p-0"
                          onChange={(e) => {
                            const patch: Partial<RestaurantTheme> = { [key]: e.target.value };
                            if (key === "bgColor") patch.surfaceColor = deriveSurface(e.target.value);
                            update(patch);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* ── FONTS TAB ── */}
            {tab === "fonts" && (
              <>
                <span className="block text-[9px] font-bold text-[#4a4030] uppercase tracking-[2px] mb-2.5">Font Pairing</span>
                <div className="flex flex-col gap-1.5">
                  {FONT_PAIRS.map((pair) => (
                    <button
                      key={pair.key}
                      className={`flex items-center justify-between px-3 py-2.5 bg-[#181410] border rounded-xl cursor-pointer transition-all duration-150 text-left w-full ${theme.fontPair === pair.key ? "border-[#e8a045] bg-[rgba(232,160,69,0.06)]" : "border-[#2a2218] hover:border-[#3a3028]"}`}
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                      onClick={() => update({ fontPair: pair.key })}
                    >
                      <div>
                        <span className="block text-[9px] text-[#6a5e50] tracking-[0.5px] mb-0.5">{pair.label}</span>
                        <span className="block text-[15px] font-bold text-[#f0ebe3] leading-tight"
                          style={{ fontFamily: `'${pair.display}', serif` }}>
                          {restaurantName || "The Grand Spice"}
                        </span>
                        <span className="block text-[10px] text-[#6a5e50] mt-0.5"
                          style={{ fontFamily: `'${pair.body}', sans-serif` }}>
                          Butter Chicken · <span style={{ fontFamily: `'${pair.body}', sans-serif`, fontSize: "0.9em", fontWeight: 600 }}>₹</span>420
                        </span>
                      </div>
                      {theme.fontPair === pair.key && (
                        <div className="w-[18px] h-[18px] rounded-full bg-[#e8a045] flex items-center justify-center flex-shrink-0">
                          <Check size={11} color="#0f0d0a" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* ── SHAPES TAB ── */}
            {tab === "shapes" && (
              <>
                <span className="block text-[9px] font-bold text-[#4a4030] uppercase tracking-[2px] mb-2.5">Corner Radius</span>
                <div className="mb-3">
                  <div className="flex justify-between text-[11px] text-[#6a5e50] mb-1.5">
                    <span>Card corners</span>
                    <span className="text-[#e8a045] font-semibold">{theme.cardRadius}px</span>
                  </div>
                  <input className="te-range w-full block" type="range" min={0} max={32} value={theme.cardRadius}
                    onChange={(e) => update({ cardRadius: Number(e.target.value) })} />
                </div>
                <div className="mb-5">
                  <div className="flex justify-between text-[11px] text-[#6a5e50] mb-1.5">
                    <span>Button corners</span>
                    <span className="text-[#e8a045] font-semibold">{theme.buttonRadius}px</span>
                  </div>
                  <input className="te-range w-full block" type="range" min={0} max={100} value={theme.buttonRadius}
                    onChange={(e) => update({ buttonRadius: Number(e.target.value) })} />
                </div>

                <span className="block text-[9px] font-bold text-[#4a4030] uppercase tracking-[2px] mb-2.5">Card Style</span>
                <div className="grid grid-cols-3 gap-1.5 mb-4">
                  {(["elevated", "outlined", "flat"] as const).map((v) => (
                    <button
                      key={v}
                      className={`border rounded-xl py-2.5 px-1.5 cursor-pointer text-center transition-all duration-150 ${theme.cardStyle === v ? "border-[#e8a045] bg-[rgba(232,160,69,0.06)]" : "border-[#2a2218] bg-[#181410] hover:border-[#3a3028]"}`}
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                      onClick={() => update({ cardStyle: v })}
                    >
                      <div className="text-base mb-1">{v === "elevated" ? "🃏" : v === "outlined" ? "⬜" : "▬"}</div>
                      <div className="text-[9px] text-[#6a5e50] font-medium">{v.charAt(0).toUpperCase() + v.slice(1)}</div>
                    </button>
                  ))}
                </div>

                <span className="block text-[9px] font-bold text-[#4a4030] uppercase tracking-[2px] mb-2.5">Button Style</span>
                <div className="grid grid-cols-3 gap-1.5 mb-4">
                  {(["filled", "outlined", "ghost"] as const).map((v) => (
                    <button
                      key={v}
                      className={`border rounded-xl py-2.5 px-1.5 cursor-pointer text-center transition-all duration-150 ${theme.buttonStyle === v ? "border-[#e8a045] bg-[rgba(232,160,69,0.06)]" : "border-[#2a2218] bg-[#181410] hover:border-[#3a3028]"}`}
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                      onClick={() => update({ buttonStyle: v })}
                    >
                      <div className="text-base mb-1">{v === "filled" ? "●" : v === "outlined" ? "○" : "◌"}</div>
                      <div className="text-[9px] text-[#6a5e50] font-medium">{v.charAt(0).toUpperCase() + v.slice(1)}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Save bar ── */}
          <div className="flex gap-1.5 px-5 py-4 border-t border-[#2a2218] bg-[#0e0b08]">
            {/* Preview toggle – mobile only */}
            <button
              className="flex md:hidden items-center justify-center px-3 py-3 bg-[#181410] border border-[#2a2218] text-[#6a5e50] rounded-xl transition-all hover:border-[#4a4030] hover:text-[#a09080]"
              onClick={() => setShowPreview(true)}
            >
              <Eye size={14} />
            </button>
            <button
              className={`flex flex-1 items-center justify-center gap-1.5 py-3 border-0 rounded-xl text-[13px] font-bold cursor-pointer transition-colors duration-150 text-[#0f0d0a] disabled:opacity-55 disabled:cursor-not-allowed ${saved ? "bg-[#4caf50]" : "bg-[#e8a045] hover:bg-[#f5c578]"}`}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 size={15} className="te-spin" />}
              {saved  && <Check size={15} strokeWidth={3} />}
              {saving ? "Saving…" : saved ? "Saved!" : "Save Theme"}
            </button>
            <button
              className="flex items-center gap-1.5 px-3.5 py-3 bg-[#181410] border border-[#2a2218] text-[#6a5e50] rounded-xl text-[12px] cursor-pointer transition-all hover:border-[#4a4030] hover:text-[#a09080]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
              onClick={() => { if (confirm("Reset to default?")) setTheme(DEFAULT_THEME); }}
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>
        </div>

        {/* ══ DESKTOP PREVIEW ════════════════════════════════ */}
        <div className="hidden md:block flex-1 overflow-hidden">
          <PreviewPanel
            theme={theme}
            restaurantName={restaurantName}
            showCloseBtn={false}
            onClose={() => {}}
          />
        </div>

        {/* ══ MOBILE PREVIEW MODAL ═══════════════════════════ */}
        {showPreview && (
          <div className="fixed inset-0 z-50 md:hidden" style={{ background: theme.bgColor }}>
            <PreviewPanel
              theme={theme}
              restaurantName={restaurantName}
              showCloseBtn={true}
              onClose={() => setShowPreview(false)}
            />
          </div>
        )}
      </div>
    </>
  );
}