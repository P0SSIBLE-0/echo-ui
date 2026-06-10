"use client";

import React, { useState, useRef, useId } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

interface Project {
  id: number;
  video: string;
}

const PROJECTS: Project[] = [
  {
    id: 1,
    video: "https://www.pexels.com/download/video/35731104/",
  },
  {
    id: 2,
    video: "https://www.pexels.com/download/video/37182912/",
  },
  {
    id: 3,
    video: "https://www.pexels.com/download/video/28246853/",
  },
  {
    id: 4,
    video: "https://www.pexels.com/download/video/18702571/",
  },
  {
    id: 5,
    video: "https://www.pexels.com/download/video/6797319/",
  },
  {
    id: 6,
    video: "https://www.pexels.com/download/video/18069232/",
  },
  {
    id: 7,
    video: "https://www.pexels.com/download/video/37809285/",
  },
];

export function Portfolio() {
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const baseId = useId();

  // Mouse motion values for parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring settings for ultra-smooth movement
  const springConfig = { stiffness: 200, damping: 24 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.4, 0.5], [-5, 8]), springConfig);



  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setHoveredIndex(-1);
  };

  return (
    <div
      ref={containerRef}
      onMouseLeave={handleMouseLeave}
      className="relative w-full min-h-[580px] overflow-hidden flex items-center justify-center bg-black select-none py-12"
    >
      {/* Responsive scaled viewport to ensure fits all screens */}
      <div className="relative flex items-center justify-center scale-[0.65] sm:scale-75 md:scale-[0.85] lg:scale-100 xl:scale-110">
        {/* 3D perspective wrapper containing the arc */}
        <motion.div
          className="relative w-[350px] h-[220px]"
          onMouseLeave={() => setHoveredIndex(-1)}
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
        >
          {PROJECTS.map((project, index) => {
            const isHovered = hoveredIndex === index;
            const isAnyHovered = hoveredIndex !== -1;

            // Denser overlap spacing: base spacing of 98px
            let xOffset = (index - 3) * 98;

            // Push neighbors outward on hover for dynamic breathing room
            if (isAnyHovered) {
              if (index < hoveredIndex) {
                xOffset -= 85;
              } else if (index > hoveredIndex) {
                xOffset += 85;
              }
            }

            // Curve along Z: bow back away from camera for outer cards (negative translateZ)
            const distFromCenter = Math.abs(index - 3);
            const baseZ = -distFromCenter * 45;
            const zOffset = isAnyHovered
              ? baseZ - 130 - Math.abs(index - hoveredIndex) * 30
              : baseZ;

            // Rotation on Y to create the arc curvature (slanted to face right as in attached layout)
            const baseRotateY = -30 + (index - 3) * 2.5;
            const rotateYVal = isAnyHovered
              ? (index < hoveredIndex ? -51 : -39)
              : baseRotateY;

            // Slope along Y: downward slant from left to right, lift up by 32px on hover
            const baseY = (index - 3) * -20;
            const yOffset = isHovered ? baseY - 22 : baseY;

            // Opacity & scaling for focus
            const opacityVal = isHovered
              ? 1
              : isAnyHovered
                ? 1
                : 1;
            const scaleVal = isHovered ? 1 : 1;

            // Stack order (ensure left-to-right layering, hovered card on top)
            const zIndexVal = isHovered ? index : index;

            return (
              <motion.div
                key={`${baseId}-${index}`}
                onMouseEnter={() => setHoveredIndex(index)}
                className="absolute inset-0 shrink-0 rounded-[4px] overflow-hidden"
                style={{
                  width: 350,
                  height: 220,
                  zIndex: zIndexVal,
                  transformStyle: "preserve-3d",
                  willChange: "transform, opacity",
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.7)",
                }}
                animate={{
                  x: xOffset,
                  y: yOffset,
                  z: zOffset,
                  rotateY: rotateYVal,
                  scale: scaleVal,
                  opacity: opacityVal,
                }}
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 20,
                  mass: 0.9,
                }}
              >
                <div className="w-full h-full rounded-[5px] overflow-hidden">
                  <video
                    src={project.video}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover select-none pointer-events-none"
                  />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}


