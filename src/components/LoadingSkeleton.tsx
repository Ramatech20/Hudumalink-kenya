import React from 'react';

interface LoadingSkeletonProps {
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ count = 6 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          id={`marketplace-skeleton-${i}`}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-pulse flex flex-col h-full max-h-[260px] sm:max-h-none"
        >
          {/* Media square container skeleton */}
          <div className="w-full aspect-square bg-slate-800" />
          
          {/* Content area skeleton */}
          <div className="p-3 flex flex-col justify-between flex-grow space-y-3">
            <div className="space-y-2">
              <div className="h-2.5 bg-slate-800 rounded w-1/3" />
              <div className="h-3.5 bg-slate-800 rounded w-5/6" />
              <div className="h-3.5 bg-slate-800 rounded w-2/3" />
            </div>
            <div className="flex justify-between items-center pt-2">
              <div className="h-4 bg-slate-800 rounded w-1/2" />
              <div className="h-7 bg-slate-800 rounded w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};
