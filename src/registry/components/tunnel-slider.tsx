"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useRef, useMemo } from "react";
import { useAnimationFrame } from "motion/react";

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1545167622-3a6ac756afa4?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1471922694854-ff1b63b20054?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=600",
];

// Pre-calculated coordinates for elliptical positioning (radiusX = 450, radiusY = 350)
const POSITIONS = [
  { x: 0, y: -350 },
  { x: 450, y: 0 },
  { x: 0, y: 350 },
  { x: -450, y: 0 },
];

export function TunnelSlider({
  images = DEFAULT_IMAGES,
  scrollSpeed = 1.5,
  layerGap = 2500,
  lerp = 0.05,
}) {
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const targetScroll = useRef(0);
  const currentScroll = useRef(0);
  const touchStartY = useRef<number | null>(null);

  // Configuration Math
  const { contentLayerCount, totalLayerCount, tunnelDepth, visibleDepth } = useMemo(() => {
    const contentLayers = Math.ceil(images.length / 4);
    const totalLayers = Math.max(contentLayers, 6);
    return {
      contentLayerCount: contentLayers,
      totalLayerCount: totalLayers,
      tunnelDepth: totalLayers * layerGap,
      visibleDepth: 3 * layerGap,
    };
  }, [images.length, layerGap]);

  // Framer Motion Animation Loop for high-performance transforms
  useAnimationFrame(() => {
    // Lerp scroll position for smooth deceleration
    currentScroll.current += (targetScroll.current - currentScroll.current) * lerp;

    layerRefs.current.forEach((element, i) => {
      if (!element) return;

      const baseZ = -i * layerGap;
      let z = baseZ + currentScroll.current;

      // Infinite Tunnel Wrapping Logic
      z = ((((z + visibleDepth) % tunnelDepth) + tunnelDepth) % tunnelDepth) - visibleDepth;

      // Calculate Overlay Opacity and Visibility based on depth
      const isVisible = z <= layerGap && z >= -visibleDepth;
      const overlayOpacity = isVisible
        ? z > 0 ? z / layerGap : (z / visibleDepth) ** 2
        : 1;

      // Apply transforms directly for maximum performance
      element.style.transform = `translateZ(${z}px)`;
      element.style.visibility = isVisible ? "visible" : "hidden";
      element.style.setProperty("--overlay", String(overlayOpacity));
    });
  });

  return (
    <section
      onWheel={(e) => {
        targetScroll.current += e.deltaY * scrollSpeed;
      }}
      onTouchStart={(e) => {
        if (e.touches[0]) touchStartY.current = e.touches[0].clientY;
      }}
      onTouchMove={(e) => {
        if (touchStartY.current !== null && e.touches[0]) {
          const deltaY = touchStartY.current - e.touches[0].clientY;
          targetScroll.current += deltaY * scrollSpeed;
          touchStartY.current = e.touches[0].clientY;
        }
      }}
      onTouchEnd={() => {
        touchStartY.current = null;
      }}
      className="relative w-full h-dvh bg-black overflow-hidden perspective-[1000px] rounded-md border border-border-soft/60 select-none"
    >
      {/* Scroll instructions overlay */}
      <div className="absolute top-6 left-6 z-20 text-white/50 font-mono text-xs pointer-events-none">
        SCROLL / SWIPE TO NAVIGATE TUNNEL
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform-3d">
        {Array.from({ length: totalLayerCount }).map((_, i) => {
          const imageStartIndex = (i % contentLayerCount) * 4;

          return (
            <div
              key={i}
              ref={(el) => {
                layerRefs.current[i] = el;
              }}
              className="absolute top-0 left-0 transform-3d"
            >
              {Array.from({ length: 4 }).map((_, j) => {
                const imageNumber = imageStartIndex + j;
                if (imageNumber >= images.length) return null;

                const { x, y } = POSITIONS[j];

                return (
                  <div
                    key={j}
                    className="absolute w-[300px] h-[400px] -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                    }}
                  >
                    <img
                      src={images[imageNumber]}
                      alt={`Tunnel layer ${i} item ${j}`}
                      className="w-full h-full object-cover rounded-xl shadow-2xl border border-white/10"
                      loading="lazy"
                    />
                    {/* Black fade overlay controlled by CSS variable */}
                    <div
                      className="absolute inset-0 bg-black pointer-events-none rounded-xl"
                      style={{ opacity: "var(--overlay, 0)" }}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default TunnelSlider;
