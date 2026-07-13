"use client";

import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "motion/react";

export type SphereImage = {
  id: string;
  url: string;
  title: string;
  description?: string;
};

export interface SphereGalleryProps {
  /** Images distributed around the sphere. */
  images?: SphereImage[];
  /** Toggle the automatic ambient rotation. */
  autoRotate?: boolean;
  /** Diameter of the sphere in pixels (it remains responsive below this width). */
  size?: number;
  /** Rotation speed in radians per millisecond. */
  rotationSpeed?: number;
  /** Animate the gallery in or out without unmounting it. */
  visible?: boolean;
  /** Called when an image is focused or the focus is dismissed. */
  onImageSelect?: (image: SphereImage | null) => void;
  className?: string;
}

const BASE_IMAGES: SphereImage[] = [
  {
    id: "alicia",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=85",
    title: "Alicia",
    description:
      "Senior UX Designer specializing in high-fidelity prototypes and spatial interface design systems.",
  },
  {
    id: "alicia1",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=85",
    title: "Alicia",
    description:
      "Senior UX Designer specializing in high-fidelity prototypes and spatial interface design systems.",
  },
  {
    id: "james",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=85",
    title: "James",
    description:
      "Lead Software Architect with a passion for web animations, performance optimization, and interactive experiences.",
  },
  {
    id: "maria",
    url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=85",
    title: "Maria",
    description:
      "Digital Artist and Creative Director exploring the intersection of generative geometry and human interaction.",
  },
  {
    id: "david",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=85",
    title: "David",
    description:
      "Visual Designer crafting modern brand identities, minimalist design guidelines, and typography.",
  },
  {
    id: "sara",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=85",
    title: "Sara",
    description:
      "Front-end Engineer focused on WebGL, motion library choreography, and accessibility standards.",
  },
  {
    id: "jordan",
    url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=85",
    title: "Jordan",
    description:
      "Product Manager driving user-centric products and seamless user onboarding flows.",
  },
  {
    id: "lina",
    url: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&q=85",
    title: "Lina",
    description:
      "Technical Artist with expertise in shader programming, particle systems, and 3D web graphics.",
  },
  {
    id: "sam",
    url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=85",
    title: "Sam",
    description:
      "Senior Product Engineer building clean, scalable developer tools and library APIs.",
  },
  {
    id: "noah",
    url: "https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&w=400&q=85",
    title: "Noah",
    description:
      "Interaction Designer pushing the limits of gesture interfaces, responsive grids, and typography.",
  },
  {
    id: "zoe",
    url: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=85",
    title: "Zoe",
    description:
      "Senior Copywriter crafting engaging product stories, brand voices, and micro-copy.",
  },
  {
    id: "alex",
    url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=85",
    title: "Alex",
    description:
      "Motion Designer specializing in fluid transitions, physical keyframe physics, and micro-interactions.",
  },
  {
    id: "maya",
    url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=85",
    title: "Maya",
    description:
      "Full-stack Developer passionate about real-time database syncing, WebSockets, and spatial layouts.",
  },
  {
    id: "leo",
    url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=85",
    title: "Leo",
    description:
      "UI Designer focused on design systems, token architecture, and high-fidelity mockups.",
  },
  {
    id: "nora",
    url: "https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?auto=format&fit=crop&w=400&q=85",
    title: "Nora",
    description:
      "UX Researcher gathering user insights, conducting surveys, and validating spatial layouts.",
  },
  {
    id: "amir",
    url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=85",
    title: "Amir",
    description:
      "Software Engineer working with React, Next.js, and web animation libraries.",
  },
  {
    id: "ivy",
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=85",
    title: "Ivy",
    description:
      "DevOps Engineer optimizing build pipelines, server side rendering, and global CDN delivery.",
  },
  {
    id: "kai",
    url: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&w=400&q=85",
    title: "Kai",
    description: "Brand strategist building narrative systems for spatial products.",
  },
  {
    id: "rina",
    url: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=85",
    title: "Rina",
    description: "Photographer capturing motion, light, and human detail.",
  },
  {
    id: "owen",
    url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=85",
    title: "Owen",
    description: "Creative technologist prototyping immersive web experiences.",
  },
  {
    id: "priya",
    url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=85",
    title: "Priya",
    description: "Product designer focused on clarity, craft, and calm interfaces.",
  },
  {
    id: "theo",
    url: "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=400&q=85",
    title: "Theo",
    description: "Systems engineer exploring real-time collaboration tools.",
  },
  {
    id: "hana",
    url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=85",
    title: "Hana",
    description: "Art director shaping visual identity for digital platforms.",
  },
  {
    id: "milo",
    url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=85",
    title: "Milo",
    description: "Frontend engineer specializing in canvas and WebGL scenes.",
  },
  {
    id: "elsa",
    url: "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=400&q=85",
    title: "Elsa",
    description: "Interaction researcher studying spatial navigation patterns.",
  },
];

