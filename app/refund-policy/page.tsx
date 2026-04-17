'use client';

import Link from 'next/link';
import { UtensilsCrossed, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

const LAST_UPDATED = 'June 1, 2025';

export default function RefundPolicyPage() {
  return (
    <>
      <style>{CSS}</style>
      <div className="lp-root">
        {/* Nav */}
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
            {/* Header */}
            <div className="lp-header">
              <div className="lp-tag">Legal</div>
              <h1>Refund Policy</h1>
              <p className="lp-meta">Last updated: {LAST_UPDATED}</p>
            </div>

            {/* Highlight box */}
            <div className="lp-highlight">
              <strong>No Refund Policy</strong>
              <p>
                All payments made to Tabrova are <strong>non-refundable</strong>. By subscribing to any
                paid plan, you acknowledge and agree to this policy in full.
              </p>
            </div>

            <div className="lp-body">
              <section>
                <h2>1. Subscription Payments</h2>
                <p>
                  Tabrova operates on a subscription basis. When you purchase a subscription plan —
                  monthly or annual — the payment is collected immediately and grants you access to the
                  features associated with that plan for the billing period.
                </p>
                <p>
                  <strong>We do not offer refunds, credits, or prorations</strong> for any unused portion
                  of a subscription period, regardless of the reason for cancellation or downgrade.
                </p>
              </section>

              <section>
                <h2>2. Free Trial</h2>
                <p>
                  We offer a free trial period (currently 14 days) on paid plans. You will not be charged
                  during the trial. If you do not cancel before the trial ends, your subscription begins
                  and the first payment is collected. This payment is non-refundable.
                </p>
                <p>
                  We encourage you to fully evaluate the platform during your free trial before upgrading
                  to a paid plan.
                </p>
              </section>

              <section>
                <h2>3. Cancellations</h2>
                <p>
                  You may cancel your subscription at any time from your dashboard under{' '}
                  <strong>Subscription → Cancel Subscription</strong>. Upon cancellation:
                </p>
                <ul>
                  <li>Your plan remains active until the end of the current billing period.</li>
                  <li>No further charges will be made after the period ends.</li>
                  <li>No refund is issued for the remaining days in the billing period.</li>
                  <li>Your account will downgrade to the Free plan automatically.</li>
                </ul>
              </section>

              <section>
                <h2>4. Plan Downgrades</h2>
                <p>
                  If you choose to downgrade from a higher-tier plan to a lower-tier plan mid-cycle,
                  the downgrade takes effect at the start of the next billing cycle. No refund or credit
                  is issued for the difference in cost for the current period.
                </p>
              </section>

              <section>
                <h2>5. Failed Payments & Service Interruption</h2>
                <p>
                  If a payment fails, we will attempt to collect the payment again. If payment cannot
                  be collected after reasonable attempts, your account may be downgraded or suspended.
                  Tabrova is not liable for any business disruption arising from payment failures
                  or service suspension due to non-payment.
                </p>
              </section>

              <section>
                <h2>6. Exceptions</h2>
                <p>
                  We reserve the right, at our sole discretion, to issue a partial or full credit in
                  exceptional circumstances — such as a verified technical error on our end that
                  prevented access to the service for an extended period. Any such exceptions are
                  evaluated on a case-by-case basis and do not constitute a general refund entitlement.
                </p>
                <p>
                  To report such an issue, contact us at{' '}
                  <a href="mailto:hello@tabrova.com ">hello@tabrova.com </a>.
                </p>
              </section>

              <section>
                <h2>7. Chargebacks</h2>
                <p>
                  Initiating a chargeback or payment dispute without first contacting us is a violation
                  of these terms. We reserve the right to suspend or permanently terminate accounts that
                  initiate unauthorized chargebacks, and to contest such disputes with your payment
                  provider.
                </p>
              </section>

              <section>
                <h2>8. Changes to This Policy</h2>
                <p>
                  We may update this Refund Policy from time to time. Continued use of the service after
                  changes are posted constitutes acceptance of the updated policy. We will notify
                  registered users of material changes via email.
                </p>
              </section>

              <section>
                <h2>9. Contact</h2>
                <p>
                  For any billing questions, contact our support team at{' '}
                  <a href="mailto:hello@tabrova.com ">hello@tabrova.com </a>. We typically respond
                  within 1–2 business days.
                </p>
              </section>
            </div>

            {/* Related */}
            <div className="lp-related">
              <span>Also read:</span>
              <Link href="/privacy-policy">Privacy Policy</Link>
              <Link href="/terms-of-service">Terms of Service</Link>
            </div>
          </div>
        </main>

        <footer className="lp-footer">
          <div className="lp-container lp-footer-inner">
            <span>© 2025 Tabrova. All rights reserved.</span>
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
  @import url('https://fonts.googleapis.com /css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500&display=swap');
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

  /* Nav */
  .lp-nav { border-bottom: 1px solid var(--gray-100); background: #fff; position: sticky; top: 0; z-index: 10; }
  .lp-nav-inner { display: flex; align-items: center; justify-content: space-between; height: 60px; }
  .lp-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; }
  .lp-logo span { font-family: 'Sora', sans-serif; font-size: 16px; font-weight: 800; color: var(--gray-900); }
  .lp-logo-icon { width: 30px; height: 30px; background: var(--orange); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; }
  .lp-back { display: flex; align-items: center; gap: 6px; font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600; color: var(--gray-500); text-decoration: none; transition: color .15s; }
  .lp-back:hover { color: var(--orange); }

  /* Main */
  .lp-main { flex: 1; padding: 56px 0 80px; }
  .lp-content { }

  /* Header */
  .lp-header { margin-bottom: 36px; }
  .lp-tag { display: inline-block; background: var(--orange-light); color: var(--orange); font-family: 'Sora', sans-serif; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 100px; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.06em; }
  .lp-header h1 { font-family: 'Sora', sans-serif; font-size: clamp(28px, 5vw, 40px); font-weight: 800; color: var(--gray-900); letter-spacing: -0.03em; margin-bottom: 8px; }
  .lp-meta { font-size: 13px; color: var(--gray-500); }

  /* Highlight */
  .lp-highlight { background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 12px; padding: 20px 24px; margin-bottom: 40px; }
  .lp-highlight strong { display: block; font-family: 'Sora', sans-serif; font-size: 15px; color: #991b1b; margin-bottom: 6px; }
  .lp-highlight p { font-size: 14px; color: #7f1d1d; line-height: 1.6; }

  /* Body */
  .lp-body { display: flex; flex-direction: column; gap: 36px; }
  .lp-body section { }
  .lp-body h2 { font-family: 'Sora', sans-serif; font-size: 17px; font-weight: 700; color: var(--gray-900); margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--gray-100); }
  .lp-body p { font-size: 15px; line-height: 1.75; color: var(--gray-700); margin-bottom: 12px; }
  .lp-body p:last-child { margin-bottom: 0; }
  .lp-body ul { padding-left: 20px; display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
  .lp-body li { font-size: 15px; line-height: 1.65; color: var(--gray-700); }
  .lp-body a { color: var(--orange); text-decoration: none; }
  .lp-body a:hover { text-decoration: underline; }
  .lp-body strong { color: var(--gray-900); font-weight: 600; }

  /* Related */
  .lp-related { display: flex; align-items: center; gap: 16px; margin-top: 52px; padding-top: 28px; border-top: 1px solid var(--gray-100); flex-wrap: wrap; }
  .lp-related span { font-size: 13px; color: var(--gray-500); }
  .lp-related a { font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600; color: var(--orange); text-decoration: none; }
  .lp-related a:hover { text-decoration: underline; }

  /* Footer */
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