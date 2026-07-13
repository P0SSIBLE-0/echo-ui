"use client";

import { motion, useMotionValue, useTransform, animate } from "motion/react";
import React, { useRef } from "react";
import { X, Heart, Star } from "lucide-react";

interface CardItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  rating: string;
  image: string;
}

interface StackedCardsProps {
  items?: CardItem[];
  onSwipe?: (item: CardItem, direction: "left" | "right") => void;
  className?: string;
}

const DEFAULT_CARDS: CardItem[] = [
  { id: "1", title: "Yosemite Valley", subtitle: "California, USA", category: "Nature", rating: "4.9", image: "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=600&q=80" },
  { id: "2", title: "Swiss Alps", subtitle: "Zermatt, Switzerland", category: "Adventure", rating: "4.8", image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80" },
  { id: "3", title: "Santorini Sunset", subtitle: "Cyclades, Greece", category: "Culture", rating: "4.7", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80" },
  { id: "4", title: "Amazon Wilderness", subtitle: "Amazon Basin, Brazil", category: "Nature", rating: "4.6", image: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=600&q=80" },
  { id: "5", title: "Kyoto Gardens", subtitle: "Kyoto, Japan", category: "Culture", rating: "4.9", image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=80" },
];

export function StackedCards({
  items = DEFAULT_CARDS,
  onSwipe,
  className = "",
}: StackedCardsProps) {
  const [cards, setCards] = React.useState<CardItem[]>(items);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);

  const likeOpacity = useTransform(x, [0, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-120, 0], [1, 0]);

  const isSwipingRef = useRef(false);

  const handleSwipe = (direction: "left" | "right") => {
    if (isSwipingRef.current || cards.length === 0) return;
    isSwipingRef.current = true;

    const topCard = cards[0];
    const targetX = direction === "left" ? -450 : 450;

    if (onSwipe) onSwipe(topCard, direction);

    // Animate the top card off-screen first using a fast accelerating tween
    animate(x, targetX, { type: "tween", duration: 0.2, ease: [1, 0.3, 0.5, 1] }).then(() => {
      // Reset x to 0 BEFORE shifting cards so the new top card renders in center
      x.set(0);
      setCards((prev) => {
        if (prev.length === 0) return prev;
        const [first, ...rest] = prev;
        return [...rest, first];
      });
      isSwipingRef.current = false;
    });
  };

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 120;
    if (info.offset.x > threshold) {
      handleSwipe("right");
    } else if (info.offset.x < -threshold) {
      handleSwipe("left");
    } else {
      animate(x, 0, { type: "spring", stiffness: 280, damping: 25 });
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center w-full max-w-[420px] p-5 select-none ${className}`}>
      <div className="relative w-full h-[380px] flex justify-center items-center">
        {cards.length === 0 ? (
          <div className="text-zinc-400 font-sans text-sm font-medium">No more destinations…</div>
        ) : (
          cards
            .slice(0, 4)
            .reverse()
            .map((card, idx, arr) => {
              const isTop = idx === arr.length - 1;
              const stackPos = arr.length - 1 - idx;

              return (
                <motion.div
                  key={card.id}
                  drag={isTop ? "x" : false}
                  dragConstraints={{ left: -240, right: 240 }}
                  dragElastic={0.09}
                  onDragEnd={isTop ? handleDragEnd : undefined}
                  style={{
                    x: isTop ? x : 0,
                    rotate: isTop ? rotate : undefined,
                    zIndex: idx + 10,
                  }}
                  animate={{
                    scale: isTop ? 1 : 1 - stackPos * 0.05,
                    y: isTop ? 0 : stackPos * -14,
                    rotate: isTop ? 0 : stackPos * (idx % 2 === 0 ? 3 : -3),
                  }}
                  transition={{ type: "spring", stiffness: 280, damping: 25 }}
                  className="absolute w-[250px] h-fit bg-white border border-zinc-100 rounded-xl px-3 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.06)] cursor-grab active:cursor-grabbing flex flex-col justify-between overflow-hidden"
                >
                  {isTop && (
                    <>
                      <motion.div style={{ opacity: likeOpacity }} className="absolute top-4 left-4 border-2 border-emerald-500 text-emerald-500 font-bold uppercase text-xs tracking-widest px-2 py-0.5 rounded-sm rotate-[-10deg] z-20 pointer-events-none">Explore</motion.div>
                      <motion.div style={{ opacity: nopeOpacity }} className="absolute top-4 right-4 border-2 border-rose-500 text-rose-500 font-bold uppercase text-xs tracking-widest px-2 py-0.5 rounded-sm rotate-10 z-20 pointer-events-none">Skip</motion.div>
                    </>
                  )}

                  <div className="relative w-full h-[220px] rounded-md overflow-hidden shrink-0 mb-4">
                    <img src={card.image} alt={card.title} width={248} height={220} className="w-full h-full object-cover select-none pointer-events-none" loading="eager" />
                    <div className="absolute top-3 right-3 bg-zinc-950/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{card.category}</div>
                  </div>

                  <div className="flex flex-col mt-2 min-w-0 pr-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-sans font-semibold text-[15px] text-zinc-900 truncate tracking-tight">{card.title}</h3>
                      <div className="flex items-center gap-0.5 shrink-0 text-amber-500">
                        <Star size={12} fill="currentColor" strokeWidth={0} />
                        <span className="font-mono text-xs font-bold text-zinc-700">{card.rating}</span>
                      </div>
                    </div>
                    <p className="font-sans text-xs text-zinc-400 mt-0.5 truncate font-medium">{card.subtitle}</p>
                  </div>
                </motion.div>
              );
            })
        )}
      </div>

      {cards.length > 0 && (
        <div className="flex items-center gap-5 mt-6">
          <button
            type="button" onClick={() => handleSwipe("left")} aria-label="Skip destination"
            className="flex size-11 items-center justify-center rounded-full bg-zinc-50 border border-zinc-100 text-rose-500 shadow-sm transition-scale duration-200 hover:scale-110 hover:bg-rose-50 hover:border-rose-100 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 cursor-pointer"
          >
            <X size={18} strokeWidth={2.5} aria-hidden="true" />
          </button>

          <button
            type="button" onClick={() => handleSwipe("right")} aria-label="Explore destination"
            className="flex size-11 items-center justify-center rounded-full bg-zinc-950 text-white shadow-md transition-scale duration-200 hover:scale-110 hover:bg-zinc-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 cursor-pointer"
          >
            <Heart size={20} fill="currentColor" strokeWidth={0} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