const DEFAULT_IMAGES: SphereImage[] = [
  ...BASE_IMAGES,
  ...BASE_IMAGES.map((img) => ({ ...img, id: `${img.id}-2` })),
];

const LAYOUT_SPRING = {
  type: "spring",
  stiffness: 340,
  damping: 26,
} as const;

const FADE = { duration: 0.18, ease: [0.22, .9, 0.65, 1] as const };

const MODAL_SIZE = 260;
const CARD_RADIUS = 8;
const MODAL_RADIUS = 12;
const CARD_SHADOW =
  "0 0 0 1px rgba(255,255,255,0.22), 0 8px 22px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.4)";

type Point = { x: number; y: number; z: number };
type Placement = Point & { lon: number; lat: number };
type CardState = { opacity: number };
type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function createSpherePlacements(count: number): Placement[] {
  if (count === 0) return [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, index) => {
    const y = 1 - ((index + 0.5) / count) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const angle = goldenAngle * index;
    const x = Math.cos(angle) * ring;
    const z = Math.sin(angle) * ring;
    const lon = Math.atan2(x, z);
    const lat = -Math.asin(Math.max(-1, Math.min(1, y)));
    return { x, y, z, lon, lat };
  });
}

function hiResUrl(url: string) {
  return url
    .replace(/([?&])w=\d+/g, "$1w=900")
    .replace(/([?&])q=\d+/g, "$1q=90");
}

function measureRelative(el: HTMLElement, root: HTMLElement): Rect {
  const card = el.getBoundingClientRect();
  const host = root.getBoundingClientRect();
  return {
    top: card.top - host.top,
    left: card.left - host.left,
    width: card.width,
    height: card.height,
  };
}

function centeredRect(root: HTMLElement, width: number, height: number): Rect {
  return {
    top: (root.clientHeight - height) / 2,
    left: (root.clientWidth - width) / 2,
    width,
    height,
  };
}

