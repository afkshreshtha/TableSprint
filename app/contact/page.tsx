"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, Clock, ArrowRight } from "lucide-react";

export default function ContactPage() {
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
            <div className="relative w-30  h-10 rounded-xl overflow-hidden  flex items-center justify-center">
              <Image
                src="/tabrova-logo.png"
                alt="Tabrova"
                width={100}
                height={100}
                className="object-contain w-full h-full"
              />
            </div>
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
      <section className="pt-32 pb-16 relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-blue-50/30">
        <div className="hero-grid absolute inset-0 pointer-events-none" />
        <div className="absolute w-100 h-100 rounded-full blur-[80px] opacity-40 bg-[radial-gradient(circle,rgba(249,115,22,0.15)_0%,transparent_70%)] -top-20 -right-20 pointer-events-none" />

        <div className="relative z-10 max-w-170 mx-auto px-5 text-center">
          <div className="fade-up inline-flex items-center gap-1.5 bg-orange-50 text-orange-500 font-['Sora'] text-xs font-bold px-3 py-1.5 rounded-full border border-orange-200/50 mb-5">
            Get in touch
          </div>
          <h1
            className="fade-up font-['Sora'] font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-4"
            style={{
              fontSize: "clamp(32px, 5vw, 56px)",
              animationDelay: "80ms",
            }}
          >
            We&apos;d love to
            <br />
            <span className="gradient-text">hear from you</span>
          </h1>
          <p
            className="fade-up text-lg text-slate-500 leading-relaxed"
            style={{ animationDelay: "160ms" }}
          >
            Have a question about Tabrova? Want to see a demo? Or just want to
            say hi — reach out, we respond fast.
          </p>
        </div>
      </section>

      {/* ── Contact cards ── */}
      <section className="py-20 sm:py-24">
        <div className="max-w-[860px] mx-auto px-5">
          {/* Cards */}
          <div className="grid sm:grid-cols-2 gap-5 mb-16">
            {/* Email */}
            <a
              href="mailto:hello@tablesprint.in"
              className="group bg-white border border-slate-100 rounded-2xl p-8 hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-5 group-hover:bg-orange-100 transition-colors">
                <Mail size={22} className="text-orange-500" />
              </div>
              <h3 className="font-['Sora'] text-[18px] font-bold text-slate-900 mb-2">
                Email us
              </h3>
              <p className="text-[14px] text-slate-500 mb-4 leading-relaxed">
                For product questions, demo requests, billing, or anything else
                — drop us an email.
              </p>
              <span className="font-['Sora'] text-[15px] font-semibold text-orange-500 group-hover:text-orange-600 transition-colors">
                hello@tablesprint.in
              </span>
            </a>

            {/* Phone */}
            <a
              href="tel:+918273366089"
              className="group bg-white border border-slate-100 rounded-2xl p-8 hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-5 group-hover:bg-emerald-100 transition-colors">
                <Phone size={22} className="text-emerald-500" />
              </div>
              <h3 className="font-['Sora'] text-[18px] font-bold text-slate-900 mb-2">
                Call us
              </h3>
              <p className="text-[14px] text-slate-500 mb-4 leading-relaxed">
                Prefer talking? Give us a call. We`&apos;re available during business
                hours, Monday to Saturday.
              </p>
              <span className="font-['Sora'] text-[15px] font-semibold text-emerald-500 group-hover:text-emerald-600 transition-colors">
                +91 82733 66089
              </span>
            </a>
          </div>

          {/* Response time note */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex items-start gap-4 mb-16">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0">
              <Clock size={18} className="text-slate-400" />
            </div>
            <div>
              <h4 className="font-['Sora'] text-[15px] font-bold text-slate-900 mb-1">
                We respond quickly
              </h4>
              <p className="text-[14px] text-slate-500 leading-relaxed">
                Emails are typically answered within a few hours on business
                days. For urgent issues with an active account, please call
                directly — we&apos;ll pick up.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-slate-100 mb-16" />

          {/* FAQ teaser */}
          <div className="text-center">
            <h2 className="font-['Sora'] text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
              Common questions
            </h2>
            <p className="text-slate-500 mb-10 max-w-[480px] mx-auto leading-relaxed">
              Before reaching out, you might find your answer here.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 text-left mb-10">
              {FAQS.map((faq) => (
                <div
                  key={faq.q}
                  className="bg-white border border-slate-100 rounded-xl p-5 hover:border-orange-200 transition-colors"
                >
                  <h4 className="font-['Sora'] text-[14px] font-bold text-slate-900 mb-2">
                    {faq.q}
                  </h4>
                  <p className="text-[13px] text-slate-500 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-[14px] text-slate-400">
              Still have questions?{" "}
              <a
                href="mailto:hello@tablesprint.in"
                className="text-orange-500 font-semibold hover:text-orange-600 transition-colors"
              >
                Email us
              </a>{" "}
              and we&apos;ll get back to you.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-orange-500 py-16 sm:py-20 text-center relative overflow-hidden">
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[80px] opacity-30 bg-white/20 -top-24 left-1/2 -translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 max-w-[1160px] mx-auto px-5">
          <h2 className="font-['Sora'] text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Ready to get started?
          </h2>
          <p className="text-white/75 text-[17px] mb-8">
            14-day free trial. No credit card needed.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 font-['Sora'] text-[15px] font-bold bg-white text-orange-500 hover:text-orange-600 px-7 py-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all"
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
              href="/about"
              className="text-[13px] text-white/40 hover:text-white transition-colors"
            >
              About
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

const FAQS = [
  {
    q: "Is there really a free plan?",
    a: "Yes — genuinely free, no credit card required. You get QR ordering, up to 5 menu items, and basic analytics.",
  },
  {
    q: "How long does setup take?",
    a: "Most restaurants are live within 5–10 minutes. Add your menu, download your QR codes, and you're done.",
  },
  {
    q: "Does it work with UPI?",
    a: "Yes. UPI, card, and cash are all supported out of the box. No third-party payment setup needed.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. No lock-in, no cancellation fees. Downgrade or cancel from your dashboard at any time.",
  },
];
