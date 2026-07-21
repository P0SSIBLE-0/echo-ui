"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, useMotionValue, useTransform, animate } from "motion/react";

interface TextCounterProps {
  children?: number | string;
  value?: number;
  from?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  motionType?: "spring" | "easeOut" | "bounce" | "linear";
  className?: string;
  as?: React.ElementType;
}

export default function TextCounter({
  children,
  value = 100,
  from = 0,
  duration = 2,
  decimals = 0,
  prefix = "",
  suffix = "",
  motionType = "spring",
  className = "text-4xl font-bold tracking-tight",
  as: Component = "span",
}: TextCounterProps) {
  const targetValue = useMemo(() => {
    if (typeof children === "number") return children;
    if (typeof children === "string" && !isNaN(parseFloat(children))) {
      return parseFloat(children);
    }
    return value;
  }, [children, value]);

  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) =>
    `${prefix}${latest.toFixed(decimals)}${suffix}`
  );

  const [displayValue, setDisplayValue] = useState(() =>
    `${prefix}${from.toFixed(decimals)}${suffix}`
  );

  useEffect(() => {
    let transitionConfig: any = { duration };
    if (motionType === "spring") {
      transitionConfig = { type: "spring", stiffness: 100, damping: 15 };
    } else if (motionType === "bounce") {
      transitionConfig = { type: "spring", bounce: 0.6, duration };
    } else if (motionType === "linear") {
      transitionConfig = { duration, ease: "linear" };
    } else {
      transitionConfig = { duration, ease: "easeOut" };
    }

    const controls = animate(count, targetValue, transitionConfig);
    return () => controls.stop();
  }, [targetValue, from, duration, motionType, count]);

  useEffect(() => {
    return rounded.on("change", (v) => setDisplayValue(v));
  }, [rounded]);

  const MotionComponent = useMemo(
    () => motion.create(Component as any),
    [Component]
  );

  return (
    <MotionComponent className={`inline-block select-none ${className}`}>
      {displayValue}
    </MotionComponent>
  );
}

export { TextCounter };
