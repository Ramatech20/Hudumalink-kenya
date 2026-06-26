import React from 'react';
import { ShoppingBag, FileCheck, CheckCircle, Image as ImageIcon, Sliders, Smartphone, DollarSign, Truck, AlertTriangle } from 'lucide-react';

export const SellerRules: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-neutral-900 pb-6">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Seller Rules & Listing Standards</h2>
        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
          HudumaLink Merchant Compliance Guidelines
        </p>
      </div>

      {/* Intro callout */}
      <div className="p-8 rounded-[2rem] bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15 flex gap-4 items-start">
        <ShoppingBag className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-2">Merchant Integrity</h3>
          <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-sans">
            To build a high-trust digital marketplace in Kenya, HudumaLink enforces comprehensive quality controls and description standards. All sellers and merchants are contractually bound to deliver exactly what is described under penalty of immediate platform restriction.
          </p>
        </div>
      </div>

      {/* Section 1: Item Ownership & Illegal Goods */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">1</span>
          Absolute Legal Ownership & Verification
        </h3>
        <div className="p-8 bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900/80 rounded-3xl space-y-4 shadow-sm font-sans">
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            By publishing a listing on HudumaLink, the seller contractually guarantees that the listed items <strong>legally belong to them</strong>, are free from local liens, and are entirely authorized for resale.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-5 bg-red-550/5 rounded-2xl border border-red-500/10 text-xs">
              <strong className="text-red-650 dark:text-red-400 block mb-1">Stolen & Counterfeit Goods Ban</strong>
              The sale of stolen property, illegally imported assets, counterfeit merchandise, unlicensed replicas, or brand knock-offs is strictly prohibited. Violations will lead to immediate, irreversible account ban and report to Kenyan law enforcement.
            </div>
            <div className="p-5 bg-emerald-550/5 rounded-2xl border border-emerald-500/10 text-xs">
              <strong className="text-emerald-650 dark:text-emerald-400 block mb-1">Proof of Ownership Requirements</strong>
              For high-value or high-risk listings (e.g., modern laptops, high-end cameras, or vehicles), HudumaLink compliance operators may request authentic receipts, warranty cards, purchase invoices, or legal logbooks prior to listing approval.
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Visual & Textual Guidelines */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">2</span>
          Product Images & Description Accuracy
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900 rounded-3xl shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2">Authentic Product Images</h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans list-disc list-inside">
              <li>Must show the actual physical item available for sale.</li>
              <li>Must be clear, recent, and taken in well-lit environments.</li>
              <li>Must show multiple angles, including any visible wear.</li>
              <li>Generic stock photos are forbidden unless clearly noted.</li>
            </ul>
          </div>
          <div className="p-8 bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900 rounded-3xl shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <Sliders className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2">Airtight Descriptions</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              Descriptions must disclose every defect, dent, scratch, hardware limitation, repair history, missing accessory, or warranty expiration. Over-promising or hiding defects constitutes platform misrepresentation.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Used Goods & Mobile Devices */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">3</span>
          Disclosures for Second-Hand Goods & Phones
        </h3>
        <div className="p-8 bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900/80 rounded-3xl space-y-6 shadow-sm">
          
          {/* Second Hand Specs */}
          <div className="flex gap-4 items-start font-sans">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl mt-0.5 flex-shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">General Used Goods Mandate</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Every pre-owned listing must be marked clearly as <strong>Second-Hand</strong>. You must explicitly declare the item age, previous repairs, defects, and overall battery capacity where applicable.
              </p>
            </div>
          </div>

          {/* Smartphone details */}
          <div className="flex gap-4 items-start font-sans border-t border-slate-100 dark:border-neutral-800 pt-6">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl mt-0.5 flex-shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">Mobile Phone Standards</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                Sellers listing mobile phones or tablets must accurately include the following technical details in their description fields:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono font-bold text-slate-600 dark:text-slate-350">
                <div className="p-3 bg-slate-50 dark:bg-neutral-800 rounded-xl text-center">IMEI NUMBER</div>
                <div className="p-3 bg-slate-50 dark:bg-neutral-800 rounded-xl text-center">EXACT MODEL</div>
                <div className="p-3 bg-slate-50 dark:bg-neutral-800 rounded-xl text-center">STORAGE (GB)</div>
                <div className="p-3 bg-slate-50 dark:bg-neutral-800 text-emerald-500 rounded-xl text-center">BATTERY HEALTH %</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Section 4: Commission & Delivery */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">4</span>
          Commission & Fulfilling Orders
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
          
          <div className="p-8 bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900 rounded-3xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <DollarSign className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">Escrow Fees & Commissions</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                HudumaLink automatically deducts the pre-disclosed platform commission before releasing escrow payments to your wallet. Commission rates are clearly displayed prior to publishing or milestone confirmation. All completed transaction commissions are non-refundable.
              </p>
            </div>
          </div>

          <div className="p-8 bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900 rounded-3xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Truck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">Delivery Responsibilities</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Merchants are fully responsible for packing sold items securely to prevent transport damage, dispatching parcels within the agreed timelines, and proactively communicating any transport delays inside the chat.
              </p>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};
