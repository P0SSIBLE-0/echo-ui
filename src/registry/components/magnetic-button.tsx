"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

interface MagneticButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

// Hoist static spring config to avoid object recreation on every render
const SPRING_CONFIG = { damping: 15, stiffness: 150, mass: 0.1 };

export default function MagneticButton({
  children = "Magnetic",
  onClick,
  className = "",
}: MagneticButtonProps) {
  const boundingRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);

  // Active motion values for tracking coordinate offsets
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth spring dynamics for the button wrapper
  const springX = useSpring(x, SPRING_CONFIG);
  const springY = useSpring(y, SPRING_CONFIG);

  // Passive parallax transform scales to avoid creating additional springs
  const springTextX = useTransform(springX, (val) => val * 0.5);
  const springTextY = useTransform(springY, (val) => val * 0.5);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Cache bounding rect on first mouse move/enter to prevent layout thrashing
    if (!rectRef.current) {
      if (!boundingRef.current) return;
      rectRef.current = boundingRef.current.getBoundingClientRect();
    }

    const { clientX, clientY } = e;
    const { width, height, left, top } = rectRef.current;

    const centerPointX = clientX - (left + width / 2);
    const centerPointY = clientY - (top + height / 2);

    x.set(centerPointX * 0.3);
    y.set(centerPointY * 0.3);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    rectRef.current = null; // Clear cache on leave so resize/scroll works next time
  };

  return (
    <div
      ref={boundingRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative inline-flex items-center justify-center cursor-pointer"
    >
      {/* Dashed outer border on hover */}
      <div className="absolute inset-0 z-0 rounded-full border-2 border-dashed border-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-40 bg-blue-500/40" />

      {/* Outer Button */}
      <motion.button
        onClick={onClick}
        style={{ x: springX, y: springY }}
        className={`relative z-10 flex items-center justify-center rounded-full px-5 py-2 font-medium text-white transition-colors 
          bg-linear-to-b from-sky-400 to-blue-600 hover:from-sky-500 hover:to-blue-700 
          shadow-[inset_0px_-2px_4px_rgba(0,0,0,0.3),inset_0px_2px_4px_rgba(255,255,255,0.4)]
          ${className}`}
      >
        {/* Parallax inner content */}
        <motion.span
          style={{ x: springTextX, y: springTextY }}
          className="relative z-10 block pointer-events-none drop-shadow-sm"
        >
          {children}
        </motion.span>
      </motion.button>
    </div>
  );
}
