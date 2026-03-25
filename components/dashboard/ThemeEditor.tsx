"use client";

// components/dashboard/ThemeEditor.tsx

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { Check, RotateCcw, Loader2, Palette, Type, Layers } from "lucide-react";
import {
  RestaurantTheme,
  DEFAULT_THEME,
  FONT_PAIRS,
  THEME_PRESETS,
  deriveSurface,
  hexA,
  isDarkColor,
} from "@/types/theme";

interface ThemeEditorProps {
  restaurantId:   string;
  restaurantName: string;
  initialTheme?:  Partial<RestaurantTheme>;
}

type Tab = "colors" | "fonts" | "shapes";

export default function ThemeEditor({ restaurantId, restaurantName, initialTheme }: ThemeEditorProps) {
  const [theme, setTheme]   = useState<RestaurantTheme>({ ...DEFAULT_THEME, ...initialTheme });
  const [tab, setTab]       = useState<Tab>("colors");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

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

  // ── Derived preview values ─────────────────────────────────
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

  // ── ALL CSS scoped under .te__ prefix — nothing leaks into dashboard ──
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
    ${FONT_PAIRS.map(f => `@import url('${f.googleUrl}');`).join("\n")}

    .te__root {
      display: grid;
      grid-template-columns: 360px 1fr;
      height: calc(100vh - 64px);
      background: #0e0b08;
      font-family: 'DM Sans', sans-serif;
      color: #f0ebe3;
      overflow: hidden;
    }
    @media(max-width: 900px) {
      .te__root { grid-template-columns: 1fr; }
      .te__pv { display: none; }
    }

    .te__ed {
      padding: 24px 20px 28px;
      border-right: 1px solid rgba(255,255,255,.06);
      overflow-y: auto;
      background: #0e0b08;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,.08) transparent;
    }
    .te__ed::-webkit-scrollbar { width: 4px; }
    .te__ed::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 2px; }

    .te__title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 900; color: #f0ebe3; margin-bottom: 2px; }
    .te__sub   { font-size: 12px; color: #6a5e50; margin-bottom: 20px; }

    .te__tabs { display: flex; gap: 3px; background: #181410; border: 1px solid #2a2218; border-radius: 11px; padding: 3px; margin-bottom: 20px; }
    .te__tab  { flex: 1; padding: 7px 4px; border-radius: 8px; border: none; font-size: 12px; font-weight: 600; cursor: pointer; transition: all .15s; display: flex; align-items: center; justify-content: center; gap: 5px; font-family: 'DM Sans', sans-serif; background: transparent; color: #6a5e50; }
    .te__tab.te__on { background: #2a2218; color: #f0ebe3; }

    .te__lbl { font-size: 9px; font-weight: 700; color: #4a4030; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; display: block; }

    .te__presets { display: grid; grid-template-columns: repeat(3,1fr); gap: 6px; margin-bottom: 20px; }
    .te__preset  { border: 1px solid #2a2218; background: #181410; border-radius: 9px; padding: 9px 5px; cursor: pointer; text-align: center; transition: all .15s; font-family: 'DM Sans', sans-serif; }
    .te__preset:hover { border-color: #4a4030; }
    .te__pswatch { display: flex; gap: 3px; justify-content: center; margin-bottom: 5px; }
    .te__pdot    { width: 10px; height: 10px; border-radius: 50%; }
    .te__pname   { font-size: 9px; color: #6a5e50; font-weight: 500; }

    .te__crow { display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; background: #181410; border: 1px solid #2a2218; border-radius: 10px; margin-bottom: 6px; }
    .te__clbl { font-size: 12px; color: #c0a888; font-weight: 500; }
    .te__csub { font-size: 9px; color: #4a4030; margin-top: 1px; }
    .te__cr   { display: flex; align-items: center; gap: 8px; }
    .te__chex { font-size: 9px; color: #6a5e50; font-family: monospace; background: #231f19; padding: 2px 6px; border-radius: 4px; }
    .te__cswatch { width: 32px; height: 32px; border-radius: 8px; border: 2px solid rgba(255,255,255,.1); cursor: pointer; position: relative; overflow: hidden; flex-shrink: 0; }
    .te__cswatch input[type="color"] { position: absolute; inset: -6px; width: calc(100% + 12px); height: calc(100% + 12px); opacity: 0; cursor: pointer; border: none; padding: 0; }

    .te__fopts { display: flex; flex-direction: column; gap: 6px; }
    .te__fopt  { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #181410; border: 1px solid #2a2218; border-radius: 10px; cursor: pointer; transition: all .15s; font-family: 'DM Sans', sans-serif; width: 100%; text-align: left; }
    .te__fopt.te__on { border-color: #e8a045; background: rgba(232,160,69,.06); }
    .te__fopt:hover:not(.te__on) { border-color: #3a3028; }
    .te__flbl    { font-size: 9px; color: #6a5e50; margin-bottom: 3px; letter-spacing: .5px; display: block; }
    .te__fpreview{ font-size: 15px; font-weight: 700; color: #f0ebe3; line-height: 1.2; display: block; }
    .te__fbody   { font-size: 10px; color: #6a5e50; margin-top: 2px; display: block; }
    .te__fcheck  { width: 18px; height: 18px; border-radius: 50%; background: #e8a045; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

    .te__srow  { margin-bottom: 12px; }
    .te__shead { display: flex; justify-content: space-between; font-size: 11px; color: #6a5e50; margin-bottom: 6px; }
    .te__sval  { color: #e8a045; font-weight: 600; }
    .te__range { width: 100%; accent-color: #e8a045; cursor: pointer; height: 3px; border-radius: 2px; display: block; }

    .te__sopts { display: grid; grid-template-columns: repeat(3,1fr); gap: 6px; margin-bottom: 16px; }
    .te__sopt  { border: 1px solid #2a2218; background: #181410; border-radius: 9px; padding: 10px 5px; cursor: pointer; text-align: center; transition: all .15s; font-family: 'DM Sans', sans-serif; }
    .te__sopt.te__on { border-color: #e8a045; background: rgba(232,160,69,.06); }
    .te__sopt:hover:not(.te__on) { border-color: #3a3028; }
    .te__sicon { font-size: 16px; margin-bottom: 3px; }
    .te__sname { font-size: 9px; color: #6a5e50; font-weight: 500; }

    .te__savebar { display: flex; gap: 7px; margin-top: 12px; padding-top: 20px; border-top: 1px solid #2a2218; }
    .te__bsave   { flex: 1; padding: 11px; background: #e8a045; color: #0f0d0a; border: none; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; justify-content: center; gap: 6px; transition: background .15s; }
    .te__bsave:hover { background: #f5c578; }
    .te__bsave.te__ok { background: #4caf50; }
    .te__bsave:disabled { opacity: .55; cursor: not-allowed; }
    .te__breset  { padding: 11px 14px; background: #181410; border: 1px solid #2a2218; color: #6a5e50; border-radius: 10px; font-size: 12px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .15s; display: flex; align-items: center; gap: 5px; }
    .te__breset:hover { border-color: #4a4030; color: #a09080; }

    .te__pv { overflow-y: auto; scrollbar-width: none; transition: background .3s; }
    .te__pv::-webkit-scrollbar { display: none; }
    .te__pvbar { position: sticky; top: 0; z-index: 10; background: rgba(0,0,0,.4); backdrop-filter: blur(8px); border-bottom: 1px solid rgba(255,255,255,.05); padding: 6px 14px; display: flex; align-items: center; gap: 6px; }
    .te__pvlbl { font-size: 9px; font-weight: 700; color: rgba(255,255,255,.3); text-transform: uppercase; letter-spacing: 2px; }

    /* ── Preview menu styles — ALL scoped under .te__pv so they never touch dashboard ── */
    .te__pv .pv-hero    { padding: 28px 16px 20px; background: linear-gradient(150deg, ${hexA(theme.accentColor, dark ? 0.09 : 0.05)} 0%, ${theme.bgColor} 55%); }
    .te__pv .pv-badge   { display: inline-flex; align-items: center; gap: 5px; background: ${a12}; border: 1px solid ${a25}; color: ${theme.accentColor}; font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; padding: 4px 10px; border-radius: 100px; margin-bottom: 10px; }
    .te__pv .pv-bdot    { width: 5px; height: 5px; border-radius: 50%; background: ${theme.accentColor}; display: inline-block; }
    .te__pv .pv-h1      { font-family: '${fp.display}', serif; font-size: 24px; font-weight: 900; color: ${theme.textColor}; line-height: 1.05; }
    .te__pv .pv-h1 em   { font-style: italic; color: ${theme.accentColor}; }
    .te__pv .pv-divider { width: 36px; height: 2px; background: ${theme.accentColor}; opacity: .7; margin-top: 12px; }

    .te__pv .pv-nav  { background: ${theme.bgColor}; border-bottom: 1px solid ${borderCol}; padding: 9px 14px; display: flex; gap: 6px; overflow: hidden; }
    .te__pv .pv-pill { padding: 5px 12px; border-radius: 100px; font-size: 11px; font-weight: 500; border: 1px solid ${borderCol}; background: ${theme.surfaceColor}; color: ${mutedText}; white-space: nowrap; font-family: '${fp.body}', sans-serif; }
    .te__pv .pv-on   { background: ${theme.accentColor} !important; border-color: ${theme.accentColor} !important; color: ${theme.bgColor} !important; font-weight: 700 !important; }

    .te__pv .pv-sec  { padding: 18px 14px 4px; }
    .te__pv .pv-sh   { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .te__pv .pv-si   { width: 44px; height: 44px; border-radius: 12px; background: ${theme.surfaceColor}; border: 1px solid ${borderCol}; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .te__pv .pv-sn   { font-family: '${fp.display}', serif; font-size: 20px; font-weight: 700; color: ${theme.textColor}; }
    .te__pv .pv-scnt { font-size: 10px; color: ${dimText}; text-transform: uppercase; letter-spacing: 1px; }
    .te__pv .pv-sl   { width: 100%; height: 1px; background: ${theme.accentColor}; opacity: .2; margin-bottom: 12px; }

    .te__pv .pv-card { background: ${theme.surfaceColor}; border: ${cardBorderV}; border-radius: ${theme.cardRadius}px; box-shadow: ${cardShadow}; display: flex; overflow: hidden; margin-bottom: 10px; }
    .te__pv .pv-img  { width: 88px; flex-shrink: 0; background: ${a12}; display: flex; align-items: center; justify-content: center; font-size: 28px; min-height: 100px; }
    .te__pv .pv-body { flex: 1; padding: 11px 12px; display: flex; flex-direction: column; gap: 4px; }
    .te__pv .pv-veg  { font-size: 8px; font-weight: 700; color: #4caf50; background: rgba(76,175,80,.12); border: 1px solid rgba(76,175,80,.25); padding: 2px 6px; border-radius: 100px; display: inline-block; }
    .te__pv .pv-hot  { font-size: 8px; font-weight: 700; color: ${theme.accentColor}; background: ${a12}; border: 1px solid ${a25}; padding: 2px 6px; border-radius: 100px; display: inline-block; }
    .te__pv .pv-name { font-family: '${fp.display}', serif; font-size: 13px; font-weight: 700; color: ${theme.textColor}; line-height: 1.2; }
    .te__pv .pv-desc { font-size: 10px; color: ${mutedText}; line-height: 1.4; font-family: '${fp.body}', sans-serif; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .te__pv .pv-foot { display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 7px; }
    .te__pv .pv-price{ font-family: '${fp.display}', serif; font-size: 16px; font-weight: 700; color: ${theme.accentColor}; }
    .te__pv .pv-rupee{ font-family: '${fp.body}', sans-serif; font-size: .78em; font-weight: 600; }
    .te__pv .pv-add  { padding: 6px 13px; border-radius: ${theme.buttonRadius}px; background: ${btnBg}; color: ${btnColor}; border: ${btnBorder}; font-size: 11px; font-weight: 700; cursor: pointer; font-family: '${fp.body}', sans-serif; }
    .te__pv .pv-counter { display: flex; align-items: center; gap: 2px; background: ${hexA(theme.textColor, dark ? .04 : .05)}; border: 1px solid ${borderCol}; border-radius: 100px; padding: 2px; }
    .te__pv .pv-cbtn { width: 22px; height: 22px; border-radius: 50%; background: ${theme.accentColor}; color: ${theme.bgColor}; border: none; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
    .te__pv .pv-cnum { min-width: 18px; text-align: center; font-size: 11px; font-weight: 700; color: ${theme.textColor}; }

    .te__pv .pv-cart  { padding: 10px 14px 16px; background: linear-gradient(to top, ${theme.bgColor} 70%, transparent); }
    .te__pv .pv-cbtn2 { display: flex; align-items: center; justify-content: space-between; background: ${theme.accentColor}; color: ${theme.bgColor}; border: none; border-radius: 14px; padding: 11px 15px; width: 100%; box-shadow: 0 4px 20px ${a35}; }
    .te__pv .pv-cl    { display: flex; align-items: center; gap: 9px; }
    .te__pv .pv-ci    { width: 30px; height: 30px; border-radius: 8px; background: rgba(0,0,0,.12); display: flex; align-items: center; justify-content: center; font-size: 14px; }
    .te__pv .pv-cll   { font-size: 9px; font-weight: 600; opacity: .65; font-family: '${fp.body}', sans-serif; }
    .te__pv .pv-ccnt  { font-family: '${fp.display}', serif; font-size: 13px; font-weight: 700; }
    .te__pv .pv-ctot  { font-family: '${fp.display}', serif; font-size: 15px; font-weight: 900; }

    @keyframes te__spin { to { transform: rotate(360deg); } }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="te__root">

        {/* ══ EDITOR ══════════════════════════════════════════ */}
        <div className="te__ed">
          <h2 className="te__title">Menu Theme</h2>
          <p className="te__sub">Customise how guests see your menu</p>

          <div className="te__tabs">
            {(["colors", "fonts", "shapes"] as Tab[]).map((t) => (
              <button key={t} className={`te__tab ${tab === t ? "te__on" : ""}`} onClick={() => setTab(t)}>
                {t === "colors" && <Palette size={12} />}
                {t === "fonts"  && <Type size={12} />}
                {t === "shapes" && <Layers size={12} />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* COLORS */}
          {tab === "colors" && (
            <>
              <span className="te__lbl">Quick Presets</span>
              <div className="te__presets">
                {THEME_PRESETS.map((p) => (
                  <button key={p.name} className="te__preset" onClick={() => applyPreset(p.theme)}>
                    <div className="te__pswatch">
                      <div className="te__pdot" style={{ background: p.theme.bgColor }} />
                      <div className="te__pdot" style={{ background: p.theme.accentColor }} />
                      <div className="te__pdot" style={{ background: p.theme.textColor }} />
                    </div>
                    <p className="te__pname">{p.name}</p>
                  </button>
                ))}
              </div>

              <span className="te__lbl">Custom Colors</span>
              {([
                { key: "accentColor"  as const, label: "Accent",      sub: "Buttons · prices · highlights" },
                { key: "bgColor"      as const, label: "Background",   sub: "Menu page background"          },
                { key: "surfaceColor" as const, label: "Card Surface", sub: "Item card fill"                },
                { key: "textColor"    as const, label: "Text",         sub: "Headings & descriptions"       },
              ]).map(({ key, label, sub }) => (
                <div key={key} className="te__crow">
                  <div>
                    <p className="te__clbl">{label}</p>
                    <p className="te__csub">{sub}</p>
                  </div>
                  <div className="te__cr">
                    <span className="te__chex">{theme[key]}</span>
                    <div className="te__cswatch" style={{ background: theme[key] }}>
                      <input
                        type="color"
                        value={theme[key]}
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

          {/* FONTS */}
          {tab === "fonts" && (
            <>
              <span className="te__lbl">Font Pairing</span>
              <div className="te__fopts">
                {FONT_PAIRS.map((pair) => (
                  <button key={pair.key} className={`te__fopt ${theme.fontPair === pair.key ? "te__on" : ""}`}
                    onClick={() => update({ fontPair: pair.key })}>
                    <div>
                      <span className="te__flbl">{pair.label}</span>
                      <span className="te__fpreview" style={{ fontFamily: `'${pair.display}', serif` }}>
                        {restaurantName || "The Grand Spice"}
                      </span>
                      <span className="te__fbody" style={{ fontFamily: `'${pair.body}', sans-serif` }}>
                        Butter Chicken · <span style={{ fontFamily: `'${pair.body}', sans-serif`, fontSize: "0.9em", fontWeight: 600 }}>₹</span>420
                      </span>
                    </div>
                    {theme.fontPair === pair.key && (
                      <div className="te__fcheck">
                        <Check size={11} color="#0f0d0a" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* SHAPES */}
          {tab === "shapes" && (
            <>
              <span className="te__lbl">Corner Radius</span>
              <div className="te__srow">
                <div className="te__shead"><span>Card corners</span><span className="te__sval">{theme.cardRadius}px</span></div>
                <input className="te__range" type="range" min={0} max={32} value={theme.cardRadius}
                  onChange={(e) => update({ cardRadius: Number(e.target.value) })} />
              </div>
              <div className="te__srow" style={{ marginBottom: 20 }}>
                <div className="te__shead"><span>Button corners</span><span className="te__sval">{theme.buttonRadius}px</span></div>
                <input className="te__range" type="range" min={0} max={100} value={theme.buttonRadius}
                  onChange={(e) => update({ buttonRadius: Number(e.target.value) })} />
              </div>

              <span className="te__lbl">Card Style</span>
              <div className="te__sopts">
                {(["elevated","outlined","flat"] as const).map((v) => (
                  <button key={v} className={`te__sopt ${theme.cardStyle === v ? "te__on" : ""}`} onClick={() => update({ cardStyle: v })}>
                    <div className="te__sicon">{v === "elevated" ? "🃏" : v === "outlined" ? "⬜" : "▬"}</div>
                    <div className="te__sname">{v.charAt(0).toUpperCase() + v.slice(1)}</div>
                  </button>
                ))}
              </div>

              <span className="te__lbl">Button Style</span>
              <div className="te__sopts">
                {(["filled","outlined","ghost"] as const).map((v) => (
                  <button key={v} className={`te__sopt ${theme.buttonStyle === v ? "te__on" : ""}`} onClick={() => update({ buttonStyle: v })}>
                    <div className="te__sicon">{v === "filled" ? "●" : v === "outlined" ? "○" : "◌"}</div>
                    <div className="te__sname">{v.charAt(0).toUpperCase() + v.slice(1)}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="te__savebar">
            <button className={`te__bsave ${saved ? "te__ok" : ""}`} onClick={handleSave} disabled={saving}>
              {saving  ? <Loader2 size={15} style={{ animation: "te__spin .8s linear infinite" }} /> : null}
              {saved   ? <Check size={15} strokeWidth={3} /> : null}
              {saving ? "Saving…" : saved ? "Saved!" : "Save Theme"}
            </button>
            <button className="te__breset" onClick={() => { if (confirm("Reset to default?")) setTheme(DEFAULT_THEME); }}>
              <RotateCcw size={13} /> Reset
            </button>
          </div>
        </div>

        {/* ══ LIVE PREVIEW ════════════════════════════════════ */}
        <div className="te__pv" style={{ background: theme.bgColor }}>
          <div className="te__pvbar">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <circle cx="5" cy="5" r="4.5" stroke="rgba(255,255,255,.3)" />
              <path d="M5 2v3l2 1" stroke="rgba(255,255,255,.3)" strokeWidth="1" strokeLinecap="round" />
            </svg>
            <span className="te__pvlbl">Live Preview</span>
          </div>

          <div className="pv-hero">
            <div className="pv-badge"><span className="pv-bdot" /> Table 7</div>
            <h1 className="pv-h1"><em>{restaurantName || "The Grand Spice"}</em></h1>
            <div className="pv-divider" />
          </div>

          <div className="pv-nav">
            <span className="pv-pill pv-on">Starters</span>
            <span className="pv-pill">Main Course</span>
            <span className="pv-pill">Breads</span>
            <span className="pv-pill">Desserts</span>
          </div>

          <div className="pv-sec">
            <div className="pv-sh">
              <div className="pv-si">🥗</div>
              <div><div className="pv-sn">Starters</div><div className="pv-scnt">4 items</div></div>
            </div>
            <div className="pv-sl" />

            <div className="pv-card">
              <div className="pv-img">🫕</div>
              <div className="pv-body">
                <div><span className="pv-veg">● Veg</span></div>
                <div className="pv-name">Paneer Tikka</div>
                <div className="pv-desc">Marinated cottage cheese grilled in a smoky tandoor with mint chutney</div>
                <div className="pv-foot">
                  <div className="pv-price"><span className="pv-rupee">₹</span>280</div>
                  <button className="pv-add">+ Add</button>
                </div>
              </div>
            </div>

            <div className="pv-card">
              <div className="pv-img">🍗</div>
              <div className="pv-body">
                <div><span className="pv-hot">🔥 Popular</span></div>
                <div className="pv-name">Chicken 65</div>
                <div className="pv-desc">Crispy deep-fried chicken with red chillies and curry leaves</div>
                <div className="pv-foot">
                  <div className="pv-price"><span className="pv-rupee">₹</span>320</div>
                  <div className="pv-counter">
                    <button className="pv-cbtn">−</button>
                    <span className="pv-cnum">2</span>
                    <button className="pv-cbtn">+</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pv-card">
              <div className="pv-img">🧆</div>
              <div className="pv-body">
                <div><span className="pv-veg">● Veg</span> <span className="pv-hot">🔥 Popular</span></div>
                <div className="pv-name">Hara Bhara Kabab</div>
                <div className="pv-desc">Spinach, peas and potato patties with herb chutney</div>
                <div className="pv-foot">
                  <div className="pv-price"><span className="pv-rupee">₹</span>240</div>
                  <button className="pv-add">+ Add</button>
                </div>
              </div>
            </div>
          </div>

          <div className="pv-cart">
            <button className="pv-cbtn2">
              <div className="pv-cl">
                <div className="pv-ci">🛒</div>
                <div>
                  <div className="pv-cll">Your Order</div>
                  <div className="pv-ccnt">3 items</div>
                </div>
              </div>
              <div className="pv-ctot">
                <span style={{ fontFamily: `'${fp.body}', sans-serif`, fontSize: "0.75em", fontWeight: 600 }}>₹</span>840
              </div>
            </button>
          </div>
        </div>

      </div>
    </>
  );
}