export function SphereGallery({
  images = DEFAULT_IMAGES,
  autoRotate = true,
  size = 520,
  rotationSpeed = 0.00022,
  visible = true,
  onImageSelect,
  className,
}: SphereGalleryProps) {
  const titleId = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selected, setSelected] = useState<SphereImage | null>(null);
  const [origin, setOrigin] = useState<Rect | null>(null);
  const [target, setTarget] = useState<Rect | null>(null);
  const [isReady, setIsReady] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const sphereRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const radiusRef = useRef(size * 0.38);
  const rotationRef = useRef({ x: -0.28, y: 0.55 });
  const velocityRef = useRef({ x: 0.00002, y: rotationSpeed });
  const dragRef = useRef({ active: false, moved: false, x: 0, y: 0 });
  const hoverIndexRef = useRef<number | null>(null);
  const cardStateRef = useRef<CardState[]>([]);
  const activeIdRef = useRef<string | null>(null);
  const frozenIdRef = useRef<string | null>(null);
  const visibleRef = useRef(visible);
  const reducedMotionRef = useRef(false);
  const inViewRef = useRef(true);

  const placements = useMemo(
    () => createSpherePlacements(images.length),
    [images.length]
  );

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const updateRadius = () => {
      // Sphere radius relative to frame — dense wrap like the reference.
      radiusRef.current = Math.max(120, Math.min(root.clientWidth * 0.42, size * 0.44));
    };
    const resizeObserver = new ResizeObserver(updateRadius);
    resizeObserver.observe(root);
    updateRadius();

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => {
      reducedMotionRef.current = motionQuery.matches;
    };
    updateMotionPreference();
    motionQuery.addEventListener("change", updateMotionPreference);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
      },
      { threshold: 0.01 }
    );
    intersectionObserver.observe(root);

    return () => {
      resizeObserver.disconnect();
      motionQuery.removeEventListener("change", updateMotionPreference);
      intersectionObserver.disconnect();
    };
  }, [size]);

  useEffect(() => {
    let frameId = 0;
    let previousTime = performance.now();

    const animate = (time: number) => {
      const elapsed = Math.min(time - previousTime, 32);
      previousTime = time;

      if (
        inViewRef.current &&
        visibleRef.current &&
        document.visibilityState === "visible"
      ) {
        const reducedMotion = reducedMotionRef.current;
        const hasSelection = frozenIdRef.current !== null;
        const sphere = sphereRef.current;

        if (!reducedMotion && !dragRef.current.active && !hasSelection && autoRotate) {
          rotationRef.current.x += velocityRef.current.x * elapsed;
          rotationRef.current.y += velocityRef.current.y * elapsed;
        }

        const { x: angleX, y: angleY } = rotationRef.current;
        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);
        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);
        const radius = radiusRef.current;

        // Whole-sphere spin — cards stay surface-tangent via their own lon/lat.
        if (sphere) {
          sphere.style.transform = `rotateX(${angleX.toFixed(4)}rad) rotateY(${angleY.toFixed(4)}rad)`;
        }

        if (cardStateRef.current.length !== placements.length) {
          cardStateRef.current = placements.map(() => ({ opacity: 0 }));
        }

        placements.forEach((placement, index) => {
          const card = cardRefs.current[index];
          if (!card) return;

          const image = images[index];
          if (frozenIdRef.current === image?.id) {
            card.style.opacity = "0";
            card.style.pointerEvents = "none";
            return;
          }

          // World-space depth after sphere rotation (camera looks down +Z).
          const rotatedX = placement.x * cosY + placement.z * sinY;
          const rotatedZ = -placement.x * sinY + placement.z * cosY;
          const depth = placement.y * sinX + rotatedZ * cosX;
          // How much the outward normal faces the camera (1 = dead-on, 0 = limb).
          const facing = Math.max(0, depth);
          const isHovered = hoverIndexRef.current === index && !hasSelection;

          // Perspective handles foreshortening; only hover scales the tile.
          const scale = isHovered ? 1.1 : 1;
          const opacity = hasSelection
            ? 0.1 + facing * 0.12
            : 0.18 + facing * 0.82;

          const state = cardStateRef.current[index];
          const opacityInterpolation = reducedMotion ? 1 : 1 - Math.exp(-elapsed / 78);
          state.opacity += (opacity - state.opacity) * opacityInterpolation;

          // Surface-tangent: orient to outward normal, then push along local Z.
          // Centering uses CSS `translate: -50% -50%` so it won't skew 3D orientation.
          card.style.transform =
            `rotateY(${placement.lon}rad) rotateX(${placement.lat}rad) ` +
            `translateZ(${radius.toFixed(2)}px) scale(${scale.toFixed(3)})`;
          card.style.opacity = state.opacity.toFixed(3);
          card.style.zIndex = String(Math.round(depth * 100) + (isHovered ? 80 : 0));
          // Only front hemisphere is interactive (matches visible outer faces).
          card.style.pointerEvents = hasSelection || facing < 0.08 ? "none" : "auto";
        });
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [autoRotate, images, placements]);

  const openImage = useCallback(
    (image: SphereImage, index: number) => {
      // Block while open or while the close morph is still running.
      if (activeIdRef.current || frozenIdRef.current) return;
      const root = rootRef.current;
      const card = cardRefs.current[index];
      if (!root || !card) return;

      const rect = measureRelative(card, root);
      const modalSize = Math.min(MODAL_SIZE, root.clientWidth * 0.62);
      frozenIdRef.current = image.id;
      activeIdRef.current = image.id;
      setOrigin(rect);
      setTarget(centeredRect(root, modalSize, modalSize));
      setSelected(image);
      setActiveId(image.id);
      onImageSelect?.(image);
    },
    [onImageSelect]
  );

  const closeImage = useCallback(() => {
    if (!activeIdRef.current) return;
    activeIdRef.current = null;
    setActiveId(null);
    onImageSelect?.(null);
  }, [onImageSelect]);

  const handleModalRest = useCallback(() => {
    // After the close spring settles, restore the sphere card and clear modal state.
    if (activeIdRef.current) return;
    frozenIdRef.current = null;
    setSelected(null);
    setOrigin(null);
    setTarget(null);
  }, []);

  useEffect(() => {
    if (!activeId) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeImage();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeId, closeImage]);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (activeIdRef.current) return;
    dragRef.current = {
      active: true,
      moved: false,
      x: event.clientX,
      y: event.clientY,
    };
  }, []);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active || activeIdRef.current) return;

    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 4 && !drag.moved) {
      drag.moved = true;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture can fail on synthetic events; ignore.
      }
    }

    rotationRef.current.y += deltaX * 0.008;
    rotationRef.current.x -= deltaY * 0.008;
    drag.x = event.clientX;
    drag.y = event.clientY;
  }, []);

  const endDrag = useCallback(() => {
    dragRef.current.active = false;
  }, []);

  const rootClassName = [
    "relative isolate mx-auto aspect-square w-full max-w-[var(--sphere-size)] touch-none select-none bg-transparent",
    "transition-[opacity,transform,filter] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
    // Perspective projects edge tiles so they tilt with the sphere surface.
    "[perspective:1100px] [perspective-origin:50%_50%]",
    isReady && visible
      ? "translate-y-0 opacity-100 blur-0"
      : "pointer-events-none translate-y-6 opacity-0 blur-[2px]",
    activeId ? "cursor-default" : "cursor-grab active:cursor-grabbing",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const rootStyle = {
    "--sphere-size": `${size}px`,
  } as CSSProperties;

  // Keep the modal mounted through the close spring (selected stays until rest).
  const showModal = Boolean(selected && origin && target);
  const modalOpen = Boolean(activeId);

  return (
    <div
      ref={rootRef}
      className={rootClassName}
      style={rootStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
      aria-label="Interactive image sphere"
    >
      {/* 3D stage: parent spin + each tile tangent to the sphere */}
      <div
        ref={sphereRef}
        className="absolute inset-0 transform-3d"
      >
        {images.map((image, index) => (
          <button
            key={image.id}
            ref={(element) => {
              cardRefs.current[index] = element;
              // Seed once — rAF owns transform after this.
              if (element && element.dataset.seeded !== "1") {
                element.dataset.seeded = "1";
                const placement = placements[index];
                if (placement) {
                  element.style.transform =
                    `rotateY(${placement.lon}rad) rotateX(${placement.lat}rad) ` +
                    `translateZ(${radiusRef.current}px) scale(1)`;
                }
                element.style.opacity = "0";
              }
            }}
            type="button"
            aria-label={`Open ${image.title}`}
            className="absolute left-1/2 top-1/2 aspect-square w-[clamp(50px,13.5%,68px)] -translate-x-1/2 -translate-y-1/2 cursor-pointer overflow-hidden border border-white/25 bg-black p-0 outline-none duration-200 transform-3d backface-hidden will-change-[transform,opacity] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white"
            style={{
              borderRadius: CARD_RADIUS,
              // boxShadow: CARD_SHADOW,
              transformOrigin: "center center",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
            onPointerEnter={() => {
              hoverIndexRef.current = index;
            }}
            onPointerLeave={() => {
              hoverIndexRef.current = null;
            }}
            onClick={(event) => {
              event.stopPropagation();
              if (!dragRef.current.moved && !activeIdRef.current && !frozenIdRef.current) {
                openImage(image, index);
              }
            }}
          >
            <img
              className="pointer-events-none block h-full w-full object-cover"
              src={image.url}
              alt={image.title}
              draggable={false}
            />
          </button>
        ))}
      </div>

      {showModal && selected && origin && target ? (
        <div className="absolute inset-0 z-50" onClick={closeImage}>
          {/* Transparent hit-area only — no dim / blur / fill */}
          <div className="absolute inset-0 bg-transparent" aria-hidden="true" />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
            className="absolute z-10 overflow-hidden border border-white/25 bg-transparent"
            style={{ boxShadow: CARD_SHADOW }}
            initial={{
              top: origin.top,
              left: origin.left,
              width: origin.width,
              height: origin.height,
              borderRadius: CARD_RADIUS,
            }}
            animate={
              modalOpen
                ? {
                  top: target.top,
                  left: target.left,
                  width: target.width,
                  height: target.height,
                  borderRadius: MODAL_RADIUS,
                }
                : {
                  top: origin.top,
                  left: origin.left,
                  width: origin.width,
                  height: origin.height,
                  borderRadius: CARD_RADIUS,
                }
            }
            transition={LAYOUT_SPRING}
            onAnimationComplete={handleModalRest}
          >
            <img
              className="absolute inset-0 block h-full w-full object-cover"
              src={hiResUrl(selected.url)}
              alt={selected.title}
              draggable={false}
            />

            {/* Caption floats over the image — no solid/gradient panel */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: modalOpen ? 1 : 0,
                y: modalOpen ? 0 : 8,
              }}
              transition={{ ...FADE, delay: modalOpen ? 0.1 : 0 }}
              className="pointer-events-none absolute inset-x-0 bottom-0 px-3.5 pb-3.5 pt-10"
            >
              <h3
                id={titleId}
                className="text-[14px] font-semibold leading-tight tracking-tight text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.85)]"
              >
                {selected.title}
              </h3>
              {selected.description ? (
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-white/80 [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">
                  {selected.description}
                </p>
              ) : null}
            </motion.div>

            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{
                opacity: modalOpen ? 1 : 0,
                scale: modalOpen ? 1 : 0.9,
              }}
              transition={{ ...FADE, delay: modalOpen ? 0.01 : 0 }}
              onClick={closeImage}
              aria-label="Close image"
              className="absolute right-2 top-2 z-20 grid size-7 place-items-center rounded-full border border-white/30 bg-transparent text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.8)] transition-colors hover:border-white/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </motion.button>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}
