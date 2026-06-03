import React from 'react';
import { ShieldAlert, ShieldCheck, Play, ArrowRight, UserCheck, Sparkles, Receipt, Coins } from 'lucide-react';
import { cn } from '../lib/utils';
import { TransactionStatus } from '../types';

interface EscrowTimelineProps {
  currentStatus?: TransactionStatus;
}

export function EscrowTimeline({ currentStatus = 'deposited' }: EscrowTimelineProps) {
  // Define sequence steps
  const steps = [
    {
      id: 1,
      title: 'Payment Secured',
      desc: 'Buyer pays through M-Pesa. Funds held in HudumaLink escrow.',
      icon: Receipt,
      triggerStatuses: ['deposited', 'released', 'disputed']
    },
    {
      id: 2,
      title: 'Work Commenced',
      desc: 'Seller is notified to start work/shipping safely.',
      icon: Play,
      triggerStatuses: ['deposited', 'released', 'disputed']
    },
    {
      id: 3,
      title: 'Milestone Submitted',
      desc: 'Provider delivers product or declares service completion.',
      icon: Sparkles,
      triggerStatuses: ['released']
    },
    {
      id: 4,
      title: 'Buyer Review',
      desc: 'Client inspects the delivery for total quality and compliance.',
      icon: UserCheck,
      triggerStatuses: ['released']
    },
    {
      id: 5,
      title: 'Trust Released',
      desc: 'Client confirms outcome. Funds released instantly next-day.',
      icon: Coins,
      triggerStatuses: ['released']
    }
  ];

  return (
    <div className="bg-slate-900 border border-slate-850 rounded-[2.5rem] p-8 space-y-8 shadow-xl">
      {/* Upper Title and security badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>FINTECH SECURE ESCROW TRANSACTION PIPELINE</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every transaction is safeguarded by strict state regulatory guidelines holding security buffers.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 self-start sm:self-auto text-[10px] font-mono font-black text-emerald-400 tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>ESCROW TRUSTEE LICENSED</span>
        </div>
      </div>

      {/* Steps Horizontal Sequence List */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
        {steps.map((step, idx) => {
          // Check step state
          const isCompleted = step.triggerStatuses.includes(currentStatus || '');
          const isActive = idx === 0 && currentStatus === 'pending' || 
                           idx === 2 && currentStatus === 'deposited' ||
                           idx === 4 && currentStatus === 'released';

          const StepIcon = step.icon;

          return (
            <div key={step.id} className="relative group flex flex-col items-center text-center space-y-4">
              {/* Connector line (Desktop only) */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-7 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-slate-800 to-slate-800 group-hover:from-emerald-999 z-0">
                  <div className={cn(
                    "h-full bg-emerald-500 transition-all duration-500",
                    isCompleted ? "w-full" : "w-0"
                  )} />
                </div>
              )}

              {/* Step Circle Bubble */}
              <div className={cn(
                "relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-300",
                isCompleted 
                  ? "border-emerald-500 bg-slate-950 text-emerald-400 shadow-lg shadow-emerald-500/10 scale-105" 
                  : isActive 
                    ? "border-amber-500 bg-slate-950 text-amber-400 shadow-lg shadow-amber-500/10 scale-105 animate-pulse" 
                    : "border-slate-800 bg-slate-900 text-slate-500"
              )}>
                <StepIcon className="w-5 h-5" />
                
                {/* Circular Mini Step Index Counter Tag */}
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-lg bg-slate-950 border border-slate-800 text-[9px] font-mono font-black flex items-center justify-center">
                  0{step.id}
                </span>
              </div>

              {/* Informative Text descriptors */}
              <div className="space-y-1 px-2.5">
                <h4 className={cn(
                  "text-xs font-black uppercase tracking-wider",
                  isCompleted ? "text-emerald-400" : isActive ? "text-amber-400" : "text-slate-400"
                )}>
                  {step.title}
                </h4>
                <p className="text-[10px] text-slate-500 leading-relaxed max-w-[180px] mx-auto">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Escrow Disclaimer notification */}
      {currentStatus === 'disputed' && (
        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex items-start gap-3 animate-pulse">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">SECURE ESCROW ON HOLD DUE TO DISPUTE</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Funds are safely locked in trustee accounts. Please upload clear receipts, chats, photos or other proof. Staff is analyzing files to issue the final resolution.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
