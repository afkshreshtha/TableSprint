"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  UtensilsCrossed,
  Zap,
  Heart,
  TrendingUp,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="font-['DM_Sans'] text-slate-900 bg-white overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.6s ease both; }
        .gradient-text { background: linear-gradient(135deg, #f97316 0%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .hero-grid { background-image: linear-gradient(rgba(249,115,22,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,.04) 1px, transparent 1px); background-size: 48px 48px; }
      `}</style>

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.08)]">
        <div className="max-w-[1160px] mx-auto px-5">
          <div className="flex items-center justify-between h-16">
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
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="font-['Sora'] text-sm font-semibold text-slate-600 hover:text-orange-500 px-4 py-2 rounded-lg transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="font-['Sora'] text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-all shadow-[0_4px_16px_rgba(249,115,22,0.35)]"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-blue-50/30">
        <div className="hero-grid absolute inset-0 pointer-events-none" />
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[80px] opacity-40 bg-[radial-gradient(circle,rgba(249,115,22,0.15)_0%,transparent_70%)] -top-24 -right-24 pointer-events-none" />

        <div className="relative z-10 max-w-[760px] mx-auto px-5 text-center">
          <div
            className="fade-up inline-flex items-center gap-1.5 bg-orange-50 text-orange-500 font-['Sora'] text-xs font-bold px-3 py-1.5 rounded-full border border-orange-200/50 mb-5"
            style={{ animationDelay: "0ms" }}
          >
            Our story
          </div>
          <h1
            className="fade-up font-['Sora'] font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-5"
            style={{
              fontSize: "clamp(34px, 5vw, 60px)",
              animationDelay: "80ms",
            }}
          >
            Built for the restaurants
            <br />
            <span className="gradient-text">that feed India</span>
          </h1>
          <p
            className="fade-up text-lg text-slate-500 leading-relaxed max-w-[560px] mx-auto"
            style={{ animationDelay: "160ms" }}
          >
            Tabrova started with a simple frustration — why is running a
            restaurant still so chaotic when the technology to fix it already
            exists?
          </p>
        </div>
      </section>

      {/* ── Why we built Tabrova ── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-[900px] mx-auto px-5">
          {/* The problem */}
          <div className="mb-20">
            <div className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-500 font-['Sora'] text-xs font-bold px-3 py-1.5 rounded-full border border-orange-200/50 mb-6">
              The problem we saw
            </div>
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="font-['Sora'] text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight mb-5">
                  Indian restaurants deserve better tools
                </h2>
                <p className="text-slate-500 leading-relaxed mb-4">
                  Walk into any dhaba, café, or family restaurant in India and
                  you&apos;ll likely see the same scene — handwritten order
                  pads, shouted tickets across the kitchen, and no real idea of
                  which dishes are actually making money.
                </p>
                <p className="text-slate-500 leading-relaxed">
                  The restaurant software that exists is either too expensive,
                  too complex, or designed for Western markets with no
                  understanding of how Indian restaurants actually work — UPI
                  payments, veg/non-veg categorisation, high-volume lunch
                  rushes, and staff who may not be tech-savvy.
                </p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
                <div className="flex flex-col gap-5">
                  {[
                    {
                      icon: "📋",
                      text: "Handwritten orders get lost or misread in a busy kitchen",
                    },
                    {
                      icon: "📊",
                      text: "No visibility into which dishes drive profit vs. which drain it",
                    },
                    {
                      icon: "💸",
                      text: "Existing software costs more than a month's profit for small restaurants",
                    },
                    {
                      icon: "🤷",
                      text: "Generic platforms don't understand Indian payment methods or menus",
                    },
                  ].map((item) => (
                    <div key={item.text} className="flex items-start gap-3">
                      <span className="text-xl shrink-0 mt-0.5">
                        {item.icon}
                      </span>
                      <p className="text-[14px] text-slate-600 leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-slate-100 mb-20" />

          {/* Our answer */}
          <div className="mb-20">
            <div className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-500 font-['Sora'] text-xs font-bold px-3 py-1.5 rounded-full border border-orange-200/50 mb-6">
              Our answer
            </div>
            <h2 className="font-['Sora'] text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight mb-5">
              So we built what we wished existed
            </h2>
            <p className="text-slate-500 leading-relaxed mb-10 max-w-[680px]">
              Tabrova is designed from the ground up for Indian restaurants. Not
              adapted — designed. Every feature solves a real problem we
              observed by talking to hundreds of restaurant owners across Delhi,
              Mumbai, Kochi, and Pune.
            </p>

            <div className="grid sm:grid-cols-2 gap-5">
              {[
                {
                  icon: Zap,
                  color: "#f97316",
                  bg: "#fff7ed",
                  title: "QR ordering that just works",
                  desc: "Customers scan a QR code on the table — no app download, no account. They browse, order, and pay. The kitchen gets it instantly.",
                },
                {
                  icon: TrendingUp,
                  color: "#a855f7",
                  bg: "#fdf4ff",
                  title: "Analytics that make sense",
                  desc: "See your top dishes, your slow movers, and your busiest hours — in plain language, not spreadsheets.",
                },
                {
                  icon: Heart,
                  color: "#f43f5e",
                  bg: "#fff1f2",
                  title: "Priced for real restaurants",
                  desc: "We started with a free tier because we know most restaurants are running on thin margins. Grow into a paid plan when it makes sense for you.",
                },
                {
                  icon: UtensilsCrossed,
                  color: "#10b981",
                  bg: "#f0fdf4",
                  title: "Built for Indian kitchens",
                  desc: "UPI payments, veg/non-veg tags, Hindi-friendly interface — the details that matter for restaurants in India.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-0.5"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: card.bg, color: card.color }}
                  >
                    <card.icon size={20} />
                  </div>
                  <h3 className="font-['Sora'] text-[15px] font-bold text-slate-900 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-[14px] text-slate-500 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-slate-100 mb-20" />

          {/* Mission */}
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-500 font-['Sora'] text-xs font-bold px-3 py-1.5 rounded-full border border-orange-200/50 mb-6">
              Our mission
            </div>
            <blockquote
              className="font-['Sora'] font-extrabold text-slate-900 leading-tight tracking-tight mb-6"
              style={{ fontSize: "clamp(22px, 3.5vw, 36px)" }}
            >
              &ldquo;Make modern restaurant  technology accessible to every
              Indian restaurant — from a 10-table dhaba in Meerut to a
              multi-outlet chain in Mumbai.&rdquo;
            </blockquote>
            <p className="text-slate-500 leading-relaxed max-w-[560px] mx-auto">
              We measure success not in ARR or user counts, but in how many
              restaurant owners sleep a little easier because their operations
              actually run smoothly.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-slate-900 py-16 sm:py-20 text-center">
        <div className="max-w-[1160px] mx-auto px-5">
          <h2 className="font-['Sora'] text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Ready to try it yourself?
          </h2>
          <p className="text-white/60 text-[17px] mb-8">
            Free for 14 days. No credit card. Setup in 5 minutes.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 font-['Sora'] text-[15px] font-bold bg-orange-500 hover:bg-orange-600 text-white px-7 py-4 rounded-xl shadow-[0_4px_20px_rgba(249,115,22,0.4)] hover:-translate-y-0.5 transition-all"
          >
            Start free trial <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-950 py-8">
        <div className="max-w-[1160px] mx-auto px-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden bg-white/10">
              <Image
                src="/tabrova-logo.png"
                alt="Tabrova"
                width={28}
                height={28}
                className="object-contain w-full h-full"
              />
            </div>
            <span className="font-['Sora'] text-sm font-bold text-white/60">
              Tabrova
            </span>
          </Link>
          <span className="text-[13px] text-white/30">
            © 2026 Tabrova. Made with ♥ in India
          </span>
          <div className="flex gap-5">
            <Link
              href="/contact"
              className="text-[13px] text-white/40 hover:text-white transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/privacy-policy"
              className="text-[13px] text-white/40 hover:text-white transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-[13px] text-white/40 hover:text-white transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
