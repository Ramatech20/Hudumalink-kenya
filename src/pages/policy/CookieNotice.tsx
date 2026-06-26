import React from 'react';
import { ShieldCheck, Eye, HelpCircle, Lock, Sliders, CheckCircle, Info } from 'lucide-react';

export const CookieNotice: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-neutral-900 pb-6">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Cookie & Tracking Notice</h2>
        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
          HudumaLink Session & Local Storage Disclosures
        </p>
      </div>

      {/* Intro callout */}
      <div className="p-8 rounded-[2rem] bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15 flex gap-4 items-start">
        <Eye className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-2">No Predatory Tracking</h3>
          <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-sans">
            HudumaLink Kenya does <strong>not</strong> use tracking beacons, cross-site advertising cookie jars, or third-party behavioral scrapers. We only store functional cookies and local browser keys critical to verifying your identity and executing escrow payouts safely.
          </p>
        </div>
      </div>

      {/* Cookie Types Grid */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Cookies We Use</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
          Our platform relies on functional cookies and browser local storage divided into these categories:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
          {[
            {
              title: "1. Strictly Necessary (Authentication)",
              desc: "Critical keys utilized to manage your active session. They authenticate your buyer or merchant credentials, allowing you to browse or write contracts without repeating login prompts.",
              color: "border-slate-200 dark:border-neutral-900"
            },
            {
              title: "2. Payment Security & CSRF Defense",
              desc: "Security identifiers that block Cross-Site Request Forgery (CSRF) and validation tampering. They verify transactions are originated by authorized accounts, preventing wallet hijackings.",
              color: "border-slate-200 dark:border-neutral-900"
            },
            {
              title: "3. User Preference Persistence",
              desc: "Identifiers that memorize user-selected criteria across sessions, such as dark/light themes, active language choices, or filter parameters.",
              color: "border-slate-200 dark:border-neutral-900"
            },
            {
              title: "4. Site Performance & Load Speeds",
              desc: "Functional cache cookies that hold static design parameters and icons, ensuring quick rendering and responsive navigation across Kenya.",
              color: "border-slate-200 dark:border-neutral-900"
            }
          ].map((item, index) => (
            <div key={index} className={`p-8 bg-white dark:bg-neutral-900 border rounded-3xl ${item.color}`}>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-base">{item.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Consent & Management */}
      <section className="space-y-6 font-sans text-sm">
        <h3 className="text-xl font-black text-slate-900 dark:text-white">Explicit Consent & Cookie Management</h3>
        <div className="p-8 bg-slate-50 dark:bg-neutral-900/50 border border-slate-200/50 dark:border-neutral-900 rounded-[2rem] space-y-4">
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            By accessing or transacting on HudumaLink Kenya, you acknowledge and consent to our storage of functional cookies required to secure your financial sessions.
          </p>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            You can modify, block, or delete cookies via your browser's privacy settings. However, please note that blocking essential session cookies will completely disable authentication and prevent you from transacting or listing items on our marketplace.
          </p>
          
          <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 flex gap-3 items-center">
            <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold leading-relaxed">
              These cookies contain zero raw passwords, raw personal IDs, or mobile money wallet details.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
