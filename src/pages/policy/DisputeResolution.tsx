import React from 'react';
import { ShieldAlert, Scale, CheckCircle, HelpCircle, FileText, XCircle, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

export const DisputeResolution: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-neutral-900 pb-6">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Dispute Resolution & Admissibility Policy</h2>
        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
          HudumaLink Transactional Arbitration Protocol
        </p>
      </div>

      {/* Intro callout */}
      <div className="p-8 rounded-[2rem] bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15 flex gap-4 items-start">
        <Scale className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-2">Fair & Neutral Arbitration</h3>
          <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-sans">
            Whenever a transaction conflicts with specification boundaries, HudumaLink provides a neutral, legally binding dispute resolution framework. Payouts are locked securely inside the escrow vault while both parties submit formal proof of execution or failure.
          </p>
        </div>
      </div>

      {/* Step Indicator Flowchart */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Dispute Resolution Stages</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
          Disputes are adjudicated using the following four stages:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 font-sans">
          {[
            {
              step: "Stage 1",
              title: "Dispute Opened",
              desc: "The buyer clicks 'File Dispute' on their order dashboard before escrow release. Funds freeze instantly."
            },
            {
              step: "Stage 2",
              title: "Evidence Period",
              desc: "Both parties are given exactly **48 hours** to submit files, images, or milestone logs inside the portal."
            },
            {
              step: "Stage 3",
              title: "Admin Review",
              desc: "Compliance operators audit platform-captured chat histories, physical delivery photos, and signed waybills."
            },
            {
              step: "Stage 4",
              title: "Final Decision",
              desc: "HudumaLink executes a binding release override, either refunding the buyer or disbursing funds to the seller."
            }
          ].map((item, index) => (
            <div key={index} className="p-6 bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900 rounded-2xl relative">
              <div className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                {item.step}
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-sm mt-2">{item.title}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Admissibility Rules table */}
      <section className="space-y-6 font-sans">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Evidence Admissibility Criteria</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Arbitration decisions are made strictly based on verifiable, untampered platform data. External conversations are excluded to prevent forging:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admissible */}
          <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl space-y-4">
            <h4 className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" /> Admissible Platform Evidence
            </h4>
            <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-350 leading-relaxed list-disc list-inside">
              <li>Messages and agreements exchanged inside HudumaLink chat.</li>
              <li>Milestone logs, photos, and delivery files uploaded to the platform.</li>
              <li>Official transport waybills or delivery hand-off forms signed by the buyer.</li>
              <li>Official platform timestamp logs and order status updates.</li>
            </ul>
          </div>

          {/* Inadmissible */}
          <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-3xl space-y-4">
            <h4 className="font-bold text-red-650 dark:text-red-400 flex items-center gap-2">
              <XCircle className="w-5 h-5" /> Inadmissible External Evidence
            </h4>
            <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-350 leading-relaxed list-disc list-inside">
              <li>Screenshots of WhatsApp chats or external SMS logs.</li>
              <li>External phone recordings or voice message clips.</li>
              <li>Third-party sharing links, Google Docs, or email strings outside support.</li>
              <li>Cash receipts or off-platform money transfer records.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Possible Outcomes */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Possible Arbitration Outcomes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
          <div className="p-6 bg-slate-100/50 dark:bg-neutral-900/40 rounded-2xl border border-slate-200/40">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">1. Full Buyer Refund</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              If the seller fails to dispatch goods, contractor work is proven incomplete, or items are defective upon handover inspection. Escrow balances return to the buyer's balance.
            </p>
          </div>
          <div className="p-6 bg-slate-100/50 dark:bg-neutral-900/40 rounded-2xl border border-slate-200/40">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">2. Negotiated Partial Split</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              If work was partially completed to standard, or minor repairable defects exist on pre-owned items. The escrow funds are split dynamically between both parties.
            </p>
          </div>
          <div className="p-6 bg-slate-100/50 dark:bg-neutral-900/40 rounded-2xl border border-slate-200/40">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">3. Full Seller Release</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              If delivery waybills and platform images verify that goods or services were fully and correctly completed. Net funds disburse to the seller's wallet.
            </p>
          </div>
        </div>
      </section>

      {/* Appeals and Fraud Protection */}
      <div className="p-8 bg-red-500/5 dark:bg-red-500/10 border border-red-500/15 rounded-[2.5rem] flex gap-4 items-start font-sans">
        <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-2 text-xs">
          <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">Fraud Investigations & Appeal Limits</h4>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            Abusing the mediation system by presenting forged waybills, fake photos, or filing baseless claims constitutes consumer fraud. This leads to immediate wallet freezing, platform bans, and legal reports.
          </p>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-semibold pt-2">
            Appeals are strictly limited to **7 days** following an arbitration decision and are only evaluated if new, material platform-captured records are presented.
          </p>
        </div>
      </div>
    </div>
  );
};
