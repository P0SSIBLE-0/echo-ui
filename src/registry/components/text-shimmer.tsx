"use client";

import React, { useMemo } from "react";
import { motion } from "motion/react";

interface TextShimmerProps {
  children?: string;
  as?: React.ElementType;
  className?: string;
  duration?: number;
  spread?: number;
  baseColor?: string;
  shimmerColor?: string;
}

export default function TextShimmer({
  children = "TEXT SHIMMER EFFECT",
  as: Component = "span",
  className = "text-xl font-bold tracking-wider",
  duration = 2,
  spread = 45,
  baseColor = "#000000",
  shimmerColor = "#c4c4c4",
}: TextShimmerProps) {
  const MotionComponent = useMemo(
    () => motion.create(Component as any),
    [Component]
  );

  const shimmerGradient = `linear-gradient(
    90deg,
    ${baseColor} 0%,
    ${baseColor} calc(50% - ${spread / 2}%),
    ${shimmerColor} 50%,
    ${baseColor} calc(50% + ${spread / 2}%),
    ${baseColor} 100%
  )`;

  return (
    <MotionComponent
      className={`inline-block bg-clip-text text-transparent select-none ${className}`}
      style={{
        backgroundImage: shimmerGradient,
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
      initial={{ backgroundPosition: "100% 0" }}
      animate={{ backgroundPosition: ["100% 0", "-100% 0"] }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      {children}
    </MotionComponent>
  );
}

export { TextShimmer };
