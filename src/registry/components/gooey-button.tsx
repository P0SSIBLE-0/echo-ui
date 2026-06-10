"use client";

import React, { useId, useMemo, useRef, useState, useEffect, useCallback } from "react";
import { motion, useMotionValue, useSpring, animate } from "motion/react";

export function GooeyButton() {
  const uniqueId = useId();
  const filterId = useMemo(() => `gooey-${uniqueId.replace(/:/g, "")}`, [uniqueId]);
  const jelloId = useMemo(() => `jello-${uniqueId.replace(/:/g, "")}`, [uniqueId]);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const displacementRef = useRef<SVGFEDisplacementMapElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const blobSize = 30;

  // Motion values for tracking cursor position and SVG displacement
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const displacementScale = useMotionValue(0);

  // Springs for smooth movement
  const x = useSpring(mouseX, { stiffness: 140, damping: 15 });
  const y = useSpring(mouseY, { stiffness: 140, damping: 15 });
  const scale = useSpring(0, { stiffness: 180, damping: 16 });

  // Direct DOM binding for displacement scale changes (zero React re-renders)
  useEffect(() => {
    return displacementScale.on("change", (latest) => {
      if (displacementRef.current) {
        displacementRef.current.scale.baseVal = latest;
      }
    });
  }, [displacementScale]);

  // Calculate the center point of the parent container
  const getCenterCoordinates = () => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: rect.width / 2 - blobSize / 2,
      y: rect.height / 2 - blobSize / 2,
    };
  };

  // Scoped mouse move handler (only fires within container, not globally)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isPressed || !containerRef.current) return;
    // Cache rect on move to avoid layout thrashing
    if (!rectRef.current) {
      rectRef.current = containerRef.current.getBoundingClientRect();
    }
    const rect = rectRef.current;
    mouseX.set(e.clientX - rect.left - blobSize / 2);
    mouseY.set(e.clientY - rect.top - blobSize / 2);
    scale.set(1);
  }, [isPressed, mouseX, mouseY, scale]);

  const handleMouseEnter = useCallback(() => {
    // Refresh cached rect on enter (handles scroll/resize)
    if (containerRef.current) {
      rectRef.current = containerRef.current.getBoundingClientRect();
    }
    scale.set(1);
  }, [scale]);

  const handleMouseLeave = useCallback(() => {
    scale.set(0);
    rectRef.current = null;
  }, [scale]);

  // Global mouseup handler (needed for drag release outside container)
  useEffect(() => {
    const handleMouseUp = () => setIsPressed(false);
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const handleMouseDown = () => {
    setIsPressed(true);
    const center = getCenterCoordinates();
    mouseX.set(center.x);
    mouseY.set(center.y);
    scale.set(0);

    // Trigger the jello click distortion animation
    animate(displacementScale, [0, 24, -34, 24, -14, 0], {
      duration: 0.6,
      ease: "easeInOut",
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-[500px] h-[400px] flex items-center justify-center select-none bg-gray-100 rounded-md overflow-hidden border border-border-soft/60 group"
    >
      {/* SVG Filters */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Gooey filter for blending drop & background shape */}
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" />
          </filter>

          {/* Jello filter for click feedback distortion */}
          <filter id={jelloId} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="8" result="noise" />
            <feDisplacementMap
              ref={displacementRef}
              in="SourceGraphic"
              in2="noise"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Layer 1: Background containing the button base and gooey cursor-following blob */}
      <div
        className="absolute inset-0 pointer-events-none select-none z-0"
        style={{ filter: `url(#${filterId})` }}
      >
        {/* Base button shape (centered in container) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-12 rounded-full bg-black transition-transform duration-300 group-hover:scale-[1.025]" />

        {/* Gooey blob following the cursor */}
        <motion.div
          className="absolute rounded-full pointer-events-none bg-black"
          style={{
            width: blobSize,
            height: blobSize,
            left: 0,
            top: 0,
            x,
            y,
            scale,
          }}
        />
      </div>

      {/* Layer 2: Transparent interactive button with Jello wobble filter */}
      <motion.div
        className="relative z-10"
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        <button
          ref={buttonRef}
          type="button"
          onMouseDown={handleMouseDown}
          style={{ filter: `url(#${jelloId})` }}
          className="relative z-10 w-44 h-12 rounded-full bg-transparent text-sm font-semibold text-white transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="relative z-10 block transition-transform duration-300 group-hover:scale-[1.02]">
            Buy Now
          </span>
        </button>
      </motion.div>
    </div>
  );
}
