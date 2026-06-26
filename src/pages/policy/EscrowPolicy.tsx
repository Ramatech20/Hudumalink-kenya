import React from 'react';
import { Handshake, ShieldCheck, Clock, AlertTriangle, Play, HelpCircle, FileText, Ban, CreditCard, ChevronRight, CheckCircle } from 'lucide-react';

export const EscrowPolicy: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-neutral-900 pb-6">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Escrow & Financial Payout Policy</h2>
        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
          HudumaLink Escrow Ledger Operations Standard
        </p>
      </div>

      {/* Overview callout */}
      <div className="p-8 rounded-[2rem] bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15 flex gap-4 items-start">
        <Handshake className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-2">Safe Holding Vault</h3>
          <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-sans">
            HudumaLink operates a secure escrow system. When an agreement is initiated, funds are securely sequestered inside our neutral ledger custody. Funds are only disbursed once delivery is successfully verified or after administrative review.
          </p>
        </div>
      </div>

      {/* Transaction Stages Timeline */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">The Six Escrow Stages</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
          All financial transactions on HudumaLink pass through these six sequential, audited ledger states:
        </p>

        <div className="relative border-l-2 border-slate-200 dark:border-neutral-850 pl-8 ml-4 space-y-8 font-sans">
          {[
            {
              stage: "Stage 1: Pending & Created",
              desc: "The buyer and provider agree on the contract parameters and price. The agreement is recorded, and the system awaits the buyer's billing execution.",
              color: "bg-slate-300 dark:bg-neutral-800 text-slate-700"
            },
            {
              stage: "Stage 2: Funded & Held",
              desc: "The buyer deposits the transaction balance via our third-party payment system. Funds enter the neutral escrow ledger, and the contract is locked against unilateral cancellations.",
              color: "bg-blue-500 text-white"
            },
            {
              stage: "Stage 3: Work in Progress / Dispatched",
              desc: "The seller packages and dispatches the item, or the service contractor actively executes the requested milestones. Communications are tracked on-platform.",
              color: "bg-amber-500 text-white"
            },
            {
              stage: "Stage 4: Delivered / Marked Complete",
              desc: "The merchant delivers the goods, or the contractor marks the milestones as completed. This action triggers the inspection timers.",
              color: "bg-purple-500 text-white"
            },
            {
              stage: "Stage 5: Confirmed & Scheduled",
              desc: "The buyer conducts a physical inspection, verifies the parameters, and clicks 'Confirm Delivery' on their dashboard. The transaction is finalized.",
              color: "bg-emerald-500 text-white"
            },
            {
              stage: "Stage 6: Released & Disbursed",
              desc: "The platform deducts the commission fee and transfers the net balance directly to the provider's wallet balance, ready for instant withdrawal.",
              color: "bg-teal-500 text-white"
            }
          ].map((item, index) => (
            <div key={index} className="relative">
              {/* Dot indicator */}
              <div className={`absolute -left-[41px] w-6 h-6 rounded-full border-4 border-slate-50 dark:border-neutral-950 flex items-center justify-center font-bold text-[10px] ${item.color}`}>
                {index + 1}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">{item.stage}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 72-Hour Release Workflow & Freeze Conditions */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Inspection Timers & Dispute Freezes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900 rounded-3xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white">72-Hour Service Release Workflow</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              Once a Service Provider marks a project as "Delivered," the client has exactly **72 hours** to verify the work or file a dispute. If the client is unresponsive after **48 hours**, the provider can submit an Administrative Release Request. After a final **24-hour warning** with no response, administrators will perform an override and release the funds.
            </p>
          </div>

          <div className="p-8 bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900 rounded-3xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Ban className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white">Dispute Freezes</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              If either party files an active dispute before delivery confirmation, the escrow ledger instantly freezes. No funds can be released, withdrawn, or refunded until our mediation division conducts an administrative review and issues a final, binding decision.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Refund and Withdrawal Specifics */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Refund Rules & Wallet Withdrawals</h3>
        <div className="p-8 bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900 rounded-3xl space-y-6 font-sans">
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            All refunds are disbursed exclusively back to the buyer's connected payment balance. Refunds are subject to the following strict conditions:
          </p>
          <div className="border-t border-slate-100 dark:border-neutral-800 pt-6 space-y-4">
            <div className="flex gap-3 text-xs">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>Refunds are only issued if the seller fails to dispatch items, if services remain incomplete, or following a formal administrative dispute decision.</span>
            </div>
            <div className="flex gap-3 text-xs">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>Platform service commission fees used to operate the secure escrow custody are non-refundable after successful order completion.</span>
            </div>
            <div className="flex gap-3 text-xs">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>Withdrawals are subject to a **minimum limit of KES 100**. While HudumaLink charges **KES 0 platform fees** for wallet withdrawals, standard dynamic dynamic third-party transaction tariffs are charged depending on the withdrawal volume. Wallet withdrawals to banks incur a flat KES 50 fee.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
