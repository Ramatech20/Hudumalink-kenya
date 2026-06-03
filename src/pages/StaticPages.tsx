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
  History, Lightbulb, TrendingUp, Flag, Layout, Building2, Shield, UserCheck, Briefcase
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
            Empowering Kenya’s <span className="text-primary">Digital Economy</span> 🇰🇪
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl mx-auto">
            HudumaLink is more than just a marketplace — it is a growing digital ecosystem designed to connect skilled service providers, sellers, and everyday Kenyans in a safe, structured, and trustworthy environment.
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
                "Discover trusted service providers and sellers",
                "Book services or purchase products بسهولة (with ease)",
                "Use secure payment systems (including M-Pesa integration)",
                "Benefit from structured transactions and accountability",
                "Access a growing digital marketplace"
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
            desc: "HudumaLink is built for Kenya — integrating local payment systems like M-Pesa and reflecting real market needs and behaviors.", 
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
          Terms of <span className="text-secondary">Service</span> ⚖️
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
          The legal framework that keeps HudumaLink safe, fair, and trustworthy for everyone.
        </p>
        <p className="mt-4 text-sm font-bold text-gray-400 uppercase tracking-widest">Last Updated: May 2026</p>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-16">
          <section>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">1</div>
              Account, Eligibility & Role Rules
            </h2>
            <div className="bg-gray-50 dark:bg-neutral-900 p-10 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                To use HudumaLink, you must be at least 18 years old and possess a valid Kenyan National ID. Accounts are classified under strictly governed roles to maintain platform integrity, safety, and transparency:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                {[
                  "Accurate registration info",
                  "Account security responsibility",
                  "Mandatory KYC for sellers",
                  "Compliance with Kenyan laws"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-200 dark:border-neutral-800 pt-6 space-y-4">
                <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">Role-Based Posting Restraints</h3>
                <div className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                  <p>
                    <strong>Sellers (Goods Only):</strong> Users signed up under the "Seller" role are strictly permitted to post physical goods/products. Listing professional services, digital hours, or manual construction labor under a Seller account is strictly prohibited.
                  </p>
                  <p>
                    <strong>Service Providers (Goods & Services):</strong> Licensed manual workers, specialists, and freelancers signed up under the "Service Provider" role possess dual-tier authority to list both services (consultancy, installations, manual labour) and relevant physical products/consumables.
                  </p>
                  <p>
                    <strong>Customers/Buyers (No Posting Allowed):</strong> Users registered as Customers/Buyers do not have permission to publish listings of any standard on our platform. They enjoy complete access to search, escrow booking, messaging, and transaction flows.
                  </p>
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
                { title: "No Fraud", desc: "Misrepresentation of products, services, or identity is strictly prohibited." },
                { title: "No Illegal Goods", desc: "Listing prohibited items like drugs or stolen property will lead to immediate termination." },
                { title: "No Spam", desc: "Unsolicited messages, harassment, or bulk advertising is not allowed." },
                { title: "No Bypassing", desc: "Attempting to circumvent our payment or security systems is a violation." }
              ].map((item, i) => (
                <div key={i} className="p-8 bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                ⚠️ Violations may result in immediate suspension or permanent account termination without prior notice.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-4">
              <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">3</div>
              Payments & Escrow
            </h2>
            <div className="p-10 bg-secondary/5 dark:bg-secondary/10 rounded-[2.5rem] border border-secondary/10">
              <div className="space-y-6 text-gray-600 dark:text-gray-300">
                <div className="flex gap-4">
                  <ShieldCheck className="w-6 h-6 text-secondary flex-shrink-0" />
                  <p><strong>Escrow Protection:</strong> Payments are held securely until agreed conditions are met and delivery is confirmed.</p>
                </div>
                <div className="flex gap-4">
                  <Zap className="w-6 h-6 text-secondary flex-shrink-0" />
                  <p><strong>Service Fees:</strong> Fees are clearly displayed before payment and are non-refundable once successfully completed.</p>
                </div>
                <div className="flex gap-4 border-t border-secondary/10 pt-6">
                  <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
                  <p><strong>M-Pesa Limits & Wallets:</strong> Users are strictly responsible for ensuring their personal M-Pesa wallets have sufficient capacity to receive B2C payouts. HudumaLink is not liable for delayed payloads or API execution rejections caused by Safaricom consumer account holding limits (maximum account holding balance of KSh 500,000).</p>
                </div>
                <div className="flex gap-4 border-t border-secondary/10 pt-6">
                  <ShoppingBag className="w-6 h-6 text-secondary flex-shrink-0" />
                  <p><strong>Physical Inspection Mandate:</strong> For physical products, buyers are legally required to thoroughly inspect the item at the point of delivery BEFORE clicking "Confirm Delivery". Once a user clicks "Confirm", the escrow contract is legally finalized, funds are released immediately via our automated pipeline, and HudumaLink cannot recover or refund those funds.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">4</div>
              Platform Role
            </h2>
            <div className="bg-gray-50 dark:bg-neutral-900 p-10 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                HudumaLink acts solely as a <strong>digital marketplace platform</strong> connecting buyers and sellers. We do NOT directly provide services or sell products. Sellers are fully responsible for their offerings, and buyers are responsible for making informed decisions.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-4">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">5</div>
              Dispute Resolution & Admissible Evidence
            </h2>
            <div className="p-10 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 shadow-sm space-y-6">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                HudumaLink acts as a neutral mediator. Decisions are made based on fairness, available evidence, and platform policies. Funds may be held until a resolution is reached.
              </p>
              <div className="p-6 bg-amber-550/5 rounded-2xl border border-amber-500/10 text-xs text-amber-700 dark:text-amber-400 space-y-2">
                <span className="font-bold block text-sm text-gray-900 dark:text-white">Strict Definition of Admissible Evidence:</span>
                <p>
                  To prevent fraud and fabricated screenshots, <strong>only communications, chat histories, and files uploaded directly within the HudumaLink platform portal</strong>, official system timestamps, and native file submissions are admissible as evidence in a dispute resolution. Screenshots of WhatsApp chats, external SMS logs, or off-platform communication links are completely inadmissible and will be discarded to ensure system integrity.
                </p>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-neutral-800 rounded-2xl text-center italic font-bold text-gray-900 dark:text-white">
                "Fairness is the core of our community — backed by untampered internal session records."
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
              These Terms are governed by the laws of Kenya. Any disputes shall be resolved within Kenyan jurisdiction.
            </p>
            <div className="p-4 bg-white/5 rounded-2xl text-xs text-gray-500 italic">
              "HudumaLink — Building trust in every transaction."
            </div>
          </div>

          <div className="p-8 bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Refund Policy</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Refunds are only issued through the escrow system after a valid dispute. Completed and confirmed payments are final.
            </p>
          </div>

          <div className="p-8 bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Intellectual Property</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              All branding, logos, and design are the property of HudumaLink and may not be reproduced without permission.
            </p>
          </div>

          <div className="p-8 bg-primary text-white rounded-3xl shadow-xl shadow-primary/20">
            <h3 className="font-bold mb-4">Changes to Terms</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              We may update these Terms at any time. Continued use of the platform constitutes acceptance of the revised Terms.
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
          Privacy <span className="text-primary">Policy</span> 🔐
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
          At HudumaLink, your privacy is important to us. We protect your information as if it were our own.
        </p>
        <p className="mt-4 text-sm font-bold text-gray-400 uppercase tracking-widest">Last Updated: May 2026</p>
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
            <div className="p-8 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 shadow-sm">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 font-medium">
                HudumaLink is committed to protecting your personal data in accordance with the <strong>Data Protection Act (2019) of Kenya</strong>.
              </p>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl">
                  <span className="font-bold text-gray-900 dark:text-white block mb-1">KYC Data Retention</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Identity documents (National ID, Passport) are retained securely for the duration of account activity plus 7 years as per financial regulations. All identity data is encrypted at rest.</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl">
                  <span className="font-bold text-gray-900 dark:text-white block mb-1">Purpose Limitation</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">KYC information is collected solely for the purpose of identity verification, fraud prevention, and maintaining a high-trust marketplace for all Kenyans.</p>
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
                { label: "Payment Info", val: "M-Pesa transaction details and payment confirmations (processed securely)." }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-6 bg-gray-50 dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800">
                  <div className="w-3 h-3 rounded-full bg-secondary flex-shrink-0"></div>
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white block mb-1">{item.label}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.val}</span>
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
            <div className="p-8 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 shadow-sm">
              <ul className="space-y-4 text-gray-600 dark:text-gray-300">
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
            <div className="p-8 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 shadow-sm">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                We implement secure servers, encrypted connections, and restricted access to sensitive information. We actively monitor for suspicious activity to keep your data safe.
              </p>
              <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Industry-standard encryption protocols</span>
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
              We do NOT sell your personal data. We share information only when necessary for transactions, with payment providers (M-Pesa), or when required by law.
            </p>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center italic font-bold">
              "HudumaLink — Your data, your control."
            </div>
          </div>

          <section>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-4">
              <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">4</div>
              Your Rights
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: "Access & Edit", desc: "View and update your personal info in settings." },
                { title: "Data Erasure", desc: "Request account and data deletion at any time." }
              ].map((item, i) => (
                <div key={i} className="p-8 bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-3">{item.title}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
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
              <div className="p-8 bg-gray-50 dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800">
                <h4 className="font-bold text-gray-900 dark:text-white mb-3">Cookies & Tracking</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">We use cookies to improve experience and track platform usage. You can disable them in your browser.</p>
              </div>
              <div className="p-8 bg-gray-50 dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800">
                <h4 className="font-bold text-gray-900 dark:text-white mb-3">Data Retention</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">We retain information only as long as necessary for services, legal obligations, or dispute resolution.</p>
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
          Safety <span className="text-green-500">Center</span> 🛡️
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Your safety is our priority. Follow these guidelines to protect yourself when buying, selling, or hiring services on HudumaLink.
        </p>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-16">
          <section>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">1</div>
              Core Safety Rules
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Always Use the Platform</h3>
                <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Keep all communication within HudumaLink</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Avoid moving to WhatsApp too early</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Never agree to payments outside the platform</span>
                  </li>
                </ul>
                <p className="mt-6 text-xs font-bold text-primary italic">👉 This ensures you are protected by our system.</p>
              </div>

              <div className="p-8 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 shadow-sm">
                <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary mb-6">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Use Secure Payments</h3>
                <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Only pay through official payment system</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Do NOT send money directly to sellers</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Avoid upfront payments without confirmation</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-4">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">2</div>
              Verification & Roles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-gray-50 dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800">
                <UserCheck className="w-8 h-8 text-accent mb-4" />
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Verify Users</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Check ratings, verified badges, and be cautious with incomplete profiles.</p>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800">
                <ShoppingBag className="w-8 h-8 text-accent mb-4" />
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">For Buyers (Inspection Mandate)</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  For physical products, buyers are legally required to thoroughly inspect the item at the point of delivery <strong>BEFORE</strong> clicking "Confirm Delivery". Once you click "Confirm", the escrow is legally completed, funds are released immediately via our automated pipeline, and HudumaLink cannot recover or refund those payments.
                </p>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800">
                <Briefcase className="w-8 h-8 text-accent mb-4" />
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">For Sellers</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Provide accurate descriptions, deliver as agreed, and communicate professionally.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-4">
              <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">3</div>
              Documentation
            </h2>
            <div className="p-10 bg-secondary/5 dark:bg-secondary/10 rounded-[2.5rem] border border-secondary/10">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center text-secondary flex-shrink-0">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Keep Records</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    Save receipts, transaction details, and keep communication history on the platform. Take screenshots of important agreements if necessary.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <div className="p-8 bg-red-500 text-white rounded-[2.5rem] shadow-xl shadow-red-500/20">
            <AlertTriangle className="w-12 h-12 mb-6" />
            <h3 className="text-2xl font-bold mb-4">Red Flags 🚩</h3>
            <p className="text-white/80 mb-6 text-sm">Be cautious if someone:</p>
            <ul className="space-y-4 text-sm">
              {[
                "Rushes you to make payment",
                "Refuses to use platform system",
                "Provides inconsistent info",
                "Requests unusual payment methods"
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
            <h3 className="text-xl font-bold mb-3">Login & PIN Integrity 🔒</h3>
            <p className="text-xs text-gray-200 dark:text-gray-300 leading-relaxed font-semibold">
              HudumaLink Kenya will <strong>never</strong> ask you for your account login passwords or security tokens — they are your secret, never disclose them to anyone. 
              Further, <strong>we will never ask you for your M-Pesa PIN</strong> under any circumstances. Anyone demanding these credentials is attempting fraud; please report them immediately.
            </p>
          </div>

          <div className="p-8 bg-neutral-900 text-white rounded-[2.5rem] shadow-xl">
            <ShieldAlert className="w-12 h-12 text-primary mb-6" />
            <h3 className="text-2xl font-bold mb-4">Report Activity</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              If something feels wrong, report the user immediately and do NOT proceed with the transaction.
            </p>
            <a href="mailto:support@hudumalink.co.ke" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
              <Mail className="w-5 h-5" /> support@hudumalink.co.ke
            </a>
          </div>

          <div className="p-8 bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Handshake className="w-5 h-5 text-green-500" />
              Our Commitment
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              HudumaLink is committed to protecting users through secure systems, providing fair dispute resolution, and continuously improving safety measures.
            </p>
            <div className="mt-6 p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl text-center font-bold text-xs text-gray-900 dark:text-white uppercase tracking-widest">
              Stay smart. Stay safe.
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
        { q: "What is HudumaLink?", a: "HudumaLink is a digital marketplace designed to connect skilled service providers and sellers with customers across Kenya in a safe and trusted environment." },
        { q: "Is HudumaLink free to use?", a: "Creating an account and browsing listings is completely free. We charge a small service fee on successful transactions to maintain the platform and provide escrow protection." },
        { q: "Which areas do you cover?", a: "We are designed to serve all 47 counties in Kenya, from major cities like Nairobi and Mombasa to rural areas." }
      ]
    },
    {
      category: "Safety & Payments",
      questions: [
        { q: "How does the escrow system work?", a: "When you pay for a service, HudumaLink holds the funds securely. The money is only released to the seller once you confirm that the work has been completed to your satisfaction." },
        { q: "What should I do if I get scammed?", a: "If you use our escrow system, your money is protected. You can raise a dispute in your dashboard, and our team will mediate. Never pay sellers directly outside the platform." },
        { q: "Can I pay via M-Pesa?", a: "Yes! HudumaLink is fully integrated with M-Pesa for both payments and seller withdrawals." }
      ]
    },
    {
      category: "For Sellers",
      questions: [
        { q: "How do I become a verified seller?", a: "You need to complete the KYC (Know Your Customer) process by providing a valid National ID and other required details in your profile settings." },
        { q: "How do I get paid?", a: "Once the buyer confirms the service, the funds are moved to your HudumaLink wallet. You can then withdraw them directly to your M-Pesa number." }
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
            Frequently Asked <span className="text-primary">Questions</span> 🤔
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
                  <details key={j} className="group bg-gray-50 dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden transition-all">
                    <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                      <span className="font-bold text-gray-900 dark:text-white pr-4">{faq.q}</span>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-6 pb-6 text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-neutral-800 pt-4">
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
  const [formData, setFormData] = React.useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
      toast.success('Message sent! Our team will get back to you shortly.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, 'support_tickets');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-950 transition-colors">
      {/* Hero Section */}
      <div className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-accent/5 dark:bg-accent/10 -skew-y-3 origin-top-left"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-3xl text-green-500 mb-8"
          >
            <MessageSquare className="w-10 h-10" />
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
            Contact <span className="text-green-500">Support</span> 💬
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Need help, have a question, or facing an issue? Our support team is ready to assist you quickly and professionally. Your experience matters to us.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <div className="bg-white dark:bg-neutral-900 p-10 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Send us a message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Your Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 focus:ring-2 focus:ring-accent outline-none transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 focus:ring-2 focus:ring-accent outline-none transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Subject</label>
                <select
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 focus:ring-2 focus:ring-accent outline-none transition-all text-gray-900 dark:text-white"
                >
                  <option value="" className="dark:bg-neutral-900">Select a subject</option>
                  <option value="General Inquiry" className="dark:bg-neutral-900">General Inquiry</option>
                  <option value="Technical Support" className="dark:bg-neutral-900">Technical Support</option>
                  <option value="Payment Issue" className="dark:bg-neutral-900">Payment Issue</option>
                  <option value="Report a User" className="dark:bg-neutral-900">Report a User</option>
                  <option value="Partnership" className="dark:bg-neutral-900">Partnership</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Message</label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 focus:ring-2 focus:ring-accent outline-none transition-all text-gray-900 dark:text-white resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="How can we help you?"
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Sending...' : (
                  <>
                    <Send className="w-5 h-5" />
                    Get Help Now
                  </>
                )}
              </button>
            </form>

            <div className="mt-12 p-8 bg-gray-50 dark:bg-neutral-800 rounded-3xl border border-gray-100 dark:border-neutral-700">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">Your Safety Matters</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-300 leading-relaxed">
                    We take every inquiry seriously. Whether it’s a dispute, payment issue, or general question, our team ensures fair handling and user protection at all times.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-12">
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white">Get in touch</h2>
                <Link to="/faq" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                  <HelpCircle className="w-4 h-4" /> Common Questions
                </Link>
              </div>
              <div className="space-y-8">
                {[
                  { icon: <Mail className="w-6 h-6" />, title: "Email Us", val: "support@hudumalink.co.ke", href: "mailto:support@hudumalink.co.ke", desc: "⚡ Average response time: under 2 hours" },
                  { icon: (
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M12.004 0C5.372 0 0 5.372 0 12.004c0 2.116.549 4.11 1.612 5.855L.05 24l6.302-1.654a11.97 11.97 0 005.652 1.41h.005c6.629 0 12.001-5.372 12.001-12.004C24.01 5.372 18.636 0 12.004 0zm6.986 16.92c-.287.808-1.42 1.492-2.193 1.583-.726.084-1.658.127-2.68-.198-1.023-.325-2.028-.868-2.914-1.496a15.828 15.828 0 01-3.69-3.692C6.91 12.222 6.38 11.196 6.07 10.155c-.31-.1-.314-.085-.314-.085-.357-1.157.34-1.928.895-2.484l.654-.654c.154-.154.346-.226.544-.226.2 0 .393.072.544.226l1.35 1.35c.154.154.226.346.226.544 0 .2-.072.392-.226.544l-.454.454c-.112.112-.132.278-.052.41a6.602 6.602 0 001.378 1.83 6.577 6.577 0 001.83 1.378c.133.08.3.06.411-.052l.455-.455c.153-.153.345-.226.544-.226s.39.073.543.226l1.35 1.35c.154.154.226.346.226.544 0 .198-.073.39-.227.544l-.35.35c-.092.1-.219.145-.347.118z"/>
                    </svg>
                  ), title: "WhatsApp Support", val: "0112389628", href: "https://wa.me/254112389628?text=Hello%20HudumaLink%20Support,%20I'm%20contacting%20you%20from%20the%20platform%20for%20assistance.", desc: "Chat with us instantly for faster assistance." },
                  { icon: <Phone className="w-6 h-6" />, title: "Call Us", val: "0112389628", href: "tel:254112389628", desc: "Mon-Fri from 8am to 6pm." },
                  { icon: <MapPin className="w-6 h-6" />, title: "Visit Us", val: "Eldoret, Kenya", href: "", desc: "(Operations currently remote as we build and expand)" }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="w-14 h-14 bg-gray-50 dark:bg-neutral-900 rounded-2xl flex items-center justify-center text-green-500 border border-gray-100 dark:border-neutral-800 flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{item.title}</h3>
                      {item.href ? (
                        <a 
                          href={item.href} 
                          target={item.href.startsWith('mailto:') || item.href.startsWith('tel:') ? undefined : "_blank"} 
                          rel={item.href.startsWith('mailto:') || item.href.startsWith('tel:') ? undefined : "noopener noreferrer"}
                          className="inline-block text-green-600 dark:text-green-400 font-bold mt-1 hover:underline transition-all"
                        >
                          {item.val}
                        </a>
                      ) : (
                        <p className="text-green-600 dark:text-green-400 font-bold mt-1">{item.val}</p>
                      )}
                      <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
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
          The legal and technical framework governing M-Pesa payments, escrow holds, dispute resolutions, and administration on HudumaLink Kenya.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
          <span>Effective Date: May 20, 2026</span>
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
              The Safe Deposit Phase (M-Pesa STK Push)
            </h2>
            <div className="p-8 bg-gray-50 dark:bg-neutral-900 rounded-[2rem] border border-gray-100 dark:border-neutral-800 space-y-4">
              <p className="text-gray-650 dark:text-gray-300 leading-relaxed text-base">
                When a buyer initiates a purchase or hires a service provider, payment is collected via a secure <strong>M-Pesa STK Push</strong>. 
                Upon a successful Safaricom transaction, the funds enter the neutral, secure <strong>HudumaLink Escrow Ledger</strong>.
              </p>
              <div className="p-6 bg-white dark:bg-neutral-950 rounded-2xl border border-gray-200 dark:border-neutral-800 flex gap-4 items-start">
                <ShieldCheck className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <strong className="text-gray-900 dark:text-white block mb-1">Neutral Custodian Rule</strong>
                  These funds are legally locked inside the HudumaLink ledger as custody. Under no circumstances can the seller/provider access, borrow, or draw down on these funds prior to delivery validation, and buyers cannot double-spend or retreat on active contracts.
                </p>
              </div>
            </div>
          </section>

          <section id="auto-release">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary text-lg font-bold">2</div>
              The 72-Hour Auto-Release Latch
            </h2>
            <div className="p-8 bg-gray-50 dark:bg-neutral-900 rounded-[2rem] border border-gray-100 dark:border-neutral-800 space-y-4">
              <p className="text-gray-650 dark:text-gray-300 leading-relaxed text-base">
                Once a product is dispatched or a service is completed, the seller/provider marks the transaction status as <strong className="text-primary">"Delivered"</strong>. 
                This action invokes an absolute, deterministic cryptographic and legal countdown.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                  <span className="font-bold text-gray-900 dark:text-white block mb-1">Absolute 72-Hour Window</span>
                  <p className="text-xs text-gray-550 dark:text-gray-400">
                    The buyer must either click <strong>"Confirm Delivery"</strong> (to release the escrow funds directly to the provider's wallet balance) or click <strong>"File Dispute"</strong> within exactly <strong>72 hours</strong>.
                  </p>
                </div>
                <div className="p-6 bg-red-500/5 rounded-2xl border border-red-500/10">
                  <span className="font-bold text-gray-900 dark:text-white block mb-1">Irreversible Auto-Release</span>
                  <p className="text-xs text-gray-550 dark:text-gray-400">
                    If the buyer takes no action within 72 hours, the background auto-release routine will execute automatically, releasing the escrow balance to the seller's wallet. Once executed, auto-releases are legally and technically final and cannot be reverted or disputed.
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
            <div className="p-8 bg-gray-50 dark:bg-neutral-900 rounded-[2rem] border border-gray-100 dark:border-neutral-800 space-y-4">
              <p className="text-gray-650 dark:text-gray-300 leading-relaxed text-base">
                To eliminate payment defaults, buyer fraud, and bad-faith cancelations, certain statuses create an <strong>immutable contract lock</strong>:
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>Once the seller claims delivery, the buyer is technically barred from unilaterally canceling the order or demanding self-service refunds.</span>
                </li>
                <li className="flex gap-3 text-sm text-gray-500 dark:text-gray-400">
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
            <div className="p-8 bg-gray-50 dark:bg-neutral-900 rounded-[2rem] border border-gray-100 dark:border-neutral-800 space-y-6">
              <p className="text-gray-650 dark:text-gray-300 leading-relaxed text-base">
                If the buyer files a dispute, the funds remain frozen in the escrow locker. Both parties will be prompted to submit valid physical or digital proofs of execution or non-execution (e.g., GPS coordination photos, client chats, service logs, sign-off forms) within <strong>48 hours</strong>.
              </p>
              <div className="p-6 bg-red-500/5 border border-red-500/20 text-red-700 dark:text-red-400 rounded-2xl">
                <span className="font-bold block mb-1 uppercase tracking-wider text-xs flex items-center gap-2">
                  <Scale className="w-4 h-4" /> Legal Administrative Override
                </span>
                <p className="text-xs leading-relaxed mt-1">
                  HudumaLink Kenya acts as a neutral, third-party binding arbiter. Based on the objective evidence presented, HudumaLink reserves the absolute legal right to perform an <strong>administrative override</strong>. This override will either programmatically trigger a payout to the seller or return a B2C M-Pesa refund to the buyer. HudumaLink's final decision is contractually binding.
                </p>
              </div>
            </div>
          </section>

          <section id="fees">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary text-lg font-bold">5</div>
              Non-Refundable Platform and Payment Fees
            </h2>
            <div className="p-8 bg-gray-50 dark:bg-neutral-900 rounded-[2rem] border border-gray-100 dark:border-neutral-800 space-y-4">
              <p className="text-gray-620 dark:text-gray-300 leading-relaxed text-base">
                Safaricom channels and automated systems impose transactional and ledger operation fees. 
                Our commission fee structured to power HudumaLink escrow custody is non-refundable.
              </p>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>The 2% HudumaLink administrative escrow fee is non-refundable upon successful delivery.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Standard Safaricom M-Pesa transaction rates for STK Push and B2C payouts are fully borne by the respective contracting users and are consumed instantly upon transit.</span>
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

          <div className="p-8 bg-white dark:bg-neutral-900 rounded-[2rem] border border-gray-100 dark:border-neutral-800">
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">Need Dispute Help?</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
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
            <div className="p-6 bg-white dark:bg-neutral-950 rounded-2xl border border-gray-200 dark:border-neutral-800">
              <span className="font-bold text-xs text-primary uppercase block mb-1">State Management</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                To securely persist credentials, enabling buyers and providers to browse, list products, or chat with contractors without repeatedly re-authenticating, protecting workflow continuity.
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-neutral-950 rounded-2xl border border-gray-200 dark:border-neutral-800">
              <span className="font-bold text-xs text-primary uppercase block mb-1">CSRF & Security Defender</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
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
