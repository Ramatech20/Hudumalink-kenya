import React from 'react';
import { UserCheck, ShieldCheck, AlertTriangle, Eye, HelpCircle, MessageSquare, Star, Ban, Sliders } from 'lucide-react';

export const BuyerRules: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-neutral-900 pb-6">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Buyer Rules & Responsibilities</h2>
        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
          HudumaLink Consumer Protection Policy
        </p>
      </div>

      {/* Intro alert */}
      <div className="p-8 rounded-[2rem] bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15 flex gap-4 items-start">
        <UserCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-2">Safe Buying in Kenya</h3>
          <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-sans">
            HudumaLink utilizes a secure escrow ledger to safeguard your funds. To maintain payment security and ensure a successful purchase experience, buyers must adhere to these structural guidelines and responsibilities.
          </p>
        </div>
      </div>

      {/* Core Rules Grid */}
      <section className="space-y-8">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Essential Guidelines for Buyers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              icon: Eye,
              title: "1. Diligent Listing Verification",
              desc: "Carefully inspect the listing details, item description, and condition before committing. Compare market rates and verify seller reviews. If details are ambiguous, ask questions inside platform chat."
            },
            {
              icon: MessageSquare,
              title: "2. Native Platform Communication",
              desc: "All negotiations, updates, and agreements must remain strictly within our native secure chat. Moving conversations to external channels like WhatsApp removes crucial evidence necessary for dispute arbitration."
            },
            {
              icon: Ban,
              title: "3. Direct / Off-Platform Payment Ban",
              desc: "Never send direct deposits, prepayments, or mobile money transfers to sellers outside our payment portal. Transacting outside the escrow ledger invalidates platform guarantees and leads to permanent bans."
            },
            {
              icon: ShieldCheck,
              title: "4. Mandated Handover Inspection",
              desc: "Buyers are legally obligated to inspect items physically at the point of delivery before confirming. Check and confirm conditions, accessories, and descriptions are fully matched."
            },
            {
              icon: Sliders,
              title: "5. Electronics Hardware Testing",
              desc: "When purchasing mobile phones, laptops, or electronics, turn on, test battery life, insert SIM cards, and run hardware operations prior to clicking 'Confirm Delivery' on your dashboard."
            },
            {
              icon: AlertTriangle,
              title: "6. Timely Dispute Filing",
              desc: "If delivered items are defective, incorrect, or missing parts, file an active dispute within 24 hours for physical goods or 72 hours for services. Once delivery is confirmed, funds are permanently released and non-refundable."
            }
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="p-8 bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900/80 rounded-3xl shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">{item.title}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-sans">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Critical Notice */}
      <div className="p-8 bg-red-500/5 dark:bg-red-500/10 border border-red-500/15 rounded-[2.5rem] flex gap-4 items-start font-sans">
        <Ban className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-2">
          <h4 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">Fraudulent Refund & Cancellation Bans</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Filing false disputes, claiming non-delivery for successfully received goods, or abusing the escrow system to withhold legitimate contractor payments is strictly prohibited. Users detected launching fraudulent claims will be subjected to permanent account termination, payout freezing, and formal reports to Kenyan authorities.
          </p>
        </div>
      </div>

      {/* Summary Accordion */}
      <section className="space-y-6">
        <h3 className="text-xl font-black text-slate-900 dark:text-white">Review & Conduct Guidelines</h3>
        <div className="p-8 bg-slate-50 dark:bg-neutral-900/50 border border-slate-200/50 dark:border-neutral-900 rounded-[2rem] space-y-4 font-sans text-sm">
          <div className="flex gap-3 items-start">
            <Star className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white block mb-1">Leave Objective, Honest Reviews</strong>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                After successfully completing an escrow release, leave an honest rating about the seller's communication, speed, and product quality. Ensure comments are professional and helpful to the HudumaLink community.
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start pt-4 border-t border-slate-100 dark:border-neutral-800">
            <HelpCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white block mb-1">Responsibility for Confirmations</strong>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Buyers assume full responsibility for verifying order parameters. HudumaLink utilizes secure, automated systems to track deliveries, but physical confirmation and product acceptance are within your sole local discretion.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
