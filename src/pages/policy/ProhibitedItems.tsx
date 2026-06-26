import React from 'react';
import { Ban, AlertTriangle, ShieldAlert, CheckCircle, HelpCircle, XCircle } from 'lucide-react';

export const ProhibitedItems: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-neutral-900 pb-6">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Prohibited Items & Services Policy</h2>
        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
          HudumaLink Restricted Content Guidelines
        </p>
      </div>

      {/* Intro callout */}
      <div className="p-8 rounded-[2rem] bg-red-500/5 dark:bg-red-500/10 border border-red-500/15 flex gap-4 items-start">
        <Ban className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-2">Restricted Listing Standards</h3>
          <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-sans">
            To remain fully compliant with the laws of the Republic of Kenya and guarantee a high-trust, safe marketplace, HudumaLink strictly prohibits the listing, offering, or advertisement of certain goods and service models.
          </p>
        </div>
      </div>

      {/* Grid: Prohibited Items vs Prohibited Services */}
      <section className="space-y-8 font-sans">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Prohibited Physical Goods */}
          <div className="p-8 bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900 rounded-[2.5rem] shadow-sm">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-neutral-800 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" /> Forbidden Physical Items
            </h3>
            <ul className="space-y-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <li>
                <strong className="text-slate-800 dark:text-slate-200 block mb-1">1. Illegal Drugs & Paraphernalia</strong>
                Natives, pharmaceuticals, prescriptions, narcotics, dangerous chemicals, or illegal recreational substances.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200 block mb-1">2. Counterfeits & Brand Replicas</strong>
                Items violating trademarks, knock-off designer wear, replica electronics, or unlicensed replicas.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200 block mb-1">3. Stolen Property & Liens</strong>
                Items listed without lawful title, stolen smartphones, or equipment bypassing lock screens.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200 block mb-1">4. Prohibited Weapons & Explosives</strong>
                Firearms, military gear, live ammunition, explosives, dangerous blades, and localized weapons.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200 block mb-1">5. Wildlife & Ivory Products</strong>
                Elephant ivory, animal skins, horns, live specimens, and products violating local wildlife protection laws.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200 block mb-1">6. Government IDs & Uniforms</strong>
                Official passports, National Identification Cards, defense uniforms, badges, and municipal equipment.
              </li>
            </ul>
          </div>

          {/* Prohibited Services */}
          <div className="p-8 bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900 rounded-[2.5rem] shadow-sm">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-neutral-800 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" /> Forbidden Service Models
            </h3>
            <ul className="space-y-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <li>
                <strong className="text-slate-800 dark:text-slate-200 block mb-1">1. Adult Content & Prostitution</strong>
                Sexually explicit catalogs, webcam services, dating directories, escort models, or adult merchandise.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200 block mb-1">2. Fraudulent & Academic Deception</strong>
                Exam cheating services, thesis forging, falsifying documents, or creating fake academic credentials.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200 block mb-1">3. Financial Scams & Pyramids</strong>
                Multi-level marketing (MLM) programs, pyramid schemas, get-rich-quick proposals, or coin miners.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200 block mb-1">4. Unlicensed Medical Care</strong>
                Medical procedures, independent pharmacological consultancies, or selling medical equipment without licensing.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200 block mb-1">5. Digital Piracy & Cracked Accounts</strong>
                Cracked software licenses, piracy indexes, hacked streaming accounts, or video game boosting models.
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* Platform Enforcement Policies */}
      <section className="space-y-6 font-sans">
        <h3 className="text-xl font-black text-slate-900 dark:text-white">Listing Pulls & Reporting Rights</h3>
        <div className="p-8 bg-slate-50 dark:bg-neutral-900/50 border border-slate-200/50 dark:border-neutral-900 rounded-[2rem] space-y-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          <p>
            HudumaLink compliance operators actively screen user listings, keywords, and chat logs using automated detection models.
          </p>
          <div className="border-t border-slate-100 dark:border-neutral-800 pt-4 space-y-3 text-xs">
            <div className="flex gap-2">
              <CheckCircle className="w-4.5 h-4.5 text-red-500 flex-shrink-0 mt-0.5" />
              <span>Listing Pulls: Violating listings will be deleted instantly without prior warning or administrative notice.</span>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="w-4.5 h-4.5 text-red-500 flex-shrink-0 mt-0.5" />
              <span>Wallet Freezing: Any seller or contractor caught transacting prohibited items will have their payout balance permanently frozen.</span>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="w-4.5 h-4.5 text-red-500 flex-shrink-0 mt-0.5" />
              <span>Law Enforcement Reports: Severe violations, specifically counterfeit goods, firearms, or stolen inventory, will be forwarded to the Directorate of Criminal Investigations (DCI) of Kenya.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
