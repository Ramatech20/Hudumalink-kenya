import React from 'react';
import { Briefcase, FileCheck, Landmark, DollarSign, MessageSquare, CheckCircle, Ban, Sliders, ShieldCheck, Heart } from 'lucide-react';

export const ProviderStandards: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-neutral-900 pb-6">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Service Provider Standards</h2>
        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
          HudumaLink Contractor Code of Conduct
        </p>
      </div>

      {/* Intro alert */}
      <div className="p-8 rounded-[2rem] bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15 flex gap-4 items-start">
        <Briefcase className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-2">Professional Excellence</h3>
          <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-sans">
            HudumaLink connects skilled fundis, consultants, and freelancers with clients across Kenya. To maintain a safe and reputable network, all Service Providers are held to strict professional standards and transparent business practices.
          </p>
        </div>
      </div>

      {/* Grid: 6 Core Pillars */}
      <section className="space-y-8">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">The Six Pillars of Professional Conduct</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              icon: FileCheck,
              title: "1. Authentic Qualifications",
              desc: "Providers must present fully truthful certifications, licenses, training histories, and portfolios. Forging or inflating credentials will result in immediate profile suspension and permanent ban."
            },
            {
              icon: Sliders,
              title: "2. Upfront Pricing Transparency",
              desc: "All costs, milestone targets, material costs, and service rates must be clearly laid out and agreed upon within the platform interface prior to commencing work. Unilateral price changes are prohibited."
            },
            {
              icon: ShieldCheck,
              title: "3. Quality and Performance Standards",
              desc: "Deliver work according to industry best practices and specifications defined in the agreement. If a physical service fails to meet normal working standards, you must repair or resolve the issue immediately."
            },
            {
              icon: Heart,
              title: "4. Professional Conduct",
              desc: "Conduct physical and digital interactions with maximum courtesy, punctuality, and respect. Maintain safe, code-compliant, and ethical practices on every job site."
            },
            {
              icon: MessageSquare,
              title: "5. Mandatory Platform Communications",
              desc: "Keep all project update logs, milestone negotiations, and design criteria inside HudumaLink chat. External communications (WhatsApp, direct calls) are completely inadmissible in dispute reviews."
            },
            {
              icon: Ban,
              title: "6. Zero Off-Platform Payment Requests",
              desc: "Requesting, soliciting, or receiving deposits or payments directly via mobile money numbers or cash is strictly forbidden. All contract finances must pass through the HudumaLink escrow portal."
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

      {/* Platform Commissions and Admissible Evidence */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Commissions & Admissible Proofs</h3>
        <div className="p-8 bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900 rounded-3xl space-y-6">
          <div className="flex gap-4 items-start font-sans">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl mt-0.5 flex-shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">Platform Escrow Commission</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                HudumaLink automatically deducts the platform's service fee before transferring finalized balances to your provider wallet. Payout fees and platform commissions are clearly displayed upfront during listing or milestone creation.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start font-sans border-t border-slate-100 dark:border-neutral-800 pt-6">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl mt-0.5 flex-shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">Admissible Proof of Execution</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                To protect against fraudulent claims and ensure successful dispute mediation, service providers must capture and upload clear, objective proofs of milestone execution inside the HudumaLink portal. Admissible evidence includes:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono font-bold text-slate-600 dark:text-slate-350">
                <div className="p-4 bg-slate-50 dark:bg-neutral-800 rounded-xl text-center flex flex-col items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  BEFORE & AFTER PHOTOS
                </div>
                <div className="p-4 bg-slate-50 dark:bg-neutral-800 rounded-xl text-center flex flex-col items-center justify-center gap-1.5">
                  <Sliders className="w-4 h-4 text-emerald-500" />
                  DETAILED MILESTONE LOGS
                </div>
                <div className="p-4 bg-slate-50 dark:bg-neutral-800 rounded-xl text-center flex flex-col items-center justify-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-500" />
                  SIGNED SIGN-OFF FORMS
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
