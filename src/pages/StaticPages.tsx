import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ShoppingBag, Wrench, ShieldCheck, Search, MessageCircle, Star, Rocket, 
  CheckCircle2, ArrowRight, UserPlus, Image as ImageIcon, CreditCard,
  Lock, Eye, FileText, AlertTriangle, Handshake, Scale, Info, ShieldAlert,
  Users, Zap, Globe, Heart, CheckCircle, Facebook, Instagram, Linkedin, Twitter, 
  Send, HelpCircle, ChevronDown, Mail, Phone, MessageSquare
} from 'lucide-react';

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
    <div className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10 -skew-y-3 origin-top-left"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-3xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight"
          >
            Connecting Kenya's <span className="text-primary">Best</span> to Those Who Need Them Most 🇰🇪
          </motion.h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            The smarter, safer way to find trusted services and quality products in your neighborhood. Built for the Kenyan spirit of "Undugu" and "Huduma".
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/listings" className="bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-transform shadow-lg shadow-primary/20">
              Start Exploring
            </Link>
            <Link to="/create-listing" className="bg-white dark:bg-neutral-900 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-800 px-8 py-4 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
              Post a Listing
            </Link>
          </div>
        </div>
      </div>
    </div>

    {/* Our Mission */}
    <div className="py-20 bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6">Our Mission</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              At HudumaLink, we believe that every Kenyan deserves access to reliable services and quality products without the fear of being scammed. Our mission is to bridge the gap between talented service providers, honest sellers, and the community that needs them.
            </p>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We are committed to empowering local entrepreneurs and small businesses by providing a platform that emphasizes trust, verification, and secure transactions.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-square rounded-3xl overflow-hidden shadow-lg">
              <img src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=400" alt="Kenyan Professional" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="aspect-square rounded-3xl overflow-hidden shadow-lg mt-8">
              <img src="https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=400" alt="Kenyan Entrepreneur" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* How it Works for Buyers */}
    <div className="py-24 bg-gray-50 dark:bg-neutral-900/50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold mb-6">
              <ShoppingBag className="w-4 h-4" />
              <span>For Buyers</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-8">How to Get Started as a Buyer</h2>
            
            <div className="space-y-8">
              {[
                { 
                  icon: <UserPlus className="w-6 h-6" />, 
                  title: "Create Your Account", 
                  desc: "Sign up in seconds. Verify your email to unlock all features including direct messaging and escrow payments." 
                },
                { 
                  icon: <Search className="w-6 h-6" />, 
                  title: "Search & Filter", 
                  desc: "Use our powerful search to find products or services by category, location (County/Town), or keyword." 
                },
                { 
                  icon: <MessageCircle className="w-6 h-6" />, 
                  title: "Connect with Sellers", 
                  desc: "Chat directly on the platform or reach out via WhatsApp to discuss details and negotiate prices." 
                }
              ].map((step, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4 group"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-700 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    {step.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">{step.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl rotate-3">
              <img 
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800" 
                alt="Buyer shopping" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white dark:bg-neutral-900 p-6 rounded-3xl shadow-xl border border-gray-100 dark:border-neutral-800 max-w-xs -rotate-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="font-bold text-gray-900 dark:text-white">Safe Shopping</span>
              </div>
              <p className="text-xs text-gray-500">Always use our Escrow system for secure payments and peace of mind.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* How to Order Section */}
    <div className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">The HudumaLink Transaction Process</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">We've designed a secure flow to protect both buyers and sellers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { step: "01", title: "Find & Inquire", desc: "Browse listings and message the seller to confirm availability and final price." },
            { step: "02", title: "Secure Payment", desc: "Pay via M-Pesa into the HudumaLink Escrow. The money is held safely, not sent to the seller yet." },
            { step: "03", title: "Delivery/Service", desc: "The seller provides the service or delivers the product to your agreed location." },
            { step: "04", title: "Release Funds", desc: "Once satisfied, you 'Confirm Receipt' in the app to release the payment to the seller." }
          ].map((item, i) => (
            <div key={i} className="relative p-8 bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all">
              <span className="text-5xl font-black text-primary/10 absolute top-4 right-4">{item.step}</span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 mt-4">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 bg-primary/5 dark:bg-primary/10 rounded-3xl border border-primary/10 text-center">
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            <span className="text-primary font-bold">Important Note:</span> If there is a problem, you can "Raise a Dispute" before releasing funds. Our admin team will investigate and ensure a fair resolution.
          </p>
        </div>
      </div>
    </div>

    {/* For Sellers Section */}
    <div className="py-24 bg-accent text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 -skew-x-12 translate-x-1/4"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 order-2 md:order-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl -rotate-2">
                <img src="https://images.unsplash.com/photo-1521791136064-7986c2959213?auto=format&fit=crop&q=80&w=400" alt="Seller working" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl rotate-2 mt-8">
                <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=400" alt="Analytics" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>
          <div className="flex-1 order-1 md:order-2">
            <div className="inline-flex items-center space-x-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-bold mb-6">
              <Rocket className="w-4 h-4" />
              <span>For Sellers & Providers</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-8">Grow Your Business with HudumaLink</h2>
            
            <div className="space-y-6">
              {[
                { title: "1. Complete KYC Verification", desc: "Upload your ID and a selfie. Verified sellers get 10x more trust and visibility." },
                { title: "2. Post High-Quality Ads", desc: "Add clear photos and detailed descriptions. Good listings sell 3x faster." },
                { title: "3. Respond Quickly", desc: "Buyers love fast replies. Keep your notifications on and respond to messages promptly." },
                { title: "4. Build Your Reputation", desc: "Deliver excellent service and ask for reviews. High ratings mean more future sales." }
              ].map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle2 className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{step.title}</h3>
                    <p className="text-white/70 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/create-listing" className="mt-10 inline-flex items-center gap-2 bg-secondary text-white px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-transform">
              Start Selling Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>

    {/* Trust Section */}
    <div className="py-24 bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-16">Why Kenyans Choose HudumaLink</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-4 dark:text-white">Trusted Connections</h3>
            <p className="text-gray-500 dark:text-gray-400">We prioritize safety and verified community feedback to keep you protected.</p>
          </div>
          <div>
            <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary mx-auto mb-6">
              <Rocket className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-4 dark:text-white">Fast & Easy</h3>
            <p className="text-gray-500 dark:text-gray-400">Our streamlined search gets you the right results in seconds, not hours.</p>
          </div>
          <div>
            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center text-accent mx-auto mb-6">
              <Star className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-4 dark:text-white">Local Focus</h3>
            <p className="text-gray-500 dark:text-gray-400">Built specifically for Kenyans, by Kenyans, serving all 47 counties.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const Terms = () => (
  <div className="bg-white dark:bg-neutral-950 transition-colors">
    {/* Hero Section */}
    <div className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-secondary/5 dark:bg-secondary/10 -skew-y-3 origin-top-left"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-secondary/10 rounded-3xl text-secondary mb-8"
        >
          <FileText className="w-10 h-10" />
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
          Terms of <span className="text-secondary">Service</span> 📜
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Clear rules for a better community. Last updated: March 2026.
        </p>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* General Rules */}
        <div className="md:col-span-2 space-y-12">
          <section>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <Users className="w-6 h-6 text-primary" />
              1. Your Account
            </h2>
            <div className="bg-gray-50 dark:bg-neutral-900 p-8 rounded-3xl border border-gray-100 dark:border-neutral-800">
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                To use most features, you’ll need an account. You are responsible for keeping your login details safe and for everything that happens under your profile.
              </p>
              <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Use your real name and accurate information.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  One account per person/business entity.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Maintain the security of your password.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <Zap className="w-6 h-6 text-accent" />
              2. Listings & Conduct
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: "Be Accurate", desc: "Only post items or services you actually have or can provide." },
                { title: "Stay Legal", desc: "No illegal goods, stolen items, or fraudulent services." },
                { title: "Be Respectful", desc: "No hate speech, harassment, or spamming other users." },
                { title: "Our Right", desc: "We may remove any listing that violates community standards." }
              ].map((item, i) => (
                <div key={i} className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <Handshake className="w-6 h-6 text-secondary" />
              3. Transactions & Our Role
            </h2>
            <div className="bg-secondary/5 dark:bg-secondary/10 p-8 rounded-3xl border border-secondary/10">
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-4 italic">
                "HudumaLink is a marketplace connector, not a middleman."
              </p>
              <div className="space-y-4 text-gray-600 dark:text-gray-400">
                <p>• We provide the platform for you to find each other.</p>
                <p>• We do not handle physical deliveries directly.</p>
                <p>• Any agreement you make is strictly between you and the other user.</p>
                <p>• We are not liable for any losses or disputes arising from your transactions.</p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar - Quick Info */}
        <div className="space-y-8">
          <div className="p-8 bg-primary text-white rounded-3xl shadow-xl shadow-primary/20">
            <Scale className="w-10 h-10 mb-6" />
            <h3 className="text-xl font-bold mb-4">Fair Play Policy</h3>
            <p className="text-white/80 text-sm leading-relaxed mb-6">
              Reviews are the heartbeat of our trust system. Only leave reviews for transactions that actually happened.
            </p>
            <div className="p-4 bg-white/10 rounded-2xl text-xs">
              Fake reviews or "review bombing" will result in immediate account suspension.
            </div>
          </div>

          <div className="p-8 bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Termination</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              We may suspend or close your account if you repeatedly break these rules or engage in suspicious activity that puts our community at risk.
            </p>
          </div>

          <div className="p-8 bg-accent/10 rounded-3xl border border-accent/20">
            <Info className="w-6 h-6 text-accent mb-4" />
            <h3 className="font-bold text-accent mb-2">Changes</h3>
            <p className="text-xs text-accent/80">
              As we grow, we might update these terms. We’ll let you know when we do.
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
    <div className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10 -skew-y-3 origin-top-left"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl text-primary mb-8"
        >
          <Lock className="w-10 h-10" />
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
          Privacy <span className="text-primary">Policy</span> 🛡️
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Your data is yours. We’re just here to keep it safe.
        </p>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <Eye className="w-6 h-6 text-secondary" />
              What We Collect
            </h2>
            <div className="space-y-4">
              {[
                { label: "Basic Info", val: "Name, email, and phone number." },
                { label: "Location", val: "Your county and town for local listings." },
                { label: "Profile", val: "Your bio and profile picture." },
                { label: "Usage", val: "How you use the app to help us improve." }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white mr-2">{item.label}:</span>
                    <span className="text-gray-500 dark:text-gray-400">{item.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-primary" />
              How We Use Your Info
            </h2>
            <div className="prose dark:prose-invert text-gray-600 dark:text-gray-400">
              <p>We use your data to make the marketplace work for you, connect you with buyers or sellers, and keep the platform safe from bots and scammers.</p>
              <p>We also use it to send you important updates about your account and transactions.</p>
            </div>
          </section>
        </div>

        <div className="space-y-12">
          <div className="p-10 bg-neutral-900 text-white rounded-[2.5rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl"></div>
            <Globe className="w-12 h-12 text-primary mb-8" />
            <h3 className="text-2xl font-bold mb-4">Sharing Your Data</h3>
            <p className="text-gray-400 leading-relaxed mb-6">
              <span className="text-white font-bold underline decoration-primary decoration-2 underline-offset-4">We do not sell your data to third parties.</span> Period.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <span>Other Users only see what you choose to make public.</span>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <span>Trusted partners who help us run the app (like database providers).</span>
              </div>
            </div>
          </div>

          <section>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <Heart className="w-6 h-6 text-accent" />
              Your Choices
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
                <h4 className="font-bold mb-2 dark:text-white">Update</h4>
                <p className="text-xs text-gray-500">Change your info anytime in your profile.</p>
              </div>
              <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
                <h4 className="font-bold mb-2 dark:text-white">Delete</h4>
                <p className="text-xs text-gray-500">Request to have your account deleted permanently.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
);

export const Safety = () => (
  <div className="bg-white dark:bg-neutral-950 transition-colors">
    {/* Hero Section */}
    <div className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-accent/5 dark:bg-accent/10 -skew-y-3 origin-top-left"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
        <motion.div
          initial={{ opacity: 0, rotate: -10 }}
          animate={{ opacity: 1, rotate: 0 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-accent/10 rounded-3xl text-accent mb-8"
        >
          <ShieldAlert className="w-10 h-10" />
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
          Safety <span className="text-accent">Tips</span> 🛡️
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Stay smart, stay safe, and trade with confidence.
        </p>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Buyer Safety */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold">
            <ShoppingBag className="w-4 h-4" />
            Buyer Protection
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white">For Our Buyers</h2>
          
          <div className="space-y-6">
            {[
              { 
                title: "Meet in Public 📍", 
                desc: "Always meet in a well-lit, busy public place—like a mall, a petrol station, or a busy restaurant. Never meet in isolated areas.",
                icon: <Globe className="w-6 h-6" />
              },
              { 
                title: "Verify Before You Buy 🔍", 
                desc: "Inspect the item thoroughly. If it's an electronic device, turn it on and test all functions before paying.",
                icon: <Search className="w-6 h-6" />
              },
              { 
                title: "The 'No Upfront Payment' Rule 💸", 
                desc: "Never send money via M-Pesa before seeing the item. Scammers often ask for 'commitment fees' or 'delivery charges' upfront.",
                icon: <AlertTriangle className="w-6 h-6" />
              }
            ].map((tip, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="p-8 bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                  {tip.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{tip.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{tip.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Seller Safety */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-full text-sm font-bold">
            <Wrench className="w-4 h-4" />
            Seller Protection
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white">For Our Sellers</h2>

          <div className="space-y-6">
            {[
              { 
                title: "Verify Buyer Profiles 👤", 
                desc: "Check if the buyer has a verified email or phone number. Be cautious of newly created accounts with no history.",
                icon: <UserPlus className="w-6 h-6" />
              },
              { 
                title: "Safe Payment Methods 💳", 
                desc: "Use our Escrow system for high-value items. If accepting cash, count it in a safe, public place.",
                icon: <CreditCard className="w-6 h-6" />
              },
              { 
                title: "Protect Your Private Info 🔒", 
                desc: "Don't share your M-Pesa PIN, bank details, or home address. We will never ask for your password.",
                icon: <Lock className="w-6 h-6" />
              }
            ].map((tip, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="p-8 bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm"
              >
                <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary mb-6">
                  {tip.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{tip.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{tip.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Report Section */}
      <div className="mt-20 p-12 bg-red-50 dark:bg-red-900/10 rounded-[3rem] border border-red-100 dark:border-red-900/20 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-6" />
        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Report Suspicious Activity 🚩</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          Help us keep HudumaLink clean. If you spot a fake listing, a scammer, or someone being abusive, report them immediately using the "Report" button or contact our support.
        </p>
        <Link to="/contact" className="inline-flex items-center gap-2 bg-red-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-red-600 transition-colors">
          Contact Support
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  </div>
);

export const Contact = () => {
  const [feedback, setFeedback] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate feedback submission
    setSubmitted(true);
    setFeedback('');
    setEmail('');
    setTimeout(() => setSubmitted(false), 5000);
  };

  const faqs = [
    {
      q: "How do I verify my account?",
      a: "Go to your profile settings and upload a clear photo of your National ID and a selfie. Our team will review it within 24 hours."
    },
    {
      q: "Is the Escrow system safe?",
      a: "Yes! When you pay via Escrow, HudumaLink holds the funds securely. The seller only gets paid once you confirm you've received the item or service."
    },
    {
      q: "What are the fees for selling?",
      a: "Posting a listing is currently free! We may charge a small service fee for Escrow transactions to cover processing costs."
    },
    {
      q: "How do I report a scammer?",
      a: "Click the 'Report' flag on any listing or profile, or contact us directly via WhatsApp or email with screenshots."
    }
  ];

  return (
    <div className="bg-white dark:bg-neutral-950 transition-colors">
      {/* Hero Section */}
      <div className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10 -skew-y-3 origin-top-left"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl text-primary mb-8"
          >
            <MessageSquare className="w-10 h-10" />
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
            Get in <span className="text-primary">Touch</span> 💬
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            We're here to support the HudumaLink community. Reach out anytime!
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Info & Socials */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Email Us</p>
                    <p className="text-gray-900 dark:text-white font-medium">support@hudumalink.co.ke</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">WhatsApp</p>
                    <p className="text-gray-900 dark:text-white font-medium">+254 112 389 628</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Follow Our Journey</h3>
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: <Facebook className="w-5 h-5" />, label: "Facebook", color: "hover:bg-blue-600" },
                  { icon: <Twitter className="w-5 h-5" />, label: "X", color: "hover:bg-black" },
                  { icon: <Instagram className="w-5 h-5" />, label: "Instagram", color: "hover:bg-pink-600" },
                  { icon: <Linkedin className="w-5 h-5" />, label: "LinkedIn", color: "hover:bg-blue-700" },
                  { icon: <MessageCircle className="w-5 h-5" />, label: "WhatsApp", color: "hover:bg-green-600" }
                ].map((social, i) => (
                  <button 
                    key={i}
                    className={`w-12 h-12 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl flex items-center justify-center text-gray-500 hover:text-white transition-all ${social.color}`}
                    title={social.label}
                  >
                    {social.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Feedback Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-neutral-900 p-8 md:p-12 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 shadow-xl">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Submit Feedback</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">Your suggestions help us build a better platform for everyone.</p>
              
              {submitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 dark:bg-green-900/20 p-8 rounded-3xl border border-green-100 dark:border-green-900/30 text-center"
                >
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-green-800 dark:text-green-400 mb-2">Thank You!</h3>
                  <p className="text-green-700 dark:text-green-500/80">Your feedback has been received. We appreciate your input.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-6 py-4 bg-gray-50 dark:bg-neutral-800 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Topic</label>
                      <select className="w-full px-6 py-4 bg-gray-50 dark:bg-neutral-800 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all text-gray-900 dark:text-white">
                        <option>General Feedback</option>
                        <option>Report a Bug</option>
                        <option>Feature Request</option>
                        <option>Account Issue</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Message</label>
                    <textarea 
                      required
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={4}
                      placeholder="Tell us what's on your mind..."
                      className="w-full px-6 py-4 bg-gray-50 dark:bg-neutral-800 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all text-gray-900 dark:text-white resize-none"
                    ></textarea>
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                  >
                    <Send className="w-5 h-5" />
                    Send Feedback
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* FAQs Section */}
        <div className="mt-32">
          <div className="text-center mb-16">
            <HelpCircle className="w-12 h-12 text-accent mx-auto mb-4" />
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-500 dark:text-gray-400">Quick answers to common questions.</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="group bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800 overflow-hidden transition-all">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <span className="font-bold text-gray-900 dark:text-white">{faq.q}</span>
                  <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-gray-500 dark:text-gray-400 text-sm leading-relaxed border-t border-gray-50 dark:border-neutral-800 pt-4">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
