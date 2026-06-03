import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, MapPin, Clock, ChevronDown, ChevronUp, Send, CheckCircle2, Building, Globe, Mail, Coins, Sparkles } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { cn } from '../lib/utils';

interface Job {
  id: string;
  title: string;
  location: string;
  type: string;
  mode: 'Remote' | 'Hybrid' | 'On-site';
  description: string;
  requirements: string[];
  instructions: string;
  salary: string;
}

const jobs: Job[] = [
  {
    id: '1',
    title: 'Senior Full Stack Developer',
    location: 'Nairobi / Remote',
    type: 'Full-time',
    mode: 'Remote',
    description: 'We are looking for a Senior Full Stack Developer to lead our core product development. You will be responsible for scaling HudumaLink to handle millions of transactions across Kenya.',
    requirements: [
      '3+ years experience with React, Node.js, and TypeScript',
      'Strong knowledge of Firebase and cloud infrastructure',
      'Experience with payment gateway integrations (especially M-Pesa)',
      'Proven track record of building scalable web applications',
      'BSc in Computer Science or related field'
    ],
    instructions: 'Send your CV and portfolio to careers@hudumalink.co.ke with the subject "Senior Full Stack Dev Application".',
    salary: 'KES 150,000 - 220,000 / month'
  },
  {
    id: '2',
    title: 'Customer Experience Lead',
    location: 'Eldoret',
    type: 'Full-time',
    mode: 'Hybrid',
    description: 'As our Customer Experience Lead, you will define how HudumaLink interacts with its users. You will manage a growing team of support agents and drive customer satisfaction.',
    requirements: [
      '1+ years in customer support leadership',
      'Excellent communication skills in English and Swahili',
      'Data-driven approach to improving customer satisfaction (CSAT)',
      'Experience with CRM tools like Zendesk or Intercom',
      'Deep understanding of the Kenyan marketplace landscape'
    ],
    instructions: 'Email your resume and a short cover letter explaining your approach to customer success to careers@hudumalink.co.ke.',
    salary: 'KES 60,000 - 85,000 / month'
  },
  {
    id: '3',
    title: 'Growth Marketing Manager',
    location: 'Remote',
    type: 'Full-time',
    mode: 'Remote',
    description: 'Drive user acquisition and retention through creative marketing strategies. You will be in charge of our social media presence, SEO, and paid advertising campaigns.',
    requirements: [
      '1+ years experience in growth marketing for tech startups',
      'Expertise in Facebook Ads, Google Ads, and TikTok marketing',
      'Strong analytical skills (Google Analytics, Mixpanel)',
      'Creative mindset with the ability to produce engaging content',
      'Experience with the Kenyan consumer market'
    ],
    instructions: 'Submit your growth portfolio and CV to careers@hudumalink.co.ke.',
    salary: 'KES 70,000 - 100,000 / month'
  },
  {
    id: '4',
    title: 'Operations Coordinator',
    location: 'Eldoret',
    type: 'Full-time',
    mode: 'Hybrid',
    description: 'Ensure the smooth day-to-day operation of the marketplace. You will handle logistics partnerships, seller onboarding, and dispute mediation oversight.',
    requirements: [
      '1+ years experience in operations or logistics',
      'Strong problem-solving and organizational skills',
      'Ability to work in a fast-paced environment',
      'Degree in Business Administration or related field',
      'Knowledge of Kenyan trade and e-commerce regulations'
    ],
    instructions: 'Send your application to careers@hudumalink.co.ke with the subject "Operations Coordinator Application".',
    salary: 'KES 55,000 - 80,000 / month'
  },
  {
    id: '5',
    title: 'UX/UI Product Designer',
    location: 'Remote',
    type: 'Full-time',
    mode: 'Remote',
    description: 'Design beautiful, intuitive interfaces that make HudumaLink accessible to everyone. You will conduct user research and translate insights into high-fidelity designs.',
    requirements: [
      '1+ years portfolio experience showcasing mobile and web product designs',
      'Expertise in Figma and design systems',
      'Understanding of user-centered design principles',
      'Experience designing for emerging markets',
      'Basic knowledge of HTML/CSS is a plus'
    ],
    instructions: 'Share your Figma portfolio link and CV at careers@hudumalink.co.ke.',
    salary: 'KES 80,000 - 120,000 / month'
  },
  {
    id: '6',
    title: 'Community Manager',
    location: 'Eldoret',
    type: 'Full-time',
    mode: 'Hybrid',
    description: 'Build and nurture our seller and buyer communities. You will organize events, manage forums, and act as the voice of our users within the company.',
    requirements: [
      '1+ years experience passionate about community building',
      'Strong public speaking and moderation skills',
      'Experience managing online communities (Facebook Groups, Telegram)',
      'Creative event planning experience',
      'Fluency in English and Sheng/Swahili'
    ],
    instructions: 'Send a link to a community you have managed and your CV to careers@hudumalink.co.ke.',
    salary: 'KES 45,000 - 65,000 / month'
  },
  {
    id: '7',
    title: 'Mobile App Developer (Flutter)',
    location: 'Remote',
    type: 'Full-time',
    mode: 'Remote',
    description: 'Join our mobile team to build the HudumaLink Android and iOS apps using Flutter. You will ensure a high-performance, seamless experience for mobile users.',
    requirements: [
      '1+ years experience with Flutter and Dart',
      'Knowledge of Hive, Provider/Riverpod, and Firebase integration',
      'Experience with mobile UI/UX best practices',
      'Published apps in Play Store or App Store',
      'Ability to write clean, maintainable code'
    ],
    instructions: 'Email your GitHub profile and CV to careers@hudumalink.co.ke.',
    salary: 'KES 100,000 - 150,000 / month'
  },
  {
    id: '8',
    title: 'Data Scientist',
    location: 'Remote',
    type: 'Full-time',
    mode: 'Remote',
    description: 'Use data to drive product decisions and prevent fraud. You will build recommendation engines and risk scoring models for our escrow system.',
    requirements: [
      '3+ years experience with PySpark, Python, R, and SQL',
      'Experience with machine learning frameworks (Scikit-learn, TensorFlow)',
      'Ability to visualize complex data sets',
      'Degree in Math, Statistics, or Computer Science',
      'Experience with fraud detection is highly desirable'
    ],
    instructions: 'Send your CV and a brief description of a data project you are proud of to careers@hudumalink.co.ke.',
    salary: 'KES 140,000 - 200,000 / month'
  },
  {
    id: '9',
    title: 'Sales & Partnerships Executive',
    location: 'Eldoret (Field)',
    type: 'Full-time',
    mode: 'Hybrid',
    description: 'Onboard high-quality sellers and establish partnerships with logistics and finance providers. You will be the face of HudumaLink in the field.',
    requirements: [
      '1+ years in B2B sales or business development',
      'Strong networking and negotiation skills',
      'Willingness to travel within Nairobi and surrounding counties',
      'Competitive spirit with a focus on hitting targets',
      'Valid driving license is a plus'
    ],
    instructions: 'Send your CV and sales track record to careers@hudumalink.co.ke.',
    salary: 'KES 40,005 - 60,000 / month + commission'
  },
  {
    id: '10',
    title: 'Legal & Compliance Officer',
    location: 'Eldoret',
    type: 'Part-time / Contract',
    mode: 'Hybrid',
    description: 'Ensure HudumaLink complies with Kenyan laws, including the Data Protection Act and consumer protection regulations. You will draft contracts and manage legal disputes.',
    requirements: [
      '1+ years experience post-admission to the High Court of Kenya',
      'Knowledge of e-commerce and fintech law',
      'Experience in drafting and reviewing commercial contracts',
      'Detail-oriented with strong analytical skills',
      'Understanding of dispute resolution in marketplaces'
    ],
    instructions: 'Send your professional profile and relevant experience to careers@hudumalink.co.ke.',
    salary: 'KES 50,000 - 75,000 / month'
  }
];

