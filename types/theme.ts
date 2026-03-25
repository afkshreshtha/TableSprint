// types/theme.ts
// Shared between ThemeEditor (dashboard) and TableClient (customer menu)

export interface RestaurantTheme {
  accentColor:  string;           // Primary brand color
  bgColor:      string;           // Page background
  surfaceColor: string;           // Card surface
  textColor:    string;           // Primary text
  fontPair:     FontPairKey;      // Key into FONT_PAIRS
  cardRadius:   number;           // 0–32 px
  buttonRadius: number;           // 0–100 px
  cardStyle:    "elevated" | "outlined" | "flat";
  buttonStyle:  "filled" | "outlined" | "ghost";
}

export const DEFAULT_THEME: RestaurantTheme = {
  accentColor:  "#e8a045",
  bgColor:      "#0f0d0a",
  surfaceColor: "#1a1610",
  textColor:    "#f0ebe3",
  fontPair:     "luxury",
  cardRadius:   20,
  buttonRadius: 100,
  cardStyle:    "elevated",
  buttonStyle:  "filled",
};

// ── Font Pairs ────────────────────────────────────────────────
export type FontPairKey =
  | "luxury"
  | "editorial"
  | "modern"
  | "minimal"
  | "bold"
  | "friendly";

export interface FontPair {
  key:     FontPairKey;
  label:   string;
  display: string;   // heading / item name font
  body:    string;   // description / UI font
  googleUrl: string;
}

export const FONT_PAIRS: FontPair[] = [
  {
    key: "luxury",
    label: "Luxury Serif",
    display: "Playfair Display",
    body: "DM Sans",
    googleUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap",
  },
  {
    key: "editorial",
    label: "Editorial",
    display: "Cormorant Garamond",
    body: "Jost",
    googleUrl: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,700;1,700&family=Jost:wght@400;500;600&display=swap",
  },
  {
    key: "modern",
    label: "Modern Sans",
    display: "Sora",
    body: "Sora",
    googleUrl: "https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap",
  },
  {
    key: "minimal",
    label: "Clean Minimal",
    display: "Josefin Sans",
    body: "Lato",
    googleUrl: "https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600;700&family=Lato:wght@400;700&display=swap",
  },
  {
    key: "bold",
    label: "Bold Display",
    display: "Abril Fatface",
    body: "Source Sans 3",
    googleUrl: "https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Source+Sans+3:wght@400;600&display=swap",
  },
  {
    key: "friendly",
    label: "Friendly Serif",
    display: "Fraunces",
    body: "Nunito",
    googleUrl: "https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,700&family=Nunito:wght@400;600;700&display=swap",
  },
];

// ── Presets ───────────────────────────────────────────────────
export const THEME_PRESETS: { name: string; theme: Partial<RestaurantTheme> }[] = [
  {
    name: "Midnight Gold",
    theme: { accentColor: "#e8a045", bgColor: "#0f0d0a", surfaceColor: "#1a1610", textColor: "#f0ebe3" },
  },
  {
    name: "Forest",
    theme: { accentColor: "#4caf7d", bgColor: "#080f0a", surfaceColor: "#0f1a12", textColor: "#e4f2ea" },
  },
  {
    name: "Rose Rouge",
    theme: { accentColor: "#e0607a", bgColor: "#120a0e", surfaceColor: "#1c1014", textColor: "#f5e8ec" },
  },
  {
    name: "Ocean",
    theme: { accentColor: "#4a9eff", bgColor: "#06101c", surfaceColor: "#0d1826", textColor: "#e4eeff" },
  },
  {
    name: "Warm Ivory",
    theme: { accentColor: "#b5621e", bgColor: "#faf6f0", surfaceColor: "#ffffff", textColor: "#1e1610" },
  },
  {
    name: "Violet",
    theme: { accentColor: "#9b72f5", bgColor: "#0b0910", surfaceColor: "#12101a", textColor: "#ece8ff" },
  },
];

// ── Helper: derive surface from bg ────────────────────────────
export function deriveSurface(bgHex: string): string {
  const r = parseInt(bgHex.slice(1, 3), 16);
  const g = parseInt(bgHex.slice(3, 5), 16);
  const b = parseInt(bgHex.slice(5, 7), 16);
  const lum = (r * 299 + g * 587 + b * 114) / 1000;
  const dark = lum < 128;
  const d = dark ? 18 : -18;
  const c = (v: number) => Math.min(255, Math.max(0, v)).toString(16).padStart(2, "0");
  return `#${c(r + d)}${c(g + d)}${c(b + d)}`;
}

// ── Helper: hex to rgba ───────────────────────────────────────
export function hexA(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Helper: is dark background ────────────────────────────────
export function isDarkColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}