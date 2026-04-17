'use client';

import Link from 'next/link';
import { UtensilsCrossed, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

const LAST_UPDATED = 'March 27, 2026';

export default function TermsOfServicePage() {
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
          </div>
        </nav>

        <main className="lp-main">
          <div className="lp-container lp-content">
            <div className="lp-header">
              <div className="lp-tag">Legal</div>
              <h1>Terms of Service</h1>
              <p className="lp-meta">Last updated: {LAST_UPDATED}</p>
            </div>

            <div className="lp-intro">
              <p>
                Please read these Terms of Service carefully before accessing or using the tabrova platform.
                By registering an account, accessing the Service, or clicking &quot;I Agree,&quot; you acknowledge that you have read,
                understood, and agree to be legally bound by these Terms. If you do not agree to any part of these Terms,
                you must immediately discontinue use of the Service.
              </p>
            </div>

            <div className="lp-body">

              <section>
                <h2>1. Definitions</h2>
                <p>For the purposes of these Terms, the following definitions apply:</p>
                <ul>
                  <li><strong>{`"Company," "We," "Us," or "Our"`}</strong> refers to tabrova, a technology service provider operating under applicable Indian laws.</li>
                  <li><strong>{`"User," "You," or "Restaurant Owner"`}</strong> refers to any individual or business entity that registers for or uses the Service.</li>
                  <li><strong>{`"Service"`}</strong> refers to the tabrova web platform, mobile interfaces, APIs, QR ordering system, kitchen display systems, menu management tools, analytics dashboard, and all related software and services.</li>
                  <li><strong>{`"Agreement"`}</strong> refers to these Terms of Service together with our Privacy Policy and Refund Policy, all of which are incorporated by reference.</li>
                  <li><strong>{`"Content"`}</strong> means all text, images, data, menus, pricing, logos, and other materials uploaded or submitted by the User.</li>
                  <li><strong>{`"Subscription"`}</strong> refers to a paid or free plan that grants the User access to specific features of the Service.</li>
                </ul>
              </section>

              <section>
                <h2>2. Acceptance of Terms and Legal Capacity</h2>
                <p>
                  By using the Service, you represent and warrant that: (a) you are at least 18 years of age; (b) you have the legal
                  capacity and authority to enter into a binding contract under the Indian Contract Act, 1872; (c) if you are using
                  the Service on behalf of a business entity, you are duly authorized to bind such entity to these Terms; and
                  (d) your use of the Service does not violate any applicable law or regulation.
                </p>
                <p>
                  These Terms constitute a legally binding agreement between You and tabrova under the Information Technology Act, 2000
                  and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.
                </p>
              </section>

              <section>
                <h2>3. Description of Service</h2>
                <p>
                  tabrova provides a cloud-based Software-as-a-Service (SaaS) restaurant management platform. The Service includes,
                  but is not limited to: QR code-based ordering systems, kitchen display systems (KDS), digital menu management, real-time
                  order tracking, sales analytics, and subscription billing management.
                </p>
                <p>
                  The features accessible to you are determined by your active Subscription plan. We reserve the right to modify,
                  add, or discontinue features at any time with reasonable notice to affected users. tabrova operates as an intermediary
                  platform and is not a party to any transaction between your restaurant and your customers.
                </p>
              </section>

              <section>
                <h2>4. Account Registration and Security</h2>
                <p>
                  To access the Service, you must register for an account by providing accurate, current, and complete information
                  as prompted during the registration process. You agree to promptly update your account information to keep it
                  accurate and complete.
                </p>
                <p>
                  You are solely responsible for: (a) maintaining the confidentiality of your account credentials, including your
                  password; (b) all activities that occur under your account, whether authorized or unauthorized; and (c) ensuring
                  that no unauthorized person gains access to your account.
                </p>
                <p>
                  You must notify us immediately at <a href="mailto:hello@tabrova.com ">hello@tabrova.com </a> upon becoming
                  aware of any actual or suspected unauthorized access, breach, or compromise of your account. We will not be
                  liable for any loss or damage arising from your failure to comply with this obligation.
                </p>
                <p>
                  You may not transfer or assign your account to any other person or entity without our prior written consent.
                  Creation of multiple accounts to circumvent plan limitations is strictly prohibited and may result in immediate
                  suspension of all associated accounts.
                </p>
              </section>

              <section>
                <h2>5. Subscription Plans and Billing</h2>
                <p>
                  tabrova offers a Free tier and paid Subscription plans. Paid plans are billed on a monthly or annual basis
                  through our payment partner, Razorpay Payments Private Limited, in accordance with their terms of service.
                  By subscribing to a paid plan, you authorize us to charge the applicable fees to your designated payment method
                  on a recurring basis until you cancel your Subscription.
                </p>
                <p>
                  All fees are quoted and charged in Indian Rupees (INR). Prices displayed on the platform are inclusive of
                  Goods and Services Tax (GST) as applicable under the Central Goods and Services Tax Act, 2017, unless explicitly
                  stated otherwise. A valid GST invoice will be issued for all paid transactions.
                </p>
                <p>
                  We reserve the right to revise Subscription pricing at any time. For existing subscribers, price changes will
                  take effect at the start of the next billing cycle following at least 30 days&apos; written notice sent to your
                  registered email address. Continued use of the Service after the price change takes effect constitutes your
                  acceptance of the revised pricing.
                </p>
                <p>
                  In the event of a failed payment, we may attempt to re-charge your payment method. If payment remains unsuccessful
                  after reasonable attempts, your account may be downgraded to the Free tier or suspended, and any outstanding
                  dues may be referred to recovery processes permitted under Indian law.
                </p>
                <p>
                  <strong>All payments are non-refundable</strong>, except as expressly provided in our{' '}
                  <Link href="/refund-policy">Refund Policy</Link>.
                </p>
              </section>

              <section>
                <h2>6. Free Trial and Promotional Offers</h2>
                <p>
                  tabrova may, at its sole discretion, offer a free trial period for paid Subscription plans. At the end of
                  any free trial, your account will automatically be charged at the applicable subscription rate unless you cancel
                  before the trial expires. We reserve the right to modify or withdraw free trial offers at any time without notice.
                  Free trial benefits cannot be combined with other promotional offers unless explicitly stated.
                </p>
              </section>

              <section>
                <h2>7. Acceptable Use Policy</h2>
                <p>
                  You agree to use the Service only for lawful purposes and in accordance with these Terms. You shall not use
                  the Service in any manner that:
                </p>
                <ul>
                  <li>Violates any applicable Central or State law of India, including but not limited to the Indian Penal Code, 1860, the Information Technology Act, 2000, the Food Safety and Standards Act, 2006, or the Consumer Protection Act, 2019;</li>
                  <li>Infringes upon or violates the intellectual property rights, privacy rights, or other rights of any third party;</li>
                  <li>Involves the transmission of unsolicited commercial messages, spam, or phishing content;</li>
                  <li>Involves unauthorized access to, or interference with, any part of the platform, its servers, databases, or connected networks;</li>
                  <li>Involves reverse engineering, decompiling, disassembling, or attempting to derive the source code of any part of the Service;</li>
                  <li>Involves the use of automated systems (bots, scrapers, crawlers) to extract data from the platform without our express written consent;</li>
                  <li>Involves uploading or transmitting viruses, malware, ransomware, or any other malicious or technologically harmful code;</li>
                  <li>Involves impersonating any person, business, or entity, or misrepresenting your affiliation with any person or entity;</li>
                  <li>Is fraudulent, deceptive, or misleading in any way, including with respect to food safety, pricing, or product descriptions offered to your customers.</li>
                </ul>
                <p>
                  We reserve the right to investigate any suspected violation of this policy and to take appropriate action, including
                  suspension or termination of your account and reporting to law enforcement authorities where required.
                </p>
              </section>

              <section>
                <h2>8. Your Content and License Grant</h2>
                <p>
                  You retain full ownership of all Content you upload, submit, or transmit through the Service, including menu items,
                  food images, pricing, and business information. By submitting Content to the Service, you grant tabrova a
                  non-exclusive, worldwide, royalty-free, sublicensable license to host, store, reproduce, modify (for formatting
                  purposes only), display, and transmit your Content solely as necessary to provide and improve the Service.
                </p>
                <p>
                  You represent and warrant that: (a) you own or have the necessary rights and permissions to submit the Content;
                  (b) the Content does not infringe any third-party intellectual property, privacy, or other rights; (c) the Content
                  complies with all applicable laws, including food labeling and advertising requirements under the Food Safety and
                  Standards (Labelling and Display) Regulations, 2020; and (d) the Content is accurate and not misleading.
                </p>
                <p>
                  We reserve the right to remove any Content that violates these Terms, applicable law, or our content policies,
                  without prior notice and without liability to you.
                </p>
              </section>

              <section>
                <h2>9. Intellectual Property Rights</h2>
                <p>
                  The Service and all its components, including but not limited to software, source code, algorithms, user interface
                  designs, graphics, logos, trademarks, service marks, trade names, and documentation (collectively, &quot;tabrova IP&quot;),
                  are the exclusive property of tabrova and are protected under applicable Indian and international intellectual
                  property laws, including the Copyright Act, 1957, the Trade Marks Act, 1999, and the Patents Act, 1970.
                </p>
                <p>
                  Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable,
                  non-sublicensable, revocable license to access and use the Service solely for your internal business operations.
                  This license does not include any right to copy, reproduce, modify, create derivative works from, distribute,
                  sell, or publicly display any tabrova IP without our prior written consent. Any unauthorized use constitutes
                  an infringement of our intellectual property rights and may result in civil or criminal liability under
                  applicable Indian law.
                </p>
              </section>

              <section>
                <h2>10. Customer Payments and Third-Party Transactions</h2>
                <p>
                  tabrova facilitates digital QR-code-based order placement but does not act as a payment intermediary, payment
                  aggregator, or payment gateway between your restaurant and your end customers. All payments made by your customers
                  to your restaurant — whether via UPI, cash, or other means — are solely between you and your customers.
                </p>
                <p>
                  We are not responsible for any dispute, loss, fraud, or failure arising from such customer-to-restaurant
                  transactions. You are solely responsible for ensuring compliance with applicable payment regulations, including
                  the Payment and Settlement Systems Act, 2007, and Reserve Bank of India (RBI) guidelines relevant to your operations.
                </p>
              </section>

              <section>
                <h2>11. Data Protection and Privacy</h2>
                <p>
                  We collect, process, and store personal data in accordance with our <Link href="/privacy-policy">Privacy Policy</Link>,
                  which is incorporated into these Terms by reference. By using the Service, you consent to the collection and
                  processing of your data as described therein, in accordance with the Digital Personal Data Protection Act, 2023
                  and applicable rules thereunder.
                </p>
                <p>
                  You acknowledge that you are independently responsible for protecting the personal data of your customers collected
                  through the platform, and for complying with applicable data protection laws in your capacity as a data fiduciary
                  with respect to your customers&apos; data.
                </p>
              </section>

              <section>
                <h2>12. Service Availability and Maintenance</h2>
                <p>
                  While we strive to maintain high availability and performance of the Service, we do not guarantee that the Service
                  will be available at all times, uninterrupted, error-free, or free from technical issues. We may perform scheduled
                  or emergency maintenance that may result in temporary unavailability of the Service. Where reasonably practicable,
                  we will provide advance notice of scheduled maintenance.
                </p>
                <p>
                  We shall not be liable for any losses, damages, or claims arising from downtime, service interruptions, data
                  transmission delays, or technical failures, whether or not we were informed of the possibility of such issues.
                </p>
              </section>

              <section>
                <h2>13. Disclaimer of Warranties</h2>
                <p>
                  THE SERVICE IS PROVIDED ON AN {`"AS IS" AND "AS AVAILABLE"`} BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS
                  OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
                  NON-INFRINGEMENT, OR COURSE OF PERFORMANCE, TO THE FULLEST EXTENT PERMISSIBLE UNDER APPLICABLE INDIAN LAW.
                </p>
                <p>
                  We do not warrant that the Service will meet your specific business requirements, that results obtained from
                  using the Service will be accurate or reliable, or that any errors in the Service will be corrected. You use
                  the Service at your own discretion and risk.
                </p>
              </section>

              <section>
                <h2>14. Limitation of Liability</h2>
                <p>
                  To the maximum extent permitted by applicable law, tabrova, its directors, employees, agents, licensors,
                  and service providers shall not be liable for any indirect, incidental, special, consequential, exemplary,
                  or punitive damages, including but not limited to loss of profits, loss of revenue, loss of data, loss of
                  goodwill, business interruption, or any other intangible losses, arising out of or related to your access
                  to or use of (or inability to use) the Service, even if we have been advised of the possibility of such damages.
                </p>
                <p>
                  In any event, our total aggregate liability to you for all claims arising under or in connection with these
                  Terms or the Service — whether in contract, tort (including negligence), strict liability, or otherwise —
                  shall not exceed the total amount paid by you to tabrova in the three (3) calendar months immediately
                  preceding the event giving rise to the claim.
                </p>
                <p>
                  Nothing in these Terms shall limit or exclude liability for death or personal injury caused by our negligence,
                  fraud or fraudulent misrepresentation, or any other liability that cannot be lawfully excluded under Indian law.
                </p>
              </section>

              <section>
                <h2>15. Indemnification</h2>
                <p>
                  You agree to indemnify, defend, and hold harmless tabrova and its officers, directors, employees, agents,
                  licensors, and service providers from and against any and all claims, liabilities, damages, judgments, awards,
                  losses, costs, expenses, and fees (including reasonable legal fees) arising out of or relating to: (a) your
                  violation of these Terms; (b) your Content; (c) your use of the Service; (d) your violation of any applicable
                  law or regulation; (e) your violation of any third-party rights; or (f) any dispute between you and your customers.
                </p>
              </section>

              <section>
                <h2>16. Suspension and Termination</h2>
                <p>
                  You may cancel your Subscription and delete your account at any time through the account settings dashboard.
                  Cancellation of a paid Subscription will take effect at the end of the current billing cycle, and no refunds
                  will be issued for unused periods unless required by our Refund Policy.
                </p>
                <p>
                  We reserve the right, at our sole discretion, to suspend, restrict, or permanently terminate your account and
                  access to the Service, with or without prior notice, for any of the following reasons: (a) breach of these Terms;
                  (b) fraudulent, abusive, or illegal activity; (c) failure to pay applicable fees; (d) prolonged inactivity; or
                  (e) any reason we deem necessary to protect the integrity of the platform or the rights of other users.
                </p>
                <p>
                  Upon termination of your account: (i) your right to access the Service ceases immediately; (ii) we will retain
                  your data for a period of thirty (30) days from the date of termination, during which you may request an export
                  of your data by writing to <a href="mailto:hello@tabrova.com ">hello@tabrova.com </a>; (iii) after the 30-day
                  period, your data will be permanently deleted from our systems, except where retention is required by applicable law.
                </p>
                <p>
                  Clauses that by their nature should survive termination — including intellectual property, limitation of liability,
                  indemnification, and governing law — shall survive the termination of these Terms.
                </p>
              </section>

              <section>
                <h2>17. Grievance Redressal</h2>
                <p>
                  In accordance with the Information Technology Act, 2000 and the Information Technology (Intermediary Guidelines
                  and Digital Media Ethics Code) Rules, 2021, we have appointed a Grievance Officer to address complaints and
                  concerns relating to the Service. If you have any grievance regarding the Service or these Terms, you may
                  contact our Grievance Officer at:
                </p>
                <ul>
                  <li><strong>Name:</strong> Shreshtha Agarwal, Tabrova</li>
                  <li><strong>Email:</strong> <a href="mailto:hello@tabrova.com ">hello@tabrova.com </a></li>
                  <li><strong>Address:</strong> tabrova, Agra, Uttar Pradesh – 282005, India</li>
                </ul>
                <p>
                  We will acknowledge receipt of your grievance within 24 hours and endeavor to resolve it within 15 days of
                  receipt, in accordance with applicable law.
                </p>
              </section>

              <section>
                <h2>18. Governing Law and Jurisdiction</h2>
                <p>
                  These Terms and any dispute, claim, or controversy arising out of or in connection with them — including any
                  question regarding their existence, validity, breach, or termination — shall be governed by and construed in
                  accordance with the laws of the Republic of India, without regard to its conflict of laws principles.
                </p>
                <p>
                  Subject to the arbitration clause below, you agree that any legal action, suit, or proceeding arising out of
                  or relating to these Terms or your use of the Service shall be instituted exclusively in the courts of competent
                  jurisdiction located in <strong>Agra, Uttar Pradesh, India</strong>, and you hereby irrevocably submit to the
                  personal jurisdiction of such courts and waive any objection to the venue of such proceedings.
                </p>
              </section>

              <section>
                <h2>19. Dispute Resolution and Arbitration</h2>
                <p>
                  In the event of any dispute, difference, or claim arising out of or in connection with these Terms, including
                  any question regarding their breach, termination, or invalidity, the parties shall first attempt to resolve the
                  matter through good-faith negotiations within 30 days of written notice from the aggrieved party.
                </p>
                <p>
                  If the dispute is not resolved through negotiation, it shall be finally settled by binding arbitration in accordance
                  with the Arbitration and Conciliation Act, 1996 (as amended). The arbitration shall be conducted by a sole
                  arbitrator mutually appointed by the parties, or failing agreement within 15 days, appointed in accordance with
                  the said Act. The seat and venue of arbitration shall be <strong>Agra, Uttar Pradesh</strong>. The arbitration
                  proceedings shall be conducted in the English language. The arbitral award shall be final and binding on both parties.
                </p>
                <p>
                  Nothing in this clause shall prevent either party from seeking urgent interim or injunctive relief from a court
                  of competent jurisdiction to prevent irreparable harm.
                </p>
              </section>

              <section>
                <h2>20. Force Majeure</h2>
                <p>
                  tabrova shall not be liable for any failure or delay in performance of its obligations under these Terms
                  where such failure or delay results from causes beyond our reasonable control, including but not limited to
                  acts of God, natural disasters, pandemics, epidemics, floods, fire, earthquakes, wars, riots, civil unrest,
                  government actions, internet or telecommunications failures, power outages, strikes, or any other similar events.
                  In such circumstances, our obligations will be suspended for the duration of the force majeure event.
                </p>
              </section>

              <section>
                <h2>21. Amendments to Terms</h2>
                <p>
                  We reserve the right to modify or replace these Terms at any time. For material changes, we will provide at
                  least 14 days&apos; prior written notice to your registered email address before the revised Terms take effect.
                  Non-material changes (such as corrections of typographical errors or clarifications that do not affect your
                  rights) may take effect immediately upon posting.
                </p>
                <p>
                  Your continued use of the Service after the effective date of any revised Terms constitutes your binding
                  acceptance of such changes. If you do not agree to the revised Terms, you must stop using the Service and
                  cancel your account before the effective date.
                </p>
              </section>

              <section>
                <h2>22. Severability</h2>
                <p>
                  If any provision of these Terms is found to be invalid, illegal, or unenforceable under applicable law by a
                  court of competent jurisdiction, such provision shall be modified to the minimum extent necessary to make it
                  enforceable, or if modification is not possible, severed from these Terms. The validity and enforceability of
                  the remaining provisions shall not be affected.
                </p>
              </section>

              <section>
                <h2>23. Waiver</h2>
                <p>
                  No failure or delay by tabrova in exercising any right or remedy provided under these Terms or by law
                  shall constitute a waiver of that or any other right or remedy, nor shall it preclude or restrict the
                  further exercise of that or any other right or remedy. No single or partial exercise of such right or remedy
                  shall preclude or restrict the further exercise of that or any other right or remedy.
                </p>
              </section>

              <section>
                <h2>24. Entire Agreement</h2>
                <p>
                  These Terms, together with the <Link href="/privacy-policy">Privacy Policy</Link> and{' '}
                  <Link href="/refund-policy">Refund Policy</Link>, constitute the entire agreement between you and tabrova
                  with respect to your use of the Service and supersede all prior and contemporaneous understandings, agreements,
                  representations, and warranties — whether written or oral — relating to the Service.
                </p>
              </section>

              <section>
                <h2>25. Contact Us</h2>
                <p>
                  If you have any questions, concerns, or feedback regarding these Terms of Service, please contact us at:
                </p>
                <ul>
                  <li><strong>Email:</strong> <a href="mailto:hello@tabrova.com ">hello@tabrova.com </a></li>
                  <li><strong>Address:</strong> tabrova, Agra, Uttar Pradesh – 282005, India</li>
                </ul>
              </section>

            </div>

            <div className="lp-related">
              <span>Also read:</span>
              <Link href="/privacy-policy">Privacy Policy</Link>
              <Link href="/refund-policy">Refund Policy</Link>
            </div>
          </div>
        </main>

        <footer className="lp-footer">
          <div className="lp-container lp-footer-inner">
            <span>© 2026 tabrova. All rights reserved.</span>
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

  .lp-body { display: flex; flex-direction: column; gap: 36px; }
  .lp-body h2 { font-family: 'Sora', sans-serif; font-size: 17px; font-weight: 700; color: var(--gray-900); margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid var(--gray-100); }
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