const Careers = () => {
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [announcementIndex, setAnnouncementIndex] = useState(0);

  const announcements = [
    "🚀 recruiting early startup cohort: 1+ and 3+ year streams open!",
    "✨ remote & hybrid roles spanning all 47 counties of kenya!",
    "🤝 empower local jua kali trades & safe escrow commerce!"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % announcements.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const toggleJob = (id: string) => {
    setExpandedJob(expandedJob === id ? null : id);
  };

  return (
    <div className="bg-gray-50 dark:bg-neutral-950 min-h-screen pt-20 pb-12 transition-colors">
      <Helmet>
        <title>Careers | HudumaLink Kenya</title>
        <meta name="description" content="Join the most trusted digital marketplace team in Kenya. Explore remote and hybrid job opportunities at HudumaLink." />
      </Helmet>

      {/* Hero Section with Soft Glowing Back-filters and Ticker */}
      <section className="relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8 bg-accent col-span-full border-b border-white/[0.05]">
        
        {/* Soft Glowing Aura Backgrounds */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[320px] rounded-full bg-emerald-500/20 dark:bg-emerald-500/15 blur-3xl shadow-[0_0_120px_45px_rgba(16,185,129,0.3)] pointer-events-none animate-pulse" />
        <div className="absolute top-[20%] left-[20%] w-[200px] h-[200px] rounded-full bg-green-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[10%] right-[10%] w-[255px] h-[255px] rounded-full bg-emerald-600/10 blur-3xl pointer-events-none animate-pulse" />

        {/* Abstract grid */}
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.05] pointer-events-none">
           <div className="grid grid-cols-6 gap-4 transform -rotate-12 translate-y-[-20%]">
             {[...Array(24)].map((_, i) => (
                <div key={i} className="aspect-square bg-white rounded-2xl" />
             ))}
           </div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          
          {/* Animated Announcement Bar */}
          <div className="inline-flex items-center justify-center w-full mb-8">
            <div className="relative overflow-hidden h-9 px-4 rounded-full bg-white/10 dark:bg-neutral-800/60 backdrop-blur-md border border-white/10 dark:border-neutral-700/50 flex items-center justify-between gap-3 text-white max-w-lg shadow-[0_2px_20px_rgba(0,0,0,0.15)]">
              <span className="flex h-2 w-2 relative flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <div className="relative h-full flex items-center w-full min-w-[280px] md:min-w-[340px] overflow-hidden text-left">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={announcementIndex}
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -15, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 120, damping: 15 }}
                    className="absolute text-xs font-semibold tracking-wide text-white flex items-center gap-1.5 whitespace-nowrap uppercase font-mono"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-350 animate-pulse flex-shrink-0" />
                    <span className="truncate">{announcements[announcementIndex]}</span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white/80 text-sm font-medium mb-6 border border-white/10"
          >
            <Globe className="w-4 h-4 text-secondary" />
            <span>Building for Kenya, together</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-none"
          >
            Join the <span className="text-secondary">Future</span> of Trade
          </motion.h1>

          {/* Emerald accent line with glowing aura */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "140px" }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="h-[3px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_4px_rgba(52,211,153,0.7)] mx-auto mb-8"
          />

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-white/70 leading-relaxed max-w-2xl mx-auto"
          >
            Help us bridge the trust gap in digital commerce. We're looking for passionate individuals to help us build a more secure, escrow-backed marketplace for all Kenyans.
          </motion.p>
        </div>
      </section>

      {/* Perks Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Remote-First</h3>
            <p className="text-gray-500 dark:text-gray-400">Work from anywhere in Kenya. We believe great talent isn't limited by geography.</p>
          </div>
          <div className="p-8 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 shadow-sm">
            <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary mb-6">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Ownership</h3>
            <p className="text-gray-500 dark:text-gray-400">We give our team members autonomy and ownership over their work. Your impact is real.</p>
          </div>
          <div className="p-8 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 shadow-sm">
            <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent mb-6">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Growth</h3>
            <p className="text-gray-500 dark:text-gray-400">Join a fast-growing startup and grow your career alongside us. We invest in your development.</p>
          </div>
        </div>
      </section>

      {/* Jobs Section */}
      <section id="openings" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Animated Hiring Notice Ticker */}
        <div className="mb-12 relative overflow-hidden bg-white dark:bg-neutral-900 py-4 border-y border-gray-100 dark:border-neutral-800">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white dark:from-neutral-900 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white dark:from-neutral-900 to-transparent z-10" />
          
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: "-100%" }}
            transition={{ 
              repeat: Infinity, 
              duration: 20, 
              ease: "linear",
            }}
            className="flex items-center space-x-12 whitespace-nowrap"
          >
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-[0.2em]">
                  We are not hiring at the moment. Check regularly for new updates.
                </span>
                <span className="text-gray-300 dark:text-neutral-700">•</span>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Open Positions</h2>
          <p className="text-gray-500 dark:text-gray-400">Find your next role at HudumaLink</p>
        </div>

        <div className="space-y-4">
          {jobs.map((job) => (
            <div 
              key={job.id} 
              className={cn(
                "bg-white dark:bg-neutral-900 rounded-[2rem] border transition-all overflow-hidden",
                expandedJob === job.id ? "border-primary shadow-xl shadow-primary/5" : "border-gray-100 dark:border-neutral-800"
              )}
            >
              <button 
                onClick={() => toggleJob(job.id)}
                className="w-full text-left p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{job.title}</h3>
                  <div className="flex flex-wrap items-center mt-2 gap-3">
                    <span className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <MapPin className="w-3 h-3 mr-1" /> {job.location}
                    </span>
                    <span className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3 mr-1" /> {job.type}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      job.mode === 'Remote' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      job.mode === 'Hybrid' ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-500/20" :
                      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    )}>
                      {job.mode}
                    </span>
                    <span className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/5 dark:bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/10">
                      <Coins className="w-3.5 h-3.5 mr-1 text-emerald-500 animate-pulse" /> {job.salary}
                    </span>
                  </div>
                </div>
                <div className="hidden md:block">
                  {expandedJob === job.id ? <ChevronUp className="w-6 h-6 text-primary" /> : <ChevronDown className="w-6 h-6 text-gray-400" />}
                </div>
              </button>

              <AnimatePresence>
                {expandedJob === job.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-50 dark:border-neutral-800"
                  >
                    <div className="p-6 md:p-8 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-3">About the role</h4>
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-medium">{job.description}</p>
                        </div>
                        <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-5 rounded-3xl border border-emerald-500/10 flex items-center gap-4">
                          <Coins className="w-10 h-10 text-emerald-500 flex-shrink-0" />
                          <div>
                            <h4 className="text-[10px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-black">Monthly Compensation</h4>
                            <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">{job.salary}</p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Competitive early-stage package with equity potential</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-3">Requirements</h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {job.requirements.map((req, index) => (
                            <li key={index} className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                              <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 shrink-0" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-6 bg-primary/5 dark:bg-primary/10 rounded-3xl border border-primary/10">
                        <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-3 flex items-center">
                          <Send className="w-4 h-4 mr-2" /> How to Apply
                        </h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                          {job.instructions}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="p-12 bg-white dark:bg-neutral-900 rounded-[3rem] border border-gray-100 dark:border-neutral-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary opacity-10 rounded-bl-[100%]" />
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6">Don't see your role?</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-lg mx-auto">
            We're always looking for talented individuals who believe in our mission. Send us a general application and tell us how you can help.
          </p>
          <a 
            href="mailto:careers@hudumalink.co.ke" 
            className="inline-flex items-center space-x-2 bg-primary text-white px-8 py-4 rounded-full font-bold hover:scale-105 transition-all shadow-xl shadow-primary/20"
          >
            <Mail className="w-5 h-5" />
            <span>General Application</span>
          </a>
        </div>
      </section>
    </div>
  );
};

export default Careers;
