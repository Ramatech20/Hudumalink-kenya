import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ShoppingCart, Zap, Briefcase, Phone, MessageCircle, Heart, Share2, HelpCircle, ArrowRight, Loader2, Sparkles, Flag } from 'lucide-react';
import { formatPrice } from '../lib/utils';
import { Listing, User, Transaction } from '../types';
import { cn } from '../lib/utils';

interface StickyPurchasePanelProps {
  listing: Listing;
  author: User | null;
  user: any;
  transaction: Transaction | null;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
  onAddToCart: () => void;
  onEscrowPayment: () => void;
  processingPayment: boolean;
  onConfirmDelivery: () => void;
  onShowDisputeModal: () => void;
  onShowManageModal: () => void;
  onShowReportModal: () => void;
  t: (key: string) => string;
}

export function StickyPurchasePanel({
  listing,
  author,
  user,
  transaction,
  isFavorited,
  onToggleFavorite,
  onShare,
  onAddToCart,
  onEscrowPayment,
  processingPayment,
  onConfirmDelivery,
  onShowDisputeModal,
  onShowManageModal,
  onShowReportModal,
  t
}: StickyPurchasePanelProps) {
  const isAuthor = user && user.uid === listing.authorId;
  const isProduct = listing.type === 'product';

  const discountPercent = listing.originalPrice && listing.price && listing.originalPrice > listing.price
    ? Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)
    : 0;

  return (
    <div id="sticky-checkout-hub" className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Price Display Block */}
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-mono font-bold tracking-widest uppercase text-slate-400">INVESTMENT</span>
        <div className="text-right">
          {discountPercent > 0 ? (
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-500 line-through font-mono">
                {formatPrice(listing.originalPrice!)}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="bg-red-500/10 text-red-400 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                  -{discountPercent}% OFF
                </span>
                <span className="text-2xl font-black text-emerald-400 tracking-tight">
                  {formatPrice(listing.price || 0)}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-2xl font-black text-emerald-400 tracking-tight">
              {listing.price ? formatPrice(listing.price) : t('listings.contact_price')}
            </span>
          )}
        </div>
      </div>

      <hr className="border-slate-800" />

      {/* Escrow Status Indicator Banner / Milestones */}
      {transaction ? (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">TRANSACTION STATUS</span>
            <div className={cn(
              "px-2.5 py-1 rounded-lg text-[9px] font-mono font-extrabold uppercase",
              transaction.status === 'pending' && "bg-amber-500/10 text-amber-400 border border-amber-500/20",
              transaction.status === 'deposited' && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
              transaction.status === 'released' && "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
              transaction.status === 'disputed' && "bg-rose-500/10 text-rose-400 border border-rose-500/20",
              transaction.status === 'cancelled' && "bg-slate-800 text-slate-400 border border-slate-700"
            )}>
              {transaction.status}
            </div>
          </div>
          
          <div className="text-xs text-slate-300 font-medium">
            {transaction.status === 'pending' && (
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>M-Pesa validation in progress...</span>
              </div>
            )}
            {transaction.status === 'deposited' && (
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Funds secured in HudumaLink Escrow.</span>
              </div>
            )}
            {transaction.status === 'released' && (
              <span>Deal finalized. Seller paid successfully.</span>
            )}
            {transaction.status === 'disputed' && (
              <span>Dispute raised. Staff investigators arbitrating.</span>
            )}
          </div>
        </div>
      ) : (
        /* Guaranteed Escrow Protection Card */
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">HUDUMALINK SHIELD PROTECTED</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Funds are held safely in escrow. Money is only transferred to the vendor once you inspect and approve the outcome.
            </p>
          </div>
        </div>
      )}

      {/* Primary Contextual Engagement Handles */}
      <div className="space-y-3">
        {isAuthor ? (
          /* Merchant view widgets */
          <div className="space-y-2.5">
            <Link 
              to={`/promote/${listing.id}`}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-xs tracking-wider uppercase transition-all shadow-lg hover:shadow-emerald-500/10 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>BOOST LISTING RETENTION</span>
            </Link>
            <button 
              onClick={onShowManageModal}
              className="w-full py-4 bg-slate-800 hover:bg-slate-705 text-slate-200 hover:text-white border border-slate-700 rounded-2xl font-bold text-xs uppercase transition-all flex items-center justify-center gap-2"
            >
              <span>MANAGE LISTING SETTINGS</span>
            </button>
          </div>
        ) : (
          /* Buyer/End-user interaction suite */
          <div className="space-y-2.5">
            {!transaction ? (
              <>
                {/* Immediate Escape CTA Actions list */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={onAddToCart}
                    className="py-4 bg-slate-800 hover:bg-slate-75 * text-slate-250 border border-slate-700 hover:border-slate-600 rounded-2xl font-bold text-xs tracking-wide uppercase transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>ADD TO CART</span>
                  </button>

                  <button
                    onClick={onEscrowPayment}
                    disabled={processingPayment || listing.status !== 'active'}
                    className="py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-xs tracking-wider uppercase transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/10"
                  >
                    {processingPayment ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    ) : isProduct ? (
                      <Zap className="w-4 h-4 fill-slate-950" />
                    ) : (
                      <Briefcase className="w-4 h-4" />
                    )}
                    <span>{isProduct ? 'BUY INSTANTLY' : 'HIRE INSTANTLY'}</span>
                  </button>
                </div>
              </>
            ) : (
              /* If transaction is open but not confirmed released */
              transaction.status === 'deposited' && (
                <div className="space-y-2">
                  <button 
                    onClick={onConfirmDelivery}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/10"
                  >
                    <span>CONFIRM DELIVERY & RELEASE FUNDS</span>
                  </button>
                  <button 
                    onClick={onShowDisputeModal}
                    className="w-full py-3.5 bg-slate-950 hover:bg-slate-900 border border-red-500/20 text-red-400 rounded-2xl font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <span>RAISE TRANSACTION DISPUTE</span>
                  </button>
                </div>
              )
            )}

            {/* General Direct Messenger / Mobile communication row */}
            <div className="grid grid-cols-2 gap-2.5">
              <a 
                href={`tel:${listing.contact.phone}`}
                className="py-3.5 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl font-bold text-xs tracking-wide uppercase transition-all flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>CALL PROVIDER</span>
              </a>
              <Link 
                to={user ? `/messages?listingId=${listing.id}` : '/auth'}
                className="py-3.5 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl font-bold text-xs tracking-wide uppercase transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>CHAT LIVE</span>
              </Link>
            </div>

            {/* Special WhatsApp Contact */}
            {listing.contact.whatsapp && (
              <a 
                href={`https://wa.me/${listing.contact.whatsapp.replace(/\+/g, '')}?text=Hi,%20I'm%20interested%20in%20your%20HudumaLink%20listing:%20${encodeURIComponent(listing.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs uppercase transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M12.004 0C5.372 0 0 5.372 0 12.004c0 2.116.549 4.11 1.612 5.855L.05 24l6.302-1.654a11.97 11.97 0 005.652 1.41h.005c6.629 0 12.001-5.372 12.001-12.004C24.01 5.372 18.636 0 12.004 0zm6.986 16.92c-.287.808-1.42 1.492-2.193 1.583-.726.084-1.658.127-2.68-.198-1.023-.325-2.028-.868-2.914-1.496a15.828 15.828 0 01-3.69-3.692C6.91 12.222 6.38 11.196 6.07 10.155c-.31-.1-.314-.085-.314-.085-.357-1.157.34-1.928.895-2.484l.654-.654c.154-.154.346-.226.544-.226.2 0 .393.072.544.226l1.35 1.35c.154.154.226.346.226.544 0 .2-.072.392-.226.544l-.454.454c-.112.112-.132.278-.052.41a6.602 6.602 0 001.378 1.83 6.577 6.577 0 001.83 1.378c.133.08.3.06.411-.052l.455-.455c.153-.153.345-.226.544-.226s.39.073.543.226l1.35 1.35c.154.154.226.346.226.544 0 .198-.073.39-.227.544l-.35.35c-.092.1-.219.145-.347.118z"/>
                </svg>
                <span>OPEN WHATSAPP ENGAGEMENT</span>
              </a>
            )}
          </div>
        )}
      </div>

      <hr className="border-slate-800" />

      {/* Auxiliary Actions list (Favorites, Copying Link, Flagging) */}
      <div className="flex items-center justify-between text-xs font-mono">
        <button
          onClick={onToggleFavorite}
          className="flex items-center gap-1.5 text-slate-400 hover:text-rose-400 transition-colors uppercase font-bold"
        >
          <Heart className={cn("w-4 h-4", isFavorited ? "fill-rose-500 text-rose-500" : "")} />
          <span>{isFavorited ? 'SAVED' : 'SAVE LISTING'}</span>
        </button>

        <button
          onClick={onShare}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors uppercase font-bold"
        >
          <Share2 className="w-4 h-4" />
          <span>SHARE</span>
        </button>

        {!isAuthor && user && (
          <button
            onClick={onShowReportModal}
            className="flex items-center gap-1.5 text-slate-500 hover:text-red-400 transition-colors uppercase font-bold"
          >
            <Flag className="w-3.5 h-4" />
            <span>REPORT</span>
          </button>
        )}
      </div>

      {listing.deliveryInfo?.deliveryTimeFrame && (
        <p className="text-[10px] text-center text-slate-500 font-mono tracking-wide uppercase">
          ★ Guaranteed Delivery Frame: {listing.deliveryInfo.deliveryTimeFrame}
        </p>
      )}
    </div>
  );
}
