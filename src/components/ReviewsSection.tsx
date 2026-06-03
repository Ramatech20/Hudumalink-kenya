import React, { useState } from 'react';
import { Star, ShieldCheck, Heart, Trash2, Send, Loader2, Award, ThumbsUp, MessageSquare } from 'lucide-react';
import { Review, User } from '../types';
import { formatDate } from '../lib/utils';
import { cn } from '../lib/utils';

interface ReviewsSectionProps {
  reviews: Review[];
  user: any;
  authorId: string;
  hasCompletedTransaction: boolean;
  onLeaveReview: (rating: number, comment: string) => Promise<void>;
  reviewing: boolean;
  t: (key: string) => string;
}

export function ReviewsSection({
  reviews,
  user,
  authorId,
  hasCompletedTransaction,
  onLeaveReview,
  reviewing,
  t
}: ReviewsSectionProps) {
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');

  // Calculate Average Rating & Counts
  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 'New';

  // Compute tier distributions
  const starsBreakdown = [5, 4, 3, 2, 1].map((star) => {
    const matchingCount = reviews.filter((r) => r.rating === star).length;
    const percentage = reviews.length > 0 ? (matchingCount / reviews.length) * 100 : 0;
    return { star, count: matchingCount, percentage };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await onLeaveReview(newRating, newComment);
    setNewComment('');
  };

  return (
    <div id="ratings-and-proof-hub" className="bg-slate-900 border border-slate-850 rounded-[2.5rem] p-8 space-y-8 shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-slate-150 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500 fill-current" />
          <span>REAL BUYER TRUST & EXPERIENCES</span>
        </h3>
        <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-widest">{reviews.length} VERIFIED TRADES</span>
      </div>

      {/* Ratings Summary Grid Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-slate-950 p-6 rounded-3xl border border-slate-800">
        {/* Big Average Star */}
        <div className="text-center space-y-2 py-4 md:border-r border-slate-800">
          <h4 className="text-5xl font-black text-slate-100 font-mono tracking-tighter">
            {averageRating}
          </h4>
          <div className="flex justify-center text-yellow-500 gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star 
                key={s} 
                className={cn(
                  "w-4 h-4", 
                  Number(averageRating) >= s ? "fill-current" : "opacity-30"
                )} 
              />
            ))}
          </div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">HudumaLink Trade Index</p>
        </div>

        {/* Linear Distribution Bars */}
        <div className="md:col-span-2 space-y-2.5">
          {starsBreakdown.map(({ star, count, percentage }) => (
            <div key={star} className="flex items-center gap-3 text-xs">
              <span className="w-12 text-slate-400 font-mono font-bold shrink-0">{star} STARS</span>
              <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-8 text-slate-500 text-right font-mono font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Leave Review Form */}
      {user && user.uid !== authorId && hasCompletedTransaction && (
        <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-5">
          <h4 className="text-xs font-mono font-black text-slate-300 uppercase tracking-wider">Leave a Verified Review</h4>
          
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setNewRating(star)}
                className={cn(
                  "p-1 rounded-lg transition-transform hover:scale-110",
                  star <= newRating ? "text-yellow-500" : "text-slate-600"
                )}
              >
                <Star className={cn("w-6 h-6", star <= newRating ? "fill-current" : "")} />
              </button>
            ))}
            <span className="text-xs font-mono text-slate-400 ml-2">Rating Code: {newRating} / 5</span>
          </div>

          <div className="relative">
            <textarea
              required
              rows={3}
              placeholder="Describe your trade experience. Did the provider deliver exactly according to specifications?"
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-700 transition-colors"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={reviewing}
            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2"
          >
            {reviewing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>SUBMIT VERIFIED REVIEW</span>
          </button>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex justify-center text-yellow-500 gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      className={cn(
                        "w-3 h-3", 
                        review.rating >= s ? "fill-current" : "opacity-20"
                      )} 
                    />
                  ))}
                </div>
                <span className="text-[10px] font-mono font-medium text-slate-500">{formatDate(review.createdAt)}</span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed italic">
                "{review.comment}"
              </p>

              <div className="flex items-center gap-2">
                <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-mono font-semibold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>VERIFIED HUDUMALINK CLIENT</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-slate-500 font-medium text-xs font-mono uppercase">
            NO CLIENT EXPERIENCES REPORTED YET.
          </div>
        )}
      </div>
    </div>
  );
}
