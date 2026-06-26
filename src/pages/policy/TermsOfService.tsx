import React from 'react';
import { Scale, Users, ShieldAlert, CreditCard, Landmark, CheckCircle, HelpCircle, FileCheck, PhoneCall, AlertTriangle } from 'lucide-react';

export const TermsOfService: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-neutral-900 pb-6">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Terms of Service</h2>
        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
          Last Updated: June 25, 2026 • Production Version 4.2
        </p>
      </div>

      {/* Overview Callout */}
      <div className="p-8 rounded-[2rem] bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15 flex gap-4 items-start">
        <Scale className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-2">Platform Agreement</h3>
          <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-sans">
            Welcome to HudumaLink Kenya. By registering an account, publishing a listing, browsing our service catalogs, or initiating an escrow-backed transaction, you contractually agree to remain fully compliant with these Terms. If you do not accept these policies, you must immediately terminate platform access.
          </p>
        </div>
      </div>

      {/* Section 1: Eligibility & User Accounts */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">1</span>
          Eligibility, User Accounts, and Verification (KYC)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900/80 rounded-3xl shadow-sm">
            <h4 className="font-bold text-slate-900 dark:text-white mb-3">Minimum Age & Identification</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              To be eligible to list, offer, or purchase items on HudumaLink, you must be <strong>at least 18 years of age</strong> and reside in the Republic of Kenya. All account registrants must submit a valid Kenyan National Identification Card or Passport number.
            </p>
          </div>
          <div className="p-8 bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900/80 rounded-3xl shadow-sm">
            <h4 className="font-bold text-slate-900 dark:text-white mb-3">Know Your Customer (KYC) Mandates</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              To ensure financial and operational safety, merchants and professional contractors are subjected to strict identity verification. Payout accounts will remain frozen until valid proof of ID, active photos, and applicable local permits are approved by our compliance team.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Platform Roles */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">2</span>
          Strict Non-Overlapping Platform Roles
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
          To protect transactional structure and avoid marketplace misrepresentations, accounts are restricted to specific, non-overlapping authorizations:
        </p>

        <div className="space-y-4">
          {[
            {
              role: "Class 1: Buyer / Consumer Account",
              desc: "Authorized exclusively to search directories, exchange messages, and execute deposits to the secure escrow ledger. Consumer accounts have absolute zero publishing privileges; they are strictly barred from creating listings, offering inventory, or advertising services.",
              color: "border-slate-200 dark:border-neutral-900"
            },
            {
              role: "Class 2: Merchant / Seller Account",
              desc: "Authorized exclusively to publish, organize, and fulfill physical inventory and tangible products. Merchant accounts are strictly forbidden from listing consultancies, professional contracts, digital services, or physical labor.",
              color: "border-slate-200 dark:border-neutral-900"
            },
            {
              role: "Class 3: Service Provider Account",
              desc: "Authorized with dual-tier credentials to list, advertise, and complete skilled service contracts (such as plumbing, tutoring, design, or mechanical installations) along with directly relevant physical parts or consumables necessary to fulfill those services.",
              color: "border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10"
            }
          ].map((item, index) => (
            <div key={index} className={`p-6 rounded-2xl border ${item.color}`}>
              <h4 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider mb-2">{item.role}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Responsibilities */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">3</span>
          Operational Responsibilities
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
          <div className="p-6 bg-slate-100/50 dark:bg-neutral-900/40 rounded-2xl">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">Buyer Mandates</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Buyers must perform diligent physical inspections at delivery, test devices prior to clicking "Confirm", maintain communications strictly on our native chat portal, and pay only through the escrow system.
            </p>
          </div>
          <div className="p-6 bg-slate-100/50 dark:bg-neutral-900/40 rounded-2xl">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">Seller Mandates</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Sellers must guarantee full legal ownership, disclose every defect, publish high-quality authentic images, label used goods correctly, and dispatch items securely within agreed-upon timelines.
            </p>
          </div>
          <div className="p-6 bg-slate-100/50 dark:bg-neutral-900/40 rounded-2xl">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">Service Contractor Mandates</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Contractors must supply authentic qualifications, disclose warranties, publish upfront prices, complete agreements with professional results, and refrain from soliciting off-platform payments.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Listing Standards */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">4</span>
          Listing Standards and Verification
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
          All listings published on the platform must feature clear, recent, high-quality photos showing the actual product. Stock photos must not be used unless clearly marked. Sellers must disclose repair histories, network block status, battery health parameters, and storage metrics where applicable. The platform reserves the right to request receipts, logs, or purchase invoices before approving listings.
        </p>
      </section>

      {/* Section 5: Escrow and Fees Table */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">5</span>
          Marketplace Commission, Escrow, and Payout Structures
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
          To maintain transaction integrity, all payments must go through our designated third-party payment system.
        </p>

        <div className="overflow-hidden border border-slate-200 dark:border-neutral-900 rounded-3xl bg-white dark:bg-neutral-900">
          <table className="w-full text-left font-sans text-xs">
            <thead className="bg-slate-50 dark:bg-neutral-800 text-slate-400 font-bold uppercase border-b border-slate-200 dark:border-neutral-900">
              <tr>
                <th className="p-4">Transaction Component</th>
                <th className="p-4">Applicable Rate / Standard</th>
                <th className="p-4">Terms and Policies</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800 text-slate-500 dark:text-slate-400">
              <tr>
                <td className="p-4 font-bold text-slate-900 dark:text-white">Platform Commission</td>
                <td className="p-4">Displayed prior to publishing</td>
                <td className="p-4">Deducted automatically from the escrow balance before disbursement. Non-refundable.</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900 dark:text-white">Escrow Holdings</td>
                <td className="p-4">100% of order value</td>
                <td className="p-4">Held securely inside neutral accounts. Cannot be drawn unilaterally by either party.</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900 dark:text-white">Minimum Payout Withdrawal</td>
                <td className="p-4">KES 100</td>
                <td className="p-4">Payouts are processed instantly once delivery is verified by the buyer or by administrative override.</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900 dark:text-white">Withdrawal Platform Fees</td>
                <td className="p-4">KES 0</td>
                <td className="p-4">HudumaLink charges zero platform fees to process mobile money wallet transfers.</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900 dark:text-white">Processing Tariffs</td>
                <td className="p-4">Standard carrier dynamic scales</td>
                <td className="p-4">All dynamic mobile money carrier-specific transaction fees are fully borne by the user.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 6: Legal Boundaries */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">6</span>
          Legal Disclaimers, Liability Limits, and Indemnity
        </h3>
        <div className="p-8 bg-neutral-950 text-white rounded-[2.5rem] border border-neutral-850 space-y-4">
          <div className="flex gap-3 items-start">
            <ShieldAlert className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-4 text-xs text-neutral-400 leading-relaxed font-sans">
              <p>
                <strong>1. Intermediary Status:</strong> HudumaLink is a neutral technology platform connecting buyers, sellers, and service contractors. We do not manufacture, store, represent, or inspect products, nor do we directly employ or provide warranties for independent contractor work.
              </p>
              <p>
                <strong>2. Exclusion of Liability:</strong> To the maximum extent permitted by the statutory laws of the Republic of Kenya, platform operators shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from transactions, contractor performance, product defects, physical meetings, or off-platform communication.
              </p>
              <p>
                <strong>3. Indemnification:</strong> You contractually agree to indemnify, defend, and hold harmless HudumaLink, its directors, officers, employees, and licensors from any claims, disputes, losses, liabilities, costs, or damages arising out of your listing violations, breach of terms, or physical transactions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Governing Law */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">7</span>
          Governing Law, Amendments, and Contact Information
        </h3>
        <div className="bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900/80 rounded-3xl p-8 space-y-6 font-sans">
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            These Terms of Service are constructed, interpreted, and governed strictly under the statutory laws of the <strong>Republic of Kenya</strong>. All disputes or arbitrations arising from the use of this marketplace shall submit exclusively to the jurisdiction of Kenyan courts.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            HudumaLink reserves the absolute corporate right to update, amend, or modify these terms at any time. Continued access or usage of platform services signifies contractual consent to the revised policies.
          </p>
          
          <div className="pt-4 border-t border-slate-100 dark:border-neutral-800 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Support Inquiries</p>
              <a href="mailto:support@hudumalink.co.ke" className="text-sm font-black text-emerald-600 dark:text-emerald-400 hover:underline">
                support@hudumalink.co.ke
              </a>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Corporate Headquarters</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">Eldoret, Kenya</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
