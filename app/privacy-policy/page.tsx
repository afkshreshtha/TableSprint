"use client";

import Link from "next/link";
import { UtensilsCrossed, ArrowLeft } from "lucide-react";
import Image from "next/image";

const LAST_UPDATED = "June 1, 2025";

export default function PrivacyPolicyPage() {
  return (
    <>
      <style>{CSS}</style>
      <div className="lp-root">
        <nav className="lp-nav">
          <div className="lp-container lp-nav-inner">
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
            <Link href="/" className="lp-back">
              <ArrowLeft size={15} /> Back to home
            </Link>
          </div>
        </nav>

        <main className="lp-main">
          <div className="lp-container lp-content">
            <div className="lp-header">
              <div className="lp-tag">Legal</div>
              <h1>Privacy Policy</h1>
              <p className="lp-meta">Last updated: {LAST_UPDATED}</p>
            </div>

            <div className="lp-intro">
              <p>
                Tabrova is committed to protecting
                your privacy. This Privacy Policy explains how we collect, use,
                and safeguard information when you use our restaurant management
                platform at <a href="https://tabrova.in">tabrova.in</a>.
              </p>
            </div>

            <div className="lp-body">
              <section>
                <h2>1. Information We Collect</h2>
                <h3>Account Information</h3>
                <p>
                  When you register, we collect your name, email address,
                  restaurant name, and password (stored securely via Supabase
                  Auth).
                </p>
                <h3>Restaurant Data</h3>
                <p>
                  We store your menu items, categories, pricing, table
                  configurations, QR branding preferences, and order history
                  that you create within the platform.
                </p>
                <h3>Customer Order Data</h3>
                <p>
                  When your customers place orders via your QR menus, we store
                  order items, quantities, amounts, and the table/session
                  associated with that order. We do not collect customer
                  personal information (name, phone, email) unless you configure
                  your menu to require it.
                </p>
                <h3>Billing Information</h3>
                <p>
                  Subscription payments are processed by Razorpay. We store your
                  Razorpay customer ID, subscription ID, and payment status. We
                  do not store credit card numbers or full payment instrument
                  details.
                </p>
                <h3>Usage Data</h3>
                <p>
                  We collect basic usage logs including page visits, API call
                  patterns, and error events to maintain and improve the
                  platform. This data is not sold or shared with third parties
                  for advertising.
                </p>
              </section>

              <section>
                <h2>2. How We Use Your Information</h2>
                <ul>
                  <li>To provide and operate the tabrova platform</li>
                  <li>To process subscription payments and manage billing</li>
                  <li>
                    To send transactional emails (order notifications, payment
                    receipts, account alerts)
                  </li>
                  <li>To improve platform performance and fix bugs</li>
                  <li>To respond to your support requests</li>
                  <li>To comply with legal obligations</li>
                </ul>
                <p>
                  We do not use your data for targeted advertising, and we do
                  not sell your data to any third party.
                </p>
              </section>

              <section>
                <h2>3. Data Sharing</h2>
                <p>
                  We share data only with the following service providers
                  necessary to operate the platform:
                </p>
                <ul>
                  <li>
                    <strong>Supabase</strong> — database and authentication
                    hosting
                  </li>
                  <li>
                    <strong>Razorpay</strong> — payment processing for
                    subscriptions
                  </li>
                  <li>
                    <strong>Vercel / hosting providers</strong> — application
                    delivery
                  </li>
                </ul>
                <p>
                  Each provider is bound by their own privacy and data
                  processing agreements. We do not share your restaurant or
                  customer data with any other third party without your explicit
                  consent, except as required by law.
                </p>
              </section>

              <section>
                <h2>4. Data Retention</h2>
                <p>
                  We retain your account and restaurant data for as long as your
                  account is active. If you delete your account, we will delete
                  your data within 30 days, except where we are required to
                  retain it for legal or regulatory reasons (e.g., billing
                  records).
                </p>
                <p>
                  Order data is retained for a minimum of 12 months to support
                  analytics and reporting features.
                </p>
              </section>

              <section>
                <h2>5. Security</h2>
                <p>
                  We implement industry-standard security practices including
                  TLS encryption in transit, row-level security policies in
                  Supabase, and hashed authentication credentials. No method of
                  transmission over the internet is 100% secure, and we cannot
                  guarantee absolute security.
                </p>
              </section>

              <section>
                <h2>6. Your Rights</h2>
                <p>You have the right to:</p>
                <ul>
                  <li>Access the data we hold about you</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your account and associated data</li>
                  <li>
                    Export your restaurant data (menu, orders) in standard
                    formats
                  </li>
                </ul>
                <p>
                  To exercise any of these rights, contact us at{" "}
                  <a href="mailto:hello@tabrova.in">hello@tabrova.in</a>
                  .
                </p>
              </section>

              <section>
                <h2>7. Cookies</h2>
                <p>
                  We use essential cookies for authentication session
                  management. We do not use tracking or advertising cookies.
                  Your browser settings can be used to control or delete
                  cookies, though this may affect your ability to log in.
                </p>
              </section>

              <section>
                <h2>8. Children's Privacy</h2>
                <p>
                  tabrova is not directed at individuals under the age of
                  18. We do not knowingly collect personal information from
                  minors. If you believe we have inadvertently collected such
                  information, please contact us immediately.
                </p>
              </section>

              <section>
                <h2>9. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy periodically. We will notify
                  registered users of significant changes via email. Continued
                  use of the platform after changes are posted constitutes
                  acceptance.
                </p>
              </section>

              <section>
                <h2>10. Contact</h2>
                <p>
                  For privacy-related concerns, contact us at{" "}
                  <a href="mailto:hello@tabrova.in">hello@tabrova.in</a>
                  .
                </p>
              </section>
            </div>

            <div className="lp-related">
              <span>Also read:</span>
              <Link href="/terms-of-service">Terms of Service</Link>
              <Link href="/refund-policy">Refund Policy</Link>
            </div>
          </div>
        </main>

        <footer className="lp-footer">
          <div className="lp-container lp-footer-inner">
            <span>© 2025 tabrova. All rights reserved.</span>
            <div className="lp-footer-links">
              <Link href="/privacy-policy">Privacy</Link>
              <Link href="/terms-of-service">Terms</Link>
              <Link href="/refund-policy">Refunds</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --orange: #f97316;
    --orange-light: #fff7ed;
    --gray-900: #0f172a;
    --gray-700: #334155;
    --gray-500: #64748b;
    --gray-100: #f1f5f9;
    --white: #ffffff;
  }

  body { font-family: 'DM Sans', sans-serif; color: var(--gray-700); background: var(--white); }

  .lp-root { min-height: 100vh; display: flex; flex-direction: column; }
  .lp-container { max-width: 760px; margin: 0 auto; padding: 0 24px; }

  .lp-nav { border-bottom: 1px solid var(--gray-100); background: #fff; position: sticky; top: 0; z-index: 10; }
  .lp-nav-inner { display: flex; align-items: center; justify-content: space-between; height: 60px; }
  .lp-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; }
  .lp-logo span { font-family: 'Sora', sans-serif; font-size: 16px; font-weight: 800; color: var(--gray-900); }
  .lp-logo-icon { width: 30px; height: 30px; background: var(--orange); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; }
  .lp-back { display: flex; align-items: center; gap: 6px; font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600; color: var(--gray-500); text-decoration: none; transition: color .15s; }
  .lp-back:hover { color: var(--orange); }

  .lp-main { flex: 1; padding: 56px 0 80px; }

  .lp-header { margin-bottom: 32px; }
  .lp-tag { display: inline-block; background: var(--orange-light); color: var(--orange); font-family: 'Sora', sans-serif; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 100px; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.06em; }
  .lp-header h1 { font-family: 'Sora', sans-serif; font-size: clamp(28px, 5vw, 40px); font-weight: 800; color: var(--gray-900); letter-spacing: -0.03em; margin-bottom: 8px; }
  .lp-meta { font-size: 13px; color: var(--gray-500); }

  .lp-intro { background: var(--gray-100); border-radius: 12px; padding: 18px 22px; margin-bottom: 40px; }
  .lp-intro p { font-size: 15px; line-height: 1.7; color: var(--gray-700); }
  .lp-intro a { color: var(--orange); text-decoration: none; }

  .lp-body { display: flex; flex-direction: column; gap: 36px; }
  .lp-body section { }
  .lp-body h2 { font-family: 'Sora', sans-serif; font-size: 17px; font-weight: 700; color: var(--gray-900); margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid var(--gray-100); }
  .lp-body h3 { font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 700; color: var(--gray-900); margin: 14px 0 6px; }
  .lp-body p { font-size: 15px; line-height: 1.75; color: var(--gray-700); margin-bottom: 12px; }
  .lp-body p:last-child { margin-bottom: 0; }
  .lp-body ul { padding-left: 20px; display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
  .lp-body li { font-size: 15px; line-height: 1.65; color: var(--gray-700); }
  .lp-body a { color: var(--orange); text-decoration: none; }
  .lp-body a:hover { text-decoration: underline; }
  .lp-body strong { color: var(--gray-900); font-weight: 600; }

  .lp-related { display: flex; align-items: center; gap: 16px; margin-top: 52px; padding-top: 28px; border-top: 1px solid var(--gray-100); flex-wrap: wrap; }
  .lp-related span { font-size: 13px; color: var(--gray-500); }
  .lp-related a { font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600; color: var(--orange); text-decoration: none; }
  .lp-related a:hover { text-decoration: underline; }

  .lp-footer { background: var(--gray-900); padding: 20px 0; }
  .lp-footer-inner { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
  .lp-footer-inner span { font-size: 12px; color: rgba(255,255,255,.3); }
  .lp-footer-links { display: flex; gap: 20px; }
  .lp-footer-links a { font-size: 12px; color: rgba(255,255,255,.4); text-decoration: none; transition: color .15s; }
  .lp-footer-links a:hover { color: #fff; }

  @media (max-width: 600px) {
    .lp-footer-inner { flex-direction: column; text-align: center; }
  }
`;
