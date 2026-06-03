import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageCircle, X, Send, Bot, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: 'Habari! I am your HudumaLink Assistant. How can I help you navigate our secure escrow marketplace today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: `You are the friendly, helpful HudumaLink Assistant—an AI companion for the HudumaLink Kenya digital escrow marketplace. 

Your sole mission is to assist users (buyers and sellers) in navigating our secure marketplace, understanding how escrow transactions work, completing identity verification (KYC), tracking orders, initiating payouts, and staying safe from fraud.

CRITICAL SECURITY AND TECHNICAL BOUNDARIES:
1. NO TECHNICAL STACK OR SOURCE DISCLOSURE: You are strictly FORBIDDEN from discussing or disclosing any internal technology stacks, programming languages, frameworks (such as React, Node.js, Express, or Next.js), database systems (such as Firestore, PostgreSQL, or SQL), hosting environments, or proprietary software architectures. If a user asks about the "tech stack", "database", "backend source code", or "how this site was built", politely but firmly inform them that the platform's architectural blueprints and source files are proprietary, private, and strictly confidential to maintain maximum security and prevent malicious targeting.
2. FOCUS ON EXPLAINING THE HUMAN ESCROW FLOW: Keep explanations simple, functional, and user-concentric:
   - The Buyer places an order and pays funds into HudumaLink's secure Escrow hold.
   - The Seller is notified to proceed and delivers the service or product.
   - The Buyer inspects the deliverable and confirms satisfaction inside the portal.
   - HudumaLink immediately releases the funds securely to the Seller's accessible escrow wallet.
3. PREVENT OFF-PLATFORM TRANSACTIONS: Warn users against carrying out communication or payment off-platform (like on WhatsApp or via direct unescrowed M-Pesa).
4. BRANDING AND TONE: Maintain a warm, welcoming, polite, and reassuring Kenyan tone. Sprinkle in standard Kenyan expressions appropriately (e.g., "Habari!", "Karibu sana!", "Biashara"). Keep all advice concise, structured with bullet points where appropriate, and perfectly aligned with the user-facing guidelines without discussing low-level engineering details.`,
        }
      });

      const aiResponse = response.text || "I'm sorry, I couldn't process that. Please try again.";
      setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, { role: 'model', text: "Pole sana, I'm having some trouble connecting right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Interactive AI Orb Launcher */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-gradient-to-tr from-primary via-emerald-600 to-emerald-950 text-white rounded-full shadow-[0_8px_30px_rgba(16,185,129,0.3)] hover:scale-110 hover:shadow-[0_8px_30px_rgba(16,185,129,0.5)] transition-all duration-300 z-[60] flex items-center justify-center group"
        title="Open HudumaLink Assistant"
      >
        <div className="relative">
          <Sparkles className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300 animate-pulse" />
          <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 right-6 w-[350px] sm:w-[400px] h-[550px] bg-white dark:bg-neutral-900 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[60] flex flex-col overflow-hidden border border-gray-100 dark:border-neutral-800"
          >
            {/* Header with glowing gradient & active AI look */}
            <div className="p-4 bg-gradient-to-r from-primary via-emerald-950 to-neutral-900 text-white flex justify-between items-center relative overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_70%)] pointer-events-none" />
              <div className="flex items-center space-x-3 relative z-10">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-tr from-primary to-emerald-800 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/10 ring-2 ring-white/10">
                    <Sparkles className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-primary"></span>
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                    HudumaLink Assistant
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-mono uppercase tracking-wider font-extrabold scale-90">LIVE</span>
                  </h3>
                  <p className="text-[10px] text-gray-300 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                    Always online
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors relative z-10 text-white/85 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Disclaimer */}
            <div className="bg-yellow-50 dark:bg-yellow-900/10 px-4 py-2 text-[10px] text-yellow-800 dark:text-yellow-200 border-b border-yellow-100 dark:border-yellow-900/20 flex items-center shrink-0">
              <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-amber-500 flex-shrink-0" />
              <span>Escrow Assistant: Avoid carrying out off-platform transactions to protect your funds.</span>
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-hide bg-gray-50/50 dark:bg-neutral-950/20">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex items-end space-x-2 animate-fadeIn", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  {msg.role === 'model' && (
                    <div className="w-7 h-7 bg-gradient-to-tr from-primary to-emerald-900 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border border-emerald-550/10 mb-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[80%] p-3.5 rounded-2xl text-[13px] leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-primary text-white rounded-br-none shadow-md shadow-primary/5" 
                      : "bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm border border-neutral-100 dark:border-neutral-800"
                  )}>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Custom Typing Indicator State */}
              {isLoading && (
                <div className="flex items-end space-x-2 animate-pulse">
                  <div className="w-7 h-7 bg-gradient-to-tr from-primary to-emerald-900 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border border-emerald-550/10">
                    <Sparkles className="w-3.5 h-3.5 text-white animate-spin" />
                  </div>
                  <div className="bg-white dark:bg-neutral-800 p-3.5 rounded-2xl rounded-bl-none shadow-sm border border-neutral-100 dark:border-neutral-800 flex items-center space-x-2">
                    <div className="flex space-x-1.5 items-center">
                      <span className="w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-bounce"></span>
                    </div>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-semibold tracking-wide uppercase">Assistant is typing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-4 bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 flex space-x-2 shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about M-Pesa limits, escrow security..."
                className="flex-grow px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary transition-all text-sm placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-3 bg-gradient-to-tr from-primary to-emerald-600 text-white rounded-xl hover:scale-105 hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center shrink-0 shadow-md shadow-primary/10"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Helper for conditional classes
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
