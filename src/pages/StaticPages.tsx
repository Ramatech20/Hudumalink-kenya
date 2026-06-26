import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ShoppingBag, Wrench, ShieldCheck, Search, MessageCircle, Star, Rocket, 
  CheckCircle2, ArrowRight, UserPlus, Image as ImageIcon, CreditCard,
  Lock, Eye, FileText, AlertTriangle, Handshake, Scale, Info, ShieldAlert,
  Users, Zap, Globe, Heart, CheckCircle, Facebook, Instagram, Linkedin, 
  Send, HelpCircle, ChevronDown, Mail, Phone, MessageSquare, Target, MapPin,
  History, Lightbulb, TrendingUp, Flag, Layout, Building2, Shield, UserCheck, Briefcase, Clock
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const ContentPage = ({ content }: { content: string }) => (
  <div className="max-w-4xl mx-auto px-4 py-16">
    <div className="prose prose-lg max-w-none prose-headings:text-primary prose-a:text-secondary prose-strong:text-accent dark:prose-invert transition-colors">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  </div>
);

export const About = () => (
  <div className="bg-white dark:bg-neutral-950 transition-colors">
    {/* Hero Section */}
    <div className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 kenyan-gradient opacity-5 -skew-y-6 origin-top-left transform scale-110"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-bold mb-6 tracking-wider uppercase"
          >
            About HudumaLink
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white mb-8 tracking-tight leading-none">
            Empowering Kenya’s <span className="text-primary">Digital Economy</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl mx-auto">
            HudumaLink is more than just a marketplace — it is a centralized digital ecosystem designed to connect skilled service providers, sellers, and everyday Kenyans in a safe, structured, and trustworthy environment.
          </p>
        </div>
      </div>
    </div>

    {/* Our Story Section */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/10 text-secondary rounded-lg text-xs font-bold uppercase tracking-widest">
            <History className="w-4 h-4" /> Our Story
          </div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white leading-tight">
            Born from a real and everyday <span className="text-secondary">problem</span> in Kenya.
          </h2>
          <div className="space-y-4 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            <p>
              Finding trusted services is difficult, and getting reliable customers is even harder. Across the country, thousands of skilled individuals — fundis, freelancers, small business owners — struggle to reach a wider audience.
            </p>
            <p>
              At the same time, customers face uncertainty, scams, and lack of accountability when trying to hire or buy locally.
            </p>
            <p className="font-medium text-gray-900 dark:text-white italic border-l-4 border-primary pl-4">
              "As a student, developer, and someone deeply connected to the local environment, I saw this gap firsthand. HudumaLink began as a solution to bridge that gap — to bring structure, trust, and visibility into Kenya’s informal and rapidly growing digital economy."
            </p>
          </div>
        </div>
        <div className="relative">
          <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl relative group">
            <img 
              src="https://images.unsplash.com/photo-1618245361464-44124397162a?auto=format&fit=crop&q=80&w=800" 
              alt="Aerial view of Nairobi Skyline, Kenya" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            <div className="absolute bottom-10 left-10 right-10">
              <div className="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                <p className="text-white font-bold text-lg">Connecting 47 Counties</p>
                <p className="text-white/80 text-sm">From the heart of Eldoret to every corner of Kenya.</p>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl -z-10"></div>
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-secondary/20 rounded-full blur-3xl -z-10"></div>
        </div>
      </div>
    </div>

    {/* The Problem Section */}
    <div className="bg-gray-50 dark:bg-neutral-900/50 py-24 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-6">The Problem We’re Solving</h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Kenya’s local commerce is full of potential, but it faces critical challenges that we are determined to overcome.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { title: "Lack of Trust", desc: "Uncertainty between buyers and sellers often stalls growth.", icon: <ShieldAlert className="w-6 h-6" /> },
            { title: "Fraud & Scams", desc: "High cases of unreliable transactions damage the digital economy.", icon: <AlertTriangle className="w-6 h-6" /> },
            { title: "Limited Visibility", desc: "Skilled individuals struggle to reach a wider audience.", icon: <Eye className="w-6 h-6" /> },
            { title: "Informal Systems", desc: "Lack of protection or accountability in everyday deals.", icon: <Scale className="w-6 h-6" /> },
            { title: "Discovery Issues", desc: "Difficulty in discovering verified and trusted services.", icon: <Search className="w-6 h-6" /> },
            { title: "Payment Safety", desc: "Need for secure, integrated local payment solutions.", icon: <Lock className="w-6 h-6" /> }
          ].map((item, i) => (
            <div key={i} className="p-8 bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl flex items-center justify-center mb-6">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Mission & Vision Section */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="p-12 bg-primary text-white rounded-[3rem] shadow-2xl shadow-primary/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] group-hover:bg-white/20 transition-all"></div>
          <Target className="w-12 h-12 mb-8" />
          <h2 className="text-4xl font-black mb-6">Our Mission</h2>
          <p className="text-xl text-white/90 leading-relaxed">
            To build a safe, transparent, and efficient digital ecosystem where every Kenyan can offer their skills or products to a wider audience — without fear of fraud — and where customers can access services they can trust.
          </p>
        </div>
        <div className="p-12 bg-neutral-900 text-white rounded-[3rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 blur-[100px] group-hover:bg-secondary/20 transition-all"></div>
          <TrendingUp className="w-12 h-12 mb-8 text-secondary" />
          <h2 className="text-4xl font-black mb-6">Our Vision</h2>
          <p className="text-xl text-white/90 leading-relaxed">
            To become Africa’s most trusted digital marketplace for services and local commerce — starting in Kenya and expanding across East Africa — empowering millions of individuals to participate in the digital economy.
          </p>
        </div>
      </div>
    </div>

    {/* Our Solution Section */}
    <div className="bg-gray-50 dark:bg-neutral-900/50 py-24 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="aspect-square bg-primary/10 rounded-3xl flex items-center justify-center">
                  <Search className="w-12 h-12 text-primary" />
                </div>
                <div className="aspect-video bg-secondary/10 rounded-3xl flex items-center justify-center">
                  <CreditCard className="w-12 h-12 text-secondary" />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="aspect-video bg-accent/10 rounded-3xl flex items-center justify-center">
                  <ShieldCheck className="w-12 h-12 text-accent" />
                </div>
                <div className="aspect-square bg-gray-200 dark:bg-neutral-800 rounded-3xl flex items-center justify-center">
                  <Users className="w-12 h-12 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-8 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold uppercase tracking-widest">
              <Lightbulb className="w-4 h-4" /> Our Solution
            </div>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white leading-tight">
              A centralized platform built <span className="text-primary">specifically</span> for Kenya.
            </h2>
            <div className="space-y-6">
              {[
                "Discover verified, skilled service providers and authorized vendors.",
                "Initiate milestone agreements and escrow deposits through our streamlined system.",
                "Execute secure transactions backed by an automated third-party payment infrastructure.",
                "Benefit from structured transactions, system tracking, and complete accountability.",
                "Access a modern, regulated digital marketplace."
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <p className="text-lg text-gray-600 dark:text-gray-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Our Values Section */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">Our Values</h2>
        <p className="text-gray-500 dark:text-gray-400">The principles that guide our every move</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { 
            title: "Trust First", 
            desc: "We prioritize safety in every transaction. Our escrow-based system ensures that payments are only completed when both parties are satisfied.", 
            icon: <ShieldCheck className="w-8 h-8 text-primary" />,
            color: "bg-primary/10"
          },
          { 
            title: "Local Innovation", 
            desc: "HudumaLink is built specifically for Kenya — integrating secure transactions and accommodating standard local mobile money services.", 
            icon: <Zap className="w-8 h-8 text-accent" />,
            color: "bg-accent/10"
          },
          { 
            title: "Community Driven", 
            desc: "We actively listen to our users and continuously improve the platform based on real feedback and real-world challenges.", 
            icon: <Users className="w-8 h-8 text-secondary" />,
            color: "bg-secondary/10"
          }
        ].map((value, i) => (
          <div key={i} className="p-10 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-all group">
            <div className={cn("mb-8 p-4 rounded-2xl w-fit group-hover:scale-110 transition-transform", value.color)}>
              {value.icon}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{value.title}</h3>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{value.desc}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Status Section */}
    <div className="bg-neutral-900 py-24 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary rounded-full blur-[120px]"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-secondary rounded-full blur-[120px]"></div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-black text-white mb-8">Where We Are Now</h2>
            <div className="space-y-6">
              {[
                { label: "Status", val: "Verified Service Platform", icon: <ShieldCheck className="w-5 h-5" /> },
                { label: "Coverage", val: "Designed to serve all 47 counties in Kenya", icon: <MapPin className="w-5 h-5" /> },
                { label: "Focus", val: "Building a secure, scalable, and user-friendly system", icon: <Shield className="w-5 h-5" /> },
                { label: "Growth", val: "Early-stage growth with a strong foundation for expansion", icon: <Rocket className="w-5 h-5" /> }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm mb-1 uppercase tracking-wider">{item.label}</p>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center lg:text-left space-y-8">
            <h2 className="text-4xl font-black text-white">Building the Future</h2>
            <p className="text-xl text-gray-400 leading-relaxed">
              We believe the future of commerce in Kenya is digital, local, and trust-driven. HudumaLink is not just building a platform — we are building an ecosystem where opportunity is shared, transactions are secure, and every Kenyan has a chance to grow.
            </p>
            <div className="pt-8">
              <div className="inline-block p-8 bg-primary/10 border border-primary/20 rounded-[2rem]">
                <p className="text-2xl font-black text-white italic">
                  “Building the future of Kenyan commerce, one link at a time.”
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const Terms = () => (
  <div className="bg-white dark:bg-neutral-950 transition-colors">
    {/* Hero Section */}
    <div className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-secondary/5 dark:bg-secondary/10 -skew-y-6 origin-top-left transform scale-110"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-secondary/10 rounded-3xl text-secondary mb-8"
        >
          <Scale className="w-10 h-10" />
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
          Terms of <span className="text-secondary">Service</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
          The regulatory, operational, and structural framework governing the use of the HudumaLink platform.
        </p>
        <p className="mt-4 text-sm font-bold text-gray-400 uppercase tracking-widest">Last Updated: June 17, 2026</p>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-16">
          <section>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">1</div>
              Account, Eligibility and Authorized User Classes
            </h2>
            <div className="bg-gray-50 dark:bg-neutral-900 p-10 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                To use HudumaLink Kenya, individuals must be at least 18 years of age and possess a valid Kenyan National Identification Card. The platform strictly enforces three non-overlapping user classifications to preserve operational integrity, safety, and systemic compliance:
              </p>
              
              <div className="border-t border-gray-200 dark:border-neutral-800 pt-6 space-y-6">
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 font-sans">
                  <div className="p-5 bg-transparent rounded-2xl border border-gray-200 dark:border-neutral-800">
                    <strong className="text-gray-950 dark:text-white block mb-1">Class 1: Consumer Account (Buyer)</strong>
                    <p className="mt-1 leading-relaxed">
                      <strong>Privileges:</strong> Authorized for search, directory browsing, native messaging, escrow booking execution, and payment transaction flows.<br />
                      <strong>Restrictions:</strong> Absolute zero publication privileges. Consumer accounts are strictly prohibited from publishing listings or offering items, products, or services of any nature.
                    </p>
                  </div>
                  <div className="p-5 bg-transparent rounded-2xl border border-gray-200 dark:border-neutral-800">
                    <strong className="text-gray-950 dark:text-white block mb-1">Class 2: Merchant Account (Seller)</strong>
                    <p className="mt-1 leading-relaxed">
                      <strong>Privileges:</strong> Authorized exclusively for the publication, management, and fulfillment of physical products and tangible inventory items.<br />
                      <strong>Restrictions:</strong> Strictly prohibited from listing professional consultations, digital hours, freelance services, or manual labor of any type.
                    </p>
                  </div>
                  <div className="p-5 bg-transparent rounded-2xl border border-gray-200 dark:border-neutral-800">
                    <strong className="text-gray-950 dark:text-white block mb-1">Class 3: Service Provider Account (Dual-Tier Dual-Authority)</strong>
                    <p className="mt-1 leading-relaxed">
                      <strong>Privileges:</strong> Authorized with dual-tier credentials to list, advertise, and execute professional services (including technical labor, consultancy, artisanal installations, and freelance contracts) as well as any directly relevant physical consumables or component products necessary to fulfill those services.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-4">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">2</div>
              Prohibited Activities
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: "No Fraudulent Misrepresentation", desc: "Any misrepresentation of products, services, capabilities, or identity is strictly prohibited." },
                { title: "No Unauthorized Listings", desc: "Listing prohibited items, illicit goods, or service types outside authorized account privileges will result in immediate termination." },
                { title: "No Platform Bypassing", desc: "Attempting to circumvent native escrow, payment, or security infrastructures violates these Terms." },
                { title: "No Interference", desc: "Any system abuse, harassment, spamming, or disruption of platform activities is strictly prohibited." }
              ].map((item, i) => (
                <div key={i} className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-sm">
                  <h3 className="font-bold text-gray-950 dark:text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                Violations of platform boundaries or operational constraints will result in immediate suspension or permanent account termination without prior administrative notice.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-4">
              <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">3</div>
              Third-Party Payments and Escrow Timeline Protocols
            </h2>
            <div className="p-10 bg-gray-50 dark:bg-neutral-900 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800">
              <div className="space-y-6 text-gray-650 dark:text-gray-300 text-sm">
                <div className="flex gap-4">
                  <ShieldCheck className="w-6 h-6 text-secondary flex-shrink-0" />
                  <div>
                    <strong className="text-gray-950 dark:text-white">Third-Party Payment Integration:</strong>
                    <p className="mt-1 leading-relaxed">
                      HudumaLink utilizes a secure third-party payment system to process all monetary transactions, deposit escrow balances, and handle payouts. By transacting on the platform, users agree to abide by the terms of service of such automated third-party processors.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 border-t border-gray-200 dark:border-neutral-800 pt-6">
                  <Clock className="w-6 h-6 text-secondary flex-shrink-0" />
                  <div>
                    <strong className="text-gray-950 dark:text-white">Physical Goods Escrow Lifecycle:</strong>
                    <p className="mt-1 leading-relaxed">
                      Upon vendor delivery of physical inventory, the buyer must physically inspect the items at the point of delivery prior to confirming acceptance. Once delivery is confirmed, the escrow contract is irrevocably finalized. Any formal dispute regarding physical goods must be filed within a strict 24-hour window from the documented timestamp of delivery.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 border-t border-gray-200 dark:border-neutral-800 pt-6">
                  <Clock className="w-6 h-6 text-secondary flex-shrink-0" />
                  <div>
                    <strong className="text-gray-950 dark:text-white">Service Provider 72-Hour Buffering Standard:</strong>
                    <p className="mt-1 leading-relaxed">
                      Upon a Service Provider marking a project milestone or order as "Delivered," the customer has exactly 72 hours to verify parameters or lodge a formal in-platform dispute. If the customer remains non-responsive with no active dispute filed after 48 hours, the provider may submit a Request for Administrative Release. Following an additional 24-hour response window, administrators reserve the authority to manually execute the escrow settlement.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 border-t border-gray-200 dark:border-neutral-800 pt-6">
                  <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-950 dark:text-white">Wallet Holding and Capacity Constraints:</strong>
                    <p className="mt-1 leading-relaxed">
                      Users assume full and sole legal responsibility for ensuring and maintaining operational financial capacity within their connected mobile money wallets to facilitate seamless payouts. HudumaLink Kenya explicitly disclaims liability for transaction rejections, delays, or failures arising from mobile network capacity limits (specifically including payment provider capacity limits or consumer holding balance thresholds). A minimum withdrawal limit of KES 100 is contractually enforced. While the platform charges KES 0 platform fees on M-Pesa withdrawals, Safaricom's official dynamic B2C tariff brackets (ranging from KES 1 to KES 30 depending on the principal amount) apply to all mobile money payouts.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">4</div>
              Platform Neutrality and Liability Isolation
            </h2>
            <div className="bg-gray-50 dark:bg-neutral-900 p-10 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800">
              <p className="text-gray-650 dark:text-gray-300 text-sm leading-relaxed">
                HudumaLink Kenya operates strictly as a centralized, trust-driven digital intermediary connecting users. We do not direct, hire, manage, or employ service providers, nor do we control physical inventories or delivery metrics. Users agree that operators disclaim all liability for contractor performance, product defaults, injury, or damage occurring during physical fulfillment.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-4">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">5</div>
              Dispute Resolution and Admissible Evidence
            </h2>
            <div className="p-10 bg-neutral-50 dark:bg-neutral-900 rounded-[2.5rem] border border-gray-200 dark:border-neutral-800 shadow-sm space-y-6">
              <div className="space-y-4 text-sm text-gray-650 dark:text-gray-300 leading-relaxed">
                <p>
                  <strong className="text-gray-950 dark:text-white block mb-1">Internal Data Supremacy Protocol:</strong>
                  Arbitration, mediation, and final settlement determinations shall be adjudicated exclusively based on untampered, native system data captured within the platform portal. This includes internal chat logs, official platform timestamps, and files uploaded directly to the platform interface.
                </p>
                <p>
                  <strong className="text-gray-950 dark:text-white block mb-1">External Data Exclusion:</strong>
                  External digital artifacts—including but not limited to screenshots of WhatsApp conversations, external SMS logs, call recordings, or third-party communication links—are strictly inadmissible in dispute evaluations and shall be completely discarded to preserve systemic and evidentiary integrity.
                </p>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-neutral-800 rounded-2xl text-center italic font-bold text-gray-900 dark:text-white">
                "Fairness and systemic integrity are adjudicated exclusively on internal, verifiable portal records."
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="p-8 bg-neutral-900 text-white rounded-[2.5rem] shadow-xl">
            <Scale className="w-12 h-12 text-primary mb-6" />
            <h3 className="text-2xl font-bold mb-4">Governing Law</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              These Terms of Service are constructed and governed strictly in accordance with the statutory laws of the Republic of Kenya. All parties contractually submit to the exclusive jurisdiction of Kenyan courts.
            </p>
          </div>

          <div className="p-8 bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Refund Policy</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Refunds are issued exclusively via the secure escrow platform following formal administrative arbitration. Completed and authorized transactions are legally final and non-refundable.
            </p>
          </div>

          <div className="p-8 bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Intellectual Property Restrictions</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              All platform source code, structural designs, text, brand marks, and layout mechanisms are the exclusive intellectual property of the platform operators, protected under Kenyan copyright and trademark statutes.
            </p>
          </div>

          <div className="p-8 bg-primary text-white rounded-3xl shadow-xl shadow-primary/20">
            <h3 className="font-bold mb-4">Amendments</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              The platform operators reserve the absolute corporate right to amend these Terms at any interval. Continued access or usage of platform services signifies contractual consent to the amended terms.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const Privacy = () => (
  <div className="bg-white dark:bg-neutral-950 transition-colors">
    {/* Hero Section */}
    <div className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10 -skew-y-6 origin-top-left transform scale-110"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl text-primary mb-8"
        >
          <Lock className="w-10 h-10" />
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
          Privacy <span className="text-primary">Policy</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
          At HudumaLink, your privacy is important to us. We protect your information as if it were our own.
        </p>
        <p className="mt-4 text-sm font-bold text-gray-400 uppercase tracking-widest">Last Updated: June 17, 2026</p>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        <div className="space-y-12">
          <section>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Shield className="w-5 h-5" />
              </div>
              ODPC Kenya Compliance
            </h2>
            <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[2.5rem] border border-gray-200 dark:border-neutral-800 shadow-sm">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6 font-medium">
                HudumaLink is committed to protecting your personal data in accordance with the <strong>Data Protection Act (2019) of Kenya</strong>.
              </p>
              <div className="space-y-4">
                <div className="p-4 bg-gray-100/50 dark:bg-neutral-800 rounded-2xl">
                  <span className="font-bold text-gray-950 dark:text-white block mb-1">KYC Data Retention</span>
                  <p className="text-xs text-gray-700 dark:text-gray-300">Identity documents (National ID, Passport) are retained securely for the duration of account activity plus 7 years as per financial regulations. All identity data is encrypted at rest.</p>
                </div>
                <div className="p-4 bg-gray-100/50 dark:bg-neutral-800 rounded-2xl">
                  <span className="font-bold text-gray-950 dark:text-white block mb-1">Purpose Limitation</span>
                  <p className="text-xs text-gray-700 dark:text-gray-300">KYC information is collected solely for the purpose of identity verification, fraud prevention, and maintaining a high-trust marketplace for all Kenyans.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-4">
              <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">1</div>
              Information We Collect
            </h2>
            <div className="space-y-4">
              {[
                { label: "Personal Information", val: "Full name, email address, phone number, and National ID (for verification)." },
                { label: "Account & Usage", val: "Login activity, listings, transactions, and platform interactions." },
                { label: "Payment Info", val: "Transaction reference details, escrow balances, and payment disbursement outcomes processed securely by our designated third-party payment system." }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-6 bg-neutral-50 dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 font-sans">
                  <div className="w-3 h-3 rounded-full bg-secondary flex-shrink-0"></div>
                  <div>
                    <span className="font-bold text-gray-950 dark:text-white block mb-1">{item.label}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{item.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">2</div>
              How We Use It
            </h2>
            <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[2.5rem] border border-gray-200 dark:border-neutral-800 shadow-sm">
              <ul className="space-y-4 text-gray-700 dark:text-gray-300">
                {[
                  "Managing your account and facilitating transactions.",
                  "Verifying identity (KYC for sellers) and preventing fraud.",
                  "Improving platform performance and user experience.",
                  "Communicating important updates and support responses."
                ].map((text, i) => (
                  <li key={i} className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-4">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">3</div>
              How We Protect It
            </h2>
            <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[2.5rem] border border-gray-200 dark:border-neutral-800 shadow-sm">
              <p className="text-gray-750 dark:text-gray-300 leading-relaxed mb-6">
                We implement secure servers, encrypted connections, and restricted access to sensitive information. We actively monitor for suspicious activity to keep your data safe.
              </p>
              <div className="p-4 bg-gray-100/50 dark:bg-neutral-800 rounded-2xl flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium text-gray-950 dark:text-white font-sans">Industry-standard encryption protocols</span>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-12">
          <div className="p-10 bg-neutral-900 text-white rounded-[3rem] relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px]"></div>
            <Globe className="w-12 h-12 text-primary mb-8" />
            <h3 className="text-2xl font-bold mb-4">Sharing of Information</h3>
            <p className="text-gray-400 leading-relaxed mb-8">
              We do NOT sell your personal data. We share information only when necessary for transaction processing, with our verified third-party payment system, or as required by governing statutes or regulatory bodies of Kenya.
            </p>
          </div>

          <section>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-4">
              <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">4</div>
              Your Rights
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: "Access & Edit", desc: "View and update your personal info in settings." },
                { title: "Data Erasure & Account Deletion", desc: "You have the right to request account deletion or termination at any time directly through your Profile page. Upon requesting, all of your personal details, listings, files, and authentication records will be completely and permanently removed from HudumaLink servers and databases." }
              ].map((item, i) => (
                <div key={i} className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-sm">
                  <h4 className="font-bold text-gray-950 dark:text-white mb-3">{item.title}</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-350 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">5</div>
              Cookies & Retention
            </h2>
            <div className="space-y-6">
              <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-sm">
                <h4 className="font-bold text-gray-950 dark:text-white mb-3">Cookies & Tracking</h4>
                <p className="text-sm text-gray-700 dark:text-gray-350 leading-relaxed">We use strictly necessary session identifiers to manage authenticated states and safeguard active financial transactions.</p>
              </div>
              <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-sm">
                <h4 className="font-bold text-gray-950 dark:text-white mb-3">Data Retention</h4>
                <p className="text-sm text-gray-700 dark:text-gray-350 leading-relaxed">We retain information only as long as necessary for services, legal obligations, or dispute resolution.</p>
              </div>
            </div>
          </section>

          <div className="p-10 bg-primary text-white rounded-[3rem] shadow-xl shadow-primary/20">
            <h3 className="text-2xl font-bold mb-4">Contact Us</h3>
            <p className="text-white/80 mb-6">Questions about your privacy? Reach out to our dedicated team.</p>
            <a href="mailto:support@hudumalink.co.ke" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-xl font-bold hover:bg-opacity-90 transition-all">
              <Mail className="w-5 h-5" /> support@hudumalink.co.ke
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const Safety = () => (
  <div className="bg-white dark:bg-neutral-950 transition-colors">
    {/* Hero Section */}
    <div className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-green-500/5 dark:bg-green-500/10 -skew-y-6 origin-top-left transform scale-110"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-3xl text-green-500 mb-8"
        >
          <ShieldCheck className="w-10 h-10" />
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
          Safety <span className="text-green-500">Center</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Operational safety frameworks and transaction security protocols for consumer protection, physical inspections, and credential defense.
        </p>
        <p className="mt-4 text-sm font-bold text-gray-400 uppercase tracking-widest">Last Updated: June 17, 2026</p>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-16">
          <section>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">1</div>
              Core Safety and Communication Protocols
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[2.5rem] border border-gray-200 dark:border-neutral-800 shadow-sm font-sans">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-950 dark:text-white mb-4">In-Portal Communications</h3>
                <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-350">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Route all communications exclusively within HudumaLink chat modules.</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Avoid transitioning to external chat channels (including WhatsApp).</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Never pay contractors or vendors outside the platform interface.</span>
                  </li>
                </ul>
                <p className="mt-6 text-xs font-bold text-primary italic">This protocol ensures you are protected by the platform's regulatory safeguards.</p>
              </div>

              <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[2.5rem] border border-gray-200 dark:border-neutral-800 shadow-sm font-sans">
                <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary mb-6">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-955 dark:text-white mb-4">Secure Payment Execution</h3>
                <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-350">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Ensure all payment actions are performed within the native, secure escrow gateway.</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Never wire funds directly to provider or vendor mobile money accounts.</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Refuse high upfront payments prior to official system project initiation.</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-4">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">2</div>
              Verification and User Role Mandates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-neutral-50 dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-sm">
                <UserCheck className="w-8 h-8 text-accent mb-4" />
                <h4 className="font-bold text-gray-950 dark:text-white mb-2">Perform Diligent Reviews</h4>
                <p className="text-xs text-gray-700 dark:text-gray-350 leading-relaxed font-sans">Check verified badges, historical reviews, and user ratings to safeguard interactions.</p>
              </div>
              <div className="p-6 bg-neutral-50 dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-sm">
                <ShoppingBag className="w-8 h-8 text-accent mb-4" />
                <h4 className="font-bold text-gray-955 dark:text-white mb-2">Consumer Inspection Mandate</h4>
                <p className="text-xs text-gray-700 dark:text-gray-350 leading-relaxed font-sans">
                  Upon fulfillment of physical inventory, consumers are contractually mandated to inspect products at delivery BEFORE confirming acceptance. After confirmation, transactions are legally finalized, and funds cannot be recovered.
                </p>
              </div>
              <div className="p-6 bg-neutral-50 dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-sm">
                <Briefcase className="w-8 h-8 text-accent mb-4" />
                <h4 className="font-bold text-gray-955 dark:text-white mb-2">Vendor Compliance</h4>
                <p className="text-xs text-gray-700 dark:text-gray-350 leading-relaxed font-sans">Provide absolute, truthful listings. Perform services and goods deliveries exactly as described under penalty of restriction.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-4">
              <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">3</div>
              Evidentiary Records and Documentation
            </h2>
            <div className="p-10 bg-secondary/5 dark:bg-secondary/10 rounded-[2.5rem] border border-secondary/10">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center text-secondary flex-shrink-0">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Preserve Native Records</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    Always maintain transaction confirmations, service specifications, and conversations inside the platform portal. To resolve disputes successfully, remember that external screenshots and recordings are completely inadmissible during arbitration.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <div className="p-8 bg-red-500 text-white rounded-[2.5rem] shadow-xl shadow-red-500/20">
            <AlertTriangle className="w-12 h-12 mb-6" />
            <h3 className="text-2xl font-bold mb-4">Systemic Risk Indicators</h3>
            <p className="text-white/80 mb-6 text-sm">Exercise extreme caution if any user:</p>
            <ul className="space-y-4 text-sm">
              {[
                "Demands rushed off-portal pre-payments or deposits",
                "Refuses to use our designated third-party payment system",
                "Provides inconsistent credentials or fake identities",
                "Requests unusual payment methods or off-platform direct wires"
              ].map((flag, i) => (
                <li key={i} className="flex gap-3">
                  <div className="w-1.5 h-1.5 bg-white rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-8 bg-red-650 text-white dark:bg-red-950/40 rounded-[2.5rem] shadow-xl border border-red-500/20">
            <ShieldAlert className="w-12 h-12 mb-6 text-red-500" />
            <h3 className="text-xl font-bold mb-3">Authentication and Credential Integrity</h3>
            <p className="text-xs text-gray-200 dark:text-gray-300 leading-relaxed font-semibold">
              HudumaLink Kenya administrators and support representatives will never ask you for account passwords, security tokens, or mobile money PINs. Any attempt to solicit credentials constitutes fraud; please report such actions to support immediately.
            </p>
          </div>

          <div className="p-8 bg-neutral-900 text-white rounded-[2.5rem] shadow-xl">
            <ShieldAlert className="w-12 h-12 text-primary mb-6" />
            <h3 className="text-2xl font-bold mb-4">Report Activity</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              If you experience suspicious activity, immediately flag the respective user and suspend active transaction negotiations.
            </p>
            <a href="mailto:support@hudumalink.co.ke" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
              <Mail className="w-5 h-5" /> support@hudumalink.co.ke
            </a>
          </div>

          <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-sm font-sans">
            <h3 className="font-bold text-gray-955 dark:text-white mb-4 flex items-center gap-2">
              <Handshake className="w-5 h-5 text-green-500" />
              Our Commitment
            </h3>
            <p className="text-xs text-gray-700 dark:text-gray-350 leading-relaxed">
              HudumaLink is committed to protecting users through secure systems, providing fair dispute resolution, and continuously improving safety measures.
            </p>
            <div className="mt-6 p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl text-center font-bold text-xs text-gray-900 dark:text-white uppercase tracking-widest">
              Security. Integrity. Compliance.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const FAQ = () => {
  const faqs = [
    {
      category: "General",
      questions: [
        { q: "What is HudumaLink?", a: "HudumaLink is a digital marketplace designed to connect authorized skilled service providers and sellers with consumers across Kenya in a safe and trusted environment." },
        { q: "Is HudumaLink free to use?", a: "Account creation and catalog exploration are completely free. We charge a reasonable service fee on completed contracts in order to offset escrow administrative overhead and maintain transactional integrity." },
        { q: "Which areas do you cover?", a: "We are designed to serve all 47 counties in Kenya, from major cities like Nairobi and Mombasa to rural areas." }
      ]
    },
    {
      category: "Safety & Payments",
      questions: [
        { q: "How does the escrow system work?", a: "Whenever a contract is initiated, funds are securely sequestered in our automated third-party custody system. Payout release is conditional upon client acceptance, or following administrative adjudication in the event of an active dispute." },
        { q: "What should I do if I experience transactional risk?", a: "If you utilize our integrated third-party escrow system, your funds are fully protected. You can easily initiate a formal dispute within your dashboard, and our mediation division will adjudicate. Never wire funds directly to vendors outside our system." },
        { q: "Can I transact using mobile money?", a: "Yes. Our third-party integrations facilitate secure payment processing via Kenya's standard mobile money systems for both contract escrowing and merchant settlements." }
      ]
    },
    {
      category: "For Providers and Sellers",
      questions: [
        { q: "How do I become a verified merchant?", a: "You need to complete the KYC identity verification process by providing a valid national ID and submitting requested regulatory documentation in account settings." },
        { q: "How do I receive payouts?", a: "Upon delivery confirmation and escrow finalization, funds are deposited directly to your platform wallet balance. You can then request automated withdrawal distributions directly to your verified mobile money number." }
      ]
    }
  ];

  return (
    <div className="bg-white dark:bg-neutral-950 transition-colors min-h-screen">
      {/* Hero Section */}
      <div className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10 -skew-y-6 origin-top-left transform scale-110"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl text-primary mb-8"
          >
            <HelpCircle className="w-10 h-10" />
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
            Frequently Asked <span className="text-primary">Questions</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about HudumaLink. Can't find the answer? Contact our support team.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="space-y-16">
          {faqs.map((group, i) => (
            <div key={i}>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-8 border-l-4 border-primary pl-4">
                {group.category}
              </h2>
              <div className="space-y-4">
                {group.questions.map((faq, j) => (
                  <details key={j} className="group bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden transition-all shadow-sm">
                    <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                      <span className="font-bold text-gray-950 dark:text-white pr-4 font-sans">{faq.q}</span>
                      <ChevronDown className="w-5 h-5 text-gray-550 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-6 pb-6 text-gray-700 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-neutral-800 pt-4 font-sans text-sm">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 p-10 bg-neutral-900 text-white rounded-[3rem] text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px]"></div>
          <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Our support team is ready to assist you with any specific issues or inquiries.
          </p>
          <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-bold hover:bg-opacity-90 transition-all">
            <MessageSquare className="w-5 h-5" /> Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export const Contact = () => {
  const [formData, setFormData] = React.useState({ name: '', email: '', subject: 'General Inquiry', message: '' });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [ticketId, setTicketId] = React.useState<string | null>(null);
  const [activeFaq, setActiveFaq] = React.useState<number | null>(null);

  const subjects = [
    { id: 'General Inquiry', label: 'General', emoji: '💡', desc: 'Partnerships & general questions' },
    { id: 'Technical Support', label: 'Technical', emoji: '⚙️', desc: 'Bugs, account or app issues' },
    { id: 'Payment Issue', label: 'Payments', emoji: '💳', desc: 'M-Pesa deposits & escrow holds' },
    { id: 'Report a User', label: 'Report', emoji: '🛡️', desc: 'Fraud, scams or listing issues' },
    { id: 'Partnership', label: 'Partnership', emoji: '🤝', desc: 'Business & strategic alliances' }
  ];

  const faqs = [
    {
      q: "How does the HudumaLink Escrow protection work?",
      a: "When you purchase an item or hire a professional, your payment is placed in a secure ledger. Funds are only transferred to the seller once you verify delivery or completed milestones, or upon an admin audit if a dispute is resolved."
    },
    {
      q: "What is the average response time of the support team?",
      a: "Our team answers queries within 2 hours during normal business hours (8 AM - 6 PM). For premium sellers and high-priority payment tickets, response times are often under 30 minutes."
    },
    {
      q: "How do I file a dispute if a service is not delivered?",
      a: "Go to your active transaction details panel, click on 'File Dispute', and upload proof of communication or incomplete execution. Our administrative legal team will arbitrate and decide on the override within 48 hours."
    },
    {
      q: "Can I directly speak or chat with an agent on WhatsApp?",
      a: "Yes! Click our official WhatsApp support channel button to start an instant live chat with an active HudumaLink customer care representative on 0112389628."
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, 'support_tickets'), {
        ...formData,
        status: 'open',
        createdAt: new Date().toISOString(),
        userId: auth.currentUser?.uid || 'anonymous'
      });
      
      const generatedId = `HLK-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      setTicketId(generatedId);
      toast.success('Support ticket logged successfully!');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, 'support_tickets');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' });
    setTicketId(null);
  };

  return (
    <div className="bg-gray-50 dark:bg-neutral-950 transition-colors min-h-screen">
      {/* Immersive Modern Hero with Light/Dark Background accents */}
      <div className="relative py-20 overflow-hidden bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/3 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center justify-center p-3 bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-3xl mb-6 shadow-xs border border-emerald-500/20"
          >
            <MessageSquare className="w-8 h-8" />
          </motion.div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight leading-none">
            Get in <span className="text-emerald-600 dark:text-emerald-400">Touch</span> 💬
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed font-medium">
            Need payment help, technical troubleshooting, or escrow arbitration? Our dedicated Support Team is here 24/7 to guarantee your peace of mind.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:items-start">
          
          {/* LEFT COLUMN: Interactive Ticketing Form (takes 7 cols on large screens) */}
          <div className="lg:col-span-7">
            {ticketId ? (
              /* Success receipt page with dynamic receipt view */
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-neutral-900 p-8 sm:p-10 rounded-3xl border border-emerald-500/30 dark:border-emerald-500/20 shadow-md text-center space-y-6 relative overflow-hidden"
              >
                <div className="absolute top-0 inset-x-0 h-1.5 bg-emerald-500"></div>
                <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto border border-emerald-500/30">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">Ticket Logged</span>
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-4">We are on it!</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
                    Your help ticket has been successfully compiled into the secure registry. An agent has been scheduled to resolve your query.
                  </p>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-neutral-950 rounded-2xl border border-gray-100 dark:border-neutral-800 text-left space-y-3.5 max-w-md mx-auto">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 uppercase tracking-wider font-extrabold">Reference ID:</span>
                    <span className="font-mono font-black text-gray-900 dark:text-white bg-white dark:bg-neutral-900 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-neutral-800 shadow-xs">{ticketId}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-gray-100 dark:border-neutral-800 pt-3">
                    <span className="text-gray-400 uppercase tracking-wider font-extrabold">Category topic:</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{formData.subject}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-gray-100 dark:border-neutral-800 pt-3">
                    <span className="text-gray-400 uppercase tracking-wider font-extrabold">Priority state:</span>
                    <span className="text-amber-600 dark:text-amber-500 font-extrabold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 animate-spin" /> High Support Queue
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs"
                  >
                    Submit Another Ticket
                  </button>
                  <Link
                    to="/"
                    className="px-6 py-3 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                  >
                    Return to Home
                  </Link>
                </div>
              </motion.div>
            ) : (
              /* High-fidelity modern contact form card */
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-neutral-900 p-6 sm:p-10 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-sm space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white uppercase">Send a secure inquiry</h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Fill out the official registry form below, and our dispatch desk will route your request.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Two column grid inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-neutral-400 mb-2">Full Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm text-gray-900 dark:text-white font-medium"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-neutral-400 mb-2">Email Address</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm text-gray-900 dark:text-white font-medium"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  {/* Interactive topic grid selectors */}
                  <div className="space-y-2.5">
                    <label className="block text-[11px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-neutral-400">Choose Inquiry Topic</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                      {subjects.map((subj) => (
                        <button
                          key={subj.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, subject: subj.id })}
                          className={cn(
                            "p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-20 shadow-xs",
                            formData.subject === subj.id
                              ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400"
                              : "bg-gray-50 dark:bg-neutral-950 border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-neutral-400 hover:border-gray-300 dark:hover:border-neutral-700"
                          )}
                        >
                          <span className="text-xl">{subj.emoji}</span>
                          <span className="text-[10px] font-black uppercase tracking-tight block leading-none truncate w-full">{subj.label}</span>
                          {formData.subject === subj.id && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500"></span>
                          )}
                        </button>
                      ))}
                    </div>
                    {/* Tiny desc block of selected subject */}
                    <div className="bg-gray-50 dark:bg-neutral-950/40 border border-gray-100 dark:border-neutral-800/40 p-3 rounded-xl">
                      <p className="text-[10px] text-gray-400 dark:text-neutral-500 font-bold uppercase tracking-wider">Topic Focus:</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 font-medium mt-0.5">
                        {subjects.find(s => s.id === formData.subject)?.desc || 'Please select a topic'}
                      </p>
                    </div>
                  </div>

                  {/* Description message box */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-neutral-400 mb-2">Message details</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm text-gray-900 dark:text-white resize-none font-medium"
                      placeholder="Be as detailed as possible to help our team solve your issue..."
                    ></textarea>
                  </div>

                  {/* Submit support request */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-xl font-extrabold text-xs uppercase tracking-widest transition-all shadow-md hover:scale-[1.01] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        Logging Ticket Securely...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Secure Ticket
                      </>
                    )}
                  </button>
                </form>

                {/* Secure Trust Disclaimer */}
                <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                    <strong className="text-gray-800 dark:text-slate-300">Protected Communications Ledger:</strong> Every inquiry is secured on our database. We respect consumer confidentiality and never share ticket files or details outside administrative legal resolution bounds.
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* RIGHT COLUMN: Contact Info Bento & Self-service FAQs (takes 5 cols on large screens) */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Quick Contact Bento Channels */}
            <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-gray-900 dark:text-white">Active Channels</h3>
                <p className="text-xs text-gray-400 dark:text-neutral-500 mt-0.5">Reach out to us directly on fast-track priority channels.</p>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                {[
                  {
                    icon: (
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12.004 0C5.372 0 0 5.372 0 12.004c0 2.116.549 4.11 1.612 5.855L.05 24l6.302-1.654a11.97 11.97 0 005.652 1.41h.005c6.629 0 12.001-5.372 12.001-12.004C24.01 5.372 18.636 0 12.004 0zm6.986 16.92c-.287.808-1.42 1.492-2.193 1.583-.726.084-1.658.127-2.68-.198-1.023-.325-2.028-.868-2.914-1.496a15.828 15.828 0 01-3.69-3.692C6.91 12.222 6.38 11.196 6.07 10.155c-.31-.1-.314-.085-.314-.085-.357-1.157.34-1.928.895-2.484l.654-.654c.154-.154.346-.226.544-.226.2 0 .393.072.544.226l1.35 1.35c.154.154.226.346.226.544 0 .2-.072.392-.226.544l-.454.454c-.112.112-.132.278-.052.41a6.602 6.602 0 001.378 1.83 6.577 6.577 0 001.83 1.378c.133.08.3.06.411-.052l.455-.455c.153-.153.345-.226.544-.226s.39.073.543.226l1.35 1.35c.154.154.226.346.226.544 0 .198-.073.39-.227.544l-.35.35c-.092.1-.219.145-.347.118z"/>
                      </svg>
                    ),
                    title: "WhatsApp Chat Support",
                    val: "0112389628",
                    href: "https://wa.me/254112389628?text=Hello%20HudumaLink%20Support,%20I'm%20contacting%20you%20from%20the%20platform%20for%20assistance.",
                    badge: "⚡ Instant 24/7",
                    badgeColor: "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
                  },
                  {
                    icon: <Mail className="w-5 h-5" />,
                    title: "Email Dispatch Office",
                    val: "support@hudumalink.co.ke",
                    href: "mailto:support@hudumalink.co.ke",
                    badge: "⏱️ Under 2h Response",
                    badgeColor: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
                  },
                  {
                    icon: <Phone className="w-5 h-5" />,
                    title: "Call Helpline Desk",
                    val: "0112389628",
                    href: "tel:254112389628",
                    badge: "📞 8am - 6pm (Mon-Fri)",
                    badgeColor: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-500"
                  }
                ].map((item, index) => (
                  <a
                    key={index}
                    href={item.href}
                    target={item.href.startsWith('mailto:') || item.href.startsWith('tel:') ? undefined : "_blank"}
                    rel={item.href.startsWith('mailto:') || item.href.startsWith('tel:') ? undefined : "noopener noreferrer"}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-neutral-950 border border-gray-100 dark:border-neutral-800/80 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all group shadow-xs hover:shadow-xs"
                  >
                    <div className="w-11 h-11 bg-white dark:bg-neutral-900 rounded-xl flex items-center justify-center border border-gray-200 dark:border-neutral-800 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-all">
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-grow">
                      <span className={cn("text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border inline-block", item.badgeColor)}>
                        {item.badge}
                      </span>
                      <h4 className="font-bold text-xs text-gray-400 dark:text-neutral-500 mt-1 leading-none">{item.title}</h4>
                      <p className="font-extrabold text-sm text-gray-900 dark:text-white mt-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-none truncate">{item.val}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 dark:text-neutral-700 shrink-0 group-hover:translate-x-1 transition-all" />
                  </a>
                ))}
              </div>
            </div>

            {/* Interactive self-help FAQ Accordions */}
            <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 pb-3">
                <h3 className="text-lg font-black uppercase tracking-tight text-gray-900 dark:text-white">Self-Service Help</h3>
                <Link to="/faq" className="text-xs font-black text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 uppercase tracking-wider">
                  <HelpCircle className="w-3.5 h-3.5" /> All FAQs
                </Link>
              </div>

              <div className="space-y-2.5">
                {faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-100 dark:border-neutral-800 rounded-2xl overflow-hidden bg-gray-50 dark:bg-neutral-950/40 transition-all"
                  >
                    <button
                      onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                      className="w-full p-4 text-left font-bold text-xs text-gray-800 dark:text-slate-200 flex justify-between items-center gap-3"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform duration-300 shrink-0", activeFaq === idx && "transform rotate-180")} />
                    </button>
                    
                    {activeFaq === idx && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="px-4 pb-4 text-xs text-gray-500 dark:text-gray-450 border-t border-gray-100 dark:border-neutral-800 pt-2.5 leading-relaxed"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Vector Styled Map Mockup for Eldoret Head Office */}
            <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-gray-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-4.5 h-4.5 text-emerald-500" /> HQ Dispatch Office
                </h3>
                <p className="text-xs text-gray-400 dark:text-neutral-500 mt-0.5">Eldoret, Kenya (Operations running fully remote)</p>
              </div>

              {/* Styled clean vector abstract map representing local coordinates */}
              <div className="h-28 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-850 rounded-2xl relative overflow-hidden flex items-center justify-center select-none shadow-inner">
                {/* Visual grid background */}
                <div className="absolute inset-0 opacity-15 dark:opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
                
                {/* Map Roads vectors placeholder */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 dark:bg-neutral-800 transform rotate-12" />
                <div className="absolute top-0 bottom-0 left-1/3 w-0.5 bg-gray-200 dark:bg-neutral-800 transform -rotate-12" />
                <div className="absolute top-0 bottom-0 left-2/3 w-0.5 bg-gray-200 dark:bg-neutral-800 transform rotate-45" />

                {/* Blinking Map pin locator */}
                <div className="relative z-10 flex flex-col items-center">
                  <span className="flex h-5 w-5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-white dark:border-neutral-900 shadow-md"></span>
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-white dark:bg-neutral-900 px-2 py-0.5 rounded border border-gray-200 dark:border-neutral-800 shadow-sm mt-1">
                    ELDORET CO-ORDINATES
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export const EscrowPolicy = () => (
  <div className="bg-white dark:bg-neutral-950 transition-colors">
    {/* Hero Section */}
    <div className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10 -skew-y-6 origin-top-left transform scale-110"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl text-primary mb-8"
        >
          <Handshake className="w-10 h-10" />
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
          Escrow, Refund & <span className="text-primary">Dispute Policy</span> 🤝
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
          The legal and technical framework governing consumer deposits, escrow holds, dispute resolutions, and administration on HudumaLink Kenya.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
          <span>Effective Date: June 17, 2026</span>
          <span>•</span>
          <span>Jurisdiction: Eldoret, Kenya</span>
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-16">
          
          <section id="deposit-phase">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary text-lg font-bold">1</div>
              The Safe Deposit Phase
            </h2>
            <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[2rem] border border-gray-200 dark:border-neutral-800 space-y-4">
              <p className="text-gray-750 dark:text-gray-300 leading-relaxed text-base font-sans">
                When a buyer initiates a purchase or hires a service provider, payment is collected via a secure digital payment portal. 
                Upon a successful billing operation, the funds enter the neutral, secure <strong>HudumaLink Escrow Ledger</strong>.
              </p>
              <div className="p-6 bg-transparent rounded-2xl border border-gray-300 dark:border-neutral-800 flex gap-4 items-start shadow-sm">
                <ShieldCheck className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <p className="text-sm text-gray-700 dark:text-gray-300 font-sans">
                  <strong className="text-gray-950 dark:text-white block mb-1">Neutral Custodian Rule</strong>
                  These funds are legally locked inside the HudumaLink ledger as custody. Under no circumstances can the seller/provider access, borrow, or draw down on these funds prior to delivery validation, and buyers cannot double-spend or retreat on active contracts.
                </p>
              </div>
            </div>
          </section>

          <section id="auto-release">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary text-lg font-bold">2</div>
              Escrow Release & Non-Unilateral Transfer Policies
            </h2>
            <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[2rem] border border-gray-200 dark:border-neutral-800 space-y-4 font-sans">
              <p className="text-gray-750 dark:text-gray-300 leading-relaxed text-base">
                Once a product is dispatched or a service is completed, the seller or service provider may claim delivery. To ensure absolute compliance, funds are NOT automatically transferred to the provider after 72 hours. Funds can only be released via buyer consent or administrative override.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-amber-500/5 rounded-2xl border border-amber-500/20">
                  <span className="font-bold text-gray-950 dark:text-white block mb-1">Escrow Hold Policy</span>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    The buyer must either click <strong>"Confirm Delivery"</strong> (to release the escrow funds directly to the provider's balance) or click <strong>"File Dispute"</strong> if there are any pending issues.
                  </p>
                </div>
                <div className="p-6 bg-red-500/5 rounded-2xl border border-red-500/20">
                  <span className="font-bold text-gray-955 dark:text-white block mb-1">Administrative Audits</span>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    If the buyer has forgot or sits unresponsive for a lengthy duration, the provider may trigger a payment request. The administrator will audit the transaction milestones and manually release the funds without customer consent if no dispute has been raised.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="immutable-lock">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary text-lg font-bold">3</div>
              The Immutable Contract Lock
            </h2>
            <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[2rem] border border-gray-200 dark:border-neutral-800 space-y-4 font-sans">
              <p className="text-gray-750 dark:text-gray-300 leading-relaxed text-base">
                To eliminate payment defaults, buyer fraud, and bad-faith cancelations, certain statuses create an <strong>immutable contract lock</strong>:
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>Once the seller claims delivery, the buyer is technically barred from unilaterally canceling the order or demanding self-service refunds.</span>
                </li>
                <li className="flex gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>Sellers are bound to deliver exactly what was specified in the marketplace listing or in communications on the platform. Any off-platform modifications violate these terms.</span>
                </li>
              </ul>
            </div>
          </section>

          <section id="disputes">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary text-lg font-bold">4</div>
              Dispute Resolution & Administrative Override
            </h2>
            <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[2rem] border border-gray-200 dark:border-neutral-800 space-y-6 font-sans">
              <p className="text-gray-750 dark:text-gray-300 leading-relaxed text-base">
                If the buyer files a dispute, the funds remain frozen in the escrow locker. Both parties will be prompted to submit valid physical or digital proofs of execution or non-execution (e.g., GPS coordination photos, client chats, service logs, sign-off forms) within <strong>48 hours</strong>.
              </p>
              <div className="p-6 bg-red-500/5 border border-red-500/20 text-red-750 dark:text-red-400 rounded-2xl">
                <span className="font-bold block mb-1 uppercase tracking-wider text-xs flex items-center gap-2">
                  <Scale className="w-4 h-4" /> Legal Administrative Override
                </span>
                <p className="text-xs leading-relaxed mt-1">
                  HudumaLink Kenya acts as a neutral, third-party binding arbiter. Based on the objective evidence presented, HudumaLink reserves the absolute legal right to perform an <strong>administrative override</strong>. This override will either programmatically trigger a payout to the seller or return an escrow refund to the buyer. HudumaLink's final decision is contractually binding.
                </p>
              </div>
            </div>
          </section>

          <section id="fees">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary text-lg font-bold">5</div>
              Non-Refundable Platform and Payment Fees
            </h2>
            <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[2rem] border border-gray-200 dark:border-neutral-800 space-y-4">
              <p className="text-gray-750 dark:text-gray-300 leading-relaxed text-base">
                Third-party processors and automated systems impose transactional and ledger operation fees. 
                Our commission fee structured to power HudumaLink escrow custody is non-refundable.
              </p>
              <ul className="space-y-2 text-sm text-gray-750 dark:text-gray-300 font-sans">
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>The 2% HudumaLink administrative escrow fee is non-refundable upon successful delivery.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-green-550 mt-0.5 flex-shrink-0" />
                  <span>Standard processing rates and transactional fees from our third-party payment gateways are fully borne by the respective contracting users and are consumed instantly upon transit.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Payout withdrawals via M-Pesa incur KES 0 platform transfer fees, with only the dynamic Safaricom B2C corporate payment tariff applied depending on the transfer amount (subject to a contractually enforced KES 100 minimum payout). Bank payouts are subject to a flat platform handling fee of KES 50.</span>
                </li>
              </ul>
            </div>
          </section>

        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="p-8 bg-neutral-900 text-white rounded-[2.5rem] border border-neutral-800 shadow-xl">
            <Scale className="w-12 h-12 text-primary mb-6" />
            <h3 className="text-xl font-bold mb-4">Kenyan Escrow Adherence</h3>
            <p className="text-gray-400 text-xs leading-relaxed mb-6">
              This policy complies with Section 79 of the <strong>Kenya Information and Communications Act (KICA)</strong> and Chapter III of the <strong>Kenyan Contract Act</strong>, forming a valid digital escrow trust.
            </p>
            <div className="p-4 bg-white/5 rounded-2xl text-[10px] text-gray-500 font-mono tracking-wider uppercase">
              HLK-ESCROW-2026-V1
            </div>
          </div>

          <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[2rem] border border-gray-200 dark:border-neutral-800">
            <h4 className="font-bold text-gray-955 dark:text-white mb-2">Need Dispute Help?</h4>
            <p className="text-xs text-gray-750 dark:text-gray-350 leading-relaxed font-sans">
              If an order has gone awry, please immediately notify our specialized support desk with your active Transaction ID.
            </p>
            <Link to="/contact" className="mt-4 text-xs font-bold text-primary hover:underline block">Contact Support desk →</Link>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const Cookies = () => (
  <div className="bg-white dark:bg-neutral-950 transition-colors">
    {/* Hero Section */}
    <div className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10 -skew-y-3 origin-top-left transform scale-105"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl text-primary mb-8"
        >
          <Eye className="w-10 h-10" />
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
          Cookie & <span className="text-primary">Tracking Notice</span> 🍪
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
          How HudumaLink Kenya employs local storage and browser cookies to defend and host secure financial sessions.
        </p>
      </div>
    </div>

    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="bg-gray-50 dark:bg-neutral-900 p-8 md:p-12 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 space-y-10">
        
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" /> Strictly Necessary (Essential) Cookies
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            In compliance with the <strong>Office of the Data Protection Commission (ODPC) of Kenya</strong>, HudumaLink guarantees a highly secure, non-predatory session architecture. 
            We do <strong>not</strong> implement tracking beacons, cross-site promotional cookies, or third-party behavioral scrapers.
          </p>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            We operate strictly necessary, functional cookies and local browser storage identifiers via <strong>Firebase Authentication and Firestore</strong> for the following explicit needs:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="p-6 bg-transparent rounded-2xl border border-gray-300 dark:border-neutral-800">
              <span className="font-bold text-xs text-primary uppercase block mb-1">State Management</span>
              <p className="text-xs text-gray-750 dark:text-gray-300 font-sans">
                To securely persist credentials, enabling buyers and providers to browse, list products, or chat with contractors without repeatedly re-authenticating, protecting workflow continuity.
              </p>
            </div>
            <div className="p-6 bg-transparent rounded-2xl border border-gray-300 dark:border-neutral-800">
              <span className="font-bold text-xs text-primary uppercase block mb-1">CSRF & Security Defender</span>
              <p className="text-xs text-gray-750 dark:text-gray-300 font-sans">
                To protect local operations against Cross-Site Request Forgery (CSRF) and validation manipulation attacks, preventing bad-faith hijackers from injecting malicious payments into live sessions.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t border-gray-200 dark:border-neutral-800 pt-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-primary" /> Explicit User Consent
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            By utilizing the HudumaLink Kenya portal, you acknowledge, understand, and contractually consent to these highly secure, non-tracking functional technical configurations needed to host your financial transactions safely.
          </p>
          <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex gap-3 items-center">
            <Info className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-xs font-bold text-primary">
              These files are critical for payment safety and cannot be opted out of if you wish to list or transact on HudumaLink.
            </p>
          </div>
        </section>

      </div>
    </div>
  </div>
);
