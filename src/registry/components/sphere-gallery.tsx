"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Define the shape of each image card
export type SphereImage = {
  id: string;
  url: string;
  title: string;
  description: string;
};

export interface SphereGalleryProps {
  images?: SphereImage[];
  autoRotate?: boolean;
  className?: string;
}

// 15 curated high-quality, crisp Unsplash images formatted compactly to save lines of code
const DEFAULT_IMAGES: SphereImage[] = [
  { id: "img-1", url: "https://images.unsplash.com/photo-1547447134-cd3f5c716030?q=80&w=600&auto=format&fit=crop", title: "Trucks & Wheels", description: "Industrial skateboard assembly detail under neutral studio light." },
  { id: "img-2", url: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop", title: "Blue Monolith", description: "Sleek, minimalist cobalt book cover casting soft side shadows." },
  { id: "img-3", url: "https://images.unsplash.com/photo-1608613304899-ea8098577e38?q=80&w=600&auto=format&fit=crop", title: "Chrome Faucet", description: "Brushed metal designer tap showing precise industrial contours." },
  { id: "img-4", url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=600&auto=format&fit=crop", title: "Tail Light", description: "Sleek red sports car aerodynamic wing and light cluster details." },
  { id: "img-5", url: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600&auto=format&fit=crop", title: "Juventus Identity", description: "Bold black and white graphic poster displaying clean contrast lines." },
  { id: "img-6", url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop", title: "Minimal Tee", description: "Clean organic t-shirt fabric draped over a deep black backdrop." },
  { id: "img-7", url: "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?q=80&w=600&auto=format&fit=crop", title: "Folder Layout", description: "Minimalist stationery card mockup casting clean geometric shadows." },
  { id: "img-8", url: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=600&auto=format&fit=crop", title: "Fern Textures", description: "Detailed texture of dark green fern fronds emerging in forest shade." },
  { id: "img-9", url: "https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=600&auto=format&fit=crop", title: "Cyber Coat", description: "Reflective iridescent fabric catching soft neon architectural highlights." },
  { id: "img-10", url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=600&auto=format&fit=crop", title: "Black Tee", description: "Premium heavy-cotton t-shirt presented on a warm neutral background." },
  { id: "img-11", url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop", title: "Onyx Pendant", description: "A solid silver circular chain setting containing structured dark details." },
  { id: "img-12", url: "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=600&auto=format&fit=crop", title: "Street Grid", description: "High-contrast urban map layout printing fine geometric paths." },
  { id: "img-15", url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop", title: "Gear System", description: "Complex interlocking metallic machinery under soft structural lighting." },
  { id: "img-16", url: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=600&auto=format&fit=crop", title: "Rear Suspension", description: "Heavy-duty damper assembly showing mechanical coil-over springs." },
];

// Memoized Image card to avoid inner tree re-renders during high-frequency animation cycles
const ImageCard = React.memo(({ url, title }: { url: string; title: string }) => (
  <div className="relative w-full h-full bg-zinc-100 dark:bg-zinc-950 group">
    <img
      src={url}
      alt={title}
      width={100}
      height={133}
      draggable={false}
      className="w-full h-full object-cover select-none"
    />
  </div>
));
ImageCard.displayName = "ImageCard";

export function SphereGallery({
  images = DEFAULT_IMAGES,
  autoRotate = true,
  className,
}: SphereGalleryProps) {
  // ===== React state (only triggers re-renders on discrete, rare events) =====
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ rx: 240, ry: 240, rz: 240 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Default velocities (increased for faster default motion)
  const DEFAULT_VELOCITY = { x: 0.0012, y: 0.0022 };

  // ===== All high-frequency animation state lives in refs (zero re-renders) =====
  const displayAngles = useRef({ x: 0.2, y: 0.5 });
  const targetAngles = useRef({ x: 0.2, y: 0.5 });
  const currentVelocity = useRef({ ...DEFAULT_VELOCITY });
  const targetVelocity = useRef({ ...DEFAULT_VELOCITY });

  // Interaction state
  const isDraggingRef = useRef(false);
  const isMouseInsideRef = useRef(false);
  const hoveredIdxRef = useRef<number | null>(null);
  const pointerStart = useRef({ x: 0, y: 0 });
  const anglesStart = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);

  // Synced copies of React state for RAF access (avoid stale closures, updated on every render)
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  const dimensionsRef = useRef(dimensions);
  dimensionsRef.current = dimensions;
  const reducedMotionRef = useRef(prefersReducedMotion);
  reducedMotionRef.current = prefersReducedMotion;
  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;

  // DOM refs
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRect = useRef({ left: 0, top: 0, width: 600, height: 450 });

  // Per-card interpolated state (managed entirely inside RAF loop)
  const cardState = useRef<Array<{ cx: number; cy: number; cs: number; co: number }>>([]);

  // Selection animation state machine
  const selAnim = useRef<{
    mode: "idle" | "selecting" | "selected" | "deselecting";
    selectedIdx: number;
    frameCount: number;
  }>({ mode: "idle", selectedIdx: -1, frameCount: 0 });

  // Initialize per-card state when images count change (lazy initialization in render body)
  if (cardState.current.length !== images.length) {
    cardState.current = images.map(() => ({ cx: 0, cy: 0, cs: 0, co: 0 }));
    cardRefs.current = new Array(images.length).fill(null);
  }

  // Unified resize, scroll, and responsive sizing handler (avoids layout thrashing)
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      containerRect.current = {
        left: rect.left + window.scrollX,
        top: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height,
      };

      const w = rect.width;
      const r = w < 450 ? 130 : w < 640 ? 180 : w < 1024 ? 230 : 285;
      setDimensions({ rx: r, ry: r, rz: r });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize);
    };
  }, []);

  // Monitor user preference for reduced motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const l = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", l);
    return () => mq.removeEventListener("change", l);
  }, []);

  // Compute base coordinates on a sphere (Fibonacci sphere algorithm)
  const basePoints = useMemo(() => {
    const N = images.length;
    return images.map((_, i) => {
      const y = 1 - (i / (N - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = 2.39996 * i;
      return {
        x: Math.cos(theta) * radiusAtY,
        y,
        z: Math.sin(theta) * radiusAtY,
      };
    });
  }, [images]);

  const basePointsRef = useRef(basePoints);
  basePointsRef.current = basePoints;

  // =====================================================================
  // MAIN RAF LOOP — all position math + DOM writes happen here.
  // =====================================================================
  useEffect(() => {
    let animId: number;

    const tick = () => {
      const dims = dimensionsRef.current;
      const bp = basePointsRef.current;
      const cs = cardState.current;
      const sel = selAnim.current;
      const reduced = reducedMotionRef.current;

      if (cs.length !== bp.length || cs.length === 0) {
        animId = requestAnimationFrame(tick);
        return;
      }

      // ── Phase 1: Update rotation angles ──────────────────────────
      const shouldRotate = sel.mode === "idle" || sel.mode === "deselecting";

      if (shouldRotate) {
        if (reduced) {
          displayAngles.current = { ...targetAngles.current };
        } else if (isDraggingRef.current) {
          // Snapper drag tracking (0.15 -> 0.20)
          displayAngles.current.x += (targetAngles.current.x - displayAngles.current.x) * 0.20;
          displayAngles.current.y += (targetAngles.current.y - displayAngles.current.y) * 0.20;
        } else {
          // Snappier velocity & position interpolation
          currentVelocity.current.x += (targetVelocity.current.x - currentVelocity.current.x) * 0.12;
          currentVelocity.current.y += (targetVelocity.current.y - currentVelocity.current.y) * 0.12;

          targetAngles.current.x += currentVelocity.current.x;
          targetAngles.current.y += currentVelocity.current.y;

          displayAngles.current.x += (targetAngles.current.x - displayAngles.current.x) * 0.15;
          displayAngles.current.y += (targetAngles.current.y - displayAngles.current.y) * 0.15;
        }
      }

      // ── Phase 2: Compute 3D→2D projection ────────────────────────
      const ax = displayAngles.current.x;
      const ay = displayAngles.current.y;
      const cosX = Math.cos(ax), sinX = Math.sin(ax);
      const cosY = Math.cos(ay), sinY = Math.sin(ay);
      const hovered = hoveredIdxRef.current;

      for (let i = 0; i < bp.length; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;

        const pt = bp[i];
        const x1 = pt.x * cosY - pt.z * sinY;
        const z1 = pt.x * sinY + pt.z * cosY;
        const y2 = pt.y * cosX - z1 * sinX;
        const z2 = pt.y * sinX + z1 * cosX;

        const rotX = x1 * dims.rx;
        const rotY = y2 * dims.ry;
        const isHovered = hovered === i && sel.mode === "idle";

        let rotScale = isHovered ? (0.55 + (z2 + 1) * 0.35) * 1.15 : 0.55 + (z2 + 1) * 0.35;
        let rotOpacity = isHovered ? 1.0 : 0.25 + (z2 + 1) * 0.385;
        const rotZ = Math.round((z2 + 1) * 20);

        // ── Phase 3: Determine targets based on animation mode ───
        const selected = sel.mode === "selecting" || sel.mode === "selected";
        const isCurrentSelected = i === sel.selectedIdx;

        const tX = selected ? (isCurrentSelected ? 0 : cs[i].cx) : rotX;
        const tY = selected ? (isCurrentSelected ? 0 : cs[i].cy) : rotY;
        const tS = selected ? (isCurrentSelected ? 2.0 : 0.2) : rotScale;
        const tO = selected ? (isCurrentSelected ? 1.0 : 0) : rotOpacity;
        const tZ = selected ? (isCurrentSelected ? 100 : 0) : (hovered === i ? 80 : rotZ);

        // ── Phase 4: Smooth exponential interpolation ────────────
        const idle = sel.mode === "idle";
        const posL = reduced ? 1.0 : (idle ? 1.0 : 0.22);
        const scaleL = reduced ? 1.0 : (idle ? 0.12 : 0.19);
        const opacityL = reduced ? 1.0 : (idle ? 0.15 : 0.19);

        cs[i].cx += (tX - cs[i].cx) * posL;
        cs[i].cy += (tY - cs[i].cy) * posL;
        cs[i].cs += (tS - cs[i].cs) * scaleL;
        cs[i].co += (tO - cs[i].co) * opacityL;

        // ── Phase 5: Apply to DOM (GPU-accelerated, no layout) ───
        el.style.transform = `translate3d(${cs[i].cx}px, ${cs[i].cy}px, 0) scale(${cs[i].cs})`;
        el.style.opacity = String(Math.max(0, cs[i].co));
        el.style.zIndex = String(tZ);

        // Visibility and pointer event toggling
        const isHidden = selected && !isCurrentSelected;
        el.style.visibility = isHidden && cs[i].co < 0.01 ? "hidden" : "visible";
        el.style.pointerEvents = isHidden ? "none" : "";
      }

      // ── Phase 6: Transition detection ─────────────────────────
      if (sel.mode === "selecting") {
        const sc = cs[sel.selectedIdx];
        if (sc && Math.abs(sc.cs - 2.0) < 0.05 && Math.abs(sc.cx) < 2 && Math.abs(sc.cy) < 2) {
          sel.mode = "selected";
        }
      }

      if (sel.mode === "deselecting") {
        sel.frameCount++;
        if (sel.frameCount > 24) {
          sel.mode = "idle";
          sel.selectedIdx = -1;
          sel.frameCount = 0;
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // ===== Selection handler =====
  const handleSelect = useCallback((id: string | null) => {
    if (id !== null) {
      const idx = images.findIndex(img => img.id === id);
      if (idx === -1) return;
      selAnim.current = { mode: "selecting", selectedIdx: idx, frameCount: 0 };
      setActiveId(id);
    } else {
      selAnim.current.mode = "deselecting";
      selAnim.current.frameCount = 0;
      cardRefs.current.forEach(el => {
        if (el) {
          el.style.visibility = "visible";
          el.style.pointerEvents = "";
        }
      });
      setActiveId(null);
    }
  }, [images]);

  // ===== Pointer handlers (only update refs, never trigger re-renders) =====
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (activeIdRef.current !== null || selAnim.current.mode !== "idle") return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    pointerStart.current = { x: e.clientX, y: e.clientY };
    anglesStart.current = { ...displayAngles.current };
    targetAngles.current = { ...displayAngles.current };
    targetVelocity.current = { x: 0, y: 0 };
    currentVelocity.current = { x: 0, y: 0 };
    if (containerRef.current) {
      containerRef.current.style.cursor = "grabbing";
      containerRef.current.releasePointerCapture(e.pointerId);
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (activeIdRef.current !== null || selAnim.current.mode !== "idle") return;

    if (isDraggingRef.current) {
      const dx = e.clientX - pointerStart.current.x;
      const dy = e.clientY - pointerStart.current.y;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        hasDraggedRef.current = true;
      }
      targetAngles.current = {
        x: anglesStart.current.x - dy * 0.0055,
        y: anglesStart.current.y + dx * 0.0055,
      };
    } else {
      isMouseInsideRef.current = true;
      const rect = containerRect.current;
      const clientLeft = rect.left - window.scrollX;
      const clientTop = rect.top - window.scrollY;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const maxVelocity = 0.035; // Increased max velocity response on hover
      targetVelocity.current = {
        x: -((e.clientY - clientTop - centerY) / centerY) * maxVelocity,
        y: ((e.clientX - clientLeft - centerX) / centerX) * maxVelocity,
      };
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    if (containerRef.current) {
      containerRef.current.style.cursor = activeIdRef.current ? "default" : "grab";
    }
    if (!isMouseInsideRef.current) {
      targetVelocity.current = autoRotateRef.current ? { ...DEFAULT_VELOCITY } : { x: 0, y: 0 };
    }
  }, []);

  const handlePointerLeave = useCallback(() => {
    isMouseInsideRef.current = false;
    if (!isDraggingRef.current) {
      targetVelocity.current = autoRotateRef.current ? { ...DEFAULT_VELOCITY } : { x: 0, y: 0 };
    }
  }, []);

  const selectedItem = useMemo(() => {
    return images.find((img) => img.id === activeId) || null;
  }, [images, activeId]);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      style={{ cursor: activeId ? "default" : "grab" }}
      className={cn(
        "relative w-full h-[490px] md:h-[540px] flex items-center justify-center overflow-hidden bg-transparent select-none touch-none",
        className
      )}
    >
      {/* Sphere Elements Canvas */}
      <div className="relative w-full h-full flex items-center justify-center">
        {images.map((item, idx) => (
          <button
            key={item.id}
            ref={(el) => { cardRefs.current[idx] = el; }}
            onClick={() => !hasDraggedRef.current && selAnim.current.mode === "idle" && handleSelect(item.id)}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && selAnim.current.mode === "idle") {
                e.preventDefault();
                handleSelect(item.id);
              }
            }}
            onMouseEnter={() => { if (!activeIdRef.current) hoveredIdxRef.current = idx; }}
            onMouseLeave={() => { if (!activeIdRef.current) hoveredIdxRef.current = null; }}
            aria-label={`View details of ${item.title}`}
            style={{ willChange: "transform, opacity" }}
            className={cn(
              "absolute w-[75px] h-[100px] sm:w-[100px] sm:h-[133px] rounded-[2px] overflow-hidden border border-zinc-200/40 dark:border-zinc-800/40 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 cursor-pointer bg-zinc-100 dark:bg-zinc-900 transition-colors duration-300",
              activeId === item.id
                ? "pointer-events-auto border-zinc-400 dark:border-zinc-500"
                : "pointer-events-auto hover:border-zinc-400 dark:hover:border-zinc-600"
            )}
          >
            <ImageCard url={item.url} title={item.title} />
          </button>
        ))}
      </div>

      {/* Presentation/Caption panels */}
      <AnimatePresence>
        {activeId && selectedItem && (
          <motion.button
            key="close-button"
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ type: "tween", ease: [0.8, -0.4, 0.2, 1.2] }}
            onClick={() => handleSelect(null)}
            className="absolute top-5 right-5 z-50 p-2.5 rounded-full bg-zinc-950/80 hover:bg-zinc-900/90 border border-white/10 text-white cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            aria-label="Close zoomed image"
          >
            <X size={18} />
          </motion.button>
        )}

        {activeId && selectedItem && (
          <motion.div
            key="caption-panel"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 290, damping: 25, delay: 0.05 }}
            className="absolute bottom-5 left-5 right-5 z-40 max-w-md bg-zinc-950/90 backdrop-blur-md p-5 rounded-[4px] border border-white/10 text-white shadow-2xl"
          >
            <h3 className="font-semibold text-xs tracking-widest uppercase text-white/90">{selectedItem.title}</h3>
            <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
              {selectedItem.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
