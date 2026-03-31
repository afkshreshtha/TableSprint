"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  UtensilsCrossed,
  Clock,
  TrendingUp,
  Smartphone,
  CheckCircle,
  ArrowRight,
  Zap,
  Star,
  ChevronDown,
  Menu,
  X,
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

/* ── Animated counter ── */
function useCounter(end: number, duration = 1500, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, start]);
  return count;
}

/* ── Stat item ── */
function StatItem({
  value,
  suffix,
  label,
  start,
}: {
  value: number;
  suffix: string;
  label: string;
  start: boolean;
}) {
  const count = useCounter(value, 1800, start);
  return (
    <div className="py-7 px-6 text-center border-r border-white/[0.07] last:border-r-0">
      <span className="block font-['Sora'] text-4xl font-extrabold text-orange-500">
        {count}
        {suffix}
      </span>
      <span className="block text-sm text-white/40 mt-1 font-medium">
        {label}
      </span>
    </div>
  );
}

/* ── Main ── */
export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

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

  /* Stats intersection observer */
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsVisible(true);
      },
      { threshold: 0.3 },
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-11 h-11 border-[3px] border-slate-100 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  if (user) return null;

  return (
    <div className="font-['DM_Sans'] text-slate-900 bg-white overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes barGrow { from { height: 0; } }
        @keyframes bounce { 0%,100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(6px); } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .fade-up { animation: fadeUp 0.6s ease both; }
        .bar-grow { animation: barGrow 0.6s ease both; }
        .skeleton { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; }
        .gradient-text { background: linear-gradient(135deg, #f97316 0%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .hero-grid { background-image: linear-gradient(rgba(249,115,22,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,.04) 1px, transparent 1px); background-size: 48px 48px; }
        .mobile-menu-enter { animation: fadeUp 0.2s ease both; }
      `}</style>

      {/* ── Nav ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.08)]" : ""}`}
      >
        <div className="max-w-[1160px] mx-auto px-5">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="relative w-30 h-30 rounded-xl overflow-hidden flex items-center justify-center">
                <Image
                  src="/tabrova-logo.png"
                  alt="Tabrova"
                  width={100}
                  height={100}
                  className="object-contain w-full h-full"
                />
              </div>
              {/* <span className="font-['Sora'] text-lg font-extrabold text-slate-900 hidden sm:block">Tabrova</span> */}
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-7">
              {["#features", "#pricing", "/about", "/contact"].map(
                (href, i) => (
                  <a
                    key={href}
                    href={href}
                    className="font-['Sora'] text-sm font-medium text-slate-600 hover:text-orange-500 transition-colors"
                  >
                    {["Features", "Pricing", "About", "Contact"][i]}
                  </a>
                ),
              )}
            </div>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/login"
                className="font-['Sora'] text-sm font-semibold text-slate-600 hover:text-orange-500 px-4 py-2 rounded-lg transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="font-['Sora'] text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-all shadow-[0_4px_16px_rgba(249,115,22,0.35)] hover:shadow-[0_6px_22px_rgba(249,115,22,0.4)] hover:-translate-y-px"
              >
                Get Started
              </Link>
            </div>

            {/* Hamburger */}
            <button
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu — rendered below nav bar */}
        {mobileMenuOpen && (
          <div className="md:hidden mobile-menu-enter bg-white border-t border-slate-100 shadow-lg">
            <div className="flex flex-col px-5 pt-2 pb-5">
              {[
                { href: "#features", label: "Features" },
                { href: "#pricing", label: "Pricing" },
                { href: "#stats", label: "About" },
                { href: "#contact", label: "Contact" },
              ].map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-['Sora'] text-[15px] font-medium text-slate-700 py-3 border-b border-slate-100 hover:text-orange-500 transition-colors"
                >
                  {label}
                </a>
              ))}
              <div className="flex flex-col gap-2.5 mt-4">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-['Sora'] text-sm font-semibold text-slate-700 border border-slate-200 hover:border-orange-400 hover:text-orange-500 py-3 rounded-lg text-center transition-all"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-['Sora'] text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg text-center transition-colors shadow-[0_4px_16px_rgba(249,115,22,0.35)]"
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="min-h-screen pt-24 pb-16 relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-blue-50/30 flex flex-col items-center">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="hero-grid absolute inset-0" />
          <div className="absolute w-[500px] h-[500px] rounded-full blur-[80px] opacity-50 bg-[radial-gradient(circle,rgba(249,115,22,0.15)_0%,transparent_70%)] -top-24 -right-24" />
          <div className="absolute w-[400px] h-[400px] rounded-full blur-[80px] opacity-50 bg-[radial-gradient(circle,rgba(99,102,241,0.1)_0%,transparent_70%)] bottom-0 -left-20" />
        </div>

        <div className="relative z-10 max-w-[1160px] mx-auto px-5 text-center w-full">
          {/* Badge */}
          <div
            className="fade-up inline-flex items-center gap-1.5 bg-orange-50 text-orange-500 font-['Sora'] text-xs font-bold px-3 py-1.5 rounded-full border border-orange-200/50 mb-4"
            style={{ animationDelay: "0ms" }}
          >
            <Zap size={12} /> New — QR ordering now with UPI payments
          </div>

          <h1
            className="fade-up font-['Sora'] font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-5"
            style={{
              fontSize: "clamp(36px, 6vw, 68px)",
              animationDelay: "80ms",
            }}
          >
            Run your restaurant
            <br />
            <span className="gradient-text">smarter, not harder</span>
          </h1>

          <p
            className="fade-up text-slate-500 max-w-[540px] mx-auto mb-8 leading-relaxed"
            style={{
              fontSize: "clamp(16px, 2vw, 19px)",
              animationDelay: "160ms",
            }}
          >
            QR menus, live kitchen display, and real-time analytics — all in one
            platform built for Indian restaurants.
          </p>

          <div
            className="fade-up flex items-center justify-center gap-3 flex-wrap mb-5"
            style={{ animationDelay: "240ms" }}
          >
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 font-['Sora'] text-[15px] font-semibold bg-orange-500 hover:bg-orange-600 text-white px-7 py-4 rounded-xl transition-all shadow-[0_4px_16px_rgba(249,115,22,0.35)] hover:shadow-[0_6px_22px_rgba(249,115,22,0.4)] hover:-translate-y-0.5 sm:w-auto w-full justify-center"
            >
              Start free trial <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 font-['Sora'] text-[15px] font-semibold border-[1.5px] border-slate-200 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 text-slate-700 px-7 py-4 rounded-xl transition-all sm:w-auto w-full justify-center"
            >
              Login to dashboard
            </Link>
          </div>

          <p
            className="fade-up flex items-center justify-center gap-2 text-[13px] text-slate-500 flex-wrap mb-12"
            style={{ animationDelay: "320ms" }}
          >
            <CheckCircle size={13} className="text-emerald-500" /> Free 14-day
            trial
            <span className="text-slate-300">·</span>
            <CheckCircle size={13} className="text-emerald-500" /> No credit
            card
            <span className="text-slate-300">·</span>
            <CheckCircle size={13} className="text-emerald-500" /> Setup in 5
            min
          </p>

          {/* Dashboard preview */}
          <div
            className="fade-up bg-slate-900 rounded-[18px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.25)] border border-white/[0.08] max-w-[800px] mx-auto w-full"
            style={{ animationDelay: "400ms" }}
          >
            {/* Traffic lights */}
            <div className="bg-slate-800 px-4 py-3 flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="flex h-[220px] sm:h-[280px]">
              {/* Sidebar — hidden on mobile */}
              <div className="hidden sm:flex w-[140px] bg-slate-800 p-4 flex-col gap-1 shrink-0">
                {["Dashboard", "Orders", "Menu", "Analytics", "Tables"].map(
                  (item, i) => (
                    <div
                      key={item}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg ${i === 0 ? "bg-orange-500/15" : ""}`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-orange-500" : "bg-white/20"}`}
                      />
                      <span
                        className={`font-['Sora'] text-[11px] ${i === 0 ? "text-orange-400" : "text-white/50"}`}
                      >
                        {item}
                      </span>
                    </div>
                  ),
                )}
              </div>

              {/* Main area */}
              <div className="flex-1 p-4 overflow-hidden flex flex-col">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3.5">
                  {[
                    { label: "Revenue", value: "₹48.2k", color: "#10b981" },
                    { label: "Orders", value: "142", color: "#f97316" },
                    { label: "Active", value: "7", color: "#6366f1" },
                    { label: "Avg Order", value: "₹340", color: "#f59e0b" },
                  ].map((card) => (
                    <div
                      key={card.label}
                      className="bg-white/[0.05] rounded-lg p-2.5"
                    >
                      <span className="block font-['Sora'] text-[9px] text-white/35 mb-1">
                        {card.label}
                      </span>
                      <span
                        className="block font-['Sora'] text-[15px] font-extrabold"
                        style={{ color: card.color }}
                      >
                        {card.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-end gap-1.5 flex-1 px-1">
                  {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                    <div
                      key={i}
                      className="bar-grow flex-1 rounded-t"
                      style={{
                        height: `${h}%`,
                        background:
                          "linear-gradient(180deg, #f97316 0%, rgba(249,115,22,0.3) 100%)",
                        animationDelay: `${i * 100 + 600}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <a
          href="#features"
          className="absolute bottom-7 left-1/2 text-slate-300"
          style={{
            animation: "bounce 2s ease-in-out infinite",
            transform: "translateX(-50%)",
          }}
        >
          <ChevronDown size={20} />
        </a>
      </section>

      {/* ── Stats ── */}
      {/* <section id="stats" className="py-10 bg-slate-900" ref={statsRef}>
        <div className="max-w-[1160px] mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4">
            <StatItem value={500} suffix="+" label="Restaurants" start={statsVisible} />
            <StatItem value={2} suffix="L+" label="Orders processed" start={statsVisible} />
            <StatItem value={99} suffix="%" label="Uptime" start={statsVisible} />
            <StatItem value={5} suffix=" min" label="Average setup time" start={statsVisible} />
          </div>
        </div>
      </section> */}

      {/* ── Features ── */}
      <section id="features" className="py-20 sm:py-24">
        <div className="max-w-[1160px] mx-auto px-5">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-500 font-['Sora'] text-xs font-bold px-3 py-1.5 rounded-full border border-orange-200/50 mb-4">
              Features
            </div>
            <h2
              className="font-['Sora'] font-extrabold tracking-tight text-slate-900 mb-3.5"
              style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
            >
              Everything you need,
              <br />
              nothing you don&apos;t
            </h2>
            <p className="text-[17px] text-slate-500 max-w-[480px] mx-auto leading-relaxed">
              One platform handles orders, kitchen, menu, and payments — so you
              focus on cooking.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="bg-white border border-slate-100 rounded-2xl p-7 transition-all duration-200 hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 hover:border-transparent"
              >
                <div
                  className="w-12 h-12 rounded-[13px] flex items-center justify-center mb-[18px]"
                  style={{ background: f.bg, color: f.color }}
                >
                  <f.icon size={22} />
                </div>
                <h3 className="font-['Sora'] text-[16px] font-bold mb-2 text-slate-900">
                  {f.title}
                </h3>
                <p className="text-[14px] text-slate-500 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 sm:py-24 bg-slate-50">
        <div className="max-w-[1160px] mx-auto px-5">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-500 font-['Sora'] text-xs font-bold px-3 py-1.5 rounded-full border border-orange-200/50 mb-4">
              How it works
            </div>
            <h2
              className="font-['Sora'] font-extrabold tracking-tight text-slate-900"
              style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
            >
              Live in 3 steps
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:item-start justify-center flex-wrap gap-7">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                className="flex flex-col items-center text-center max-w-[260px] px-5 w-full sm:w-auto relative"
              >
                <div className="w-[52px] h-[52px] rounded-full bg-orange-500 text-white font-['Sora'] text-xl font-extrabold flex items-center justify-center mb-4 shadow-[0_6px_20px_rgba(249,115,22,0.3)]">
                  {i + 1}
                </div>
                <h3 className="font-['Sora'] text-[16px] font-bold mb-1.5">
                  {s.title}
                </h3>
                <p className="text-[14px] text-slate-500 leading-relaxed">
                  {s.desc}
                </p>
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block absolute text-[28px] text-slate-300 right-[-28px] top-[14px]">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section
        id="pricing"
        className="py-20 sm:py-24 bg-gradient-to-br from-orange-50 to-white"
      >
        <div className="max-w-[1160px] mx-auto px-5">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-500 font-['Sora'] text-xs font-bold px-3 py-1.5 rounded-full border border-orange-200/50 mb-4">
              Pricing
            </div>
            <h2
              className="font-['Sora'] font-extrabold tracking-tight text-slate-900 mb-3.5"
              style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
            >
              Simple, honest pricing
            </h2>
            <p className="text-[17px] text-slate-500 max-w-[480px] mx-auto leading-relaxed">
              Start free. Upgrade when you&apos;re ready. No hidden fees.
            </p>
          </div>

          {plansLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-[960px] mx-auto">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-[380px] rounded-[20px]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[960px] mx-auto items-start">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-[20px] p-7 relative transition-all duration-200 ${
                    plan.highlighted
                      ? "bg-slate-900 border-slate-900 border-[1.5px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] scale-[1.03]"
                      : "bg-white border-[1.5px] border-slate-100 hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)]"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white font-['Sora'] text-[11px] font-bold px-3.5 py-1 rounded-full whitespace-nowrap">
                      {plan.badge}
                    </div>
                  )}

                  <div className="mb-5">
                    <h3
                      className={`font-['Sora'] text-[18px] font-bold mb-2 ${plan.highlighted ? "text-white" : "text-slate-900"}`}
                    >
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      {plan.price === null ? (
                        <span
                          className={`font-['Sora'] text-[28px] font-extrabold ${plan.highlighted ? "text-white" : "text-slate-900"}`}
                        >
                          Custom
                        </span>
                      ) : plan.price === 0 ? (
                        <>
                          <span
                            className={`font-['Sora'] text-[36px] font-extrabold ${plan.highlighted ? "text-white" : "text-slate-900"}`}
                          >
                            ₹0
                          </span>
                          <span
                            className={`text-[14px] ${plan.highlighted ? "text-white/60" : "text-slate-500"}`}
                          >
                            /mo
                          </span>
                        </>
                      ) : (
                        <>
                          <span
                            className={`font-['Sora'] text-[36px] font-extrabold ${plan.highlighted ? "text-white" : "text-slate-900"}`}
                          >
                            ₹{plan.price.toLocaleString("en-IN")}
                          </span>
                          <span
                            className={`text-[14px] ${plan.highlighted ? "text-white/60" : "text-slate-500"}`}
                          >
                            /{plan.interval || "mo"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <ul className="flex flex-col gap-2.5 mb-6 list-none p-0">
                    {plan.features.map((f: string) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle
                          size={14}
                          className="text-emerald-500 mt-0.5 shrink-0"
                        />
                        <span
                          className={`text-[14px] ${plan.highlighted ? "text-white/70" : "text-slate-600"}`}
                        >
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.price === null ? "#contact" : "/signup"}
                    className={`block w-full text-center py-3 rounded-xl font-['Sora'] text-[14px] font-bold transition-all ${
                      plan.highlighted
                        ? "bg-orange-500 hover:bg-orange-600 text-white shadow-[0_4px_16px_rgba(249,115,22,0.35)]"
                        : "border-[1.5px] border-slate-200 text-slate-700 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50"
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

      {/* ── Testimonials ── */}
      {/* <section className="py-20 sm:py-24">
        <div className="max-w-[1160px] mx-auto px-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-[520px] md:max-w-none mx-auto">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white border border-slate-100 rounded-2xl p-7">
                <div className="text-amber-400 text-[16px] tracking-widest mb-3">{"★".repeat(5)}</div>
                <p className="text-[15px] text-slate-700 leading-relaxed mb-5 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500 text-white font-['Sora'] font-bold text-[16px] flex items-center justify-center shrink-0">
                    {t.name[0]}
                  </div>
                  <div>
                    <strong className="block font-['Sora'] text-[14px] font-bold text-slate-900">{t.name}</strong>
                    <span className="text-[12px] text-slate-500">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ── CTA ── */}
      <section className="bg-orange-500 py-20 sm:py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[600px] h-[600px] rounded-full blur-[80px] opacity-50 bg-[radial-gradient(circle,rgba(249,115,22,0.2)_0%,transparent_70%)] -top-24 left-1/2 -translate-x-1/2" />
        </div>
        <div className="relative z-10 max-w-[1160px] mx-auto px-5">
          <Star size={32} className="text-white/40 mx-auto mb-4" />
          <h2
            className="font-['Sora'] font-extrabold text-white leading-[1.2] tracking-tight mb-3.5"
            style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
          >
            Ready to modernize
            <br />
            your restaurant?
          </h2>
          <p className="text-[17px] text-white/75 mb-8">
            Join 500+ restaurants already running on Tabrova
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 font-['Sora'] text-[15px] font-bold bg-white text-orange-500 px-7 py-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all"
          >
            Start free trial — no card needed <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="contact" className="bg-slate-900 pt-16 pb-8">
        <div className="max-w-[1160px] mx-auto px-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div>
              <Link href="/" className="flex items-center gap-2 mb-3">
                <div className="relative w-30 h-10 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center">
                  <Image
                    src="/tabrova-logo.png"
                    alt="Tabrova"
                    width={100}
                    height={100}
                    className="object-contain w-full h-full"
                  />
                </div>
                {/* <span className="font-['Sora'] text-[18px] font-extrabold text-white">Tabrova</span> */}
              </Link>
              <p className="text-[14px] text-white/40 leading-relaxed">
                Modern restaurant management made simple for Indian restaurants.
              </p>
              <a
                href="mailto:hello@tablesprint.in"
                className="inline-block mt-3.5 text-[14px] text-orange-400 hover:text-orange-300 transition-colors"
              >
                hello@tablesprint.in
              </a>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-['Sora'] text-[13px] font-bold text-white/50 uppercase tracking-[0.08em] mb-4">
                Product
              </h4>
              <div className="flex flex-col gap-2.5">
                {[
                  { href: "#features", label: "Features" },
                  { href: "#pricing", label: "Pricing" },
                  { href: "/login", label: "Login" },
                  { href: "/signup", label: "Sign up" },
                ].map(({ href, label }) => (
                  <a
                    key={label}
                    href={href}
                    className="text-[14px] text-white/50 hover:text-white transition-colors"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-['Sora'] text-[13px] font-bold text-white/50 uppercase tracking-[0.08em] mb-4">
                Company
              </h4>
              <div className="flex flex-col gap-2.5">
                {[
                  { label: "About", href: "/about" },
                  { label: "Contact", href: "/contact" },
                ].map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="text-[14px] text-white/50 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-['Sora'] text-[13px] font-bold text-white/50 uppercase tracking-[0.08em] mb-4">
                Legal
              </h4>
              <div className="flex flex-col gap-2.5">
                {[
                  { href: "/privacy-policy", label: "Privacy Policy" },
                  { href: "/terms-of-service", label: "Terms of Service" },
                  { href: "/refund-policy", label: "Refund Policy" },
                ].map(({ href, label }) => (
                  <a
                    key={label}
                    href={href}
                    className="text-[14px] text-white/50 hover:text-white transition-colors"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.07] pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-center">
            <span className="text-[13px] text-white/30">
              © 2026 Tabrova. All rights reserved.
            </span>
            <span className="text-[13px] text-white/30">
              Made with ♥ in India
            </span>
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
    name: "Free",
    price: 0,
    interval: "mo",
    features: [
      "5 menu items",
      "5 tables",
      "Unlimited orders",
      "3 categories",
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
      "Advanced analytics",
      "Priority support",
      "Week-over-week reports",
      "Table revenue insights",
      "Slow mover detection",
      "Kitchen display",
      "Chef staff accounts",
      "UPI payments",
      "Unlimited orders",
    ],
    highlighted: true,
    cta: "Start 14-Day Trial",
    badge: "Most Popular",
  },
];

const FEATURES = [
  {
    icon: Smartphone,
    title: "QR Code Ordering",
    desc: "Customers scan, browse, and order from their phone. No app needed.",
    bg: "#fff7ed",
    color: "#f97316",
  },
  {
    icon: Clock,
    title: "Real-time Kitchen",
    desc: "Orders hit your kitchen display instantly. Update status live.",
    bg: "#eff6ff",
    color: "#3b82f6",
  },
  {
    icon: UtensilsCrossed,
    title: "Menu Management",
    desc: "Add, edit, or remove items in seconds. Changes go live immediately.",
    bg: "#f0fdf4",
    color: "#10b981",
  },
  {
    icon: TrendingUp,
    title: "Smart Analytics",
    desc: "Revenue trends, top sellers, slow movers, and rush hour heatmaps.",
    bg: "#fdf4ff",
    color: "#a855f7",
  },
  {
    icon: CheckCircle,
    title: "Payment Integration",
    desc: "Accept UPI, card, and cash. Auto-reconciliation built in.",
    bg: "#fefce8",
    color: "#eab308",
  },
  {
    icon: Star,
    title: "Popular Item Tags",
    desc: "Auto-detect bestsellers and highlight them to drive more orders.",
    bg: "#fff1f2",
    color: "#f43f5e",
  },
];

const STEPS = [
  {
    title: "Sign up",
    desc: "Create your account and set up your restaurant profile in under 5 minutes.",
  },
  {
    title: "Add your menu",
    desc: "Upload your categories and items. Set prices, availability, and veg/non-veg tags.",
  },
  {
    title: "Print QR codes",
    desc: "Download QR codes for each table. Customers scan and start ordering.",
  },
];

const TESTIMONIALS = [
  {
    name: "Ravi Sharma",
    role: "Owner, Sharma Dhaba, Delhi",
    quote:
      "Orders are 40% faster since we switched. The kitchen display alone is worth it.",
  },
  {
    name: "Priya Nair",
    role: "Manager, Spice Garden, Kochi",
    quote:
      "Setup took 10 minutes. Now I can see revenue and top dishes from my phone anywhere.",
  },
  {
    name: "Amit Joshi",
    role: "Owner, The Curry House, Pune",
    quote:
      "My staff love the kitchen display. No more shouting orders across the restaurant.",
  },
];
