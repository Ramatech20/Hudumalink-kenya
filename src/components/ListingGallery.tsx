import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Maximize2, X, Image as ImageIcon, Play, Pause } from 'lucide-react';
import { cn } from '../lib/utils';

interface ListingGalleryProps {
  images: string[];
  title: string;
}

export function ListingGallery({ images, title }: ListingGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(4000); // Default 4 seconds per slide

  const galleryImages = images && images.length > 0 
    ? images 
    : ['https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80'];

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  // Autoplay handler: clears status when paused or when images update, resets whenever activeIndex changes
  useEffect(() => {
    if (!isPlaying || galleryImages.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
    }, speed);

    return () => clearInterval(timer);
  }, [isPlaying, galleryImages.length, speed, activeIndex]);

  return (
    <div className="space-y-4">
      {/* Primary Display Monitor */}
      <div 
        id="gallery-monitor-viewport"
        className="relative aspect-video w-full rounded-[2rem] overflow-hidden border border-slate-800 bg-slate-900 group cursor-zoom-in"
        onClick={() => setIsFullscreen(true)}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIndex}
            src={galleryImages[activeIndex]}
            alt={`${title} - view ${activeIndex + 1}`}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="w-full h-full object-cover select-none"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>

        {/* Ambient Overlay Vignette */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none" />

        {/* Dynamic Slideshow Progress Bar */}
        {isPlaying && galleryImages.length > 1 && (
          <motion.div
            key={`${activeIndex}-${isPlaying}-${speed}`}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: speed / 1000, ease: 'linear' }}
            className="absolute bottom-0 left-0 h-1 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] z-10 pointer-events-none"
          />
        )}

        {/* Zoom Trigger Button Overlay */}
        <button
          onClick={(e) => { e.stopPropagation(); setIsFullscreen(true); }}
          className="absolute top-4 right-4 p-3 rounded-xl bg-slate-950/80 hover:bg-slate-900 backdrop-blur border border-slate-800 text-slate-300 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-xl"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Image index counter tag */}
        <div className="absolute bottom-4 left-4 px-3.5 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur border border-slate-800/80 text-[10px] font-mono font-black text-emerald-400 tracking-wider uppercase select-none flex items-center gap-1.5">
          <ImageIcon className="w-3 h-3 text-slate-400" />
          <span>{activeIndex + 1} / {galleryImages.length} VIEWS</span>
        </div>

        {/* Embedded Autoplay Slideshow controls footer right */}
        {galleryImages.length > 1 && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            {/* Speed toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSpeed((prev) => (prev === 3000 ? 5000 : prev === 5000 ? 8000 : 3000));
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800/80 text-[10px] font-mono font-black text-slate-300 hover:text-white transition-all backdrop-blur uppercase"
              title="Change Slideshow Speed"
            >
              SPEED: {speed / 1000}S
            </button>

            {/* Play / Pause toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPlaying(!isPlaying);
              }}
              className={cn(
                "px-3 py-1.5 rounded-xl border backdrop-blur text-[10px] font-mono font-black tracking-wider uppercase flex items-center gap-1.5 transition-all outline-none",
                isPlaying
                  ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30"
                  : "bg-slate-950/80 border-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-900"
              )}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>PLAYING</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-slate-400" />
                  <span>SLIDESHOW</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Lateral arrow handles (visible on hovered displays) */}
        {galleryImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-slate-950/80 hover:bg-slate-900 backdrop-blur border border-slate-800 text-slate-300 hover:text-white transition-all xl:opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-slate-950/80 hover:bg-slate-900 backdrop-blur border border-slate-800 text-slate-300 hover:text-white transition-all xl:opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails row strip previewer */}
      {galleryImages.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          {galleryImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative w-20 sm:w-24 aspect-video rounded-xl overflow-hidden border-2 bg-slate-900 transition-all focus:outline-none shrink-0",
                activeIndex === i 
                  ? "border-emerald-500 scale-[0.98] shadow-md shadow-emerald-900/10" 
                  : "border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-700"
              )}
            >
              <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </button>
          ))}
        </div>
      )}

      {/* High-fidelity Fullscreen Modal Lightbox */}
      <AnimatePresence>
        {isFullscreen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={() => setIsFullscreen(false)}
            />

            {/* Upper control header */}
            <div className="absolute top-0 inset-x-0 p-5 flex items-center justify-between text-white z-10 bg-gradient-to-b from-black/60 to-transparent">
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-slate-400">
                {title} — View {activeIndex + 1} of {galleryImages.length}
              </span>
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-full text-slate-300 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Slide Navigation */}
            <div className="relative w-full max-w-5xl aspect-video mx-4 z-10 flex items-center justify-center">
              <img 
                src={galleryImages[activeIndex]} 
                alt="" 
                className="max-h-[80vh] max-w-full object-contain rounded-2xl border border-slate-800 shadow-2xl" 
                referrerPolicy="no-referrer"
              />

              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-4 p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-850 text-white border border-slate-800 transition-all hover:scale-105"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-4 p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-850 text-white border border-slate-800 transition-all hover:scale-105"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
