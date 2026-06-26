import React from 'react';
import { ShieldCheck, ShieldAlert, UserCheck, ShoppingBag, Briefcase, Lock, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

export const SafetyTips: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-neutral-900 pb-6">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Safety & Scam Protection Guide</h2>
        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
          HudumaLink Safe Transaction Guidelines
        </p>
      </div>

      {/* Hero Tip banner */}
      <div className="p-8 rounded-[2rem] bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15 flex gap-4 items-start">
        <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-2">Platform Safeguards</h3>
          <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-sans">
            Your safety is our absolute priority. We utilize verified identity controls, escrow holds, and mediation systems to prevent transaction fraud in Kenya. Please review these essential tips to defend your transactions and meet safely.
          </p>
        </div>
      </div>

      {/* Three Pillars: Buyers, Sellers, Providers */}
      <section className="space-y-8 font-sans">
        
        {/* Buyer Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200 dark:border-neutral-900">
            <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Safety Tips for Buyers</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900 rounded-2xl">
              <strong className="text-sm font-bold text-slate-900 dark:text-white block mb-1">Meet Safely in Public</strong>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Always organize product handovers in public, well-lit spaces during daytime (e.g., inside busy malls, banks, or transport hubs). Never meet in private residences or isolated zones.
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900 rounded-2xl">
              <strong className="text-sm font-bold text-slate-900 dark:text-white block mb-1">Inspect Before Confirming</strong>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Open, inspect, and fully verify items prior to releasing the escrow funds. Run laptops, turn on phones, test SIM slots, and verify conditions match listing disclosures.
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900 rounded-2xl">
              <strong className="text-sm font-bold text-slate-900 dark:text-white block mb-1">Evidentiary Platform Chat</strong>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Always exchange messages inside HudumaLink chat. Scammers often attempt to steer negotiations to WhatsApp to hide evidence. Platform chat logs are vital to resolve disputes.
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900 rounded-2xl">
              <strong className="text-sm font-bold text-slate-900 dark:text-white block mb-1">No Off-Platform Prepayments</strong>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Never wire money directly to a seller before receiving the items. Escrow secures your funds safely inside neutral storage. Paying cash or off-portal wires eliminates recovery options.
              </p>
            </div>
          </div>
        </div>

        {/* Seller Section */}
        <div className="space-y-4 pt-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200 dark:border-neutral-900">
            <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Safety Tips for Sellers</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900 rounded-2xl">
              <strong className="text-sm font-bold text-slate-900 dark:text-white block mb-1">Wait for "Funded" Escrow</strong>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Never dispatch inventory or hand over physical products until the transaction status reads <strong>"Funded"</strong> inside your dashboard ledger. This confirms funds are held securely.
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900 rounded-2xl">
              <strong className="text-sm font-bold text-slate-900 dark:text-white block mb-1">Document Packing & Dispatch</strong>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Retain dispatch slips, courier waybills, and take quick photos of physical packaging. This objective evidence protects you from bad-faith buyer non-delivery claims.
              </p>
            </div>
          </div>
        </div>

        {/* Provider Section */}
        <div className="space-y-4 pt-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200 dark:border-neutral-900">
            <Briefcase className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Safety Tips for Service Providers</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900 rounded-2xl">
              <strong className="text-sm font-bold text-slate-900 dark:text-white block mb-1">Verify Funded Contracts</strong>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Before purchasing consumables or traveling to physical job sites, ensure the client's escrow balance reads "Funded". This guarantees payment upon project completion.
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900 rounded-2xl">
              <strong className="text-sm font-bold text-slate-900 dark:text-white block mb-1">Log Milestones Graphically</strong>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Upload progression photos and milestone descriptions directly inside the platform portal. Documenting development steps protects your hard work and confirms fulfillment.
              </p>
            </div>
          </div>
        </div>

      </section>

      {/* OTP and Credential Alert Banner */}
      <div className="p-8 bg-red-500/5 dark:bg-red-500/10 border border-red-500/15 rounded-[2.5rem] flex gap-4 items-start font-sans">
        <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-2">
          <h4 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">Absolute Credential Defense</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            HudumaLink support desk, developers, or payment processors **will never ask you for account passwords, security tokens, or mobile money PIN codes**. Any request for access tokens constitutes fraud. Report any suspicious inquiries to our compliance division immediately.
          </p>
        </div>
      </div>
    </div>
  );
};
