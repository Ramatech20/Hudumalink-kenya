import React from 'react';
import { Lock, ShieldCheck, Database, Eye, UserCheck, AlertTriangle, FileText, Ban, Mail, CheckCircle } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-neutral-900 pb-6">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Privacy Policy</h2>
        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
          ODPC Kenya Compliance Standards • Last Updated: June 25, 2026
        </p>
      </div>

      {/* ODPC Compliance Callout */}
      <div className="p-8 rounded-[2rem] bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15 flex gap-4 items-start">
        <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-2">Kenyan Data Protection Compliance</h3>
          <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-sans">
            HudumaLink is fully registered and compliant with the <strong>Office of the Data Protection Commissioner (ODPC) of Kenya</strong> under the <strong>Data Protection Act (2019)</strong>. We implement industry-standard encryption, at-rest database protection, and strict purpose limitation protocols to protect your personal information.
          </p>
        </div>
      </div>

      {/* Section 1: Data We Collect */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">1</span>
          Information We Collect
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
          To provide a secure escrow marketplace, we collect and store the following data classes:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
          {[
            {
              title: "Personal Information",
              desc: "Your legal full name, verified email address, phone number, and account credentials."
            },
            {
              title: "KYC Documents",
              desc: "Kenyan National Identification Cards, passports, trade licenses, or professional certs (highly encrypted)."
            },
            {
              title: "Communication Logs",
              desc: "All messages, files, photos, milestone logs, and agreements sent within our native chat portals."
            },
            {
              title: "Transactional Metadata",
              desc: "Escrow balances, payout references, billing addresses, and payment gateway responses."
            },
            {
              title: "Device & Session Data",
              desc: "IP addresses, browser details, session tokens, and approximate geolocation data for fraud monitoring."
            },
            {
              title: "Cookies",
              desc: "Strictly functional identifiers required to secure authentication sessions and transaction ledgers."
            }
          ].map((item, index) => (
            <div key={index} className="p-6 bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900 rounded-2xl">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-2">{item.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Purpose and Usage */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">2</span>
          How We Use Your Information
        </h3>
        <div className="p-8 bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900 rounded-3xl space-y-4 font-sans text-sm">
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            We operate strictly under purpose-limitation rules. Your data is processed only to:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Verify merchant and contractor identities (KYC).</span>
            </div>
            <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Process and secure escrow transactions.</span>
            </div>
            <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Mitigate fraud, money laundering, and scams.</span>
            </div>
            <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Manage system stability and deliver support ticket responses.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Retention & Security */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">3</span>
          Data Retention and Security
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
          Identity verification documents and transactional histories are encrypted at rest and stored securely. As required by Kenyan financial regulations and anti-money laundering policies, all KYC documents are retained for the **duration of active account status plus 7 years** following account closure.
        </p>
      </section>

      {/* Section 4: Deletion rights */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">4</span>
          Your Rights & Permanent Account Deletion
        </h3>
        <div className="p-8 bg-red-500/5 dark:bg-red-500/10 border border-red-500/15 rounded-[2.5rem] space-y-4 font-sans text-sm">
          <p className="text-slate-600 dark:text-slate-350 leading-relaxed">
            Under the Kenyan Data Protection Act, you possess explicit rights to access, correct, or request the permanent deletion of your data.
          </p>
          <div className="p-6 bg-white dark:bg-neutral-900/60 rounded-2xl border border-red-500/10">
            <strong className="text-red-650 dark:text-red-400 block mb-1">Permanent Data Erasure</strong>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              You can request permanent account deletion directly through your Profile menu. Once a deletion request is authorized, all personal details, listings, files, communications, and authentication records will be permanently and irreversibly purged from our live database servers within 30 days. Transaction history required for legal/financial compliance is kept securely offline.
            </p>
          </div>
        </div>
      </section>

      {/* Section 5: Legal Disclosures */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">5</span>
          Legal Disclosures and Third-Party Systems
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
          We **never** sell, rent, or trade your personal data with third-party marketers. We only disclose information to comply with lawful warrants, court orders, or official directives issued by the ODPC or judicial authorities of the Republic of Kenya. Relevant transactional data is securely shared only with our designated third-party payment platforms to verify and authorize payout flows.
        </p>

        <div className="pt-6 border-t border-slate-100 dark:border-neutral-800 flex items-center gap-4">
          <Mail className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            For privacy queries: <a href="mailto:privacy@hudumalink.co.ke" className="text-emerald-600 dark:text-emerald-400 hover:underline">privacy@hudumalink.co.ke</a>
          </span>
        </div>
      </section>
    </div>
  );
};
