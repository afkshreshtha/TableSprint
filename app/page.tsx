"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UtensilsCrossed,
  Clock,
  TrendingUp,
  Smartphone,
  CheckCircle,
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  ShoppingBag,
  Utensils,
  Grid,
  History,
  Users,
  Palette,
  CreditCard,
  Settings,
  DollarSign,
  ChefHat,
  Bell,
  Menu,
  X,
  Star,
  Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/authContext";
import { supabase } from "@/lib/supabase/client";
import Image from "next/image";

/* ── Types ── */
interface Plan {
  id: string;
  name: string;
  price: number | null;
  interval: string | null;
  features: string[];
  highlighted: boolean;
  cta: string;
  badge?: string;
}

/* ── Main ── */
export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!loading && user) router.push("/dashboard");
  }, [user, loading, router]);

  /* Scroll effects */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close menu on resize */
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* Fetch plans from Supabase */
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (error || !data || data.length === 0) {
          setPlans(FALLBACK_PLANS);
        } else {
          setPlans(
            data.map((p: any) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              interval: p.interval,
              features: p.features || [],
              highlighted: p.is_highlighted || false,
              cta: p.cta_text || "Get Started",
              badge: p.badge_text || undefined,
            })),
          );
        }
      } catch {
        setPlans(FALLBACK_PLANS);
      } finally {
        setPlansLoading(false);
      }
    };
    fetchPlans();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  if (user) return null;

  return (
    <div className="font-['DM_Sans'] text-slate-900 bg-[#FAFAFA] overflow-x-hidden selection:bg-orange-500/30">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes barGrow { from { height: 0; } }
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .fade-up { animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .bar-grow { animation: barGrow 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .skeleton { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; }
        .gradient-text { background: linear-gradient(to right, #f97316, #f43f5e); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .grid-bg { background-image: radial-gradient(rgba(15, 23, 42, 0.08) 1px, transparent 1px); background-size: 32px 32px; }
        .glass-panel { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.5); }
        .te-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .te-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }
      `}</style>

      {/* ── Modern Floating Nav ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 pt-4 px-4 ${
          scrolled ? "translate-y-0" : "translate-y-2"
        }`}
      >
        <div
          className={`max-w-5xl mx-auto transition-all duration-300 rounded-2xl ${
            scrolled
              ? "glass-panel shadow-sm px-4 py-2"
              : "bg-transparent px-2 py-2"
          } flex items-center justify-between`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-30  h-10 rounded-xl overflow-hidden  flex items-center justify-center">
              <Image
                src="/tabrova-logo.png"
                alt="Tabrova"
                width={100}
                height={100}
                className="object-contain w-full h-full"
              />
            </div>
          </Link>

          {/* Desktop nav links */}
          {/* Desktop nav links */}
          <div className="hidden md:flex items-center bg-white/50 backdrop-blur-md rounded-full px-6 py-2 shadow-[inset_0_1px_1px_rgba(255,255,255,1)] ring-1 ring-slate-900/5">
            {[
              { label: "Features", href: "#features" },
              { label: "Pricing", href: "#pricing" },
              { label: "About", href: "/about" },
              { label: "Contact", href: "/contact" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="font-['Sora'] text-sm font-medium text-slate-600 hover:text-slate-900 px-4 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="font-['Sora'] text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="font-['Sora'] text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl transition-all shadow-[0_2px_10px_rgba(0,0,0,0.1)]"
            >
              Get Started
            </Link>
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full mt-2 left-4 right-4 glass-panel rounded-2xl shadow-xl border border-white p-4">
            <div className="flex flex-col gap-2">
              {[
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
                { label: "About", href: "/about" },
                { label: "Contact", href: "/contact" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-['Sora'] text-sm font-medium text-slate-700 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <div className="h-px bg-slate-200 my-2" />
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="font-['Sora'] text-sm font-medium text-slate-700 p-3 text-center"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="font-['Sora'] text-sm font-semibold bg-slate-900 text-white p-3 rounded-xl text-center"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-36 pb-20 sm:pt-48 sm:pb-32 overflow-hidden px-5">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute top-[-10%] left-[50%] translate-x-[-50%] w-[800px] h-[600px] bg-orange-400/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-rose-400/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
          {/* Pill Badge */}
          <div
            className="fade-up inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-orange-500/20 text-orange-600 font-['Sora'] text-xs font-semibold px-4 py-2 rounded-full mb-8 shadow-sm"
            style={{ animationDelay: "0ms" }}
          >
            <Sparkles size={14} className="text-orange-500" />
            <span>Tabrova is here — UPI QR ordering now live</span>
          </div>

          <h1
            className="fade-up font-['Sora'] font-extrabold text-slate-900 leading-[1.05] tracking-tight mb-6 max-w-4xl"
            style={{
              fontSize: "clamp(42px, 7vw, 80px)",
              animationDelay: "100ms",
            }}
          >
            The operating system for <br className="hidden sm:block" />
            <span className="gradient-text">modern restaurants</span>
          </h1>

          <p
            className="fade-up text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
            style={{
              fontSize: "clamp(16px, 2vw, 20px)",
              animationDelay: "200ms",
            }}
          >
            Replace your clunky legacy POS. Manage QR menus, kitchen displays,
            table analytics, and real-time payments from one beautiful
            dashboard.
          </p>

          <div
            className="fade-up flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-6"
            style={{ animationDelay: "300ms" }}
          >
            <Link
              href="/signup"
              className="group relative inline-flex items-center justify-center gap-2 font-['Sora'] text-[15px] font-semibold bg-slate-900 text-white px-8 py-4 rounded-xl transition-all hover:bg-slate-800 w-full sm:w-auto overflow-hidden shadow-[0_8px_30px_rgba(15,23,42,0.2)] hover:shadow-[0_12px_40px_rgba(15,23,42,0.3)] hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              Start for free{" "}
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center justify-center gap-2 font-['Sora'] text-[15px] font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-8 py-4 rounded-xl transition-all w-full sm:w-auto shadow-sm hover:shadow-md"
            >
              <LayoutDashboard size={16} className="text-slate-400" />
              Explore features
            </Link>
          </div>

          <div
            className="fade-up flex flex-wrap justify-center items-center gap-4 text-sm font-medium text-slate-500"
            style={{ animationDelay: "400ms" }}
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle size={16} className="text-emerald-500" /> No credit
              card
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-300" />
            <div className="flex items-center gap-1.5">
              <CheckCircle size={16} className="text-emerald-500" /> 14-day free
              trial
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-300" />
            <div className="flex items-center gap-1.5">
              <CheckCircle size={16} className="text-emerald-500" /> Cancel
              anytime
            </div>
          </div>
        </div>

        {/* ── REALISTIC TABROVA DASHBOARD MOCKUP ── */}
        <div
          className="fade-up relative z-20 max-w-[1100px] mx-auto mt-20"
          style={{ animationDelay: "500ms" }}
        >
          <div className="absolute -inset-1 bg-gradient-to-b from-orange-500/15 to-transparent rounded-[24px] blur-xl opacity-60" />

          <div
            className="relative bg-white rounded-[20px] border border-slate-200 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col h-[600px]"
            style={{ animation: "float 6s ease-in-out infinite" }}
          >
            {/* macOS Window Controls */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>

            {/* Mockup Body */}
            <div className="flex flex-1 overflow-hidden">
              {/* ── Sidebar ── */}
              <div className="hidden sm:flex w-[240px] bg-white border-r border-slate-100 flex-col shrink-0">
                {/* Logo Area */}
                <div className="p-5 flex items-center gap-2">
                  <div className="relative w-30  h-10 rounded-xl overflow-hidden  flex items-center justify-center">
                    <Image
                      src="/tabrova-logo.png"
                      alt="Tabrova"
                      width={100}
                      height={100}
                      className="object-contain w-full h-full"
                    />
                  </div>
                </div>

                {/* Profile Card */}
                <div className="px-4 mb-4">
                  <div className="bg-orange-500 rounded-xl p-3 flex items-center gap-3 text-white shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center font-bold text-lg shrink-0">
                      D
                    </div>
                    <div>
                      <div className="font-bold text-sm leading-tight">
                        Dominos
                      </div>
                      <div className="text-[10px] bg-white/20 inline-flex items-center gap-1 px-1.5 py-0.5 rounded mt-1">
                        <Zap size={10} className="fill-white" /> Pro Plan
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto te-scrollbar px-3 flex flex-col gap-1 pb-4">
                  {[
                    { icon: LayoutDashboard, label: "Dashboard", active: true },
                    { icon: ShoppingBag, label: "Live Orders" },
                    { icon: Utensils, label: "Menu" },
                    { icon: Grid, label: "Tables" },
                    { icon: History, label: "Order History" },
                    { icon: Users, label: "Manage Staff" },
                    { icon: Palette, label: "Theme" },
                    { icon: CreditCard, label: "Subscription" },
                    { icon: Settings, label: "Settings" },
                  ].map((item, i) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-default ${item.active ? "bg-orange-50 text-orange-600 font-medium" : "text-slate-500 hover:bg-slate-50"}`}
                    >
                      <item.icon
                        size={18}
                        strokeWidth={item.active ? 2.5 : 2}
                        className={
                          item.active ? "text-orange-500" : "text-slate-400"
                        }
                      />
                      <span className="text-sm">{item.label}</span>
                      {item.active && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Bottom User Profile */}
                <div className="p-4 border-t border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs shrink-0">
                    S
                  </div>
                  <div className="text-xs font-medium text-slate-700 truncate">
                    shreshthaagarwal123...
                  </div>
                </div>
              </div>

              {/* ── Main Area ── */}
              <div className="flex-1 bg-[#F9FAFB] flex flex-col overflow-hidden">
                {/* Topbar */}
                <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
                  <div className="font-bold text-slate-800">Dashboard</div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-full">
                      <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold">
                        D
                      </div>
                      <span className="text-xs font-bold text-orange-800">
                        Dominos
                      </span>
                      <span className="text-[9px] font-bold bg-orange-200 text-orange-800 px-1.5 rounded">
                        PRO
                      </span>
                    </div>
                    <Bell size={18} className="text-slate-400" />
                  </div>
                </div>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto te-scrollbar p-4 sm:p-8">
                  {/* Page Header */}
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                    <div>
                      <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        Analytics
                      </h1>
                      <p className="text-slate-500 text-sm mt-1">
                        Thursday, 9 April 2026
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold text-slate-700">
                        Live
                      </span>
                    </div>
                  </div>

                  {/* Period Selector */}
                  <div className="bg-white border border-slate-200 rounded-xl p-2 flex items-center gap-2 overflow-x-auto te-scrollbar mb-6">
                    <div className="text-xs font-bold text-slate-400 px-2 flex items-center gap-1 shrink-0 uppercase tracking-wider">
                      <Clock size={12} /> Period
                    </div>
                    {["24h", "7d", "30d", "90d", "1yr", "All"].map((p) => (
                      <div
                        key={p}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-default shrink-0 ${p === "24h" ? "bg-orange-500 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}
                      >
                        {p}
                      </div>
                    ))}
                  </div>

                  {/* KPI Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Orders Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                          <ShoppingBag size={20} />
                        </div>
                        <div className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-0.5">
                          ↗ 12%
                        </div>
                      </div>
                      <div className="text-xs font-medium text-slate-500 mb-1">
                        Orders · 24h
                      </div>
                      <div className="text-3xl font-black text-slate-900 mb-1">
                        45
                      </div>
                      <div className="text-[10px] text-slate-400 mt-auto">
                        vs previous period
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
                    </div>

                    {/* Revenue Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                          <DollarSign size={20} />
                        </div>
                        <div className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-0.5">
                          ↗ 8%
                        </div>
                      </div>
                      <div className="text-xs font-medium text-slate-500 mb-1">
                        Revenue · 24h
                      </div>
                      <div className="text-3xl font-black text-slate-900 mb-1">
                        ₹12.4k
                      </div>
                      <div className="text-[10px] text-slate-400 mt-auto">
                        vs previous period
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
                    </div>

                    {/* Active Orders Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                          <ChefHat size={20} />
                        </div>
                      </div>
                      <div className="text-xs font-medium text-slate-500 mb-1">
                        Active Orders
                      </div>
                      <div className="text-3xl font-black text-slate-900 mb-1">
                        7
                      </div>
                      <div className="text-[10px] text-slate-400 mt-auto">
                        in kitchen right now
                      </div>
                    </div>

                    {/* Avg Order Value Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
                          <TrendingUp size={20} />
                        </div>
                        <div className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-0.5">
                          ↗ 2%
                        </div>
                      </div>
                      <div className="text-xs font-medium text-slate-500 mb-1">
                        Avg. Order Value
                      </div>
                      <div className="text-3xl font-black text-slate-900 mb-1">
                        ₹275
                      </div>
                      <div className="text-[10px] text-slate-400 mt-auto">
                        vs previous period
                      </div>
                    </div>
                  </div>

                  {/* Chart Area */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">
                          Performance Trend
                        </h3>
                        <p className="text-xs text-slate-500">
                          Revenue & orders over 24h
                        </p>
                      </div>
                      <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                        <button className="text-[10px] font-bold bg-white text-slate-800 px-3 py-1 rounded shadow-sm">
                          Both
                        </button>
                        <button className="text-[10px] font-bold text-slate-500 px-3 py-1">
                          Revenue
                        </button>
                        <button className="text-[10px] font-bold text-slate-500 px-3 py-1">
                          Orders
                        </button>
                      </div>
                    </div>

                    {/* Fake Line Chart */}
                    <div className="h-[180px] w-full flex items-end gap-1 sm:gap-2 relative border-b border-slate-100 pb-4">
                      {/* Y-axis labels */}
                      <div className="absolute left-0 top-0 bottom-4 flex flex-col justify-between text-[8px] text-slate-400 w-6">
                        <span>₹4k</span>
                        <span>₹3k</span>
                        <span>₹2k</span>
                        <span>₹1k</span>
                        <span>₹0</span>
                      </div>

                      {/* Grid lines */}
                      <div className="absolute left-6 right-0 top-0 bottom-4 flex flex-col justify-between pointer-events-none">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="w-full h-px border-t border-dashed border-slate-100"
                          />
                        ))}
                      </div>

                      {/* Bars/Line visualization mapping */}
                      <div className="ml-6 flex-1 flex items-end justify-between h-full relative">
                        {/* Fake SVG Line */}
                        <svg
                          className="absolute inset-0 w-full h-full"
                          preserveAspectRatio="none"
                          viewBox="0 0 100 100"
                        >
                          <path
                            d="M0,80 L10,75 L20,60 L30,65 L40,40 L50,45 L60,20 L70,30 L80,15 L90,25 L100,10"
                            fill="none"
                            stroke="#f97316"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M0,80 L10,75 L20,60 L30,65 L40,40 L50,45 L60,20 L70,30 L80,15 L90,25 L100,10 L100,100 L0,100 Z"
                            fill="url(#orange-gradient)"
                            opacity="0.1"
                          />
                          <defs>
                            <linearGradient
                              id="orange-gradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop offset="0%" stopColor="#f97316" />
                              <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                          </defs>
                        </svg>

                        {/* Data points */}
                        {[80, 75, 60, 65, 40, 45, 20, 30, 15, 25, 10].map(
                          (y, i) => (
                            <div
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-white border border-orange-500 absolute z-10"
                              style={{
                                left: `${i * 10}%`,
                                top: `${y}%`,
                                transform: "translate(-50%, -50%)",
                              }}
                            />
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Bento Grid ── */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-16">
            <h2
              className="font-['Sora'] font-extrabold tracking-tight text-slate-900 mb-4"
              style={{ fontSize: "clamp(32px, 5vw, 48px)" }}
            >
              Everything you need. <br className="hidden sm:block" /> Nothing
              you don&apos;t.
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              A carefully crafted suite of tools designed specifically to help
              Indian restaurants handle high volume with zero friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="group relative bg-[#FAFAFA] rounded-3xl p-8 border border-slate-200/60 overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1"
              >
                {/* Subtle Hover Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-sm border border-white/50"
                    style={{ background: f.bg, color: f.color }}
                  >
                    <f.icon size={24} strokeWidth={2} />
                  </div>
                  <h3 className="font-['Sora'] text-xl font-bold mb-3 text-slate-900">
                    {f.title}
                  </h3>
                  <p className="text-slate-500 leading-relaxed font-medium">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-5 relative z-10">
          <div className="mb-16">
            <h2
              className="font-['Sora'] font-extrabold tracking-tight mb-4"
              style={{ fontSize: "clamp(32px, 5vw, 48px)" }}
            >
              Live in minutes.
            </h2>
            <p className="text-lg text-slate-400 max-w-xl">
              We eliminated the complex onboarding. Get your digital restaurant
              running before your next lunch service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Desktop connecting line */}
            <div className="hidden md:block absolute top-8 left-[10%] right-[20%] h-px bg-gradient-to-r from-orange-500/50 to-transparent" />

            {STEPS.map((s, i) => (
              <div key={s.title} className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 text-orange-500 font-['Sora'] text-2xl font-bold flex items-center justify-center mb-6 shadow-[inset_0_2px_10px_rgba(255,255,255,0.05)]">
                  {i + 1}
                </div>
                <h3 className="font-['Sora'] text-xl font-bold mb-3">
                  {s.title}
                </h3>
                <p className="text-slate-400 leading-relaxed text-base">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 bg-white relative">
        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-slate-100 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-5 relative z-10">
          <div className="text-center mb-20">
            <h2
              className="font-['Sora'] font-extrabold tracking-tight text-slate-900 mb-4"
              style={{ fontSize: "clamp(32px, 5vw, 48px)" }}
            >
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Start for free to test the waters. Upgrade to Pro when you are
              ready to scale your operations.
            </p>
          </div>

          {plansLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {[0, 1].map((i) => (
                <div key={i} className="skeleton h-[500px] rounded-[32px]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-[32px] p-8 sm:p-10 transition-all duration-300 ${
                    plan.highlighted
                      ? "bg-slate-950 text-white shadow-[0_20px_40px_-10px_rgba(15,23,42,0.3)] md:-translate-y-4 ring-1 ring-slate-800"
                      : "bg-[#FAFAFA] border border-slate-200 text-slate-900"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent rounded-[32px] pointer-events-none" />
                  )}

                  {plan.badge && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-500 to-rose-500 text-white font-['Sora'] text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                      {plan.badge}
                    </div>
                  )}

                  <div className="mb-8 relative z-10">
                    <h3 className="font-['Sora'] text-xl font-bold mb-4">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      {plan.price === null ? (
                        <span className="font-['Sora'] text-4xl font-extrabold tracking-tight">
                          Custom
                        </span>
                      ) : plan.price === 0 ? (
                        <>
                          <span className="font-['Sora'] text-5xl font-extrabold tracking-tight">
                            ₹0
                          </span>
                          <span
                            className={`font-medium ${plan.highlighted ? "text-slate-400" : "text-slate-500"}`}
                          >
                            /month
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-['Sora'] text-5xl font-extrabold tracking-tight">
                            ₹{plan.price.toLocaleString("en-IN")}
                          </span>
                          <span
                            className={`font-medium ${plan.highlighted ? "text-slate-400" : "text-slate-500"}`}
                          >
                            /{plan.interval || "mo"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <ul className="flex flex-col gap-4 mb-10 flex-1 relative z-10">
                    {plan.features.map((f: string) => (
                      <li key={f} className="flex items-start gap-3">
                        <div
                          className={`mt-1 rounded-full p-0.5 ${plan.highlighted ? "bg-orange-500/20 text-orange-400" : "bg-slate-200 text-slate-600"}`}
                        >
                          <CheckCircle size={14} strokeWidth={3} />
                        </div>
                        <span
                          className={`font-medium ${plan.highlighted ? "text-slate-300" : "text-slate-600"}`}
                        >
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.price === null ? "#contact" : "/signup"}
                    className={`block w-full text-center py-4 rounded-xl font-['Sora'] text-[15px] font-bold transition-all relative z-10 ${
                      plan.highlighted
                        ? "bg-white text-slate-950 hover:bg-slate-100"
                        : "bg-slate-900 text-white hover:bg-slate-800 shadow-md"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Bottom ── */}
      <section className="py-24 px-5">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-orange-500 to-rose-500 rounded-[40px] p-10 sm:p-20 text-center relative overflow-hidden shadow-[0_20px_40px_-15px_rgba(249,115,22,0.4)]">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />

          <div className="relative z-10">
            <h2
              className="font-['Sora'] font-extrabold text-white tracking-tight mb-6"
              style={{ fontSize: "clamp(32px, 5vw, 56px)" }}
            >
              Take control of your restaurant today.
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto font-medium">
              Join hundreds of modern Indian restaurants operating faster,
              smarter, and more profitably.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 font-['Sora'] text-base font-bold bg-slate-950 text-white px-10 py-5 rounded-2xl hover:bg-slate-900 hover:scale-105 transition-all shadow-xl"
            >
              Start your free trial <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        id="contact"
        className="bg-[#FAFAFA] border-t border-slate-200 pt-20 pb-10"
      >
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {/* Brand */}
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-2">
                <div className="relative w-30  h-10 rounded-xl overflow-hidden  flex items-center justify-center">
                  <Image
                    src="/tabrova-logo.png"
                    alt="Tabrova"
                    width={100}
                    height={100}
                    className="object-contain w-full h-full"
                  />
                </div>
              </Link>
              <p className="text-slate-500 font-medium mb-6">
                The operating system for modern restaurants.
              </p>
              <a
                href="mailto:hello@tabrova.com"
                className="font-medium text-slate-900 hover:text-orange-500 transition-colors"
              >
                hello@tabrova.com
              </a>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-['Sora'] font-bold text-slate-900 mb-6">
                Product
              </h4>
              <ul className="flex flex-col gap-4">
                {[
                  { href: "#features", label: "Features" },
                  { href: "#pricing", label: "Pricing" },
                  { href: "/login", label: "Log in" },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-slate-500 hover:text-slate-900 font-medium transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-['Sora'] font-bold text-slate-900 mb-6">
                Company
              </h4>
              <ul className="flex flex-col gap-4">
                {[
                  { href: "/about", label: "About" },
                  { href: "/contact", label: "Contact" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-slate-500 hover:text-slate-900 font-medium transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-['Sora'] font-bold text-slate-900 mb-6">
                Legal
              </h4>
              <ul className="flex flex-col gap-4">
                {[
                  { href: "/privacy-policy", label: "Privacy Policy" },
                  { href: "/terms-of-service", label: "Terms of Service" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-slate-500 hover:text-slate-900 font-medium transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 font-medium text-sm">
            <p>© 2026 Tabrova. All rights reserved.</p>
            <p>Made in Agra, UP</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Static data ── */
const FALLBACK_PLANS: Plan[] = [
  {
    id: "free",
    name: "Free Trial",
    price: 0,
    interval: "mo",
    features: [
      "5 menu items",
      "5 tables",
      "Unlimited orders",
      "Basic analytics",
      "QR ordering",
      "UPI payments",
    ],
    highlighted: false,
    cta: "Start Free",
  },
  {
    id: "pro",
    name: "Pro",
    price: 999,
    interval: "mo",
    features: [
      "Unlimited menu items",
      "Advanced revenue analytics",
      "Live kitchen display",
      "Chef & staff accounts",
      "UPI  payments",
      "Priority 24/7 support",
    ],
    highlighted: true,
    cta: "Start 14-Day Trial",
    badge: "Most Popular",
  },
];

const FEATURES = [
  {
    icon: Smartphone,
    title: "App-free QR Ordering",
    desc: "Guests scan, browse, and order instantly from their mobile browser. No downloads, no friction.",
    bg: "#fff7ed",
    color: "#f97316",
  },
  {
    icon: Clock,
    title: "Live Kitchen Sync",
    desc: "Orders flow straight to your kitchen display system. Update ticket status in real-time.",
    bg: "#eff6ff",
    color: "#3b82f6",
  },
  {
    icon: TrendingUp,
    title: "Actionable Analytics",
    desc: "See revenue trends, identify top-selling items, and spot slow movers before they cost you.",
    bg: "#fdf4ff",
    color: "#a855f7",
  },
  {
    icon: UtensilsCrossed,
    title: "Instant Menu Updates",
    desc: "86 an item? Price change? Edit your menu once and it updates live on every QR code instantly.",
    bg: "#f0fdf4",
    color: "#10b981",
  },
  {
    icon: CheckCircle,
    title: "Zero-Setup Payments",
    desc: "Accept UPI directly to your bank account without expensive POS terminals or extra hardware.",
    bg: "#fefce8",
    color: "#eab308",
  },
  {
    icon: Star,
    title: "Smart Recommendations",
    desc: "Automatically highlight popular dishes and pairings to drive higher average order values.",
    bg: "#fff1f2",
    color: "#f43f5e",
  },
];

const STEPS = [
  {
    title: "Create your workspace",
    desc: "Sign up and build your digital restaurant profile. No credit card required.",
  },
  {
    title: "Upload your menu",
    desc: "Add categories, items, and pricing. Tag your specials and dietary options.",
  },
  {
    title: "Print & Serve",
    desc: "Generate your custom table QR codes and you are immediately ready to take orders.",
  },
];
