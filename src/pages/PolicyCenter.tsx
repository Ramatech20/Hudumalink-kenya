import React, { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronDown, HelpCircle, MessageSquare } from 'lucide-react';
import { PolicyLayout, POLICY_TABS } from '../components/policy/PolicyLayout';

// Import modular pages
import { TermsOfService } from './policy/TermsOfService';
import { PrivacyPolicy } from './policy/PrivacyPolicy';
import { EscrowPolicy } from './policy/EscrowPolicy';
import { CookieNotice } from './policy/CookieNotice';
import { SafetyTips } from './policy/SafetyTips';
import { BuyerRules } from './policy/BuyerRules';
import { SellerRules } from './policy/SellerRules';
import { ProviderStandards } from './policy/ProviderStandards';
import { ProhibitedItems } from './policy/ProhibitedItems';
import { DisputeResolution } from './policy/DisputeResolution';

// Combined FAQ view
export const PolicyFAQ: React.FC = () => {
  const faqs = [
    {
      category: "Escrow & Safety Controls",
      questions: [
        {
          q: "What is HudumaLink's secure escrow process?",
          a: "Whenever you transact on HudumaLink, payment is securely held inside our neutral ledger. Funds are legally sequestered and cannot be unilaterally drawn by the merchant or contractor prior to your handover inspection. This blocks payment fraud entirely."
        },
        {
          q: "How does the 72-hour release workflow operate for service contracts?",
          a: "Once a contractor marks an order as 'Delivered', you have 72 hours to verify parameters or file a dispute. If you remain unresponsive after 48 hours, the provider can trigger an administrative request, followed by a final 24-hour warning, before a manual override is executed."
        },
        {
          q: "Can I use WhatsApp or direct SMS to discuss agreements?",
          a: "While you can speak locally, we strictly mandate keeping all project details and milestone agreements inside HudumaLink native chat. External logs (WhatsApp screenshots or call recordings) are completely inadmissible during dispute arbitrations."
        }
      ]
    },
    {
      category: "Merchant & Provider Rules",
      questions: [
        {
          q: "Are pre-payments or off-platform direct wires allowed?",
          a: "No. Requesting or making off-platform deposits or money transfers is strictly forbidden. Any account requesting off-platform payments will be instantly terminated, and active escrow payouts frozen."
        },
        {
          q: "What are the rules regarding pre-owned items or mobile phones?",
          a: "Every pre-owned listing must be labeled 'Second-Hand' and disclose defects, repair history, age, and battery health. Laptops and mobile phones must explicitly list model specifications and IMEI numbers."
        },
        {
          q: "When are marketplace commissions deducted?",
          a: "Marketplace commissions are displayed upfront before you publish a listing or confirm milestones. The applicable rate is deducted automatically prior to wallet disbursement and is non-refundable."
        }
      ]
    },
    {
      category: "ODPC & Data Security",
      questions: [
        {
          q: "Is HudumaLink registered under the Kenyan Data Protection Act?",
          a: "Yes. HudumaLink complies with the Office of the Data Protection Commissioner (ODPC) of Kenya. Your personal credentials and KYC files are stored securely and encrypted at rest."
        },
        {
          q: "How do I request permanent account deletion?",
          a: "You can trigger permanent account deletion directly within your Profile menu. Once authorized, all personal details, listings, files, and chat messages will be permanently purged from our active databases within 30 days."
        }
      ]
    }
  ];

  return (
    <div className="space-y-12">
      <div className="border-b border-slate-200 dark:border-neutral-900 pb-6">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Frequently Asked Questions</h2>
        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
          HudumaLink Legal & Operational Answers
        </p>
      </div>

      <div className="space-y-12 font-sans">
        {faqs.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-6">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 border-l-4 border-emerald-500 pl-4 uppercase tracking-wider text-xs">
              {group.category}
            </h3>
            <div className="space-y-4">
              {group.questions.map((item, itemIdx) => (
                <details 
                  key={itemIdx} 
                  className="group bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/60 dark:border-neutral-900 overflow-hidden shadow-sm transition-all duration-200"
                >
                  <summary className="flex items-center justify-between p-6 cursor-pointer list-none outline-none">
                    <span className="font-bold text-slate-900 dark:text-white text-sm pr-4">{item.q}</span>
                    <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0" />
                  </summary>
                  <div className="px-6 pb-6 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100/60 dark:border-neutral-800/40 pt-4">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-8 bg-neutral-900 text-white rounded-[2.5rem] relative overflow-hidden shadow-xl text-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] pointer-events-none" />
        <h3 className="text-xl font-black tracking-tight mb-2">Still have questions?</h3>
        <p className="text-neutral-400 text-xs mb-6 max-w-lg mx-auto">
          Our specialized support desk is available to assist you with active transaction IDs, dispute mediations, or general security inquiries.
        </p>
        <a 
          href="mailto:support@hudumalink.co.ke" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs tracking-wider font-bold uppercase rounded-xl transition-all"
        >
          <MessageSquare className="w-4 h-4" /> Message Support Desk
        </a>
      </div>
    </div>
  );
};

// General Router-mapped components
export const TermsPage: React.FC = () => (
  <PolicyLayout activeId="terms">
    <TermsOfService />
  </PolicyLayout>
);

export const PrivacyPage: React.FC = () => (
  <PolicyLayout activeId="privacy">
    <PrivacyPolicy />
  </PolicyLayout>
);

export const EscrowPolicyPage: React.FC = () => (
  <PolicyLayout activeId="escrow">
    <EscrowPolicy />
  </PolicyLayout>
);

export const CookiesPage: React.FC = () => (
  <PolicyLayout activeId="cookies">
    <CookieNotice />
  </PolicyLayout>
);

export const SafetyPage: React.FC = () => (
  <PolicyLayout activeId="safety">
    <SafetyTips />
  </PolicyLayout>
);

export const BuyerRulesPage: React.FC = () => (
  <PolicyLayout activeId="buyer-rules">
    <BuyerRules />
  </PolicyLayout>
);

export const SellerRulesPage: React.FC = () => (
  <PolicyLayout activeId="seller-rules">
    <SellerRules />
  </PolicyLayout>
);

export const ProviderStandardsPage: React.FC = () => (
  <PolicyLayout activeId="provider-standards">
    <ProviderStandards />
  </PolicyLayout>
);

export const ProhibitedItemsPage: React.FC = () => (
  <PolicyLayout activeId="prohibited-items">
    <ProhibitedItems />
  </PolicyLayout>
);

export const DisputePolicyPage: React.FC = () => (
  <PolicyLayout activeId="dispute-policy">
    <DisputeResolution />
  </PolicyLayout>
);

export const FAQPage: React.FC = () => (
  <PolicyLayout activeId="faq">
    <PolicyFAQ />
  </PolicyLayout>
);
