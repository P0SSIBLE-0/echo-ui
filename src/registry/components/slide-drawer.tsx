"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export interface SlideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

export function SlideDrawer({
  isOpen,
  onClose,
  title = "Drawer Title",
  children,
  className,
}: SlideDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const spring = { type: "spring", damping: 28, stiffness: 290 } as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: .75 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            onClick={onClose}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm cursor-pointer z-10"
          />

          {/* Drawer Panel */}
          <motion.div
            key="drawer"
            initial={{ y: "120%" }}
            animate={{
              y: 0,
              height: isExpanded ? "90%" : "auto",
              borderRadius: "24px 24px 0px 0px",
            }}
            exit={{ y: "120%" }}
            transition={spring}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.1 }}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 250) {
                onClose();
                setIsExpanded(false);
              } else if (info.offset.y < -50 || info.velocity.y < -250) {
                setIsExpanded(true);
              }
            }}
            style={{ willChange: "transform", maxHeight: "100%" }}
            className={cn(
              "absolute bottom-0 left-0 right-0 z-20 bg-zinc-900 border-t border-zinc-800 text-zinc-100 shadow-[inset_0_10px_20px_-5px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.25)] overflow-y-auto",
              className
            )}
          >
            <div className="p-6">
              {/* Drag Handle */}
              <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-12 h-1.5 mx-auto mb-6 rounded-full bg-zinc-700/80 hover:bg-zinc-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] transition-colors cursor-grab active:cursor-grabbing"
              />

              {/* Header */}
              {title && (
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">{title}</h3>
                  <button
                    onClick={onClose}
                    className="text-sm text-zinc-500 hover:text-zinc-200 cursor-pointer transition-colors p-1"
                    aria-label="Close drawer"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div>{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default SlideDrawer;
